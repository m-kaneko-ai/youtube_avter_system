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

// =============================================
// リサーチページ用型定義
// =============================================

/**
 * 競合チャンネル情報
 */
export interface Competitor {
  /** チャンネルID */
  id: string;
  /** YouTubeチャンネルID */
  channelId: string;
  /** チャンネル名 */
  name: string;
  /** サムネイルURL */
  thumbnailUrl: string;
  /** 登録者数 */
  subscriberCount: number;
  /** 動画本数 */
  videoCount: number;
  /** 平均視聴回数 */
  avgViews: number;
  /** 成長率（30日間） */
  growthRate: number;
  /** 登録日時 */
  createdAt: string;
}

/**
 * 人気動画情報
 */
export interface PopularVideo {
  /** ID */
  id: string;
  /** YouTube動画ID */
  videoId: string;
  /** タイトル */
  title: string;
  /** 視聴回数 */
  views: number;
  /** チャンネル名 */
  channelName: string;
  /** サムネイルURL */
  thumbnailUrl: string;
  /** 投稿日時 */
  publishedAt: string;
}

/**
 * トレンドキーワード
 */
export interface TrendKeyword {
  /** ID */
  id: string;
  /** キーワード */
  keyword: string;
  /** 成長率（%） */
  growthRate: number;
  /** 検索数 */
  searchVolume: number;
  /** カテゴリ */
  category: string;
  /** 急上昇フラグ */
  isFire: boolean;
}

/**
 * 関連ニュース・話題
 */
export interface TrendNews {
  /** ID */
  id: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** ニュース元 */
  source: string;
  /** URL */
  url: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** 公開日時 */
  publishedAt: string;
}

/**
 * Amazon書籍ランキング
 */
export interface BookRanking {
  /** ID */
  id: string;
  /** タイトル */
  title: string;
  /** 評価 */
  rating: number;
  /** レビュー数 */
  reviewCount: number;
  /** カテゴリ */
  category: string;
  /** 書籍画像URL */
  imageUrl: string;
  /** ランキング順位 */
  rank: number;
}

/**
 * コメント感情分析結果
 */
export interface CommentSentiment {
  /** ポジティブ割合（%） */
  positive: number;
  /** 中立割合（%） */
  neutral: number;
  /** ネガティブ割合（%） */
  negative: number;
  /** ポジティブコメント数 */
  positiveCount: number;
  /** 中立コメント数 */
  neutralCount: number;
  /** ネガティブコメント数 */
  negativeCount: number;
}

/**
 * 頻出キーワード
 */
export interface KeywordFrequency {
  /** キーワード */
  keyword: string;
  /** 出現回数 */
  count: number;
  /** 感情傾向 */
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * 注目コメント
 */
export interface NotableComment {
  /** ID */
  id: string;
  /** コメント本文 */
  text: string;
  /** 高評価数 */
  likes: number;
  /** 投稿者名 */
  authorName: string;
  /** 投稿者アイコンURL */
  authorAvatarUrl: string;
  /** 感情 */
  sentiment: 'positive' | 'neutral' | 'negative';
  /** 投稿日時 */
  publishedAt: string;
}

/**
 * リサーチページのタブ種別
 */
export type ResearchTabType = 'competitor' | 'trend' | 'comments';

/**
 * リサーチページ全体の状態
 */
export interface ResearchState {
  /** アクティブなタブ */
  activeTab: ResearchTabType;
  /** 競合チャンネル一覧 */
  competitors: Competitor[];
  /** 人気動画一覧 */
  popularVideos: PopularVideo[];
  /** トレンドキーワード一覧 */
  trendKeywords: TrendKeyword[];
  /** 関連ニュース一覧 */
  trendNews: TrendNews[];
  /** Amazon書籍ランキング一覧 */
  bookRankings: BookRanking[];
  /** コメント感情分析結果 */
  commentSentiment: CommentSentiment | null;
  /** 頻出キーワード一覧 */
  keywordFrequencies: KeywordFrequency[];
  /** 注目コメント一覧 */
  notableComments: NotableComment[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

// =============================================
// 企画・計画ページ用型定義
// =============================================

/**
 * カレンダー表示モード
 */
export type CalendarView = 'month' | 'week';

/**
 * カレンダーイベント（動画企画）
 */
export interface CalendarEvent {
  /** イベントID */
  id: string;
  /** プロジェクトID */
  projectId: string;
  /** タイトル */
  title: string;
  /** 予定日（YYYY-MM-DD） */
  date: string;
  /** 動画種別 */
  videoType: 'short' | 'long';
  /** ステータス */
  status: 'published' | 'production' | 'planning' | 'scheduled';
}

/**
 * 動画種別
 */
export type VideoType = 'short' | 'long';

/**
 * 企画ステータス
 */
export type ProjectStatus = 'published' | 'production' | 'planning' | 'scheduled';

/**
 * 企画
 */
export interface PlanningProject {
  /** プロジェクトID */
  id: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 動画種別 */
  videoType: VideoType;
  /** ステータス */
  status: ProjectStatus;
  /** 公開予定日（YYYY-MM-DD） */
  scheduledDate?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** キーワード */
  keywords?: string[];
  /** 参考動画URL */
  referenceVideos?: string[];
  /** メモ */
  memo?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * チャットメッセージロール
 */
export type ChatRole = 'user' | 'assistant';

/**
 * AI企画提案
 */
export interface AISuggestion {
  /** 提案ID */
  id: string;
  /** タイトル */
  title: string;
  /** 動画種別 */
  videoType: VideoType;
  /** 提案理由 */
  reason: string;
  /** 参考情報 */
  reference?: string;
  /** キーワード */
  keywords?: string[];
}

/**
 * チャットメッセージ
 */
export interface AIChatMessage {
  /** メッセージID */
  id: string;
  /** ロール */
  role: ChatRole;
  /** メッセージ内容 */
  content: string;
  /** AI提案（assistantメッセージの場合） */
  suggestions?: AISuggestion[];
  /** タイムスタンプ */
  timestamp: string;
}

/**
 * チャットセッション
 */
export interface AIChatSession {
  /** セッションID */
  id: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 動画種別 */
  videoType?: VideoType;
  /** メッセージ履歴 */
  messages: AIChatMessage[];
  /** 採用済み提案 */
  adoptedSuggestions: AISuggestion[];
  /** 作成日時 */
  createdAt: string;
}

/**
 * 企画ページのタブ種別
 */
export type PlanningTabType = 'calendar' | 'list' | 'ai';

/**
 * 企画ページ全体の状態
 */
export interface PlanningState {
  /** アクティブなタブ */
  activeTab: PlanningTabType;
  /** カレンダー表示モード */
  calendarView: CalendarView;
  /** カレンダー表示中の日付 */
  currentDate: Date;
  /** 企画一覧 */
  projects: PlanningProject[];
  /** 選択中の企画 */
  selectedProject: PlanningProject | null;
  /** チャットセッション */
  chatSession: AIChatSession | null;
  /** フィルタ条件 */
  filters: {
    /** 動画種別フィルタ */
    videoType: VideoType | 'all';
    /** ステータスフィルタ */
    status: ProjectStatus | 'all';
  };
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
}
