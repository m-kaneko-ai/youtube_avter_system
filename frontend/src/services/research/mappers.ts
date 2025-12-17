/**
 * Research Service - Data Mappers
 *
 * API型とフロントエンド型のマッピング関数
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
import type {
  ApiCompetitorChannel,
  ApiPopularVideo,
  ApiKeywordTrend,
  ApiNewsTrend,
  ApiBookTrend,
  ApiCommentSentiment,
  ApiCommentKeyword,
  ApiNotableComment,
} from './types';

export const mapCompetitor = (channel: ApiCompetitorChannel, index: number): Competitor => ({
  id: `competitor-${index}`,
  channelId: channel.channel_id,
  name: channel.title,
  thumbnailUrl: 'https://via.placeholder.com/80',
  subscriberCount: channel.subscriber_count,
  videoCount: channel.video_count,
  avgViews: channel.recent_videos.length > 0
    ? Math.round(channel.recent_videos.reduce((sum, v) => sum + v.view_count, 0) / channel.recent_videos.length)
    : 0,
  growthRate: 0,
  createdAt: new Date().toISOString(),
});

export const mapPopularVideo = (video: ApiPopularVideo, index: number): PopularVideo => ({
  id: `video-${index}`,
  videoId: video.video_id,
  title: video.title,
  views: video.view_count,
  channelName: video.channel_title,
  thumbnailUrl: video.thumbnail_url || 'https://via.placeholder.com/120x68',
  publishedAt: video.published_at,
});

export const mapKeywordTrend = (trend: ApiKeywordTrend, index: number): TrendKeyword => ({
  id: `keyword-${index}`,
  keyword: trend.keyword,
  growthRate: trend.trend_direction === 'up' ? 100 : trend.trend_direction === 'down' ? -50 : 0,
  searchVolume: trend.search_volume,
  category: 'ビジネス',
  isFire: trend.trend_direction === 'up',
});

export const mapNewsTrend = (news: ApiNewsTrend, index: number): TrendNews => ({
  id: `news-${index}`,
  title: news.title,
  description: news.snippet || '',
  source: news.source,
  url: news.url,
  thumbnailUrl: 'https://via.placeholder.com/100',
  publishedAt: news.published_at,
});

export const mapBookRanking = (book: ApiBookTrend): BookRanking => ({
  id: book.isbn,
  title: book.title,
  rating: book.rating,
  reviewCount: book.review_count,
  category: book.category,
  imageUrl: 'https://via.placeholder.com/60x90',
  rank: book.rank,
});

export const mapCommentSentiment = (sentiment: ApiCommentSentiment): CommentSentiment => ({
  positive: Math.round(sentiment.positive_ratio * 100),
  neutral: Math.round(sentiment.neutral_ratio * 100),
  negative: Math.round(sentiment.negative_ratio * 100),
  positiveCount: Math.round(sentiment.positive_ratio * 1000),
  neutralCount: Math.round(sentiment.neutral_ratio * 1000),
  negativeCount: Math.round(sentiment.negative_ratio * 1000),
});

export const mapCommentKeyword = (keyword: ApiCommentKeyword): KeywordFrequency => ({
  keyword: keyword.keyword,
  count: keyword.frequency,
  sentiment: keyword.sentiment,
});

export const mapNotableComment = (comment: ApiNotableComment): NotableComment => ({
  id: comment.comment_id,
  text: comment.text,
  likes: comment.like_count,
  authorName: comment.author,
  authorAvatarUrl: 'https://via.placeholder.com/40',
  sentiment: comment.category === 'praise' ? 'positive' : comment.category === 'criticism' ? 'negative' : 'neutral',
  publishedAt: comment.published_at,
});
