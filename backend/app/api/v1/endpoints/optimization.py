"""
Optimization API Endpoints

YouTubeアルゴリズム最適化のAPI
- リテンション分析
- A/Bテスト管理
- 最適投稿時間分析
- 終了画面管理
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.optimization import (
    RetentionCurve,
    RetentionEvent,
    ABTest,
    ABTestVariant,
    PostingTimeAnalysis,
    PostingScheduleRecommendation,
    EndScreen,
    EndScreenElement,
    EndScreenTemplate,
    ABTestStatus as ABTestStatusModel,
    ABTestType as ABTestTypeModel,
    RetentionEventType as RetentionEventTypeModel,
    EndScreenElementType as EndScreenElementTypeModel,
    EndScreenPosition as EndScreenPositionModel,
)
from app.schemas.optimization import (
    RetentionCurveCreate,
    RetentionCurveResponse,
    RetentionAnalysisRequest,
    RetentionAnalysisResponse,
    RetentionEventResponse,
    ABTestCreate,
    ABTestUpdate,
    ABTestResponse,
    ABTestListResponse,
    ABTestResultResponse,
    ABTestVariantUpdate,
    PostingTimeAnalysisCreate,
    PostingTimeAnalysisResponse,
    PostingScheduleRecommendationCreate,
    PostingScheduleRecommendationResponse,
    EndScreenCreate,
    EndScreenUpdate,
    EndScreenResponse,
    EndScreenElementCreate,
    EndScreenElementUpdate,
    EndScreenElementResponse,
    EndScreenTemplateCreate,
    EndScreenTemplateUpdate,
    EndScreenTemplateResponse,
    EndScreenTemplateListResponse,
    OptimizationSummary,
)

router = APIRouter()


# ============================================================
# Retention Endpoints
# ============================================================

@router.post("/retention", response_model=RetentionCurveResponse)
async def create_retention_curve(
    request: RetentionCurveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """リテンション曲線を作成"""
    # データポイントを辞書のリストに変換
    data_points = [dp.model_dump() for dp in request.data_points]

    # フック/中盤/終盤のリテンション率を計算
    hook_retention = None
    mid_retention = None
    end_retention = None

    if data_points:
        total_points = len(data_points)
        hook_points = [dp["retention_rate"] for dp in data_points[:max(1, total_points // 10)]]
        mid_points = [dp["retention_rate"] for dp in data_points[total_points // 3:2 * total_points // 3]]
        end_points = [dp["retention_rate"] for dp in data_points[-max(1, total_points // 10):]]

        hook_retention = sum(hook_points) / len(hook_points) if hook_points else None
        mid_retention = sum(mid_points) / len(mid_points) if mid_points else None
        end_retention = sum(end_points) / len(end_points) if end_points else None

    # 平均視聴率を計算
    avg_view_percentage = None
    if data_points:
        avg_view_percentage = sum(dp["retention_rate"] for dp in data_points) / len(data_points)

    curve = RetentionCurve(
        video_id=request.video_id,
        knowledge_id=request.knowledge_id,
        data_points=data_points,
        avg_view_percentage=avg_view_percentage,
        hook_retention=hook_retention,
        mid_retention=mid_retention,
        end_retention=end_retention,
        video_length_seconds=request.video_length_seconds,
        sample_size=request.sample_size,
    )

    db.add(curve)
    await db.commit()
    await db.refresh(curve)

    return curve


@router.get("/retention/{video_id}", response_model=RetentionCurveResponse)
async def get_retention_curve(
    video_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """動画のリテンション曲線を取得"""
    result = await db.execute(
        select(RetentionCurve)
        .options(selectinload(RetentionCurve.events))
        .where(RetentionCurve.video_id == video_id)
        .order_by(RetentionCurve.recorded_at.desc())
    )
    curve = result.scalar_one_or_none()

    if not curve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="リテンション曲線が見つかりません",
        )

    return curve


@router.post("/retention/analyze", response_model=RetentionAnalysisResponse)
async def analyze_retention(
    request: RetentionAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """リテンションを分析"""
    result = await db.execute(
        select(RetentionCurve)
        .options(selectinload(RetentionCurve.events))
        .where(RetentionCurve.video_id == request.video_id)
        .order_by(RetentionCurve.recorded_at.desc())
    )
    curve = result.scalar_one_or_none()

    if not curve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="リテンション曲線が見つかりません",
        )

    # 離脱ポイントを特定
    drop_points = [e for e in curve.events if e.event_type == RetentionEventTypeModel.DROP]

    # 推奨事項を生成
    recommendations = []
    if curve.hook_retention and curve.hook_retention < 70:
        recommendations.append("フック（冒頭30秒）の改善が必要です。より強いオープニングを検討してください。")
    if curve.mid_retention and curve.mid_retention < 50:
        recommendations.append("中盤でのエンゲージメント維持に課題があります。ストーリー構成を見直してください。")
    if curve.end_retention and curve.end_retention < 30:
        recommendations.append("終盤の離脱が多いです。CTAのタイミングを早めることを検討してください。")

    # スコア計算
    overall_score = (
        (curve.hook_retention or 50) * 0.4 +
        (curve.mid_retention or 50) * 0.35 +
        (curve.end_retention or 50) * 0.25
    )

    return RetentionAnalysisResponse(
        curve=curve,
        drop_points=drop_points,
        recommendations=recommendations,
        overall_score=overall_score,
        comparison_to_average=curve.benchmark_comparison or 0,
    )


# ============================================================
# A/B Test Endpoints
# ============================================================

@router.post("/abtest", response_model=ABTestResponse)
async def create_ab_test(
    request: ABTestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A/Bテストを作成"""
    ab_test = ABTest(
        video_id=request.video_id,
        knowledge_id=request.knowledge_id,
        created_by=current_user.id,
        name=request.name,
        description=request.description,
        test_type=ABTestTypeModel(request.test_type.value),
        status=ABTestStatusModel.DRAFT,
        duration_hours=request.duration_hours,
        traffic_split=request.traffic_split,
        min_sample_size=request.min_sample_size,
        confidence_level=request.confidence_level,
    )

    db.add(ab_test)
    await db.flush()

    # バリアントを作成
    for variant_data in request.variants:
        variant = ABTestVariant(
            ab_test_id=ab_test.id,
            variant_name=variant_data.variant_name,
            is_control=variant_data.is_control,
            content=variant_data.content,
            image_url=variant_data.image_url,
            image_data=variant_data.image_data,
        )
        db.add(variant)

    await db.commit()
    await db.refresh(ab_test)

    # バリアントを含めて再取得
    result = await db.execute(
        select(ABTest)
        .options(selectinload(ABTest.variants))
        .where(ABTest.id == ab_test.id)
    )
    ab_test = result.scalar_one()

    return ab_test


@router.get("/abtest", response_model=ABTestListResponse)
async def list_ab_tests(
    video_id: Optional[UUID] = None,
    knowledge_id: Optional[UUID] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A/Bテスト一覧を取得"""
    query = select(ABTest).options(selectinload(ABTest.variants))

    if video_id:
        query = query.where(ABTest.video_id == video_id)
    if knowledge_id:
        query = query.where(ABTest.knowledge_id == knowledge_id)
    if status:
        query = query.where(ABTest.status == ABTestStatusModel(status))

    # カウント
    count_query = select(func.count(ABTest.id))
    if video_id:
        count_query = count_query.where(ABTest.video_id == video_id)
    if knowledge_id:
        count_query = count_query.where(ABTest.knowledge_id == knowledge_id)
    if status:
        count_query = count_query.where(ABTest.status == ABTestStatusModel(status))

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = query.order_by(ABTest.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    tests = result.scalars().all()

    return ABTestListResponse(tests=tests, total=total)


@router.get("/abtest/{test_id}", response_model=ABTestResponse)
async def get_ab_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A/Bテストを取得"""
    result = await db.execute(
        select(ABTest)
        .options(selectinload(ABTest.variants))
        .where(ABTest.id == test_id)
    )
    ab_test = result.scalar_one_or_none()

    if not ab_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A/Bテストが見つかりません",
        )

    return ab_test


@router.put("/abtest/{test_id}", response_model=ABTestResponse)
async def update_ab_test(
    test_id: UUID,
    request: ABTestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A/Bテストを更新"""
    result = await db.execute(
        select(ABTest)
        .options(selectinload(ABTest.variants))
        .where(ABTest.id == test_id)
    )
    ab_test = result.scalar_one_or_none()

    if not ab_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A/Bテストが見つかりません",
        )

    if request.name is not None:
        ab_test.name = request.name
    if request.description is not None:
        ab_test.description = request.description
    if request.status is not None:
        ab_test.status = ABTestStatusModel(request.status.value)
        if request.status.value == "running" and not ab_test.started_at:
            ab_test.started_at = datetime.utcnow()
        elif request.status.value in ["completed", "cancelled"]:
            ab_test.ended_at = datetime.utcnow()
    if request.duration_hours is not None:
        ab_test.duration_hours = request.duration_hours
    if request.traffic_split is not None:
        ab_test.traffic_split = request.traffic_split

    await db.commit()
    await db.refresh(ab_test)

    return ab_test


@router.post("/abtest/{test_id}/start", response_model=ABTestResponse)
async def start_ab_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A/Bテストを開始"""
    result = await db.execute(
        select(ABTest)
        .options(selectinload(ABTest.variants))
        .where(ABTest.id == test_id)
    )
    ab_test = result.scalar_one_or_none()

    if not ab_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A/Bテストが見つかりません",
        )

    if ab_test.status != ABTestStatusModel.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="下書き状態のテストのみ開始できます",
        )

    ab_test.status = ABTestStatusModel.RUNNING
    ab_test.started_at = datetime.utcnow()

    await db.commit()
    await db.refresh(ab_test)

    return ab_test


@router.post("/abtest/{test_id}/complete", response_model=ABTestResultResponse)
async def complete_ab_test(
    test_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A/Bテストを完了し結果を取得"""
    result = await db.execute(
        select(ABTest)
        .options(selectinload(ABTest.variants))
        .where(ABTest.id == test_id)
    )
    ab_test = result.scalar_one_or_none()

    if not ab_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A/Bテストが見つかりません",
        )

    ab_test.status = ABTestStatusModel.COMPLETED
    ab_test.ended_at = datetime.utcnow()

    # 勝者を決定（CTRが高い方）
    winner = None
    max_ctr = -1
    for variant in ab_test.variants:
        if variant.ctr and variant.ctr > max_ctr:
            max_ctr = variant.ctr
            winner = variant

    if winner:
        ab_test.winner_variant = winner.variant_name
        ab_test.statistical_significance = 0.95  # 簡易実装

    await db.commit()
    await db.refresh(ab_test)

    recommendation = "テストデータが不十分です"
    if winner:
        recommendation = f"バリアント{winner.variant_name}が優位です。CTR: {winner.ctr:.2f}%"

    return ABTestResultResponse(
        test=ab_test,
        winner=winner,
        statistical_significance=ab_test.statistical_significance or 0,
        confidence_interval={"lower": 0.90, "upper": 0.99},
        recommendation=recommendation,
    )


# ============================================================
# Posting Time Endpoints
# ============================================================

@router.post("/posting-time", response_model=PostingTimeAnalysisResponse)
async def create_posting_time_analysis(
    request: PostingTimeAnalysisCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """最適投稿時間分析を作成"""
    # モックの推奨時間（実際はパフォーマンスデータから計算）
    analysis = PostingTimeAnalysis(
        knowledge_id=request.knowledge_id,
        video_type=request.video_type,
        analysis_period_days=request.analysis_period_days,
        sample_size=0,
        optimal_day_of_week=3,  # 木曜日
        optimal_hour=19,  # 19時
        optimal_minute=0,
        day_performance=[
            {"day": i, "avg_views": 1000 + i * 100, "avg_ctr": 5.0 + i * 0.5, "sample_count": 10}
            for i in range(7)
        ],
        hour_performance=[
            {"hour": i, "avg_views": 500 + i * 50, "avg_ctr": 3.0 + i * 0.2, "sample_count": 10}
            for i in range(24)
        ],
        recommended_slots=[
            {"day": 3, "hour": 19, "score": 95.0, "reasoning": "最もエンゲージメントが高い時間帯"},
            {"day": 5, "hour": 20, "score": 90.0, "reasoning": "週末前の高エンゲージメント"},
            {"day": 0, "hour": 18, "score": 85.0, "reasoning": "週始めの安定したリーチ"},
        ],
        confidence_score=0.85,
    )

    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    return analysis


@router.get("/posting-time/{knowledge_id}", response_model=PostingTimeAnalysisResponse)
async def get_posting_time_analysis(
    knowledge_id: UUID,
    video_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """最適投稿時間分析を取得"""
    query = select(PostingTimeAnalysis).where(
        PostingTimeAnalysis.knowledge_id == knowledge_id
    )
    if video_type:
        query = query.where(PostingTimeAnalysis.video_type == video_type)

    query = query.order_by(PostingTimeAnalysis.analyzed_at.desc())

    result = await db.execute(query)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析が見つかりません",
        )

    return analysis


# ============================================================
# End Screen Endpoints
# ============================================================

@router.post("/end-screen", response_model=EndScreenResponse)
async def create_end_screen(
    request: EndScreenCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """終了画面を作成"""
    end_screen = EndScreen(
        video_id=request.video_id,
        knowledge_id=request.knowledge_id,
        start_time_seconds=request.start_time_seconds,
        duration_seconds=request.duration_seconds,
        background_type=request.background_type,
        background_color=request.background_color,
        background_image_url=request.background_image_url,
    )

    db.add(end_screen)
    await db.flush()

    # 要素を作成
    for elem_data in request.elements:
        element = EndScreenElement(
            end_screen_id=end_screen.id,
            element_type=EndScreenElementTypeModel(elem_data.element_type.value),
            position=EndScreenPositionModel(elem_data.position.value),
            position_x=elem_data.position_x,
            position_y=elem_data.position_y,
            width=elem_data.width,
            height=elem_data.height,
            start_offset_seconds=elem_data.start_offset_seconds,
            duration_seconds=elem_data.duration_seconds,
            target_video_id=elem_data.target_video_id,
            target_playlist_id=elem_data.target_playlist_id,
            target_url=elem_data.target_url,
            custom_message=elem_data.custom_message,
            display_text=elem_data.display_text,
            thumbnail_url=elem_data.thumbnail_url,
            display_order=elem_data.display_order,
        )
        db.add(element)

    await db.commit()
    await db.refresh(end_screen)

    # 要素を含めて再取得
    result = await db.execute(
        select(EndScreen)
        .options(selectinload(EndScreen.elements))
        .where(EndScreen.id == end_screen.id)
    )
    end_screen = result.scalar_one()

    return end_screen


@router.get("/end-screen/{video_id}", response_model=EndScreenResponse)
async def get_end_screen(
    video_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """終了画面を取得"""
    result = await db.execute(
        select(EndScreen)
        .options(selectinload(EndScreen.elements))
        .where(EndScreen.video_id == video_id)
        .where(EndScreen.is_active == True)
    )
    end_screen = result.scalar_one_or_none()

    if not end_screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="終了画面が見つかりません",
        )

    return end_screen


@router.put("/end-screen/{end_screen_id}", response_model=EndScreenResponse)
async def update_end_screen(
    end_screen_id: UUID,
    request: EndScreenUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """終了画面を更新"""
    result = await db.execute(
        select(EndScreen)
        .options(selectinload(EndScreen.elements))
        .where(EndScreen.id == end_screen_id)
    )
    end_screen = result.scalar_one_or_none()

    if not end_screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="終了画面が見つかりません",
        )

    if request.start_time_seconds is not None:
        end_screen.start_time_seconds = request.start_time_seconds
    if request.duration_seconds is not None:
        end_screen.duration_seconds = request.duration_seconds
    if request.background_type is not None:
        end_screen.background_type = request.background_type
    if request.background_color is not None:
        end_screen.background_color = request.background_color
    if request.background_image_url is not None:
        end_screen.background_image_url = request.background_image_url
    if request.is_active is not None:
        end_screen.is_active = request.is_active

    await db.commit()
    await db.refresh(end_screen)

    return end_screen


# ============================================================
# End Screen Template Endpoints
# ============================================================

@router.get("/end-screen-templates", response_model=EndScreenTemplateListResponse)
async def list_end_screen_templates(
    knowledge_id: Optional[UUID] = None,
    video_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """終了画面テンプレート一覧を取得"""
    query = select(EndScreenTemplate).where(EndScreenTemplate.is_active == True)

    if knowledge_id:
        query = query.where(EndScreenTemplate.knowledge_id == knowledge_id)
    if video_type:
        query = query.where(EndScreenTemplate.video_type == video_type)

    # カウント
    count_query = select(func.count(EndScreenTemplate.id)).where(EndScreenTemplate.is_active == True)
    if knowledge_id:
        count_query = count_query.where(EndScreenTemplate.knowledge_id == knowledge_id)
    if video_type:
        count_query = count_query.where(EndScreenTemplate.video_type == video_type)

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = query.order_by(EndScreenTemplate.usage_count.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    templates = result.scalars().all()

    return EndScreenTemplateListResponse(templates=templates, total=total)


@router.post("/end-screen-templates", response_model=EndScreenTemplateResponse)
async def create_end_screen_template(
    request: EndScreenTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """終了画面テンプレートを作成"""
    template = EndScreenTemplate(
        knowledge_id=request.knowledge_id,
        created_by=current_user.id,
        name=request.name,
        description=request.description,
        video_type=request.video_type,
        layout=request.layout,
        element_configs=request.element_configs,
        tags=request.tags,
    )

    db.add(template)
    await db.commit()
    await db.refresh(template)

    return template


# ============================================================
# Summary Endpoint
# ============================================================

@router.get("/summary", response_model=OptimizationSummary)
async def get_optimization_summary(
    knowledge_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """最適化サマリーを取得"""
    # A/Bテスト数
    ab_query = select(func.count(ABTest.id))
    if knowledge_id:
        ab_query = ab_query.where(ABTest.knowledge_id == knowledge_id)
    ab_result = await db.execute(ab_query)
    total_ab_tests = ab_result.scalar() or 0

    active_ab_query = select(func.count(ABTest.id)).where(ABTest.status == ABTestStatusModel.RUNNING)
    if knowledge_id:
        active_ab_query = active_ab_query.where(ABTest.knowledge_id == knowledge_id)
    active_result = await db.execute(active_ab_query)
    active_ab_tests = active_result.scalar() or 0

    completed_ab_query = select(func.count(ABTest.id)).where(ABTest.status == ABTestStatusModel.COMPLETED)
    if knowledge_id:
        completed_ab_query = completed_ab_query.where(ABTest.knowledge_id == knowledge_id)
    completed_result = await db.execute(completed_ab_query)
    completed_ab_tests = completed_result.scalar() or 0

    # 終了画面数
    es_query = select(func.count(EndScreen.id))
    if knowledge_id:
        es_query = es_query.where(EndScreen.knowledge_id == knowledge_id)
    es_result = await db.execute(es_query)
    total_end_screens = es_result.scalar() or 0

    # 投稿時間分析数
    pt_query = select(func.count(PostingTimeAnalysis.id))
    if knowledge_id:
        pt_query = pt_query.where(PostingTimeAnalysis.knowledge_id == knowledge_id)
    pt_result = await db.execute(pt_query)
    posting_time_analyses = pt_result.scalar() or 0

    return OptimizationSummary(
        total_ab_tests=total_ab_tests,
        active_ab_tests=active_ab_tests,
        completed_ab_tests=completed_ab_tests,
        avg_ctr_improvement=None,
        total_end_screens=total_end_screens,
        avg_end_screen_ctr=None,
        posting_time_analyses=posting_time_analyses,
        avg_posting_accuracy=None,
    )
