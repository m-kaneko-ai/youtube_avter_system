/**
 * Series Service
 *
 * シリーズ管理、動画アイテム管理API
 */
import { api } from './api';
import type {
  Series,
  SeriesCreateRequest,
  SeriesUpdateRequest,
  SeriesListResponse,
  SeriesWithVideos,
  SeriesVideoItem,
  SeriesVideoAddRequest,
  SeriesStats,
  SeriesPerformance,
  SeriesStatus,
  SeriesType,
} from '../types';

// ============================================================
// API レスポンス型定義
// ============================================================

interface ApiVideoInfo {
  id: string;
  title?: string;
  youtube_url?: string;
  status: string;
}

interface ApiSeries {
  id: string;
  name: string;
  description?: string;
  series_type: SeriesType;
  project_id?: string;
  knowledge_id?: string;
  status: SeriesStatus;
  youtube_playlist_id?: string;
  youtube_playlist_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  target_video_count?: number;
  release_frequency?: string;
  total_videos: number;
  total_views: number;
  total_watch_time_hours?: number;
  avg_view_duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

interface ApiSeriesVideoItem {
  id: string;
  series_id: string;
  video_id: string;
  order_index: number;
  episode_number?: number;
  episode_title?: string;
  is_published: boolean;
  published_at?: string;
  scheduled_at?: string;
  views: number;
  likes: number;
  comments: number;
  avg_view_duration_seconds?: number;
  retention_rate?: number;
  video?: ApiVideoInfo;
  added_at: string;
  updated_at: string;
}

interface ApiSeriesWithVideos extends ApiSeries {
  video_items: ApiSeriesVideoItem[];
}

interface ApiSeriesListResponse {
  series: ApiSeries[];
  total: number;
}

interface ApiSeriesStats {
  total_series: number;
  active_series: number;
  total_videos: number;
  total_views: number;
  avg_videos_per_series: number;
}

interface ApiSeriesDailyStats {
  date: string;
  views: number;
  new_subscribers: number;
  watch_time_minutes: number;
}

interface ApiSeriesPerformance {
  series_id: string;
  series_name: string;
  total_videos: number;
  total_views: number;
  total_watch_time_hours: number;
  avg_view_duration_seconds: number;
  subscriber_growth: number;
  daily_stats: ApiSeriesDailyStats[];
}

// ============================================================
// マッピング関数
// ============================================================

const mapVideoInfo = (video?: ApiVideoInfo) =>
  video
    ? {
        id: video.id,
        title: video.title,
        youtubeUrl: video.youtube_url,
        status: video.status,
      }
    : undefined;

const mapSeries = (series: ApiSeries): Series => ({
  id: series.id,
  name: series.name,
  description: series.description,
  seriesType: series.series_type,
  projectId: series.project_id,
  knowledgeId: series.knowledge_id,
  status: series.status,
  youtubePlaylistId: series.youtube_playlist_id,
  youtubePlaylistUrl: series.youtube_playlist_url,
  thumbnailUrl: series.thumbnail_url,
  tags: series.tags,
  startDate: series.start_date,
  endDate: series.end_date,
  targetVideoCount: series.target_video_count,
  releaseFrequency: series.release_frequency,
  totalVideos: series.total_videos,
  totalViews: series.total_views,
  totalWatchTimeHours: series.total_watch_time_hours,
  avgViewDurationSeconds: series.avg_view_duration_seconds,
  createdAt: series.created_at,
  updatedAt: series.updated_at,
});

const mapSeriesVideoItem = (item: ApiSeriesVideoItem): SeriesVideoItem => ({
  id: item.id,
  seriesId: item.series_id,
  videoId: item.video_id,
  orderIndex: item.order_index,
  episodeNumber: item.episode_number,
  episodeTitle: item.episode_title,
  isPublished: item.is_published,
  publishedAt: item.published_at,
  scheduledAt: item.scheduled_at,
  views: item.views,
  likes: item.likes,
  comments: item.comments,
  avgViewDurationSeconds: item.avg_view_duration_seconds,
  retentionRate: item.retention_rate,
  video: mapVideoInfo(item.video),
  addedAt: item.added_at,
  updatedAt: item.updated_at,
});

const mapSeriesWithVideos = (series: ApiSeriesWithVideos): SeriesWithVideos => ({
  ...mapSeries(series),
  videoItems: series.video_items.map(mapSeriesVideoItem),
});

const mapSeriesStats = (stats: ApiSeriesStats): SeriesStats => ({
  totalSeries: stats.total_series,
  activeSeries: stats.active_series,
  totalVideos: stats.total_videos,
  totalViews: stats.total_views,
  avgVideosPerSeries: stats.avg_videos_per_series,
});

const mapSeriesPerformance = (perf: ApiSeriesPerformance): SeriesPerformance => ({
  seriesId: perf.series_id,
  seriesName: perf.series_name,
  totalVideos: perf.total_videos,
  totalViews: perf.total_views,
  totalWatchTimeHours: perf.total_watch_time_hours,
  avgViewDurationSeconds: perf.avg_view_duration_seconds,
  subscriberGrowth: perf.subscriber_growth,
  dailyStats: perf.daily_stats.map((d) => ({
    date: d.date,
    views: d.views,
    newSubscribers: d.new_subscribers,
    watchTimeMinutes: d.watch_time_minutes,
  })),
});

// ============================================================
// モックデータ
// ============================================================

const mockSeries: Series[] = [
  {
    id: 'series-1',
    name: 'AI活用術シリーズ',
    description: 'AIツールを使った生産性向上の完全ガイド',
    seriesType: 'tutorial',
    status: 'active',
    tags: ['AI', '生産性', 'ツール'],
    totalVideos: 12,
    totalViews: 45678,
    totalWatchTimeHours: 234.5,
    avgViewDurationSeconds: 420,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'series-2',
    name: 'ビジネス英語マスター',
    description: '仕事で使える英語フレーズを毎日配信',
    seriesType: 'topic',
    status: 'active',
    tags: ['英語', 'ビジネス', '学習'],
    releaseFrequency: 'daily',
    totalVideos: 30,
    totalViews: 123456,
    totalWatchTimeHours: 567.8,
    avgViewDurationSeconds: 180,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const mockStats: SeriesStats = {
  totalSeries: 2,
  activeSeries: 2,
  totalVideos: 42,
  totalViews: 169134,
  avgVideosPerSeries: 21,
};

// ============================================================
// Series Service
// ============================================================

export const seriesService = {
  /**
   * シリーズ一覧を取得
   */
  async getSeriesList(params?: {
    status?: SeriesStatus;
    seriesType?: SeriesType;
    projectId?: string;
    skip?: number;
    limit?: number;
  }): Promise<SeriesListResponse> {
    try {
      const response = await api.get<ApiSeriesListResponse>('/api/v1/series/', {
        params: {
          status: params?.status,
          series_type: params?.seriesType,
          project_id: params?.projectId,
          skip: params?.skip,
          limit: params?.limit,
        },
      });
      return {
        series: response.series.map(mapSeries),
        total: response.total,
      };
    } catch {
      console.info('[seriesService] Using mock data for series list');
      return {
        series: mockSeries,
        total: mockSeries.length,
      };
    }
  },

  /**
   * シリーズ詳細を取得（動画一覧含む）
   */
  async getSeries(seriesId: string): Promise<SeriesWithVideos> {
    try {
      const response = await api.get<ApiSeriesWithVideos>(`/api/v1/series/${seriesId}`);
      return mapSeriesWithVideos(response);
    } catch {
      const series = mockSeries.find((s) => s.id === seriesId);
      if (series) {
        return { ...series, videoItems: [] };
      }
      throw new Error('Series not found');
    }
  },

  /**
   * シリーズを作成
   */
  async createSeries(data: SeriesCreateRequest): Promise<Series> {
    const response = await api.post<ApiSeries>('/api/v1/series/', {
      name: data.name,
      description: data.description,
      series_type: data.seriesType ?? 'playlist',
      project_id: data.projectId,
      knowledge_id: data.knowledgeId,
      youtube_playlist_id: data.youtubePlaylistId,
      youtube_playlist_url: data.youtubePlaylistUrl,
      thumbnail_url: data.thumbnailUrl,
      tags: data.tags,
      start_date: data.startDate,
      end_date: data.endDate,
      target_video_count: data.targetVideoCount,
      release_frequency: data.releaseFrequency,
    });
    return mapSeries(response);
  },

  /**
   * シリーズを更新
   */
  async updateSeries(seriesId: string, data: SeriesUpdateRequest): Promise<Series> {
    const response = await api.put<ApiSeries>(`/api/v1/series/${seriesId}`, {
      name: data.name,
      description: data.description,
      series_type: data.seriesType,
      status: data.status,
      youtube_playlist_id: data.youtubePlaylistId,
      youtube_playlist_url: data.youtubePlaylistUrl,
      thumbnail_url: data.thumbnailUrl,
      tags: data.tags,
      start_date: data.startDate,
      end_date: data.endDate,
      target_video_count: data.targetVideoCount,
      release_frequency: data.releaseFrequency,
    });
    return mapSeries(response);
  },

  /**
   * シリーズを削除
   */
  async deleteSeries(seriesId: string): Promise<void> {
    await api.delete(`/api/v1/series/${seriesId}`);
  },

  /**
   * シリーズに動画を追加
   */
  async addVideo(seriesId: string, data: SeriesVideoAddRequest): Promise<SeriesVideoItem> {
    const response = await api.post<ApiSeriesVideoItem>(`/api/v1/series/${seriesId}/videos`, {
      video_id: data.videoId,
      order_index: data.orderIndex,
      episode_number: data.episodeNumber,
      episode_title: data.episodeTitle,
      scheduled_at: data.scheduledAt,
    });
    return mapSeriesVideoItem(response);
  },

  /**
   * シリーズに動画を一括追加
   */
  async bulkAddVideos(
    seriesId: string,
    videoIds: string[],
    startEpisodeNumber?: number
  ): Promise<SeriesVideoItem[]> {
    const response = await api.post<ApiSeriesVideoItem[]>(`/api/v1/series/${seriesId}/videos/bulk`, {
      video_ids: videoIds,
      start_episode_number: startEpisodeNumber,
    });
    return response.map(mapSeriesVideoItem);
  },

  /**
   * 動画の並び順を変更
   */
  async reorderVideos(seriesId: string, videoIds: string[]): Promise<void> {
    await api.put(`/api/v1/series/${seriesId}/videos/reorder`, {
      video_ids: videoIds,
    });
  },

  /**
   * シリーズから動画を削除
   */
  async removeVideo(seriesId: string, videoId: string): Promise<void> {
    await api.delete(`/api/v1/series/${seriesId}/videos/${videoId}`);
  },

  /**
   * シリーズ統計を取得
   */
  async getStats(): Promise<SeriesStats> {
    try {
      const response = await api.get<ApiSeriesStats>('/api/v1/series/stats/summary');
      return mapSeriesStats(response);
    } catch {
      return mockStats;
    }
  },

  /**
   * シリーズのパフォーマンスを取得
   */
  async getPerformance(seriesId: string, days: number = 30): Promise<SeriesPerformance> {
    try {
      const response = await api.get<ApiSeriesPerformance>(
        `/api/v1/series/${seriesId}/performance`,
        { params: { days } }
      );
      return mapSeriesPerformance(response);
    } catch {
      return {
        seriesId,
        seriesName: '',
        totalVideos: 0,
        totalViews: 0,
        totalWatchTimeHours: 0,
        avgViewDurationSeconds: 0,
        subscriberGrowth: 0,
        dailyStats: [],
      };
    }
  },
};

export type {
  Series,
  SeriesWithVideos,
  SeriesVideoItem,
  SeriesListResponse,
  SeriesStats,
  SeriesPerformance,
};
