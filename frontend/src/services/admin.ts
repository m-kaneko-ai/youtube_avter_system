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
    const response = await api.get<{ members: ApiTeamMember[] }>('/api/v1/admin/team');
    return {
      members: response.members.map(mapTeamMember),
    };
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
    const params = status ? { status } : undefined;
    const response = await api.get<{ approvals: ApiApprovalRequest[] }>(
      '/api/v1/admin/approvals',
      { params }
    );
    return {
      approvals: response.approvals.map(mapApprovalRequest),
    };
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
    const response = await api.get<{ clients: ApiClientData[] }>('/api/v1/admin/clients');
    return {
      clients: response.clients.map(mapClientData),
    };
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
