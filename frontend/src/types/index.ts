// =============================================
// Creator Studio AI - 型定義
// =============================================

// ユーザーロール
export type UserRole =
  | 'owner'
  | 'team'
  | 'client_premium_plus'
  | 'client_premium'
  | 'client_basic';

// ユーザー
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 認証状態
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ページ定義
export interface PageTab {
  id: string;
  label: string;
}

export interface PageDefinition {
  id: string;
  name: string;
  path: string;
  description: string;
  tabs: PageTab[];
  requiredRoles?: UserRole[];
}

// テーマ
export type ThemeMode = 'light' | 'dark';

export interface ThemeClasses {
  bg: string;
  text: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  sidebarBg: string;
  sidebarBorder: string;
  headerBg: string;
  headerBorder: string;
  hoverBg: string;
  activeNavBg: string;
  activeNavText: string;
  scrollbar: string;
}

// ナビゲーション状態
export interface TabState {
  [pageId: string]: string;
}

// プロジェクト
export interface Project {
  id: string;
  clientId: string;
  knowledgeId: string;
  name: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// 動画
export interface Video {
  id: string;
  projectId: string;
  title: string;
  script?: string;
  status: 'draft' | 'in_production' | 'pending_approval' | 'approved' | 'published';
  youtubeUrl?: string;
  analytics?: VideoAnalytics;
  createdAt: string;
  updatedAt: string;
}

// 動画分析
export interface VideoAnalytics {
  views: number;
  likes: number;
  comments: number;
  watchTime: number;
  ctr: number;
}

// ワークフローステップ
export interface WorkflowStep {
  id: string;
  videoId: string;
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  approverId?: string;
  approvedAt?: string;
  comments?: string;
  createdAt: string;
}

// ナレッジ
export interface Knowledge {
  id: string;
  clientId: string;
  name: string;
  type: 'brand' | 'series';
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
