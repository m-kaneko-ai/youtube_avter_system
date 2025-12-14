/**
 * Analytics Service
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from './api';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

interface ApiRevenueData {
  id: string;
  source: 'youtube' | 'sponsorship' | 'affiliate' | 'course';
  label: string;
  amount: number;
  date: string;
  created_at: string;
}

interface ApiMonthlyRevenue {
  month: string;
  amount: number;
}

interface ApiSeries {
  id: string;
  name: string;
  description?: string;
  video_count: number;
  total_views: number;
  avg_retention: number;
  status: 'active' | 'paused' | 'completed';
  thumbnail_url?: string;
  last_video_at?: string;
  created_at: string;
  updated_at: string;
}

interface ApiKnowledgeItem {
  id: string;
  type: 'success' | 'insight' | 'pattern' | 'failure';
  title: string;
  content: string;
  source?: string;
  source_video_id?: string;
  impact_score?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ApiTemplate {
  id: string;
  type: 'script' | 'thumbnail' | 'description' | 'voice';
  name: string;
  description?: string;
  content?: string;
  preview_url?: string;
  usage_count: number;
  rating?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ApiVideoAnalyticsData {
  video_id: string;
  date_range: { from: string; to: string };
  total_views: number;
  total_watch_time_minutes: number;
  average_view_duration: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  subscribers_gained: number;
  subscribers_lost: number;
  ctr: number;
  impressions: number;
  daily_data: Array<{
    date: string;
    views: number;
    watch_time_minutes: number;
  }>;
  traffic_sources: Record<string, number>;
  demographics: {
    age_groups: Record<string, number>;
    gender: Record<string, number>;
    countries: Record<string, number>;
  };
}

interface ApiChannelOverview {
  client_id: string;
  date_range: { from: string; to: string };
  total_views: number;
  total_watch_time_minutes: number;
  subscribers: number;
  subscribers_change: number;
  total_videos: number;
  average_ctr: number;
  revenue?: number;
  top_videos: Array<{
    video_id: string;
    title: string;
    views: number;
  }>;
  growth_trend: Array<{
    date: string;
    subscribers: number;
    views: number;
  }>;
}

interface ApiPerformanceReport {
  period: string;
  summary: {
    total_views: number;
    total_videos_published: number;
    average_performance: number;
    best_performing_video: {
      title: string;
      views: number;
    };
  };
  recommendations: string[];
}

interface ApiReport {
  id: string;
  client_id: string;
  report_type: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  title?: string;
  date_from: string;
  date_to: string;
  summary?: string;
  file_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// フロントエンド用型（camelCase）
// ============================================================

export interface RevenueData {
  id: string;
  source: 'youtube' | 'sponsorship' | 'affiliate' | 'course';
  label: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface MonthlyRevenue {
  month: string;
  amount: number;
}

export interface Series {
  id: string;
  name: string;
  description?: string;
  videoCount: number;
  totalViews: number;
  avgRetention: number;
  status: 'active' | 'paused' | 'completed';
  thumbnailUrl?: string;
  lastVideoAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeItem {
  id: string;
  type: 'success' | 'insight' | 'pattern' | 'failure';
  title: string;
  content: string;
  source?: string;
  sourceVideoId?: string;
  impactScore?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  type: 'script' | 'thumbnail' | 'description' | 'voice';
  name: string;
  description?: string;
  content?: string;
  previewUrl?: string;
  usageCount: number;
  rating?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoAnalyticsData {
  videoId: string;
  dateRange: { from: string; to: string };
  totalViews: number;
  totalWatchTimeMinutes: number;
  averageViewDuration: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  ctr: number;
  impressions: number;
  dailyData: Array<{
    date: string;
    views: number;
    watchTimeMinutes: number;
  }>;
  trafficSources: Record<string, number>;
  demographics: {
    ageGroups: Record<string, number>;
    gender: Record<string, number>;
    countries: Record<string, number>;
  };
}

export interface ChannelOverview {
  clientId: string;
  dateRange: { from: string; to: string };
  totalViews: number;
  totalWatchTimeMinutes: number;
  subscribers: number;
  subscribersChange: number;
  totalVideos: number;
  averageCtr: number;
  revenue?: number;
  topVideos: Array<{
    videoId: string;
    title: string;
    views: number;
  }>;
  growthTrend: Array<{
    date: string;
    subscribers: number;
    views: number;
  }>;
}

export interface PerformanceReport {
  period: string;
  summary: {
    totalViews: number;
    totalVideosPublished: number;
    averagePerformance: number;
    bestPerformingVideo: {
      title: string;
      views: number;
    };
  };
  recommendations: string[];
}

export interface Report {
  id: string;
  clientId: string;
  reportType: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  title?: string;
  dateFrom: string;
  dateTo: string;
  summary?: string;
  fileUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// マッピング関数
// ============================================================

const mapRevenueData = (data: ApiRevenueData): RevenueData => ({
  id: data.id,
  source: data.source,
  label: data.label,
  amount: data.amount,
  date: data.date,
  createdAt: data.created_at,
});

const mapSeries = (series: ApiSeries): Series => ({
  id: series.id,
  name: series.name,
  description: series.description,
  videoCount: series.video_count,
  totalViews: series.total_views,
  avgRetention: series.avg_retention,
  status: series.status,
  thumbnailUrl: series.thumbnail_url,
  lastVideoAt: series.last_video_at,
  createdAt: series.created_at,
  updatedAt: series.updated_at,
});

const mapKnowledgeItem = (item: ApiKnowledgeItem): KnowledgeItem => ({
  id: item.id,
  type: item.type,
  title: item.title,
  content: item.content,
  source: item.source,
  sourceVideoId: item.source_video_id,
  impactScore: item.impact_score,
  tags: item.tags,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const mapTemplate = (template: ApiTemplate): Template => ({
  id: template.id,
  type: template.type,
  name: template.name,
  description: template.description,
  content: template.content,
  previewUrl: template.preview_url,
  usageCount: template.usage_count,
  rating: template.rating,
  tags: template.tags,
  createdAt: template.created_at,
  updatedAt: template.updated_at,
});

const mapVideoAnalyticsData = (data: ApiVideoAnalyticsData): VideoAnalyticsData => ({
  videoId: data.video_id,
  dateRange: data.date_range,
  totalViews: data.total_views,
  totalWatchTimeMinutes: data.total_watch_time_minutes,
  averageViewDuration: data.average_view_duration,
  likes: data.likes,
  dislikes: data.dislikes,
  comments: data.comments,
  shares: data.shares,
  subscribersGained: data.subscribers_gained,
  subscribersLost: data.subscribers_lost,
  ctr: data.ctr,
  impressions: data.impressions,
  dailyData: data.daily_data.map((d) => ({
    date: d.date,
    views: d.views,
    watchTimeMinutes: d.watch_time_minutes,
  })),
  trafficSources: data.traffic_sources,
  demographics: {
    ageGroups: data.demographics.age_groups,
    gender: data.demographics.gender,
    countries: data.demographics.countries,
  },
});

const mapChannelOverview = (data: ApiChannelOverview): ChannelOverview => ({
  clientId: data.client_id,
  dateRange: data.date_range,
  totalViews: data.total_views,
  totalWatchTimeMinutes: data.total_watch_time_minutes,
  subscribers: data.subscribers,
  subscribersChange: data.subscribers_change,
  totalVideos: data.total_videos,
  averageCtr: data.average_ctr,
  revenue: data.revenue,
  topVideos: data.top_videos.map((v) => ({
    videoId: v.video_id,
    title: v.title,
    views: v.views,
  })),
  growthTrend: data.growth_trend,
});

const mapPerformanceReport = (data: ApiPerformanceReport): PerformanceReport => ({
  period: data.period,
  summary: {
    totalViews: data.summary.total_views,
    totalVideosPublished: data.summary.total_videos_published,
    averagePerformance: data.summary.average_performance,
    bestPerformingVideo: data.summary.best_performing_video,
  },
  recommendations: data.recommendations,
});

const mapReport = (report: ApiReport): Report => ({
  id: report.id,
  clientId: report.client_id,
  reportType: report.report_type,
  status: report.status,
  title: report.title,
  dateFrom: report.date_from,
  dateTo: report.date_to,
  summary: report.summary,
  fileUrl: report.file_url,
  errorMessage: report.error_message,
  createdAt: report.created_at,
  updatedAt: report.updated_at,
});

// ============================================================
// リクエスト型
// ============================================================

interface ReportGenerateRequest {
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateFrom: string;
  dateTo: string;
  title?: string;
  includeVideoDetails?: boolean;
  includeRecommendations?: boolean;
  exportFormat?: 'pdf' | 'csv' | 'json';
}

// ============================================================
// レスポンス型
// ============================================================

interface RevenueListResponse {
  revenues: RevenueData[];
  total: number;
}

interface MonthlyRevenueResponse {
  data: MonthlyRevenue[];
}

interface SeriesListResponse {
  series: Series[];
  total: number;
}

interface KnowledgeListResponse {
  items: KnowledgeItem[];
  total: number;
}

interface TemplateListResponse {
  templates: Template[];
  total: number;
}

interface ReportGenerateResponse {
  report: Report;
  estimatedTimeSeconds: number;
}

// ============================================================
// モックデータ（API接続エラー時のフォールバック）
// ============================================================

const mockRevenueData: RevenueData[] = [
  { id: 'rev-1', source: 'youtube', label: 'YouTube広告収益', amount: 125000, date: '2024-12', createdAt: new Date().toISOString() },
  { id: 'rev-2', source: 'sponsorship', label: 'スポンサー案件A', amount: 300000, date: '2024-12', createdAt: new Date().toISOString() },
  { id: 'rev-3', source: 'affiliate', label: 'アフィリエイト', amount: 45000, date: '2024-12', createdAt: new Date().toISOString() },
  { id: 'rev-4', source: 'course', label: 'オンライン講座', amount: 180000, date: '2024-12', createdAt: new Date().toISOString() },
];

const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: '2024-07', amount: 450000 },
  { month: '2024-08', amount: 520000 },
  { month: '2024-09', amount: 480000 },
  { month: '2024-10', amount: 610000 },
  { month: '2024-11', amount: 580000 },
  { month: '2024-12', amount: 650000 },
];

const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: 'know-1',
    type: 'success',
    title: '冒頭15秒で視聴維持率が決まる',
    content: 'フックを最初の15秒に入れることで、視聴維持率が平均20%向上しました。',
    source: '動画分析レポート',
    impactScore: 95,
    tags: ['視聴維持', 'フック', '冒頭'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'know-2',
    type: 'insight',
    title: 'サムネイルの顔出しで CTR 向上',
    content: '人物の顔をサムネイルに入れるとCTRが1.5倍になる傾向があります。',
    source: 'A/Bテスト結果',
    impactScore: 85,
    tags: ['サムネイル', 'CTR', '顔出し'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'know-3',
    type: 'pattern',
    title: '週2回投稿がベストペース',
    content: '週2回の投稿頻度が視聴者の期待感と負担のバランスが最適です。',
    source: 'チャンネル分析',
    impactScore: 75,
    tags: ['投稿頻度', '戦略'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTemplates: Template[] = [
  {
    id: 'tmpl-1',
    type: 'script',
    name: '解説動画テンプレート',
    description: '教育系解説動画の基本構成テンプレート',
    usageCount: 24,
    rating: 4.8,
    tags: ['解説', '教育'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-2',
    type: 'thumbnail',
    name: 'インパクトサムネイル',
    description: '高CTRを狙う強調デザインテンプレート',
    usageCount: 18,
    rating: 4.5,
    tags: ['サムネイル', 'CTR'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-3',
    type: 'description',
    name: 'SEO最適化説明文',
    description: '検索上位表示を狙う説明文テンプレート',
    usageCount: 32,
    rating: 4.6,
    tags: ['SEO', '説明文'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-4',
    type: 'voice',
    name: 'ナレーション設定A',
    description: '落ち着いたトーンの解説向け音声設定',
    usageCount: 15,
    rating: 4.3,
    tags: ['音声', 'ナレーション'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockSeries: Series[] = [
  {
    id: 'series-1',
    name: 'AIツール徹底解説シリーズ',
    description: '最新AIツールを分かりやすく解説',
    videoCount: 12,
    totalViews: 450000,
    avgRetention: 65,
    status: 'active',
    lastVideoAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'series-2',
    name: 'プログラミング入門講座',
    description: '初心者向けプログラミング基礎',
    videoCount: 8,
    totalViews: 280000,
    avgRetention: 58,
    status: 'active',
    lastVideoAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'series-3',
    name: '業界ニュース週刊まとめ',
    description: '毎週のテック業界ニュースを解説',
    videoCount: 20,
    totalViews: 180000,
    avgRetention: 52,
    status: 'paused',
    lastVideoAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================
// サービスエクスポート
// ============================================================

export const analyticsService = {
  /**
   * 収益データ取得
   */
  async getRevenues(dateFrom?: string, dateTo?: string): Promise<RevenueListResponse> {
    try {
      const response = await api.get<{ revenues: ApiRevenueData[]; total: number }>(
        '/api/v1/analytics/revenue',
        { params: { date_from: dateFrom, date_to: dateTo } }
      );
      return {
        revenues: response.revenues.map(mapRevenueData),
        total: response.total,
      };
    } catch {
      console.info('[analyticsService] Using mock data for revenues');
      return {
        revenues: mockRevenueData,
        total: mockRevenueData.length,
      };
    }
  },

  /**
   * 月別収益データ取得
   */
  async getMonthlyRevenue(year?: number): Promise<MonthlyRevenueResponse> {
    try {
      const response = await api.get<{ data: ApiMonthlyRevenue[] }>(
        '/api/v1/analytics/revenue/monthly',
        { params: { year } }
      );
      return {
        data: response.data,
      };
    } catch {
      console.info('[analyticsService] Using mock data for monthly revenue');
      return {
        data: mockMonthlyRevenue,
      };
    }
  },

  /**
   * シリーズ一覧取得
   */
  async getSeries(status?: Series['status']): Promise<SeriesListResponse> {
    try {
      const response = await api.get<{ series: ApiSeries[]; total: number }>(
        '/api/v1/analytics/series',
        { params: { status } }
      );
      return {
        series: response.series.map(mapSeries),
        total: response.total,
      };
    } catch {
      console.info('[analyticsService] Using mock data for series');
      const filtered = status ? mockSeries.filter(s => s.status === status) : mockSeries;
      return {
        series: filtered,
        total: filtered.length,
      };
    }
  },

  /**
   * ナレッジ一覧取得
   */
  async getKnowledge(type?: KnowledgeItem['type']): Promise<KnowledgeListResponse> {
    try {
      const response = await api.get<{ items: ApiKnowledgeItem[]; total: number }>(
        '/api/v1/analytics/knowledge',
        { params: { type } }
      );
      return {
        items: response.items.map(mapKnowledgeItem),
        total: response.total,
      };
    } catch {
      console.info('[analyticsService] Using mock data for knowledge');
      const filtered = type ? mockKnowledgeItems.filter(k => k.type === type) : mockKnowledgeItems;
      return {
        items: filtered,
        total: filtered.length,
      };
    }
  },

  /**
   * テンプレート一覧取得
   */
  async getTemplates(type?: Template['type']): Promise<TemplateListResponse> {
    try {
      const response = await api.get<{ templates: ApiTemplate[]; total: number }>(
        '/api/v1/analytics/templates',
        { params: { type } }
      );
      return {
        templates: response.templates.map(mapTemplate),
        total: response.total,
      };
    } catch {
      console.info('[analyticsService] Using mock data for templates');
      const filtered = type ? mockTemplates.filter(t => t.type === type) : mockTemplates;
      return {
        templates: filtered,
        total: filtered.length,
      };
    }
  },

  /**
   * 動画分析データ取得
   */
  async getVideoAnalytics(
    videoId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<VideoAnalyticsData> {
    const response = await api.get<ApiVideoAnalyticsData>(`/api/v1/analytics/video/${videoId}`, {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return mapVideoAnalyticsData(response);
  },

  /**
   * チャンネル概要取得
   */
  async getChannelOverview(dateFrom?: string, dateTo?: string): Promise<ChannelOverview> {
    const response = await api.get<ApiChannelOverview>('/api/v1/analytics/channel', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return mapChannelOverview(response);
  },

  /**
   * パフォーマンスレポート取得
   */
  async getPerformanceReport(dateFrom?: string, dateTo?: string): Promise<PerformanceReport> {
    const response = await api.get<ApiPerformanceReport>('/api/v1/analytics/performance', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return mapPerformanceReport(response);
  },

  /**
   * レポート生成
   */
  async generateReport(request: ReportGenerateRequest): Promise<ReportGenerateResponse> {
    const response = await api.post<{ report: ApiReport; estimated_time_seconds: number }>(
      '/api/v1/analytics/report',
      {
        report_type: request.reportType,
        date_from: request.dateFrom,
        date_to: request.dateTo,
        title: request.title,
        include_video_details: request.includeVideoDetails,
        include_recommendations: request.includeRecommendations,
        export_format: request.exportFormat,
      }
    );
    return {
      report: mapReport(response.report),
      estimatedTimeSeconds: response.estimated_time_seconds,
    };
  },
};
