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
// モックデータ（API接続エラー時のフォールバック）
// ============================================================

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: '台本レビュー：AIツール紹介動画',
    description: '昨日作成した台本の最終確認',
    category: 'script',
    status: 'pending',
    priority: 'high',
    dueTime: '10:00',
    project: 'AIツール活用術',
  },
  {
    id: 'task-2',
    title: 'サムネイル作成：ChatGPT比較',
    description: 'A/Bテスト用に2パターン作成',
    category: 'thumbnail',
    status: 'in_progress',
    priority: 'medium',
    dueTime: '14:00',
    project: 'ChatGPT vs Claude',
  },
  {
    id: 'task-3',
    title: '動画公開：プロンプト入門',
    description: '編集完了、公開設定確認',
    category: 'publish',
    status: 'pending',
    priority: 'high',
    dueTime: '18:00',
    project: 'プロンプト入門',
  },
  {
    id: 'task-4',
    title: 'コメント返信確認',
    description: '昨日の動画へのコメント対応',
    category: 'review',
    status: 'completed',
    priority: 'low',
    dueTime: '09:00',
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'approval',
    title: '承認リクエスト',
    message: '「AIツール紹介」の台本が承認待ちです',
    time: '10分前',
    isRead: false,
    actionUrl: '/script',
  },
  {
    id: 'notif-2',
    type: 'performance',
    title: 'パフォーマンスアラート',
    message: '「プロンプト入門」が1万回再生を達成しました！',
    time: '1時間前',
    isRead: false,
    actionUrl: '/analytics',
  },
  {
    id: 'notif-3',
    type: 'video',
    title: '動画処理完了',
    message: 'アバター動画の生成が完了しました',
    time: '2時間前',
    isRead: true,
    actionUrl: '/production',
  },
  {
    id: 'notif-4',
    type: 'info',
    title: 'システム通知',
    message: '新機能：マルチプラットフォーム配信が利用可能になりました',
    time: '昨日',
    isRead: true,
  },
];

// ============================================================
// Dashboard Service
// ============================================================

export const dashboardService = {
  /**
   * 今日のタスク一覧を取得
   */
  async getTodayTasks(status?: TaskStatus): Promise<TasksResponse> {
    try {
      const response = await api.get<ApiTasksResponse>('/api/v1/dashboard/tasks/today', {
        params: status ? { status } : undefined,
      });
      return mapApiTasksResponse(response);
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[dashboardService] Using mock data for tasks');
      let filtered = [...mockTasks];
      if (status) {
        filtered = filtered.filter(t => t.status === status);
      }
      return {
        tasks: filtered,
        total: filtered.length,
        pendingCount: mockTasks.filter(t => t.status === 'pending').length,
        inProgressCount: mockTasks.filter(t => t.status === 'in_progress').length,
        completedCount: mockTasks.filter(t => t.status === 'completed').length,
        overdueCount: mockTasks.filter(t => t.status === 'overdue').length,
      };
    }
  },

  /**
   * タスクのステータスを更新
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    try {
      const response = await api.patch<ApiTask>(`/api/v1/dashboard/tasks/${taskId}/status`, {
        status,
      });
      return mapApiTask(response);
    } catch {
      // モック: ステータス更新をシミュレート
      const task = mockTasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        return task;
      }
      throw new Error('Task not found');
    }
  },

  /**
   * 通知一覧を取得
   */
  async getNotifications(unreadOnly?: boolean): Promise<NotificationsResponse> {
    try {
      const response = await api.get<ApiNotificationsResponse>('/api/v1/dashboard/notifications', {
        params: unreadOnly !== undefined ? { unread_only: unreadOnly } : undefined,
      });
      return mapApiNotificationsResponse(response);
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[dashboardService] Using mock data for notifications');
      let filtered = [...mockNotifications];
      if (unreadOnly) {
        filtered = filtered.filter(n => !n.isRead);
      }
      return {
        notifications: filtered,
        total: filtered.length,
        unreadCount: mockNotifications.filter(n => !n.isRead).length,
      };
    }
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
