import {
  LayoutDashboard,
  Search,
  Lightbulb,
  FileText,
  Video,
  Send,
  BarChart2,
  Users,
  Bot,
} from 'lucide-react';
import type { PageDefinition } from '../types';

export const PAGES: PageDefinition[] = [
  {
    id: 'dashboard',
    name: 'ダッシュボード',
    path: '/dashboard',
    description: '制作状況の全体像',
    tabs: [
      { id: 'summary', label: '進捗サマリー' },
      { id: 'tasks', label: '今日のタスク' },
      { id: 'notifications', label: '通知' },
    ],
  },
  {
    id: 'research',
    name: 'リサーチ',
    path: '/research',
    description: 'トレンドと競合の分析',
    tabs: [
      { id: 'competitor', label: '競合リサーチ' },
      { id: 'trend', label: 'トレンド分析' },
      { id: 'comments', label: 'コメント分析' },
    ],
  },
  {
    id: 'planning',
    name: '企画',
    path: '/planning',
    description: 'アイデアを形にする',
    tabs: [
      { id: 'calendar', label: 'コンテンツカレンダー' },
      { id: 'list', label: '企画一覧' },
      { id: 'ai', label: 'AI提案' },
    ],
  },
  {
    id: 'script',
    name: '台本・メタデータ',
    path: '/script',
    description: 'AIと共創する',
    tabs: [
      { id: 'script', label: '台本作成' },
      { id: 'title', label: 'タイトル選定' },
      { id: 'thumbnail', label: 'サムネイル' },
      { id: 'seo', label: 'SEO設定' },
    ],
  },
  {
    id: 'production',
    name: '動画制作',
    path: '/production',
    description: '素材生成と編集',
    tabs: [
      { id: 'voice', label: '音声生成' },
      { id: 'avatar', label: 'アバター生成' },
      { id: 'edit', label: '編集' },
      { id: 'quality', label: '品質向上' },
    ],
  },
  {
    id: 'publish',
    name: '公開・配信',
    path: '/publish',
    description: '世界へ届ける',
    tabs: [
      { id: 'scheduler', label: '投稿スケジューラー' },
      { id: 'multi', label: 'マルチPF展開' },
      { id: 'engagement', label: 'ショート連携' },
    ],
  },
  {
    id: 'analytics',
    name: '分析・ナレッジ',
    path: '/analytics',
    description: '成長の軌跡',
    tabs: [
      { id: 'performance', label: 'パフォーマンス' },
      { id: 'revenue', label: '収益管理' },
      { id: 'brand-knowledge', label: 'ブランドナレッジ' },
      { id: 'knowledge', label: 'ナレッジ・成功事例' },
      { id: 'template', label: 'テンプレート' },
      { id: 'series', label: 'シリーズ分析' },
      { id: 'series-detail', label: 'シリーズ管理' },
      { id: 'compound-strategy', label: 'コンテンツ複利' },
    ],
  },
  {
    id: 'agent',
    name: 'エージェント',
    path: '/agent',
    description: 'AI自動化エージェント',
    tabs: [
      { id: 'dashboard', label: 'ダッシュボード' },
      { id: 'agents', label: 'エージェント一覧' },
      { id: 'comments', label: 'コメント管理' },
      { id: 'alerts', label: 'アラート' },
      { id: 'logs', label: '実行履歴' },
    ],
    requiredRoles: ['owner', 'team'],
  },
  {
    id: 'admin',
    name: '管理',
    path: '/admin',
    description: 'チームと設定',
    tabs: [
      { id: 'team', label: 'チーム管理' },
      { id: 'approval', label: '承認ワークフロー' },
      { id: 'client', label: 'クライアントポータル' },
      { id: 'knowledge', label: 'ナレッジ作成' },
      { id: 'cta', label: 'CTA管理' },
      { id: 'settings', label: 'システム設定' },
      { id: 'api-connections', label: 'API連携' },
      { id: 'audit-log', label: '監査ログ' },
    ],
    requiredRoles: ['owner', 'team'],
  },
];

// ページIDからアイコンを取得するマップ
export const PAGE_ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  research: <Search size={20} />,
  planning: <Lightbulb size={20} />,
  script: <FileText size={20} />,
  production: <Video size={20} />,
  publish: <Send size={20} />,
  analytics: <BarChart2 size={20} />,
  agent: <Bot size={20} />,
  admin: <Users size={20} />,
};

// ページを取得するヘルパー関数
export const getPageById = (id: string): PageDefinition | undefined => {
  return PAGES.find((page) => page.id === id);
};

export const getPageByPath = (path: string): PageDefinition | undefined => {
  return PAGES.find((page) => page.path === path);
};
