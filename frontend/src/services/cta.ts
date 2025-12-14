/**
 * CTA Service
 *
 * CTAテンプレート管理、動画割り当て、UTM設定、統計API
 */
import { api } from './api';
import type {
  CTATemplate,
  CTACreateRequest,
  CTAUpdateRequest,
  CTAListResponse,
  CTAStats,
  VideoCTAAssignment,
  UTMDefaultSettings,
  CTAType,
  CTAPlacement,
} from '../types';

// ============================================================
// API レスポンス型定義
// ============================================================

interface ApiCTATemplate {
  id: string;
  name: string;
  type: CTAType;
  url: string;
  utm_params?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  short_url?: string;
  display_text: string;
  placement: CTAPlacement;
  is_active: boolean;
  conversion_count: number;
  ctr?: number;
  created_at: string;
  updated_at: string;
}

interface ApiCTAListResponse {
  ctas: ApiCTATemplate[];
  total: number;
  stats: {
    total_ctas: number;
    active_ctas: number;
    total_clicks: number;
    avg_ctr: number;
  };
}

interface ApiVideoCTAAssignment {
  video_id: string;
  top_cta?: ApiCTATemplate;
  bottom_cta?: ApiCTATemplate;
  pinned_comment_cta?: ApiCTATemplate;
}

interface ApiUTMDefaultSettings {
  id: string;
  default_source: string;
  default_medium: string;
  campaign_naming_rule: string;
  created_at: string;
  updated_at: string;
}

interface ApiCTADetailStats {
  cta_id: string;
  clicks: number;
  ctr: number;
  daily_clicks: { date: string; clicks: number }[];
}

interface ApiGeneratedDescription {
  description: string;
  top_cta_text?: string;
  bottom_cta_text?: string;
}

// ============================================================
// マッピング関数
// ============================================================

const mapCTATemplate = (cta: ApiCTATemplate): CTATemplate => ({
  id: cta.id,
  name: cta.name,
  type: cta.type,
  url: cta.url,
  utmParams: cta.utm_params
    ? {
        source: cta.utm_params.source,
        medium: cta.utm_params.medium,
        campaign: cta.utm_params.campaign,
      }
    : undefined,
  shortUrl: cta.short_url,
  displayText: cta.display_text,
  placement: cta.placement,
  isActive: cta.is_active,
  conversionCount: cta.conversion_count,
  ctr: cta.ctr,
  createdAt: cta.created_at,
  updatedAt: cta.updated_at,
});

const mapCTAListResponse = (response: ApiCTAListResponse): CTAListResponse => ({
  ctas: response.ctas.map(mapCTATemplate),
  total: response.total,
  stats: {
    totalCTAs: response.stats.total_ctas,
    activeCTAs: response.stats.active_ctas,
    totalClicks: response.stats.total_clicks,
    avgCTR: response.stats.avg_ctr,
  },
});

const mapVideoCTAAssignment = (assignment: ApiVideoCTAAssignment): VideoCTAAssignment & {
  topCTA?: CTATemplate;
  bottomCTA?: CTATemplate;
  pinnedCommentCTA?: CTATemplate;
} => ({
  videoId: assignment.video_id,
  topCTAId: assignment.top_cta?.id,
  bottomCTAId: assignment.bottom_cta?.id,
  pinnedCommentCTAId: assignment.pinned_comment_cta?.id,
  topCTA: assignment.top_cta ? mapCTATemplate(assignment.top_cta) : undefined,
  bottomCTA: assignment.bottom_cta ? mapCTATemplate(assignment.bottom_cta) : undefined,
  pinnedCommentCTA: assignment.pinned_comment_cta
    ? mapCTATemplate(assignment.pinned_comment_cta)
    : undefined,
});

const mapUTMSettings = (settings: ApiUTMDefaultSettings): UTMDefaultSettings => ({
  id: settings.id,
  defaultSource: settings.default_source,
  defaultMedium: settings.default_medium,
  campaignNamingRule: settings.campaign_naming_rule,
  createdAt: settings.created_at,
  updatedAt: settings.updated_at,
});

// ============================================================
// モックデータ
// ============================================================

const mockCTAs: CTATemplate[] = [
  {
    id: 'cta-1',
    name: 'LINE公式アカウント誘導',
    type: 'line',
    url: 'https://lin.ee/example',
    utmParams: { source: 'youtube', medium: 'video', campaign: '{video_id}_line' },
    shortUrl: 'https://tinyurl.com/example1',
    displayText: '無料特典を受け取る\nhttps://lin.ee/example',
    placement: 'description_top',
    isActive: true,
    conversionCount: 1234,
    ctr: 3.2,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'cta-2',
    name: 'メルマガ登録',
    type: 'email',
    url: 'https://example.com/subscribe',
    utmParams: { source: 'youtube', medium: 'video', campaign: '{video_id}_email' },
    displayText: '週刊ニュースレターを購読する\nhttps://example.com/subscribe',
    placement: 'description_bottom',
    isActive: true,
    conversionCount: 567,
    ctr: 1.8,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'cta-3',
    name: '無料PDF配布',
    type: 'download',
    url: 'https://example.com/download',
    displayText: '【無料】完全ガイドをダウンロード\nhttps://example.com/download',
    placement: 'pinned_comment',
    isActive: false,
    conversionCount: 89,
    ctr: 0.5,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const mockStats: CTAListResponse['stats'] = {
  totalCTAs: 3,
  activeCTAs: 2,
  totalClicks: 1890,
  avgCTR: 1.83,
};

const mockUTMSettings: UTMDefaultSettings = {
  id: 'utm-settings-1',
  defaultSource: 'youtube',
  defaultMedium: 'video',
  campaignNamingRule: '{video_id}_{cta_type}',
  createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
};

// ============================================================
// CTA Service
// ============================================================

export const ctaService = {
  /**
   * CTA一覧を取得
   */
  async getCTAList(): Promise<CTAListResponse> {
    try {
      const response = await api.get<ApiCTAListResponse>('/api/v1/cta/');
      return mapCTAListResponse(response);
    } catch {
      console.info('[ctaService] Using mock data for CTA list');
      return {
        ctas: mockCTAs,
        total: mockCTAs.length,
        stats: mockStats,
      };
    }
  },

  /**
   * CTA詳細を取得
   */
  async getCTA(ctaId: string): Promise<CTATemplate> {
    try {
      const response = await api.get<ApiCTATemplate>(`/api/v1/cta/${ctaId}`);
      return mapCTATemplate(response);
    } catch {
      const cta = mockCTAs.find((c) => c.id === ctaId);
      if (cta) return cta;
      throw new Error('CTA not found');
    }
  },

  /**
   * CTAを作成
   */
  async createCTA(data: CTACreateRequest): Promise<CTATemplate> {
    const response = await api.post<ApiCTATemplate>('/api/v1/cta/', {
      name: data.name,
      type: data.type,
      url: data.url,
      utm_params: data.utmParams
        ? {
            source: data.utmParams.source,
            medium: data.utmParams.medium,
            campaign: data.utmParams.campaign,
          }
        : undefined,
      display_text: data.displayText,
      placement: data.placement,
      is_active: data.isActive ?? true,
      generate_short_url: data.generateShortUrl ?? false,
    });
    return mapCTATemplate(response);
  },

  /**
   * CTAを更新
   */
  async updateCTA(ctaId: string, data: CTAUpdateRequest): Promise<CTATemplate> {
    const response = await api.put<ApiCTATemplate>(`/api/v1/cta/${ctaId}`, {
      name: data.name,
      type: data.type,
      url: data.url,
      utm_params: data.utmParams
        ? {
            source: data.utmParams.source,
            medium: data.utmParams.medium,
            campaign: data.utmParams.campaign,
          }
        : undefined,
      display_text: data.displayText,
      placement: data.placement,
      is_active: data.isActive,
      generate_short_url: data.generateShortUrl,
    });
    return mapCTATemplate(response);
  },

  /**
   * CTAを削除
   */
  async deleteCTA(ctaId: string): Promise<void> {
    await api.delete(`/api/v1/cta/${ctaId}`);
  },

  /**
   * 配置場所別のアクティブなCTAを取得
   */
  async getCTAsByPlacement(placement: CTAPlacement): Promise<CTATemplate[]> {
    try {
      const response = await api.get<ApiCTATemplate[]>(`/api/v1/cta/placement/${placement}`);
      return response.map(mapCTATemplate);
    } catch {
      return mockCTAs.filter((c) => c.placement === placement && c.isActive);
    }
  },

  /**
   * 動画にCTAを割り当て
   */
  async assignCTAsToVideo(data: VideoCTAAssignment): Promise<VideoCTAAssignment & {
    topCTA?: CTATemplate;
    bottomCTA?: CTATemplate;
    pinnedCommentCTA?: CTATemplate;
  }> {
    const response = await api.post<ApiVideoCTAAssignment>('/api/v1/cta/videos/assign', {
      video_id: data.videoId,
      top_cta_id: data.topCTAId,
      bottom_cta_id: data.bottomCTAId,
      pinned_comment_cta_id: data.pinnedCommentCTAId,
    });
    return mapVideoCTAAssignment(response);
  },

  /**
   * 動画のCTA割り当てを取得
   */
  async getVideoCTAAssignments(videoId: string): Promise<
    VideoCTAAssignment & {
      topCTA?: CTATemplate;
      bottomCTA?: CTATemplate;
      pinnedCommentCTA?: CTATemplate;
    }
  > {
    try {
      const response = await api.get<ApiVideoCTAAssignment>(
        `/api/v1/cta/videos/${videoId}/assignments`
      );
      return mapVideoCTAAssignment(response);
    } catch {
      return {
        videoId,
        topCTAId: undefined,
        bottomCTAId: undefined,
        pinnedCommentCTAId: undefined,
        topCTA: undefined,
        bottomCTA: undefined,
        pinnedCommentCTA: undefined,
      };
    }
  },

  /**
   * CTA付き説明文を生成
   */
  async generateDescriptionWithCTAs(
    videoId: string,
    description: string
  ): Promise<{
    description: string;
    topCTAText?: string;
    bottomCTAText?: string;
  }> {
    const response = await api.post<ApiGeneratedDescription>(
      `/api/v1/cta/videos/${videoId}/description`,
      undefined,
      { params: { description } }
    );
    return {
      description: response.description,
      topCTAText: response.top_cta_text,
      bottomCTAText: response.bottom_cta_text,
    };
  },

  /**
   * UTMデフォルト設定を取得
   */
  async getUTMSettings(): Promise<UTMDefaultSettings | null> {
    try {
      const response = await api.get<ApiUTMDefaultSettings | null>('/api/v1/cta/utm/settings');
      return response ? mapUTMSettings(response) : null;
    } catch {
      return mockUTMSettings;
    }
  },

  /**
   * UTMデフォルト設定を更新
   */
  async updateUTMSettings(data: {
    defaultSource: string;
    defaultMedium: string;
    campaignNamingRule: string;
  }): Promise<UTMDefaultSettings> {
    const response = await api.put<ApiUTMDefaultSettings>('/api/v1/cta/utm/settings', {
      default_source: data.defaultSource,
      default_medium: data.defaultMedium,
      campaign_naming_rule: data.campaignNamingRule,
    });
    return mapUTMSettings(response);
  },

  /**
   * CTA統計を取得
   */
  async getCTAStats(ctaId: string, days: number = 30): Promise<CTAStats> {
    try {
      const response = await api.get<ApiCTADetailStats>(`/api/v1/cta/${ctaId}/stats`, {
        params: { days },
      });
      return {
        ctaId: response.cta_id,
        clicks: response.clicks,
        ctr: response.ctr,
        dailyClicks: response.daily_clicks,
      };
    } catch {
      return {
        ctaId,
        clicks: 0,
        ctr: 0,
        dailyClicks: [],
      };
    }
  },

  /**
   * CTAクリックを記録（トラッキング用）
   */
  async recordClick(
    ctaId: string,
    videoId?: string
  ): Promise<{ success: boolean; message: string }> {
    return api.post(`/api/v1/cta/${ctaId}/click`, undefined, {
      params: { video_id: videoId },
    });
  },
};

export type { CTATemplate, CTACreateRequest, CTAUpdateRequest, CTAListResponse, CTAStats };
