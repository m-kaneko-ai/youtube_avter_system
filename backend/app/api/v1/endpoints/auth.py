"""
認証エンドポイント

Google OAuth認証、トークン管理、ユーザー情報取得のAPIエンドポイント
セキュリティ強化: JWTトークンはHttpOnly Cookieで管理
"""
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user_id
from app.services.auth_service import AuthService
from app.schemas.auth import (
    GoogleAuthRequest,
    GoogleAuthCodeRequest,
    TokenResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserResponse,
    LogoutRequest,
    LogoutResponse,
    GoogleAuthUrlResponse,
)

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Cookie設定定数
COOKIE_ACCESS_TOKEN_NAME = "access_token"
COOKIE_REFRESH_TOKEN_NAME = "refresh_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7日間
COOKIE_SECURE = not settings.debug  # 本番環境ではTrue
COOKIE_SAMESITE = "lax"  # CSRF保護


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: Optional[str] = None,
) -> None:
    """
    認証Cookieを設定する

    Args:
        response: FastAPIレスポンスオブジェクト
        access_token: アクセストークン
        refresh_token: リフレッシュトークン（オプション）
    """
    response.set_cookie(
        key=COOKIE_ACCESS_TOKEN_NAME,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )

    if refresh_token:
        response.set_cookie(
            key=COOKIE_REFRESH_TOKEN_NAME,
            value=refresh_token,
            max_age=COOKIE_MAX_AGE,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            path="/",
        )


def clear_auth_cookies(response: Response) -> None:
    """
    認証Cookieを削除する

    Args:
        response: FastAPIレスポンスオブジェクト
    """
    response.delete_cookie(
        key=COOKIE_ACCESS_TOKEN_NAME,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key=COOKIE_REFRESH_TOKEN_NAME,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )


@router.post("/google", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def google_auth(
    auth_request: GoogleAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Google OAuth認証

    GoogleのID tokenを検証し、ユーザーを作成/取得してJWTトークンを発行する
    トークンはHttpOnly Cookieに設定される（XSS対策）

    Args:
        auth_request: Google OAuth認証リクエスト
        response: FastAPIレスポンスオブジェクト
        db: データベースセッション

    Returns:
        TokenResponse: アクセストークン、リフレッシュトークン、ユーザー情報

    Raises:
        HTTPException: 認証に失敗した場合（401）
    """
    try:
        token_response = await AuthService.authenticate_with_google(
            db=db,
            id_token_str=auth_request.id_token
        )

        # HttpOnly CookieにJWTトークンを設定
        set_auth_cookies(
            response=response,
            access_token=token_response.access_token,
            refresh_token=token_response.refresh_token,
        )

        return token_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/refresh", response_model=RefreshTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    response: Response,
    refresh_request: Optional[RefreshTokenRequest] = None,
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db)
):
    """
    トークンリフレッシュ

    リフレッシュトークンを検証し、新しいアクセストークンを発行する
    リフレッシュトークンはCookieまたはリクエストボディから取得

    Args:
        response: FastAPIレスポンスオブジェクト
        refresh_request: リフレッシュトークンリクエスト（オプション）
        refresh_token_cookie: Cookieからのリフレッシュトークン
        db: データベースセッション

    Returns:
        RefreshTokenResponse: 新しいアクセストークン

    Raises:
        HTTPException: リフレッシュトークンが無効な場合（401）
    """
    # Cookieまたはリクエストボディからリフレッシュトークンを取得
    token = refresh_token_cookie
    if refresh_request and refresh_request.refresh_token:
        token = refresh_request.refresh_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not provided"
        )

    try:
        tokens = await AuthService.refresh_access_token(
            db=db,
            refresh_token=token
        )

        # 新しいアクセストークンをCookieに設定
        set_auth_cookies(
            response=response,
            access_token=tokens["access_token"],
        )

        return RefreshTokenResponse(
            access_token=tokens["access_token"],
            token_type="bearer",
            expires_in=tokens["expires_in"]
        )
    except ValueError as e:
        # リフレッシュトークンが無効な場合はCookieをクリア
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid refresh token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
    logout_request: Optional[LogoutRequest] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token_cookie: Optional[str] = Cookie(None, alias="access_token"),
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token"),
):
    """
    ログアウト

    アクセストークンとリフレッシュトークンをブラックリストに追加し、Cookieをクリア

    Args:
        response: FastAPIレスポンスオブジェクト
        logout_request: ログアウトリクエスト（リフレッシュトークン含む）
        credentials: 認証情報（オプション）
        access_token_cookie: Cookieからのアクセストークン
        refresh_token_cookie: Cookieからのリフレッシュトークン

    Returns:
        LogoutResponse: ログアウト成功メッセージ

    Note:
        Redisが利用可能な場合、トークンはブラックリストに追加されます。
    """
    # Cookieまたはヘッダーからトークンを取得
    access_token = access_token_cookie
    if credentials and credentials.credentials:
        access_token = credentials.credentials

    refresh_token = refresh_token_cookie
    if logout_request and logout_request.refresh_token:
        refresh_token = logout_request.refresh_token

    # トークンが存在する場合はブラックリストに追加
    if access_token or refresh_token:
        await AuthService.logout_user(access_token, refresh_token)

    # Cookieをクリア
    clear_auth_cookies(response)

    return LogoutResponse(
        message="Successfully logged out",
        success=True
    )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    現在のユーザー情報取得

    JWTトークンから現在のユーザー情報を取得する

    Args:
        db: データベースセッション
        current_user_id: 現在のユーザーID（依存性注入）

    Returns:
        UserResponse: ユーザー情報

    Raises:
        HTTPException: ユーザーが見つからない場合（404）
    """
    user = await AuthService.get_user_by_id(db, current_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.from_orm(user)


@router.post("/google/code", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def google_auth_code(
    auth_request: GoogleAuthCodeRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Google OAuth認証（認可コード方式）

    認可コードをサーバーサイドでトークンと交換し、JWTトークンを発行する
    トークンはHttpOnly Cookieに設定される（XSS対策）

    Args:
        auth_request: Google認可コードリクエスト
        response: FastAPIレスポンスオブジェクト
        db: データベースセッション

    Returns:
        TokenResponse: アクセストークン、リフレッシュトークン、ユーザー情報

    Raises:
        HTTPException: 認証に失敗した場合（401）

    Note:
        この方式はサーバーサイドOAuthフローで、より安全です。
        フロントエンドから認可コードを受け取り、バックエンドでGoogleと通信します。
    """
    try:
        token_response = await AuthService.exchange_auth_code(
            db=db,
            code=auth_request.code,
            redirect_uri=auth_request.redirect_uri,
        )

        # HttpOnly CookieにJWTトークンを設定
        set_auth_cookies(
            response=response,
            access_token=token_response.access_token,
            refresh_token=token_response.refresh_token,
        )

        return token_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/google/url", response_model=GoogleAuthUrlResponse, status_code=status.HTTP_200_OK)
async def get_google_auth_url(
    redirect_uri: str = Query(..., description="リダイレクトURI"),
    generate_state: bool = Query(True, description="ステート値を生成するか"),
):
    """
    Google OAuth認証URL生成

    Google認証ページにリダイレクトするためのURLを生成する

    Args:
        redirect_uri: 認証後のリダイレクトURI
        generate_state: CSRF保護用のステート値を生成するか

    Returns:
        GoogleAuthUrlResponse: 認証URLとステート値
    """
    state = secrets.token_urlsafe(32) if generate_state else None
    auth_url = AuthService.get_google_auth_url(redirect_uri, state)

    return GoogleAuthUrlResponse(
        auth_url=auth_url,
        state=state
    )
