import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Network,
  Link as LinkIcon,
  TrendingUp,
  Layers,
  ChevronRight,
  Loader2,
  AlertCircle,
  Eye,
  Play,
  Clock,
  MousePointerClick,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { toast } from '../../../components/common';

interface Node {
  id: string;
  title: string;
  views: number;
  watch_time: number;
  inbound_count: number;
  outbound_count: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  clicks: number;
  conversion_rate: number;
}

interface NetworkAnalysis {
  nodes: Node[];
  edges: Edge[];
  stats: {
    total_videos: number;
    total_links: number;
    total_clicks: number;
    avg_conversion_rate: number;
  };
}

interface LinkSuggestion {
  video_id: string;
  title: string;
  views: number;
  retention: number;
  engagement_rate: number;
  score: number;
  reason: string;
}

interface CompoundEffect {
  total_referral_views: number;
  total_referral_watch_time: number;
  total_outbound_clicks: number;
  avg_compound_score: number;
  trend: Array<{
    date: string;
    referral_views: number;
    compound_score: number;
  }>;
}

export const CompoundStrategyTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [selectedKnowledgeId] = useState<string>('mock-knowledge-id');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // Network analysis query
  const {
    data: networkData,
    isLoading: isNetworkLoading,
    error: networkError,
  } = useQuery<NetworkAnalysis>({
    queryKey: ['compound', 'network', selectedKnowledgeId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return {
        nodes: [
          { id: '1', title: 'ショート動画1', views: 50000, watch_time: 2.5, inbound_count: 0, outbound_count: 3 },
          { id: '2', title: '長尺動画1', views: 30000, watch_time: 10.2, inbound_count: 2, outbound_count: 1 },
          { id: '3', title: 'ショート動画2', views: 45000, watch_time: 2.3, inbound_count: 1, outbound_count: 2 },
        ],
        edges: [
          { source: '1', target: '2', type: 'end_screen', clicks: 500, conversion_rate: 1.0 },
          { source: '1', target: '3', type: 'description', clicks: 300, conversion_rate: 0.6 },
          { source: '2', target: '3', type: 'card', clicks: 200, conversion_rate: 0.67 },
        ],
        stats: {
          total_videos: 3,
          total_links: 3,
          total_clicks: 1000,
          avg_conversion_rate: 0.76,
        },
      };
    },
    enabled: !!selectedKnowledgeId,
  });

  // Link suggestions query
  const {
    data: suggestionsData,
    isLoading: isSuggestionsLoading,
  } = useQuery<LinkSuggestion[]>({
    queryKey: ['compound', 'suggestions', selectedVideoId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return [
        { video_id: '4', title: '関連動画A', views: 40000, retention: 65, engagement_rate: 5.2, score: 85, reason: '高再生数、高維持率' },
        { video_id: '5', title: '関連動画B', views: 35000, retention: 60, engagement_rate: 4.8, score: 78, reason: '高再生数' },
        { video_id: '6', title: '関連動画C', views: 30000, retention: 68, engagement_rate: 6.1, score: 75, reason: '高維持率、高エンゲージメント' },
      ];
    },
    enabled: !!selectedVideoId,
  });

  // Compound effect query
  const {
    data: effectData,
    isLoading: _isEffectLoading,
  } = useQuery<CompoundEffect>({
    queryKey: ['compound', 'effect', selectedVideoId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return {
        total_referral_views: 8500,
        total_referral_watch_time: 425.5,
        total_outbound_clicks: 1200,
        avg_compound_score: 72.5,
        trend: [
          { date: '2025-12-11', referral_views: 250, compound_score: 68 },
          { date: '2025-12-12', referral_views: 280, compound_score: 70 },
          { date: '2025-12-13', referral_views: 300, compound_score: 72 },
          { date: '2025-12-14', referral_views: 320, compound_score: 75 },
        ],
      };
    },
    enabled: !!selectedVideoId,
  });

  const handleCreateLink = (targetVideoId: string) => {
    if (!selectedVideoId) return;
    toast.success(`リンクを作成しました: ${selectedVideoId} → ${targetVideoId}`);
    // TODO: Implement actual link creation
  };

  if (isNetworkLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>ネットワークデータを読み込み中...</span>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className={cn('mx-8 p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">ネットワークデータの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div>
        <h2 className={cn('text-xl font-bold', themeClasses.text)}>コンテンツ複利戦略</h2>
        <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
          ショート動画から長尺動画への誘導、シリーズ間の相互リンクを最適化
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '総動画数', value: networkData?.stats.total_videos ?? 0, icon: Layers, color: 'blue' },
          { label: '総リンク数', value: networkData?.stats.total_links ?? 0, icon: LinkIcon, color: 'green' },
          { label: '総クリック数', value: networkData?.stats.total_clicks.toLocaleString() ?? '0', icon: MousePointerClick, color: 'purple' },
          { label: '平均転換率', value: `${networkData?.stats.avg_conversion_rate.toFixed(2) ?? '0'}%`, icon: TrendingUp, color: 'orange' },
        ].map((stat, i) => (
          <div
            key={i}
            className={cn(
              'p-6 rounded-2xl border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={20} className={`text-${stat.color}-500`} />
            </div>
            <div className={cn('text-2xl font-bold', themeClasses.text)}>{stat.value}</div>
            <div className={cn('text-sm', themeClasses.textSecondary)}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Network Visualization */}
      <div
        className={cn(
          'p-8 rounded-3xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <div className="flex items-center gap-2 mb-6">
          <Network size={20} className="text-blue-500" />
          <h3 className={cn('font-bold text-lg', themeClasses.text)}>コンテンツネットワーク</h3>
        </div>

        {/* Node Graph Placeholder */}
        <div className="relative h-96 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 flex items-center justify-center">
          <div className="text-center">
            <Network size={48} className="text-blue-500 mx-auto mb-4 opacity-50" />
            <p className={cn('text-sm', themeClasses.textSecondary)}>
              ノードグラフ可視化（実装予定）
            </p>
            <p className={cn('text-xs mt-2', themeClasses.textSecondary)}>
              動画間のリンク構造をインタラクティブに表示
            </p>
          </div>
        </div>

        {/* Node List */}
        <div className="mt-6 space-y-3">
          {networkData?.nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => setSelectedVideoId(node.id)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all',
                selectedVideoId === node.id
                  ? 'border-blue-500 bg-blue-500/5'
                  : themeClasses.cardBorder,
                'hover:border-blue-500/50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={cn('font-bold', themeClasses.text)}>{node.title}</div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className={cn('flex items-center gap-1', themeClasses.textSecondary)}>
                      <Eye size={14} />
                      {node.views.toLocaleString()}
                    </span>
                    <span className={cn('flex items-center gap-1', themeClasses.textSecondary)}>
                      <Clock size={14} />
                      {node.watch_time}分
                    </span>
                    <span className={cn('flex items-center gap-1', themeClasses.textSecondary)}>
                      <ChevronRight size={14} />
                      流入: {node.inbound_count} / 流出: {node.outbound_count}
                    </span>
                  </div>
                </div>
                {selectedVideoId === node.id && (
                  <div className="ml-4">
                    <div className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                      選択中
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link Suggestions */}
      {selectedVideoId && (
        <div
          className={cn(
            'p-8 rounded-3xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-green-500" />
            <h3 className={cn('font-bold text-lg', themeClasses.text)}>リンク提案</h3>
          </div>

          {isSuggestionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {suggestionsData?.map((suggestion) => (
                <div
                  key={suggestion.video_id}
                  className={cn(
                    'p-4 rounded-xl border',
                    themeClasses.cardBorder,
                    'hover:border-green-500/50 transition-all'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={cn('font-bold', themeClasses.text)}>{suggestion.title}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className={cn('flex items-center gap-1', themeClasses.textSecondary)}>
                          <Eye size={14} />
                          {suggestion.views.toLocaleString()}
                        </span>
                        <span className={cn('flex items-center gap-1', themeClasses.textSecondary)}>
                          <Play size={14} />
                          維持率 {suggestion.retention}%
                        </span>
                        <span className="text-green-500 font-bold text-xs">
                          スコア: {suggestion.score}
                        </span>
                      </div>
                      <div className={cn('text-xs mt-2', themeClasses.textSecondary)}>
                        理由: {suggestion.reason}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateLink(suggestion.video_id)}
                      className="ml-4 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all"
                    >
                      リンク作成
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compound Effect Dashboard */}
      {selectedVideoId && effectData && (
        <div
          className={cn(
            'p-8 rounded-3xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center gap-2 mb-6">
            <Layers size={20} className="text-purple-500" />
            <h3 className={cn('font-bold text-lg', themeClasses.text)}>複利効果ダッシュボード</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: '流入視聴数', value: effectData.total_referral_views.toLocaleString(), color: 'blue' },
              { label: '流入視聴時間', value: `${effectData.total_referral_watch_time.toFixed(1)}分`, color: 'green' },
              { label: '誘導クリック数', value: effectData.total_outbound_clicks.toLocaleString(), color: 'orange' },
              { label: '複利スコア', value: effectData.avg_compound_score.toFixed(1), color: 'purple' },
            ].map((metric, i) => (
              <div key={i} className={cn('p-4 rounded-xl border', themeClasses.cardBorder)}>
                <div className={cn('text-xl font-bold', themeClasses.text)}>{metric.value}</div>
                <div className={cn('text-sm mt-1', themeClasses.textSecondary)}>{metric.label}</div>
              </div>
            ))}
          </div>

          {/* Trend Chart Placeholder */}
          <div className="h-48 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 flex items-center justify-center">
            <p className={cn('text-sm', themeClasses.textSecondary)}>
              トレンドグラフ（実装予定）
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
