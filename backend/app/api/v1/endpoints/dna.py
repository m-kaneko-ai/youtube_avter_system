"""
コンテンツDNA APIエンドポイント

コンテンツDNA抽出・管理・分析
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user_id_dev as get_current_user_id
from app.models.dna import (
    ContentDNA,
    DNAElement,
    DNATemplate,
    DNAComparison,
    ChannelDNAProfile,
    DNAElementType,
    DNAStrength,
    TemplateStatus,
)
from app.schemas.dna import (
    ContentDNACreate,
    ContentDNAUpdate,
    ContentDNAResponse,
    ContentDNAListResponse,
    DNAElementCreate,
    DNAElementResponse,
    DNATemplateCreate,
    DNATemplateUpdate,
    DNATemplateResponse,
    DNATemplateListResponse,
    DNAComparisonRequest,
    DNAComparisonResponse,
    ChannelDNAProfileCreate,
    ChannelDNAProfileUpdate,
    ChannelDNAProfileResponse,
    DNAExtractionRequest,
    DNAExtractionResponse,
    DNASummary,
    DNARecommendation,
)

router = APIRouter()


# ============================================================
# Content DNA Endpoints
# ============================================================

@router.get("/", response_model=ContentDNAListResponse)
async def get_content_dnas(
    knowledge_id: Optional[str] = Query(None, description="ナレッジIDでフィルタ"),
    video_id: Optional[str] = Query(None, description="動画IDでフィルタ"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """コンテンツDNA一覧を取得"""
    query = select(ContentDNA)

    if knowledge_id:
        query = query.where(ContentDNA.knowledge_id == UUID(knowledge_id))
    if video_id:
        query = query.where(ContentDNA.video_id == UUID(video_id))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(ContentDNA.created_at.desc())
    result = await db.execute(query)
    dnas = result.scalars().all()

    return ContentDNAListResponse(
        dnas=[
            ContentDNAResponse(
                id=str(d.id),
                video_id=str(d.video_id) if d.video_id else None,
                knowledge_id=str(d.knowledge_id) if d.knowledge_id else None,
                name=d.name,
                description=d.description,
                hook_elements=d.hook_elements,
                story_structure=d.story_structure,
                persona_traits=d.persona_traits,
                visual_elements=d.visual_elements,
                audio_elements=d.audio_elements,
                pacing_data=d.pacing_data,
                emotional_arc=d.emotional_arc,
                value_propositions=d.value_propositions,
                cta_patterns=d.cta_patterns,
                overall_strength=d.overall_strength,
                uniqueness_score=d.uniqueness_score,
                consistency_score=d.consistency_score,
                source_videos_count=d.source_videos_count,
                last_analyzed_at=d.last_analyzed_at,
                analysis_version=d.analysis_version,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in dnas
        ],
        total=total,
    )


@router.post("/", response_model=ContentDNAResponse)
async def create_content_dna(
    data: ContentDNACreate,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """コンテンツDNAを作成"""
    dna = ContentDNA(
        video_id=UUID(data.video_id) if data.video_id else None,
        knowledge_id=UUID(data.knowledge_id) if data.knowledge_id else None,
        name=data.name,
        description=data.description,
        hook_elements=data.hook_elements,
        story_structure=data.story_structure,
        persona_traits=data.persona_traits,
        visual_elements=data.visual_elements,
        audio_elements=data.audio_elements,
        pacing_data=data.pacing_data,
        emotional_arc=data.emotional_arc,
        value_propositions=data.value_propositions,
        cta_patterns=data.cta_patterns,
    )
    db.add(dna)
    await db.commit()
    await db.refresh(dna)

    return ContentDNAResponse(
        id=str(dna.id),
        video_id=str(dna.video_id) if dna.video_id else None,
        knowledge_id=str(dna.knowledge_id) if dna.knowledge_id else None,
        name=dna.name,
        description=dna.description,
        hook_elements=dna.hook_elements,
        story_structure=dna.story_structure,
        persona_traits=dna.persona_traits,
        visual_elements=dna.visual_elements,
        audio_elements=dna.audio_elements,
        pacing_data=dna.pacing_data,
        emotional_arc=dna.emotional_arc,
        value_propositions=dna.value_propositions,
        cta_patterns=dna.cta_patterns,
        overall_strength=dna.overall_strength,
        uniqueness_score=dna.uniqueness_score,
        consistency_score=dna.consistency_score,
        source_videos_count=dna.source_videos_count,
        last_analyzed_at=dna.last_analyzed_at,
        analysis_version=dna.analysis_version,
        created_at=dna.created_at,
        updated_at=dna.updated_at,
    )


@router.get("/{dna_id}", response_model=ContentDNAResponse)
async def get_content_dna(
    dna_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """コンテンツDNAを取得"""
    result = await db.execute(
        select(ContentDNA).where(ContentDNA.id == UUID(dna_id))
    )
    dna = result.scalar_one_or_none()
    if not dna:
        raise HTTPException(status_code=404, detail="DNAが見つかりません")

    return ContentDNAResponse(
        id=str(dna.id),
        video_id=str(dna.video_id) if dna.video_id else None,
        knowledge_id=str(dna.knowledge_id) if dna.knowledge_id else None,
        name=dna.name,
        description=dna.description,
        hook_elements=dna.hook_elements,
        story_structure=dna.story_structure,
        persona_traits=dna.persona_traits,
        visual_elements=dna.visual_elements,
        audio_elements=dna.audio_elements,
        pacing_data=dna.pacing_data,
        emotional_arc=dna.emotional_arc,
        value_propositions=dna.value_propositions,
        cta_patterns=dna.cta_patterns,
        overall_strength=dna.overall_strength,
        uniqueness_score=dna.uniqueness_score,
        consistency_score=dna.consistency_score,
        source_videos_count=dna.source_videos_count,
        last_analyzed_at=dna.last_analyzed_at,
        analysis_version=dna.analysis_version,
        created_at=dna.created_at,
        updated_at=dna.updated_at,
    )


@router.put("/{dna_id}", response_model=ContentDNAResponse)
async def update_content_dna(
    dna_id: str,
    data: ContentDNAUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """コンテンツDNAを更新"""
    result = await db.execute(
        select(ContentDNA).where(ContentDNA.id == UUID(dna_id))
    )
    dna = result.scalar_one_or_none()
    if not dna:
        raise HTTPException(status_code=404, detail="DNAが見つかりません")

    # Update fields
    if data.name is not None:
        dna.name = data.name
    if data.description is not None:
        dna.description = data.description
    if data.hook_elements is not None:
        dna.hook_elements = data.hook_elements
    if data.story_structure is not None:
        dna.story_structure = data.story_structure
    if data.persona_traits is not None:
        dna.persona_traits = data.persona_traits
    if data.visual_elements is not None:
        dna.visual_elements = data.visual_elements
    if data.audio_elements is not None:
        dna.audio_elements = data.audio_elements
    if data.pacing_data is not None:
        dna.pacing_data = data.pacing_data
    if data.emotional_arc is not None:
        dna.emotional_arc = data.emotional_arc
    if data.value_propositions is not None:
        dna.value_propositions = data.value_propositions
    if data.cta_patterns is not None:
        dna.cta_patterns = data.cta_patterns
    if data.overall_strength is not None:
        dna.overall_strength = data.overall_strength
    if data.uniqueness_score is not None:
        dna.uniqueness_score = data.uniqueness_score
    if data.consistency_score is not None:
        dna.consistency_score = data.consistency_score

    dna.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(dna)

    return ContentDNAResponse(
        id=str(dna.id),
        video_id=str(dna.video_id) if dna.video_id else None,
        knowledge_id=str(dna.knowledge_id) if dna.knowledge_id else None,
        name=dna.name,
        description=dna.description,
        hook_elements=dna.hook_elements,
        story_structure=dna.story_structure,
        persona_traits=dna.persona_traits,
        visual_elements=dna.visual_elements,
        audio_elements=dna.audio_elements,
        pacing_data=dna.pacing_data,
        emotional_arc=dna.emotional_arc,
        value_propositions=dna.value_propositions,
        cta_patterns=dna.cta_patterns,
        overall_strength=dna.overall_strength,
        uniqueness_score=dna.uniqueness_score,
        consistency_score=dna.consistency_score,
        source_videos_count=dna.source_videos_count,
        last_analyzed_at=dna.last_analyzed_at,
        analysis_version=dna.analysis_version,
        created_at=dna.created_at,
        updated_at=dna.updated_at,
    )


@router.delete("/{dna_id}")
async def delete_content_dna(
    dna_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """コンテンツDNAを削除"""
    result = await db.execute(
        select(ContentDNA).where(ContentDNA.id == UUID(dna_id))
    )
    dna = result.scalar_one_or_none()
    if not dna:
        raise HTTPException(status_code=404, detail="DNAが見つかりません")

    await db.delete(dna)
    await db.commit()

    return {"success": True, "message": "DNAを削除しました"}


# ============================================================
# DNA Element Endpoints
# ============================================================

@router.get("/{dna_id}/elements", response_model=List[DNAElementResponse])
async def get_dna_elements(
    dna_id: str,
    element_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """DNA要素一覧を取得"""
    query = select(DNAElement).where(DNAElement.content_dna_id == UUID(dna_id))

    if element_type:
        query = query.where(DNAElement.element_type == element_type)

    result = await db.execute(query.order_by(DNAElement.strength_score.desc()))
    elements = result.scalars().all()

    return [
        DNAElementResponse(
            id=str(e.id),
            content_dna_id=str(e.content_dna_id),
            element_type=e.element_type,
            name=e.name,
            description=e.description,
            data=e.data,
            examples=e.examples,
            timestamps=e.timestamps,
            strength=e.strength,
            strength_score=e.strength_score,
            impact_on_retention=e.impact_on_retention,
            impact_on_engagement=e.impact_on_engagement,
            created_at=e.created_at,
            updated_at=e.updated_at,
        )
        for e in elements
    ]


@router.post("/{dna_id}/elements", response_model=DNAElementResponse)
async def create_dna_element(
    dna_id: str,
    data: DNAElementCreate,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """DNA要素を作成"""
    # Verify DNA exists
    dna_result = await db.execute(
        select(ContentDNA).where(ContentDNA.id == UUID(dna_id))
    )
    dna = dna_result.scalar_one_or_none()
    if not dna:
        raise HTTPException(status_code=404, detail="DNAが見つかりません")

    element = DNAElement(
        content_dna_id=UUID(dna_id),
        element_type=data.element_type,
        name=data.name,
        description=data.description,
        data=data.data,
        examples=data.examples,
        timestamps=data.timestamps,
        strength=data.strength,
        strength_score=data.strength_score,
        impact_on_retention=data.impact_on_retention,
        impact_on_engagement=data.impact_on_engagement,
    )
    db.add(element)
    await db.commit()
    await db.refresh(element)

    return DNAElementResponse(
        id=str(element.id),
        content_dna_id=str(element.content_dna_id),
        element_type=element.element_type,
        name=element.name,
        description=element.description,
        data=element.data,
        examples=element.examples,
        timestamps=element.timestamps,
        strength=element.strength,
        strength_score=element.strength_score,
        impact_on_retention=element.impact_on_retention,
        impact_on_engagement=element.impact_on_engagement,
        created_at=element.created_at,
        updated_at=element.updated_at,
    )


# ============================================================
# DNA Template Endpoints
# ============================================================

@router.get("/templates", response_model=DNATemplateListResponse)
async def get_dna_templates(
    knowledge_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """DNAテンプレート一覧を取得"""
    query = select(DNATemplate)

    if knowledge_id:
        query = query.where(DNATemplate.knowledge_id == UUID(knowledge_id))
    if category:
        query = query.where(DNATemplate.category == category)
    if status:
        query = query.where(DNATemplate.status == status)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch with pagination
    query = query.offset(skip).limit(limit).order_by(DNATemplate.usage_count.desc())
    result = await db.execute(query)
    templates = result.scalars().all()

    return DNATemplateListResponse(
        templates=[
            DNATemplateResponse(
                id=str(t.id),
                knowledge_id=str(t.knowledge_id) if t.knowledge_id else None,
                name=t.name,
                description=t.description,
                category=t.category,
                video_type=t.video_type,
                structure=t.structure,
                required_elements=t.required_elements,
                optional_elements=t.optional_elements,
                source_dna_ids=[str(sid) for sid in t.source_dna_ids] if t.source_dna_ids else None,
                avg_performance_score=t.avg_performance_score,
                status=t.status,
                usage_count=t.usage_count,
                success_rate=t.success_rate,
                tags=t.tags,
                created_by=str(t.created_by) if t.created_by else None,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in templates
        ],
        total=total,
    )


@router.post("/templates", response_model=DNATemplateResponse)
async def create_dna_template(
    data: DNATemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """DNAテンプレートを作成"""
    template = DNATemplate(
        knowledge_id=UUID(data.knowledge_id) if data.knowledge_id else None,
        name=data.name,
        description=data.description,
        category=data.category,
        video_type=data.video_type,
        structure=data.structure,
        required_elements=data.required_elements,
        optional_elements=data.optional_elements,
        source_dna_ids=[UUID(sid) for sid in data.source_dna_ids] if data.source_dna_ids else None,
        tags=data.tags,
        status=TemplateStatus.DRAFT,
        created_by=current_user.id if hasattr(current_user, 'id') else None,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)

    return DNATemplateResponse(
        id=str(template.id),
        knowledge_id=str(template.knowledge_id) if template.knowledge_id else None,
        name=template.name,
        description=template.description,
        category=template.category,
        video_type=template.video_type,
        structure=template.structure,
        required_elements=template.required_elements,
        optional_elements=template.optional_elements,
        source_dna_ids=[str(sid) for sid in template.source_dna_ids] if template.source_dna_ids else None,
        avg_performance_score=template.avg_performance_score,
        status=template.status,
        usage_count=template.usage_count,
        success_rate=template.success_rate,
        tags=template.tags,
        created_by=str(template.created_by) if template.created_by else None,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.get("/templates/{template_id}", response_model=DNATemplateResponse)
async def get_dna_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """DNAテンプレートを取得"""
    result = await db.execute(
        select(DNATemplate).where(DNATemplate.id == UUID(template_id))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")

    return DNATemplateResponse(
        id=str(template.id),
        knowledge_id=str(template.knowledge_id) if template.knowledge_id else None,
        name=template.name,
        description=template.description,
        category=template.category,
        video_type=template.video_type,
        structure=template.structure,
        required_elements=template.required_elements,
        optional_elements=template.optional_elements,
        source_dna_ids=[str(sid) for sid in template.source_dna_ids] if template.source_dna_ids else None,
        avg_performance_score=template.avg_performance_score,
        status=template.status,
        usage_count=template.usage_count,
        success_rate=template.success_rate,
        tags=template.tags,
        created_by=str(template.created_by) if template.created_by else None,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.put("/templates/{template_id}", response_model=DNATemplateResponse)
async def update_dna_template(
    template_id: str,
    data: DNATemplateUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """DNAテンプレートを更新"""
    result = await db.execute(
        select(DNATemplate).where(DNATemplate.id == UUID(template_id))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")

    # Update fields
    if data.name is not None:
        template.name = data.name
    if data.description is not None:
        template.description = data.description
    if data.category is not None:
        template.category = data.category
    if data.video_type is not None:
        template.video_type = data.video_type
    if data.structure is not None:
        template.structure = data.structure
    if data.required_elements is not None:
        template.required_elements = data.required_elements
    if data.optional_elements is not None:
        template.optional_elements = data.optional_elements
    if data.tags is not None:
        template.tags = data.tags
    if data.status is not None:
        template.status = data.status

    template.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(template)

    return DNATemplateResponse(
        id=str(template.id),
        knowledge_id=str(template.knowledge_id) if template.knowledge_id else None,
        name=template.name,
        description=template.description,
        category=template.category,
        video_type=template.video_type,
        structure=template.structure,
        required_elements=template.required_elements,
        optional_elements=template.optional_elements,
        source_dna_ids=[str(sid) for sid in template.source_dna_ids] if template.source_dna_ids else None,
        avg_performance_score=template.avg_performance_score,
        status=template.status,
        usage_count=template.usage_count,
        success_rate=template.success_rate,
        tags=template.tags,
        created_by=str(template.created_by) if template.created_by else None,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.delete("/templates/{template_id}")
async def delete_dna_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """DNAテンプレートを削除"""
    result = await db.execute(
        select(DNATemplate).where(DNATemplate.id == UUID(template_id))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")

    await db.delete(template)
    await db.commit()

    return {"success": True, "message": "テンプレートを削除しました"}


# ============================================================
# DNA Comparison Endpoints
# ============================================================

@router.post("/compare", response_model=DNAComparisonResponse)
async def compare_dnas(
    data: DNAComparisonRequest,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """2つのDNAを比較"""
    # Verify source DNA exists
    source_result = await db.execute(
        select(ContentDNA).where(ContentDNA.id == UUID(data.source_dna_id))
    )
    source_dna = source_result.scalar_one_or_none()
    if not source_dna:
        raise HTTPException(status_code=404, detail="ソースDNAが見つかりません")

    # Verify target DNA exists
    target_result = await db.execute(
        select(ContentDNA).where(ContentDNA.id == UUID(data.target_dna_id))
    )
    target_dna = target_result.scalar_one_or_none()
    if not target_dna:
        raise HTTPException(status_code=404, detail="ターゲットDNAが見つかりません")

    # Calculate similarity (simplified for now)
    overall_similarity = _calculate_dna_similarity(source_dna, target_dna)

    # Create comparison record
    comparison = DNAComparison(
        source_dna_id=UUID(data.source_dna_id),
        target_dna_id=UUID(data.target_dna_id),
        overall_similarity=overall_similarity,
        comparison_details={
            "source_name": source_dna.name,
            "target_name": target_dna.name,
        },
    )
    db.add(comparison)
    await db.commit()
    await db.refresh(comparison)

    return DNAComparisonResponse(
        id=str(comparison.id),
        source_dna_id=str(comparison.source_dna_id),
        target_dna_id=str(comparison.target_dna_id),
        overall_similarity=comparison.overall_similarity,
        hook_similarity=comparison.hook_similarity,
        structure_similarity=comparison.structure_similarity,
        style_similarity=comparison.style_similarity,
        comparison_details=comparison.comparison_details,
        shared_elements=comparison.shared_elements,
        unique_to_source=comparison.unique_to_source,
        unique_to_target=comparison.unique_to_target,
        recommendations=comparison.recommendations,
        created_at=comparison.created_at,
    )


# ============================================================
# Channel DNA Profile Endpoints
# ============================================================

@router.get("/profiles/{knowledge_id}", response_model=ChannelDNAProfileResponse)
async def get_channel_profile(
    knowledge_id: str,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """チャンネルDNAプロファイルを取得"""
    result = await db.execute(
        select(ChannelDNAProfile).where(ChannelDNAProfile.knowledge_id == UUID(knowledge_id))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="プロファイルが見つかりません")

    return ChannelDNAProfileResponse(
        id=str(profile.id),
        knowledge_id=str(profile.knowledge_id),
        channel_name=profile.channel_name,
        niche=profile.niche,
        signature_elements=profile.signature_elements,
        strengths=profile.strengths,
        weaknesses=profile.weaknesses,
        content_style=profile.content_style,
        visual_identity=profile.visual_identity,
        voice_identity=profile.voice_identity,
        best_performing_elements=profile.best_performing_elements,
        underperforming_elements=profile.underperforming_elements,
        improvement_opportunities=profile.improvement_opportunities,
        videos_analyzed=profile.videos_analyzed,
        avg_dna_consistency=profile.avg_dna_consistency,
        last_updated_at=profile.last_updated_at,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.post("/profiles", response_model=ChannelDNAProfileResponse)
async def create_channel_profile(
    data: ChannelDNAProfileCreate,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """チャンネルDNAプロファイルを作成"""
    # Check if profile already exists
    existing = await db.execute(
        select(ChannelDNAProfile).where(ChannelDNAProfile.knowledge_id == UUID(data.knowledge_id))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="このナレッジのプロファイルは既に存在します")

    profile = ChannelDNAProfile(
        knowledge_id=UUID(data.knowledge_id),
        channel_name=data.channel_name,
        niche=data.niche,
        signature_elements=data.signature_elements,
        strengths=data.strengths,
        weaknesses=data.weaknesses,
        content_style=data.content_style,
        visual_identity=data.visual_identity,
        voice_identity=data.voice_identity,
        best_performing_elements=data.best_performing_elements,
        underperforming_elements=data.underperforming_elements,
        improvement_opportunities=data.improvement_opportunities,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return ChannelDNAProfileResponse(
        id=str(profile.id),
        knowledge_id=str(profile.knowledge_id),
        channel_name=profile.channel_name,
        niche=profile.niche,
        signature_elements=profile.signature_elements,
        strengths=profile.strengths,
        weaknesses=profile.weaknesses,
        content_style=profile.content_style,
        visual_identity=profile.visual_identity,
        voice_identity=profile.voice_identity,
        best_performing_elements=profile.best_performing_elements,
        underperforming_elements=profile.underperforming_elements,
        improvement_opportunities=profile.improvement_opportunities,
        videos_analyzed=profile.videos_analyzed,
        avg_dna_consistency=profile.avg_dna_consistency,
        last_updated_at=profile.last_updated_at,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.put("/profiles/{knowledge_id}", response_model=ChannelDNAProfileResponse)
async def update_channel_profile(
    knowledge_id: str,
    data: ChannelDNAProfileUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """チャンネルDNAプロファイルを更新"""
    result = await db.execute(
        select(ChannelDNAProfile).where(ChannelDNAProfile.knowledge_id == UUID(knowledge_id))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="プロファイルが見つかりません")

    # Update fields
    if data.channel_name is not None:
        profile.channel_name = data.channel_name
    if data.niche is not None:
        profile.niche = data.niche
    if data.signature_elements is not None:
        profile.signature_elements = data.signature_elements
    if data.strengths is not None:
        profile.strengths = data.strengths
    if data.weaknesses is not None:
        profile.weaknesses = data.weaknesses
    if data.content_style is not None:
        profile.content_style = data.content_style
    if data.visual_identity is not None:
        profile.visual_identity = data.visual_identity
    if data.voice_identity is not None:
        profile.voice_identity = data.voice_identity
    if data.best_performing_elements is not None:
        profile.best_performing_elements = data.best_performing_elements
    if data.underperforming_elements is not None:
        profile.underperforming_elements = data.underperforming_elements
    if data.improvement_opportunities is not None:
        profile.improvement_opportunities = data.improvement_opportunities

    profile.last_updated_at = datetime.utcnow()
    profile.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(profile)

    return ChannelDNAProfileResponse(
        id=str(profile.id),
        knowledge_id=str(profile.knowledge_id),
        channel_name=profile.channel_name,
        niche=profile.niche,
        signature_elements=profile.signature_elements,
        strengths=profile.strengths,
        weaknesses=profile.weaknesses,
        content_style=profile.content_style,
        visual_identity=profile.visual_identity,
        voice_identity=profile.voice_identity,
        best_performing_elements=profile.best_performing_elements,
        underperforming_elements=profile.underperforming_elements,
        improvement_opportunities=profile.improvement_opportunities,
        videos_analyzed=profile.videos_analyzed,
        avg_dna_consistency=profile.avg_dna_consistency,
        last_updated_at=profile.last_updated_at,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


# ============================================================
# DNA Extraction Endpoints
# ============================================================

@router.post("/extract", response_model=DNAExtractionResponse)
async def extract_dna(
    data: DNAExtractionRequest,
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """動画からDNAを抽出"""
    import uuid as uuid_mod
    import time

    start_time = time.time()

    # This would trigger actual DNA extraction in production
    # For now, create a placeholder DNA

    dna = ContentDNA(
        video_id=UUID(data.video_id) if data.video_id else None,
        knowledge_id=UUID(data.knowledge_id) if data.knowledge_id else None,
        name="自動抽出DNA",
        description="AI分析による自動抽出",
        analysis_version="1.0.0",
        last_analyzed_at=datetime.utcnow(),
    )
    db.add(dna)
    await db.commit()
    await db.refresh(dna)

    processing_time = time.time() - start_time

    return DNAExtractionResponse(
        dna_id=str(dna.id),
        status="completed",
        elements_extracted=0,
        processing_time_seconds=round(processing_time, 2),
        summary={
            "message": "DNA抽出機能は今後実装予定です",
            "video_id": data.video_id,
            "knowledge_id": data.knowledge_id,
        },
    )


# ============================================================
# Summary Endpoint
# ============================================================

@router.get("/summary", response_model=DNASummary)
async def get_dna_summary(
    knowledge_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user_id: str = Depends(get_current_user_id),
):
    """DNAサマリーを取得"""
    base_filter = []
    if knowledge_id:
        base_filter.append(ContentDNA.knowledge_id == UUID(knowledge_id))

    # Count DNAs
    dna_query = select(func.count()).select_from(ContentDNA)
    if base_filter:
        dna_query = dna_query.where(*base_filter)
    dna_result = await db.execute(dna_query)
    total_dnas = dna_result.scalar() or 0

    # Count templates
    template_filter = []
    if knowledge_id:
        template_filter.append(DNATemplate.knowledge_id == UUID(knowledge_id))
    template_query = select(func.count()).select_from(DNATemplate).where(DNATemplate.status == TemplateStatus.ACTIVE)
    if template_filter:
        template_query = template_query.where(*template_filter)
    template_result = await db.execute(template_query)
    total_templates = template_result.scalar() or 0

    # Count profiles
    profile_query = select(func.count()).select_from(ChannelDNAProfile)
    if knowledge_id:
        profile_query = profile_query.where(ChannelDNAProfile.knowledge_id == UUID(knowledge_id))
    profile_result = await db.execute(profile_query)
    total_profiles = profile_result.scalar() or 0

    # Average strength score
    avg_query = select(func.avg(ContentDNA.overall_strength))
    if base_filter:
        avg_query = avg_query.where(*base_filter)
    avg_result = await db.execute(avg_query)
    avg_strength = avg_result.scalar()

    return DNASummary(
        total_dnas=total_dnas,
        total_templates=total_templates,
        total_profiles=total_profiles,
        avg_strength_score=round(avg_strength, 2) if avg_strength else None,
        most_common_elements=[],
        top_performing_patterns=[],
    )


# ============================================================
# Helper Functions
# ============================================================

def _calculate_dna_similarity(source: ContentDNA, target: ContentDNA) -> float:
    """2つのDNA間の類似度を計算（簡易版）"""
    # In production, this would use vector similarity or ML models
    # For now, return a placeholder value
    similarity = 0.5

    # Add some variance based on available data
    if source.hook_elements and target.hook_elements:
        similarity += 0.1
    if source.story_structure and target.story_structure:
        similarity += 0.1
    if source.persona_traits and target.persona_traits:
        similarity += 0.1

    return min(similarity, 1.0)
