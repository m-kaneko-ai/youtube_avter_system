"""
認証サービス

Google OAuth認証、ユーザー作成/取得、トークン管理のビジネスロジック
"""
import logging
from datetime import timedelta
from typing import Optional, Dict, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import TokenResponse, UserResponse


logger = logging.getLogger("creator_studio")

# Redisクライアント（トークンブラックリスト用）
_redis_client = None


def get_redis_client():
    """Redisクライアントを取得（遅延初期化）"""
    global _redis_client
    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception:
            _redis_client = None
    return _redis_client


class AuthService:
    """認証サービスクラス"""

    @staticmethod
    async def verify_google_token(token: str) -> Dict[str, Any]:
        """
        GoogleのID tokenを検証（httpxで直接Google APIを呼び出し）

        Args:
            token: GoogleのID token

        Returns:
            Dict[str, Any]: 検証されたトークンのペイロード

        Raises:
            ValueError: トークンが無効な場合
        """
        try:
            # Google OAuth2 tokeninfo エンドポイントで検証
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": token}
                )

                if response.status_code != 200:
                    logger.error(f"Google token verification failed: {response.text}")
                    raise ValueError(f"Token verification failed: {response.status_code}")

                idinfo = response.json()

            # Client IDを確認
            if idinfo.get('aud') != settings.GOOGLE_CLIENT_ID:
                logger.error(f"Token audience mismatch: {idinfo.get('aud')} != {settings.GOOGLE_CLIENT_ID}")
                raise ValueError('Token was not issued for this application.')

            # 発行者を確認
            if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            # トークンの有効期限を確認
            import time
            if int(idinfo.get('exp', 0)) < time.time():
                raise ValueError('Token has expired.')

            logger.info(f"Google token verified for email: {idinfo.get('email')}")
            return idinfo

        except httpx.HTTPError as e:
            logger.error(f"HTTP error during token verification: {e}")
            raise ValueError(f"Token verification HTTP error: {str(e)}")
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise ValueError(f"Invalid ID token: {str(e)}")

    @staticmethod
    async def get_or_create_user(
        db: AsyncSession,
        google_id: str,
        email: str,
        name: str,
        avatar_url: Optional[str] = None
    ) -> User:
        """
        ユーザーを取得または作成

        Args:
            db: データベースセッション
            google_id: Google OAuth ID
            email: メールアドレス
            name: ユーザー名
            avatar_url: アバター画像URL

        Returns:
            User: ユーザーモデル
        """
        # 既存ユーザーを検索（google_idまたはemailで）
        result = await db.execute(
            select(User).where(
                (User.google_id == google_id) | (User.email == email)
            )
        )
        user = result.scalars().first()

        if user:
            # 既存ユーザーの情報を更新
            if user.google_id != google_id:
                user.google_id = google_id
            if user.name != name:
                user.name = name
            if avatar_url and user.avatar_url != avatar_url:
                user.avatar_url = avatar_url
            await db.commit()
            await db.refresh(user)
        else:
            # ユーザー数を確認して初回ユーザーかどうかを判定
            count_result = await db.execute(select(func.count()).select_from(User))
            user_count = count_result.scalar_one()

            # 最初のユーザーはOWNER、それ以外はTEAM
            role = UserRole.OWNER if user_count == 0 else UserRole.TEAM

            # 新規ユーザーを作成
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                avatar_url=avatar_url,
                role=role,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        return user

    @staticmethod
    def create_tokens(user_id: str, role: str, client_id: Optional[str] = None) -> Dict[str, Any]:
        """
        アクセストークンとリフレッシュトークンを生成

        Args:
            user_id: ユーザーID
            role: ユーザーロール
            client_id: クライアントID（オプション）

        Returns:
            Dict[str, Any]: トークン情報
        """
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=7)  # リフレッシュトークンは7日間有効

        # アクセストークンにはロールとクライアントIDを含める
        access_token_data = {
            "sub": user_id,
            "type": "access",
            "role": role,
        }
        if client_id:
            access_token_data["client_id"] = client_id

        access_token = create_access_token(
            data=access_token_data,
            expires_delta=access_token_expires
        )

        # リフレッシュトークンにはユーザーIDのみ
        refresh_token = create_access_token(
            data={"sub": user_id, "type": "refresh"},
            expires_delta=refresh_token_expires
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": int(access_token_expires.total_seconds())
        }

    @staticmethod
    async def authenticate_with_google(
        db: AsyncSession,
        id_token_str: str
    ) -> TokenResponse:
        """
        Google OAuth認証を実行

        Args:
            db: データベースセッション
            id_token_str: GoogleのID token

        Returns:
            TokenResponse: トークンとユーザー情報

        Raises:
            ValueError: 認証に失敗した場合
        """
        # ID tokenを検証
        idinfo = await AuthService.verify_google_token(id_token_str)

        # ユーザーを取得または作成
        user = await AuthService.get_or_create_user(
            db=db,
            google_id=idinfo['sub'],
            email=idinfo['email'],
            name=idinfo.get('name', idinfo['email']),
            avatar_url=idinfo.get('picture')
        )

        # クライアントIDを取得（存在する場合）
        client_id = None
        if hasattr(user, 'clients') and user.clients:
            client_id = str(user.clients[0].id)

        # トークンを生成（ロール情報を含める）
        tokens = AuthService.create_tokens(
            user_id=str(user.id),
            role=user.role.value,
            client_id=client_id
        )

        # レスポンスを構築
        return TokenResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type="bearer",
            expires_in=tokens["expires_in"],
            user=UserResponse.from_orm(user)
        )

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """
        ユーザーIDでユーザーを取得

        Args:
            db: データベースセッション
            user_id: ユーザーID

        Returns:
            Optional[User]: ユーザーモデル
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalars().first()

    @staticmethod
    async def refresh_access_token(
        db: AsyncSession,
        refresh_token: str
    ) -> Dict[str, Any]:
        """
        リフレッシュトークンから新しいアクセストークンを生成

        Args:
            db: データベースセッション
            refresh_token: リフレッシュトークン

        Returns:
            Dict[str, Any]: 新しいトークン情報

        Raises:
            ValueError: リフレッシュトークンが無効な場合
        """
        from app.core.security import decode_access_token

        # リフレッシュトークンをデコード
        payload = decode_access_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid refresh token payload")

        # ユーザーが存在するか確認
        user = await AuthService.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        # クライアントIDを取得（存在する場合）
        client_id = None
        if hasattr(user, 'clients') and user.clients:
            client_id = str(user.clients[0].id)

        # 新しいアクセストークンを生成（ロール情報を含める）
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token_data = {
            "sub": user_id,
            "type": "access",
            "role": user.role.value,
        }
        if client_id:
            access_token_data["client_id"] = client_id

        access_token = create_access_token(
            data=access_token_data,
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "expires_in": int(access_token_expires.total_seconds())
        }

    @staticmethod
    async def exchange_auth_code(
        db: AsyncSession,
        code: str,
        redirect_uri: str,
    ) -> TokenResponse:
        """
        認可コードをトークンと交換（サーバーサイドOAuth）

        Args:
            db: データベースセッション
            code: Google認可コード
            redirect_uri: リダイレクトURI

        Returns:
            TokenResponse: トークンとユーザー情報

        Raises:
            ValueError: トークン交換に失敗した場合
        """
        # Googleのトークンエンドポイントで認可コードを交換
        token_url = "https://oauth2.googleapis.com/token"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )

            if response.status_code != 200:
                raise ValueError(f"Token exchange failed: {response.text}")

            token_data = response.json()

        # ID tokenを検証
        google_id_token = token_data.get("id_token")
        if not google_id_token:
            raise ValueError("No ID token in response")

        # ID tokenを使って通常のフローを実行
        return await AuthService.authenticate_with_google(db, google_id_token)

    @staticmethod
    async def blacklist_token(token: str, expires_in: int) -> bool:
        """
        トークンをブラックリストに追加

        Args:
            token: ブラックリストに追加するトークン
            expires_in: トークンの残り有効期限（秒）

        Returns:
            bool: 成功した場合True
        """
        redis_client = get_redis_client()
        if redis_client is None:
            return False

        try:
            # トークンをブラックリストに追加（有効期限付き）
            key = f"blacklist:{token}"
            redis_client.setex(key, expires_in, "1")
            return True
        except Exception:
            return False

    @staticmethod
    async def is_token_blacklisted(token: str) -> bool:
        """
        トークンがブラックリストに含まれているか確認

        Args:
            token: 確認するトークン

        Returns:
            bool: ブラックリストに含まれている場合True
        """
        redis_client = get_redis_client()
        if redis_client is None:
            return False

        try:
            key = f"blacklist:{token}"
            return redis_client.exists(key) > 0
        except Exception:
            return False

    @staticmethod
    async def logout_user(access_token: str, refresh_token: Optional[str] = None) -> bool:
        """
        ユーザーをログアウト（トークンを無効化）

        Args:
            access_token: アクセストークン
            refresh_token: リフレッシュトークン（オプション）

        Returns:
            bool: 成功した場合True
        """
        from app.core.security import decode_access_token

        # アクセストークンをブラックリストに追加
        access_payload = decode_access_token(access_token)
        if access_payload:
            exp = access_payload.get("exp", 0)
            from datetime import datetime
            remaining = max(0, exp - int(datetime.utcnow().timestamp()))
            await AuthService.blacklist_token(access_token, remaining)

        # リフレッシュトークンもブラックリストに追加
        if refresh_token:
            refresh_payload = decode_access_token(refresh_token)
            if refresh_payload:
                exp = refresh_payload.get("exp", 0)
                from datetime import datetime
                remaining = max(0, exp - int(datetime.utcnow().timestamp()))
                await AuthService.blacklist_token(refresh_token, remaining)

        return True

    @staticmethod
    def get_google_auth_url(redirect_uri: str, state: Optional[str] = None) -> str:
        """
        Google OAuth認証URLを生成

        Args:
            redirect_uri: リダイレクトURI
            state: CSRF保護用のステート値

        Returns:
            str: Google OAuth認証URL
        """
        import urllib.parse

        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }

        if state:
            params["state"] = state

        query_string = urllib.parse.urlencode(params)
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
