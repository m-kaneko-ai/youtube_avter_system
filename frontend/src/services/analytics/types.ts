/**
 * Analytics Types and Mappers
 */

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

export interface ApiRevenueData {
  id: string;
  source: 'youtube' | 'sponsorship' | 'affiliate' | 'course';
  label: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface ApiMonthlyRevenue {
  month: string;
  amount: number;
}

export interface ApiSeries {
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

export interface ApiKnowledgeItem {
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

export interface ApiTemplate {
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

export interface ApiVideoAnalyticsData {
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

export interface ApiChannelOverview {
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

export interface ApiPerformanceReport {
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

export interface ApiReport {
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

export const mapRevenueData = (data: ApiRevenueData): RevenueData => ({
  id: data.id,
  source: data.source,
  label: data.label,
  amount: data.amount,
  date: data.date,
  createdAt: data.created_at,
});

export const mapSeries = (series: ApiSeries): Series => ({
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

export const mapKnowledgeItem = (item: ApiKnowledgeItem): KnowledgeItem => ({
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

export const mapTemplate = (template: ApiTemplate): Template => ({
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

export const mapVideoAnalyticsData = (data: ApiVideoAnalyticsData): VideoAnalyticsData => ({
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

export const mapChannelOverview = (data: ApiChannelOverview): ChannelOverview => ({
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

export const mapPerformanceReport = (data: ApiPerformanceReport): PerformanceReport => ({
  period: data.period,
  summary: {
    totalViews: data.summary.total_views,
    totalVideosPublished: data.summary.total_videos_published,
    averagePerformance: data.summary.average_performance,
    bestPerformingVideo: data.summary.best_performing_video,
  },
  recommendations: data.recommendations,
});

export const mapReport = (report: ApiReport): Report => ({
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

export interface ReportGenerateRequest {
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

export interface RevenueListResponse {
  revenues: RevenueData[];
  total: number;
}

export interface MonthlyRevenueResponse {
  data: MonthlyRevenue[];
}

export interface SeriesListResponse {
  series: Series[];
  total: number;
}

export interface KnowledgeListResponse {
  items: KnowledgeItem[];
  total: number;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
}

export interface ReportGenerateResponse {
  report: Report;
  estimatedTimeSeconds: number;
}
