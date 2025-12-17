"""
認証関連のPydanticスキーマ

Google OAuth認証、トークン管理、ユーザー情報のレスポンス
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class GoogleAuthRequest(BaseModel):
    """Google OAuth認証リクエスト（ID Token方式）"""
    id_token: str = Field(
        ...,
        description="GoogleのID Token",
        min_length=1
    )


class GoogleAuthCodeRequest(BaseModel):
    """Google OAuth認証リクエスト（認可コード方式）"""
    code: str = Field(
        ...,
        description="Google認可コード",
        min_length=1
    )
    redirect_uri: str = Field(
        ...,
        description="リダイレクトURI",
        min_length=1
    )
    state: Optional[str] = Field(
        None,
        description="CSRF保護用ステート値"
    )


class TokenResponse(BaseModel):
    """トークンレスポンス"""
    access_token: str = Field(..., description="JWTアクセストークン")
    refresh_token: str = Field(..., description="JWTリフレッシュトークン")
    token_type: str = Field(default="bearer", description="トークンタイプ")
    expires_in: int = Field(..., description="アクセストークン有効期限（秒）")
    user: "UserResponse" = Field(..., description="ユーザー情報")


class RefreshTokenRequest(BaseModel):
    """リフレッシュトークンリクエスト"""
    refresh_token: str = Field(..., description="リフレッシュトークン")


class RefreshTokenResponse(BaseModel):
    """リフレッシュトークンレスポンス"""
    access_token: str = Field(..., description="新しいJWTアクセストークン")
    token_type: str = Field(default="bearer", description="トークンタイプ")
    expires_in: int = Field(..., description="アクセストークン有効期限（秒）")


class UserResponse(BaseModel):
    """ユーザー情報レスポンス"""
    id: UUID = Field(..., description="ユーザーID（UUID）")
    email: EmailStr = Field(..., description="メールアドレス")
    name: str = Field(..., description="ユーザー名")
    role: UserRole = Field(..., description="ロール")
    avatar_url: Optional[str] = Field(None, description="アバター画像URL")
    created_at: datetime = Field(..., description="作成日時")

    class Config:
        from_attributes = True  # SQLAlchemy modelから変換可能にする


class LogoutRequest(BaseModel):
    """ログアウトリクエスト"""
    refresh_token: Optional[str] = Field(
        None,
        description="リフレッシュトークン（オプション）"
    )


class LogoutResponse(BaseModel):
    """ログアウトレスポンス"""
    message: str = Field(default="Successfully logged out", description="メッセージ")
    success: bool = Field(default=True, description="成功フラグ")


class GoogleAuthUrlResponse(BaseModel):
    """Google OAuth認証URL生成レスポンス"""
    auth_url: str = Field(..., description="Google OAuth認証URL")
    state: Optional[str] = Field(None, description="CSRF保護用ステート値")


# Forward reference resolution
TokenResponse.model_rebuild()
