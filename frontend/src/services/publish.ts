/**
 * Publish Service
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from './api';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

type ApiPublishPlatform = 'youtube' | 'tiktok' | 'instagram';
type ApiPublishStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

interface ApiPublication {
  id: string;
  video_id: string;
  platform: ApiPublishPlatform;
  status: ApiPublishStatus;
  title?: string;
  description?: string;
  tags?: string[];
  platform_video_id?: string;
  platform_url?: string;
  scheduled_at?: string;
  published_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface ApiScheduledVideo {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url?: string;
  platforms: ApiPublishPlatform[];
  scheduled_at: string;
  status: ApiPublishStatus;
  recurrence?: string;
  created_at: string;
  updated_at: string;
}

interface ApiPlatformConnection {
  id: string;
  platform: ApiPublishPlatform;
  account_name: string;
  account_id: string;
  is_connected: boolean;
  connected_at?: string;
  expires_at?: string;
}

interface ApiCrossPostVideo {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url?: string;
  original_platform: ApiPublishPlatform;
  platforms: Array<{
    platform: ApiPublishPlatform;
    status: ApiPublishStatus;
    url?: string;
  }>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// フロントエンド用型（camelCase）
// ============================================================

export type PublishPlatform = 'youtube' | 'tiktok' | 'instagram';
export type PublishStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface Publication {
  id: string;
  videoId: string;
  platform: PublishPlatform;
  status: PublishStatus;
  title?: string;
  description?: string;
  tags?: string[];
  platformVideoId?: string;
  platformUrl?: string;
  scheduledAt?: string;
  publishedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledVideo {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  platforms: PublishPlatform[];
  scheduledAt: string;
  status: PublishStatus;
  recurrence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConnection {
  id: string;
  platform: PublishPlatform;
  accountName: string;
  accountId: string;
  isConnected: boolean;
  connectedAt?: string;
  expiresAt?: string;
}

export interface CrossPostPlatformStatus {
  platform: PublishPlatform;
  status: PublishStatus;
  url?: string;
}

export interface CrossPostVideo {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  originalPlatform: PublishPlatform;
  platforms: CrossPostPlatformStatus[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// マッピング関数
// ============================================================

const mapPublication = (pub: ApiPublication): Publication => ({
  id: pub.id,
  videoId: pub.video_id,
  platform: pub.platform,
  status: pub.status,
  title: pub.title,
  description: pub.description,
  tags: pub.tags,
  platformVideoId: pub.platform_video_id,
  platformUrl: pub.platform_url,
  scheduledAt: pub.scheduled_at,
  publishedAt: pub.published_at,
  errorMessage: pub.error_message,
  createdAt: pub.created_at,
  updatedAt: pub.updated_at,
});

const mapScheduledVideo = (video: ApiScheduledVideo): ScheduledVideo => ({
  id: video.id,
  videoId: video.video_id,
  title: video.title,
  thumbnailUrl: video.thumbnail_url,
  platforms: video.platforms,
  scheduledAt: video.scheduled_at,
  status: video.status,
  recurrence: video.recurrence,
  createdAt: video.created_at,
  updatedAt: video.updated_at,
});

const mapPlatformConnection = (conn: ApiPlatformConnection): PlatformConnection => ({
  id: conn.id,
  platform: conn.platform,
  accountName: conn.account_name,
  accountId: conn.account_id,
  isConnected: conn.is_connected,
  connectedAt: conn.connected_at,
  expiresAt: conn.expires_at,
});

const mapCrossPostVideo = (video: ApiCrossPostVideo): CrossPostVideo => ({
  id: video.id,
  videoId: video.video_id,
  title: video.title,
  thumbnailUrl: video.thumbnail_url,
  originalPlatform: video.original_platform,
  platforms: video.platforms,
  createdAt: video.created_at,
  updatedAt: video.updated_at,
});

// ============================================================
// リクエスト型
// ============================================================

interface YouTubePublishRequest {
  videoId: string;
  title: string;
  description?: string;
  tags?: string[];
  privacy?: 'public' | 'unlisted' | 'private';
  scheduledAt?: string;
  playlistId?: string;
}

interface TikTokPublishRequest {
  videoId: string;
  title: string;
  description?: string;
  hashtags?: string[];
  scheduledAt?: string;
}

interface InstagramPublishRequest {
  videoId: string;
  caption: string;
  hashtags?: string[];
  scheduledAt?: string;
}

interface ScheduleCreateRequest {
  videoId: string;
  platforms: PublishPlatform[];
  scheduledAt: string;
  recurrence?: string;
}

interface CrossPostRequest {
  videoId: string;
  platforms: PublishPlatform[];
}

// ============================================================
// レスポンス型
// ============================================================

interface PublishResponse {
  publication: Publication;
  platformUrl?: string;
}

interface ScheduleCreateResponse {
  schedule: ScheduledVideo;
}

interface ScheduleListResponse {
  schedules: ScheduledVideo[];
  total: number;
}

interface PlatformListResponse {
  platforms: PlatformConnection[];
}

interface CrossPostListResponse {
  crossPosts: CrossPostVideo[];
  total: number;
}

// ============================================================
// モックデータ（API接続エラー時のフォールバック）
// ============================================================

const mockScheduledVideos: ScheduledVideo[] = [
  {
    id: 'schedule-1',
    videoId: 'video-1',
    title: 'AIツール活用術【初心者向け完全ガイド】',
    thumbnailUrl: undefined,
    platforms: ['youtube', 'tiktok'],
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'scheduled',
    recurrence: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'schedule-2',
    videoId: 'video-2',
    title: 'ChatGPT vs Claude 徹底比較',
    thumbnailUrl: undefined,
    platforms: ['youtube'],
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    status: 'scheduled',
    recurrence: 'weekly',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockPlatformConnections: PlatformConnection[] = [
  {
    id: 'conn-1',
    platform: 'youtube',
    accountName: 'AI Channel',
    accountId: 'UC123456',
    isConnected: true,
    connectedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
  },
  {
    id: 'conn-2',
    platform: 'tiktok',
    accountName: '@ai_creator',
    accountId: 'tiktok_123',
    isConnected: true,
    connectedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 75 * 86400000).toISOString(),
  },
  {
    id: 'conn-3',
    platform: 'instagram',
    accountName: 'ai_content_creator',
    accountId: 'ig_456',
    isConnected: false,
    connectedAt: undefined,
    expiresAt: undefined,
  },
];

const mockCrossPostVideos: CrossPostVideo[] = [
  {
    id: 'crosspost-1',
    videoId: 'video-1',
    title: 'AIツール活用術【初心者向け】',
    thumbnailUrl: undefined,
    originalPlatform: 'youtube',
    platforms: [
      { platform: 'youtube', status: 'published', url: 'https://youtube.com/watch?v=xxx' },
      { platform: 'tiktok', status: 'published', url: 'https://tiktok.com/@user/video/xxx' },
      { platform: 'instagram', status: 'scheduled', url: undefined },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================
// サービスエクスポート
// ============================================================

export const publishService = {
  /**
   * YouTubeに公開
   */
  async publishToYouTube(request: YouTubePublishRequest): Promise<PublishResponse> {
    const response = await api.post<{ publication: ApiPublication; platform_url?: string }>(
      '/api/v1/publish/youtube',
      {
        video_id: request.videoId,
        title: request.title,
        description: request.description,
        tags: request.tags,
        privacy: request.privacy,
        scheduled_at: request.scheduledAt,
        playlist_id: request.playlistId,
      }
    );
    return {
      publication: mapPublication(response.publication),
      platformUrl: response.platform_url,
    };
  },

  /**
   * TikTokに公開
   */
  async publishToTikTok(request: TikTokPublishRequest): Promise<PublishResponse> {
    const response = await api.post<{ publication: ApiPublication; platform_url?: string }>(
      '/api/v1/publish/tiktok',
      {
        video_id: request.videoId,
        title: request.title,
        description: request.description,
        hashtags: request.hashtags,
        scheduled_at: request.scheduledAt,
      }
    );
    return {
      publication: mapPublication(response.publication),
      platformUrl: response.platform_url,
    };
  },

  /**
   * Instagramに公開
   */
  async publishToInstagram(request: InstagramPublishRequest): Promise<PublishResponse> {
    const response = await api.post<{ publication: ApiPublication; platform_url?: string }>(
      '/api/v1/publish/instagram',
      {
        video_id: request.videoId,
        caption: request.caption,
        hashtags: request.hashtags,
        scheduled_at: request.scheduledAt,
      }
    );
    return {
      publication: mapPublication(response.publication),
      platformUrl: response.platform_url,
    };
  },

  /**
   * 公開状態取得
   */
  async getPublication(publicationId: string): Promise<Publication> {
    const response = await api.get<ApiPublication>(`/api/v1/publish/${publicationId}`);
    return mapPublication(response);
  },

  /**
   * スケジュール一覧取得
   */
  async getSchedules(): Promise<ScheduleListResponse> {
    try {
      const response = await api.get<{ schedules: ApiScheduledVideo[]; total: number }>(
        '/api/v1/publish/schedule'
      );
      return {
        schedules: response.schedules.map(mapScheduledVideo),
        total: response.total,
      };
    } catch {
      console.info('[publishService] Using mock data for schedules');
      return {
        schedules: mockScheduledVideos,
        total: mockScheduledVideos.length,
      };
    }
  },

  /**
   * スケジュール作成
   */
  async createSchedule(request: ScheduleCreateRequest): Promise<ScheduleCreateResponse> {
    const response = await api.post<{ schedule: ApiScheduledVideo }>('/api/v1/publish/schedule', {
      video_id: request.videoId,
      platforms: request.platforms,
      scheduled_at: request.scheduledAt,
      recurrence: request.recurrence,
    });
    return {
      schedule: mapScheduledVideo(response.schedule),
    };
  },

  /**
   * スケジュール削除
   */
  async deleteSchedule(scheduleId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/api/v1/publish/schedule/${scheduleId}`);
  },

  /**
   * プラットフォーム接続一覧取得
   */
  async getPlatforms(): Promise<PlatformListResponse> {
    try {
      const response = await api.get<{ platforms: ApiPlatformConnection[] }>('/api/v1/publish/platforms');
      return {
        platforms: response.platforms.map(mapPlatformConnection),
      };
    } catch {
      console.info('[publishService] Using mock data for platforms');
      return {
        platforms: mockPlatformConnections,
      };
    }
  },

  /**
   * クロスポスト一覧取得
   */
  async getCrossPosts(): Promise<CrossPostListResponse> {
    try {
      const response = await api.get<{ cross_posts: ApiCrossPostVideo[]; total: number }>(
        '/api/v1/publish/crosspost'
      );
      return {
        crossPosts: response.cross_posts.map(mapCrossPostVideo),
        total: response.total,
      };
    } catch {
      console.info('[publishService] Using mock data for cross posts');
      return {
        crossPosts: mockCrossPostVideos,
        total: mockCrossPostVideos.length,
      };
    }
  },

  /**
   * クロスポスト実行
   */
  async createCrossPost(request: CrossPostRequest): Promise<CrossPostVideo> {
    const response = await api.post<ApiCrossPostVideo>('/api/v1/publish/crosspost', {
      video_id: request.videoId,
      platforms: request.platforms,
    });
    return mapCrossPostVideo(response);
  },
};
