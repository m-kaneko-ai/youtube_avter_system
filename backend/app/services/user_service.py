"""
ユーザーサービス

ユーザー管理のビジネスロジック
"""
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """ユーザー管理サービス"""

    @staticmethod
    async def create_user(
        db: AsyncSession,
        user_data: UserCreate,
        current_user_role: str,
    ) -> User:
        """
        ユーザーを作成

        Args:
            db: データベースセッション
            user_data: ユーザー作成データ
            current_user_role: 実行者のロール

        Returns:
            User: 作成されたユーザー

        Raises:
            HTTPException: 権限不足、重複エラー
        """
        # 権限チェック（Owner/Teamのみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ユーザー作成にはOwnerまたはTeamロールが必要です",
            )

        # メールアドレス重複チェック
        existing_user = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このメールアドレスは既に使用されています",
            )

        # ユーザー作成
        new_user = User(
            email=user_data.email,
            name=user_data.name,
            role=user_data.role,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return new_user

    @staticmethod
    async def get_users(
        db: AsyncSession,
        current_user_role: str,
        page: int = 1,
        limit: int = 20,
        role_filter: Optional[str] = None,
    ) -> tuple[list[User], int]:
        """
        ユーザー一覧を取得

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            page: ページ番号
            limit: 1ページあたりの件数
            role_filter: ロールフィルタ

        Returns:
            tuple[list[User], int]: (ユーザーリスト, 総件数)

        Raises:
            HTTPException: 権限不足
        """
        # 権限チェック（Owner/Teamのみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ユーザー一覧取得にはOwnerまたはTeamロールが必要です",
            )

        # クエリ構築
        query = select(User)
        if role_filter:
            query = query.where(User.role == role_filter)

        # 総件数取得
        count_query = select(func.count()).select_from(User)
        if role_filter:
            count_query = count_query.where(User.role == role_filter)
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # ページネーション
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit).order_by(User.created_at.desc())

        # データ取得
        result = await db.execute(query)
        users = result.scalars().all()

        return list(users), total

    @staticmethod
    async def get_user_by_id(
        db: AsyncSession,
        user_id: UUID,
        current_user_id: str,
        current_user_role: str,
    ) -> User:
        """
        ユーザー詳細を取得

        Args:
            db: データベースセッション
            user_id: ユーザーID
            current_user_id: 実行者のユーザーID
            current_user_role: 実行者のロール

        Returns:
            User: ユーザー情報

        Raises:
            HTTPException: 権限不足、ユーザー未存在
        """
        # ユーザー取得
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません",
            )

        # 権限チェック（Owner/Team/本人のみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            if str(user.id) != current_user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="他のユーザーの情報を閲覧する権限がありません",
                )

        return user

    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: UUID,
        user_data: UserUpdate,
        current_user_id: str,
        current_user_role: str,
    ) -> User:
        """
        ユーザー情報を更新

        Args:
            db: データベースセッション
            user_id: ユーザーID
            user_data: 更新データ
            current_user_id: 実行者のユーザーID
            current_user_role: 実行者のロール

        Returns:
            User: 更新されたユーザー

        Raises:
            HTTPException: 権限不足、ユーザー未存在
        """
        # ユーザー取得
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません",
            )

        # 権限チェック（Owner/Team/本人のみ実行可能）
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            if str(user.id) != current_user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="他のユーザーの情報を更新する権限がありません",
                )

        # ロール変更チェック（Ownerのみ可能）
        if user_data.role is not None and user_data.role != user.role:
            if current_user_role != UserRole.OWNER.value:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="ロール変更にはOwnerロールが必要です",
                )

        # 更新処理
        update_dict = user_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(user, key, value)

        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def delete_user(
        db: AsyncSession,
        user_id: UUID,
        current_user_role: str,
    ) -> User:
        """
        ユーザーを削除（論理削除）

        Args:
            db: データベースセッション
            user_id: ユーザーID
            current_user_role: 実行者のロール

        Returns:
            User: 削除されたユーザー

        Raises:
            HTTPException: 権限不足、ユーザー未存在
        """
        # 権限チェック（Ownerのみ実行可能）
        if current_user_role != UserRole.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ユーザー削除にはOwnerロールが必要です",
            )

        # ユーザー取得
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません",
            )

        # 論理削除（実装は物理削除）
        # 今後、deleted_atフィールド追加による論理削除に移行可能
        await db.delete(user)
        await db.commit()

        return user
