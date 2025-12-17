"""
YouTube OAuth認証エンドポイント

YouTube Analytics API用のOAuth認証フロー
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user_id
from app.services.external.youtube_oauth_service import youtube_oauth_service
from app.models.user import User

router = APIRouter()


# === Schemas ===


class YouTubeAuthUrlResponse(BaseModel):
    """YouTube OAuth認証URL応答"""

    auth_url: str
    state: str


class YouTubeAuthStatusResponse(BaseModel):
    """YouTube OAuth認証状態応答"""

    is_connected: bool
    channel_id: Optional[str] = None
    channel_title: Optional[str] = None
    subscriber_count: Optional[int] = None
    connected_at: Optional[str] = None


class YouTubeAuthCallbackResponse(BaseModel):
    """YouTube OAuthコールバック応答"""

    success: bool
    message: str
    channel_id: Optional[str] = None
    channel_title: Optional[str] = None


class YouTubeDisconnectResponse(BaseModel):
    """YouTube OAuth連携解除応答"""

    success: bool
    message: str


# === Endpoints ===


@router.get("/auth", response_model=YouTubeAuthUrlResponse)
async def get_youtube_auth_url(
    current_user_id: str = Depends(get_current_user_id),
) -> YouTubeAuthUrlResponse:
    """
    YouTube OAuth認証URLを取得

    Returns:
        YouTubeAuthUrlResponse: 認証URLとstate
    """
    if not youtube_oauth_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="YouTube OAuth is not configured",
        )

    # stateパラメータを生成（CSRF対策）
    import secrets

    state = secrets.token_urlsafe(32)

    # 認証URLを生成
    auth_url = youtube_oauth_service.get_auth_url(state=state)

    return YouTubeAuthUrlResponse(
        auth_url=auth_url,
        state=state,
    )


@router.get("/callback", response_model=YouTubeAuthCallbackResponse)
async def youtube_oauth_callback(
    code: str = Query(..., description="認可コード"),
    state: Optional[str] = Query(None, description="CSRF対策用state"),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
) -> YouTubeAuthCallbackResponse:
    """
    YouTube OAuthコールバック

    Args:
        code: 認可コード
        state: CSRF対策用state
        db: データベースセッション
        current_user_id: 現在のユーザーID

    Returns:
        YouTubeAuthCallbackResponse: コールバック結果
    """
    if not youtube_oauth_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="YouTube OAuth is not configured",
        )

    try:
        # 認可コードをアクセストークンに交換
        token_data = await youtube_oauth_service.exchange_code(code)

        # チャンネル情報を取得
        channel_info = await youtube_oauth_service.get_channel_info(
            token_data["access_token"]
        )

        if not channel_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get channel information",
            )

        # ユーザー情報を更新（トークンを保存）
        from sqlalchemy import select

        result = await db.execute(select(User).where(User.id == current_user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # YouTube認証情報を保存
        # NOTE: 実際の本番環境では、youtube_credentials テーブルに保存することを推奨
        # 今回はシンプルのためユーザーモデルに保存
        user.youtube_access_token = token_data["access_token"]
        user.youtube_refresh_token = token_data["refresh_token"]
        user.youtube_token_expires_at = token_data["expires_at"]
        user.youtube_channel_id = channel_info["channel_id"]

        await db.commit()

        return YouTubeAuthCallbackResponse(
            success=True,
            message="YouTube account connected successfully",
            channel_id=channel_info["channel_id"],
            channel_title=channel_info["title"],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete OAuth flow: {str(e)}",
        )


@router.get("/status", response_model=YouTubeAuthStatusResponse)
async def get_youtube_auth_status(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
) -> YouTubeAuthStatusResponse:
    """
    YouTube OAuth認証状態を確認

    Args:
        db: データベースセッション
        current_user_id: 現在のユーザーID

    Returns:
        YouTubeAuthStatusResponse: 認証状態
    """
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.id == current_user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # YouTube認証情報があるかチェック
    is_connected = bool(
        user.youtube_access_token
        and user.youtube_refresh_token
        and user.youtube_channel_id
    )

    if is_connected:
        # トークンの有効性を検証
        try:
            # 有効なトークンを取得（必要に応じてリフレッシュ）
            token_data = await youtube_oauth_service.get_valid_token(
                access_token=user.youtube_access_token,
                refresh_token=user.youtube_refresh_token,
                expires_at=user.youtube_token_expires_at or 0,
            )

            # リフレッシュされた場合はDBを更新
            if token_data["refreshed"]:
                user.youtube_access_token = token_data["access_token"]
                user.youtube_token_expires_at = token_data["expires_at"]
                await db.commit()

            # チャンネル情報を取得
            channel_info = await youtube_oauth_service.get_channel_info(
                token_data["access_token"]
            )

            return YouTubeAuthStatusResponse(
                is_connected=True,
                channel_id=user.youtube_channel_id,
                channel_title=channel_info.get("title") if channel_info else None,
                subscriber_count=channel_info.get("subscriber_count")
                if channel_info
                else None,
                connected_at=user.updated_at.isoformat() if user.updated_at else None,
            )

        except Exception:
            # トークンが無効な場合は未接続扱い
            return YouTubeAuthStatusResponse(is_connected=False)

    return YouTubeAuthStatusResponse(is_connected=False)


@router.post("/disconnect", response_model=YouTubeDisconnectResponse)
async def disconnect_youtube(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
) -> YouTubeDisconnectResponse:
    """
    YouTube OAuth連携を解除

    Args:
        db: データベースセッション
        current_user_id: 現在のユーザーID

    Returns:
        YouTubeDisconnectResponse: 解除結果
    """
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.id == current_user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # YouTube認証情報を削除
    user.youtube_access_token = None
    user.youtube_refresh_token = None
    user.youtube_token_expires_at = None
    user.youtube_channel_id = None

    await db.commit()

    return YouTubeDisconnectResponse(
        success=True,
        message="YouTube account disconnected successfully",
    )
