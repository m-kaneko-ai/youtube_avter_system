/**
 * Optimization Service
 *
 * リテンション分析、A/Bテスト、最適投稿時間、終了画面最適化API
 */
import { api } from './api';
import type {
  RetentionCurve,
  RetentionCurveCreateRequest,
  RetentionEvent,
  RetentionAnalysisResponse,
  RetentionDataPoint,
  RetentionEventType,
  ABTest,
  ABTestCreateRequest,
  ABTestUpdateRequest,
  ABTestListResponse,
  ABTestResultResponse,
  ABTestVariant,
  ABTestStatus,
  ABTestType,
  PostingTimeAnalysis,
  PostingTimeAnalysisCreateRequest,
  PostingScheduleRecommendation,
  PostingScheduleRecommendationCreateRequest,
  DayPerformance,
  HourPerformance,
  RecommendedSlot,
  EndScreen,
  EndScreenCreateRequest,
  EndScreenUpdateRequest,
  EndScreenElement,
  EndScreenElementType,
  EndScreenPosition,
  EndScreenTemplate,
  EndScreenTemplateCreateRequest,
  EndScreenTemplateUpdateRequest,
  EndScreenTemplateListResponse,
  OptimizationSummary,
} from '../types';

// ============================================================
// API レスポンス型定義
// ============================================================

interface ApiRetentionDataPoint {
  timestamp: number;
  retention_rate: number;
}

interface ApiRetentionEvent {
  id: string;
  retention_curve_id: string;
  event_type: RetentionEventType;
  timestamp_seconds: number;
  timestamp_percentage?: number;
  retention_before?: number;
  retention_after?: number;
  change_rate?: number;
  content_at_timestamp?: string;
  analysis_notes?: string;
  recommended_action?: string;
  created_at: string;
}

interface ApiRetentionCurve {
  id: string;
  video_id: string;
  knowledge_id?: string;
  data_points: ApiRetentionDataPoint[];
  avg_view_percentage?: number;
  avg_view_duration_seconds?: number;
  hook_retention?: number;
  mid_retention?: number;
  end_retention?: number;
  major_drop_points?: ApiRetentionDataPoint[];
  recovery_points?: ApiRetentionDataPoint[];
  benchmark_comparison?: number;
  category_rank?: number;
  video_length_seconds?: number;
  sample_size: number;
  recorded_at: string;
  events: ApiRetentionEvent[];
  created_at: string;
  updated_at: string;
}

interface ApiABTestVariant {
  id: string;
  ab_test_id: string;
  variant_name: string;
  is_control: boolean;
  content?: string;
  image_url?: string;
  image_data?: Record<string, unknown>;
  impressions: number;
  clicks: number;
  views: number;
  ctr?: number;
  avg_view_duration?: number;
  avg_view_percentage?: number;
  likes: number;
  comments: number;
  shares: number;
  subscribers_gained: number;
  created_at: string;
  updated_at: string;
}

interface ApiABTest {
  id: string;
  video_id: string;
  knowledge_id?: string;
  created_by?: string;
  name: string;
  description?: string;
  test_type: ABTestType;
  status: ABTestStatus;
  started_at?: string;
  ended_at?: string;
  duration_hours: number;
  traffic_split: number;
  min_sample_size: number;
  confidence_level: number;
  winner_variant?: string;
  statistical_significance?: number;
  variants: ApiABTestVariant[];
  created_at: string;
  updated_at: string;
}

interface ApiDayPerformance {
  day: number;
  avg_views: number;
  avg_ctr: number;
  sample_count: number;
}

interface ApiHourPerformance {
  hour: number;
  avg_views: number;
  avg_ctr: number;
  sample_count: number;
}

interface ApiRecommendedSlot {
  day: number;
  hour: number;
  score: number;
  reasoning?: string;
}

interface ApiPostingTimeAnalysis {
  id: string;
  knowledge_id: string;
  video_type?: string;
  analysis_period_days: number;
  sample_size: number;
  optimal_day_of_week?: number;
  optimal_hour?: number;
  optimal_minute: number;
  day_performance?: ApiDayPerformance[];
  hour_performance?: ApiHourPerformance[];
  heatmap_data?: number[][];
  recommended_slots?: ApiRecommendedSlot[];
  competitor_posting_times?: Record<string, unknown>;
  avoid_times?: Record<string, unknown>[];
  confidence_score?: number;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

interface ApiPostingScheduleRecommendation {
  id: string;
  analysis_id: string;
  video_id?: string;
  recommended_datetime: string;
  recommended_day_of_week: number;
  recommended_hour: number;
  score: number;
  reasoning?: string;
  predicted_initial_views?: number;
  predicted_ctr?: number;
  is_accepted: boolean;
  actual_posted_at?: string;
  actual_initial_views?: number;
  actual_ctr?: number;
  accuracy_score?: number;
  created_at: string;
}

interface ApiEndScreenElement {
  id: string;
  end_screen_id: string;
  element_type: EndScreenElementType;
  position: EndScreenPosition;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  start_offset_seconds: number;
  duration_seconds?: number;
  target_video_id?: string;
  target_playlist_id?: string;
  target_url?: string;
  custom_message?: string;
  display_text?: string;
  thumbnail_url?: string;
  display_order: number;
  impressions: number;
  clicks: number;
  click_through_rate?: number;
  created_at: string;
  updated_at: string;
}

interface ApiEndScreen {
  id: string;
  video_id: string;
  knowledge_id?: string;
  start_time_seconds: number;
  duration_seconds: number;
  background_type: string;
  background_color?: string;
  background_image_url?: string;
  total_clicks: number;
  click_through_rate?: number;
  is_active: boolean;
  is_published: boolean;
  elements: ApiEndScreenElement[];
  created_at: string;
  updated_at: string;
}

interface ApiEndScreenTemplate {
  id: string;
  knowledge_id?: string;
  created_by?: string;
  name: string;
  description?: string;
  video_type?: string;
  layout: Record<string, unknown>;
  element_configs?: Record<string, unknown>[];
  avg_click_through_rate?: number;
  usage_count: number;
  is_default: boolean;
  is_active: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface ApiOptimizationSummary {
  total_ab_tests: number;
  active_ab_tests: number;
  completed_ab_tests: number;
  avg_ctr_improvement?: number;
  total_end_screens: number;
  avg_end_screen_ctr?: number;
  posting_time_analyses: number;
  avg_posting_accuracy?: number;
}

interface ApiABTestResult {
  test: ApiABTest;
  winner?: ApiABTestVariant;
  statistical_significance: number;
  confidence_interval: Record<string, number>;
  recommendation: string;
}

interface ApiRetentionAnalysisResponse {
  curve: ApiRetentionCurve;
  drop_points: ApiRetentionEvent[];
  recommendations: string[];
  overall_score: number;
  comparison_to_average: number;
}

// ============================================================
// マッピング関数
// ============================================================

const mapRetentionDataPoint = (dp: ApiRetentionDataPoint): RetentionDataPoint => ({
  timestamp: dp.timestamp,
  retentionRate: dp.retention_rate,
});

const mapRetentionEvent = (event: ApiRetentionEvent): RetentionEvent => ({
  id: event.id,
  retentionCurveId: event.retention_curve_id,
  eventType: event.event_type,
  timestampSeconds: event.timestamp_seconds,
  timestampPercentage: event.timestamp_percentage,
  retentionBefore: event.retention_before,
  retentionAfter: event.retention_after,
  changeRate: event.change_rate,
  contentAtTimestamp: event.content_at_timestamp,
  analysisNotes: event.analysis_notes,
  recommendedAction: event.recommended_action,
  createdAt: event.created_at,
});

const mapRetentionCurve = (curve: ApiRetentionCurve): RetentionCurve => ({
  id: curve.id,
  videoId: curve.video_id,
  knowledgeId: curve.knowledge_id,
  dataPoints: curve.data_points.map(mapRetentionDataPoint),
  avgViewPercentage: curve.avg_view_percentage,
  avgViewDurationSeconds: curve.avg_view_duration_seconds,
  hookRetention: curve.hook_retention,
  midRetention: curve.mid_retention,
  endRetention: curve.end_retention,
  majorDropPoints: curve.major_drop_points?.map(mapRetentionDataPoint),
  recoveryPoints: curve.recovery_points?.map(mapRetentionDataPoint),
  benchmarkComparison: curve.benchmark_comparison,
  categoryRank: curve.category_rank,
  videoLengthSeconds: curve.video_length_seconds,
  sampleSize: curve.sample_size,
  recordedAt: curve.recorded_at,
  events: curve.events.map(mapRetentionEvent),
  createdAt: curve.created_at,
  updatedAt: curve.updated_at,
});

const mapABTestVariant = (variant: ApiABTestVariant): ABTestVariant => ({
  id: variant.id,
  abTestId: variant.ab_test_id,
  variantName: variant.variant_name,
  isControl: variant.is_control,
  content: variant.content,
  imageUrl: variant.image_url,
  imageData: variant.image_data,
  impressions: variant.impressions,
  clicks: variant.clicks,
  views: variant.views,
  ctr: variant.ctr,
  avgViewDuration: variant.avg_view_duration,
  avgViewPercentage: variant.avg_view_percentage,
  likes: variant.likes,
  comments: variant.comments,
  shares: variant.shares,
  subscribersGained: variant.subscribers_gained,
  createdAt: variant.created_at,
  updatedAt: variant.updated_at,
});

const mapABTest = (test: ApiABTest): ABTest => ({
  id: test.id,
  videoId: test.video_id,
  knowledgeId: test.knowledge_id,
  createdBy: test.created_by,
  name: test.name,
  description: test.description,
  testType: test.test_type,
  status: test.status,
  startedAt: test.started_at,
  endedAt: test.ended_at,
  durationHours: test.duration_hours,
  trafficSplit: test.traffic_split,
  minSampleSize: test.min_sample_size,
  confidenceLevel: test.confidence_level,
  winnerVariant: test.winner_variant,
  statisticalSignificance: test.statistical_significance,
  variants: test.variants.map(mapABTestVariant),
  createdAt: test.created_at,
  updatedAt: test.updated_at,
});

const mapDayPerformance = (dp: ApiDayPerformance): DayPerformance => ({
  day: dp.day,
  avgViews: dp.avg_views,
  avgCtr: dp.avg_ctr,
  sampleCount: dp.sample_count,
});

const mapHourPerformance = (hp: ApiHourPerformance): HourPerformance => ({
  hour: hp.hour,
  avgViews: hp.avg_views,
  avgCtr: hp.avg_ctr,
  sampleCount: hp.sample_count,
});

const mapRecommendedSlot = (slot: ApiRecommendedSlot): RecommendedSlot => ({
  day: slot.day,
  hour: slot.hour,
  score: slot.score,
  reasoning: slot.reasoning,
});

const mapPostingTimeAnalysis = (analysis: ApiPostingTimeAnalysis): PostingTimeAnalysis => ({
  id: analysis.id,
  knowledgeId: analysis.knowledge_id,
  videoType: analysis.video_type,
  analysisPeriodDays: analysis.analysis_period_days,
  sampleSize: analysis.sample_size,
  optimalDayOfWeek: analysis.optimal_day_of_week,
  optimalHour: analysis.optimal_hour,
  optimalMinute: analysis.optimal_minute,
  dayPerformance: analysis.day_performance?.map(mapDayPerformance),
  hourPerformance: analysis.hour_performance?.map(mapHourPerformance),
  heatmapData: analysis.heatmap_data,
  recommendedSlots: analysis.recommended_slots?.map(mapRecommendedSlot),
  competitorPostingTimes: analysis.competitor_posting_times,
  avoidTimes: analysis.avoid_times,
  confidenceScore: analysis.confidence_score,
  analyzedAt: analysis.analyzed_at,
  createdAt: analysis.created_at,
  updatedAt: analysis.updated_at,
});

const mapPostingScheduleRecommendation = (rec: ApiPostingScheduleRecommendation): PostingScheduleRecommendation => ({
  id: rec.id,
  analysisId: rec.analysis_id,
  videoId: rec.video_id,
  recommendedDatetime: rec.recommended_datetime,
  recommendedDayOfWeek: rec.recommended_day_of_week,
  recommendedHour: rec.recommended_hour,
  score: rec.score,
  reasoning: rec.reasoning,
  predictedInitialViews: rec.predicted_initial_views,
  predictedCtr: rec.predicted_ctr,
  isAccepted: rec.is_accepted,
  actualPostedAt: rec.actual_posted_at,
  actualInitialViews: rec.actual_initial_views,
  actualCtr: rec.actual_ctr,
  accuracyScore: rec.accuracy_score,
  createdAt: rec.created_at,
});

const mapEndScreenElement = (element: ApiEndScreenElement): EndScreenElement => ({
  id: element.id,
  endScreenId: element.end_screen_id,
  elementType: element.element_type,
  position: element.position,
  positionX: element.position_x,
  positionY: element.position_y,
  width: element.width,
  height: element.height,
  startOffsetSeconds: element.start_offset_seconds,
  durationSeconds: element.duration_seconds,
  targetVideoId: element.target_video_id,
  targetPlaylistId: element.target_playlist_id,
  targetUrl: element.target_url,
  customMessage: element.custom_message,
  displayText: element.display_text,
  thumbnailUrl: element.thumbnail_url,
  displayOrder: element.display_order,
  impressions: element.impressions,
  clicks: element.clicks,
  clickThroughRate: element.click_through_rate,
  createdAt: element.created_at,
  updatedAt: element.updated_at,
});

const mapEndScreen = (screen: ApiEndScreen): EndScreen => ({
  id: screen.id,
  videoId: screen.video_id,
  knowledgeId: screen.knowledge_id,
  startTimeSeconds: screen.start_time_seconds,
  durationSeconds: screen.duration_seconds,
  backgroundType: screen.background_type,
  backgroundColor: screen.background_color,
  backgroundImageUrl: screen.background_image_url,
  totalClicks: screen.total_clicks,
  clickThroughRate: screen.click_through_rate,
  isActive: screen.is_active,
  isPublished: screen.is_published,
  elements: screen.elements.map(mapEndScreenElement),
  createdAt: screen.created_at,
  updatedAt: screen.updated_at,
});

const mapEndScreenTemplate = (template: ApiEndScreenTemplate): EndScreenTemplate => ({
  id: template.id,
  knowledgeId: template.knowledge_id,
  createdBy: template.created_by,
  name: template.name,
  description: template.description,
  videoType: template.video_type,
  layout: template.layout,
  elementConfigs: template.element_configs,
  avgClickThroughRate: template.avg_click_through_rate,
  usageCount: template.usage_count,
  isDefault: template.is_default,
  isActive: template.is_active,
  tags: template.tags,
  createdAt: template.created_at,
  updatedAt: template.updated_at,
});

const mapOptimizationSummary = (summary: ApiOptimizationSummary): OptimizationSummary => ({
  totalAbTests: summary.total_ab_tests,
  activeAbTests: summary.active_ab_tests,
  completedAbTests: summary.completed_ab_tests,
  avgCtrImprovement: summary.avg_ctr_improvement,
  totalEndScreens: summary.total_end_screens,
  avgEndScreenCtr: summary.avg_end_screen_ctr,
  postingTimeAnalyses: summary.posting_time_analyses,
  avgPostingAccuracy: summary.avg_posting_accuracy,
});

// ============================================================
// モックデータ
// ============================================================

const mockSummary: OptimizationSummary = {
  totalAbTests: 0,
  activeAbTests: 0,
  completedAbTests: 0,
  avgCtrImprovement: undefined,
  totalEndScreens: 0,
  avgEndScreenCtr: undefined,
  postingTimeAnalyses: 0,
  avgPostingAccuracy: undefined,
};

// ============================================================
// Optimization Service
// ============================================================

export const optimizationService = {
  // ============================================================
  // Retention Analysis
  // ============================================================

  async createRetentionCurve(data: RetentionCurveCreateRequest): Promise<RetentionCurve> {
    const response = await api.post<ApiRetentionCurve>('/api/v1/optimization/retention', {
      video_id: data.videoId,
      knowledge_id: data.knowledgeId,
      data_points: data.dataPoints.map((dp) => ({
        timestamp: dp.timestamp,
        retention_rate: dp.retentionRate,
      })),
      video_length_seconds: data.videoLengthSeconds,
      sample_size: data.sampleSize ?? 0,
    });
    return mapRetentionCurve(response);
  },

  async getRetentionCurve(videoId: string): Promise<RetentionCurve | null> {
    try {
      const response = await api.get<ApiRetentionCurve>(`/api/v1/optimization/retention/${videoId}`);
      return mapRetentionCurve(response);
    } catch {
      return null;
    }
  },

  async analyzeRetention(videoId: string, includeRecommendations: boolean = true): Promise<RetentionAnalysisResponse | null> {
    try {
      const response = await api.post<ApiRetentionAnalysisResponse>('/api/v1/optimization/retention/analyze', {
        video_id: videoId,
        include_recommendations: includeRecommendations,
      });
      return {
        curve: mapRetentionCurve(response.curve),
        dropPoints: response.drop_points.map(mapRetentionEvent),
        recommendations: response.recommendations,
        overallScore: response.overall_score,
        comparisonToAverage: response.comparison_to_average,
      };
    } catch {
      return null;
    }
  },

  // ============================================================
  // A/B Testing
  // ============================================================

  async getABTests(params?: {
    videoId?: string;
    knowledgeId?: string;
    status?: ABTestStatus;
    testType?: ABTestType;
    skip?: number;
    limit?: number;
  }): Promise<ABTestListResponse> {
    try {
      const response = await api.get<{ tests: ApiABTest[]; total: number }>('/api/v1/optimization/abtest', {
        params: {
          video_id: params?.videoId,
          knowledge_id: params?.knowledgeId,
          status: params?.status,
          test_type: params?.testType,
          skip: params?.skip,
          limit: params?.limit,
        },
      });
      return {
        tests: response.tests.map(mapABTest),
        total: response.total,
      };
    } catch {
      return { tests: [], total: 0 };
    }
  },

  async createABTest(data: ABTestCreateRequest): Promise<ABTest> {
    const response = await api.post<ApiABTest>('/api/v1/optimization/abtest', {
      video_id: data.videoId,
      knowledge_id: data.knowledgeId,
      name: data.name,
      description: data.description,
      test_type: data.testType,
      duration_hours: data.durationHours ?? 24,
      traffic_split: data.trafficSplit ?? 50.0,
      min_sample_size: data.minSampleSize ?? 1000,
      confidence_level: data.confidenceLevel ?? 0.95,
      variants: data.variants.map((v) => ({
        variant_name: v.variantName,
        is_control: v.isControl ?? false,
        content: v.content,
        image_url: v.imageUrl,
        image_data: v.imageData,
      })),
    });
    return mapABTest(response);
  },

  async getABTest(testId: string): Promise<ABTest | null> {
    try {
      const response = await api.get<ApiABTest>(`/api/v1/optimization/abtest/${testId}`);
      return mapABTest(response);
    } catch {
      return null;
    }
  },

  async updateABTest(testId: string, data: ABTestUpdateRequest): Promise<ABTest> {
    const response = await api.put<ApiABTest>(`/api/v1/optimization/abtest/${testId}`, {
      name: data.name,
      description: data.description,
      status: data.status,
      duration_hours: data.durationHours,
      traffic_split: data.trafficSplit,
    });
    return mapABTest(response);
  },

  async startABTest(testId: string): Promise<ABTest> {
    const response = await api.post<ApiABTest>(`/api/v1/optimization/abtest/${testId}/start`);
    return mapABTest(response);
  },

  async stopABTest(testId: string): Promise<ABTest> {
    const response = await api.post<ApiABTest>(`/api/v1/optimization/abtest/${testId}/stop`);
    return mapABTest(response);
  },

  async getABTestResult(testId: string): Promise<ABTestResultResponse | null> {
    try {
      const response = await api.get<ApiABTestResult>(`/api/v1/optimization/abtest/${testId}/result`);
      return {
        test: mapABTest(response.test),
        winner: response.winner ? mapABTestVariant(response.winner) : undefined,
        statisticalSignificance: response.statistical_significance,
        confidenceInterval: response.confidence_interval,
        recommendation: response.recommendation,
      };
    } catch {
      return null;
    }
  },

  // ============================================================
  // Posting Time Optimization
  // ============================================================

  async getPostingTimeAnalysis(knowledgeId: string): Promise<PostingTimeAnalysis | null> {
    try {
      const response = await api.get<ApiPostingTimeAnalysis>(`/api/v1/optimization/posting-time/${knowledgeId}`);
      return mapPostingTimeAnalysis(response);
    } catch {
      return null;
    }
  },

  async createPostingTimeAnalysis(data: PostingTimeAnalysisCreateRequest): Promise<PostingTimeAnalysis> {
    const response = await api.post<ApiPostingTimeAnalysis>('/api/v1/optimization/posting-time', {
      knowledge_id: data.knowledgeId,
      video_type: data.videoType,
      analysis_period_days: data.analysisPeriodDays ?? 90,
    });
    return mapPostingTimeAnalysis(response);
  },

  async createPostingScheduleRecommendation(data: PostingScheduleRecommendationCreateRequest): Promise<PostingScheduleRecommendation> {
    const response = await api.post<ApiPostingScheduleRecommendation>('/api/v1/optimization/posting-time/recommendation', {
      analysis_id: data.analysisId,
      video_id: data.videoId,
      recommended_datetime: data.recommendedDatetime,
    });
    return mapPostingScheduleRecommendation(response);
  },

  async acceptPostingRecommendation(recommendationId: string): Promise<PostingScheduleRecommendation> {
    const response = await api.post<ApiPostingScheduleRecommendation>(`/api/v1/optimization/posting-time/recommendation/${recommendationId}/accept`);
    return mapPostingScheduleRecommendation(response);
  },

  // ============================================================
  // End Screen Optimization
  // ============================================================

  async getEndScreen(videoId: string): Promise<EndScreen | null> {
    try {
      const response = await api.get<ApiEndScreen>(`/api/v1/optimization/end-screen/${videoId}`);
      return mapEndScreen(response);
    } catch {
      return null;
    }
  },

  async createEndScreen(data: EndScreenCreateRequest): Promise<EndScreen> {
    const response = await api.post<ApiEndScreen>('/api/v1/optimization/end-screen', {
      video_id: data.videoId,
      knowledge_id: data.knowledgeId,
      start_time_seconds: data.startTimeSeconds,
      duration_seconds: data.durationSeconds ?? 20.0,
      background_type: data.backgroundType ?? 'video',
      background_color: data.backgroundColor,
      background_image_url: data.backgroundImageUrl,
      elements: data.elements?.map((e) => ({
        element_type: e.elementType,
        position: e.position,
        position_x: e.positionX,
        position_y: e.positionY,
        width: e.width,
        height: e.height,
        start_offset_seconds: e.startOffsetSeconds ?? 0,
        duration_seconds: e.durationSeconds,
        target_video_id: e.targetVideoId,
        target_playlist_id: e.targetPlaylistId,
        target_url: e.targetUrl,
        custom_message: e.customMessage,
        display_text: e.displayText,
        thumbnail_url: e.thumbnailUrl,
        display_order: e.displayOrder ?? 0,
      })) ?? [],
    });
    return mapEndScreen(response);
  },

  async updateEndScreen(screenId: string, data: EndScreenUpdateRequest): Promise<EndScreen> {
    const response = await api.put<ApiEndScreen>(`/api/v1/optimization/end-screen/${screenId}`, {
      start_time_seconds: data.startTimeSeconds,
      duration_seconds: data.durationSeconds,
      background_type: data.backgroundType,
      background_color: data.backgroundColor,
      background_image_url: data.backgroundImageUrl,
      is_active: data.isActive,
    });
    return mapEndScreen(response);
  },

  async deleteEndScreen(screenId: string): Promise<void> {
    await api.delete(`/api/v1/optimization/end-screen/${screenId}`);
  },

  // ============================================================
  // End Screen Templates
  // ============================================================

  async getEndScreenTemplates(params?: {
    knowledgeId?: string;
    videoType?: string;
    isActive?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<EndScreenTemplateListResponse> {
    try {
      const response = await api.get<{ templates: ApiEndScreenTemplate[]; total: number }>('/api/v1/optimization/end-screen-templates', {
        params: {
          knowledge_id: params?.knowledgeId,
          video_type: params?.videoType,
          is_active: params?.isActive,
          skip: params?.skip,
          limit: params?.limit,
        },
      });
      return {
        templates: response.templates.map(mapEndScreenTemplate),
        total: response.total,
      };
    } catch {
      return { templates: [], total: 0 };
    }
  },

  async createEndScreenTemplate(data: EndScreenTemplateCreateRequest): Promise<EndScreenTemplate> {
    const response = await api.post<ApiEndScreenTemplate>('/api/v1/optimization/end-screen-templates', {
      knowledge_id: data.knowledgeId,
      name: data.name,
      description: data.description,
      video_type: data.videoType,
      layout: data.layout,
      element_configs: data.elementConfigs,
      tags: data.tags,
    });
    return mapEndScreenTemplate(response);
  },

  async getEndScreenTemplate(templateId: string): Promise<EndScreenTemplate | null> {
    try {
      const response = await api.get<ApiEndScreenTemplate>(`/api/v1/optimization/end-screen-templates/${templateId}`);
      return mapEndScreenTemplate(response);
    } catch {
      return null;
    }
  },

  async updateEndScreenTemplate(templateId: string, data: EndScreenTemplateUpdateRequest): Promise<EndScreenTemplate> {
    const response = await api.put<ApiEndScreenTemplate>(`/api/v1/optimization/end-screen-templates/${templateId}`, {
      name: data.name,
      description: data.description,
      layout: data.layout,
      element_configs: data.elementConfigs,
      is_default: data.isDefault,
      is_active: data.isActive,
      tags: data.tags,
    });
    return mapEndScreenTemplate(response);
  },

  async deleteEndScreenTemplate(templateId: string): Promise<void> {
    await api.delete(`/api/v1/optimization/end-screen-templates/${templateId}`);
  },

  // ============================================================
  // Summary
  // ============================================================

  async getSummary(knowledgeId?: string): Promise<OptimizationSummary> {
    try {
      const response = await api.get<ApiOptimizationSummary>('/api/v1/optimization/summary', {
        params: { knowledge_id: knowledgeId },
      });
      return mapOptimizationSummary(response);
    } catch {
      return mockSummary;
    }
  },
};
