"""
コンテンツ複利戦略エンドポイント

コンテンツネットワーク分析、リンク提案、複利効果計測API
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Path, Query, Body, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id, get_current_user_role
from app.services.compound_strategy_service import CompoundStrategyService
from app.models.content_compound import LinkType
from pydantic import BaseModel, Field


# リクエスト/レスポンススキーマ
class ContentLinkCreate(BaseModel):
    """コンテンツリンク作成リクエスト"""
    source_video_id: UUID = Field(..., description="ソース動画ID")
    target_video_id: UUID = Field(..., description="ターゲット動画ID")
    link_type: LinkType = Field(..., description="リンクタイプ")
    position_seconds: Optional[int] = Field(None, description="挿入位置（秒）")


class ContentLinkResponse(BaseModel):
    """コンテンツリンクレスポンス"""
    id: UUID
    source_video_id: UUID
    target_video_id: UUID
    link_type: str
    position_seconds: Optional[int]
    click_count: int
    conversion_rate: float


class NetworkAnalysisResponse(BaseModel):
    """ネットワーク分析レスポンス"""
    nodes: list[dict]
    edges: list[dict]
    stats: dict


class LinkSuggestionResponse(BaseModel):
    """リンク提案レスポンス"""
    video_id: str
    title: str
    views: int
    retention: float
    engagement_rate: float
    score: float
    reason: str


class CompoundEffectResponse(BaseModel):
    """複利効果レスポンス"""
    total_referral_views: int
    total_referral_watch_time: float
    total_outbound_clicks: int
    avg_compound_score: float
    trend: list[dict]


class CrossPromotionPlanResponse(BaseModel):
    """クロスプロモーション計画レスポンス"""
    cluster_name: str
    total_videos: int
    strategy: str
    high_performer: Optional[dict]
    link_recommendations: list[dict]


router = APIRouter()


@router.get(
    "/network/{knowledge_id}",
    response_model=NetworkAnalysisResponse,
    summary="コンテンツネットワーク分析",
    description="ナレッジに紐づく動画のネットワーク構造を分析します。",
)
async def get_content_network(
    knowledge_id: UUID = Path(..., description="ナレッジID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
    """コンテンツネットワーク分析エンドポイント"""
    service = CompoundStrategyService()
    return await service.analyze_content_network(knowledge_id, db)


@router.get(
    "/suggestions/{video_id}",
    response_model=list[LinkSuggestionResponse],
    summary="リンク提案取得",
    description="指定した動画に最適なリンク先を提案します。",
)
async def get_link_suggestions(
    video_id: UUID = Path(..., description="動画ID"),
    limit: int = Query(5, ge=1, le=20, description="提案数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> list[dict]:
    """リンク提案取得エンドポイント"""
    service = CompoundStrategyService()
    return await service.suggest_optimal_links(video_id, db, limit)


@router.post(
    "/links",
    response_model=ContentLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="コンテンツリンク作成",
    description="動画間のコンテンツリンクを作成します。",
)
async def create_content_link(
    link_data: ContentLinkCreate = Body(...),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> ContentLinkResponse:
    """コンテンツリンク作成エンドポイント"""
    service = CompoundStrategyService()

    try:
        link = await service.create_content_link(
            source_video_id=link_data.source_video_id,
            target_video_id=link_data.target_video_id,
            link_type=link_data.link_type,
            position_seconds=link_data.position_seconds,
            db=db,
        )

        return ContentLinkResponse(
            id=link.id,
            source_video_id=link.source_video_id,
            target_video_id=link.target_video_id,
            link_type=link.link_type.value,
            position_seconds=link.position_seconds,
            click_count=link.click_count,
            conversion_rate=link.conversion_rate,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"コンテンツリンク作成エラー: {str(e)}",
        )


@router.get(
    "/metrics/{video_id}",
    response_model=CompoundEffectResponse,
    summary="複利効果メトリクス取得",
    description="指定した動画の複利効果を計算します。",
)
async def get_compound_metrics(
    video_id: UUID = Path(..., description="動画ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
    """複利効果メトリクス取得エンドポイント"""
    service = CompoundStrategyService()
    return await service.calculate_compound_effect(video_id, db)


@router.get(
    "/cross-promotion/{cluster_id}",
    response_model=CrossPromotionPlanResponse,
    summary="クロスプロモーション計画取得",
    description="クラスター内のクロスプロモーション計画を生成します。",
)
async def get_cross_promotion_plan(
    cluster_id: UUID = Path(..., description="クラスターID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
    """クロスプロモーション計画取得エンドポイント"""
    service = CompoundStrategyService()
    return await service.generate_cross_promotion_plan(cluster_id, db)


@router.get(
    "/clusters/{knowledge_id}",
    summary="クラスター一覧取得",
    description="ナレッジに紐づくコンテンツクラスターを取得します。",
)
async def get_clusters(
    knowledge_id: UUID = Path(..., description="ナレッジID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
) -> list[dict]:
    """クラスター一覧取得エンドポイント"""
    service = CompoundStrategyService()
    clusters = await service.get_clusters_by_knowledge(knowledge_id, db)

    return [
        {
            "id": str(cluster.id),
            "name": cluster.name,
            "description": cluster.description,
            "video_count": len(cluster.video_ids),
            "total_views": cluster.total_views,
            "avg_retention": cluster.avg_retention,
            "cluster_score": cluster.cluster_score,
        }
        for cluster in clusters
    ]
