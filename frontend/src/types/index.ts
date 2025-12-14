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
