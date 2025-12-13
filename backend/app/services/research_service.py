"""
リサーチサービス

リサーチ機能のビジネスロジック
- YouTube Data API連携
- Social Blade API連携
- コメント分析
"""
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import Research, ResearchType
from app.models.user import UserRole
from app.services.external.youtube_api import youtube_api
from app.services.external.serp_api import serp_api
from app.services.external.social_blade_api import social_blade_api
from app.schemas.research import (
    # 競合調査系
    VideoSummary,
    CompetitorChannel,
    CompetitorListResponse,
    PopularVideo,
    PopularVideoListResponse,
    KeywordTrend,
    KeywordTrendListResponse,
    NewsTrend,
    NewsTrendListResponse,
    # コメント分析系
    BookTrend,
    BookTrendListResponse,
    CommentSentiment,
    CommentSentimentResponse,
    CommentKeyword,
    CommentKeywordListResponse,
    NotableComment,
    NotableCommentListResponse,
    # チャンネル分析（Social Blade）
    ChannelHistoryPoint,
    ChannelGrowth,
    ChannelProjection,
    ChannelAnalytics,
    ChannelAnalyticsResponse,
    ChannelComparisonResponse,
)


class ResearchService:
    """リサーチサービス"""

    # ============================================================
    # 権限チェックヘルパー
    # ============================================================

    @staticmethod
    def _check_research_permission(current_user_role: str, action: str):
        """リサーチ機能の権限チェック"""
        if current_user_role not in [UserRole.OWNER.value, UserRole.TEAM.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{action}にはOwnerまたはTeamロールが必要です",
            )

    # ============================================================
    # 競合調査系メソッド（4-A）- YouTube Data API連携
    # ============================================================

    @staticmethod
    async def get_competitors(
        db: AsyncSession,
        current_user_role: str,
        query: Optional[str] = None,
        limit: int = 10,
    ) -> CompetitorListResponse:
        """
        競合チャンネル調査

        YouTube Data API連携（APIキー設定時）
        未設定時はスタブデータを返却
        """
        ResearchService._check_research_permission(current_user_role, "競合チャンネル調査")

        # YouTube APIが利用可能な場合
        if youtube_api.is_available() and query:
            channels = await youtube_api.search_channels(query, max_results=limit)

            if channels:
                result_channels = []
                for ch in channels:
                    # 各チャンネルの最新動画を取得
                    recent_videos_data = await youtube_api.get_channel_videos(
                        ch["channel_id"], max_results=3
                    )

                    recent_videos = [
                        VideoSummary(
                            video_id=v["video_id"],
                            title=v["title"],
                            view_count=v["view_count"],
                            published_at=datetime.fromisoformat(
                                v["published_at"].replace("Z", "+00:00")
                            ) if v.get("published_at") else datetime.utcnow(),
                        )
                        for v in recent_videos_data
                    ]

                    result_channels.append(
                        CompetitorChannel(
                            channel_id=ch["channel_id"],
                            title=ch["title"],
                            subscriber_count=ch["subscriber_count"],
                            video_count=ch["video_count"],
                            recent_videos=recent_videos,
                        )
                    )

                return CompetitorListResponse(data=result_channels, total=len(result_channels))

        # フォールバック: スタブデータ
        stub_channels = [
            CompetitorChannel(
                channel_id="UC_competitor_001",
                title="ビジネス解説チャンネル",
                subscriber_count=150000,
                video_count=320,
                recent_videos=[
                    VideoSummary(
                        video_id="vid_001",
                        title="2025年のビジネストレンド予測",
                        view_count=45000,
                        published_at=datetime.utcnow() - timedelta(days=3),
                    ),
                ],
            ),
            CompetitorChannel(
                channel_id="UC_competitor_002",
                title="マーケティング大学",
                subscriber_count=280000,
                video_count=450,
                recent_videos=[
                    VideoSummary(
                        video_id="vid_002",
                        title="SNSマーケティング完全攻略",
                        view_count=78000,
                        published_at=datetime.utcnow() - timedelta(days=5),
                    ),
                ],
            ),
        ]

        return CompetitorListResponse(data=stub_channels[:limit], total=len(stub_channels))

    @staticmethod
    async def get_popular_videos(
        db: AsyncSession,
        current_user_role: str,
        category: Optional[str] = None,
        limit: int = 20,
    ) -> PopularVideoListResponse:
        """
        人気動画調査

        YouTube Data API連携（APIキー設定時）
        """
        ResearchService._check_research_permission(current_user_role, "人気動画調査")

        # YouTube APIが利用可能な場合
        if youtube_api.is_available():
            videos = await youtube_api.search_popular_videos(
                query=category,
                max_results=limit,
            )

            if videos:
                result_videos = [
                    PopularVideo(
                        video_id=v["video_id"],
                        channel_id=v["channel_id"],
                        channel_title=v["channel_title"],
                        title=v["title"],
                        description=v.get("description", "")[:200],
                        view_count=v["view_count"],
                        like_count=v["like_count"],
                        comment_count=v["comment_count"],
                        published_at=datetime.fromisoformat(
                            v["published_at"].replace("Z", "+00:00")
                        ) if v.get("published_at") else datetime.utcnow(),
                        thumbnail_url=v.get("thumbnail_url"),
                    )
                    for v in videos
                ]

                return PopularVideoListResponse(data=result_videos, total=len(result_videos))

        # フォールバック: スタブデータ
        stub_videos = [
            PopularVideo(
                video_id="popular_001",
                channel_id="UC_popular_ch",
                channel_title="人気チャンネル",
                title="バズった動画タイトル",
                description="視聴者を惹きつける説明文",
                view_count=1500000,
                like_count=85000,
                comment_count=4200,
                published_at=datetime.utcnow() - timedelta(days=7),
                thumbnail_url="https://example.com/thumb.jpg",
            ),
        ]

        return PopularVideoListResponse(data=stub_videos[:limit], total=len(stub_videos))

    @staticmethod
    async def get_keyword_trends(
        db: AsyncSession,
        current_user_role: str,
        query: Optional[str] = None,
        limit: int = 20,
    ) -> KeywordTrendListResponse:
        """
        キーワードトレンド取得

        SerpAPI連携（APIキー設定時）
        未設定時はスタブデータを返却
        """
        ResearchService._check_research_permission(current_user_role, "キーワードトレンド取得")

        # SerpAPIが利用可能な場合
        if serp_api.is_available() and query:
            trends_data = await serp_api.search_google_trends(query)

            if trends_data:
                result_trends = []
                for trend in trends_data[:limit]:
                    # 関連キーワードを取得
                    related = []
                    if trend.get("trend_direction") == "up":
                        # 急上昇キーワードの場合、追加の検索を行う
                        related_data = await serp_api.search_google_trends(trend["keyword"])
                        related = [r["keyword"] for r in related_data[:3] if r["keyword"] != trend["keyword"]]

                    result_trends.append(
                        KeywordTrend(
                            keyword=trend["keyword"],
                            search_volume=trend.get("search_volume", 0),
                            trend_direction=trend.get("trend_direction", "stable"),
                            related_keywords=related or [],
                        )
                    )

                return KeywordTrendListResponse(data=result_trends, total=len(result_trends))

        # フォールバック: スタブデータ
        stub_trends = [
            KeywordTrend(
                keyword="AI動画編集",
                search_volume=12000,
                trend_direction="up",
                related_keywords=["AI サムネイル", "自動字幕", "AI音声"],
            ),
            KeywordTrend(
                keyword="YouTube Shorts",
                search_volume=45000,
                trend_direction="up",
                related_keywords=["ショート動画", "TikTok", "縦型動画"],
            ),
        ]

        return KeywordTrendListResponse(data=stub_trends[:limit], total=len(stub_trends))

    @staticmethod
    async def get_news_trends(
        db: AsyncSession,
        current_user_role: str,
        category: Optional[str] = None,
        limit: int = 20,
    ) -> NewsTrendListResponse:
        """
        ニューストレンド取得

        SerpAPI Google News連携（APIキー設定時）
        未設定時はスタブデータを返却
        """
        ResearchService._check_research_permission(current_user_role, "ニューストレンド取得")

        # SerpAPIが利用可能な場合
        if serp_api.is_available():
            # カテゴリをクエリとして使用
            news_data = await serp_api.search_google_news(
                query=category,
                num_results=limit
            )

            if news_data:
                result_news = []
                for news in news_data:
                    # 日付のパース
                    published_at = datetime.utcnow()
                    if news.get("published_at"):
                        try:
                            # "1 hour ago", "2 days ago" などのフォーマットを処理
                            published_str = news["published_at"]
                            if "hour" in published_str:
                                hours = int(published_str.split()[0])
                                published_at = datetime.utcnow() - timedelta(hours=hours)
                            elif "day" in published_str:
                                days = int(published_str.split()[0])
                                published_at = datetime.utcnow() - timedelta(days=days)
                        except Exception:
                            pass

                    result_news.append(
                        NewsTrend(
                            title=news["title"],
                            source=news["source"],
                            url=news["url"],
                            published_at=published_at,
                            snippet=news.get("snippet", ""),
                            category=category or "一般",
                        )
                    )

                return NewsTrendListResponse(data=result_news, total=len(result_news))

        # フォールバック: スタブデータ
        stub_news = [
            NewsTrend(
                title="YouTube、新しいAI機能を発表",
                source="TechCrunch",
                url="https://techcrunch.com/example",
                published_at=datetime.utcnow() - timedelta(hours=6),
                snippet="YouTubeが新しいAI機能を発表。クリエイターの動画制作を支援...",
                category="テクノロジー",
            ),
        ]

        return NewsTrendListResponse(data=stub_news[:limit], total=len(stub_news))

    # ============================================================
    # コメント分析系メソッド（4-B）- YouTube Comments API連携
    # ============================================================

    @staticmethod
    async def get_book_trends(
        db: AsyncSession,
        current_user_role: str,
        category: Optional[str] = None,
        limit: int = 20,
    ) -> BookTrendListResponse:
        """書籍トレンドを取得（Amazon PA-API連携想定、スタブ実装）"""
        ResearchService._check_research_permission(current_user_role, "書籍トレンド取得")

        # TODO: Amazon PA-API連携実装
        stub_books = [
            BookTrend(
                isbn="978-4-1234-5678-9",
                title="AI時代のビジネス戦略",
                author="山田太郎",
                rank=1,
                category=category or "ビジネス・経済",
                rating=4.5,
                review_count=128,
            ),
            BookTrend(
                isbn="978-4-9876-5432-1",
                title="動画マーケティング完全ガイド",
                author="鈴木花子",
                rank=2,
                category=category or "ビジネス・経済",
                rating=4.3,
                review_count=95,
            ),
            BookTrend(
                isbn="978-4-5555-6666-7",
                title="YouTube成功の法則",
                author="佐藤次郎",
                rank=3,
                category=category or "ビジネス・経済",
                rating=4.2,
                review_count=87,
            ),
        ]

        return BookTrendListResponse(
            data=stub_books[:limit],
            total=len(stub_books),
            category=category,
            search_date=datetime.utcnow().isoformat(),
        )

    @staticmethod
    async def get_comment_sentiment(
        db: AsyncSession,
        current_user_role: str,
        video_id: str,
    ) -> CommentSentimentResponse:
        """
        コメント感情分析を取得

        YouTube Comments API連携 + 簡易感情分析
        """
        ResearchService._check_research_permission(current_user_role, "コメント感情分析")

        # YouTube APIが利用可能な場合、実際のコメントを取得して分析
        if youtube_api.is_available():
            comments = await youtube_api.get_video_comments(video_id, max_results=100)

            if comments:
                # 簡易感情分析（ポジティブ/ネガティブワードによる分類）
                positive_words = ["最高", "素晴らしい", "わかりやすい", "ありがとう", "参考", "いい", "良い", "すごい"]
                negative_words = ["わからない", "つまらない", "悪い", "残念", "改善", "聞き取れない"]

                positive_comments = []
                negative_comments = []
                neutral_count = 0

                for comment in comments:
                    text = comment["text"]
                    is_positive = any(w in text for w in positive_words)
                    is_negative = any(w in text for w in negative_words)

                    if is_positive and not is_negative:
                        positive_comments.append(text)
                    elif is_negative and not is_positive:
                        negative_comments.append(text)
                    else:
                        neutral_count += 1

                total = len(comments)
                pos_count = len(positive_comments)
                neg_count = len(negative_comments)

                sentiment = CommentSentiment(
                    video_id=video_id,
                    positive_ratio=round(pos_count / total, 2) if total > 0 else 0,
                    negative_ratio=round(neg_count / total, 2) if total > 0 else 0,
                    neutral_ratio=round(neutral_count / total, 2) if total > 0 else 0,
                    sample_positive=positive_comments[:3],
                    sample_negative=negative_comments[:2],
                )

                return CommentSentimentResponse(
                    sentiment=sentiment,
                    total_comments_analyzed=total,
                    analyzed_at=datetime.utcnow().isoformat(),
                )

        # フォールバック: スタブデータ
        sentiment = CommentSentiment(
            video_id=video_id,
            positive_ratio=0.68,
            negative_ratio=0.12,
            neutral_ratio=0.20,
            sample_positive=[
                "とても参考になりました！",
                "わかりやすい説明ありがとうございます",
                "チャンネル登録しました",
            ],
            sample_negative=[
                "音声が小さくて聞き取りづらいです",
                "情報が古いと思います",
            ],
        )

        return CommentSentimentResponse(
            sentiment=sentiment,
            total_comments_analyzed=250,
            analyzed_at=datetime.utcnow().isoformat(),
        )

    @staticmethod
    async def get_comment_keywords(
        db: AsyncSession,
        current_user_role: str,
        video_id: str,
        limit: int = 20,
    ) -> CommentKeywordListResponse:
        """
        コメントキーワード抽出

        YouTube Comments API連携 + 簡易キーワード抽出
        """
        ResearchService._check_research_permission(current_user_role, "コメントキーワード抽出")

        # YouTube APIが利用可能な場合
        if youtube_api.is_available():
            comments = await youtube_api.get_video_comments(video_id, max_results=100)

            if comments:
                # 簡易キーワード抽出（頻出単語カウント）
                from collections import Counter
                import re

                all_text = " ".join([c["text"] for c in comments])
                # 簡易トークン化（日本語対応）
                words = re.findall(r'[a-zA-Z]+|[ぁ-んァ-ン一-龥]+', all_text)
                # 2文字以上の単語のみ
                words = [w for w in words if len(w) >= 2]
                word_counts = Counter(words).most_common(limit)

                keywords = [
                    CommentKeyword(
                        keyword=word,
                        frequency=count,
                        sentiment="neutral",
                        context_samples=[
                            c["text"][:100] for c in comments
                            if word in c["text"]
                        ][:2],
                    )
                    for word, count in word_counts
                ]

                return CommentKeywordListResponse(
                    data=keywords,
                    total_keywords=len(keywords),
                    video_id=video_id,
                    analyzed_at=datetime.utcnow().isoformat(),
                )

        # フォールバック: スタブデータ
        stub_keywords = [
            CommentKeyword(
                keyword="AI",
                frequency=45,
                sentiment="positive",
                context_samples=[
                    "AIの活用方法がよくわかりました",
                    "AI時代に必要なスキルですね",
                ],
            ),
            CommentKeyword(
                keyword="わかりやすい",
                frequency=32,
                sentiment="positive",
                context_samples=[
                    "とてもわかりやすい解説でした",
                    "初心者にもわかりやすい内容",
                ],
            ),
        ]

        return CommentKeywordListResponse(
            data=stub_keywords[:limit],
            total_keywords=len(stub_keywords),
            video_id=video_id,
            analyzed_at=datetime.utcnow().isoformat(),
        )

    @staticmethod
    async def get_notable_comments(
        db: AsyncSession,
        current_user_role: str,
        video_id: str,
        limit: int = 20,
    ) -> NotableCommentListResponse:
        """
        注目コメントを取得

        YouTube Comments API連携
        """
        ResearchService._check_research_permission(current_user_role, "注目コメント取得")

        # YouTube APIが利用可能な場合
        if youtube_api.is_available():
            comments = await youtube_api.get_video_comments(video_id, max_results=limit)

            if comments:
                # いいね数でソートして上位を返す
                sorted_comments = sorted(
                    comments,
                    key=lambda x: x.get("like_count", 0),
                    reverse=True
                )[:limit]

                result_comments = [
                    NotableComment(
                        comment_id=c["comment_id"],
                        text=c["text"],
                        like_count=c["like_count"],
                        author=c["author"],
                        published_at=datetime.fromisoformat(
                            c["published_at"].replace("Z", "+00:00")
                        ) if c.get("published_at") else datetime.utcnow(),
                        category="praise" if c["like_count"] > 50 else "general",
                    )
                    for c in sorted_comments
                ]

                return NotableCommentListResponse(
                    data=result_comments,
                    total=len(result_comments),
                    video_id=video_id,
                    fetched_at=datetime.utcnow().isoformat(),
                )

        # フォールバック: スタブデータ
        stub_comments = [
            NotableComment(
                comment_id="comment_001",
                text="この動画の内容を実践したら、本当に成果が出ました！",
                like_count=256,
                author="山田太郎",
                published_at=datetime(2025, 12, 10, 10, 30, 0),
                category="praise",
            ),
            NotableComment(
                comment_id="comment_002",
                text="動画の7分25秒あたりで説明されているツールの使い方がよくわかりませんでした。",
                like_count=124,
                author="鈴木花子",
                published_at=datetime(2025, 12, 10, 14, 15, 0),
                category="question",
            ),
        ]

        return NotableCommentListResponse(
            data=stub_comments[:limit],
            total=len(stub_comments),
            video_id=video_id,
            fetched_at=datetime.utcnow().isoformat(),
        )

    # ============================================================
    # チャンネル分析系メソッド（Social Blade連携）
    # ============================================================

    @staticmethod
    async def get_channel_analytics(
        db: AsyncSession,
        current_user_role: str,
        channel_id: str,
        include_history: bool = True,
        history_days: int = 30,
    ) -> ChannelAnalyticsResponse:
        """
        チャンネル分析データを取得（Social Blade連携）

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            channel_id: YouTubeチャンネルID
            include_history: 履歴データを含めるか
            history_days: 履歴データの日数

        Returns:
            ChannelAnalyticsResponse: チャンネル分析データ
        """
        ResearchService._check_research_permission(current_user_role, "チャンネル分析")

        # Social Blade APIが利用可能な場合
        if social_blade_api.is_available():
            # 基本統計を取得
            stats = await social_blade_api.get_youtube_channel_stats(channel_id)

            if "error" not in stats:
                # 成長率データを取得
                growth_data = await social_blade_api.get_youtube_channel_growth(channel_id)
                growth = None
                if "error" not in growth_data:
                    growth = ChannelGrowth(
                        channel_id=channel_id,
                        subscriber_growth_30d=growth_data.get("subscriber_growth_30d", 0),
                        subscriber_growth_14d=growth_data.get("subscriber_growth_14d", 0),
                        subscriber_growth_7d=growth_data.get("subscriber_growth_7d", 0),
                        views_growth_30d=growth_data.get("views_growth_30d", 0),
                        views_growth_14d=growth_data.get("views_growth_14d", 0),
                        views_growth_7d=growth_data.get("views_growth_7d", 0),
                        avg_daily_subs=growth_data.get("avg_daily_subs", 0),
                        avg_daily_views=growth_data.get("avg_daily_views", 0),
                    )

                # 将来予測を取得
                proj_data = await social_blade_api.get_youtube_future_projections(channel_id)
                projection = None
                if "error" not in proj_data:
                    projection = ChannelProjection(
                        channel_id=channel_id,
                        projected_subs_1_year=proj_data.get("projected_subs_1_year", 0),
                        projected_subs_5_years=proj_data.get("projected_subs_5_years", 0),
                        projected_views_1_year=proj_data.get("projected_views_1_year", 0),
                        projected_views_5_years=proj_data.get("projected_views_5_years", 0),
                        estimated_monthly_earnings_min=proj_data.get("estimated_monthly_earnings_min", 0),
                        estimated_monthly_earnings_max=proj_data.get("estimated_monthly_earnings_max", 0),
                        estimated_yearly_earnings_min=proj_data.get("estimated_yearly_earnings_min", 0),
                        estimated_yearly_earnings_max=proj_data.get("estimated_yearly_earnings_max", 0),
                    )

                # 履歴データを取得
                history = []
                if include_history:
                    history_data = await social_blade_api.get_youtube_channel_history(
                        channel_id, days=history_days
                    )
                    history = [
                        ChannelHistoryPoint(
                            date=h.get("date", ""),
                            subscriber_count=h.get("subscriber_count", 0),
                            subscriber_change=h.get("subscriber_change", 0),
                        )
                        for h in history_data
                    ]

                analytics = ChannelAnalytics(
                    channel_id=channel_id,
                    username=stats.get("username"),
                    subscriber_count=stats.get("subscriber_count", 0),
                    video_count=stats.get("video_count", 0),
                    total_views=stats.get("total_views", 0),
                    grade=stats.get("grade"),
                    subscriber_rank=stats.get("subscriber_rank", 0),
                    video_views_rank=stats.get("video_views_rank", 0),
                    country_rank=stats.get("country_rank", 0),
                    growth=growth,
                    projection=projection,
                    history=history,
                )

                return ChannelAnalyticsResponse(
                    data=analytics,
                    fetched_at=datetime.utcnow().isoformat(),
                )

        # フォールバック: スタブデータ
        stub_analytics = ChannelAnalytics(
            channel_id=channel_id,
            username="sample_channel",
            subscriber_count=150000,
            video_count=320,
            total_views=25000000,
            grade="B+",
            subscriber_rank=45000,
            video_views_rank=38000,
            country_rank=1200,
            growth=ChannelGrowth(
                channel_id=channel_id,
                subscriber_growth_30d=5000,
                subscriber_growth_14d=2200,
                subscriber_growth_7d=1100,
                views_growth_30d=500000,
                views_growth_14d=220000,
                views_growth_7d=110000,
                avg_daily_subs=166,
                avg_daily_views=16666,
            ),
            projection=ChannelProjection(
                channel_id=channel_id,
                projected_subs_1_year=210000,
                projected_subs_5_years=450000,
                projected_views_1_year=50000000,
                projected_views_5_years=150000000,
                estimated_monthly_earnings_min=500,
                estimated_monthly_earnings_max=8000,
                estimated_yearly_earnings_min=6000,
                estimated_yearly_earnings_max=96000,
            ),
            history=[
                ChannelHistoryPoint(
                    date=(datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"),
                    subscriber_count=150000 - (i * 166),
                    subscriber_change=166 if i > 0 else 0,
                )
                for i in range(min(history_days, 30))
            ],
        )

        return ChannelAnalyticsResponse(
            data=stub_analytics,
            fetched_at=datetime.utcnow().isoformat(),
        )

    @staticmethod
    async def compare_channels(
        db: AsyncSession,
        current_user_role: str,
        channel_ids: List[str],
    ) -> ChannelComparisonResponse:
        """
        複数チャンネルを比較

        Args:
            db: データベースセッション
            current_user_role: 実行者のロール
            channel_ids: 比較するチャンネルIDリスト

        Returns:
            ChannelComparisonResponse: 比較結果
        """
        ResearchService._check_research_permission(current_user_role, "チャンネル比較")

        results = []

        # Social Blade APIが利用可能な場合
        if social_blade_api.is_available():
            comparison_data = await social_blade_api.compare_channels(channel_ids)

            for ch_data in comparison_data:
                if "error" not in ch_data:
                    growth_data = ch_data.get("growth", {})
                    growth = None
                    if growth_data and "error" not in growth_data:
                        growth = ChannelGrowth(
                            channel_id=ch_data.get("channel_id", ""),
                            subscriber_growth_30d=growth_data.get("subscriber_growth_30d", 0),
                            subscriber_growth_14d=growth_data.get("subscriber_growth_14d", 0),
                            subscriber_growth_7d=growth_data.get("subscriber_growth_7d", 0),
                            views_growth_30d=growth_data.get("views_growth_30d", 0),
                            views_growth_14d=growth_data.get("views_growth_14d", 0),
                            views_growth_7d=growth_data.get("views_growth_7d", 0),
                            avg_daily_subs=growth_data.get("avg_daily_subs", 0),
                            avg_daily_views=growth_data.get("avg_daily_views", 0),
                        )

                    results.append(ChannelAnalytics(
                        channel_id=ch_data.get("channel_id", ""),
                        username=ch_data.get("username"),
                        subscriber_count=ch_data.get("subscriber_count", 0),
                        video_count=ch_data.get("video_count", 0),
                        total_views=ch_data.get("total_views", 0),
                        grade=ch_data.get("grade"),
                        subscriber_rank=ch_data.get("subscriber_rank", 0),
                        video_views_rank=ch_data.get("video_views_rank", 0),
                        country_rank=ch_data.get("country_rank", 0),
                        growth=growth,
                    ))

        # フォールバック: スタブデータ
        if not results:
            for idx, ch_id in enumerate(channel_ids[:5]):
                results.append(ChannelAnalytics(
                    channel_id=ch_id,
                    username=f"channel_{idx + 1}",
                    subscriber_count=100000 + (idx * 50000),
                    video_count=200 + (idx * 100),
                    total_views=10000000 + (idx * 5000000),
                    grade=["A", "A-", "B+", "B", "B-"][idx],
                    subscriber_rank=50000 - (idx * 10000),
                    video_views_rank=40000 - (idx * 8000),
                    country_rank=1500 - (idx * 300),
                    growth=ChannelGrowth(
                        channel_id=ch_id,
                        subscriber_growth_30d=3000 + (idx * 1000),
                        subscriber_growth_14d=1400 + (idx * 500),
                        subscriber_growth_7d=700 + (idx * 250),
                        views_growth_30d=300000 + (idx * 100000),
                        views_growth_14d=140000 + (idx * 50000),
                        views_growth_7d=70000 + (idx * 25000),
                        avg_daily_subs=100 + (idx * 33),
                        avg_daily_views=10000 + (idx * 3333),
                    ),
                ))

        return ChannelComparisonResponse(
            data=results,
            total=len(results),
            compared_at=datetime.utcnow().isoformat(),
        )
