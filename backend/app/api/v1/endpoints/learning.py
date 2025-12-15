"""
パフォーマンス学習APIエンドポイント

動画パフォーマンスの記録、分析、インサイト生成
"""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.learning import (
    PerformanceRecord,
    LearningInsight,
    SuccessPattern,
    Recommendation,
    LearningHistory,
    PerformanceLevel,
    LearningCategory,
    InsightType,
)
from app.schemas.learning import (
    PerformanceRecordCreate,
    PerformanceRecordUpdate,
    PerformanceRecordResponse,
    PerformanceRecordListResponse,
    LearningInsightCreate,
    LearningInsightResponse,
    LearningInsightListResponse,
    SuccessPatternCreate,
    SuccessPatternResponse,
    SuccessPatternListResponse,
    RecommendationCreate,
    RecommendationResponse,
    RecommendationListResponse,
    LearningSummary,
    LearningTrendsResponse,
    LearningTrend,
    LearningAnalysisRequest,
    LearningAnalysisResponse,
)

router = APIRouter()


# ============================================================
# Performance Record Endpoints
# ============================================================

@router.get("/records", response_model=PerformanceRecordListResponse)
async def get_performance_records(
    knowledge_id: Optional[str] = Query(None, description="ナレッジIDでフィルタ"),
    project_id: Optional[str] = Query(None, description="プロジェクトIDでフィルタ"),
    performance_level: Optional[str] = Query(None, description="パフォーマンスレベルでフィルタ"),
    video_type: Optional[str] = Query(None, description="動画タイプでフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """パフォーマンス記録一覧を取得"""
    query = select(PerformanceRecord)

    if knowledge_id:
        query = query.where(PerformanceRecord.knowledge_id == UUID(knowledge_id))
    if project_id:
        query = query.where(PerformanceRecord.project_id == UUID(project_id))
    if performance_level:
        query = query.where(PerformanceRecord.performance_level == performance_level)
    if video_type:
        query = query.where(PerformanceRecord.video_type == video_type)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(PerformanceRecord.recorded_at.desc())
    result = await db.execute(query)
    records = result.scalars().all()

    return PerformanceRecordListResponse(
        records=[
            PerformanceRecordResponse(
                id=str(r.id),
                video_id=str(r.video_id),
                project_id=str(r.project_id) if r.project_id else None,
                knowledge_id=str(r.knowledge_id) if r.knowledge_id else None,
                video_type=r.video_type,
                published_at=r.published_at,
                views=r.views,
                likes=r.likes,
                dislikes=r.dislikes,
                comments=r.comments,
                shares=r.shares,
                subscribers_gained=r.subscribers_gained,
                subscribers_lost=r.subscribers_lost,
                watch_time_minutes=r.watch_time_minutes,
                avg_view_duration_seconds=r.avg_view_duration_seconds,
                avg_view_percentage=r.avg_view_percentage,
                impressions=r.impressions,
                ctr=r.ctr,
                title_length=r.title_length,
                has_number_in_title=r.has_number_in_title,
                has_question_in_title=r.has_question_in_title,
                has_emoji_in_title=r.has_emoji_in_title,
                video_length_seconds=r.video_length_seconds,
                publish_day_of_week=r.publish_day_of_week,
                publish_hour=r.publish_hour,
                tags=r.tags,
                category=r.category,
                extra_attributes=r.extra_attributes,
                recorded_at=r.recorded_at,
                performance_level=r.performance_level,
                performance_score=r.performance_score,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in records
        ],
        total=total,
    )


@router.post("/records", response_model=PerformanceRecordResponse)
async def create_performance_record(
    data: PerformanceRecordCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """パフォーマンス記録を作成"""
    record = PerformanceRecord(
        video_id=UUID(data.video_id),
        project_id=UUID(data.project_id) if data.project_id else None,
        knowledge_id=UUID(data.knowledge_id) if data.knowledge_id else None,
        video_type=data.video_type,
        published_at=data.published_at,
        views=data.views,
        likes=data.likes,
        dislikes=data.dislikes,
        comments=data.comments,
        shares=data.shares,
        subscribers_gained=data.subscribers_gained,
        subscribers_lost=data.subscribers_lost,
        watch_time_minutes=data.watch_time_minutes,
        avg_view_duration_seconds=data.avg_view_duration_seconds,
        avg_view_percentage=data.avg_view_percentage,
        impressions=data.impressions,
        ctr=data.ctr,
        title_length=data.title_length,
        has_number_in_title=data.has_number_in_title,
        has_question_in_title=data.has_question_in_title,
        has_emoji_in_title=data.has_emoji_in_title,
        video_length_seconds=data.video_length_seconds,
        publish_day_of_week=data.publish_day_of_week,
        publish_hour=data.publish_hour,
        tags=data.tags,
        category=data.category,
        extra_attributes=data.extra_attributes,
        performance_level=PerformanceLevel.AVERAGE,
    )

    # Calculate performance score and level
    record.performance_score = _calculate_performance_score(record)
    record.performance_level = _determine_performance_level(record.performance_score)

    db.add(record)
    await db.commit()
    await db.refresh(record)

    return PerformanceRecordResponse(
        id=str(record.id),
        video_id=str(record.video_id),
        project_id=str(record.project_id) if record.project_id else None,
        knowledge_id=str(record.knowledge_id) if record.knowledge_id else None,
        video_type=record.video_type,
        published_at=record.published_at,
        views=record.views,
        likes=record.likes,
        dislikes=record.dislikes,
        comments=record.comments,
        shares=record.shares,
        subscribers_gained=record.subscribers_gained,
        subscribers_lost=record.subscribers_lost,
        watch_time_minutes=record.watch_time_minutes,
        avg_view_duration_seconds=record.avg_view_duration_seconds,
        avg_view_percentage=record.avg_view_percentage,
        impressions=record.impressions,
        ctr=record.ctr,
        title_length=record.title_length,
        has_number_in_title=record.has_number_in_title,
        has_question_in_title=record.has_question_in_title,
        has_emoji_in_title=record.has_emoji_in_title,
        video_length_seconds=record.video_length_seconds,
        publish_day_of_week=record.publish_day_of_week,
        publish_hour=record.publish_hour,
        tags=record.tags,
        category=record.category,
        extra_attributes=record.extra_attributes,
        recorded_at=record.recorded_at,
        performance_level=record.performance_level,
        performance_score=record.performance_score,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.get("/records/{record_id}", response_model=PerformanceRecordResponse)
async def get_performance_record(
    record_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """パフォーマンス記録を取得"""
    result = await db.execute(
        select(PerformanceRecord).where(PerformanceRecord.id == UUID(record_id))
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="記録が見つかりません")

    return PerformanceRecordResponse(
        id=str(record.id),
        video_id=str(record.video_id),
        project_id=str(record.project_id) if record.project_id else None,
        knowledge_id=str(record.knowledge_id) if record.knowledge_id else None,
        video_type=record.video_type,
        published_at=record.published_at,
        views=record.views,
        likes=record.likes,
        dislikes=record.dislikes,
        comments=record.comments,
        shares=record.shares,
        subscribers_gained=record.subscribers_gained,
        subscribers_lost=record.subscribers_lost,
        watch_time_minutes=record.watch_time_minutes,
        avg_view_duration_seconds=record.avg_view_duration_seconds,
        avg_view_percentage=record.avg_view_percentage,
        impressions=record.impressions,
        ctr=record.ctr,
        title_length=record.title_length,
        has_number_in_title=record.has_number_in_title,
        has_question_in_title=record.has_question_in_title,
        has_emoji_in_title=record.has_emoji_in_title,
        video_length_seconds=record.video_length_seconds,
        publish_day_of_week=record.publish_day_of_week,
        publish_hour=record.publish_hour,
        tags=record.tags,
        category=record.category,
        extra_attributes=record.extra_attributes,
        recorded_at=record.recorded_at,
        performance_level=record.performance_level,
        performance_score=record.performance_score,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.put("/records/{record_id}", response_model=PerformanceRecordResponse)
async def update_performance_record(
    record_id: str,
    data: PerformanceRecordUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """パフォーマンス記録を更新"""
    result = await db.execute(
        select(PerformanceRecord).where(PerformanceRecord.id == UUID(record_id))
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="記録が見つかりません")

    # Update fields
    if data.views is not None:
        record.views = data.views
    if data.likes is not None:
        record.likes = data.likes
    if data.dislikes is not None:
        record.dislikes = data.dislikes
    if data.comments is not None:
        record.comments = data.comments
    if data.shares is not None:
        record.shares = data.shares
    if data.subscribers_gained is not None:
        record.subscribers_gained = data.subscribers_gained
    if data.subscribers_lost is not None:
        record.subscribers_lost = data.subscribers_lost
    if data.watch_time_minutes is not None:
        record.watch_time_minutes = data.watch_time_minutes
    if data.avg_view_duration_seconds is not None:
        record.avg_view_duration_seconds = data.avg_view_duration_seconds
    if data.avg_view_percentage is not None:
        record.avg_view_percentage = data.avg_view_percentage
    if data.impressions is not None:
        record.impressions = data.impressions
    if data.ctr is not None:
        record.ctr = data.ctr

    # Recalculate performance
    record.performance_score = _calculate_performance_score(record)
    record.performance_level = _determine_performance_level(record.performance_score)
    record.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(record)

    return PerformanceRecordResponse(
        id=str(record.id),
        video_id=str(record.video_id),
        project_id=str(record.project_id) if record.project_id else None,
        knowledge_id=str(record.knowledge_id) if record.knowledge_id else None,
        video_type=record.video_type,
        published_at=record.published_at,
        views=record.views,
        likes=record.likes,
        dislikes=record.dislikes,
        comments=record.comments,
        shares=record.shares,
        subscribers_gained=record.subscribers_gained,
        subscribers_lost=record.subscribers_lost,
        watch_time_minutes=record.watch_time_minutes,
        avg_view_duration_seconds=record.avg_view_duration_seconds,
        avg_view_percentage=record.avg_view_percentage,
        impressions=record.impressions,
        ctr=record.ctr,
        title_length=record.title_length,
        has_number_in_title=record.has_number_in_title,
        has_question_in_title=record.has_question_in_title,
        has_emoji_in_title=record.has_emoji_in_title,
        video_length_seconds=record.video_length_seconds,
        publish_day_of_week=record.publish_day_of_week,
        publish_hour=record.publish_hour,
        tags=record.tags,
        category=record.category,
        extra_attributes=record.extra_attributes,
        recorded_at=record.recorded_at,
        performance_level=record.performance_level,
        performance_score=record.performance_score,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


# ============================================================
# Learning Insight Endpoints
# ============================================================

@router.get("/insights", response_model=LearningInsightListResponse)
async def get_insights(
    knowledge_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    insight_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """学習インサイト一覧を取得"""
    query = select(LearningInsight)

    if knowledge_id:
        query = query.where(LearningInsight.knowledge_id == UUID(knowledge_id))
    if category:
        query = query.where(LearningInsight.category == category)
    if insight_type:
        query = query.where(LearningInsight.insight_type == insight_type)
    if is_active is not None:
        query = query.where(LearningInsight.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(LearningInsight.confidence_score.desc())
    result = await db.execute(query)
    insights = result.scalars().all()

    return LearningInsightListResponse(
        insights=[
            LearningInsightResponse(
                id=str(i.id),
                knowledge_id=str(i.knowledge_id) if i.knowledge_id else None,
                project_id=str(i.project_id) if i.project_id else None,
                insight_type=i.insight_type,
                category=i.category,
                title=i.title,
                description=i.description,
                evidence=i.evidence,
                confidence_score=i.confidence_score,
                sample_size=i.sample_size,
                recommendation=i.recommendation,
                expected_impact=i.expected_impact,
                is_active=i.is_active,
                is_applied=i.is_applied,
                applied_at=i.applied_at,
                created_at=i.created_at,
                updated_at=i.updated_at,
            )
            for i in insights
        ],
        total=total,
    )


@router.post("/insights", response_model=LearningInsightResponse)
async def create_insight(
    data: LearningInsightCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """学習インサイトを作成"""
    insight = LearningInsight(
        knowledge_id=UUID(data.knowledge_id) if data.knowledge_id else None,
        project_id=UUID(data.project_id) if data.project_id else None,
        insight_type=data.insight_type,
        category=data.category,
        title=data.title,
        description=data.description,
        evidence=data.evidence,
        confidence_score=data.confidence_score,
        sample_size=data.sample_size,
        recommendation=data.recommendation,
        expected_impact=data.expected_impact,
    )
    db.add(insight)
    await db.commit()
    await db.refresh(insight)

    return LearningInsightResponse(
        id=str(insight.id),
        knowledge_id=str(insight.knowledge_id) if insight.knowledge_id else None,
        project_id=str(insight.project_id) if insight.project_id else None,
        insight_type=insight.insight_type,
        category=insight.category,
        title=insight.title,
        description=insight.description,
        evidence=insight.evidence,
        confidence_score=insight.confidence_score,
        sample_size=insight.sample_size,
        recommendation=insight.recommendation,
        expected_impact=insight.expected_impact,
        is_active=insight.is_active,
        is_applied=insight.is_applied,
        applied_at=insight.applied_at,
        created_at=insight.created_at,
        updated_at=insight.updated_at,
    )


# ============================================================
# Success Pattern Endpoints
# ============================================================

@router.get("/patterns", response_model=SuccessPatternListResponse)
async def get_success_patterns(
    knowledge_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """成功パターン一覧を取得"""
    query = select(SuccessPattern)

    if knowledge_id:
        query = query.where(SuccessPattern.knowledge_id == UUID(knowledge_id))
    if category:
        query = query.where(SuccessPattern.category == category)
    if is_active is not None:
        query = query.where(SuccessPattern.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(SuccessPattern.priority.desc())
    result = await db.execute(query)
    patterns = result.scalars().all()

    return SuccessPatternListResponse(
        patterns=[
            SuccessPatternResponse(
                id=str(p.id),
                knowledge_id=str(p.knowledge_id) if p.knowledge_id else None,
                name=p.name,
                description=p.description,
                category=p.category,
                pattern_data=p.pattern_data,
                example_video_ids=p.example_video_ids,
                avg_performance_boost=p.avg_performance_boost,
                success_rate=p.success_rate,
                application_count=p.application_count,
                is_active=p.is_active,
                priority=p.priority,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in patterns
        ],
        total=total,
    )


@router.post("/patterns", response_model=SuccessPatternResponse)
async def create_success_pattern(
    data: SuccessPatternCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """成功パターンを作成"""
    pattern = SuccessPattern(
        knowledge_id=UUID(data.knowledge_id) if data.knowledge_id else None,
        name=data.name,
        description=data.description,
        category=data.category,
        pattern_data=data.pattern_data,
        example_video_ids=data.example_video_ids,
        avg_performance_boost=data.avg_performance_boost,
        success_rate=data.success_rate,
    )
    db.add(pattern)
    await db.commit()
    await db.refresh(pattern)

    return SuccessPatternResponse(
        id=str(pattern.id),
        knowledge_id=str(pattern.knowledge_id) if pattern.knowledge_id else None,
        name=pattern.name,
        description=pattern.description,
        category=pattern.category,
        pattern_data=pattern.pattern_data,
        example_video_ids=pattern.example_video_ids,
        avg_performance_boost=pattern.avg_performance_boost,
        success_rate=pattern.success_rate,
        application_count=pattern.application_count,
        is_active=pattern.is_active,
        priority=pattern.priority,
        created_at=pattern.created_at,
        updated_at=pattern.updated_at,
    )


# ============================================================
# Recommendation Endpoints
# ============================================================

@router.get("/recommendations", response_model=RecommendationListResponse)
async def get_recommendations(
    knowledge_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_applied: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """推奨事項一覧を取得"""
    query = select(Recommendation)

    if knowledge_id:
        query = query.where(Recommendation.knowledge_id == UUID(knowledge_id))
    if project_id:
        query = query.where(Recommendation.project_id == UUID(project_id))
    if category:
        query = query.where(Recommendation.category == category)
    if is_applied is not None:
        query = query.where(Recommendation.is_applied == is_applied)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(Recommendation.created_at.desc())
    result = await db.execute(query)
    recommendations = result.scalars().all()

    return RecommendationListResponse(
        recommendations=[
            RecommendationResponse(
                id=str(r.id),
                video_id=str(r.video_id) if r.video_id else None,
                project_id=str(r.project_id) if r.project_id else None,
                knowledge_id=str(r.knowledge_id) if r.knowledge_id else None,
                based_on_pattern_id=str(r.based_on_pattern_id) if r.based_on_pattern_id else None,
                based_on_insight_id=str(r.based_on_insight_id) if r.based_on_insight_id else None,
                category=r.category,
                title=r.title,
                description=r.description,
                action_items=r.action_items,
                expected_impact_score=r.expected_impact_score,
                expected_metric=r.expected_metric,
                expected_improvement=r.expected_improvement,
                is_applied=r.is_applied,
                applied_at=r.applied_at,
                result_score=r.result_score,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in recommendations
        ],
        total=total,
    )


@router.post("/recommendations", response_model=RecommendationResponse)
async def create_recommendation(
    data: RecommendationCreate,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """推奨事項を作成"""
    recommendation = Recommendation(
        video_id=UUID(data.video_id) if data.video_id else None,
        project_id=UUID(data.project_id) if data.project_id else None,
        knowledge_id=UUID(data.knowledge_id) if data.knowledge_id else None,
        based_on_pattern_id=UUID(data.based_on_pattern_id) if data.based_on_pattern_id else None,
        based_on_insight_id=UUID(data.based_on_insight_id) if data.based_on_insight_id else None,
        category=data.category,
        title=data.title,
        description=data.description,
        action_items=data.action_items,
        expected_impact_score=data.expected_impact_score,
        expected_metric=data.expected_metric,
        expected_improvement=data.expected_improvement,
    )
    db.add(recommendation)
    await db.commit()
    await db.refresh(recommendation)

    return RecommendationResponse(
        id=str(recommendation.id),
        video_id=str(recommendation.video_id) if recommendation.video_id else None,
        project_id=str(recommendation.project_id) if recommendation.project_id else None,
        knowledge_id=str(recommendation.knowledge_id) if recommendation.knowledge_id else None,
        based_on_pattern_id=str(recommendation.based_on_pattern_id) if recommendation.based_on_pattern_id else None,
        based_on_insight_id=str(recommendation.based_on_insight_id) if recommendation.based_on_insight_id else None,
        category=recommendation.category,
        title=recommendation.title,
        description=recommendation.description,
        action_items=recommendation.action_items,
        expected_impact_score=recommendation.expected_impact_score,
        expected_metric=recommendation.expected_metric,
        expected_improvement=recommendation.expected_improvement,
        is_applied=recommendation.is_applied,
        applied_at=recommendation.applied_at,
        result_score=recommendation.result_score,
        created_at=recommendation.created_at,
        updated_at=recommendation.updated_at,
    )


@router.post("/recommendations/{recommendation_id}/apply")
async def apply_recommendation(
    recommendation_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """推奨事項を適用済みにする"""
    result = await db.execute(
        select(Recommendation).where(Recommendation.id == UUID(recommendation_id))
    )
    recommendation = result.scalar_one_or_none()
    if not recommendation:
        raise HTTPException(status_code=404, detail="推奨事項が見つかりません")

    recommendation.is_applied = True
    recommendation.applied_at = datetime.utcnow()
    recommendation.updated_at = datetime.utcnow()

    await db.commit()

    return {"success": True, "message": "推奨事項を適用しました"}


# ============================================================
# Summary & Analysis Endpoints
# ============================================================

@router.get("/summary", response_model=LearningSummary)
async def get_learning_summary(
    knowledge_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """学習サマリーを取得"""
    base_filter = []
    if knowledge_id:
        base_filter.append(PerformanceRecord.knowledge_id == UUID(knowledge_id))

    # Count records
    records_query = select(func.count()).select_from(PerformanceRecord)
    if base_filter:
        records_query = records_query.where(*base_filter)
    records_result = await db.execute(records_query)
    total_records = records_result.scalar() or 0

    # Count insights
    insights_filter = []
    if knowledge_id:
        insights_filter.append(LearningInsight.knowledge_id == UUID(knowledge_id))
    insights_query = select(func.count()).select_from(LearningInsight).where(LearningInsight.is_active == True)
    if insights_filter:
        insights_query = insights_query.where(*insights_filter)
    insights_result = await db.execute(insights_query)
    total_insights = insights_result.scalar() or 0

    # Count patterns
    patterns_filter = []
    if knowledge_id:
        patterns_filter.append(SuccessPattern.knowledge_id == UUID(knowledge_id))
    patterns_query = select(func.count()).select_from(SuccessPattern).where(SuccessPattern.is_active == True)
    if patterns_filter:
        patterns_query = patterns_query.where(*patterns_filter)
    patterns_result = await db.execute(patterns_query)
    total_patterns = patterns_result.scalar() or 0

    # Count recommendations
    recs_filter = []
    if knowledge_id:
        recs_filter.append(Recommendation.knowledge_id == UUID(knowledge_id))
    recs_query = select(func.count()).select_from(Recommendation).where(Recommendation.is_applied == False)
    if recs_filter:
        recs_query = recs_query.where(*recs_filter)
    recs_result = await db.execute(recs_query)
    active_recommendations = recs_result.scalar() or 0

    total_recs_query = select(func.count()).select_from(Recommendation)
    if recs_filter:
        total_recs_query = total_recs_query.where(*recs_filter)
    total_recs_result = await db.execute(total_recs_query)
    total_recommendations = total_recs_result.scalar() or 0

    # Average performance score
    avg_query = select(func.avg(PerformanceRecord.performance_score))
    if base_filter:
        avg_query = avg_query.where(*base_filter)
    avg_result = await db.execute(avg_query)
    avg_performance = avg_result.scalar()

    return LearningSummary(
        total_records=total_records,
        total_insights=total_insights,
        total_patterns=total_patterns,
        total_recommendations=total_recommendations,
        avg_performance_score=round(avg_performance, 2) if avg_performance else None,
        top_performing_category=None,
        most_common_success_pattern=None,
        active_recommendations=active_recommendations,
    )


@router.get("/trends", response_model=LearningTrendsResponse)
async def get_learning_trends(
    knowledge_id: Optional[str] = Query(None),
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """学習トレンドを取得"""
    since = datetime.utcnow() - timedelta(days=days)

    trends = []
    for day_offset in range(days):
        date = datetime.utcnow() - timedelta(days=days - day_offset - 1)
        date_str = date.strftime("%Y-%m-%d")

        # For now, return placeholder data
        trends.append(LearningTrend(
            date=date_str,
            avg_performance=0.0,
            insights_generated=0,
            patterns_discovered=0,
        ))

    return LearningTrendsResponse(trends=trends, period_days=days)


@router.post("/analyze", response_model=LearningAnalysisResponse)
async def analyze_performance(
    data: LearningAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """パフォーマンス分析を実行"""
    import uuid as uuid_mod

    # This would trigger actual ML analysis in production
    # For now, return placeholder response

    return LearningAnalysisResponse(
        analysis_id=str(uuid_mod.uuid4()),
        status="completed",
        insights_generated=0,
        patterns_discovered=0,
        recommendations_created=0,
        processing_time_seconds=0.5,
        summary={
            "message": "分析機能は今後実装予定です",
            "knowledge_id": data.knowledge_id,
        },
    )


# ============================================================
# Helper Functions
# ============================================================

def _calculate_performance_score(record: PerformanceRecord) -> float:
    """パフォーマンススコアを計算"""
    score = 0.0
    weights = {
        "views": 0.2,
        "ctr": 0.25,
        "avg_view_percentage": 0.25,
        "engagement_rate": 0.15,
        "subscriber_growth": 0.15,
    }

    # Normalize and weight each metric
    if record.views:
        # Assume 10000 views is exceptional
        score += min(record.views / 10000, 1.0) * weights["views"] * 100

    if record.ctr:
        # CTR above 10% is exceptional
        score += min(record.ctr / 10, 1.0) * weights["ctr"] * 100

    if record.avg_view_percentage:
        score += (record.avg_view_percentage / 100) * weights["avg_view_percentage"] * 100

    # Engagement rate
    if record.views and record.views > 0:
        engagement = (record.likes + record.comments + record.shares) / record.views
        score += min(engagement / 0.1, 1.0) * weights["engagement_rate"] * 100

    # Subscriber growth
    net_subs = record.subscribers_gained - record.subscribers_lost
    if net_subs > 0:
        score += min(net_subs / 100, 1.0) * weights["subscriber_growth"] * 100

    return round(score, 2)


def _determine_performance_level(score: float) -> PerformanceLevel:
    """スコアからパフォーマンスレベルを決定"""
    if score >= 80:
        return PerformanceLevel.EXCEPTIONAL
    elif score >= 60:
        return PerformanceLevel.HIGH
    elif score >= 40:
        return PerformanceLevel.AVERAGE
    elif score >= 20:
        return PerformanceLevel.BELOW_AVERAGE
    else:
        return PerformanceLevel.LOW
