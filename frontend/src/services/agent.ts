/**
 * Agent Service
 *
 * エージェント自動化関連のAPI通信
 */
import { api } from './api';
import type {
  Agent,
  AgentCreateRequest,
  AgentUpdateRequest,
  AgentListResponse,
  AgentTask,
  AgentTaskListResponse,
  AgentSchedule,
  AgentScheduleCreateRequest,
  AgentScheduleUpdateRequest,
  AgentScheduleListResponse,
  CommentTemplate,
  CommentTemplateCreateRequest,
  CommentTemplateUpdateRequest,
  CommentTemplateListResponse,
  CommentQueueItem,
  CommentQueueListResponse,
  CommentApprovalRequest,
  AgentLog,
  AgentLogListResponse,
  TrendAlert,
  TrendAlertUpdateRequest,
  TrendAlertListResponse,
  CompetitorAlert,
  CompetitorAlertUpdateRequest,
  CompetitorAlertListResponse,
  AgentSummary,
  AgentDashboard,
  AgentType,
  AgentStatus,
  AgentTaskStatus,
  AgentTaskPriority,
  CommentSentimentType,
  ReplyStatus,
} from '@/types';

/**
 * snake_case から camelCase への変換
 */
const toCamelCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? toCamelCase(item as Record<string, unknown>)
          : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result;
};

/**
 * camelCase から snake_case への変換
 */
const toSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? toSnakeCase(item as Record<string, unknown>)
          : item
      );
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
};

export const agentService = {
  // ============================================================
  // Agent
  // ============================================================

  /**
   * エージェント一覧取得
   */
  async getAgents(params?: {
    agentType?: AgentType;
    status?: AgentStatus;
    isEnabled?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<AgentListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.agentType) queryParams.append('agent_type', params.agentType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.isEnabled !== undefined) queryParams.append('is_enabled', String(params.isEnabled));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await api.get<AgentListResponse>(`/agent/agents${query ? `?${query}` : ''}`);
    return {
      agents: response.agents.map((a) => toCamelCase(a as unknown as Record<string, unknown>) as unknown as Agent),
      total: response.total,
    };
  },

  /**
   * エージェント作成
   */
  async createAgent(data: AgentCreateRequest): Promise<Agent> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.post<Agent>('/agent/agents', snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as Agent;
  },

  /**
   * エージェント詳細取得
   */
  async getAgent(agentId: string): Promise<Agent> {
    const response = await api.get<Agent>(`/agent/agents/${agentId}`);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as Agent;
  },

  /**
   * エージェント更新
   */
  async updateAgent(agentId: string, data: AgentUpdateRequest): Promise<Agent> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.put<Agent>(`/agent/agents/${agentId}`, snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as Agent;
  },

  /**
   * エージェント削除
   */
  async deleteAgent(agentId: string): Promise<void> {
    await api.delete(`/agent/agents/${agentId}`);
  },

  /**
   * エージェントステータス更新
   */
  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<Agent> {
    const response = await api.post<Agent>(`/agent/agents/${agentId}/status`, { status });
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as Agent;
  },

  /**
   * エージェント手動実行
   */
  async runAgent(agentId: string, taskName: string, inputData?: Record<string, unknown>): Promise<AgentTask> {
    const queryParams = new URLSearchParams({ task_name: taskName });
    const response = await api.post<AgentTask>(
      `/agent/agents/${agentId}/run?${queryParams.toString()}`,
      inputData ? toSnakeCase(inputData) : undefined
    );
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as AgentTask;
  },

  // ============================================================
  // Agent Task
  // ============================================================

  /**
   * タスク一覧取得
   */
  async getTasks(params?: {
    agentId?: string;
    status?: AgentTaskStatus;
    priority?: AgentTaskPriority;
    skip?: number;
    limit?: number;
  }): Promise<AgentTaskListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.agentId) queryParams.append('agent_id', params.agentId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await api.get<AgentTaskListResponse>(`/agent/tasks${query ? `?${query}` : ''}`);
    return {
      tasks: response.tasks.map((t) => toCamelCase(t as unknown as Record<string, unknown>) as unknown as AgentTask),
      total: response.total,
    };
  },

  /**
   * タスク詳細取得
   */
  async getTask(taskId: string): Promise<AgentTask> {
    const response = await api.get<AgentTask>(`/agent/tasks/${taskId}`);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as AgentTask;
  },

  /**
   * タスクキャンセル
   */
  async cancelTask(taskId: string): Promise<void> {
    await api.post(`/agent/tasks/${taskId}/cancel`);
  },

  // ============================================================
  // Agent Schedule
  // ============================================================

  /**
   * スケジュール一覧取得
   */
  async getSchedules(params?: {
    agentId?: string;
    isActive?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<AgentScheduleListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.agentId) queryParams.append('agent_id', params.agentId);
    if (params?.isActive !== undefined) queryParams.append('is_active', String(params.isActive));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await api.get<AgentScheduleListResponse>(`/agent/schedules${query ? `?${query}` : ''}`);
    return {
      schedules: response.schedules.map((s) => toCamelCase(s as unknown as Record<string, unknown>) as unknown as AgentSchedule),
      total: response.total,
    };
  },

  /**
   * スケジュール作成
   */
  async createSchedule(data: AgentScheduleCreateRequest): Promise<AgentSchedule> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.post<AgentSchedule>('/agent/schedules', snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as AgentSchedule;
  },

  /**
   * スケジュール更新
   */
  async updateSchedule(scheduleId: string, data: AgentScheduleUpdateRequest): Promise<AgentSchedule> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.put<AgentSchedule>(`/agent/schedules/${scheduleId}`, snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as AgentSchedule;
  },

  /**
   * スケジュール削除
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await api.delete(`/agent/schedules/${scheduleId}`);
  },

  // ============================================================
  // Comment Template
  // ============================================================

  /**
   * コメントテンプレート一覧取得
   */
  async getCommentTemplates(params?: {
    knowledgeId?: string;
    category?: string;
    targetSentiment?: CommentSentimentType;
    isActive?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<CommentTemplateListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.knowledgeId) queryParams.append('knowledge_id', params.knowledgeId);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.targetSentiment) queryParams.append('target_sentiment', params.targetSentiment);
    if (params?.isActive !== undefined) queryParams.append('is_active', String(params.isActive));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await api.get<CommentTemplateListResponse>(`/agent/comment-templates${query ? `?${query}` : ''}`);
    return {
      templates: response.templates.map((t) => toCamelCase(t as unknown as Record<string, unknown>) as unknown as CommentTemplate),
      total: response.total,
    };
  },

  /**
   * コメントテンプレート作成
   */
  async createCommentTemplate(data: CommentTemplateCreateRequest): Promise<CommentTemplate> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.post<CommentTemplate>('/agent/comment-templates', snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as CommentTemplate;
  },

  /**
   * コメントテンプレート更新
   */
  async updateCommentTemplate(templateId: string, data: CommentTemplateUpdateRequest): Promise<CommentTemplate> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.put<CommentTemplate>(`/agent/comment-templates/${templateId}`, snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as CommentTemplate;
  },

  /**
   * コメントテンプレート削除
   */
  async deleteCommentTemplate(templateId: string): Promise<void> {
    await api.delete(`/agent/comment-templates/${templateId}`);
  },

  // ============================================================
  // Comment Queue
  // ============================================================

  /**
   * コメントキュー一覧取得
   */
  async getCommentQueue(params?: {
    videoId?: string;
    status?: ReplyStatus;
    sentiment?: CommentSentimentType;
    requiresApproval?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<CommentQueueListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.videoId) queryParams.append('video_id', params.videoId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sentiment) queryParams.append('sentiment', params.sentiment);
    if (params?.requiresApproval !== undefined) queryParams.append('requires_approval', String(params.requiresApproval));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await api.get<CommentQueueListResponse>(`/agent/comment-queue${query ? `?${query}` : ''}`);
    return {
      comments: response.comments.map((c) => toCamelCase(c as unknown as Record<string, unknown>) as unknown as CommentQueueItem),
      total: response.total,
    };
  },

  /**
   * コメント承認/却下
   */
  async approveComment(commentId: string, data: CommentApprovalRequest): Promise<CommentQueueItem> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.post<CommentQueueItem>(`/agent/comment-queue/${commentId}/approve`, snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as CommentQueueItem;
  },

  /**
   * コメント返信送信
   */
  async sendCommentReply(commentId: string): Promise<CommentQueueItem> {
    const response = await api.post<CommentQueueItem>(`/agent/comment-queue/${commentId}/send`);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as CommentQueueItem;
  },

  // ============================================================
  // Trend Alert
  // ============================================================

  /**
   * トレンドアラート一覧取得
   */
  async getTrendAlerts(params?: {
    knowledgeId?: string;
    alertType?: string;
    isRead?: boolean;
    isActioned?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<TrendAlertListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.knowledgeId) queryParams.append('knowledge_id', params.knowledgeId);
    if (params?.alertType) queryParams.append('alert_type', params.alertType);
    if (params?.isRead !== undefined) queryParams.append('is_read', String(params.isRead));
    if (params?.isActioned !== undefined) queryParams.append('is_actioned', String(params.isActioned));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await api.get<TrendAlertListResponse>(`/agent/trend-alerts${query ? `?${query}` : ''}`);
    return {
      alerts: response.alerts.map((a) => toCamelCase(a as unknown as Record<string, unknown>) as unknown as TrendAlert),
      total: response.total,
    };
  },

  /**
   * トレンドアラート更新
   */
  async updateTrendAlert(alertId: string, data: TrendAlertUpdateRequest): Promise<TrendAlert> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.put<TrendAlert>(`/agent/trend-alerts/${alertId}`, snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as TrendAlert;
  },

  /**
   * トレンドアラート既読
   */
  async markTrendAlertRead(alertId: string): Promise<TrendAlert> {
    const response = await api.post<TrendAlert>(`/agent/trend-alerts/${alertId}/read`);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as TrendAlert;
  },

  // ============================================================
  // Competitor Alert
  // ============================================================

  /**
   * 競合アラート一覧取得
   */
  async getCompetitorAlerts(params?: {
    knowledgeId?: string;
    alertType?: string;
    competitorChannelId?: string;
    isRead?: boolean;
    isActioned?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<CompetitorAlertListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.knowledgeId) queryParams.append('knowledge_id', params.knowledgeId);
    if (params?.alertType) queryParams.append('alert_type', params.alertType);
    if (params?.competitorChannelId) queryParams.append('competitor_channel_id', params.competitorChannelId);
    if (params?.isRead !== undefined) queryParams.append('is_read', String(params.isRead));
    if (params?.isActioned !== undefined) queryParams.append('is_actioned', String(params.isActioned));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await api.get<CompetitorAlertListResponse>(`/agent/competitor-alerts${query ? `?${query}` : ''}`);
    return {
      alerts: response.alerts.map((a) => toCamelCase(a as unknown as Record<string, unknown>) as unknown as CompetitorAlert),
      total: response.total,
    };
  },

  /**
   * 競合アラート更新
   */
  async updateCompetitorAlert(alertId: string, data: CompetitorAlertUpdateRequest): Promise<CompetitorAlert> {
    const snakeData = toSnakeCase(data as unknown as Record<string, unknown>);
    const response = await api.put<CompetitorAlert>(`/agent/competitor-alerts/${alertId}`, snakeData);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as CompetitorAlert;
  },

  /**
   * 競合アラート既読
   */
  async markCompetitorAlertRead(alertId: string): Promise<CompetitorAlert> {
    const response = await api.post<CompetitorAlert>(`/agent/competitor-alerts/${alertId}/read`);
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as CompetitorAlert;
  },

  // ============================================================
  // Agent Logs
  // ============================================================

  /**
   * エージェントログ一覧取得
   */
  async getLogs(params?: {
    agentId?: string;
    taskId?: string;
    level?: string;
    skip?: number;
    limit?: number;
  }): Promise<AgentLogListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.agentId) queryParams.append('agent_id', params.agentId);
    if (params?.taskId) queryParams.append('task_id', params.taskId);
    if (params?.level) queryParams.append('level', params.level);
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const response = await api.get<AgentLogListResponse>(`/agent/logs${query ? `?${query}` : ''}`);
    return {
      logs: response.logs.map((l) => toCamelCase(l as unknown as Record<string, unknown>) as unknown as AgentLog),
      total: response.total,
    };
  },

  // ============================================================
  // Dashboard/Summary
  // ============================================================

  /**
   * エージェントサマリー取得
   */
  async getSummary(): Promise<AgentSummary> {
    const response = await api.get<AgentSummary>('/agent/summary');
    return toCamelCase(response as unknown as Record<string, unknown>) as unknown as AgentSummary;
  },

  /**
   * エージェントダッシュボード取得
   */
  async getDashboard(): Promise<AgentDashboard> {
    const response = await api.get<AgentDashboard>('/agent/dashboard');
    const camelResponse = toCamelCase(response as unknown as Record<string, unknown>) as unknown as AgentDashboard;
    return {
      ...camelResponse,
      summary: toCamelCase(camelResponse.summary as unknown as Record<string, unknown>) as unknown as AgentSummary,
      recentAgents: camelResponse.recentAgents.map((a) => toCamelCase(a as unknown as Record<string, unknown>) as unknown as Agent),
      recentTasks: camelResponse.recentTasks.map((t) => toCamelCase(t as unknown as Record<string, unknown>) as unknown as AgentTask),
      recentTrendAlerts: camelResponse.recentTrendAlerts.map((a) => toCamelCase(a as unknown as Record<string, unknown>) as unknown as TrendAlert),
      recentCompetitorAlerts: camelResponse.recentCompetitorAlerts.map((a) => toCamelCase(a as unknown as Record<string, unknown>) as unknown as CompetitorAlert),
      pendingComments: camelResponse.pendingComments.map((c) => toCamelCase(c as unknown as Record<string, unknown>) as unknown as CommentQueueItem),
    };
  },
};
