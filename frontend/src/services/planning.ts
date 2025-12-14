/**
 * Planning Service
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from './api';
import type {
  CalendarEvent,
  PlanningProject,
  AIChatMessage,
  AISuggestion,
  VideoType,
  ProjectStatus,
} from '../types';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

interface ApiCalendarEvent {
  id: string;
  project_id: string;
  title: string;
  scheduled_date: string;
  video_type: 'short' | 'long';
  status: 'planning' | 'production' | 'scheduled' | 'published';
}

interface ApiProject {
  id: string;
  title: string;
  description?: string;
  video_type: 'short' | 'long';
  status: 'planning' | 'production' | 'scheduled' | 'published';
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
}

interface ApiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: ApiSuggestion[];
  created_at: string;
}

interface ApiSuggestion {
  id: string;
  title: string;
  video_type: 'short' | 'long';
  reason: string;
  reference?: string;
}

// ============================================================
// バックエンドレスポンス型
// ============================================================

interface ApiCalendarResponse {
  data: ApiCalendarEvent[];
  month: number;
  year: number;
}

interface ApiProjectListResponse {
  data: ApiProject[];
  total: number;
  page: number;
  page_size: number;
}

interface ApiProjectDetailResponse {
  data: ApiProject;
}

interface ApiChatSessionResponse {
  session_id: string;
  messages: ApiChatMessage[];
}

interface ApiChatMessageResponse {
  message: ApiChatMessage;
  suggestions?: ApiSuggestion[];
}

interface ApiAdoptedSuggestionsResponse {
  data: ApiSuggestion[];
}

interface ApiPlanningStatsResponse {
  total_projects: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  upcoming_count: number;
}

interface ApiPlanningContextResponse {
  active_knowledges: Array<{ id: string; name: string }>;
  recent_projects: ApiProject[];
  adopted_suggestions: ApiSuggestion[];
}

// ============================================================
// フロントエンド用レスポンス型
// ============================================================

interface CalendarResponse {
  events: CalendarEvent[];
  month: number;
  year: number;
}

interface ProjectListResponse {
  projects: PlanningProject[];
  total: number;
}

interface ProjectDetailResponse {
  project: PlanningProject;
}

interface ChatSessionResponse {
  sessionId: string;
  messages: AIChatMessage[];
}

interface ChatMessageResponse {
  message: AIChatMessage;
  suggestions?: AISuggestion[];
}

interface AdoptedSuggestionsResponse {
  suggestions: AISuggestion[];
}

interface PlanningStatsResponse {
  totalProjects: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  upcomingCount: number;
}

interface PlanningContextResponse {
  activeKnowledges: Array<{ id: string; name: string }>;
  recentProjects: PlanningProject[];
  adoptedSuggestions: AISuggestion[];
}

// ============================================================
// マッピング関数
// ============================================================

const mapCalendarEvent = (event: ApiCalendarEvent): CalendarEvent => ({
  id: event.id,
  projectId: event.project_id,
  title: event.title,
  date: event.scheduled_date,
  videoType: event.video_type,
  status: event.status,
});

const mapProject = (project: ApiProject): PlanningProject => ({
  id: project.id,
  title: project.title,
  description: project.description,
  videoType: project.video_type,
  status: project.status,
  scheduledDate: project.scheduled_date,
  createdAt: project.created_at,
  updatedAt: project.updated_at,
});

const mapSuggestion = (suggestion: ApiSuggestion): AISuggestion => ({
  id: suggestion.id,
  title: suggestion.title,
  videoType: suggestion.video_type,
  reason: suggestion.reason,
  reference: suggestion.reference,
});

const mapChatMessage = (message: ApiChatMessage): AIChatMessage => ({
  id: message.id,
  role: message.role,
  content: message.content,
  suggestions: message.suggestions?.map(mapSuggestion),
  timestamp: message.created_at,
});

// ============================================================
// サービスエクスポート
// ============================================================

export const planningService = {
  /**
   * カレンダーイベント取得
   */
  async getCalendar(year: number, month: number, clientId?: string): Promise<CalendarResponse> {
    const response = await api.get<ApiCalendarResponse>('/api/v1/planning/calendar', {
      params: { year, month, client_id: clientId },
    });
    return {
      events: response.data.map(mapCalendarEvent),
      month: response.month,
      year: response.year,
    };
  },

  /**
   * スケジュール更新
   */
  async updateSchedule(projectId: string, date: string): Promise<{ success: boolean }> {
    return api.patch<{ success: boolean }>('/api/v1/planning/calendar/schedule', {
      project_id: projectId,
      scheduled_date: date,
    });
  },

  /**
   * プロジェクト一覧取得
   */
  async getProjects(
    status?: ProjectStatus,
    videoType?: VideoType,
    page?: number,
    pageSize?: number
  ): Promise<ProjectListResponse> {
    const response = await api.get<ApiProjectListResponse>('/api/v1/planning/projects', {
      params: { status, video_type: videoType, page, page_size: pageSize },
    });
    return {
      projects: response.data.map(mapProject),
      total: response.total,
    };
  },

  /**
   * プロジェクト詳細取得
   */
  async getProject(projectId: string): Promise<ProjectDetailResponse> {
    const response = await api.get<ApiProjectDetailResponse>(`/api/v1/planning/projects/${projectId}`);
    return {
      project: mapProject(response.data),
    };
  },

  /**
   * プロジェクトステータス更新
   */
  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<ProjectDetailResponse> {
    const response = await api.patch<ApiProjectDetailResponse>(`/api/v1/planning/projects/${projectId}/status`, {
      status,
    });
    return {
      project: mapProject(response.data),
    };
  },

  /**
   * プロジェクト削除
   */
  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/api/v1/planning/projects/${projectId}`);
  },

  /**
   * チャットセッション作成
   */
  async createChatSession(knowledgeId?: string, videoType?: VideoType): Promise<ChatSessionResponse> {
    const response = await api.post<ApiChatSessionResponse>('/api/v1/planning/chat/sessions', {
      knowledge_id: knowledgeId,
      video_type: videoType,
    });
    return {
      sessionId: response.session_id,
      messages: response.messages.map(mapChatMessage),
    };
  },

  /**
   * チャットメッセージ送信
   */
  async sendChatMessage(sessionId: string, message: string): Promise<ChatMessageResponse> {
    const response = await api.post<ApiChatMessageResponse>(`/api/v1/planning/chat/sessions/${sessionId}/messages`, {
      content: message,
    });
    return {
      message: mapChatMessage(response.message),
      suggestions: response.suggestions?.map(mapSuggestion),
    };
  },

  /**
   * チャット履歴取得
   */
  async getChatHistory(sessionId: string): Promise<{ messages: AIChatMessage[] }> {
    const response = await api.get<{ messages: ApiChatMessage[] }>(`/api/v1/planning/chat/sessions/${sessionId}/messages`);
    return {
      messages: response.messages.map(mapChatMessage),
    };
  },

  /**
   * 提案を採用
   */
  async adoptSuggestion(suggestionId: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/api/v1/planning/chat/suggestions/${suggestionId}/adopt`);
  },

  /**
   * 採用済み提案取得
   */
  async getAdoptedSuggestions(): Promise<AdoptedSuggestionsResponse> {
    const response = await api.get<ApiAdoptedSuggestionsResponse>('/api/v1/planning/chat/suggestions/adopted');
    return {
      suggestions: response.data.map(mapSuggestion),
    };
  },

  /**
   * 提案の採用解除
   */
  async unadoptSuggestion(suggestionId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/api/v1/planning/chat/suggestions/${suggestionId}/adopt`);
  },

  /**
   * 企画コンテキスト取得
   */
  async getContext(): Promise<PlanningContextResponse> {
    const response = await api.get<ApiPlanningContextResponse>('/api/v1/planning/chat/context');
    return {
      activeKnowledges: response.active_knowledges,
      recentProjects: response.recent_projects.map(mapProject),
      adoptedSuggestions: response.adopted_suggestions.map(mapSuggestion),
    };
  },

  /**
   * 企画統計取得
   */
  async getStats(): Promise<PlanningStatsResponse> {
    const response = await api.get<ApiPlanningStatsResponse>('/api/v1/planning/stats');
    return {
      totalProjects: response.total_projects,
      byStatus: response.by_status,
      byType: response.by_type,
      upcomingCount: response.upcoming_count,
    };
  },
};
