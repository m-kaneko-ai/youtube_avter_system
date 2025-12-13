"""
リサーチスキーマ

Pydanticスキーマによるリサーチ機能のリクエスト/レスポンス型定義
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# 書籍トレンド関連スキーマ

class BookTrend(BaseModel):
    """書籍トレンド"""
    isbn: str = Field(..., description="ISBN")
    title: str = Field(..., description="書籍タイトル")
    author: str = Field(..., description="著者")
    rank: int = Field(..., description="ランキング順位")
    category: str = Field(..., description="カテゴリ")
    rating: float = Field(..., description="評価（0.0-5.0）")
    review_count: int = Field(..., description="レビュー数")


class BookTrendListResponse(BaseModel):
    """書籍トレンド一覧レスポンス"""
    data: list[BookTrend] = Field(..., description="書籍トレンドデータ")
    total: int = Field(..., description="総件数")
    category: Optional[str] = Field(None, description="検索カテゴリ")
    search_date: str = Field(..., description="検索実施日時（ISO形式）")


# コメント感情分析関連スキーマ

class CommentSentiment(BaseModel):
    """コメント感情分析"""
    video_id: str = Field(..., description="動画ID")
    positive_ratio: float = Field(..., description="ポジティブ比率（0.0-1.0）")
    negative_ratio: float = Field(..., description="ネガティブ比率（0.0-1.0）")
    neutral_ratio: float = Field(..., description="中立比率（0.0-1.0）")
    sample_positive: list[str] = Field(..., description="ポジティブコメントサンプル")
    sample_negative: list[str] = Field(..., description="ネガティブコメントサンプル")


class CommentSentimentResponse(BaseModel):
    """コメント感情分析レスポンス"""
    sentiment: CommentSentiment = Field(..., description="感情分析結果")
    total_comments_analyzed: int = Field(..., description="分析対象コメント数")
    analyzed_at: str = Field(..., description="分析実施日時（ISO形式）")


# コメントキーワード抽出関連スキーマ

class CommentKeyword(BaseModel):
    """コメントキーワード"""
    keyword: str = Field(..., description="キーワード")
    frequency: int = Field(..., description="出現頻度")
    sentiment: str = Field(..., description="感情（positive/negative/neutral）")
    context_samples: list[str] = Field(..., description="文脈サンプル")


class CommentKeywordListResponse(BaseModel):
    """コメントキーワード一覧レスポンス"""
    data: list[CommentKeyword] = Field(..., description="キーワードデータ")
    total_keywords: int = Field(..., description="抽出キーワード総数")
    video_id: str = Field(..., description="動画ID")
    analyzed_at: str = Field(..., description="分析実施日時（ISO形式）")


# 注目コメント関連スキーマ

class NotableComment(BaseModel):
    """注目コメント"""
    comment_id: str = Field(..., description="コメントID")
    text: str = Field(..., description="コメント本文")
    like_count: int = Field(..., description="いいね数")
    author: str = Field(..., description="投稿者")
    published_at: datetime = Field(..., description="投稿日時")
    category: str = Field(..., description="カテゴリ（question/praise/criticism/suggestion）")


class NotableCommentListResponse(BaseModel):
    """注目コメント一覧レスポンス"""
    data: list[NotableComment] = Field(..., description="注目コメントデータ")
    total: int = Field(..., description="総件数")
    video_id: str = Field(..., description="動画ID")
    fetched_at: str = Field(..., description="取得日時（ISO形式）")


# ============================================================
# 競合チャンネル調査
# ============================================================

class VideoSummary(BaseModel):
    """動画サマリー"""
    video_id: str = Field(..., description="動画ID")
    title: str = Field(..., description="タイトル")
    view_count: int = Field(..., description="再生回数")
    published_at: datetime = Field(..., description="公開日時")


class CompetitorChannel(BaseModel):
    """競合チャンネル情報"""
    channel_id: str = Field(..., description="チャンネルID")
    title: str = Field(..., description="チャンネル名")
    subscriber_count: int = Field(..., description="登録者数")
    video_count: int = Field(..., description="動画数")
    recent_videos: list[VideoSummary] = Field(..., description="最近の動画")


class CompetitorListResponse(BaseModel):
    """競合チャンネル一覧レスポンス"""
    data: list[CompetitorChannel] = Field(..., description="競合チャンネルリスト")
    total: int = Field(..., description="総件数")


# ============================================================
# 人気動画調査
# ============================================================

class PopularVideo(BaseModel):
    """人気動画情報"""
    video_id: str = Field(..., description="動画ID")
    channel_id: str = Field(..., description="チャンネルID")
    channel_title: str = Field(..., description="チャンネル名")
    title: str = Field(..., description="動画タイトル")
    description: Optional[str] = Field(None, description="動画説明")
    view_count: int = Field(..., description="再生回数")
    like_count: int = Field(..., description="高評価数")
    comment_count: int = Field(..., description="コメント数")
    published_at: datetime = Field(..., description="公開日時")
    thumbnail_url: Optional[str] = Field(None, description="サムネイルURL")


class PopularVideoListResponse(BaseModel):
    """人気動画一覧レスポンス"""
    data: list[PopularVideo] = Field(..., description="人気動画リスト")
    total: int = Field(..., description="総件数")


# ============================================================
# キーワードトレンド
# ============================================================

class KeywordTrend(BaseModel):
    """キーワードトレンド情報"""
    keyword: str = Field(..., description="キーワード")
    search_volume: int = Field(..., description="検索ボリューム")
    trend_direction: str = Field(
        ...,
        description="トレンド方向（up/down/stable）",
        pattern="^(up|down|stable)$"
    )
    related_keywords: list[str] = Field(..., description="関連キーワード")


class KeywordTrendListResponse(BaseModel):
    """キーワードトレンド一覧レスポンス"""
    data: list[KeywordTrend] = Field(..., description="キーワードトレンドリスト")
    total: int = Field(..., description="総件数")


# ============================================================
# ニューストレンド
# ============================================================

class NewsTrend(BaseModel):
    """ニューストレンド情報"""
    title: str = Field(..., description="ニュースタイトル")
    source: str = Field(..., description="情報源")
    url: str = Field(..., description="URL")
    published_at: datetime = Field(..., description="公開日時")
    snippet: Optional[str] = Field(None, description="要約")
    category: Optional[str] = Field(None, description="カテゴリ")


class NewsTrendListResponse(BaseModel):
    """ニューストレンド一覧レスポンス"""
    data: list[NewsTrend] = Field(..., description="ニューストレンドリスト")
    total: int = Field(..., description="総件数")


# ============================================================
# チャンネル履歴データ（Social Blade）
# ============================================================

class ChannelHistoryPoint(BaseModel):
    """チャンネル履歴データポイント"""
    date: str = Field(..., description="日付（YYYY-MM-DD）")
    subscriber_count: int = Field(..., description="登録者数")
    subscriber_change: int = Field(0, description="登録者数変化")


class ChannelGrowth(BaseModel):
    """チャンネル成長率データ"""
    channel_id: str = Field(..., description="チャンネルID")
    subscriber_growth_30d: int = Field(0, description="30日間の登録者増加数")
    subscriber_growth_14d: int = Field(0, description="14日間の登録者増加数")
    subscriber_growth_7d: int = Field(0, description="7日間の登録者増加数")
    views_growth_30d: int = Field(0, description="30日間の視聴回数増加")
    views_growth_14d: int = Field(0, description="14日間の視聴回数増加")
    views_growth_7d: int = Field(0, description="7日間の視聴回数増加")
    avg_daily_subs: int = Field(0, description="平均日次登録者増加")
    avg_daily_views: int = Field(0, description="平均日次視聴回数")


class ChannelProjection(BaseModel):
    """チャンネル将来予測"""
    channel_id: str = Field(..., description="チャンネルID")
    projected_subs_1_year: int = Field(0, description="1年後予測登録者数")
    projected_subs_5_years: int = Field(0, description="5年後予測登録者数")
    projected_views_1_year: int = Field(0, description="1年後予測視聴回数")
    projected_views_5_years: int = Field(0, description="5年後予測視聴回数")
    estimated_monthly_earnings_min: float = Field(0, description="推定月収（最小）")
    estimated_monthly_earnings_max: float = Field(0, description="推定月収（最大）")
    estimated_yearly_earnings_min: float = Field(0, description="推定年収（最小）")
    estimated_yearly_earnings_max: float = Field(0, description="推定年収（最大）")


class ChannelAnalytics(BaseModel):
    """チャンネル分析データ（Social Blade統合）"""
    channel_id: str = Field(..., description="チャンネルID")
    username: Optional[str] = Field(None, description="ユーザー名")
    subscriber_count: int = Field(0, description="現在の登録者数")
    video_count: int = Field(0, description="動画数")
    total_views: int = Field(0, description="総視聴回数")
    grade: Optional[str] = Field(None, description="Social Bladeグレード（A++〜D-）")
    subscriber_rank: int = Field(0, description="登録者ランク")
    video_views_rank: int = Field(0, description="視聴回数ランク")
    country_rank: int = Field(0, description="国内ランク")
    growth: Optional[ChannelGrowth] = Field(None, description="成長率データ")
    projection: Optional[ChannelProjection] = Field(None, description="将来予測")
    history: list[ChannelHistoryPoint] = Field(default_factory=list, description="履歴データ")


class ChannelAnalyticsResponse(BaseModel):
    """チャンネル分析レスポンス"""
    data: ChannelAnalytics = Field(..., description="チャンネル分析データ")
    fetched_at: str = Field(..., description="取得日時（ISO形式）")


class ChannelComparisonResponse(BaseModel):
    """チャンネル比較レスポンス"""
    data: list[ChannelAnalytics] = Field(..., description="比較チャンネルリスト")
    total: int = Field(..., description="総件数")
    compared_at: str = Field(..., description="比較日時（ISO形式）")
