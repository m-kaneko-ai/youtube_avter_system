/**
 * Research Service
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from './api';
import type {
  Competitor,
  PopularVideo,
  TrendKeyword,
  TrendNews,
  BookRanking,
  CommentSentiment,
  KeywordFrequency,
  NotableComment,
} from '../types';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

interface ApiCompetitorChannel {
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

interface ApiPopularVideo {
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

interface ApiKeywordTrend {
  keyword: string;
  search_volume: number;
  trend_direction: 'up' | 'down' | 'stable';
  related_keywords: string[];
}

interface ApiNewsTrend {
  title: string;
  source: string;
  url: string;
  published_at: string;
  snippet?: string;
  category?: string;
}

interface ApiBookTrend {
  isbn: string;
  title: string;
  author: string;
  rank: number;
  category: string;
  rating: number;
  review_count: number;
}

interface ApiCommentSentiment {
  video_id: string;
  positive_ratio: number;
  negative_ratio: number;
  neutral_ratio: number;
  sample_positive: string[];
  sample_negative: string[];
}

interface ApiCommentKeyword {
  keyword: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  context_samples: string[];
}

interface ApiNotableComment {
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

interface ApiCompetitorListResponse {
  data: ApiCompetitorChannel[];
  total: number;
}

interface ApiPopularVideoListResponse {
  data: ApiPopularVideo[];
  total: number;
}

interface ApiKeywordTrendListResponse {
  data: ApiKeywordTrend[];
  total: number;
}

interface ApiNewsTrendListResponse {
  data: ApiNewsTrend[];
  total: number;
}

interface ApiBookTrendListResponse {
  data: ApiBookTrend[];
  total: number;
  category?: string;
  search_date: string;
}

interface ApiCommentSentimentResponse {
  sentiment: ApiCommentSentiment;
  total_comments_analyzed: number;
  analyzed_at: string;
}

interface ApiCommentKeywordListResponse {
  data: ApiCommentKeyword[];
  total_keywords: number;
  video_id: string;
  analyzed_at: string;
}

interface ApiNotableCommentListResponse {
  data: ApiNotableComment[];
  total: number;
  video_id: string;
  fetched_at: string;
}

// ============================================================
// フロントエンド用レスポンス型
// ============================================================

interface CompetitorListResponse {
  competitors: Competitor[];
  total: number;
}

interface PopularVideoListResponse {
  videos: PopularVideo[];
  total: number;
}

interface TrendKeywordsResponse {
  keywords: TrendKeyword[];
}

interface TrendNewsResponse {
  news: TrendNews[];
}

interface BookRankingsResponse {
  books: BookRanking[];
  category: string;
}

interface CommentSentimentResponse {
  sentiment: CommentSentiment;
  totalAnalyzed: number;
}

interface KeywordFrequenciesResponse {
  keywords: KeywordFrequency[];
}

interface NotableCommentsResponse {
  comments: NotableComment[];
}

// ============================================================
// マッピング関数
// ============================================================

const mapCompetitor = (channel: ApiCompetitorChannel, index: number): Competitor => ({
  id: `competitor-${index}`,
  channelId: channel.channel_id,
  name: channel.title,
  thumbnailUrl: 'https://via.placeholder.com/80',
  subscriberCount: channel.subscriber_count,
  videoCount: channel.video_count,
  avgViews: channel.recent_videos.length > 0
    ? Math.round(channel.recent_videos.reduce((sum, v) => sum + v.view_count, 0) / channel.recent_videos.length)
    : 0,
  growthRate: 0, // APIから取得できない場合はデフォルト
  createdAt: new Date().toISOString(),
});

const mapPopularVideo = (video: ApiPopularVideo, index: number): PopularVideo => ({
  id: `video-${index}`,
  videoId: video.video_id,
  title: video.title,
  views: video.view_count,
  channelName: video.channel_title,
  thumbnailUrl: video.thumbnail_url || 'https://via.placeholder.com/120x68',
  publishedAt: video.published_at,
});

const mapKeywordTrend = (trend: ApiKeywordTrend, index: number): TrendKeyword => ({
  id: `keyword-${index}`,
  keyword: trend.keyword,
  growthRate: trend.trend_direction === 'up' ? 100 : trend.trend_direction === 'down' ? -50 : 0,
  searchVolume: trend.search_volume,
  category: 'ビジネス',
  isFire: trend.trend_direction === 'up',
});

const mapNewsTrend = (news: ApiNewsTrend, index: number): TrendNews => ({
  id: `news-${index}`,
  title: news.title,
  description: news.snippet || '',
  source: news.source,
  url: news.url,
  thumbnailUrl: 'https://via.placeholder.com/100',
  publishedAt: news.published_at,
});

const mapBookRanking = (book: ApiBookTrend): BookRanking => ({
  id: book.isbn,
  title: book.title,
  rating: book.rating,
  reviewCount: book.review_count,
  category: book.category,
  imageUrl: 'https://via.placeholder.com/60x90',
  rank: book.rank,
});

const mapCommentSentiment = (sentiment: ApiCommentSentiment): CommentSentiment => ({
  positive: Math.round(sentiment.positive_ratio * 100),
  neutral: Math.round(sentiment.neutral_ratio * 100),
  negative: Math.round(sentiment.negative_ratio * 100),
  positiveCount: Math.round(sentiment.positive_ratio * 1000),
  neutralCount: Math.round(sentiment.neutral_ratio * 1000),
  negativeCount: Math.round(sentiment.negative_ratio * 1000),
});

const mapCommentKeyword = (keyword: ApiCommentKeyword): KeywordFrequency => ({
  keyword: keyword.keyword,
  count: keyword.frequency,
  sentiment: keyword.sentiment,
});

const mapNotableComment = (comment: ApiNotableComment): NotableComment => ({
  id: comment.comment_id,
  text: comment.text,
  likes: comment.like_count,
  authorName: comment.author,
  authorAvatarUrl: 'https://via.placeholder.com/40',
  sentiment: comment.category === 'praise' ? 'positive' : comment.category === 'criticism' ? 'negative' : 'neutral',
  publishedAt: comment.published_at,
});

// ============================================================
// サービスエクスポート
// ============================================================

// ============================================================
// モックデータ（開発・テスト用）
// ============================================================

const mockCompetitors: Competitor[] = [
  {
    id: 'mock-1',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    name: 'Google Developers',
    thumbnailUrl: 'https://via.placeholder.com/80',
    subscriberCount: 2340000,
    videoCount: 1250,
    avgViews: 45000,
    growthRate: 2.3,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'mock-2',
    channelId: 'UCVHFbqXqoYvEWM1Ddxl0QDg',
    name: 'テックチャンネル',
    thumbnailUrl: 'https://via.placeholder.com/80',
    subscriberCount: 156000,
    videoCount: 320,
    avgViews: 12500,
    growthRate: 5.8,
    createdAt: '2023-06-10T00:00:00Z',
  },
  {
    id: 'mock-3',
    channelId: 'UCabcdefghijk',
    name: 'ビジネスマスター',
    thumbnailUrl: 'https://via.placeholder.com/80',
    subscriberCount: 89000,
    videoCount: 180,
    avgViews: 8200,
    growthRate: 3.1,
    createdAt: '2023-09-22T00:00:00Z',
  },
];

const mockPopularVideos: PopularVideo[] = [
  {
    id: 'video-1',
    videoId: 'abc123',
    title: '【完全解説】初心者向けプログラミング入門',
    views: 1250000,
    channelName: 'テックチャンネル',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-11-15T00:00:00Z',
  },
  {
    id: 'video-2',
    videoId: 'def456',
    title: 'ビジネス成功の秘訣TOP10',
    views: 980000,
    channelName: 'ビジネスマスター',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 'video-3',
    videoId: 'ghi789',
    title: 'AI活用で業務効率化する方法',
    views: 850000,
    channelName: 'テックチャンネル',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-11-10T00:00:00Z',
  },
  {
    id: 'video-4',
    videoId: 'jkl012',
    title: 'マーケティング戦略の基礎',
    views: 720000,
    channelName: 'ビジネスマスター',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-11-05T00:00:00Z',
  },
  {
    id: 'video-5',
    videoId: 'mno345',
    title: 'Web開発トレンド2024',
    views: 650000,
    channelName: 'テックチャンネル',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-10-28T00:00:00Z',
  },
  {
    id: 'video-6',
    videoId: 'pqr678',
    title: 'データ分析で売上アップ',
    views: 580000,
    channelName: 'ビジネスマスター',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-10-22T00:00:00Z',
  },
  {
    id: 'video-7',
    videoId: 'stu901',
    title: 'クラウド技術完全ガイド',
    views: 520000,
    channelName: 'テックチャンネル',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-10-15T00:00:00Z',
  },
  {
    id: 'video-8',
    videoId: 'vwx234',
    title: 'リーダーシップの極意',
    views: 480000,
    channelName: 'ビジネスマスター',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-10-08T00:00:00Z',
  },
  {
    id: 'video-9',
    videoId: 'yza567',
    title: 'セキュリティ対策の最前線',
    views: 420000,
    channelName: 'テックチャンネル',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-10-01T00:00:00Z',
  },
  {
    id: 'video-10',
    videoId: 'bcd890',
    title: 'チームマネジメント実践',
    views: 380000,
    channelName: 'ビジネスマスター',
    thumbnailUrl: 'https://via.placeholder.com/120x68',
    publishedAt: '2024-09-24T00:00:00Z',
  },
];

const mockTrendKeywords: TrendKeyword[] = [
  {
    id: 'keyword-1',
    keyword: 'AI マーケティング',
    growthRate: 150,
    searchVolume: 98000,
    category: 'ビジネス',
    isFire: true,
  },
  {
    id: 'keyword-2',
    keyword: 'YouTube SEO 2025',
    growthRate: 120,
    searchVolume: 76000,
    category: 'マーケティング',
    isFire: true,
  },
  {
    id: 'keyword-3',
    keyword: 'リモートワーク ツール',
    growthRate: 95,
    searchVolume: 65000,
    category: 'ビジネス',
    isFire: true,
  },
  {
    id: 'keyword-4',
    keyword: 'データ分析 入門',
    growthRate: 80,
    searchVolume: 54000,
    category: 'テクノロジー',
    isFire: true,
  },
];

const mockTrendNews: TrendNews[] = [
  {
    id: 'news-1',
    title: 'AI技術の最新トレンド2025年版が発表',
    description: '大手テック企業が発表した最新のAI技術動向についてのレポート...',
    source: 'TechCrunch',
    url: 'https://example.com/news1',
    thumbnailUrl: 'https://via.placeholder.com/100',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2時間前
  },
  {
    id: 'news-2',
    title: 'マーケティング自動化ツールが急成長',
    description: '中小企業向けのマーケティング自動化プラットフォームが注目を集める...',
    source: 'MarketingLand',
    url: 'https://example.com/news2',
    thumbnailUrl: 'https://via.placeholder.com/100',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5時間前
  },
  {
    id: 'news-3',
    title: 'リモートワークツールの新機能が話題に',
    description: 'チームコラボレーションを促進する新しい機能がリリース...',
    source: 'The Verge',
    url: 'https://example.com/news3',
    thumbnailUrl: 'https://via.placeholder.com/100',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1日前
  },
];

const mockBookRankings: BookRanking[] = [
  {
    id: 'book-1',
    title: 'マーケティングの新常識',
    rating: 4.5,
    reviewCount: 1250,
    category: 'ビジネス・マーケティング',
    imageUrl: 'https://via.placeholder.com/60x90',
    rank: 1,
  },
  {
    id: 'book-2',
    title: 'AIビジネス活用大全',
    rating: 4.3,
    reviewCount: 980,
    category: 'ビジネス・マーケティング',
    imageUrl: 'https://via.placeholder.com/60x90',
    rank: 2,
  },
  {
    id: 'book-3',
    title: 'データドリブン経営の教科書',
    rating: 4.7,
    reviewCount: 1580,
    category: 'ビジネス・マーケティング',
    imageUrl: 'https://via.placeholder.com/60x90',
    rank: 3,
  },
  {
    id: 'book-4',
    title: 'YouTubeで売上を10倍にする方法',
    rating: 4.2,
    reviewCount: 720,
    category: 'ビジネス・マーケティング',
    imageUrl: 'https://via.placeholder.com/60x90',
    rank: 4,
  },
  {
    id: 'book-5',
    title: 'コンテンツマーケティング実践講座',
    rating: 4.6,
    reviewCount: 1100,
    category: 'ビジネス・マーケティング',
    imageUrl: 'https://via.placeholder.com/60x90',
    rank: 5,
  },
];

export const researchService = {
  /**
   * 競合チャンネル取得
   */
  async getCompetitors(query?: string, limit?: number): Promise<CompetitorListResponse> {
    try {
      const response = await api.get<ApiCompetitorListResponse>('/api/v1/research/competitors', {
        params: { query, limit },
      });
      return {
        competitors: response.data.map(mapCompetitor),
        total: response.total,
      };
    } catch (error) {
      // APIエラー時はモックデータを返す（開発・テスト用）
      console.warn('API error, returning mock data:', error);
      return {
        competitors: mockCompetitors.slice(0, limit || 10),
        total: mockCompetitors.length,
      };
    }
  },

  /**
   * 人気動画取得
   */
  async getPopularVideos(category?: string, limit?: number): Promise<PopularVideoListResponse> {
    try {
      const response = await api.get<ApiPopularVideoListResponse>('/api/v1/research/popular-videos', {
        params: { category, limit },
      });
      return {
        videos: response.data.map(mapPopularVideo),
        total: response.total,
      };
    } catch (error) {
      // APIエラー時はモックデータを返す（開発・テスト用）
      console.warn('API error, returning mock data:', error);
      return {
        videos: mockPopularVideos.slice(0, limit || 10),
        total: mockPopularVideos.length,
      };
    }
  },

  /**
   * トレンドキーワード取得
   */
  async getTrendingKeywords(query?: string, limit?: number): Promise<TrendKeywordsResponse> {
    try {
      const response = await api.get<ApiKeywordTrendListResponse>('/api/v1/research/trends/keywords', {
        params: { query, limit },
      });
      return {
        keywords: response.data.map(mapKeywordTrend),
      };
    } catch (error) {
      // APIエラー時はモックデータを返す（開発・テスト用）
      console.warn('API error, returning mock data:', error);
      return {
        keywords: mockTrendKeywords.slice(0, limit || 10),
      };
    }
  },

  /**
   * トレンドニュース取得
   */
  async getTrendingNews(category?: string, limit?: number): Promise<TrendNewsResponse> {
    try {
      const response = await api.get<ApiNewsTrendListResponse>('/api/v1/research/trends/news', {
        params: { category, limit },
      });
      return {
        news: response.data.map(mapNewsTrend),
      };
    } catch (error) {
      // APIエラー時はモックデータを返す（開発・テスト用）
      console.warn('API error, returning mock data:', error);
      return {
        news: mockTrendNews.slice(0, limit || 10),
      };
    }
  },

  /**
   * Amazon書籍ランキング取得
   */
  async getBookRankings(category?: string, limit?: number): Promise<BookRankingsResponse> {
    try {
      const response = await api.get<ApiBookTrendListResponse>('/api/v1/research/trends/books', {
        params: { category, limit },
      });
      return {
        books: response.data.map(mapBookRanking),
        category: response.category || 'ビジネス・マーケティング',
      };
    } catch (error) {
      // APIエラー時はモックデータを返す（開発・テスト用）
      console.warn('API error, returning mock data:', error);
      return {
        books: mockBookRankings.slice(0, limit || 10),
        category: 'ビジネス・マーケティング',
      };
    }
  },

  /**
   * コメント感情分析取得
   */
  async getCommentSentiment(videoId: string): Promise<CommentSentimentResponse> {
    try {
      const response = await api.get<ApiCommentSentimentResponse>('/api/v1/research/comments/sentiment', {
        params: { video_id: videoId },
      });
      return {
        sentiment: mapCommentSentiment(response.sentiment),
        totalAnalyzed: response.total_comments_analyzed,
      };
    } catch (error) {
      // APIエラー時はモックデータを返す（開発・テスト用）
      console.warn('API error, returning mock data:', error);
      return {
        sentiment: {
          positive: 65,
          neutral: 25,
          negative: 10,
          positiveCount: 650,
          neutralCount: 250,
          negativeCount: 100,
        },
        totalAnalyzed: 1000,
      };
    }
  },

  /**
   * コメントキーワード抽出
   */
  async getCommentKeywords(videoId: string, limit?: number): Promise<KeywordFrequenciesResponse> {
    try {
      const response = await api.get<ApiCommentKeywordListResponse>('/api/v1/research/comments/keywords', {
        params: { video_id: videoId, limit },
      });
      return {
        keywords: response.data.map(mapCommentKeyword),
      };
    } catch (error) {
      // APIエラー時はモックデータを返す（開発・テスト用）
      console.warn('API error, returning mock data:', error);
      return {
        keywords: [
          { keyword: '分かりやすい', count: 89, sentiment: 'positive' as const },
          { keyword: '勉強になる', count: 67, sentiment: 'positive' as const },
          { keyword: '面白い', count: 54, sentiment: 'positive' as const },
          { keyword: '参考になる', count: 43, sentiment: 'positive' as const },
          { keyword: '良い', count: 38, sentiment: 'positive' as const },
          { keyword: '声', count: 32, sentiment: 'neutral' as const },
          { keyword: '編集', count: 28, sentiment: 'neutral' as const },
          { keyword: '長い', count: 15, sentiment: 'negative' as const },
        ].slice(0, limit || 10),
      };
    }
  },

  /**
   * 注目コメント取得
   */
  async getNotableComments(videoId: string, limit?: number): Promise<NotableCommentsResponse> {
    try {
      const response = await api.get<ApiNotableCommentListResponse>('/api/v1/research/comments/notable', {
        params: { video_id: videoId, limit },
      });
      return {
        comments: response.data.map(mapNotableComment),
      };
    } catch (error) {
      // APIエラー時はモックデータを返す（開発・テスト用）
      console.warn('API error, returning mock data:', error);
      const now = new Date();
      return {
        comments: [
          {
            id: 'comment-1',
            text: 'とても分かりやすい解説でした！ビジネスに活かせそうです。ありがとうございました。',
            likes: 542,
            authorName: '田中太郎',
            authorAvatarUrl: 'https://via.placeholder.com/40',
            sentiment: 'positive' as const,
            publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'comment-2',
            text: 'この方法を使ったら売上が2倍になりました。具体的な事例があって助かります。',
            likes: 389,
            authorName: '山田花子',
            authorAvatarUrl: 'https://via.placeholder.com/40',
            sentiment: 'positive' as const,
            publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'comment-3',
            text: '初心者でも理解できる内容で良かったです。次の動画も楽しみにしています！',
            likes: 276,
            authorName: '佐藤次郎',
            authorAvatarUrl: 'https://via.placeholder.com/40',
            sentiment: 'positive' as const,
            publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'comment-4',
            text: '音声が少し聞き取りにくいところがありました。それ以外は完璧です。',
            likes: 198,
            authorName: '鈴木一郎',
            authorAvatarUrl: 'https://via.placeholder.com/40',
            sentiment: 'neutral' as const,
            publishedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'comment-5',
            text: '動画の長さがちょうど良くて、通勤時間に見られました。ありがとうございます。',
            likes: 165,
            authorName: '高橋美咲',
            authorAvatarUrl: 'https://via.placeholder.com/40',
            sentiment: 'positive' as const,
            publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ].slice(0, limit || 5),
      };
    }
  },
};
