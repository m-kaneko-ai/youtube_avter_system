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

// =============================================
// ナレッジ作成チャットボット用型定義
// =============================================

/**
 * ナレッジチャットのステップ定義
 */
export type KnowledgeChatStep =
  | 'business_info'      // ビジネス基本情報
  | 'main_target'        // メインターゲット
  | 'sub_target'         // サブターゲット
  | 'competitor'         // 競合分析
  | 'company'            // 自社分析
  | 'aha_concept'        // AHAコンセプト
  | 'concept_story'      // コンセプト・ストーリー
  | 'product_design';    // 商品設計

/**
 * ナレッジセクション情報
 */
export interface KnowledgeSection {
  /** ステップID */
  id: KnowledgeChatStep;
  /** ステップ番号 */
  stepNumber: number;
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** 必須かどうか */
  isRequired: boolean;
  /** 収集する情報のキー */
  dataKeys: string[];
}

/**
 * ナレッジチャットメッセージ
 */
export interface KnowledgeChatMessage {
  /** メッセージID */
  id: string;
  /** ロール */
  role: 'user' | 'assistant' | 'system';
  /** メッセージ内容 */
  content: string;
  /** 関連するステップ */
  step?: KnowledgeChatStep;
  /** タイムスタンプ */
  timestamp: string;
  /** メタデータ（抽出された情報など） */
  metadata?: Record<string, unknown>;
}

/**
 * 収集されたナレッジデータ
 */
export interface CollectedKnowledgeData {
  // ビジネス基本情報
  businessInfo?: {
    industry?: string;
    annualRevenue?: string;
    yearsInBusiness?: string;
    services?: string;
    businessModel?: string;
  };
  // メインターゲット
  mainTarget?: {
    attributes?: string;
    situation?: string;
    frustrations?: string;
    painPoints?: string;
    desires?: string;
    insights?: string;
  };
  // サブターゲット
  subTarget?: {
    attributes?: string;
    situation?: string;
    frustrations?: string;
    painPoints?: string;
    desires?: string;
    insights?: string;
  };
  // 競合分析
  competitor?: {
    mainCompetitors?: string;
    competitorValue?: string;
    customerComplaints?: string;
    differentiation?: string;
  };
  // 自社分析
  company?: {
    strengths?: string;
    mission?: string;
    achievements?: string;
    uniqueMethod?: string;
  };
  // AHAコンセプト
  ahaConcept?: {
    commonSense?: string;
    destruction?: string;
    insight?: string;
    naming?: string;
  };
  // コンセプト・ストーリー
  conceptStory?: {
    character?: string;
    beforeStory?: string;
    transformationStory?: string;
    afterStory?: string;
  };
  // 商品設計
  productDesign?: {
    priceRange?: string;
    curriculum?: string;
    deliverables?: string;
    support?: string;
  };
}

/**
 * ナレッジチャットセッション
 */
export interface KnowledgeChatSession {
  /** セッションID */
  id: string;
  /** クライアントID */
  clientId?: string;
  /** ナレッジ名 */
  knowledgeName?: string;
  /** 現在のステップ */
  currentStep: KnowledgeChatStep;
  /** 現在のステップ番号 */
  currentStepNumber: number;
  /** メッセージ履歴 */
  messages: KnowledgeChatMessage[];
  /** 収集されたデータ */
  collectedData: CollectedKnowledgeData;
  /** ステップ完了状態 */
  completedSteps: KnowledgeChatStep[];
  /** セッションステータス */
  status: 'active' | 'paused' | 'completed';
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * ナレッジチャットの進捗情報
 */
export interface KnowledgeChatProgress {
  /** 現在のステップ番号 */
  currentStep: number;
  /** 総ステップ数 */
  totalSteps: number;
  /** 進捗率 */
  progressPercent: number;
  /** 完了したセクション */
  completedSections: string[];
  /** 収集済みフィールド数 */
  collectedFieldsCount: number;
  /** 総フィールド数 */
  totalFieldsCount: number;
}

/**
 * ナレッジチャットのモード
 */
export type KnowledgeChatMode = 'manual' | 'rag';

/**
 * アップロードされたファイル情報
 */
export interface UploadedKnowledgeFile {
  /** ファイルID */
  id: string;
  /** ファイル名 */
  name: string;
  /** ファイルタイプ */
  type: 'pdf' | 'txt';
  /** ファイルサイズ（バイト） */
  size: number;
  /** 抽出されたテキスト */
  content: string;
  /** アップロード日時 */
  uploadedAt: string;
}

/**
 * RAG解析結果
 */
export interface RAGAnalysisResult {
  /** 抽出されたデータ */
  extractedData: CollectedKnowledgeData;
  /** 不足している項目 */
  missingFields: {
    step: KnowledgeChatStep;
    field: string;
    fieldLabel: string;
  }[];
  /** 確認が必要な項目 */
  needsConfirmation: {
    step: KnowledgeChatStep;
    field: string;
    value: string;
    reason: string;
  }[];
  /** 解析の信頼度（0-100） */
  confidence: number;
  /** 抽出済みフィールド数 */
  extractedFields: number;
  /** 全フィールド数 */
  totalFields: number;
}

// =============================================
// CTA管理用型定義
// =============================================

/**
 * CTAタイプ
 */
export type CTAType = 'line' | 'email' | 'download' | 'discord' | 'webinar' | 'lp' | 'custom';

/**
 * CTA配置場所
 */
export type CTAPlacement = 'description_top' | 'description_bottom' | 'pinned_comment';

/**
 * UTMパラメータ
 */
export interface UTMParams {
  /** ソース（例: youtube） */
  source?: string;
  /** メディウム（例: video） */
  medium?: string;
  /** キャンペーン名 */
  campaign?: string;
}

/**
 * CTAテンプレート
 */
export interface CTATemplate {
  /** CTA ID */
  id: string;
  /** CTA名 */
  name: string;
  /** CTAタイプ */
  type: CTAType;
  /** リンクURL */
  url: string;
  /** UTMパラメータ */
  utmParams?: UTMParams;
  /** 短縮URL */
  shortUrl?: string;
  /** 表示テキスト */
  displayText: string;
  /** 配置場所 */
  placement: CTAPlacement;
  /** 有効/無効 */
  isActive: boolean;
  /** コンバージョン数（クリック数） */
  conversionCount: number;
  /** CTR（クリック率 %） */
  ctr?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * CTA作成リクエスト
 */
export interface CTACreateRequest {
  /** CTA名 */
  name: string;
  /** CTAタイプ */
  type: CTAType;
  /** リンクURL */
  url: string;
  /** UTMパラメータ */
  utmParams?: UTMParams;
  /** 短縮URL生成フラグ */
  generateShortUrl?: boolean;
  /** 表示テキスト */
  displayText: string;
  /** 配置場所 */
  placement: CTAPlacement;
  /** 有効/無効 */
  isActive?: boolean;
}

/**
 * CTA更新リクエスト
 */
export interface CTAUpdateRequest {
  /** CTA名 */
  name?: string;
  /** CTAタイプ */
  type?: CTAType;
  /** リンクURL */
  url?: string;
  /** UTMパラメータ */
  utmParams?: UTMParams;
  /** 短縮URL生成フラグ */
  generateShortUrl?: boolean;
  /** 表示テキスト */
  displayText?: string;
  /** 配置場所 */
  placement?: CTAPlacement;
  /** 有効/無効 */
  isActive?: boolean;
}

/**
 * CTA一覧レスポンス
 */
export interface CTAListResponse {
  /** CTA一覧 */
  ctas: CTATemplate[];
  /** 総数 */
  total: number;
  /** 統計情報 */
  stats: {
    /** 総CTA数 */
    totalCTAs: number;
    /** 有効なCTA数 */
    activeCTAs: number;
    /** 総クリック数 */
    totalClicks: number;
    /** 平均CTR */
    avgCTR: number;
  };
}

/**
 * CTA統計情報
 */
export interface CTAStats {
  /** CTA ID */
  ctaId: string;
  /** クリック数 */
  clicks: number;
  /** CTR */
  ctr: number;
  /** 日別クリック数 */
  dailyClicks?: {
    date: string;
    clicks: number;
  }[];
}

/**
 * 動画へのCTA割り当て
 */
export interface VideoCTAAssignment {
  /** 動画ID */
  videoId: string;
  /** 説明欄上部CTA ID */
  topCTAId?: string;
  /** 説明欄下部CTA ID */
  bottomCTAId?: string;
  /** 固定コメントCTA ID */
  pinnedCommentCTAId?: string;
}

/**
 * UTMデフォルト設定
 */
export interface UTMDefaultSettings {
  /** 設定ID */
  id: string;
  /** デフォルトソース */
  defaultSource: string;
  /** デフォルトメディウム */
  defaultMedium: string;
  /** キャンペーン命名規則 */
  campaignNamingRule: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * CTA管理ページのタブ種別
 */
export type CTATabType = 'list' | 'settings';

/**
 * CTAタイプの設定情報
 */
export const CTA_TYPE_CONFIG: Record<CTAType, { label: string; icon: string; color: string }> = {
  line: { label: 'LINE', icon: 'message-circle', color: 'green' },
  email: { label: 'メール', icon: 'mail', color: 'blue' },
  download: { label: 'ダウンロード', icon: 'download', color: 'orange' },
  discord: { label: 'Discord', icon: 'hash', color: 'indigo' },
  webinar: { label: 'ウェビナー', icon: 'video', color: 'purple' },
  lp: { label: 'LP', icon: 'external-link', color: 'pink' },
  custom: { label: 'カスタム', icon: 'settings', color: 'slate' },
};

/**
 * CTA配置場所の設定情報
 */
export const CTA_PLACEMENT_CONFIG: Record<CTAPlacement, { label: string; icon: string }> = {
  description_top: { label: '説明欄上部', icon: 'arrow-up' },
  description_bottom: { label: '説明欄下部', icon: 'arrow-down' },
  pinned_comment: { label: '固定コメント', icon: 'message-square' },
};

// =============================================
// ショート→長尺連携用型定義
// =============================================

/**
 * エンゲージメント連携ステータス
 */
export type EngagementStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

/**
 * 連携タイプ
 */
export type LinkType = 'description' | 'pinned_comment' | 'end_screen' | 'card';

/**
 * 連携リンクの配置位置
 */
export type LinkPosition = 'top' | 'middle' | 'bottom';

/**
 * 動画サマリー（連携表示用）
 */
export interface VideoSummary {
  /** 動画ID */
  id: string;
  /** タイトル */
  title?: string;
  /** YouTube URL */
  youtubeUrl?: string;
  /** ステータス */
  status: string;
}

/**
 * ショート→長尺連携
 */
export interface ShortToLongLink {
  /** 連携ID */
  id: string;
  /** ショート動画ID */
  shortVideoId: string;
  /** 長尺動画ID */
  longVideoId: string;
  /** 連携タイプ */
  linkType: string;
  /** 誘導テキスト */
  linkText?: string;
  /** リンク配置位置 */
  linkPosition?: string;
  /** ステータス */
  status: EngagementStatus;
  /** 有効フラグ */
  isActive: boolean;
  /** ショート動画情報 */
  shortVideo?: VideoSummary;
  /** 長尺動画情報 */
  longVideo?: VideoSummary;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * ショート→長尺連携作成リクエスト
 */
export interface ShortToLongLinkCreateRequest {
  /** ショート動画ID */
  shortVideoId: string;
  /** 長尺動画ID */
  longVideoId: string;
  /** 連携タイプ */
  linkType: string;
  /** 誘導テキスト */
  linkText?: string;
  /** リンク配置位置 */
  linkPosition?: string;
  /** 有効フラグ */
  isActive?: boolean;
}

/**
 * ショート→長尺連携更新リクエスト
 */
export interface ShortToLongLinkUpdateRequest {
  /** 連携タイプ */
  linkType?: string;
  /** 誘導テキスト */
  linkText?: string;
  /** リンク配置位置 */
  linkPosition?: string;
  /** ステータス */
  status?: EngagementStatus;
  /** 有効フラグ */
  isActive?: boolean;
}

/**
 * ショート→長尺連携一覧レスポンス
 */
export interface ShortToLongLinkListResponse {
  /** 連携一覧 */
  links: ShortToLongLink[];
  /** 総数 */
  total: number;
}

/**
 * エンゲージメントサマリー
 */
export interface EngagementSummary {
  /** 総連携数 */
  totalLinks: number;
  /** 有効な連携数 */
  activeLinks: number;
  /** 総クリック数 */
  totalClicks: number;
  /** 平均CTR */
  avgCTR: number;
  /** 総コンバージョン数 */
  totalConversions: number;
  /** 平均コンバージョン率 */
  avgConversionRate: number;
}

/**
 * 日別エンゲージメント統計
 */
export interface EngagementDailyStats {
  /** 日付 */
  date: string;
  /** ショート再生数 */
  shortViews: number;
  /** 長尺再生数 */
  longViews: number;
  /** クリック数 */
  clicks: number;
  /** コンバージョン数 */
  conversions: number;
}

/**
 * 連携パフォーマンス
 */
export interface LinkPerformance {
  /** 連携ID */
  linkId: string;
  /** ショート動画タイトル */
  shortVideoTitle?: string;
  /** 長尺動画タイトル */
  longVideoTitle?: string;
  /** ショート総再生数 */
  totalShortViews: number;
  /** 総クリック数 */
  totalClicks: number;
  /** CTR */
  ctr: number;
  /** 総コンバージョン数 */
  totalConversions: number;
  /** コンバージョン率 */
  conversionRate: number;
  /** 日別統計 */
  dailyStats: EngagementDailyStats[];
}

// =============================================
// シリーズ管理用型定義
// =============================================

/**
 * シリーズステータス
 */
export type SeriesStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

/**
 * シリーズタイプ
 */
export type SeriesType = 'playlist' | 'topic' | 'tutorial' | 'seasonal' | 'campaign';

/**
 * 公開頻度
 */
export type ReleaseFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

/**
 * シリーズ
 */
export interface Series {
  /** シリーズID */
  id: string;
  /** シリーズ名 */
  name: string;
  /** 説明 */
  description?: string;
  /** シリーズタイプ */
  seriesType: SeriesType;
  /** プロジェクトID */
  projectId?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** ステータス */
  status: SeriesStatus;
  /** YouTube再生リストID */
  youtubePlaylistId?: string;
  /** YouTube再生リストURL */
  youtubePlaylistUrl?: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** タグ */
  tags?: string[];
  /** 開始日 */
  startDate?: string;
  /** 終了日 */
  endDate?: string;
  /** 目標動画本数 */
  targetVideoCount?: number;
  /** 公開頻度 */
  releaseFrequency?: string;
  /** 総動画数 */
  totalVideos: number;
  /** 総再生回数 */
  totalViews: number;
  /** 総視聴時間（時間） */
  totalWatchTimeHours?: number;
  /** 平均視聴時間（秒） */
  avgViewDurationSeconds?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * シリーズ作成リクエスト
 */
export interface SeriesCreateRequest {
  /** シリーズ名 */
  name: string;
  /** 説明 */
  description?: string;
  /** シリーズタイプ */
  seriesType?: SeriesType;
  /** プロジェクトID */
  projectId?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** YouTube再生リストID */
  youtubePlaylistId?: string;
  /** YouTube再生リストURL */
  youtubePlaylistUrl?: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** タグ */
  tags?: string[];
  /** 開始日 */
  startDate?: string;
  /** 終了日 */
  endDate?: string;
  /** 目標動画本数 */
  targetVideoCount?: number;
  /** 公開頻度 */
  releaseFrequency?: string;
}

/**
 * シリーズ更新リクエスト
 */
export interface SeriesUpdateRequest {
  /** シリーズ名 */
  name?: string;
  /** 説明 */
  description?: string;
  /** シリーズタイプ */
  seriesType?: SeriesType;
  /** ステータス */
  status?: SeriesStatus;
  /** YouTube再生リストID */
  youtubePlaylistId?: string;
  /** YouTube再生リストURL */
  youtubePlaylistUrl?: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** タグ */
  tags?: string[];
  /** 開始日 */
  startDate?: string;
  /** 終了日 */
  endDate?: string;
  /** 目標動画本数 */
  targetVideoCount?: number;
  /** 公開頻度 */
  releaseFrequency?: string;
}

/**
 * シリーズ一覧レスポンス
 */
export interface SeriesListResponse {
  /** シリーズ一覧 */
  series: Series[];
  /** 総数 */
  total: number;
}

/**
 * 動画情報（シリーズ表示用）
 */
export interface SeriesVideoInfo {
  /** 動画ID */
  id: string;
  /** タイトル */
  title?: string;
  /** YouTube URL */
  youtubeUrl?: string;
  /** ステータス */
  status: string;
}

/**
 * シリーズ動画アイテム
 */
export interface SeriesVideoItem {
  /** アイテムID */
  id: string;
  /** シリーズID */
  seriesId: string;
  /** 動画ID */
  videoId: string;
  /** 並び順 */
  orderIndex: number;
  /** エピソード番号 */
  episodeNumber?: number;
  /** エピソードタイトル */
  episodeTitle?: string;
  /** 公開済みフラグ */
  isPublished: boolean;
  /** 公開日時 */
  publishedAt?: string;
  /** 公開予定日時 */
  scheduledAt?: string;
  /** 再生回数 */
  views: number;
  /** いいね数 */
  likes: number;
  /** コメント数 */
  comments: number;
  /** 平均視聴時間（秒） */
  avgViewDurationSeconds?: number;
  /** リテンション率（%） */
  retentionRate?: number;
  /** 動画情報 */
  video?: SeriesVideoInfo;
  /** 追加日時 */
  addedAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * シリーズ詳細（動画一覧含む）
 */
export interface SeriesWithVideos extends Series {
  /** 動画アイテム一覧 */
  videoItems: SeriesVideoItem[];
}

/**
 * シリーズ動画追加リクエスト
 */
export interface SeriesVideoAddRequest {
  /** 動画ID */
  videoId: string;
  /** 並び順 */
  orderIndex?: number;
  /** エピソード番号 */
  episodeNumber?: number;
  /** エピソードタイトル */
  episodeTitle?: string;
  /** 公開予定日時 */
  scheduledAt?: string;
}

/**
 * シリーズ統計
 */
export interface SeriesStats {
  /** 総シリーズ数 */
  totalSeries: number;
  /** 有効なシリーズ数 */
  activeSeries: number;
  /** 総動画数 */
  totalVideos: number;
  /** 総再生回数 */
  totalViews: number;
  /** シリーズあたり平均動画数 */
  avgVideosPerSeries: number;
}

/**
 * シリーズ日別統計
 */
export interface SeriesDailyStats {
  /** 日付 */
  date: string;
  /** 再生数 */
  views: number;
  /** 新規登録者数 */
  newSubscribers: number;
  /** 視聴時間（分） */
  watchTimeMinutes: number;
}

/**
 * シリーズパフォーマンス
 */
export interface SeriesPerformance {
  /** シリーズID */
  seriesId: string;
  /** シリーズ名 */
  seriesName: string;
  /** 総動画数 */
  totalVideos: number;
  /** 総再生回数 */
  totalViews: number;
  /** 総視聴時間（時間） */
  totalWatchTimeHours: number;
  /** 平均視聴時間（秒） */
  avgViewDurationSeconds: number;
  /** 登録者増加数 */
  subscriberGrowth: number;
  /** 日別統計 */
  dailyStats: SeriesDailyStats[];
}

/**
 * シリーズタイプの設定情報
 */
export const SERIES_TYPE_CONFIG: Record<SeriesType, { label: string; icon: string; color: string }> = {
  playlist: { label: '再生リスト', icon: 'list', color: 'blue' },
  topic: { label: 'テーマ', icon: 'tag', color: 'green' },
  tutorial: { label: 'チュートリアル', icon: 'book-open', color: 'purple' },
  seasonal: { label: '季節限定', icon: 'calendar', color: 'orange' },
  campaign: { label: 'キャンペーン', icon: 'megaphone', color: 'pink' },
};

/**
 * 連携タイプの設定情報
 */
export const LINK_TYPE_CONFIG: Record<LinkType, { label: string; icon: string; description: string }> = {
  description: { label: '説明欄', icon: 'file-text', description: '説明欄にリンクを追加' },
  pinned_comment: { label: '固定コメント', icon: 'message-square', description: '固定コメントでリンク' },
  end_screen: { label: '終了画面', icon: 'layout', description: '終了画面に誘導カード' },
  card: { label: 'カード', icon: 'credit-card', description: '動画内カードでリンク' },
};

// =============================================
// パフォーマンス学習用型定義
// =============================================

/**
 * パフォーマンスレベル
 */
export type PerformanceLevel = 'exceptional' | 'high' | 'average' | 'below_average' | 'low';

/**
 * 学習カテゴリ
 */
export type LearningCategory = 'title' | 'thumbnail' | 'hook' | 'content_structure' | 'cta' | 'timing' | 'length' | 'tags';

/**
 * インサイトタイプ
 */
export type InsightType = 'success_pattern' | 'failure_pattern' | 'trend' | 'recommendation' | 'correlation';

/**
 * パフォーマンス記録
 */
export interface PerformanceRecord {
  /** 記録ID */
  id: string;
  /** 動画ID */
  videoId: string;
  /** プロジェクトID */
  projectId?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 動画タイプ（short/long） */
  videoType: string;
  /** 公開日時 */
  publishedAt?: string;
  /** 再生数 */
  views: number;
  /** いいね数 */
  likes: number;
  /** 低評価数 */
  dislikes: number;
  /** コメント数 */
  comments: number;
  /** シェア数 */
  shares: number;
  /** 獲得登録者数 */
  subscribersGained: number;
  /** 失った登録者数 */
  subscribersLost: number;
  /** 視聴時間（分） */
  watchTimeMinutes?: number;
  /** 平均視聴時間（秒） */
  avgViewDurationSeconds?: number;
  /** 平均視聴割合（%） */
  avgViewPercentage?: number;
  /** インプレッション数 */
  impressions: number;
  /** CTR（%） */
  ctr?: number;
  /** タイトル文字数 */
  titleLength?: number;
  /** タイトルに数字があるか */
  hasNumberInTitle: boolean;
  /** タイトルに疑問文があるか */
  hasQuestionInTitle: boolean;
  /** タイトルに絵文字があるか */
  hasEmojiInTitle: boolean;
  /** 動画の長さ（秒） */
  videoLengthSeconds?: number;
  /** 公開曜日（0-6） */
  publishDayOfWeek?: number;
  /** 公開時間（0-23） */
  publishHour?: number;
  /** タグ */
  tags?: string[];
  /** カテゴリ */
  category?: string;
  /** 追加属性 */
  extraAttributes?: Record<string, unknown>;
  /** 記録日時 */
  recordedAt: string;
  /** パフォーマンスレベル */
  performanceLevel: PerformanceLevel;
  /** パフォーマンススコア（0-100） */
  performanceScore?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * パフォーマンス記録作成リクエスト
 */
export interface PerformanceRecordCreateRequest {
  /** 動画ID */
  videoId: string;
  /** プロジェクトID */
  projectId?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 動画タイプ */
  videoType: string;
  /** 公開日時 */
  publishedAt?: string;
  /** 再生数 */
  views?: number;
  /** いいね数 */
  likes?: number;
  /** 低評価数 */
  dislikes?: number;
  /** コメント数 */
  comments?: number;
  /** シェア数 */
  shares?: number;
  /** 獲得登録者数 */
  subscribersGained?: number;
  /** 失った登録者数 */
  subscribersLost?: number;
  /** 視聴時間（分） */
  watchTimeMinutes?: number;
  /** 平均視聴時間（秒） */
  avgViewDurationSeconds?: number;
  /** 平均視聴割合（%） */
  avgViewPercentage?: number;
  /** インプレッション数 */
  impressions?: number;
  /** CTR（%） */
  ctr?: number;
  /** タイトル文字数 */
  titleLength?: number;
  /** タイトルに数字があるか */
  hasNumberInTitle?: boolean;
  /** タイトルに疑問文があるか */
  hasQuestionInTitle?: boolean;
  /** タイトルに絵文字があるか */
  hasEmojiInTitle?: boolean;
  /** 動画の長さ（秒） */
  videoLengthSeconds?: number;
  /** 公開曜日（0-6） */
  publishDayOfWeek?: number;
  /** 公開時間（0-23） */
  publishHour?: number;
  /** タグ */
  tags?: string[];
  /** カテゴリ */
  category?: string;
  /** 追加属性 */
  extraAttributes?: Record<string, unknown>;
}

/**
 * パフォーマンス記録更新リクエスト
 */
export interface PerformanceRecordUpdateRequest {
  /** 再生数 */
  views?: number;
  /** いいね数 */
  likes?: number;
  /** 低評価数 */
  dislikes?: number;
  /** コメント数 */
  comments?: number;
  /** シェア数 */
  shares?: number;
  /** 獲得登録者数 */
  subscribersGained?: number;
  /** 失った登録者数 */
  subscribersLost?: number;
  /** 視聴時間（分） */
  watchTimeMinutes?: number;
  /** 平均視聴時間（秒） */
  avgViewDurationSeconds?: number;
  /** 平均視聴割合（%） */
  avgViewPercentage?: number;
  /** インプレッション数 */
  impressions?: number;
  /** CTR（%） */
  ctr?: number;
}

/**
 * パフォーマンス記録一覧レスポンス
 */
export interface PerformanceRecordListResponse {
  /** 記録一覧 */
  records: PerformanceRecord[];
  /** 総数 */
  total: number;
}

/**
 * 学習インサイト
 */
export interface LearningInsight {
  /** インサイトID */
  id: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** プロジェクトID */
  projectId?: string;
  /** インサイトタイプ */
  insightType: InsightType;
  /** カテゴリ */
  category: LearningCategory;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** エビデンス */
  evidence?: Record<string, unknown>;
  /** 信頼度スコア（0-1） */
  confidenceScore: number;
  /** サンプルサイズ */
  sampleSize: number;
  /** 推奨事項 */
  recommendation?: string;
  /** 期待される影響 */
  expectedImpact?: string;
  /** 有効フラグ */
  isActive: boolean;
  /** 適用済みフラグ */
  isApplied: boolean;
  /** 適用日時 */
  appliedAt?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 学習インサイト一覧レスポンス
 */
export interface LearningInsightListResponse {
  /** インサイト一覧 */
  insights: LearningInsight[];
  /** 総数 */
  total: number;
}

/**
 * 成功パターン
 */
export interface SuccessPattern {
  /** パターンID */
  id: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** パターン名 */
  name: string;
  /** 説明 */
  description?: string;
  /** カテゴリ */
  category: LearningCategory;
  /** パターンデータ */
  patternData: Record<string, unknown>;
  /** 例となる動画ID */
  exampleVideoIds?: string[];
  /** 平均パフォーマンス向上（%） */
  avgPerformanceBoost?: number;
  /** 成功率（%） */
  successRate?: number;
  /** 適用回数 */
  applicationCount: number;
  /** 有効フラグ */
  isActive: boolean;
  /** 優先度 */
  priority: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 成功パターン一覧レスポンス
 */
export interface SuccessPatternListResponse {
  /** パターン一覧 */
  patterns: SuccessPattern[];
  /** 総数 */
  total: number;
}

/**
 * 推奨事項
 */
export interface LearningRecommendation {
  /** 推奨ID */
  id: string;
  /** 動画ID */
  videoId?: string;
  /** プロジェクトID */
  projectId?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 基となるパターンID */
  basedOnPatternId?: string;
  /** 基となるインサイトID */
  basedOnInsightId?: string;
  /** カテゴリ */
  category: LearningCategory;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** アクションアイテム */
  actionItems?: Record<string, unknown>[];
  /** 期待される影響スコア */
  expectedImpactScore?: number;
  /** 期待される指標 */
  expectedMetric?: string;
  /** 期待される改善 */
  expectedImprovement?: string;
  /** 適用済みフラグ */
  isApplied: boolean;
  /** 適用日時 */
  appliedAt?: string;
  /** 結果スコア */
  resultScore?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 推奨事項一覧レスポンス
 */
export interface LearningRecommendationListResponse {
  /** 推奨事項一覧 */
  recommendations: LearningRecommendation[];
  /** 総数 */
  total: number;
}

/**
 * 学習サマリー
 */
export interface LearningSummary {
  /** 総記録数 */
  totalRecords: number;
  /** 総インサイト数 */
  totalInsights: number;
  /** 総パターン数 */
  totalPatterns: number;
  /** 総推奨数 */
  totalRecommendations: number;
  /** 平均パフォーマンススコア */
  avgPerformanceScore?: number;
  /** 最高パフォーマンスカテゴリ */
  topPerformingCategory?: string;
  /** 最も多い成功パターン */
  mostCommonSuccessPattern?: string;
  /** 有効な推奨数 */
  activeRecommendations: number;
}

/**
 * 学習トレンド
 */
export interface LearningTrend {
  /** 日付 */
  date: string;
  /** 平均パフォーマンス */
  avgPerformance: number;
  /** 生成されたインサイト数 */
  insightsGenerated: number;
  /** 発見されたパターン数 */
  patternsDiscovered: number;
}

/**
 * 学習トレンドレスポンス
 */
export interface LearningTrendsResponse {
  /** トレンド一覧 */
  trends: LearningTrend[];
  /** 期間（日数） */
  periodDays: number;
}

/**
 * 学習分析リクエスト
 */
export interface LearningAnalysisRequest {
  /** ナレッジID */
  knowledgeId?: string;
  /** プロジェクトID */
  projectId?: string;
  /** 動画ID一覧 */
  videoIds?: string[];
  /** カテゴリ */
  categories?: LearningCategory[];
  /** 最小サンプルサイズ */
  minSampleSize?: number;
  /** 信頼度閾値 */
  confidenceThreshold?: number;
}

/**
 * 学習分析レスポンス
 */
export interface LearningAnalysisResponse {
  /** 分析ID */
  analysisId: string;
  /** ステータス */
  status: string;
  /** 生成されたインサイト数 */
  insightsGenerated: number;
  /** 発見されたパターン数 */
  patternsDiscovered: number;
  /** 作成された推奨数 */
  recommendationsCreated: number;
  /** 処理時間（秒） */
  processingTimeSeconds: number;
  /** サマリー */
  summary: Record<string, unknown>;
}

/**
 * パフォーマンスレベルの設定情報
 */
export const PERFORMANCE_LEVEL_CONFIG: Record<PerformanceLevel, { label: string; color: string }> = {
  exceptional: { label: '優秀', color: 'green' },
  high: { label: '高い', color: 'blue' },
  average: { label: '平均', color: 'yellow' },
  below_average: { label: '平均以下', color: 'orange' },
  low: { label: '低い', color: 'red' },
};

/**
 * 学習カテゴリの設定情報
 */
export const LEARNING_CATEGORY_CONFIG: Record<LearningCategory, { label: string; icon: string }> = {
  title: { label: 'タイトル', icon: 'type' },
  thumbnail: { label: 'サムネイル', icon: 'image' },
  hook: { label: 'フック', icon: 'target' },
  content_structure: { label: '構成', icon: 'layout' },
  cta: { label: 'CTA', icon: 'mouse-pointer' },
  timing: { label: 'タイミング', icon: 'clock' },
  length: { label: '長さ', icon: 'ruler' },
  tags: { label: 'タグ', icon: 'tag' },
};

// =============================================
// コンテンツDNA用型定義
// =============================================

/**
 * DNA要素タイプ
 */
export type DNAElementType = 'hook' | 'story_arc' | 'persona' | 'visual_style' | 'audio_style' | 'pacing' | 'emotion' | 'value_prop' | 'cta_style' | 'format';

/**
 * DNA強度
 */
export type DNAStrength = 'signature' | 'strong' | 'moderate' | 'weak' | 'absent';

/**
 * テンプレートステータス
 */
export type DNATemplateStatus = 'draft' | 'active' | 'archived';

/**
 * コンテンツDNA
 */
export interface ContentDNA {
  /** DNA ID */
  id: string;
  /** 動画ID */
  videoId?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** DNA名 */
  name?: string;
  /** 説明 */
  description?: string;
  /** フック要素 */
  hookElements?: Record<string, unknown>;
  /** ストーリー構造 */
  storyStructure?: Record<string, unknown>;
  /** ペルソナ特性 */
  personaTraits?: Record<string, unknown>;
  /** ビジュアル要素 */
  visualElements?: Record<string, unknown>;
  /** 音声要素 */
  audioElements?: Record<string, unknown>;
  /** ペースデータ */
  pacingData?: Record<string, unknown>;
  /** 感情曲線 */
  emotionalArc?: Record<string, unknown>;
  /** 価値提案 */
  valuePropositions?: Record<string, unknown>;
  /** CTAパターン */
  ctaPatterns?: Record<string, unknown>;
  /** 総合DNA強度（0-100） */
  overallStrength?: number;
  /** ユニークさスコア（0-100） */
  uniquenessScore?: number;
  /** 一貫性スコア（0-100） */
  consistencyScore?: number;
  /** ソース動画数 */
  sourceVideosCount: number;
  /** 最終分析日時 */
  lastAnalyzedAt?: string;
  /** 分析バージョン */
  analysisVersion?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * コンテンツDNA作成リクエスト
 */
export interface ContentDNACreateRequest {
  /** 動画ID */
  videoId?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** DNA名 */
  name?: string;
  /** 説明 */
  description?: string;
  /** フック要素 */
  hookElements?: Record<string, unknown>;
  /** ストーリー構造 */
  storyStructure?: Record<string, unknown>;
  /** ペルソナ特性 */
  personaTraits?: Record<string, unknown>;
  /** ビジュアル要素 */
  visualElements?: Record<string, unknown>;
  /** 音声要素 */
  audioElements?: Record<string, unknown>;
  /** ペースデータ */
  pacingData?: Record<string, unknown>;
  /** 感情曲線 */
  emotionalArc?: Record<string, unknown>;
  /** 価値提案 */
  valuePropositions?: Record<string, unknown>;
  /** CTAパターン */
  ctaPatterns?: Record<string, unknown>;
}

/**
 * コンテンツDNA更新リクエスト
 */
export interface ContentDNAUpdateRequest {
  /** DNA名 */
  name?: string;
  /** 説明 */
  description?: string;
  /** フック要素 */
  hookElements?: Record<string, unknown>;
  /** ストーリー構造 */
  storyStructure?: Record<string, unknown>;
  /** ペルソナ特性 */
  personaTraits?: Record<string, unknown>;
  /** ビジュアル要素 */
  visualElements?: Record<string, unknown>;
  /** 音声要素 */
  audioElements?: Record<string, unknown>;
  /** ペースデータ */
  pacingData?: Record<string, unknown>;
  /** 感情曲線 */
  emotionalArc?: Record<string, unknown>;
  /** 価値提案 */
  valuePropositions?: Record<string, unknown>;
  /** CTAパターン */
  ctaPatterns?: Record<string, unknown>;
  /** 総合DNA強度 */
  overallStrength?: number;
  /** ユニークさスコア */
  uniquenessScore?: number;
  /** 一貫性スコア */
  consistencyScore?: number;
}

/**
 * コンテンツDNA一覧レスポンス
 */
export interface ContentDNAListResponse {
  /** DNA一覧 */
  dnas: ContentDNA[];
  /** 総数 */
  total: number;
}

/**
 * DNA要素
 */
export interface DNAElement {
  /** 要素ID */
  id: string;
  /** DNA ID */
  contentDnaId: string;
  /** 要素タイプ */
  elementType: DNAElementType;
  /** 要素名 */
  name: string;
  /** 説明 */
  description?: string;
  /** 要素データ */
  data: Record<string, unknown>;
  /** 例 */
  examples?: Record<string, unknown>;
  /** タイムスタンプ（秒） */
  timestamps?: number[];
  /** 強度 */
  strength: DNAStrength;
  /** 強度スコア（0-100） */
  strengthScore?: number;
  /** 視聴維持への影響（%） */
  impactOnRetention?: number;
  /** エンゲージメントへの影響（%） */
  impactOnEngagement?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * DNAテンプレート
 */
export interface DNATemplate {
  /** テンプレートID */
  id: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** テンプレート名 */
  name: string;
  /** 説明 */
  description?: string;
  /** カテゴリ */
  category?: string;
  /** 動画タイプ */
  videoType?: string;
  /** テンプレート構造 */
  structure: Record<string, unknown>;
  /** 必須要素 */
  requiredElements?: string[];
  /** オプション要素 */
  optionalElements?: string[];
  /** ソースDNA ID */
  sourceDnaIds?: string[];
  /** 平均パフォーマンススコア */
  avgPerformanceScore?: number;
  /** ステータス */
  status: DNATemplateStatus;
  /** 使用回数 */
  usageCount: number;
  /** 成功率（%） */
  successRate?: number;
  /** タグ */
  tags?: string[];
  /** 作成者ID */
  createdBy?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * DNAテンプレート一覧レスポンス
 */
export interface DNATemplateListResponse {
  /** テンプレート一覧 */
  templates: DNATemplate[];
  /** 総数 */
  total: number;
}

/**
 * DNA比較リクエスト
 */
export interface DNAComparisonRequest {
  /** ソースDNA ID */
  sourceDnaId: string;
  /** ターゲットDNA ID */
  targetDnaId: string;
}

/**
 * DNA比較レスポンス
 */
export interface DNAComparisonResponse {
  /** 比較ID */
  id: string;
  /** ソースDNA ID */
  sourceDnaId: string;
  /** ターゲットDNA ID */
  targetDnaId: string;
  /** 総合類似度（0-1） */
  overallSimilarity: number;
  /** フック類似度 */
  hookSimilarity?: number;
  /** 構造類似度 */
  structureSimilarity?: number;
  /** スタイル類似度 */
  styleSimilarity?: number;
  /** 比較詳細 */
  comparisonDetails?: Record<string, unknown>;
  /** 共通要素 */
  sharedElements?: string[];
  /** ソース固有要素 */
  uniqueToSource?: string[];
  /** ターゲット固有要素 */
  uniqueToTarget?: string[];
  /** 推奨事項 */
  recommendations?: Record<string, unknown>;
  /** 作成日時 */
  createdAt: string;
}

/**
 * チャンネルDNAプロファイル
 */
export interface ChannelDNAProfile {
  /** プロファイルID */
  id: string;
  /** ナレッジID */
  knowledgeId: string;
  /** チャンネル名 */
  channelName?: string;
  /** ニッチ/カテゴリ */
  niche?: string;
  /** シグネチャー要素 */
  signatureElements?: Record<string, unknown>;
  /** 強み */
  strengths?: string[];
  /** 弱み */
  weaknesses?: string[];
  /** コンテンツスタイル */
  contentStyle?: Record<string, unknown>;
  /** ビジュアルアイデンティティ */
  visualIdentity?: Record<string, unknown>;
  /** ボイスアイデンティティ */
  voiceIdentity?: Record<string, unknown>;
  /** 最高パフォーマンス要素 */
  bestPerformingElements?: Record<string, unknown>;
  /** 低パフォーマンス要素 */
  underperformingElements?: Record<string, unknown>;
  /** 改善機会 */
  improvementOpportunities?: Record<string, unknown>;
  /** 分析動画数 */
  videosAnalyzed: number;
  /** 平均DNA一貫性（%） */
  avgDnaConsistency?: number;
  /** 最終更新日時 */
  lastUpdatedAt?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * DNA抽出リクエスト
 */
export interface DNAExtractionRequest {
  /** 動画ID */
  videoId?: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 動画ID一覧 */
  videoIds?: string[];
  /** トランスクリプト含む */
  includeTranscript?: boolean;
  /** 映像分析含む */
  includeVisualAnalysis?: boolean;
  /** 音声分析含む */
  includeAudioAnalysis?: boolean;
}

/**
 * DNA抽出レスポンス
 */
export interface DNAExtractionResponse {
  /** DNA ID */
  dnaId: string;
  /** ステータス */
  status: string;
  /** 抽出された要素数 */
  elementsExtracted: number;
  /** 処理時間（秒） */
  processingTimeSeconds: number;
  /** サマリー */
  summary: Record<string, unknown>;
}

/**
 * DNAサマリー
 */
export interface DNASummary {
  /** 総DNA数 */
  totalDnas: number;
  /** 総テンプレート数 */
  totalTemplates: number;
  /** 総プロファイル数 */
  totalProfiles: number;
  /** 平均強度スコア */
  avgStrengthScore?: number;
  /** 最も多い要素 */
  mostCommonElements: string[];
  /** 最高パフォーマンスパターン */
  topPerformingPatterns: Record<string, unknown>[];
}

/**
 * DNA要素タイプの設定情報
 */
export const DNA_ELEMENT_TYPE_CONFIG: Record<DNAElementType, { label: string; icon: string; color: string }> = {
  hook: { label: 'フック', icon: 'target', color: 'red' },
  story_arc: { label: 'ストーリー', icon: 'git-branch', color: 'purple' },
  persona: { label: 'ペルソナ', icon: 'user', color: 'blue' },
  visual_style: { label: 'ビジュアル', icon: 'eye', color: 'green' },
  audio_style: { label: '音声', icon: 'volume-2', color: 'orange' },
  pacing: { label: 'ペース', icon: 'trending-up', color: 'yellow' },
  emotion: { label: '感情', icon: 'heart', color: 'pink' },
  value_prop: { label: '価値提案', icon: 'award', color: 'indigo' },
  cta_style: { label: 'CTAスタイル', icon: 'mouse-pointer', color: 'teal' },
  format: { label: 'フォーマット', icon: 'layout', color: 'slate' },
};

/**
 * DNA強度の設定情報
 */
export const DNA_STRENGTH_CONFIG: Record<DNAStrength, { label: string; color: string }> = {
  signature: { label: 'シグネチャー', color: 'purple' },
  strong: { label: '強い', color: 'green' },
  moderate: { label: '中程度', color: 'yellow' },
  weak: { label: '弱い', color: 'orange' },
  absent: { label: '欠如', color: 'red' },
};

// =============================================
// アルゴリズム最適化用型定義
// =============================================

/**
 * A/Bテストステータス
 */
export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

/**
 * A/Bテストタイプ
 */
export type ABTestType = 'thumbnail' | 'title' | 'description';

/**
 * リテンションイベントタイプ
 */
export type RetentionEventType = 'hook' | 'drop' | 'spike' | 'cta' | 'end';

/**
 * 終了画面要素タイプ
 */
export type EndScreenElementType = 'video' | 'playlist' | 'subscribe' | 'link';

/**
 * 終了画面位置
 */
export type EndScreenPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';

/**
 * リテンションデータポイント
 */
export interface RetentionDataPoint {
  /** タイムスタンプ（秒） */
  timestamp: number;
  /** リテンション率（%） */
  retentionRate: number;
}

/**
 * リテンションイベント
 */
export interface RetentionEvent {
  /** イベントID */
  id: string;
  /** リテンション曲線ID */
  retentionCurveId: string;
  /** イベントタイプ */
  eventType: RetentionEventType;
  /** タイムスタンプ（秒） */
  timestampSeconds: number;
  /** タイムスタンプ（%） */
  timestampPercentage?: number;
  /** イベント前のリテンション率 */
  retentionBefore?: number;
  /** イベント後のリテンション率 */
  retentionAfter?: number;
  /** 変化率 */
  changeRate?: number;
  /** タイムスタンプ時点のコンテンツ */
  contentAtTimestamp?: string;
  /** 分析メモ */
  analysisNotes?: string;
  /** 推奨アクション */
  recommendedAction?: string;
  /** 作成日時 */
  createdAt: string;
}

/**
 * リテンション曲線
 */
export interface RetentionCurve {
  /** 曲線ID */
  id: string;
  /** 動画ID */
  videoId: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** データポイント */
  dataPoints: RetentionDataPoint[];
  /** 平均視聴割合（%） */
  avgViewPercentage?: number;
  /** 平均視聴時間（秒） */
  avgViewDurationSeconds?: number;
  /** フックリテンション（%） */
  hookRetention?: number;
  /** 中盤リテンション（%） */
  midRetention?: number;
  /** 終盤リテンション（%） */
  endRetention?: number;
  /** 主要離脱ポイント */
  majorDropPoints?: RetentionDataPoint[];
  /** 復帰ポイント */
  recoveryPoints?: RetentionDataPoint[];
  /** ベンチマーク比較 */
  benchmarkComparison?: number;
  /** カテゴリ内順位 */
  categoryRank?: number;
  /** 動画の長さ（秒） */
  videoLengthSeconds?: number;
  /** サンプルサイズ */
  sampleSize: number;
  /** 記録日時 */
  recordedAt: string;
  /** イベント一覧 */
  events: RetentionEvent[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * リテンション曲線作成リクエスト
 */
export interface RetentionCurveCreateRequest {
  /** 動画ID */
  videoId: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** データポイント */
  dataPoints: RetentionDataPoint[];
  /** 動画の長さ（秒） */
  videoLengthSeconds?: number;
  /** サンプルサイズ */
  sampleSize?: number;
}

/**
 * リテンション分析リクエスト
 */
export interface RetentionAnalysisRequest {
  /** 動画ID */
  videoId: string;
  /** 推奨事項を含める */
  includeRecommendations?: boolean;
}

/**
 * リテンション分析レスポンス
 */
export interface RetentionAnalysisResponse {
  /** リテンション曲線 */
  curve: RetentionCurve;
  /** 離脱ポイント */
  dropPoints: RetentionEvent[];
  /** 推奨事項 */
  recommendations: string[];
  /** 総合スコア */
  overallScore: number;
  /** 平均との比較 */
  comparisonToAverage: number;
}

/**
 * A/Bテストバリアント
 */
export interface ABTestVariant {
  /** バリアントID */
  id: string;
  /** A/BテストID */
  abTestId: string;
  /** バリアント名 */
  variantName: string;
  /** コントロールグループか */
  isControl: boolean;
  /** コンテンツ */
  content?: string;
  /** 画像URL */
  imageUrl?: string;
  /** 画像データ */
  imageData?: Record<string, unknown>;
  /** インプレッション数 */
  impressions: number;
  /** クリック数 */
  clicks: number;
  /** 再生数 */
  views: number;
  /** CTR（%） */
  ctr?: number;
  /** 平均視聴時間 */
  avgViewDuration?: number;
  /** 平均視聴割合（%） */
  avgViewPercentage?: number;
  /** いいね数 */
  likes: number;
  /** コメント数 */
  comments: number;
  /** シェア数 */
  shares: number;
  /** 獲得登録者数 */
  subscribersGained: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * A/Bテストバリアント作成リクエスト
 */
export interface ABTestVariantCreateRequest {
  /** バリアント名 */
  variantName: string;
  /** コントロールグループか */
  isControl?: boolean;
  /** コンテンツ */
  content?: string;
  /** 画像URL */
  imageUrl?: string;
  /** 画像データ */
  imageData?: Record<string, unknown>;
}

/**
 * A/Bテスト
 */
export interface ABTest {
  /** テストID */
  id: string;
  /** 動画ID */
  videoId: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 作成者ID */
  createdBy?: string;
  /** テスト名 */
  name: string;
  /** 説明 */
  description?: string;
  /** テストタイプ */
  testType: ABTestType;
  /** ステータス */
  status: ABTestStatus;
  /** 開始日時 */
  startedAt?: string;
  /** 終了日時 */
  endedAt?: string;
  /** テスト期間（時間） */
  durationHours: number;
  /** トラフィック配分（%） */
  trafficSplit: number;
  /** 最小サンプルサイズ */
  minSampleSize: number;
  /** 信頼度レベル */
  confidenceLevel: number;
  /** 勝者バリアント */
  winnerVariant?: string;
  /** 統計的有意性 */
  statisticalSignificance?: number;
  /** バリアント一覧 */
  variants: ABTestVariant[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * A/Bテスト作成リクエスト
 */
export interface ABTestCreateRequest {
  /** 動画ID */
  videoId: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** テスト名 */
  name: string;
  /** 説明 */
  description?: string;
  /** テストタイプ */
  testType: ABTestType;
  /** テスト期間（時間） */
  durationHours?: number;
  /** トラフィック配分（%） */
  trafficSplit?: number;
  /** 最小サンプルサイズ */
  minSampleSize?: number;
  /** 信頼度レベル */
  confidenceLevel?: number;
  /** バリアント一覧 */
  variants: ABTestVariantCreateRequest[];
}

/**
 * A/Bテスト更新リクエスト
 */
export interface ABTestUpdateRequest {
  /** テスト名 */
  name?: string;
  /** 説明 */
  description?: string;
  /** ステータス */
  status?: ABTestStatus;
  /** テスト期間（時間） */
  durationHours?: number;
  /** トラフィック配分（%） */
  trafficSplit?: number;
}

/**
 * A/Bテスト一覧レスポンス
 */
export interface ABTestListResponse {
  /** テスト一覧 */
  tests: ABTest[];
  /** 総数 */
  total: number;
}

/**
 * A/Bテスト結果レスポンス
 */
export interface ABTestResultResponse {
  /** テスト */
  test: ABTest;
  /** 勝者バリアント */
  winner?: ABTestVariant;
  /** 統計的有意性 */
  statisticalSignificance: number;
  /** 信頼区間 */
  confidenceInterval: Record<string, number>;
  /** 推奨事項 */
  recommendation: string;
}

/**
 * 曜日別パフォーマンス
 */
export interface DayPerformance {
  /** 曜日（0=月, 6=日） */
  day: number;
  /** 平均再生数 */
  avgViews: number;
  /** 平均CTR */
  avgCtr: number;
  /** サンプル数 */
  sampleCount: number;
}

/**
 * 時間別パフォーマンス
 */
export interface HourPerformance {
  /** 時間（0-23） */
  hour: number;
  /** 平均再生数 */
  avgViews: number;
  /** 平均CTR */
  avgCtr: number;
  /** サンプル数 */
  sampleCount: number;
}

/**
 * 推奨投稿スロット
 */
export interface RecommendedSlot {
  /** 曜日 */
  day: number;
  /** 時間 */
  hour: number;
  /** スコア */
  score: number;
  /** 理由 */
  reasoning?: string;
}

/**
 * 最適投稿時間分析
 */
export interface PostingTimeAnalysis {
  /** 分析ID */
  id: string;
  /** ナレッジID */
  knowledgeId: string;
  /** 動画タイプ */
  videoType?: string;
  /** 分析期間（日） */
  analysisPeriodDays: number;
  /** サンプルサイズ */
  sampleSize: number;
  /** 最適曜日 */
  optimalDayOfWeek?: number;
  /** 最適時間 */
  optimalHour?: number;
  /** 最適分 */
  optimalMinute: number;
  /** 曜日別パフォーマンス */
  dayPerformance?: DayPerformance[];
  /** 時間別パフォーマンス */
  hourPerformance?: HourPerformance[];
  /** ヒートマップデータ */
  heatmapData?: number[][];
  /** 推奨スロット */
  recommendedSlots?: RecommendedSlot[];
  /** 競合の投稿時間 */
  competitorPostingTimes?: Record<string, unknown>;
  /** 避けるべき時間 */
  avoidTimes?: Record<string, unknown>[];
  /** 信頼度スコア */
  confidenceScore?: number;
  /** 分析日時 */
  analyzedAt: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 最適投稿時間分析作成リクエスト
 */
export interface PostingTimeAnalysisCreateRequest {
  /** ナレッジID */
  knowledgeId: string;
  /** 動画タイプ */
  videoType?: string;
  /** 分析期間（日） */
  analysisPeriodDays?: number;
}

/**
 * 投稿スケジュール推奨
 */
export interface PostingScheduleRecommendation {
  /** 推奨ID */
  id: string;
  /** 分析ID */
  analysisId: string;
  /** 動画ID */
  videoId?: string;
  /** 推奨日時 */
  recommendedDatetime: string;
  /** 推奨曜日 */
  recommendedDayOfWeek: number;
  /** 推奨時間 */
  recommendedHour: number;
  /** スコア */
  score: number;
  /** 理由 */
  reasoning?: string;
  /** 予測初期再生数 */
  predictedInitialViews?: number;
  /** 予測CTR */
  predictedCtr?: number;
  /** 採用済みフラグ */
  isAccepted: boolean;
  /** 実際の投稿日時 */
  actualPostedAt?: string;
  /** 実際の初期再生数 */
  actualInitialViews?: number;
  /** 実際のCTR */
  actualCtr?: number;
  /** 精度スコア */
  accuracyScore?: number;
  /** 作成日時 */
  createdAt: string;
}

/**
 * 投稿スケジュール推奨作成リクエスト
 */
export interface PostingScheduleRecommendationCreateRequest {
  /** 分析ID */
  analysisId: string;
  /** 動画ID */
  videoId?: string;
  /** 推奨日時 */
  recommendedDatetime: string;
}

/**
 * 終了画面要素
 */
export interface EndScreenElement {
  /** 要素ID */
  id: string;
  /** 終了画面ID */
  endScreenId: string;
  /** 要素タイプ */
  elementType: EndScreenElementType;
  /** 位置 */
  position: EndScreenPosition;
  /** X座標 */
  positionX?: number;
  /** Y座標 */
  positionY?: number;
  /** 幅 */
  width?: number;
  /** 高さ */
  height?: number;
  /** 開始オフセット（秒） */
  startOffsetSeconds: number;
  /** 表示時間（秒） */
  durationSeconds?: number;
  /** ターゲット動画ID */
  targetVideoId?: string;
  /** ターゲット再生リストID */
  targetPlaylistId?: string;
  /** ターゲットURL */
  targetUrl?: string;
  /** カスタムメッセージ */
  customMessage?: string;
  /** 表示テキスト */
  displayText?: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** 表示順 */
  displayOrder: number;
  /** インプレッション数 */
  impressions: number;
  /** クリック数 */
  clicks: number;
  /** CTR */
  clickThroughRate?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 終了画面要素作成リクエスト
 */
export interface EndScreenElementCreateRequest {
  /** 要素タイプ */
  elementType: EndScreenElementType;
  /** 位置 */
  position: EndScreenPosition;
  /** X座標 */
  positionX?: number;
  /** Y座標 */
  positionY?: number;
  /** 幅 */
  width?: number;
  /** 高さ */
  height?: number;
  /** 開始オフセット（秒） */
  startOffsetSeconds?: number;
  /** 表示時間（秒） */
  durationSeconds?: number;
  /** ターゲット動画ID */
  targetVideoId?: string;
  /** ターゲット再生リストID */
  targetPlaylistId?: string;
  /** ターゲットURL */
  targetUrl?: string;
  /** カスタムメッセージ */
  customMessage?: string;
  /** 表示テキスト */
  displayText?: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** 表示順 */
  displayOrder?: number;
}

/**
 * 終了画面
 */
export interface EndScreen {
  /** 終了画面ID */
  id: string;
  /** 動画ID */
  videoId: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 開始時間（秒） */
  startTimeSeconds: number;
  /** 表示時間（秒） */
  durationSeconds: number;
  /** 背景タイプ */
  backgroundType: string;
  /** 背景色 */
  backgroundColor?: string;
  /** 背景画像URL */
  backgroundImageUrl?: string;
  /** 総クリック数 */
  totalClicks: number;
  /** CTR */
  clickThroughRate?: number;
  /** 有効フラグ */
  isActive: boolean;
  /** 公開済みフラグ */
  isPublished: boolean;
  /** 要素一覧 */
  elements: EndScreenElement[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 終了画面作成リクエスト
 */
export interface EndScreenCreateRequest {
  /** 動画ID */
  videoId: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 開始時間（秒） */
  startTimeSeconds: number;
  /** 表示時間（秒） */
  durationSeconds?: number;
  /** 背景タイプ */
  backgroundType?: string;
  /** 背景色 */
  backgroundColor?: string;
  /** 背景画像URL */
  backgroundImageUrl?: string;
  /** 要素一覧 */
  elements?: EndScreenElementCreateRequest[];
}

/**
 * 終了画面更新リクエスト
 */
export interface EndScreenUpdateRequest {
  /** 開始時間（秒） */
  startTimeSeconds?: number;
  /** 表示時間（秒） */
  durationSeconds?: number;
  /** 背景タイプ */
  backgroundType?: string;
  /** 背景色 */
  backgroundColor?: string;
  /** 背景画像URL */
  backgroundImageUrl?: string;
  /** 有効フラグ */
  isActive?: boolean;
}

/**
 * 終了画面テンプレート
 */
export interface EndScreenTemplate {
  /** テンプレートID */
  id: string;
  /** ナレッジID */
  knowledgeId?: string;
  /** 作成者ID */
  createdBy?: string;
  /** テンプレート名 */
  name: string;
  /** 説明 */
  description?: string;
  /** 動画タイプ */
  videoType?: string;
  /** レイアウト */
  layout: Record<string, unknown>;
  /** 要素設定 */
  elementConfigs?: Record<string, unknown>[];
  /** 平均CTR */
  avgClickThroughRate?: number;
  /** 使用回数 */
  usageCount: number;
  /** デフォルトフラグ */
  isDefault: boolean;
  /** 有効フラグ */
  isActive: boolean;
  /** タグ */
  tags?: string[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 終了画面テンプレート作成リクエスト
 */
export interface EndScreenTemplateCreateRequest {
  /** ナレッジID */
  knowledgeId?: string;
  /** テンプレート名 */
  name: string;
  /** 説明 */
  description?: string;
  /** 動画タイプ */
  videoType?: string;
  /** レイアウト */
  layout: Record<string, unknown>;
  /** 要素設定 */
  elementConfigs?: Record<string, unknown>[];
  /** タグ */
  tags?: string[];
}

/**
 * 終了画面テンプレート更新リクエスト
 */
export interface EndScreenTemplateUpdateRequest {
  /** テンプレート名 */
  name?: string;
  /** 説明 */
  description?: string;
  /** レイアウト */
  layout?: Record<string, unknown>;
  /** 要素設定 */
  elementConfigs?: Record<string, unknown>[];
  /** デフォルトフラグ */
  isDefault?: boolean;
  /** 有効フラグ */
  isActive?: boolean;
  /** タグ */
  tags?: string[];
}

/**
 * 終了画面テンプレート一覧レスポンス
 */
export interface EndScreenTemplateListResponse {
  /** テンプレート一覧 */
  templates: EndScreenTemplate[];
  /** 総数 */
  total: number;
}

/**
 * 最適化サマリー
 */
export interface OptimizationSummary {
  /** 総A/Bテスト数 */
  totalAbTests: number;
  /** 実行中のA/Bテスト数 */
  activeAbTests: number;
  /** 完了したA/Bテスト数 */
  completedAbTests: number;
  /** 平均CTR改善（%） */
  avgCtrImprovement?: number;
  /** 総終了画面数 */
  totalEndScreens: number;
  /** 平均終了画面CTR */
  avgEndScreenCtr?: number;
  /** 投稿時間分析数 */
  postingTimeAnalyses: number;
  /** 平均投稿精度 */
  avgPostingAccuracy?: number;
}

/**
 * A/Bテストステータスの設定情報
 */
export const AB_TEST_STATUS_CONFIG: Record<ABTestStatus, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'slate' },
  running: { label: '実行中', color: 'blue' },
  paused: { label: '一時停止', color: 'yellow' },
  completed: { label: '完了', color: 'green' },
  cancelled: { label: 'キャンセル', color: 'red' },
};

/**
 * A/Bテストタイプの設定情報
 */
export const AB_TEST_TYPE_CONFIG: Record<ABTestType, { label: string; icon: string }> = {
  thumbnail: { label: 'サムネイル', icon: 'image' },
  title: { label: 'タイトル', icon: 'type' },
  description: { label: '説明', icon: 'file-text' },
};

/**
 * リテンションイベントタイプの設定情報
 */
export const RETENTION_EVENT_TYPE_CONFIG: Record<RetentionEventType, { label: string; color: string; icon: string }> = {
  hook: { label: 'フック', color: 'green', icon: 'zap' },
  drop: { label: '離脱', color: 'red', icon: 'trending-down' },
  spike: { label: '急上昇', color: 'blue', icon: 'trending-up' },
  cta: { label: 'CTA', color: 'purple', icon: 'mouse-pointer' },
  end: { label: '終了', color: 'slate', icon: 'check' },
};

/**
 * 終了画面要素タイプの設定情報
 */
export const END_SCREEN_ELEMENT_TYPE_CONFIG: Record<EndScreenElementType, { label: string; icon: string }> = {
  video: { label: '動画', icon: 'play' },
  playlist: { label: '再生リスト', icon: 'list' },
  subscribe: { label: '登録', icon: 'bell' },
  link: { label: 'リンク', icon: 'external-link' },
};

/**
 * 終了画面位置の設定情報
 */
export const END_SCREEN_POSITION_CONFIG: Record<EndScreenPosition, { label: string }> = {
  top_left: { label: '左上' },
  top_right: { label: '右上' },
  bottom_left: { label: '左下' },
  bottom_right: { label: '右下' },
  center: { label: '中央' },
};

/**
 * 曜日ラベル
 */
export const DAY_OF_WEEK_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

// =============================================
// Phase 5: Agent / Automation Types
// =============================================

/**
 * エージェントタイプ
 */
export type AgentType =
  | 'trend_monitor'
  | 'competitor_analyzer'
  | 'comment_responder'
  | 'content_scheduler'
  | 'performance_tracker'
  | 'qa_checker'
  | 'keyword_researcher';

/**
 * エージェントステータス
 */
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'disabled';

/**
 * エージェントタスクステータス
 */
export type AgentTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * タスク優先度
 */
export type AgentTaskPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * スケジュール頻度
 */
export type ScheduleFrequency = 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * コメント感情タイプ（エージェント用）
 */
export type CommentSentimentType = 'positive' | 'neutral' | 'negative' | 'question';

/**
 * 返信ステータス
 */
export type ReplyStatus = 'pending' | 'approved' | 'sent' | 'failed' | 'skipped';

/**
 * エージェント
 */
export interface Agent {
  id: string;
  knowledgeId?: string;
  name: string;
  description?: string;
  agentType: AgentType;
  status: AgentStatus;
  config?: Record<string, unknown>;
  isEnabled: boolean;
  autoExecute: boolean;
  maxConcurrentTasks: number;
  retryCount: number;
  timeoutSeconds: number;
  totalTasksRun: number;
  successfulTasks: number;
  failedTasks: number;
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * エージェント作成リクエスト
 */
export interface AgentCreateRequest {
  name: string;
  description?: string;
  agentType: AgentType;
  knowledgeId?: string;
  config?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  isEnabled?: boolean;
  autoExecute?: boolean;
  maxConcurrentTasks?: number;
  retryCount?: number;
  timeoutSeconds?: number;
}

/**
 * エージェント更新リクエスト
 */
export interface AgentUpdateRequest {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  isEnabled?: boolean;
  autoExecute?: boolean;
  maxConcurrentTasks?: number;
  retryCount?: number;
  timeoutSeconds?: number;
}

/**
 * エージェント一覧レスポンス
 */
export interface AgentListResponse {
  agents: Agent[];
  total: number;
}

/**
 * エージェントタスク
 */
export interface AgentTask {
  id: string;
  agentId: string;
  scheduleId?: string;
  name: string;
  description?: string;
  taskType?: string;
  priority: AgentTaskPriority;
  status: AgentTaskStatus;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  retryCount: number;
  maxRetries: number;
  progressPercent?: number;
  progressMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * エージェントタスク作成リクエスト
 */
export interface AgentTaskCreateRequest {
  agentId: string;
  scheduleId?: string;
  name: string;
  description?: string;
  taskType?: string;
  priority?: AgentTaskPriority;
  inputData?: Record<string, unknown>;
  maxRetries?: number;
}

/**
 * エージェントタスク一覧レスポンス
 */
export interface AgentTaskListResponse {
  tasks: AgentTask[];
  total: number;
}

/**
 * エージェントスケジュール
 */
export interface AgentSchedule {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  hour?: number;
  minute: number;
  dayOfWeek?: number[];
  dayOfMonth?: number;
  timezone: string;
  taskConfig?: Record<string, unknown>;
  isActive: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * エージェントスケジュール作成リクエスト
 */
export interface AgentScheduleCreateRequest {
  agentId: string;
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  hour?: number;
  minute?: number;
  dayOfWeek?: number[];
  dayOfMonth?: number;
  timezone?: string;
  taskConfig?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * エージェントスケジュール更新リクエスト
 */
export interface AgentScheduleUpdateRequest {
  name?: string;
  description?: string;
  frequency?: ScheduleFrequency;
  cronExpression?: string;
  hour?: number;
  minute?: number;
  dayOfWeek?: number[];
  dayOfMonth?: number;
  timezone?: string;
  taskConfig?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * エージェントスケジュール一覧レスポンス
 */
export interface AgentScheduleListResponse {
  schedules: AgentSchedule[];
  total: number;
}

/**
 * コメントテンプレート
 */
export interface CommentTemplate {
  id: string;
  knowledgeId?: string;
  name: string;
  description?: string;
  category?: string;
  targetSentiment?: CommentSentimentType;
  targetKeywords?: string[];
  excludeKeywords?: string[];
  minLikes?: number;
  templateText: string;
  variations?: string[];
  useAiGeneration: boolean;
  aiPrompt?: string;
  aiStyle?: string;
  usageCount: number;
  successRate?: number;
  avgEngagement?: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * コメントテンプレート作成リクエスト
 */
export interface CommentTemplateCreateRequest {
  knowledgeId?: string;
  name: string;
  description?: string;
  category?: string;
  targetSentiment?: CommentSentimentType;
  targetKeywords?: string[];
  excludeKeywords?: string[];
  minLikes?: number;
  templateText: string;
  variations?: string[];
  useAiGeneration?: boolean;
  aiPrompt?: string;
  aiStyle?: string;
  isActive?: boolean;
  priority?: number;
}

/**
 * コメントテンプレート更新リクエスト
 */
export interface CommentTemplateUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  targetSentiment?: CommentSentimentType;
  targetKeywords?: string[];
  excludeKeywords?: string[];
  minLikes?: number;
  templateText?: string;
  variations?: string[];
  useAiGeneration?: boolean;
  aiPrompt?: string;
  aiStyle?: string;
  isActive?: boolean;
  priority?: number;
}

/**
 * コメントテンプレート一覧レスポンス
 */
export interface CommentTemplateListResponse {
  templates: CommentTemplate[];
  total: number;
}

/**
 * コメントキュー
 */
export interface CommentQueueItem {
  id: string;
  videoId: string;
  templateId?: string;
  youtubeCommentId: string;
  authorName?: string;
  authorChannelId?: string;
  commentText: string;
  commentLikes: number;
  commentPublishedAt?: string;
  sentiment?: CommentSentimentType;
  detectedKeywords?: string[];
  sentimentScore?: number;
  isQuestion: boolean;
  replyText?: string;
  replyGeneratedBy?: string;
  status: ReplyStatus;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  youtubeReplyId?: string;
  errorMessage?: string;
  replyLikes?: number;
  engagementChange?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * コメントキュー一覧レスポンス
 */
export interface CommentQueueListResponse {
  comments: CommentQueueItem[];
  total: number;
}

/**
 * コメント承認リクエスト
 */
export interface CommentApprovalRequest {
  approved: boolean;
  modifiedReply?: string;
}

/**
 * コメント分析結果
 */
export interface CommentAnalysisResult {
  sentiment: CommentSentimentType;
  sentimentScore: number;
  isQuestion: boolean;
  detectedKeywords: string[];
  suggestedTemplateId?: string;
  generatedReply?: string;
}

/**
 * エージェントログ
 */
export interface AgentLog {
  id: string;
  agentId: string;
  taskId?: string;
  level: string;
  message: string;
  details?: Record<string, unknown>;
  source?: string;
  action?: string;
  createdAt: string;
}

/**
 * エージェントログ一覧レスポンス
 */
export interface AgentLogListResponse {
  logs: AgentLog[];
  total: number;
}

/**
 * トレンドアラート
 */
export interface TrendAlert {
  id: string;
  agentId?: string;
  knowledgeId?: string;
  title: string;
  description?: string;
  alertType: string;
  source?: string;
  sourceUrl?: string;
  keyword?: string;
  trendScore?: number;
  growthRate?: number;
  relatedData?: Record<string, unknown>;
  suggestedActions?: Record<string, unknown>;
  isRead: boolean;
  isActioned: boolean;
  actionedAt?: string;
  actionTaken?: string;
  expiresAt?: string;
  detectedAt: string;
  createdAt: string;
}

/**
 * トレンドアラート更新リクエスト
 */
export interface TrendAlertUpdateRequest {
  isRead?: boolean;
  isActioned?: boolean;
  actionTaken?: string;
}

/**
 * トレンドアラート一覧レスポンス
 */
export interface TrendAlertListResponse {
  alerts: TrendAlert[];
  total: number;
}

/**
 * 競合アラート
 */
export interface CompetitorAlert {
  id: string;
  agentId?: string;
  knowledgeId?: string;
  title: string;
  description?: string;
  alertType: string;
  competitorChannelId?: string;
  competitorChannelName?: string;
  competitorVideoId?: string;
  competitorVideoTitle?: string;
  competitorVideoUrl?: string;
  analysis?: Record<string, unknown>;
  performanceMetrics?: Record<string, unknown>;
  suggestedResponse?: Record<string, unknown>;
  isRead: boolean;
  isActioned: boolean;
  actionedAt?: string;
  actionTaken?: string;
  detectedAt: string;
  createdAt: string;
}

/**
 * 競合アラート更新リクエスト
 */
export interface CompetitorAlertUpdateRequest {
  isRead?: boolean;
  isActioned?: boolean;
  actionTaken?: string;
}

/**
 * 競合アラート一覧レスポンス
 */
export interface CompetitorAlertListResponse {
  alerts: CompetitorAlert[];
  total: number;
}

/**
 * エージェントサマリー
 */
export interface AgentSummary {
  totalAgents: number;
  activeAgents: number;
  runningAgents: number;
  totalTasksToday: number;
  successfulTasksToday: number;
  failedTasksToday: number;
  pendingComments: number;
  unreadTrendAlerts: number;
  unreadCompetitorAlerts: number;
}

/**
 * エージェントダッシュボード
 */
export interface AgentDashboard {
  summary: AgentSummary;
  recentAgents: Agent[];
  recentTasks: AgentTask[];
  recentTrendAlerts: TrendAlert[];
  recentCompetitorAlerts: CompetitorAlert[];
  pendingComments: CommentQueueItem[];
}

/**
 * エージェントタイプ設定
 */
export const AGENT_TYPE_CONFIG: Record<AgentType, { label: string; description: string; icon: string }> = {
  trend_monitor: { label: 'トレンド監視', description: 'トレンドキーワードを監視', icon: 'trending-up' },
  competitor_analyzer: { label: '競合分析', description: '競合チャンネルを分析', icon: 'eye' },
  comment_responder: { label: 'コメント返信', description: 'コメントに自動返信', icon: 'message-circle' },
  content_scheduler: { label: 'コンテンツスケジューラー', description: 'コンテンツ公開をスケジュール', icon: 'calendar' },
  performance_tracker: { label: 'パフォーマンス追跡', description: '動画パフォーマンスを追跡', icon: 'bar-chart-2' },
  qa_checker: { label: 'QAチェッカー', description: 'コンテンツ品質をチェック', icon: 'check-circle' },
  keyword_researcher: { label: 'キーワードリサーチ', description: 'キーワードを調査', icon: 'search' },
};

/**
 * エージェントステータス設定
 */
export const AGENT_STATUS_CONFIG: Record<AgentStatus, { label: string; color: string }> = {
  idle: { label: '待機中', color: 'slate' },
  running: { label: '実行中', color: 'blue' },
  paused: { label: '一時停止', color: 'yellow' },
  error: { label: 'エラー', color: 'red' },
  disabled: { label: '無効', color: 'gray' },
};

/**
 * エージェントタスクステータス設定
 */
export const AGENT_TASK_STATUS_CONFIG: Record<AgentTaskStatus, { label: string; color: string }> = {
  pending: { label: '保留', color: 'slate' },
  running: { label: '実行中', color: 'blue' },
  completed: { label: '完了', color: 'green' },
  failed: { label: '失敗', color: 'red' },
  cancelled: { label: 'キャンセル', color: 'gray' },
};

/**
 * タスク優先度設定
 */
export const AGENT_TASK_PRIORITY_CONFIG: Record<AgentTaskPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'slate' },
  normal: { label: '通常', color: 'blue' },
  high: { label: '高', color: 'orange' },
  urgent: { label: '緊急', color: 'red' },
};

/**
 * スケジュール頻度設定
 */
export const SCHEDULE_FREQUENCY_CONFIG: Record<ScheduleFrequency, { label: string }> = {
  once: { label: '1回のみ' },
  hourly: { label: '毎時' },
  daily: { label: '毎日' },
  weekly: { label: '毎週' },
  monthly: { label: '毎月' },
  custom: { label: 'カスタム' },
};

/**
 * コメント感情設定
 */
export const COMMENT_SENTIMENT_CONFIG: Record<CommentSentimentType, { label: string; color: string; icon: string }> = {
  positive: { label: 'ポジティブ', color: 'green', icon: 'smile' },
  neutral: { label: 'ニュートラル', color: 'slate', icon: 'meh' },
  negative: { label: 'ネガティブ', color: 'red', icon: 'frown' },
  question: { label: '質問', color: 'blue', icon: 'help-circle' },
};

/**
 * 返信ステータス設定
 */
export const REPLY_STATUS_CONFIG: Record<ReplyStatus, { label: string; color: string }> = {
  pending: { label: '保留', color: 'slate' },
  approved: { label: '承認済み', color: 'blue' },
  sent: { label: '送信済み', color: 'green' },
  failed: { label: '失敗', color: 'red' },
  skipped: { label: 'スキップ', color: 'gray' },
};
