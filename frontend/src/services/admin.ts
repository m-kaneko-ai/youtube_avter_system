/**
 * Admin Service
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from './api';
import type { User, UserRole } from '../types';

// ============================================================
// チーム管理用の型定義
// ============================================================

export type Role = 'owner' | 'team' | 'client_premium_plus' | 'client_premium' | 'client_basic';
export type MemberStatus = 'active' | 'pending' | 'inactive';

interface ApiTeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  avatar_url?: string;
  joined_at: string;
  last_active_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  avatar?: string;
  joinedAt: string;
  lastActive: string;
}

const mapTeamMember = (member: ApiTeamMember): TeamMember => ({
  id: member.id,
  name: member.name,
  email: member.email,
  role: member.role,
  status: member.status,
  avatar: member.avatar_url,
  joinedAt: member.joined_at,
  lastActive: member.last_active_at,
});

// ============================================================
// 承認ワークフロー用の型定義
// ============================================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalType = 'script' | 'thumbnail' | 'video' | 'publish';

interface ApiApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  requested_by: string;
  requested_at: string;
  status: ApprovalStatus;
  priority: 'high' | 'normal' | 'low';
  comment_count?: number;
}

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  requestedBy: string;
  requestedAt: string;
  status: ApprovalStatus;
  priority: 'high' | 'normal' | 'low';
  comments?: number;
}

const mapApprovalRequest = (approval: ApiApprovalRequest): ApprovalRequest => ({
  id: approval.id,
  type: approval.type,
  title: approval.title,
  requestedBy: approval.requested_by,
  requestedAt: approval.requested_at,
  status: approval.status,
  priority: approval.priority,
  comments: approval.comment_count,
});

// ============================================================
// クライアント管理用の型定義
// ============================================================

export type ClientPlan = 'premium_plus' | 'premium' | 'basic';
export type ClientStatus = 'active' | 'inactive' | 'trial';

interface ApiClientData {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  plan: ClientPlan;
  status: ClientStatus;
  knowledge_count: number;
  video_count: number;
  joined_at: string;
  last_active_at: string;
}

export interface ClientData {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  plan: ClientPlan;
  status: ClientStatus;
  knowledgeCount: number;
  videoCount: number;
  joinedAt: string;
  lastActive: string;
}

const mapClientData = (client: ApiClientData): ClientData => ({
  id: client.id,
  companyName: client.company_name,
  contactName: client.contact_name,
  email: client.email,
  plan: client.plan,
  status: client.status,
  knowledgeCount: client.knowledge_count,
  videoCount: client.video_count,
  joinedAt: client.joined_at,
  lastActive: client.last_active_at,
});

// ============================================================
// 既存の型定義（後方互換性維持）
// ============================================================

// User Management
interface UserListResponse {
  users: User[];
  total: number;
}

interface UserCreateRequest {
  email: string;
  name: string;
  role: UserRole;
}

interface UserUpdateRequest {
  name?: string;
  role?: UserRole;
}

// Client Management (legacy)
interface Client {
  id: string;
  user_id: string;
  company_name?: string;
  plan: 'basic' | 'premium' | 'premium_plus';
  knowledge_count: number;
  created_at: string;
  updated_at: string;
}

interface ClientListResponse {
  clients: Client[];
  total: number;
}

interface ClientCreateRequest {
  user_id: string;
  company_name?: string;
  plan: 'basic' | 'premium' | 'premium_plus';
}

// System Settings
interface SystemSetting {
  id: string;
  key: string;
  value?: string;
  value_type: string;
  description?: string;
  is_public: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

interface SystemSettingListResponse {
  settings: SystemSetting[];
  total: number;
}

// API Connections
type ApiConnectionStatus = 'active' | 'inactive' | 'error';

interface ApiConnection {
  id: string;
  name: string;
  service: string;
  client_id?: string;
  status: ApiConnectionStatus;
  settings?: Record<string, unknown>;
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface ApiConnectionListResponse {
  connections: ApiConnection[];
  total: number;
}

interface ApiConnectionCreateRequest {
  name: string;
  service: string;
  client_id?: string;
  credentials?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

interface ApiConnectionTestResponse {
  connection_id: string;
  service: string;
  status: ApiConnectionStatus;
  message: string;
  response_time_ms?: number;
}

// Audit Logs
type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'generate';

interface AuditLog {
  id: string;
  user_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  extra_data?: Record<string, unknown>;
  created_at: string;
}

interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  page_size: number;
}

// System Health
interface SystemHealth {
  status: string;
  version: string;
  database: {
    status: string;
    response_time_ms: number;
    pool_size: number;
  };
  cache: {
    status: string;
    response_time_ms: number;
    memory_usage_mb: number;
  };
  external_services: Record<string, string>;
  uptime_seconds: number;
}

// ============================================================
// モックデータ（API接続エラー時のフォールバック）
// ============================================================

const mockTeamMembers: TeamMember[] = [
  {
    id: 'member-1',
    name: '金子 光良',
    email: 'kaneko@example.com',
    role: 'owner',
    status: 'active',
    avatar: undefined,
    joinedAt: new Date(Date.now() - 365 * 86400000).toISOString(),
    lastActive: new Date().toISOString(),
  },
  {
    id: 'member-2',
    name: '田中 太郎',
    email: 'tanaka@example.com',
    role: 'team',
    status: 'active',
    avatar: undefined,
    joinedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'member-3',
    name: '鈴木 花子',
    email: 'suzuki@example.com',
    role: 'team',
    status: 'active',
    avatar: undefined,
    joinedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'member-4',
    name: '山田 次郎',
    email: 'yamada@example.com',
    role: 'team',
    status: 'pending',
    avatar: undefined,
    joinedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: 'approval-1',
    type: 'script',
    title: 'AIツール活用術【初心者向け】- 台本',
    requestedBy: '田中 太郎',
    requestedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: 'pending',
    priority: 'high',
    comments: 2,
  },
  {
    id: 'approval-2',
    type: 'thumbnail',
    title: 'ChatGPT vs Claude 比較 - サムネイル',
    requestedBy: '鈴木 花子',
    requestedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: 'pending',
    priority: 'normal',
    comments: 0,
  },
  {
    id: 'approval-3',
    type: 'video',
    title: 'プログラミング入門 #5 - 最終動画',
    requestedBy: '田中 太郎',
    requestedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: 'approved',
    priority: 'normal',
    comments: 3,
  },
  {
    id: 'approval-4',
    type: 'publish',
    title: '週刊ニュースまとめ - 公開申請',
    requestedBy: '鈴木 花子',
    requestedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    status: 'rejected',
    priority: 'low',
    comments: 1,
  },
];

const mockClients: ClientData[] = [
  {
    id: 'client-1',
    companyName: '株式会社テクノロジー',
    contactName: '佐藤 一郎',
    email: 'sato@tech-company.co.jp',
    plan: 'premium_plus',
    status: 'active',
    knowledgeCount: 5,
    videoCount: 48,
    joinedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'client-2',
    companyName: 'クリエイティブスタジオ合同会社',
    contactName: '高橋 美咲',
    email: 'takahashi@creative-studio.jp',
    plan: 'premium',
    status: 'active',
    knowledgeCount: 3,
    videoCount: 24,
    joinedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'client-3',
    companyName: '個人事業主 山本',
    contactName: '山本 健太',
    email: 'yamamoto@personal.com',
    plan: 'basic',
    status: 'trial',
    knowledgeCount: 1,
    videoCount: 5,
    joinedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastActive: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const adminService = {
  // User Management
  async getUsers(role?: UserRole): Promise<UserListResponse> {
    return api.get<UserListResponse>('/api/v1/users', {
      params: { role },
    });
  },

  async createUser(request: UserCreateRequest): Promise<User> {
    return api.post<User>('/api/v1/users', request);
  },

  async getUser(userId: string): Promise<User> {
    return api.get<User>(`/api/v1/users/${userId}`);
  },

  async updateUser(userId: string, request: UserUpdateRequest): Promise<User> {
    return api.put<User>(`/api/v1/users/${userId}`, request);
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/api/v1/users/${userId}`);
  },

  // Client Management
  async getClients(): Promise<ClientListResponse> {
    return api.get<ClientListResponse>('/api/v1/clients');
  },

  async createClient(request: ClientCreateRequest): Promise<Client> {
    return api.post<Client>('/api/v1/clients', request);
  },

  async getClient(clientId: string): Promise<Client> {
    return api.get<Client>(`/api/v1/clients/${clientId}`);
  },

  async updateClient(clientId: string, request: Partial<ClientCreateRequest>): Promise<Client> {
    return api.put<Client>(`/api/v1/clients/${clientId}`, request);
  },

  // System Settings
  async getSettings(includePrivate?: boolean): Promise<SystemSettingListResponse> {
    return api.get<SystemSettingListResponse>('/api/v1/admin/settings', {
      params: { include_private: includePrivate },
    });
  },

  async getSetting(key: string): Promise<SystemSetting> {
    return api.get<SystemSetting>(`/api/v1/admin/settings/${key}`);
  },

  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    return api.put<SystemSetting>(`/api/v1/admin/settings/${key}`, { value });
  },

  // API Connections
  async getConnections(): Promise<ApiConnectionListResponse> {
    return api.get<ApiConnectionListResponse>('/api/v1/admin/connections');
  },

  async createConnection(request: ApiConnectionCreateRequest): Promise<ApiConnection> {
    return api.post<ApiConnection>('/api/v1/admin/connections', request);
  },

  async updateConnection(connectionId: string, request: Partial<ApiConnectionCreateRequest>): Promise<ApiConnection> {
    return api.put<ApiConnection>(`/api/v1/admin/connections/${connectionId}`, request);
  },

  async testConnection(connectionId: string): Promise<ApiConnectionTestResponse> {
    return api.post<ApiConnectionTestResponse>(`/api/v1/admin/connections/${connectionId}/test`);
  },

  async deleteConnection(connectionId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/api/v1/admin/connections/${connectionId}`);
  },

  // Audit Logs
  async getAuditLogs(
    page?: number,
    pageSize?: number,
    action?: AuditAction,
    resourceType?: string
  ): Promise<AuditLogListResponse> {
    return api.get<AuditLogListResponse>('/api/v1/admin/audit-logs', {
      params: { page, page_size: pageSize, action, resource_type: resourceType },
    });
  },

  // System Health
  async getSystemHealth(): Promise<SystemHealth> {
    return api.get<SystemHealth>('/api/v1/admin/health');
  },

  // ============================================================
  // チーム管理（新規追加）
  // ============================================================

  /**
   * チームメンバー一覧を取得
   */
  async getTeamMembers(): Promise<{ members: TeamMember[] }> {
    try {
      const response = await api.get<{ members: ApiTeamMember[] }>('/api/v1/admin/team');
      return {
        members: response.members.map(mapTeamMember),
      };
    } catch {
      console.info('[adminService] Using mock data for team members');
      return {
        members: mockTeamMembers,
      };
    }
  },

  /**
   * メンバーを招待
   */
  async inviteMember(data: { email: string; role: Role }): Promise<{ member: TeamMember }> {
    const response = await api.post<{ member: ApiTeamMember }>('/api/v1/admin/team/invite', data);
    return {
      member: mapTeamMember(response.member),
    };
  },

  /**
   * メンバーのロールを更新
   */
  async updateMemberRole(memberId: string, role: Role): Promise<{ member: TeamMember }> {
    const response = await api.patch<{ member: ApiTeamMember }>(
      `/api/v1/admin/team/${memberId}/role`,
      { role }
    );
    return {
      member: mapTeamMember(response.member),
    };
  },

  /**
   * メンバーを削除
   */
  async deleteMember(memberId: string): Promise<void> {
    await api.delete(`/api/v1/admin/team/${memberId}`);
  },

  // ============================================================
  // 承認ワークフロー（新規追加）
  // ============================================================

  /**
   * 承認リクエスト一覧を取得
   */
  async getApprovals(status?: ApprovalStatus): Promise<{ approvals: ApprovalRequest[] }> {
    try {
      const params = status ? { status } : undefined;
      const response = await api.get<{ approvals: ApiApprovalRequest[] }>(
        '/api/v1/admin/approvals',
        { params }
      );
      return {
        approvals: response.approvals.map(mapApprovalRequest),
      };
    } catch {
      console.info('[adminService] Using mock data for approvals');
      const filtered = status
        ? mockApprovalRequests.filter((a) => a.status === status)
        : mockApprovalRequests;
      return {
        approvals: filtered,
      };
    }
  },

  /**
   * 承認リクエストを承認
   */
  async approveRequest(requestId: string, comment?: string): Promise<{ approval: ApprovalRequest }> {
    const response = await api.post<{ approval: ApiApprovalRequest }>(
      `/api/v1/admin/approvals/${requestId}/approve`,
      { comment }
    );
    return {
      approval: mapApprovalRequest(response.approval),
    };
  },

  /**
   * 承認リクエストを却下
   */
  async rejectRequest(requestId: string, reason: string): Promise<{ approval: ApprovalRequest }> {
    const response = await api.post<{ approval: ApiApprovalRequest }>(
      `/api/v1/admin/approvals/${requestId}/reject`,
      { reason }
    );
    return {
      approval: mapApprovalRequest(response.approval),
    };
  },

  // ============================================================
  // クライアント管理（拡張版）
  // ============================================================

  /**
   * クライアント一覧を取得（拡張版）
   */
  async getClientList(): Promise<{ clients: ClientData[] }> {
    try {
      const response = await api.get<{ clients: ApiClientData[] }>('/api/v1/admin/clients');
      return {
        clients: response.clients.map(mapClientData),
      };
    } catch {
      console.info('[adminService] Using mock data for clients');
      return {
        clients: mockClients,
      };
    }
  },

  /**
   * クライアントを追加
   */
  async addClient(data: {
    companyName: string;
    contactName: string;
    email: string;
    plan: ClientPlan;
  }): Promise<{ client: ClientData }> {
    const response = await api.post<{ client: ApiClientData }>('/api/v1/admin/clients', {
      company_name: data.companyName,
      contact_name: data.contactName,
      email: data.email,
      plan: data.plan,
    });
    return {
      client: mapClientData(response.client),
    };
  },
};
