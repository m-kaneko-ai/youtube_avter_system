"""
CTA管理エンドポイント

CTAテンプレートCRUD、動画割り当て、UTM設定、統計API
"""
from typing import Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id
from app.models.cta import CTAPlacement
from app.schemas.cta import (
    CTACreate, CTAUpdate, CTAResponse, CTAListResponse,
    VideoCTAAssignmentCreate, VideoCTAAssignmentResponse,
    UTMDefaultSettingsBase, UTMDefaultSettingsResponse,
    CTADetailStats, GeneratedDescriptionWithCTA
)
from app.services.cta_service import CTAService

router = APIRouter()


# ============================================================
# CTAテンプレートエンドポイント
# ============================================================

@router.get(
    "/",
    response_model=CTAListResponse,
    summary="CTA一覧取得",
    description="CTAテンプレートの一覧と統計情報を取得します。",
)
async def list_ctas(
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> CTAListResponse:
    """CTA一覧取得エンドポイント"""
    service = CTAService(db)
    return await service.get_cta_list()


@router.get(
    "/{cta_id}",
    response_model=CTAResponse,
    summary="CTA詳細取得",
    description="指定したCTAの詳細情報を取得します。",
)
async def get_cta(
    cta_id: str = Path(..., description="CTA ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> CTAResponse:
    """CTA詳細取得エンドポイント"""
    service = CTAService(db)
    cta = await service.get_cta(cta_id)
    if not cta:
        raise HTTPException(status_code=404, detail="CTA not found")
    return cta


@router.post(
    "/",
    response_model=CTAResponse,
    summary="CTA作成",
    description="新しいCTAテンプレートを作成します。",
)
async def create_cta(
    request: CTACreate,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> CTAResponse:
    """CTA作成エンドポイント"""
    service = CTAService(db)
    return await service.create_cta(request, current_user_id)


@router.put(
    "/{cta_id}",
    response_model=CTAResponse,
    summary="CTA更新",
    description="指定したCTAを更新します。",
)
async def update_cta(
    request: CTAUpdate,
    cta_id: str = Path(..., description="CTA ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> CTAResponse:
    """CTA更新エンドポイント"""
    service = CTAService(db)
    cta = await service.update_cta(cta_id, request)
    if not cta:
        raise HTTPException(status_code=404, detail="CTA not found")
    return cta


@router.delete(
    "/{cta_id}",
    summary="CTA削除",
    description="指定したCTAを削除します。",
)
async def delete_cta(
    cta_id: str = Path(..., description="CTA ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
    """CTA削除エンドポイント"""
    service = CTAService(db)
    success = await service.delete_cta(cta_id)
    if not success:
        raise HTTPException(status_code=404, detail="CTA not found")
    return {"success": True, "message": "CTA deleted successfully"}


@router.get(
    "/placement/{placement}",
    response_model=list[CTAResponse],
    summary="配置場所別CTA取得",
    description="指定した配置場所の有効なCTAを取得します。",
)
async def get_ctas_by_placement(
    placement: str = Path(..., description="配置場所（description_top, description_bottom, pinned_comment）"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> list[CTAResponse]:
    """配置場所別CTA取得エンドポイント"""
    try:
        placement_enum = CTAPlacement(placement)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid placement value")

    service = CTAService(db)
    return await service.get_active_ctas_by_placement(placement_enum)


# ============================================================
# 動画CTA割り当てエンドポイント
# ============================================================

@router.post(
    "/videos/assign",
    response_model=VideoCTAAssignmentResponse,
    summary="動画CTA割り当て",
    description="動画にCTAを割り当てます。",
)
async def assign_ctas_to_video(
    request: VideoCTAAssignmentCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> VideoCTAAssignmentResponse:
    """動画CTA割り当てエンドポイント"""
    service = CTAService(db)
    return await service.assign_ctas_to_video(request)


@router.get(
    "/videos/{video_id}/assignments",
    response_model=VideoCTAAssignmentResponse,
    summary="動画CTA割り当て取得",
    description="動画のCTA割り当て情報を取得します。",
)
async def get_video_cta_assignments(
    video_id: str = Path(..., description="動画ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> VideoCTAAssignmentResponse:
    """動画CTA割り当て取得エンドポイント"""
    service = CTAService(db)
    return await service.get_video_cta_assignments(video_id)


@router.post(
    "/videos/{video_id}/description",
    response_model=GeneratedDescriptionWithCTA,
    summary="CTA付き説明文生成",
    description="動画の説明文にCTAを挿入した結果を返します。",
)
async def generate_description_with_ctas(
    video_id: str = Path(..., description="動画ID"),
    description: str = Query(..., description="元の説明文"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> GeneratedDescriptionWithCTA:
    """CTA付き説明文生成エンドポイント"""
    service = CTAService(db)
    return await service.generate_description_with_ctas(description, video_id)


# ============================================================
# UTM設定エンドポイント
# ============================================================

@router.get(
    "/utm/settings",
    response_model=Optional[UTMDefaultSettingsResponse],
    summary="UTMデフォルト設定取得",
    description="UTMパラメータのデフォルト設定を取得します。",
)
async def get_utm_settings(
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> Optional[UTMDefaultSettingsResponse]:
    """UTMデフォルト設定取得エンドポイント"""
    service = CTAService(db)
    return await service.get_utm_settings()


@router.put(
    "/utm/settings",
    response_model=UTMDefaultSettingsResponse,
    summary="UTMデフォルト設定更新",
    description="UTMパラメータのデフォルト設定を更新します。",
)
async def update_utm_settings(
    request: UTMDefaultSettingsBase,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> UTMDefaultSettingsResponse:
    """UTMデフォルト設定更新エンドポイント"""
    service = CTAService(db)
    return await service.update_utm_settings(request)


# ============================================================
# 統計・トラッキングエンドポイント
# ============================================================

@router.get(
    "/{cta_id}/stats",
    response_model=CTADetailStats,
    summary="CTA統計取得",
    description="CTAの詳細統計（日別クリック数等）を取得します。",
)
async def get_cta_stats(
    cta_id: str = Path(..., description="CTA ID"),
    days: int = Query(30, ge=1, le=365, description="取得期間（日数）"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> CTADetailStats:
    """CTA統計取得エンドポイント"""
    service = CTAService(db)
    stats = await service.get_cta_stats(cta_id, days)
    if not stats:
        raise HTTPException(status_code=404, detail="CTA not found")
    return stats


@router.post(
    "/{cta_id}/click",
    summary="CTAクリック記録",
    description="CTAクリックイベントを記録します（トラッキング用）。",
)
async def record_cta_click(
    request: Request,
    cta_id: str = Path(..., description="CTA ID"),
    video_id: Optional[str] = Query(None, description="動画ID"),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """CTAクリック記録エンドポイント（認証不要）"""
    # リクエスト情報を取得
    client_host = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer")

    # クエリパラメータからUTMを抽出
    utm_params = {
        "source": request.query_params.get("utm_source"),
        "medium": request.query_params.get("utm_medium"),
        "campaign": request.query_params.get("utm_campaign"),
    }
    utm_params = {k: v for k, v in utm_params.items() if v}

    service = CTAService(db)
    success = await service.record_click(
        cta_id=cta_id,
        video_id=video_id,
        ip_address=client_host,
        user_agent=user_agent,
        referrer=referrer,
        utm_params=utm_params if utm_params else None
    )

    if not success:
        raise HTTPException(status_code=404, detail="CTA not found")

    return {"success": True, "message": "Click recorded"}
