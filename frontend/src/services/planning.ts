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
// モックデータ（API接続エラー時のフォールバック）
// ============================================================

const generateMockCalendarEvents = (year: number, month: number): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const statuses: CalendarEvent['status'][] = ['planning', 'production', 'scheduled', 'published'];
  const videoTypes: CalendarEvent['videoType'][] = ['short', 'long'];

  // 月に10個程度のイベントを生成
  for (let i = 1; i <= 10; i++) {
    const day = Math.floor(Math.random() * 28) + 1;
    events.push({
      id: `mock-event-${i}`,
      projectId: `mock-project-${i}`,
      title: `企画${i}`,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      videoType: videoTypes[Math.floor(Math.random() * videoTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
  }
  return events;
};

const mockProjects: PlanningProject[] = [
  {
    id: 'mock-1',
    title: '【初心者向け】AIツール活用術10選',
    description: 'AIツールの基本的な使い方を解説',
    videoType: 'long',
    status: 'planning',
    scheduledDate: '2025-12-20',
    createdAt: '2025-12-10T10:00:00Z',
    updatedAt: '2025-12-10T10:00:00Z',
  },
  {
    id: 'mock-2',
    title: 'ChatGPT vs Claude比較',
    description: '最新AIアシスタントの比較検証',
    videoType: 'short',
    status: 'production',
    scheduledDate: '2025-12-18',
    createdAt: '2025-12-08T10:00:00Z',
    updatedAt: '2025-12-12T15:00:00Z',
  },
  {
    id: 'mock-3',
    title: '1分でわかる生成AI',
    description: 'ショート動画向けコンテンツ',
    videoType: 'short',
    status: 'scheduled',
    scheduledDate: '2025-12-15',
    createdAt: '2025-12-05T10:00:00Z',
    updatedAt: '2025-12-14T09:00:00Z',
  },
  {
    id: 'mock-4',
    title: 'プロンプトエンジニアリング入門',
    description: '効果的なプロンプトの書き方',
    videoType: 'long',
    status: 'published',
    scheduledDate: '2025-12-10',
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-10T12:00:00Z',
  },
];

const mockStats: PlanningStatsResponse = {
  totalProjects: 45,
  byStatus: {
    planning: 12,
    production: 8,
    scheduled: 15,
    published: 10,
  },
  byType: {
    short: 30,
    long: 15,
  },
  upcomingCount: 23,
};

// チャット機能用モックデータ
const mockChatMessages: AIChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: 'こんにちは！企画のお手伝いをします。どのようなテーマの動画を作成したいですか？',
    timestamp: new Date().toISOString(),
  },
];

// 採用済み提案を管理するための動的配列
let mockAdoptedSuggestions: AISuggestion[] = [
  {
    id: 'sug-1',
    title: 'AIツール活用術【初心者向け】',
    videoType: 'short',
    reason: 'AIツールの基本的な使い方は視聴者の関心が高い',
    reference: 'YouTube検索トレンド分析',
  },
  {
    id: 'sug-2',
    title: 'ChatGPT vs Claude 比較検証',
    videoType: 'long',
    reason: 'AI比較コンテンツは視聴維持率が高い傾向',
    reference: '競合チャンネル分析',
  },
];

// 採用済み提案を追加するヘルパー関数
const addToMockAdoptedSuggestions = (suggestion: AISuggestion) => {
  if (!mockAdoptedSuggestions.find(s => s.id === suggestion.id)) {
    mockAdoptedSuggestions.push(suggestion);
  }
};

// 採用済み提案を削除するヘルパー関数
const removeFromMockAdoptedSuggestions = (suggestionId: string) => {
  mockAdoptedSuggestions = mockAdoptedSuggestions.filter(s => s.id !== suggestionId);
};

// 採用済み提案をクリアするヘルパー関数
const clearMockAdoptedSuggestions = () => {
  mockAdoptedSuggestions = [];
};

const mockActiveKnowledges = [
  { id: 'business-marketing', name: 'ビジネスマーケティング' },
  { id: 'programming', name: 'プログラミング教育' },
  { id: 'health', name: '健康・フィットネス' },
];

// 動的にモックプロジェクトを追加するための関数
const addMockProject = (project: PlanningProject) => {
  mockProjects.unshift(project);
};

// ============================================================
// サービスエクスポート
// ============================================================

export const planningService = {
  /**
   * カレンダーイベント取得
   */
  async getCalendar(year: number, month: number, clientId?: string): Promise<CalendarResponse> {
    try {
      const response = await api.get<ApiCalendarResponse>('/api/v1/planning/calendar', {
        params: { year, month, client_id: clientId },
      });
      return {
        events: response.data.map(mapCalendarEvent),
        month: response.month,
        year: response.year,
      };
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[planningService] Using mock data for calendar');
      return {
        events: generateMockCalendarEvents(year, month),
        month,
        year,
      };
    }
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
    _page?: number,
    _pageSize?: number
  ): Promise<ProjectListResponse> {
    try {
      const response = await api.get<ApiProjectListResponse>('/api/v1/planning/projects', {
        params: { status, video_type: videoType, page: _page, page_size: _pageSize },
      });
      return {
        projects: response.data.map(mapProject),
        total: response.total,
      };
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[planningService] Using mock data for projects');
      let filtered = [...mockProjects];
      if (status) {
        filtered = filtered.filter(p => p.status === status);
      }
      if (videoType) {
        filtered = filtered.filter(p => p.videoType === videoType);
      }
      return {
        projects: filtered,
        total: filtered.length,
      };
    }
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
    try {
      const response = await api.post<ApiChatSessionResponse>('/api/v1/planning/chat/sessions', {
        knowledge_id: knowledgeId,
        video_type: videoType,
      });
      return {
        sessionId: response.session_id,
        messages: response.messages.map(mapChatMessage),
      };
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[planningService] Using mock data for chat session');
      return {
        sessionId: `mock-session-${Date.now()}`,
        messages: mockChatMessages,
      };
    }
  },

  /**
   * チャットメッセージ送信
   */
  async sendChatMessage(sessionId: string, message: string): Promise<ChatMessageResponse> {
    try {
      const response = await api.post<ApiChatMessageResponse>(`/api/v1/planning/chat/sessions/${sessionId}/messages`, {
        content: message,
      });
      return {
        message: mapChatMessage(response.message),
        suggestions: response.suggestions?.map(mapSuggestion),
      };
    } catch {
      // API接続エラー時はモックレスポンスを返す
      console.info('[planningService] Using mock response for chat message');
      const mockResponse: AIChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `「${message}」についてですね！面白いテーマです。\n\n以下の企画案をご提案します：\n\n1. **基礎編** - 初心者向けに基本的な内容を紹介\n2. **実践編** - 具体的な事例やデモンストレーション\n3. **応用編** - より高度なテクニックやコツ\n\nどの方向性で進めましょうか？`,
        timestamp: new Date().toISOString(),
        suggestions: [
          {
            id: `sug-${Date.now()}-1`,
            title: `${message}の基礎【初心者向け】`,
            videoType: 'short',
            reason: '初心者向けコンテンツは視聴者獲得に効果的',
          },
          {
            id: `sug-${Date.now()}-2`,
            title: `${message}完全ガイド【実践編】`,
            videoType: 'long',
            reason: '詳細な解説は視聴維持率を高める',
          },
        ],
      };
      return {
        message: mockResponse,
        suggestions: mockResponse.suggestions,
      };
    }
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
  async adoptSuggestion(suggestionId: string, suggestion?: AISuggestion): Promise<{ success: boolean }> {
    try {
      return await api.post<{ success: boolean }>(`/api/v1/planning/chat/suggestions/${suggestionId}/adopt`);
    } catch {
      // API接続エラー時はモックで採用追加
      console.info('[planningService] Using mock implementation for adoptSuggestion');
      if (suggestion) {
        addToMockAdoptedSuggestions(suggestion);
      }
      return { success: true };
    }
  },

  /**
   * 採用済み提案取得
   */
  async getAdoptedSuggestions(): Promise<AdoptedSuggestionsResponse> {
    try {
      const response = await api.get<ApiAdoptedSuggestionsResponse>('/api/v1/planning/chat/suggestions/adopted');
      return {
        suggestions: response.data.map(mapSuggestion),
      };
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[planningService] Using mock data for adopted suggestions');
      return {
        suggestions: mockAdoptedSuggestions,
      };
    }
  },

  /**
   * 提案の採用解除
   */
  async unadoptSuggestion(suggestionId: string): Promise<{ success: boolean }> {
    try {
      return await api.delete<{ success: boolean }>(`/api/v1/planning/chat/suggestions/${suggestionId}/adopt`);
    } catch {
      // API接続エラー時はモックで採用解除
      console.info('[planningService] Using mock implementation for unadoptSuggestion');
      removeFromMockAdoptedSuggestions(suggestionId);
      return { success: true };
    }
  },

  /**
   * 企画コンテキスト取得
   */
  async getContext(): Promise<PlanningContextResponse> {
    try {
      const response = await api.get<ApiPlanningContextResponse>('/api/v1/planning/chat/context');
      return {
        activeKnowledges: response.active_knowledges,
        recentProjects: response.recent_projects.map(mapProject),
        adoptedSuggestions: response.adopted_suggestions.map(mapSuggestion),
      };
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[planningService] Using mock data for context');
      return {
        activeKnowledges: mockActiveKnowledges,
        recentProjects: mockProjects.slice(0, 3),
        adoptedSuggestions: mockAdoptedSuggestions,
      };
    }
  },

  /**
   * 企画統計取得
   */
  async getStats(): Promise<PlanningStatsResponse> {
    try {
      const response = await api.get<ApiPlanningStatsResponse>('/api/v1/planning/stats');
      return {
        totalProjects: response.total_projects,
        byStatus: response.by_status,
        byType: response.by_type,
        upcomingCount: response.upcoming_count,
      };
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[planningService] Using mock data for stats');
      return mockStats;
    }
  },

  /**
   * 採用済み提案をプロジェクト一覧に追加
   */
  async addAdoptedSuggestionsToProjects(suggestions: AISuggestion[]): Promise<{ success: boolean; addedCount: number }> {
    try {
      const response = await api.post<{ success: boolean; added_count: number }>('/api/v1/planning/projects/from-suggestions', {
        suggestion_ids: suggestions.map(s => s.id),
      });
      return {
        success: response.success,
        addedCount: response.added_count,
      };
    } catch {
      // API接続エラー時はモックでプロジェクトを追加
      console.info('[planningService] Using mock implementation for addAdoptedSuggestionsToProjects');
      const now = new Date().toISOString();
      suggestions.forEach((suggestion, index) => {
        const newProject: PlanningProject = {
          id: `project-${Date.now()}-${index}`,
          title: suggestion.title,
          description: suggestion.reason,
          videoType: suggestion.videoType,
          status: 'planning',
          scheduledDate: undefined,
          createdAt: now,
          updatedAt: now,
        };
        addMockProject(newProject);
      });
      // 採用済み提案をクリア
      clearMockAdoptedSuggestions();
      return {
        success: true,
        addedCount: suggestions.length,
      };
    }
  },
};
