"""
API依存性注入モジュール

FastAPIエンドポイントで使用する依存性注入ヘルパー
セキュリティ強化: Cookie/Headerの両方からトークン取得に対応
"""
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status, Cookie, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.config import settings

# HTTPベアラートークンスキーム（auto_error=Falseでオプショナルに）
security = HTTPBearer(auto_error=False)


async def get_token_from_request(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token_cookie: Optional[str] = Cookie(None, alias="access_token"),
) -> str:
    """
    リクエストからアクセストークンを取得

    優先順位:
    1. Authorization ヘッダー（Bearer トークン）
    2. access_token Cookie

    Args:
        request: FastAPIリクエストオブジェクト
        credentials: HTTPベアラー認証情報（オプション）
        access_token_cookie: Cookieからのアクセストークン

    Returns:
        str: アクセストークン

    Raises:
        HTTPException: トークンが見つからない場合
    """
    # Authorizationヘッダーを優先
    if credentials and credentials.credentials:
        return credentials.credentials

    # 次にCookieを確認
    if access_token_cookie:
        return access_token_cookie

    # トークンが見つからない
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証トークンが必要です",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user_id(
    token: str = Depends(get_token_from_request)
) -> str:
    """
    現在のユーザーIDを取得

    JWTトークンから認証済みユーザーのIDを取得する
    トークンはCookieまたはAuthorizationヘッダーから取得

    Args:
        token: アクセストークン（Cookie/Header自動取得）

    Returns:
        str: ユーザーID

    Raises:
        HTTPException: トークンが無効な場合
    """
    # トークンがブラックリストに含まれていないかチェック
    try:
        from app.services.auth_service import AuthService
        if await AuthService.is_token_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="トークンは無効化されています",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ImportError:
        pass  # インポートエラーの場合はスキップ

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効な認証トークンです",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="トークンにユーザーIDが含まれていません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def get_current_user_role(
    token: str = Depends(get_token_from_request)
) -> str:
    """
    現在のユーザーロールを取得

    JWTトークンから認証済みユーザーのロールを取得する
    トークンはCookieまたはAuthorizationヘッダーから取得

    Args:
        token: アクセストークン（Cookie/Header自動取得）

    Returns:
        str: ユーザーロール（Owner/Team/Client等）

    Raises:
        HTTPException: トークンが無効な場合
    """
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効な認証トークンです",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role: Optional[str] = payload.get("role")
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="トークンにロール情報が含まれていません",
        )

    return role


async def get_current_client_id(
    token: str = Depends(get_token_from_request)
) -> str:
    """
    現在のクライアントIDを取得

    JWTトークンから認証済みユーザーのクライアントIDを取得する
    トークンはCookieまたはAuthorizationヘッダーから取得

    Args:
        token: アクセストークン（Cookie/Header自動取得）

    Returns:
        str: クライアントID

    Raises:
        HTTPException: トークンが無効またはクライアントIDがない場合
    """
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効な認証トークンです",
            headers={"WWW-Authenticate": "Bearer"},
        )

    client_id: Optional[str] = payload.get("client_id")
    if client_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="トークンにクライアントID情報が含まれていません",
        )

    return client_id


def require_role(required_roles: list[str]):
    """
    ロールベースアクセス制御のデコレータファクトリー

    Args:
        required_roles: 必要なロールのリスト

    Returns:
        依存性注入関数
    """
    async def role_checker(
        role: str = Depends(get_current_user_role)
    ) -> str:
        if role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"このリソースへのアクセスには {', '.join(required_roles)} ロールが必要です",
            )
        return role

    return role_checker


# ===== 開発モード用の認証バイパス =====
async def get_current_user_role_dev(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token_cookie: Optional[str] = Cookie(None, alias="access_token"),
    x_dev_bypass: Optional[str] = Header(None, alias="X-Dev-Bypass"),
) -> str:
    """
    開発モード用のロール取得（バイパス可能）

    開発モード（NODE_ENV=development）で、X-Dev-Bypass: true ヘッダーが
    設定されている場合、認証をバイパスしてOwnerロールを返す。

    Args:
        request: FastAPIリクエストオブジェクト
        credentials: HTTPベアラー認証情報（オプション）
        access_token_cookie: Cookieからのアクセストークン
        x_dev_bypass: 開発バイパスヘッダー

    Returns:
        str: ユーザーロール
    """
    # 開発モードでバイパスヘッダーがある場合
    if settings.debug and x_dev_bypass == "true":
        return "owner"

    # 通常の認証フロー（トークンを取得してロール取得）
    token = await get_token_from_request(request, credentials, access_token_cookie)
    return await get_current_user_role(token)


# エクスポート用エイリアス
get_db_session = get_db
