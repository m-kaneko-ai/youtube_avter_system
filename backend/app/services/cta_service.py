"""
CTA管理サービス

CTAテンプレートのCRUD、統計計算、URL短縮
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from uuid import UUID
import httpx

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.cta import CTATemplate, VideoCTAAssignment, UTMDefaultSettings, CTAClickLog, CTAType, CTAPlacement
from app.schemas.cta import (
    CTACreate, CTAUpdate, CTAResponse, CTAStats, CTAListResponse,
    VideoCTAAssignmentCreate, VideoCTAAssignmentResponse,
    UTMDefaultSettingsBase, UTMDefaultSettingsResponse,
    CTADetailStats, CTADailyStats, GeneratedDescriptionWithCTA
)

logger = logging.getLogger(__name__)


class CTAService:
    """CTA管理サービス"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_cta_list(self) -> CTAListResponse:
        """CTA一覧を取得."""
        # CTA一覧取得
        result = await self.db.execute(
            select(CTATemplate).order_by(CTATemplate.created_at.desc())
        )
        ctas = result.scalars().all()

        # 統計計算
        total_ctas = len(ctas)
        active_ctas = len([c for c in ctas if c.is_active])
        total_clicks = sum(c.conversion_count for c in ctas)
        avg_ctr = sum(c.ctr or 0 for c in ctas) / total_ctas if total_ctas > 0 else 0

        return CTAListResponse(
            ctas=[self._to_response(cta) for cta in ctas],
            total=total_ctas,
            stats=CTAStats(
                total_ctas=total_ctas,
                active_ctas=active_ctas,
                total_clicks=total_clicks,
                avg_ctr=round(avg_ctr, 2)
            )
        )

    async def get_cta(self, cta_id: str) -> Optional[CTAResponse]:
        """CTA詳細を取得."""
        result = await self.db.execute(
            select(CTATemplate).where(CTATemplate.id == UUID(cta_id))
        )
        cta = result.scalar_one_or_none()
        if cta:
            return self._to_response(cta)
        return None

    async def create_cta(self, data: CTACreate, user_id: Optional[str] = None) -> CTAResponse:
        """CTAを作成."""
        # 短縮URL生成
        short_url = None
        if data.generate_short_url:
            short_url = await self._generate_short_url(data.url)

        cta = CTATemplate(
            name=data.name,
            type=CTAType(data.type.value),
            url=data.url,
            utm_params=data.utm_params.model_dump() if data.utm_params else None,
            short_url=short_url,
            display_text=data.display_text,
            placement=CTAPlacement(data.placement.value),
            is_active=data.is_active,
            created_by=UUID(user_id) if user_id else None
        )
        self.db.add(cta)
        await self.db.commit()
        await self.db.refresh(cta)

        logger.info(f"CTA created: {cta.id} - {cta.name}")
        return self._to_response(cta)

    async def update_cta(self, cta_id: str, data: CTAUpdate) -> Optional[CTAResponse]:
        """CTAを更新."""
        result = await self.db.execute(
            select(CTATemplate).where(CTATemplate.id == UUID(cta_id))
        )
        cta = result.scalar_one_or_none()
        if not cta:
            return None

        # 更新フィールドを適用
        if data.name is not None:
            cta.name = data.name
        if data.type is not None:
            cta.type = CTAType(data.type.value)
        if data.url is not None:
            cta.url = data.url
            # URL変更時に短縮URL再生成
            if data.generate_short_url:
                cta.short_url = await self._generate_short_url(data.url)
        if data.utm_params is not None:
            cta.utm_params = data.utm_params.model_dump()
        if data.display_text is not None:
            cta.display_text = data.display_text
        if data.placement is not None:
            cta.placement = CTAPlacement(data.placement.value)
        if data.is_active is not None:
            cta.is_active = data.is_active

        await self.db.commit()
        await self.db.refresh(cta)

        logger.info(f"CTA updated: {cta.id}")
        return self._to_response(cta)

    async def delete_cta(self, cta_id: str) -> bool:
        """CTAを削除."""
        result = await self.db.execute(
            select(CTATemplate).where(CTATemplate.id == UUID(cta_id))
        )
        cta = result.scalar_one_or_none()
        if not cta:
            return False

        await self.db.delete(cta)
        await self.db.commit()

        logger.info(f"CTA deleted: {cta_id}")
        return True

    async def get_active_ctas_by_placement(self, placement: CTAPlacement) -> List[CTAResponse]:
        """配置場所ごとの有効なCTAを取得."""
        result = await self.db.execute(
            select(CTATemplate).where(
                and_(
                    CTATemplate.is_active == True,
                    CTATemplate.placement == placement
                )
            ).order_by(CTATemplate.conversion_count.desc())
        )
        ctas = result.scalars().all()
        return [self._to_response(cta) for cta in ctas]

    async def assign_ctas_to_video(self, data: VideoCTAAssignmentCreate) -> VideoCTAAssignmentResponse:
        """動画にCTAを割り当て."""
        video_id = UUID(data.video_id)

        # 既存の割り当てを削除
        await self.db.execute(
            select(VideoCTAAssignment).where(VideoCTAAssignment.video_id == video_id)
        )

        # 新しい割り当てを作成
        assignments = []
        if data.top_cta_id:
            assignments.append(VideoCTAAssignment(
                video_id=video_id,
                cta_id=UUID(data.top_cta_id),
                placement=CTAPlacement.DESCRIPTION_TOP
            ))
        if data.bottom_cta_id:
            assignments.append(VideoCTAAssignment(
                video_id=video_id,
                cta_id=UUID(data.bottom_cta_id),
                placement=CTAPlacement.DESCRIPTION_BOTTOM
            ))
        if data.pinned_comment_cta_id:
            assignments.append(VideoCTAAssignment(
                video_id=video_id,
                cta_id=UUID(data.pinned_comment_cta_id),
                placement=CTAPlacement.PINNED_COMMENT
            ))

        for assignment in assignments:
            self.db.add(assignment)

        await self.db.commit()

        return await self.get_video_cta_assignments(data.video_id)

    async def get_video_cta_assignments(self, video_id: str) -> VideoCTAAssignmentResponse:
        """動画のCTA割り当てを取得."""
        result = await self.db.execute(
            select(VideoCTAAssignment)
            .options(selectinload(VideoCTAAssignment.cta))
            .where(VideoCTAAssignment.video_id == UUID(video_id))
        )
        assignments = result.scalars().all()

        top_cta = None
        bottom_cta = None
        pinned_comment_cta = None

        for assignment in assignments:
            if assignment.placement == CTAPlacement.DESCRIPTION_TOP:
                top_cta = self._to_response(assignment.cta)
            elif assignment.placement == CTAPlacement.DESCRIPTION_BOTTOM:
                bottom_cta = self._to_response(assignment.cta)
            elif assignment.placement == CTAPlacement.PINNED_COMMENT:
                pinned_comment_cta = self._to_response(assignment.cta)

        return VideoCTAAssignmentResponse(
            video_id=video_id,
            top_cta=top_cta,
            bottom_cta=bottom_cta,
            pinned_comment_cta=pinned_comment_cta
        )

    async def get_utm_settings(self) -> Optional[UTMDefaultSettingsResponse]:
        """UTMデフォルト設定を取得."""
        result = await self.db.execute(
            select(UTMDefaultSettings).limit(1)
        )
        settings = result.scalar_one_or_none()
        if settings:
            return UTMDefaultSettingsResponse(
                id=str(settings.id),
                default_source=settings.default_source,
                default_medium=settings.default_medium,
                campaign_naming_rule=settings.campaign_naming_rule,
                created_at=settings.created_at,
                updated_at=settings.updated_at
            )
        return None

    async def update_utm_settings(self, data: UTMDefaultSettingsBase) -> UTMDefaultSettingsResponse:
        """UTMデフォルト設定を更新."""
        result = await self.db.execute(
            select(UTMDefaultSettings).limit(1)
        )
        settings = result.scalar_one_or_none()

        if settings:
            settings.default_source = data.default_source
            settings.default_medium = data.default_medium
            settings.campaign_naming_rule = data.campaign_naming_rule
        else:
            settings = UTMDefaultSettings(
                default_source=data.default_source,
                default_medium=data.default_medium,
                campaign_naming_rule=data.campaign_naming_rule
            )
            self.db.add(settings)

        await self.db.commit()
        await self.db.refresh(settings)

        return UTMDefaultSettingsResponse(
            id=str(settings.id),
            default_source=settings.default_source,
            default_medium=settings.default_medium,
            campaign_naming_rule=settings.campaign_naming_rule,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )

    async def record_click(self, cta_id: str, video_id: Optional[str] = None,
                          ip_address: Optional[str] = None, user_agent: Optional[str] = None,
                          referrer: Optional[str] = None, utm_params: Optional[dict] = None) -> bool:
        """CTAクリックを記録."""
        result = await self.db.execute(
            select(CTATemplate).where(CTATemplate.id == UUID(cta_id))
        )
        cta = result.scalar_one_or_none()
        if not cta:
            return False

        # クリックログ追加
        click_log = CTAClickLog(
            cta_id=UUID(cta_id),
            video_id=UUID(video_id) if video_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer,
            utm_params=utm_params
        )
        self.db.add(click_log)

        # コンバージョン数更新
        cta.conversion_count += 1

        await self.db.commit()

        logger.info(f"CTA click recorded: {cta_id}")
        return True

    async def get_cta_stats(self, cta_id: str, days: int = 30) -> Optional[CTADetailStats]:
        """CTA詳細統計を取得."""
        result = await self.db.execute(
            select(CTATemplate).where(CTATemplate.id == UUID(cta_id))
        )
        cta = result.scalar_one_or_none()
        if not cta:
            return None

        # 日別クリック数取得
        start_date = datetime.utcnow() - timedelta(days=days)
        click_result = await self.db.execute(
            select(
                func.date(CTAClickLog.clicked_at).label('date'),
                func.count(CTAClickLog.id).label('clicks')
            ).where(
                and_(
                    CTAClickLog.cta_id == UUID(cta_id),
                    CTAClickLog.clicked_at >= start_date
                )
            ).group_by(func.date(CTAClickLog.clicked_at))
            .order_by(func.date(CTAClickLog.clicked_at))
        )
        daily_clicks = click_result.all()

        return CTADetailStats(
            cta_id=cta_id,
            clicks=cta.conversion_count,
            ctr=cta.ctr or 0,
            daily_clicks=[
                CTADailyStats(date=str(row.date), clicks=row.clicks)
                for row in daily_clicks
            ]
        )

    def generate_url_with_utm(self, base_url: str, utm_params: Optional[dict] = None,
                              video_id: Optional[str] = None, cta_type: Optional[str] = None) -> str:
        """UTMパラメータ付きURLを生成."""
        if not utm_params:
            return base_url

        params = []
        if utm_params.get('source'):
            params.append(f"utm_source={utm_params['source']}")
        if utm_params.get('medium'):
            params.append(f"utm_medium={utm_params['medium']}")

        campaign = utm_params.get('campaign', '')
        if video_id and '{video_id}' in campaign:
            campaign = campaign.replace('{video_id}', video_id)
        if cta_type and '{cta_type}' in campaign:
            campaign = campaign.replace('{cta_type}', cta_type)
        if campaign:
            params.append(f"utm_campaign={campaign}")

        if params:
            separator = '&' if '?' in base_url else '?'
            return f"{base_url}{separator}{'&'.join(params)}"
        return base_url

    async def generate_description_with_ctas(
        self, description: str, video_id: str
    ) -> GeneratedDescriptionWithCTA:
        """説明文にCTAを挿入."""
        assignments = await self.get_video_cta_assignments(video_id)

        top_cta_text = None
        bottom_cta_text = None

        if assignments.top_cta:
            cta = assignments.top_cta
            url = self.generate_url_with_utm(
                cta.short_url or cta.url,
                cta.utm_params.model_dump() if cta.utm_params else None,
                video_id,
                cta.type.value
            )
            top_cta_text = cta.display_text.replace(cta.url, url) if cta.url in cta.display_text else f"{cta.display_text}\n{url}"

        if assignments.bottom_cta:
            cta = assignments.bottom_cta
            url = self.generate_url_with_utm(
                cta.short_url or cta.url,
                cta.utm_params.model_dump() if cta.utm_params else None,
                video_id,
                cta.type.value
            )
            bottom_cta_text = cta.display_text.replace(cta.url, url) if cta.url in cta.display_text else f"{cta.display_text}\n{url}"

        # 説明文を組み立て
        parts = []
        if top_cta_text:
            parts.append(top_cta_text)
            parts.append("───────────────")
        parts.append(description)
        if bottom_cta_text:
            parts.append("───────────────")
            parts.append(bottom_cta_text)

        return GeneratedDescriptionWithCTA(
            description="\n\n".join(parts),
            top_cta_text=top_cta_text,
            bottom_cta_text=bottom_cta_text
        )

    async def _generate_short_url(self, url: str) -> Optional[str]:
        """TinyURLで短縮URLを生成."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://tinyurl.com/api-create.php?url={url}",
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.text
        except Exception as e:
            logger.warning(f"Failed to generate short URL: {e}")
        return None

    def _to_response(self, cta: CTATemplate) -> CTAResponse:
        """モデルをレスポンススキーマに変換."""
        return CTAResponse(
            id=str(cta.id),
            name=cta.name,
            type=cta.type.value,
            url=cta.url,
            utm_params=cta.utm_params,
            short_url=cta.short_url,
            display_text=cta.display_text,
            placement=cta.placement.value,
            is_active=cta.is_active,
            conversion_count=cta.conversion_count,
            ctr=cta.ctr,
            created_at=cta.created_at,
            updated_at=cta.updated_at
        )
