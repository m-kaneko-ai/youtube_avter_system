/**
 * Research Service
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from '../api';
import type {
  CompetitorListResponse,
  PopularVideoListResponse,
  TrendKeywordsResponse,
  TrendNewsResponse,
  BookRankingsResponse,
  CommentSentimentResponse,
  KeywordFrequenciesResponse,
  NotableCommentsResponse,
  ApiCompetitorListResponse,
  ApiPopularVideoListResponse,
  ApiKeywordTrendListResponse,
  ApiNewsTrendListResponse,
  ApiBookTrendListResponse,
  ApiCommentSentimentResponse,
  ApiCommentKeywordListResponse,
  ApiNotableCommentListResponse,
} from './types';
import {
  mapCompetitor,
  mapPopularVideo,
  mapKeywordTrend,
  mapNewsTrend,
  mapBookRanking,
  mapCommentSentiment,
  mapCommentKeyword,
  mapNotableComment,
} from './mappers';
import {
  mockCompetitors,
  mockPopularVideos,
  mockTrendKeywords,
  mockTrendNews,
  mockBookRankings,
} from './mocks';

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

export * from './types';
