/**
 * Analytics Knowledge Service
 *
 * ナレッジ、シリーズ、テンプレート、収益データの管理機能
 */
import { api } from '../api';
import {
  RevenueData,
  MonthlyRevenue,
  Series,
  KnowledgeItem,
  Template,
  ApiRevenueData,
  ApiMonthlyRevenue,
  ApiSeries,
  ApiKnowledgeItem,
  ApiTemplate,
  RevenueListResponse,
  MonthlyRevenueResponse,
  SeriesListResponse,
  KnowledgeListResponse,
  TemplateListResponse,
  mapRevenueData,
  mapSeries,
  mapKnowledgeItem,
  mapTemplate,
} from './types';

// ============================================================
// モックデータ（API接続エラー時のフォールバック）
// ============================================================

const mockRevenueData: RevenueData[] = [
  { id: 'rev-1', source: 'youtube', label: 'YouTube広告収益', amount: 125000, date: '2024-12', createdAt: new Date().toISOString() },
  { id: 'rev-2', source: 'sponsorship', label: 'スポンサー案件A', amount: 300000, date: '2024-12', createdAt: new Date().toISOString() },
  { id: 'rev-3', source: 'affiliate', label: 'アフィリエイト', amount: 45000, date: '2024-12', createdAt: new Date().toISOString() },
  { id: 'rev-4', source: 'course', label: 'オンライン講座', amount: 180000, date: '2024-12', createdAt: new Date().toISOString() },
];

const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: '2024-07', amount: 450000 },
  { month: '2024-08', amount: 520000 },
  { month: '2024-09', amount: 480000 },
  { month: '2024-10', amount: 610000 },
  { month: '2024-11', amount: 580000 },
  { month: '2024-12', amount: 650000 },
];

const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: 'know-1',
    type: 'success',
    title: '冒頭15秒で視聴維持率が決まる',
    content: 'フックを最初の15秒に入れることで、視聴維持率が平均20%向上しました。',
    source: '動画分析レポート',
    impactScore: 95,
    tags: ['視聴維持', 'フック', '冒頭'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'know-2',
    type: 'insight',
    title: 'サムネイルの顔出しで CTR 向上',
    content: '人物の顔をサムネイルに入れるとCTRが1.5倍になる傾向があります。',
    source: 'A/Bテスト結果',
    impactScore: 85,
    tags: ['サムネイル', 'CTR', '顔出し'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'know-3',
    type: 'pattern',
    title: '週2回投稿がベストペース',
    content: '週2回の投稿頻度が視聴者の期待感と負担のバランスが最適です。',
    source: 'チャンネル分析',
    impactScore: 75,
    tags: ['投稿頻度', '戦略'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTemplates: Template[] = [
  {
    id: 'tmpl-1',
    type: 'script',
    name: '解説動画テンプレート',
    description: '教育系解説動画の基本構成テンプレート',
    usageCount: 24,
    rating: 4.8,
    tags: ['解説', '教育'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-2',
    type: 'thumbnail',
    name: 'インパクトサムネイル',
    description: '高CTRを狙う強調デザインテンプレート',
    usageCount: 18,
    rating: 4.5,
    tags: ['サムネイル', 'CTR'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-3',
    type: 'description',
    name: 'SEO最適化説明文',
    description: '検索上位表示を狙う説明文テンプレート',
    usageCount: 32,
    rating: 4.6,
    tags: ['SEO', '説明文'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-4',
    type: 'voice',
    name: 'ナレーション設定A',
    description: '落ち着いたトーンの解説向け音声設定',
    usageCount: 15,
    rating: 4.3,
    tags: ['音声', 'ナレーション'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockSeries: Series[] = [
  {
    id: 'series-1',
    name: 'AIツール徹底解説シリーズ',
    description: '最新AIツールを分かりやすく解説',
    videoCount: 12,
    totalViews: 450000,
    avgRetention: 65,
    status: 'active',
    lastVideoAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'series-2',
    name: 'プログラミング入門講座',
    description: '初心者向けプログラミング基礎',
    videoCount: 8,
    totalViews: 280000,
    avgRetention: 58,
    status: 'active',
    lastVideoAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'series-3',
    name: '業界ニュース週刊まとめ',
    description: '毎週のテック業界ニュースを解説',
    videoCount: 20,
    totalViews: 180000,
    avgRetention: 52,
    status: 'paused',
    lastVideoAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================
// API関数
// ============================================================

/**
 * 収益データ取得
 */
export async function getRevenues(dateFrom?: string, dateTo?: string): Promise<RevenueListResponse> {
  try {
    const response = await api.get<{ revenues: ApiRevenueData[]; total: number }>(
      '/api/v1/analytics/revenue',
      { params: { date_from: dateFrom, date_to: dateTo } }
    );
    return {
      revenues: response.revenues.map(mapRevenueData),
      total: response.total,
    };
  } catch {
    console.info('[analyticsService] Using mock data for revenues');
    return {
      revenues: mockRevenueData,
      total: mockRevenueData.length,
    };
  }
}

/**
 * 月別収益データ取得
 */
export async function getMonthlyRevenue(year?: number): Promise<MonthlyRevenueResponse> {
  try {
    const response = await api.get<{ data: ApiMonthlyRevenue[] }>(
      '/api/v1/analytics/revenue/monthly',
      { params: { year } }
    );
    return {
      data: response.data,
    };
  } catch {
    console.info('[analyticsService] Using mock data for monthly revenue');
    return {
      data: mockMonthlyRevenue,
    };
  }
}

/**
 * シリーズ一覧取得
 */
export async function getSeries(status?: Series['status']): Promise<SeriesListResponse> {
  try {
    const response = await api.get<{ series: ApiSeries[]; total: number }>(
      '/api/v1/analytics/series',
      { params: { status } }
    );
    return {
      series: response.series.map(mapSeries),
      total: response.total,
    };
  } catch {
    console.info('[analyticsService] Using mock data for series');
    const filtered = status ? mockSeries.filter(s => s.status === status) : mockSeries;
    return {
      series: filtered,
      total: filtered.length,
    };
  }
}

/**
 * ナレッジ一覧取得
 */
export async function getKnowledge(type?: KnowledgeItem['type']): Promise<KnowledgeListResponse> {
  try {
    const response = await api.get<{ items: ApiKnowledgeItem[]; total: number }>(
      '/api/v1/analytics/knowledge',
      { params: { type } }
    );
    return {
      items: response.items.map(mapKnowledgeItem),
      total: response.total,
    };
  } catch {
    console.info('[analyticsService] Using mock data for knowledge');
    const filtered = type ? mockKnowledgeItems.filter(k => k.type === type) : mockKnowledgeItems;
    return {
      items: filtered,
      total: filtered.length,
    };
  }
}

/**
 * テンプレート一覧取得
 */
export async function getTemplates(type?: Template['type']): Promise<TemplateListResponse> {
  try {
    const response = await api.get<{ templates: ApiTemplate[]; total: number }>(
      '/api/v1/analytics/templates',
      { params: { type } }
    );
    return {
      templates: response.templates.map(mapTemplate),
      total: response.total,
    };
  } catch {
    console.info('[analyticsService] Using mock data for templates');
    const filtered = type ? mockTemplates.filter(t => t.type === type) : mockTemplates;
    return {
      templates: filtered,
      total: filtered.length,
    };
  }
}
