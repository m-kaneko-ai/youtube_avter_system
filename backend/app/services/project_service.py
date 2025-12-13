"""
プロジェクト・動画管理サービス

プロジェクト・動画のCRUD操作とワークフロー管理のビジネスロジック
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.models import (
    Project,
    ProjectStatus,
    Video,
    VideoStatus,
    WorkflowStep,
    WorkflowStepName,
    WorkflowStepStatus,
)
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    VideoCreate,
    VideoUpdate,
    VideoApprovalRequest,
)


class ProjectService:
    """プロジェクト管理サービス"""

    @staticmethod
    async def create_project(
        db: AsyncSession,
        project_data: ProjectCreate
    ) -> Project:
        """
        プロジェクト作成

        Args:
            db: データベースセッション
            project_data: プロジェクト作成データ

        Returns:
            作成されたプロジェクト

        Raises:
            HTTPException: クライアントが存在しない場合
        """
        project = Project(
            client_id=project_data.client_id,
            knowledge_id=project_data.knowledge_id,
            name=project_data.name,
            description=project_data.description,
            status=ProjectStatus.PLANNING
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project

    @staticmethod
    async def get_projects(
        db: AsyncSession,
        page: int = 1,
        limit: int = 20,
        client_id: Optional[UUID] = None,
        status: Optional[ProjectStatus] = None
    ) -> tuple[list[Project], int]:
        """
        プロジェクト一覧取得

        Args:
            db: データベースセッション
            page: ページ番号（1始まり）
            limit: 1ページあたりの件数
            client_id: フィルタ用クライアントID
            status: フィルタ用ステータス

        Returns:
            (プロジェクトリスト, 総件数)のタプル
        """
        # ベースクエリ
        query = select(Project)

        # クライアントフィルタ
        if client_id:
            query = query.where(Project.client_id == client_id)

        # ステータスフィルタ
        if status:
            query = query.where(Project.status == status)

        # 総件数取得
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # ページネーション
        offset = (page - 1) * limit
        query = query.order_by(Project.created_at.desc()).offset(offset).limit(limit)

        # データ取得
        result = await db.execute(query)
        projects = result.scalars().all()

        return list(projects), total

    @staticmethod
    async def get_project_by_id(
        db: AsyncSession,
        project_id: UUID
    ) -> Optional[Project]:
        """
        プロジェクトをIDで取得

        Args:
            db: データベースセッション
            project_id: プロジェクトID

        Returns:
            プロジェクト（存在しない場合はNone）
        """
        query = select(Project).where(Project.id == project_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_project(
        db: AsyncSession,
        project_id: UUID,
        project_data: ProjectUpdate
    ) -> Optional[Project]:
        """
        プロジェクト更新

        Args:
            db: データベースセッション
            project_id: プロジェクトID
            project_data: 更新データ

        Returns:
            更新されたプロジェクト（存在しない場合はNone）
        """
        project = await ProjectService.get_project_by_id(db, project_id)
        if not project:
            return None

        # 更新
        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        await db.commit()
        await db.refresh(project)
        return project

    @staticmethod
    async def delete_project(
        db: AsyncSession,
        project_id: UUID
    ) -> bool:
        """
        プロジェクト削除

        Args:
            db: データベースセッション
            project_id: プロジェクトID

        Returns:
            削除成功したかどうか
        """
        project = await ProjectService.get_project_by_id(db, project_id)
        if not project:
            return False

        await db.delete(project)
        await db.commit()
        return True


class VideoService:
    """動画管理サービス"""

    @staticmethod
    async def create_video(
        db: AsyncSession,
        video_data: VideoCreate
    ) -> Video:
        """
        動画作成 + ワークフローステップ初期化

        Args:
            db: データベースセッション
            video_data: 動画作成データ

        Returns:
            作成された動画

        Raises:
            HTTPException: プロジェクトが存在しない場合
        """
        # 動画作成
        video = Video(
            project_id=video_data.project_id,
            title=video_data.title,
            script=video_data.script,
            video_metadata=video_data.video_metadata,
            status=VideoStatus.DRAFT
        )
        db.add(video)
        await db.flush()  # IDを確保

        # ワークフローステップ初期化（8ステップ）
        workflow_steps = [
            WorkflowStep(
                video_id=video.id,
                step_name=step_name,
                status=WorkflowStepStatus.PENDING
            )
            for step_name in WorkflowStepName
        ]
        db.add_all(workflow_steps)

        await db.commit()
        await db.refresh(video)
        return video

    @staticmethod
    async def get_video_by_id(
        db: AsyncSession,
        video_id: UUID,
        with_workflow: bool = False
    ) -> Optional[Video]:
        """
        動画をIDで取得

        Args:
            db: データベースセッション
            video_id: 動画ID
            with_workflow: ワークフローステップも取得するか

        Returns:
            動画（存在しない場合はNone）
        """
        query = select(Video).where(Video.id == video_id)

        if with_workflow:
            query = query.options(joinedload(Video.workflow_steps))

        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_video(
        db: AsyncSession,
        video_id: UUID,
        video_data: VideoUpdate
    ) -> Optional[Video]:
        """
        動画更新

        Args:
            db: データベースセッション
            video_id: 動画ID
            video_data: 更新データ

        Returns:
            更新された動画（存在しない場合はNone）
        """
        video = await VideoService.get_video_by_id(db, video_id)
        if not video:
            return None

        # 更新
        update_data = video_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(video, field, value)

        await db.commit()
        await db.refresh(video)
        return video

    @staticmethod
    async def approve_video(
        db: AsyncSession,
        video_id: UUID,
        approver_id: UUID,
        approval_data: VideoApprovalRequest
    ) -> Optional[Video]:
        """
        動画承認・却下処理

        Args:
            db: データベースセッション
            video_id: 動画ID
            approver_id: 承認者ID
            approval_data: 承認データ

        Returns:
            更新された動画（存在しない場合はNone）

        Raises:
            HTTPException: 動画が承認待ちでない場合
        """
        video = await VideoService.get_video_by_id(db, video_id, with_workflow=True)
        if not video:
            return None

        # ステータスチェック
        if video.status != VideoStatus.PENDING_APPROVAL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="動画が承認待ち状態ではありません"
            )

        # 承認・却下処理
        if approval_data.approved:
            video.status = VideoStatus.APPROVED
        else:
            video.status = VideoStatus.REJECTED

        # 現在のワークフローステップを更新
        # 最新の未完了ステップを承認/却下
        for step in video.workflow_steps:
            if step.status == WorkflowStepStatus.IN_PROGRESS:
                step.status = (
                    WorkflowStepStatus.COMPLETED if approval_data.approved
                    else WorkflowStepStatus.REJECTED
                )
                step.approver_id = approver_id
                step.approved_at = datetime.utcnow()
                step.comments = approval_data.comments
                break

        await db.commit()
        await db.refresh(video)
        return video

    @staticmethod
    async def get_videos_by_project(
        db: AsyncSession,
        project_id: UUID
    ) -> list[Video]:
        """
        プロジェクトに紐づく動画一覧取得

        Args:
            db: データベースセッション
            project_id: プロジェクトID

        Returns:
            動画リスト
        """
        query = select(Video).where(Video.project_id == project_id).order_by(Video.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())
