"""
コンテンツ複利戦略サービス

ショート動画から長尺動画への誘導、シリーズ間の相互リンクを最適化し、
視聴者のエンゲージメントを最大化する
"""
from datetime import date, timedelta
from uuid import UUID
from typing import Optional
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content_compound import ContentLink, ContentCluster, CompoundMetrics, LinkType
from app.models.project import Video, VideoStatus
from app.models.analytics import VideoAnalytics
from app.models.knowledge import Knowledge


class CompoundStrategyService:
    """複利戦略サービス"""

    async def analyze_content_network(self, knowledge_id: UUID, db: AsyncSession) -> dict:
        """
        コンテンツネットワーク分析

        Args:
            knowledge_id: ナレッジID
            db: DBセッション

        Returns:
            ネットワーク分析結果
        """
        # ナレッジに紐づく動画を取得
        stmt = (
            select(Video)
            .join(Video.project)
            .where(
                Video.project.has(knowledge_id=knowledge_id),
                Video.status == VideoStatus.PUBLISHED
            )
        )
        result = await db.execute(stmt)
        videos = result.scalars().all()

        # リンク情報を取得
        video_ids = [v.id for v in videos]
        link_stmt = select(ContentLink).where(ContentLink.source_video_id.in_(video_ids))
        link_result = await db.execute(link_stmt)
        links = link_result.scalars().all()

        # ノード（動画）とエッジ（リンク）を構築
        nodes = []
        for video in videos:
            # 動画の分析データを取得
            analytics_stmt = (
                select(VideoAnalytics)
                .where(VideoAnalytics.video_id == video.id)
                .order_by(desc(VideoAnalytics.date))
                .limit(1)
            )
            analytics_result = await db.execute(analytics_stmt)
            analytics = analytics_result.scalar_one_or_none()

            # 流入・流出数を計算
            inbound_count = sum(1 for link in links if link.target_video_id == video.id)
            outbound_count = sum(1 for link in links if link.source_video_id == video.id)

            nodes.append({
                "id": str(video.id),
                "title": video.title,
                "views": analytics.views if analytics else 0,
                "watch_time": analytics.avg_watch_time if analytics else 0,
                "inbound_count": inbound_count,
                "outbound_count": outbound_count,
            })

        edges = [
            {
                "source": str(link.source_video_id),
                "target": str(link.target_video_id),
                "type": link.link_type.value,
                "clicks": link.click_count,
                "conversion_rate": link.conversion_rate,
            }
            for link in links
        ]

        # ネットワーク統計
        total_links = len(links)
        total_clicks = sum(link.click_count for link in links)
        avg_conversion = sum(link.conversion_rate for link in links) / total_links if total_links > 0 else 0.0

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_videos": len(videos),
                "total_links": total_links,
                "total_clicks": total_clicks,
                "avg_conversion_rate": round(avg_conversion, 2),
            },
        }

    async def suggest_optimal_links(self, video_id: UUID, db: AsyncSession, limit: int = 5) -> list[dict]:
        """
        最適なリンク先を提案

        Args:
            video_id: ソース動画ID
            db: DBセッション
            limit: 提案数

        Returns:
            リンク提案リスト
        """
        # ソース動画を取得
        stmt = select(Video).where(Video.id == video_id)
        result = await db.execute(stmt)
        source_video = result.scalar_one_or_none()

        if not source_video:
            return []

        # 同じナレッジ・プロジェクトの動画を取得（自分以外）
        candidates_stmt = (
            select(Video, VideoAnalytics)
            .outerjoin(VideoAnalytics, and_(
                VideoAnalytics.video_id == Video.id,
                VideoAnalytics.date == date.today() - timedelta(days=1)
            ))
            .where(
                Video.project_id == source_video.project_id,
                Video.id != video_id,
                Video.status == VideoStatus.PUBLISHED
            )
            .order_by(desc(VideoAnalytics.views))
            .limit(limit * 2)  # 多めに取得してスコアリング
        )
        candidates_result = await db.execute(candidates_stmt)
        candidates = candidates_result.all()

        # スコアリング
        suggestions = []
        for video, analytics in candidates:
            # 既存リンクを確認
            existing_link_stmt = select(ContentLink).where(
                ContentLink.source_video_id == video_id,
                ContentLink.target_video_id == video.id
            )
            existing_result = await db.execute(existing_link_stmt)
            existing_link = existing_result.scalar_one_or_none()

            if existing_link:
                continue  # 既にリンク済み

            # スコア計算
            views = analytics.views if analytics else 0
            retention = analytics.avg_retention if analytics else 0
            engagement_rate = analytics.engagement_rate if analytics else 0

            score = (views * 0.4) + (retention * 0.3) + (engagement_rate * 0.3)

            suggestions.append({
                "video_id": str(video.id),
                "title": video.title,
                "views": views,
                "retention": round(retention, 2),
                "engagement_rate": round(engagement_rate, 2),
                "score": round(score, 2),
                "reason": self._generate_link_reason(views, retention, engagement_rate),
            })

        # スコア降順でソート
        suggestions.sort(key=lambda x: x["score"], reverse=True)
        return suggestions[:limit]

    def _generate_link_reason(self, views: int, retention: float, engagement_rate: float) -> str:
        """リンク提案の理由を生成"""
        reasons = []
        if views > 10000:
            reasons.append("高再生数")
        if retention > 60:
            reasons.append("高維持率")
        if engagement_rate > 5:
            reasons.append("高エンゲージメント")

        return "、".join(reasons) if reasons else "関連性が高い"

    async def calculate_compound_effect(self, video_id: UUID, db: AsyncSession) -> dict:
        """
        複利効果を計算

        Args:
            video_id: 動画ID
            db: DBセッション

        Returns:
            複利効果データ
        """
        # 直近30日の複利メトリクスを取得
        start_date = date.today() - timedelta(days=30)
        stmt = (
            select(CompoundMetrics)
            .where(
                CompoundMetrics.video_id == video_id,
                CompoundMetrics.date >= start_date
            )
            .order_by(CompoundMetrics.date)
        )
        result = await db.execute(stmt)
        metrics = result.scalars().all()

        if not metrics:
            return {
                "total_referral_views": 0,
                "total_referral_watch_time": 0,
                "total_outbound_clicks": 0,
                "avg_compound_score": 0,
                "trend": [],
            }

        # 集計
        total_referral_views = sum(m.referral_views for m in metrics)
        total_referral_watch_time = sum(m.referral_watch_time for m in metrics)
        total_outbound_clicks = sum(m.outbound_clicks for m in metrics)
        avg_compound_score = sum(m.compound_score for m in metrics) / len(metrics)

        # トレンドデータ
        trend = [
            {
                "date": str(m.date),
                "referral_views": m.referral_views,
                "compound_score": round(m.compound_score, 2),
            }
            for m in metrics
        ]

        return {
            "total_referral_views": total_referral_views,
            "total_referral_watch_time": round(total_referral_watch_time, 2),
            "total_outbound_clicks": total_outbound_clicks,
            "avg_compound_score": round(avg_compound_score, 2),
            "trend": trend,
        }

    async def generate_cross_promotion_plan(self, cluster_id: UUID, db: AsyncSession) -> dict:
        """
        クロスプロモーション計画を生成

        Args:
            cluster_id: クラスターID
            db: DBセッション

        Returns:
            クロスプロモーション計画
        """
        # クラスター情報を取得
        stmt = select(ContentCluster).where(ContentCluster.id == cluster_id)
        result = await db.execute(stmt)
        cluster = result.scalar_one_or_none()

        if not cluster:
            return {}

        # クラスター内の動画を取得
        video_ids = cluster.video_ids
        videos_stmt = select(Video).where(Video.id.in_(video_ids))
        videos_result = await db.execute(videos_stmt)
        videos = videos_result.scalars().all()

        # 各動画のパフォーマンスを取得
        video_performance = []
        for video in videos:
            analytics_stmt = (
                select(VideoAnalytics)
                .where(VideoAnalytics.video_id == video.id)
                .order_by(desc(VideoAnalytics.date))
                .limit(1)
            )
            analytics_result = await db.execute(analytics_stmt)
            analytics = analytics_result.scalar_one_or_none()

            video_performance.append({
                "video_id": str(video.id),
                "title": video.title,
                "views": analytics.views if analytics else 0,
                "retention": analytics.avg_retention if analytics else 0,
            })

        # パフォーマンス順にソート
        video_performance.sort(key=lambda x: x["views"], reverse=True)

        # リンク戦略を生成
        high_performer = video_performance[0] if video_performance else None
        low_performers = video_performance[1:] if len(video_performance) > 1 else []

        plan = {
            "cluster_name": cluster.name,
            "total_videos": len(videos),
            "strategy": "high_to_low",
            "high_performer": high_performer,
            "link_recommendations": [],
        }

        # 高パフォーマンス動画から低パフォーマンス動画へのリンクを提案
        if high_performer and low_performers:
            for low_perf in low_performers[:3]:  # 上位3つ
                plan["link_recommendations"].append({
                    "from": high_performer["video_id"],
                    "from_title": high_performer["title"],
                    "to": low_perf["video_id"],
                    "to_title": low_perf["title"],
                    "link_type": "end_screen",
                    "reason": f"高再生数動画（{high_performer['views']:,}回）から低再生動画へ誘導",
                })

        return plan

    async def create_content_link(
        self,
        source_video_id: UUID,
        target_video_id: UUID,
        link_type: LinkType,
        position_seconds: Optional[int],
        db: AsyncSession
    ) -> ContentLink:
        """
        コンテンツリンクを作成

        Args:
            source_video_id: ソース動画ID
            target_video_id: ターゲット動画ID
            link_type: リンクタイプ
            position_seconds: 挿入位置（秒）
            db: DBセッション

        Returns:
            作成されたリンク
        """
        link = ContentLink(
            source_video_id=source_video_id,
            target_video_id=target_video_id,
            link_type=link_type,
            position_seconds=position_seconds,
        )
        db.add(link)
        await db.commit()
        await db.refresh(link)
        return link

    async def get_clusters_by_knowledge(self, knowledge_id: UUID, db: AsyncSession) -> list[ContentCluster]:
        """
        ナレッジIDでクラスターを取得

        Args:
            knowledge_id: ナレッジID
            db: DBセッション

        Returns:
            クラスターリスト
        """
        stmt = select(ContentCluster).where(ContentCluster.knowledge_id == knowledge_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())
