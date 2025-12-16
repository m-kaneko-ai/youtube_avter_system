"""
リサーチ機能エンドポイント

競合調査・トレンド分析・コメント分析のAPIエンドポイント
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_user_id_dev as get_current_user_id, get_current_user_role_dev as get_current_user_role
from app.schemas.research import (
    CompetitorListResponse,
    PopularVideoListResponse,
    KeywordTrendListResponse,
    NewsTrendListResponse,
    BookTrendListResponse,
    CommentSentimentResponse,
    CommentKeywordListResponse,
    NotableCommentListResponse,
    # Social Blade
    ChannelAnalyticsResponse,
    ChannelComparisonResponse,
)
from app.services.research_service import ResearchService

router = APIRouter()


# ============================================================
# 競合調査系エンドポイント（4-A）
# ============================================================

@router.get(
    "/competitors",
    response_model=CompetitorListResponse,
    summary="競合チャンネル調査",
    description="指定されたキーワードに関連する競合チャンネルを調査します。",
)
async def get_competitors(
    query: Optional[str] = Query(None, description="検索キーワード"),
    limit: int = Query(10, ge=1, le=50, description="取得件数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> CompetitorListResponse:
    """競合チャンネル調査エンドポイント"""
    return await ResearchService.get_competitors(db, current_user_role, query, limit)


@router.get(
    "/popular-videos",
    response_model=PopularVideoListResponse,
    summary="人気動画調査",
    description="カテゴリ内の人気動画を調査します。",
)
async def get_popular_videos(
    category: Optional[str] = Query(None, description="カテゴリ"),
    limit: int = Query(20, ge=1, le=50, description="取得件数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> PopularVideoListResponse:
    """人気動画調査エンドポイント"""
    return await ResearchService.get_popular_videos(db, current_user_role, category, limit)


@router.get(
    "/trends/keywords",
    response_model=KeywordTrendListResponse,
    summary="キーワードトレンド",
    description="検索キーワードのトレンド情報を取得します。",
)
async def get_keyword_trends(
    query: Optional[str] = Query(None, description="検索キーワード"),
    limit: int = Query(20, ge=1, le=50, description="取得件数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> KeywordTrendListResponse:
    """キーワードトレンドエンドポイント"""
    return await ResearchService.get_keyword_trends(db, current_user_role, query, limit)


@router.get(
    "/trends/news",
    response_model=NewsTrendListResponse,
    summary="ニューストレンド",
    description="最新ニュースのトレンド情報を取得します。",
)
async def get_news_trends(
    category: Optional[str] = Query(None, description="ニュースカテゴリ"),
    limit: int = Query(20, ge=1, le=50, description="取得件数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> NewsTrendListResponse:
    """ニューストレンドエンドポイント"""
    return await ResearchService.get_news_trends(db, current_user_role, category, limit)


# ============================================================
# コメント分析系エンドポイント（4-B）
# ============================================================

@router.get(
    "/trends/books",
    response_model=BookTrendListResponse,
    summary="書籍トレンド",
    description="書籍ランキング・トレンド情報を取得します。",
)
async def get_book_trends(
    category: Optional[str] = Query(None, description="書籍カテゴリ"),
    limit: int = Query(20, ge=1, le=50, description="取得件数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> BookTrendListResponse:
    """書籍トレンドエンドポイント"""
    return await ResearchService.get_book_trends(db, current_user_role, category, limit)


@router.get(
    "/comments/sentiment",
    response_model=CommentSentimentResponse,
    summary="コメント感情分析",
    description="指定動画のコメントの感情分析を行います。",
)
async def get_comment_sentiment(
    video_id: str = Query(..., description="YouTube動画ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> CommentSentimentResponse:
    """コメント感情分析エンドポイント"""
    return await ResearchService.get_comment_sentiment(db, current_user_role, video_id)


@router.get(
    "/comments/keywords",
    response_model=CommentKeywordListResponse,
    summary="コメントキーワード抽出",
    description="指定動画のコメントから頻出キーワードを抽出します。",
)
async def get_comment_keywords(
    video_id: str = Query(..., description="YouTube動画ID"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> CommentKeywordListResponse:
    """コメントキーワード抽出エンドポイント"""
    return await ResearchService.get_comment_keywords(db, current_user_role, video_id, limit)


@router.get(
    "/comments/notable",
    response_model=NotableCommentListResponse,
    summary="注目コメント取得",
    description="指定動画の注目コメント（質問、称賛、批判、提案）を取得します。",
)
async def get_notable_comments(
    video_id: str = Query(..., description="YouTube動画ID"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> NotableCommentListResponse:
    """注目コメント取得エンドポイント"""
    return await ResearchService.get_notable_comments(db, current_user_role, video_id, limit)


# ============================================================
# チャンネル分析系エンドポイント（Social Blade連携）
# ============================================================

@router.get(
    "/channel/analytics",
    response_model=ChannelAnalyticsResponse,
    summary="チャンネル分析",
    description="Social Bladeを使用してYouTubeチャンネルの詳細分析データを取得します。",
)
async def get_channel_analytics(
    channel_id: str = Query(..., description="YouTubeチャンネルID"),
    include_history: bool = Query(True, description="履歴データを含めるか"),
    history_days: int = Query(30, ge=7, le=180, description="履歴データの日数"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ChannelAnalyticsResponse:
    """チャンネル分析エンドポイント"""
    return await ResearchService.get_channel_analytics(
        db, current_user_role, channel_id, include_history, history_days
    )


@router.get(
    "/channel/compare",
    response_model=ChannelComparisonResponse,
    summary="チャンネル比較",
    description="複数のYouTubeチャンネルを比較分析します。",
)
async def compare_channels(
    channel_ids: List[str] = Query(..., description="比較するチャンネルIDリスト（最大5件）"),
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id),
    current_user_role: str = Depends(get_current_user_role),
) -> ChannelComparisonResponse:
    """チャンネル比較エンドポイント"""
    return await ResearchService.compare_channels(db, current_user_role, channel_ids[:5])
