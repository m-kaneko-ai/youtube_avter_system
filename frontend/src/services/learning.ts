/**
 * Learning Service
 *
 * パフォーマンス学習、インサイト、成功パターン、推奨事項API
 */
import { api } from './api';
import type {
  PerformanceRecord,
  PerformanceRecordCreateRequest,
  PerformanceRecordUpdateRequest,
  PerformanceRecordListResponse,
  LearningInsight,
  LearningInsightListResponse,
  SuccessPattern,
  SuccessPatternListResponse,
  LearningRecommendation,
  LearningRecommendationListResponse,
  LearningSummary,
  LearningTrendsResponse,
  LearningAnalysisRequest,
  LearningAnalysisResponse,
  PerformanceLevel,
  LearningCategory,
  InsightType,
} from '../types';

// ============================================================
// API レスポンス型定義
// ============================================================

interface ApiPerformanceRecord {
  id: string;
  video_id: string;
  project_id?: string;
  knowledge_id?: string;
  video_type: string;
  published_at?: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  subscribers_gained: number;
  subscribers_lost: number;
  watch_time_minutes?: number;
  avg_view_duration_seconds?: number;
  avg_view_percentage?: number;
  impressions: number;
  ctr?: number;
  title_length?: number;
  has_number_in_title: boolean;
  has_question_in_title: boolean;
  has_emoji_in_title: boolean;
  video_length_seconds?: number;
  publish_day_of_week?: number;
  publish_hour?: number;
  tags?: string[];
  category?: string;
  extra_attributes?: Record<string, unknown>;
  recorded_at: string;
  performance_level: PerformanceLevel;
  performance_score?: number;
  created_at: string;
  updated_at: string;
}

interface ApiLearningInsight {
  id: string;
  knowledge_id?: string;
  project_id?: string;
  insight_type: InsightType;
  category: LearningCategory;
  title: string;
  description?: string;
  evidence?: Record<string, unknown>;
  confidence_score: number;
  sample_size: number;
  recommendation?: string;
  expected_impact?: string;
  is_active: boolean;
  is_applied: boolean;
  applied_at?: string;
  created_at: string;
  updated_at: string;
}

interface ApiSuccessPattern {
  id: string;
  knowledge_id?: string;
  name: string;
  description?: string;
  category: LearningCategory;
  pattern_data: Record<string, unknown>;
  example_video_ids?: string[];
  avg_performance_boost?: number;
  success_rate?: number;
  application_count: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface ApiRecommendation {
  id: string;
  video_id?: string;
  project_id?: string;
  knowledge_id?: string;
  based_on_pattern_id?: string;
  based_on_insight_id?: string;
  category: LearningCategory;
  title: string;
  description?: string;
  action_items?: Record<string, unknown>[];
  expected_impact_score?: number;
  expected_metric?: string;
  expected_improvement?: string;
  is_applied: boolean;
  applied_at?: string;
  result_score?: number;
  created_at: string;
  updated_at: string;
}

interface ApiLearningSummary {
  total_records: number;
  total_insights: number;
  total_patterns: number;
  total_recommendations: number;
  avg_performance_score?: number;
  top_performing_category?: string;
  most_common_success_pattern?: string;
  active_recommendations: number;
}

interface ApiLearningTrend {
  date: string;
  avg_performance: number;
  insights_generated: number;
  patterns_discovered: number;
}

interface ApiLearningAnalysisResponse {
  analysis_id: string;
  status: string;
  insights_generated: number;
  patterns_discovered: number;
  recommendations_created: number;
  processing_time_seconds: number;
  summary: Record<string, unknown>;
}

// ============================================================
// マッピング関数
// ============================================================

const mapPerformanceRecord = (record: ApiPerformanceRecord): PerformanceRecord => ({
  id: record.id,
  videoId: record.video_id,
  projectId: record.project_id,
  knowledgeId: record.knowledge_id,
  videoType: record.video_type,
  publishedAt: record.published_at,
  views: record.views,
  likes: record.likes,
  dislikes: record.dislikes,
  comments: record.comments,
  shares: record.shares,
  subscribersGained: record.subscribers_gained,
  subscribersLost: record.subscribers_lost,
  watchTimeMinutes: record.watch_time_minutes,
  avgViewDurationSeconds: record.avg_view_duration_seconds,
  avgViewPercentage: record.avg_view_percentage,
  impressions: record.impressions,
  ctr: record.ctr,
  titleLength: record.title_length,
  hasNumberInTitle: record.has_number_in_title,
  hasQuestionInTitle: record.has_question_in_title,
  hasEmojiInTitle: record.has_emoji_in_title,
  videoLengthSeconds: record.video_length_seconds,
  publishDayOfWeek: record.publish_day_of_week,
  publishHour: record.publish_hour,
  tags: record.tags,
  category: record.category,
  extraAttributes: record.extra_attributes,
  recordedAt: record.recorded_at,
  performanceLevel: record.performance_level,
  performanceScore: record.performance_score,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const mapLearningInsight = (insight: ApiLearningInsight): LearningInsight => ({
  id: insight.id,
  knowledgeId: insight.knowledge_id,
  projectId: insight.project_id,
  insightType: insight.insight_type,
  category: insight.category,
  title: insight.title,
  description: insight.description,
  evidence: insight.evidence,
  confidenceScore: insight.confidence_score,
  sampleSize: insight.sample_size,
  recommendation: insight.recommendation,
  expectedImpact: insight.expected_impact,
  isActive: insight.is_active,
  isApplied: insight.is_applied,
  appliedAt: insight.applied_at,
  createdAt: insight.created_at,
  updatedAt: insight.updated_at,
});

const mapSuccessPattern = (pattern: ApiSuccessPattern): SuccessPattern => ({
  id: pattern.id,
  knowledgeId: pattern.knowledge_id,
  name: pattern.name,
  description: pattern.description,
  category: pattern.category,
  patternData: pattern.pattern_data,
  exampleVideoIds: pattern.example_video_ids,
  avgPerformanceBoost: pattern.avg_performance_boost,
  successRate: pattern.success_rate,
  applicationCount: pattern.application_count,
  isActive: pattern.is_active,
  priority: pattern.priority,
  createdAt: pattern.created_at,
  updatedAt: pattern.updated_at,
});

const mapRecommendation = (rec: ApiRecommendation): LearningRecommendation => ({
  id: rec.id,
  videoId: rec.video_id,
  projectId: rec.project_id,
  knowledgeId: rec.knowledge_id,
  basedOnPatternId: rec.based_on_pattern_id,
  basedOnInsightId: rec.based_on_insight_id,
  category: rec.category,
  title: rec.title,
  description: rec.description,
  actionItems: rec.action_items,
  expectedImpactScore: rec.expected_impact_score,
  expectedMetric: rec.expected_metric,
  expectedImprovement: rec.expected_improvement,
  isApplied: rec.is_applied,
  appliedAt: rec.applied_at,
  resultScore: rec.result_score,
  createdAt: rec.created_at,
  updatedAt: rec.updated_at,
});

const mapLearningSummary = (summary: ApiLearningSummary): LearningSummary => ({
  totalRecords: summary.total_records,
  totalInsights: summary.total_insights,
  totalPatterns: summary.total_patterns,
  totalRecommendations: summary.total_recommendations,
  avgPerformanceScore: summary.avg_performance_score,
  topPerformingCategory: summary.top_performing_category,
  mostCommonSuccessPattern: summary.most_common_success_pattern,
  activeRecommendations: summary.active_recommendations,
});

// ============================================================
// モックデータ
// ============================================================

const mockSummary: LearningSummary = {
  totalRecords: 0,
  totalInsights: 0,
  totalPatterns: 0,
  totalRecommendations: 0,
  avgPerformanceScore: undefined,
  topPerformingCategory: undefined,
  mostCommonSuccessPattern: undefined,
  activeRecommendations: 0,
};

// ============================================================
// Learning Service
// ============================================================

export const learningService = {
  // Performance Records
  async getRecords(params?: {
    knowledgeId?: string;
    projectId?: string;
    performanceLevel?: PerformanceLevel;
    videoType?: string;
    skip?: number;
    limit?: number;
  }): Promise<PerformanceRecordListResponse> {
    try {
      const response = await api.get<{ records: ApiPerformanceRecord[]; total: number }>(
        '/api/v1/learning/records',
        {
          params: {
            knowledge_id: params?.knowledgeId,
            project_id: params?.projectId,
            performance_level: params?.performanceLevel,
            video_type: params?.videoType,
            skip: params?.skip,
            limit: params?.limit,
          },
        }
      );
      return {
        records: response.records.map(mapPerformanceRecord),
        total: response.total,
      };
    } catch {
      return { records: [], total: 0 };
    }
  },

  async createRecord(data: PerformanceRecordCreateRequest): Promise<PerformanceRecord> {
    const response = await api.post<ApiPerformanceRecord>('/api/v1/learning/records', {
      video_id: data.videoId,
      project_id: data.projectId,
      knowledge_id: data.knowledgeId,
      video_type: data.videoType,
      published_at: data.publishedAt,
      views: data.views ?? 0,
      likes: data.likes ?? 0,
      dislikes: data.dislikes ?? 0,
      comments: data.comments ?? 0,
      shares: data.shares ?? 0,
      subscribers_gained: data.subscribersGained ?? 0,
      subscribers_lost: data.subscribersLost ?? 0,
      watch_time_minutes: data.watchTimeMinutes,
      avg_view_duration_seconds: data.avgViewDurationSeconds,
      avg_view_percentage: data.avgViewPercentage,
      impressions: data.impressions ?? 0,
      ctr: data.ctr,
      title_length: data.titleLength,
      has_number_in_title: data.hasNumberInTitle ?? false,
      has_question_in_title: data.hasQuestionInTitle ?? false,
      has_emoji_in_title: data.hasEmojiInTitle ?? false,
      video_length_seconds: data.videoLengthSeconds,
      publish_day_of_week: data.publishDayOfWeek,
      publish_hour: data.publishHour,
      tags: data.tags,
      category: data.category,
      extra_attributes: data.extraAttributes,
    });
    return mapPerformanceRecord(response);
  },

  async getRecord(recordId: string): Promise<PerformanceRecord> {
    const response = await api.get<ApiPerformanceRecord>(`/api/v1/learning/records/${recordId}`);
    return mapPerformanceRecord(response);
  },

  async updateRecord(recordId: string, data: PerformanceRecordUpdateRequest): Promise<PerformanceRecord> {
    const response = await api.put<ApiPerformanceRecord>(`/api/v1/learning/records/${recordId}`, {
      views: data.views,
      likes: data.likes,
      dislikes: data.dislikes,
      comments: data.comments,
      shares: data.shares,
      subscribers_gained: data.subscribersGained,
      subscribers_lost: data.subscribersLost,
      watch_time_minutes: data.watchTimeMinutes,
      avg_view_duration_seconds: data.avgViewDurationSeconds,
      avg_view_percentage: data.avgViewPercentage,
      impressions: data.impressions,
      ctr: data.ctr,
    });
    return mapPerformanceRecord(response);
  },

  // Insights
  async getInsights(params?: {
    knowledgeId?: string;
    category?: LearningCategory;
    insightType?: InsightType;
    isActive?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<LearningInsightListResponse> {
    try {
      const response = await api.get<{ insights: ApiLearningInsight[]; total: number }>(
        '/api/v1/learning/insights',
        {
          params: {
            knowledge_id: params?.knowledgeId,
            category: params?.category,
            insight_type: params?.insightType,
            is_active: params?.isActive,
            skip: params?.skip,
            limit: params?.limit,
          },
        }
      );
      return {
        insights: response.insights.map(mapLearningInsight),
        total: response.total,
      };
    } catch {
      return { insights: [], total: 0 };
    }
  },

  // Success Patterns
  async getPatterns(params?: {
    knowledgeId?: string;
    category?: LearningCategory;
    isActive?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<SuccessPatternListResponse> {
    try {
      const response = await api.get<{ patterns: ApiSuccessPattern[]; total: number }>(
        '/api/v1/learning/patterns',
        {
          params: {
            knowledge_id: params?.knowledgeId,
            category: params?.category,
            is_active: params?.isActive,
            skip: params?.skip,
            limit: params?.limit,
          },
        }
      );
      return {
        patterns: response.patterns.map(mapSuccessPattern),
        total: response.total,
      };
    } catch {
      return { patterns: [], total: 0 };
    }
  },

  // Recommendations
  async getRecommendations(params?: {
    knowledgeId?: string;
    projectId?: string;
    category?: LearningCategory;
    isApplied?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<LearningRecommendationListResponse> {
    try {
      const response = await api.get<{ recommendations: ApiRecommendation[]; total: number }>(
        '/api/v1/learning/recommendations',
        {
          params: {
            knowledge_id: params?.knowledgeId,
            project_id: params?.projectId,
            category: params?.category,
            is_applied: params?.isApplied,
            skip: params?.skip,
            limit: params?.limit,
          },
        }
      );
      return {
        recommendations: response.recommendations.map(mapRecommendation),
        total: response.total,
      };
    } catch {
      return { recommendations: [], total: 0 };
    }
  },

  async applyRecommendation(recommendationId: string): Promise<void> {
    await api.post(`/api/v1/learning/recommendations/${recommendationId}/apply`);
  },

  // Summary & Analysis
  async getSummary(knowledgeId?: string): Promise<LearningSummary> {
    try {
      const response = await api.get<ApiLearningSummary>('/api/v1/learning/summary', {
        params: { knowledge_id: knowledgeId },
      });
      return mapLearningSummary(response);
    } catch {
      return mockSummary;
    }
  },

  async getTrends(knowledgeId?: string, days: number = 30): Promise<LearningTrendsResponse> {
    try {
      const response = await api.get<{ trends: ApiLearningTrend[]; period_days: number }>(
        '/api/v1/learning/trends',
        {
          params: { knowledge_id: knowledgeId, days },
        }
      );
      return {
        trends: response.trends.map((t) => ({
          date: t.date,
          avgPerformance: t.avg_performance,
          insightsGenerated: t.insights_generated,
          patternsDiscovered: t.patterns_discovered,
        })),
        periodDays: response.period_days,
      };
    } catch {
      return { trends: [], periodDays: days };
    }
  },

  async analyze(data: LearningAnalysisRequest): Promise<LearningAnalysisResponse> {
    const response = await api.post<ApiLearningAnalysisResponse>('/api/v1/learning/analyze', {
      knowledge_id: data.knowledgeId,
      project_id: data.projectId,
      video_ids: data.videoIds,
      categories: data.categories,
      min_sample_size: data.minSampleSize,
      confidence_threshold: data.confidenceThreshold,
    });
    return {
      analysisId: response.analysis_id,
      status: response.status,
      insightsGenerated: response.insights_generated,
      patternsDiscovered: response.patterns_discovered,
      recommendationsCreated: response.recommendations_created,
      processingTimeSeconds: response.processing_time_seconds,
      summary: response.summary,
    };
  },
};
