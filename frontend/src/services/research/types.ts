/**
 * Research Service - Type Definitions
 *
 * API型定義とフロントエンド型定義
 */
import type {
  Competitor,
  PopularVideo,
  TrendKeyword,
  TrendNews,
  BookRanking,
  CommentSentiment,
  KeywordFrequency,
  NotableComment,
} from '../../types';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

export interface ApiCompetitorChannel {
  channel_id: string;
  title: string;
  subscriber_count: number;
  video_count: number;
  recent_videos: Array<{
    video_id: string;
    title: string;
    view_count: number;
    published_at: string;
  }>;
}

export interface ApiPopularVideo {
  video_id: string;
  channel_id: string;
  channel_title: string;
  title: string;
  description?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  thumbnail_url?: string;
}

export interface ApiKeywordTrend {
  keyword: string;
  search_volume: number;
  trend_direction: 'up' | 'down' | 'stable';
  related_keywords: string[];
}

export interface ApiNewsTrend {
  title: string;
  source: string;
  url: string;
  published_at: string;
  snippet?: string;
  category?: string;
}

export interface ApiBookTrend {
  isbn: string;
  title: string;
  author: string;
  rank: number;
  category: string;
  rating: number;
  review_count: number;
}

export interface ApiCommentSentiment {
  video_id: string;
  positive_ratio: number;
  negative_ratio: number;
  neutral_ratio: number;
  sample_positive: string[];
  sample_negative: string[];
}

export interface ApiCommentKeyword {
  keyword: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  context_samples: string[];
}

export interface ApiNotableComment {
  comment_id: string;
  text: string;
  like_count: number;
  author: string;
  published_at: string;
  category: 'question' | 'praise' | 'criticism' | 'suggestion';
}

// ============================================================
// バックエンドレスポンス型
// ============================================================

export interface ApiCompetitorListResponse {
  data: ApiCompetitorChannel[];
  total: number;
}

export interface ApiPopularVideoListResponse {
  data: ApiPopularVideo[];
  total: number;
}

export interface ApiKeywordTrendListResponse {
  data: ApiKeywordTrend[];
  total: number;
}

export interface ApiNewsTrendListResponse {
  data: ApiNewsTrend[];
  total: number;
}

export interface ApiBookTrendListResponse {
  data: ApiBookTrend[];
  total: number;
  category?: string;
  search_date: string;
}

export interface ApiCommentSentimentResponse {
  sentiment: ApiCommentSentiment;
  total_comments_analyzed: number;
  analyzed_at: string;
}

export interface ApiCommentKeywordListResponse {
  data: ApiCommentKeyword[];
  total_keywords: number;
  video_id: string;
  analyzed_at: string;
}

export interface ApiNotableCommentListResponse {
  data: ApiNotableComment[];
  total: number;
  video_id: string;
  fetched_at: string;
}

// ============================================================
// フロントエンド用レスポンス型
// ============================================================

export interface CompetitorListResponse {
  competitors: Competitor[];
  total: number;
}

export interface PopularVideoListResponse {
  videos: PopularVideo[];
  total: number;
}

export interface TrendKeywordsResponse {
  keywords: TrendKeyword[];
}

export interface TrendNewsResponse {
  news: TrendNews[];
}

export interface BookRankingsResponse {
  books: BookRanking[];
  category: string;
}

export interface CommentSentimentResponse {
  sentiment: CommentSentiment;
  totalAnalyzed: number;
}

export interface KeywordFrequenciesResponse {
  keywords: KeywordFrequency[];
}

export interface NotableCommentsResponse {
  comments: NotableComment[];
}
