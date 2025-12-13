"""
動画管理エンドポイント

動画の承認フロー管理APIエンドポイント
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id
from app.schemas.project import VideoApprovalRequest, VideoApprovalResponse
from app.services.project_service import VideoService

router = APIRouter()


@router.post(
    "/{video_id}/approve",
    response_model=VideoApprovalResponse,
    summary="動画承認・却下",
    description="動画を承認または却下します。承認待ち状態の動画のみ実行可能です。",
)
async def approve_video(
    video_id: UUID,
    approval_data: VideoApprovalRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> VideoApprovalResponse:
    """
    動画承認・却下エンドポイント

    Args:
        video_id: 動画ID
        approval_data: 承認データ
        db: データベースセッション
        current_user_id: 実行者のユーザーID

    Returns:
        VideoApprovalResponse: 承認結果

    Raises:
        HTTPException: 動画が存在しない、または承認待ち状態でない場合
    """
    # current_user_idをUUIDに変換
    from uuid import UUID as UUIDType
    approver_id = UUIDType(current_user_id)

    video = await VideoService.approve_video(db, video_id, approver_id, approval_data)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"動画（ID: {video_id}）が見つかりません"
        )

    # レスポンス作成
    from datetime import datetime
    return VideoApprovalResponse(
        video_id=video.id,
        status=video.status,
        approved_at=datetime.utcnow(),
        approver_id=approver_id,
        comments=approval_data.comments,
    )
