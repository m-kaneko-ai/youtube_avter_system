"""
セキュリティモジュール

JWT認証とパスワードハッシュ化のユーティリティ
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

# パスワードハッシュ化コンテキスト
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    パスワードの検証

    Args:
        plain_password: 平文パスワード
        hashed_password: ハッシュ化されたパスワード

    Returns:
        bool: パスワードが一致する場合True
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    パスワードのハッシュ化

    Args:
        password: 平文パスワード

    Returns:
        str: ハッシュ化されたパスワード
    """
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    JWTアクセストークンの生成

    Args:
        data: トークンに埋め込むデータ
        expires_delta: 有効期限（デフォルト: 30分）

    Returns:
        str: JWTトークン
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    JWTトークンのデコード

    Args:
        token: JWTトークン

    Returns:
        Optional[Dict[str, Any]]: デコードされたペイロード、無効な場合はNone
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
