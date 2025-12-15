import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Eye,
  ExternalLink,
  CheckCircle,
  Bell,
  Loader2,
  Clock,
  ArrowUpRight,
  Lightbulb,
  Video,
  User,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { agentService } from '../../../services/agent';
import { toast } from '../../../components/common';
import type { TrendAlert, CompetitorAlert } from '../../../types';

type TabType = 'trends' | 'competitors';

export const AlertsTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('trends');
  const [showRead, setShowRead] = useState(false);

  // Fetch trend alerts
  const {
    data: trendAlertsData,
    isLoading: trendLoading,
  } = useQuery({
    queryKey: ['agent', 'trend-alerts', showRead],
    queryFn: () => agentService.getTrendAlerts({ isRead: showRead ? undefined : false }),
  });

  // Fetch competitor alerts
  const {
    data: competitorAlertsData,
    isLoading: competitorLoading,
  } = useQuery({
    queryKey: ['agent', 'competitor-alerts', showRead],
    queryFn: () => agentService.getCompetitorAlerts({ isRead: showRead ? undefined : false }),
  });

  const trendAlerts = trendAlertsData?.alerts ?? [];
  const competitorAlerts = competitorAlertsData?.alerts ?? [];

  // Mark trend alert as read
  const markTrendReadMutation = useMutation({
    mutationFn: (id: string) => agentService.markTrendAlertRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'trend-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'dashboard'] });
    },
  });

  // Mark competitor alert as read
  const markCompetitorReadMutation = useMutation({
    mutationFn: (id: string) => agentService.markCompetitorAlertRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'competitor-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'dashboard'] });
    },
  });

  // Update trend alert action
  const updateTrendMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActioned: boolean; actionTaken?: string } }) =>
      agentService.updateTrendAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'trend-alerts'] });
      toast.success('アラートを更新しました');
    },
    onError: () => toast.error('更新に失敗しました'),
  });

  // Update competitor alert action
  const updateCompetitorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActioned: boolean; actionTaken?: string } }) =>
      agentService.updateCompetitorAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'competitor-alerts'] });
      toast.success('アラートを更新しました');
    },
    onError: () => toast.error('更新に失敗しました'),
  });

  const handleMarkTrendActioned = (alert: TrendAlert, action: string) => {
    updateTrendMutation.mutate({
      id: alert.id,
      data: { isActioned: true, actionTaken: action },
    });
  };

  const handleMarkCompetitorActioned = (alert: CompetitorAlert, action: string) => {
    updateCompetitorMutation.mutate({
      id: alert.id,
      data: { isActioned: true, actionTaken: action },
    });
  };

  const isLoading = trendLoading || competitorLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>読み込み中...</span>
      </div>
    );
  }

  const unreadTrendCount = trendAlerts.filter((a) => !a.isRead).length;
  const unreadCompetitorCount = competitorAlerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>アラート</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            トレンドと競合の監視アラート
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showRead}
            onChange={(e) => setShowRead(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
          />
          <span className={cn('text-sm', themeClasses.textSecondary)}>既読を表示</span>
        </label>
      </div>

      {/* Tab Switcher */}
      <div className={cn('flex p-1 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
        <button
          onClick={() => setActiveTab('trends')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'trends'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <TrendingUp size={16} />
          トレンド
          {unreadTrendCount > 0 && (
            <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
              {unreadTrendCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('competitors')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'competitors'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Eye size={16} />
          競合
          {unreadCompetitorCount > 0 && (
            <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
              {unreadCompetitorCount}
            </span>
          )}
        </button>
      </div>

      {/* Trend Alerts Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          {trendAlerts.length === 0 ? (
            <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
              <TrendingUp size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
              <p className={themeClasses.textSecondary}>
                {showRead ? 'トレンドアラートがありません' : '未読のトレンドアラートはありません'}
              </p>
            </div>
          ) : (
            trendAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'rounded-2xl border p-5 transition-all',
                  themeClasses.cardBg,
                  themeClasses.cardBorder,
                  !alert.isRead && 'border-l-4 border-l-pink-500'
                )}
                onMouseEnter={() => {
                  if (!alert.isRead) {
                    markTrendReadMutation.mutate(alert.id);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-xl', isDarkMode ? 'bg-pink-500/20' : 'bg-pink-50')}>
                      <TrendingUp size={20} className="text-pink-500" />
                    </div>
                    <div>
                      <h3 className={cn('font-bold', themeClasses.text)}>{alert.title}</h3>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        {alert.alertType && (
                          <span className={cn('px-2 py-0.5 rounded-full', isDarkMode ? 'bg-slate-700' : 'bg-slate-200', themeClasses.textSecondary)}>
                            {alert.alertType}
                          </span>
                        )}
                        <span className={themeClasses.textSecondary}>
                          <Clock size={12} className="inline mr-1" />
                          {new Date(alert.detectedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.trendScore && (
                      <div className="flex items-center gap-1">
                        <ArrowUpRight size={14} className="text-pink-500" />
                        <span className="text-sm font-bold text-pink-500">{alert.trendScore}</span>
                      </div>
                    )}
                    {alert.isActioned ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <Bell size={18} className={themeClasses.textSecondary} />
                    )}
                  </div>
                </div>

                {alert.description && (
                  <p className={cn('text-sm mb-4', themeClasses.textSecondary)}>
                    {alert.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mb-4">
                  {alert.keyword && (
                    <div className={cn('px-3 py-1.5 rounded-lg text-sm', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                      <span className={themeClasses.textSecondary}>キーワード: </span>
                      <span className={cn('font-medium', themeClasses.text)}>{alert.keyword}</span>
                    </div>
                  )}
                  {alert.growthRate && (
                    <div className={cn('px-3 py-1.5 rounded-lg text-sm', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                      <span className={themeClasses.textSecondary}>成長率: </span>
                      <span className="font-medium text-green-500">+{alert.growthRate}%</span>
                    </div>
                  )}
                  {alert.source && (
                    <div className={cn('px-3 py-1.5 rounded-lg text-sm', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                      <span className={themeClasses.textSecondary}>ソース: </span>
                      <span className={cn('font-medium', themeClasses.text)}>{alert.source}</span>
                    </div>
                  )}
                </div>

                {/* Suggested Actions */}
                {alert.suggestedActions && (
                  <div className={cn('p-3 rounded-xl mb-4', isDarkMode ? 'bg-slate-800/50' : 'bg-yellow-50')}>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={14} className="text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-500">推奨アクション</span>
                    </div>
                    <p className={cn('text-sm', themeClasses.text)}>
                      {typeof alert.suggestedActions === 'string'
                        ? alert.suggestedActions
                        : JSON.stringify(alert.suggestedActions)}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  {alert.sourceUrl && (
                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink size={14} />
                      ソースを表示
                    </a>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {!alert.isActioned && (
                      <>
                        <button
                          onClick={() => handleMarkTrendActioned(alert, 'ignored')}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300',
                            themeClasses.text
                          )}
                        >
                          スキップ
                        </button>
                        <button
                          onClick={() => handleMarkTrendActioned(alert, 'content_created')}
                          className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-lg font-medium transition-colors"
                        >
                          コンテンツ作成
                        </button>
                      </>
                    )}
                    {alert.isActioned && alert.actionTaken && (
                      <span className={cn('text-xs', themeClasses.textSecondary)}>
                        アクション: {alert.actionTaken}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Competitor Alerts Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-4">
          {competitorAlerts.length === 0 ? (
            <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
              <Eye size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
              <p className={themeClasses.textSecondary}>
                {showRead ? '競合アラートがありません' : '未読の競合アラートはありません'}
              </p>
            </div>
          ) : (
            competitorAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'rounded-2xl border p-5 transition-all',
                  themeClasses.cardBg,
                  themeClasses.cardBorder,
                  !alert.isRead && 'border-l-4 border-l-cyan-500'
                )}
                onMouseEnter={() => {
                  if (!alert.isRead) {
                    markCompetitorReadMutation.mutate(alert.id);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-xl', isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-50')}>
                      <Eye size={20} className="text-cyan-500" />
                    </div>
                    <div>
                      <h3 className={cn('font-bold', themeClasses.text)}>{alert.title}</h3>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        {alert.alertType && (
                          <span className={cn('px-2 py-0.5 rounded-full', isDarkMode ? 'bg-slate-700' : 'bg-slate-200', themeClasses.textSecondary)}>
                            {alert.alertType}
                          </span>
                        )}
                        <span className={themeClasses.textSecondary}>
                          <Clock size={12} className="inline mr-1" />
                          {new Date(alert.detectedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {alert.isActioned ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <Bell size={18} className={themeClasses.textSecondary} />
                  )}
                </div>

                {/* Competitor Info */}
                {(alert.competitorChannelName || alert.competitorVideoTitle) && (
                  <div className={cn('p-3 rounded-xl mb-4', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                    {alert.competitorChannelName && (
                      <div className="flex items-center gap-2 mb-2">
                        <User size={14} className={themeClasses.textSecondary} />
                        <span className={cn('text-sm font-medium', themeClasses.text)}>
                          {alert.competitorChannelName}
                        </span>
                      </div>
                    )}
                    {alert.competitorVideoTitle && (
                      <div className="flex items-center gap-2">
                        <Video size={14} className={themeClasses.textSecondary} />
                        <span className={cn('text-sm', themeClasses.text)}>
                          {alert.competitorVideoTitle}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {alert.description && (
                  <p className={cn('text-sm mb-4', themeClasses.textSecondary)}>
                    {alert.description}
                  </p>
                )}

                {/* Performance Metrics */}
                {alert.performanceMetrics && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {Object.entries(alert.performanceMetrics as Record<string, number | string>).slice(0, 3).map(([key, value]) => (
                      <div
                        key={key}
                        className={cn('p-2 rounded-lg text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}
                      >
                        <p className={cn('text-lg font-bold', themeClasses.text)}>
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                        <p className={cn('text-xs', themeClasses.textSecondary)}>{key}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Response */}
                {alert.suggestedResponse && (
                  <div className={cn('p-3 rounded-xl mb-4', isDarkMode ? 'bg-slate-800/50' : 'bg-blue-50')}>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={14} className="text-blue-500" />
                      <span className="text-xs font-medium text-blue-500">推奨対応</span>
                    </div>
                    <p className={cn('text-sm', themeClasses.text)}>
                      {typeof alert.suggestedResponse === 'string'
                        ? alert.suggestedResponse
                        : JSON.stringify(alert.suggestedResponse)}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  {alert.competitorVideoUrl && (
                    <a
                      href={alert.competitorVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink size={14} />
                      動画を表示
                    </a>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {!alert.isActioned && (
                      <>
                        <button
                          onClick={() => handleMarkCompetitorActioned(alert, 'ignored')}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300',
                            themeClasses.text
                          )}
                        >
                          スキップ
                        </button>
                        <button
                          onClick={() => handleMarkCompetitorActioned(alert, 'analyzed')}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs rounded-lg font-medium transition-colors"
                        >
                          分析完了
                        </button>
                      </>
                    )}
                    {alert.isActioned && alert.actionTaken && (
                      <span className={cn('text-xs', themeClasses.textSecondary)}>
                        アクション: {alert.actionTaken}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
