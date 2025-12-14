/**
 * Engagement Service
 *
 * ショート→長尺連携管理、パフォーマンス分析API
 */
import { api } from './api';
import type {
  ShortToLongLink,
  ShortToLongLinkCreateRequest,
  ShortToLongLinkUpdateRequest,
  ShortToLongLinkListResponse,
  EngagementSummary,
  LinkPerformance,
  EngagementStatus,
} from '../types';

// ============================================================
// API レスポンス型定義
// ============================================================

interface ApiVideoSummary {
  id: string;
  title?: string;
  youtube_url?: string;
  status: string;
}

interface ApiShortToLongLink {
  id: string;
  short_video_id: string;
  long_video_id: string;
  link_type: string;
  link_text?: string;
  link_position?: string;
  status: EngagementStatus;
  is_active: boolean;
  short_video?: ApiVideoSummary;
  long_video?: ApiVideoSummary;
  created_at: string;
  updated_at: string;
}

interface ApiShortToLongLinkListResponse {
  links: ApiShortToLongLink[];
  total: number;
}

interface ApiEngagementSummary {
  total_links: number;
  active_links: number;
  total_clicks: number;
  avg_ctr: number;
  total_conversions: number;
  avg_conversion_rate: number;
}

interface ApiEngagementDailyStats {
  date: string;
  short_views: number;
  long_views: number;
  clicks: number;
  conversions: number;
}

interface ApiLinkPerformance {
  link_id: string;
  short_video_title?: string;
  long_video_title?: string;
  total_short_views: number;
  total_clicks: number;
  ctr: number;
  total_conversions: number;
  conversion_rate: number;
  daily_stats: ApiEngagementDailyStats[];
}

// ============================================================
// マッピング関数
// ============================================================

const mapVideoSummary = (video?: ApiVideoSummary) =>
  video
    ? {
        id: video.id,
        title: video.title,
        youtubeUrl: video.youtube_url,
        status: video.status,
      }
    : undefined;

const mapShortToLongLink = (link: ApiShortToLongLink): ShortToLongLink => ({
  id: link.id,
  shortVideoId: link.short_video_id,
  longVideoId: link.long_video_id,
  linkType: link.link_type,
  linkText: link.link_text,
  linkPosition: link.link_position,
  status: link.status,
  isActive: link.is_active,
  shortVideo: mapVideoSummary(link.short_video),
  longVideo: mapVideoSummary(link.long_video),
  createdAt: link.created_at,
  updatedAt: link.updated_at,
});

const mapEngagementSummary = (summary: ApiEngagementSummary): EngagementSummary => ({
  totalLinks: summary.total_links,
  activeLinks: summary.active_links,
  totalClicks: summary.total_clicks,
  avgCTR: summary.avg_ctr,
  totalConversions: summary.total_conversions,
  avgConversionRate: summary.avg_conversion_rate,
});

const mapLinkPerformance = (perf: ApiLinkPerformance): LinkPerformance => ({
  linkId: perf.link_id,
  shortVideoTitle: perf.short_video_title,
  longVideoTitle: perf.long_video_title,
  totalShortViews: perf.total_short_views,
  totalClicks: perf.total_clicks,
  ctr: perf.ctr,
  totalConversions: perf.total_conversions,
  conversionRate: perf.conversion_rate,
  dailyStats: perf.daily_stats.map((d) => ({
    date: d.date,
    shortViews: d.short_views,
    longViews: d.long_views,
    clicks: d.clicks,
    conversions: d.conversions,
  })),
});

// ============================================================
// モックデータ
// ============================================================

const mockLinks: ShortToLongLink[] = [
  {
    id: 'link-1',
    shortVideoId: 'short-1',
    longVideoId: 'long-1',
    linkType: 'description',
    linkText: '詳しくはこちらの動画で解説しています →',
    linkPosition: 'top',
    status: 'active',
    isActive: true,
    shortVideo: { id: 'short-1', title: '【1分解説】AIツール活用法', status: 'published' },
    longVideo: { id: 'long-1', title: '【完全版】AI活用術 - 生産性10倍アップ', status: 'published' },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'link-2',
    shortVideoId: 'short-2',
    longVideoId: 'long-2',
    linkType: 'pinned_comment',
    linkText: 'フル動画はこちら！',
    status: 'active',
    isActive: true,
    shortVideo: { id: 'short-2', title: '驚きの結果が...', status: 'published' },
    longVideo: { id: 'long-2', title: '検証動画：本当に効果あるのか試してみた', status: 'published' },
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const mockSummary: EngagementSummary = {
  totalLinks: 2,
  activeLinks: 2,
  totalClicks: 1523,
  avgCTR: 3.2,
  totalConversions: 234,
  avgConversionRate: 15.4,
};

// ============================================================
// Engagement Service
// ============================================================

export const engagementService = {
  /**
   * ショート→長尺連携一覧を取得
   */
  async getLinkList(params?: {
    status?: EngagementStatus;
    isActive?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<ShortToLongLinkListResponse> {
    try {
      const response = await api.get<ApiShortToLongLinkListResponse>('/api/v1/engagement/', {
        params,
      });
      return {
        links: response.links.map(mapShortToLongLink),
        total: response.total,
      };
    } catch {
      console.info('[engagementService] Using mock data for link list');
      return {
        links: mockLinks,
        total: mockLinks.length,
      };
    }
  },

  /**
   * ショート→長尺連携を取得
   */
  async getLink(linkId: string): Promise<ShortToLongLink> {
    try {
      const response = await api.get<ApiShortToLongLink>(`/api/v1/engagement/${linkId}`);
      return mapShortToLongLink(response);
    } catch {
      const link = mockLinks.find((l) => l.id === linkId);
      if (link) return link;
      throw new Error('Link not found');
    }
  },

  /**
   * ショート→長尺連携を作成
   */
  async createLink(data: ShortToLongLinkCreateRequest): Promise<ShortToLongLink> {
    const response = await api.post<ApiShortToLongLink>('/api/v1/engagement/', {
      short_video_id: data.shortVideoId,
      long_video_id: data.longVideoId,
      link_type: data.linkType,
      link_text: data.linkText,
      link_position: data.linkPosition,
      is_active: data.isActive ?? true,
    });
    return mapShortToLongLink(response);
  },

  /**
   * ショート→長尺連携を更新
   */
  async updateLink(linkId: string, data: ShortToLongLinkUpdateRequest): Promise<ShortToLongLink> {
    const response = await api.put<ApiShortToLongLink>(`/api/v1/engagement/${linkId}`, {
      link_type: data.linkType,
      link_text: data.linkText,
      link_position: data.linkPosition,
      status: data.status,
      is_active: data.isActive,
    });
    return mapShortToLongLink(response);
  },

  /**
   * ショート→長尺連携を削除
   */
  async deleteLink(linkId: string): Promise<void> {
    await api.delete(`/api/v1/engagement/${linkId}`);
  },

  /**
   * エンゲージメントサマリーを取得
   */
  async getSummary(): Promise<EngagementSummary> {
    try {
      const response = await api.get<ApiEngagementSummary>('/api/v1/engagement/stats/summary');
      return mapEngagementSummary(response);
    } catch {
      return mockSummary;
    }
  },

  /**
   * 連携のパフォーマンスを取得
   */
  async getLinkPerformance(linkId: string, days: number = 30): Promise<LinkPerformance> {
    try {
      const response = await api.get<ApiLinkPerformance>(
        `/api/v1/engagement/${linkId}/performance`,
        { params: { days } }
      );
      return mapLinkPerformance(response);
    } catch {
      return {
        linkId,
        totalShortViews: 0,
        totalClicks: 0,
        ctr: 0,
        totalConversions: 0,
        conversionRate: 0,
        dailyStats: [],
      };
    }
  },
};

export type { ShortToLongLink, ShortToLongLinkListResponse, EngagementSummary, LinkPerformance };
