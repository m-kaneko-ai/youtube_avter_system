/**
 * Dashboard Service
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from './api';

// ============================================================
// フロントエンド型定義（camelCase）
// ============================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'script' | 'thumbnail' | 'video' | 'publish' | 'review';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  dueTime: string;
  project?: string;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  overdueCount: number;
}

export type NotificationType =
  | 'approval'
  | 'alert'
  | 'info'
  | 'comment'
  | 'performance'
  | 'video'
  | 'team'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

interface ApiTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  due_time: string;
  project?: string;
}

interface ApiTasksResponse {
  tasks: ApiTask[];
  total: number;
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
  overdue_count: number;
}

interface ApiNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  is_read: boolean;
  action_url?: string;
}

interface ApiNotificationsResponse {
  notifications: ApiNotification[];
  total: number;
  unread_count: number;
}

interface ApiMessageResponse {
  message: string;
}

// ============================================================
// マッピング関数
// ============================================================

function mapApiTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    category: apiTask.category,
    status: apiTask.status,
    priority: apiTask.priority,
    dueTime: apiTask.due_time,
    project: apiTask.project,
  };
}

function mapApiTasksResponse(response: ApiTasksResponse): TasksResponse {
  return {
    tasks: response.tasks.map(mapApiTask),
    total: response.total,
    pendingCount: response.pending_count,
    inProgressCount: response.in_progress_count,
    completedCount: response.completed_count,
    overdueCount: response.overdue_count,
  };
}

function mapApiNotification(apiNotification: ApiNotification): Notification {
  return {
    id: apiNotification.id,
    type: apiNotification.type,
    title: apiNotification.title,
    message: apiNotification.message,
    time: apiNotification.time,
    isRead: apiNotification.is_read,
    actionUrl: apiNotification.action_url,
  };
}

function mapApiNotificationsResponse(response: ApiNotificationsResponse): NotificationsResponse {
  return {
    notifications: response.notifications.map(mapApiNotification),
    total: response.total,
    unreadCount: response.unread_count,
  };
}

// ============================================================
// Dashboard Service
// ============================================================

export const dashboardService = {
  /**
   * 今日のタスク一覧を取得
   */
  async getTodayTasks(status?: TaskStatus): Promise<TasksResponse> {
    const response = await api.get<ApiTasksResponse>('/api/v1/dashboard/tasks/today', {
      params: status ? { status } : undefined,
    });
    return mapApiTasksResponse(response);
  },

  /**
   * タスクのステータスを更新
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const response = await api.patch<ApiTask>(`/api/v1/dashboard/tasks/${taskId}/status`, {
      status,
    });
    return mapApiTask(response);
  },

  /**
   * 通知一覧を取得
   */
  async getNotifications(unreadOnly?: boolean): Promise<NotificationsResponse> {
    const response = await api.get<ApiNotificationsResponse>('/api/v1/dashboard/notifications', {
      params: unreadOnly !== undefined ? { unread_only: unreadOnly } : undefined,
    });
    return mapApiNotificationsResponse(response);
  },

  /**
   * 通知を既読にする
   */
  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const response = await api.post<ApiNotification>(
      `/api/v1/dashboard/notifications/${notificationId}/read`
    );
    return mapApiNotification(response);
  },

  /**
   * 全ての通知を既読にする
   */
  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return api.post<ApiMessageResponse>('/api/v1/dashboard/notifications/read-all');
  },

  /**
   * 通知を削除する
   */
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    return api.delete<ApiMessageResponse>(`/api/v1/dashboard/notifications/${notificationId}`);
  },
};
