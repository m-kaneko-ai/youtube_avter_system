import { useQuery } from '@tanstack/react-query';
import {
  Bot,
  TrendingUp,
  Eye,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { useNavigationStore } from '../../../stores/navigationStore';
import { agentService } from '../../../services/agent';
import {
  AGENT_TYPE_CONFIG,
  AGENT_STATUS_CONFIG,
  AGENT_TASK_STATUS_CONFIG,
} from '../../../types';
import type { Agent, AgentTask, TrendAlert, CompetitorAlert, CommentQueueItem } from '../../../types';

export const DashboardTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const { setActiveTab } = useNavigationStore();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agent', 'dashboard'],
    queryFn: () => agentService.getDashboard(),
  });

  const navigateToTab = (tabId: string) => {
    setActiveTab('agent', tabId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>ダッシュボードを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">ダッシュボードの読み込みに失敗しました</p>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const recentAgents = dashboardData?.recentAgents ?? [];
  const recentTasks = dashboardData?.recentTasks ?? [];
  const recentTrendAlerts = dashboardData?.recentTrendAlerts ?? [];
  const recentCompetitorAlerts = dashboardData?.recentCompetitorAlerts ?? [];
  const pendingComments = dashboardData?.pendingComments ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={cn('text-xl font-bold', themeClasses.text)}>エージェントダッシュボード</h2>
        <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
          AI自動化エージェントの状態と最近の活動
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: '総エージェント',
            value: summary?.totalAgents ?? 0,
            icon: <Bot size={20} />,
            color: 'text-blue-500',
            bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
          },
          {
            label: '稼働中',
            value: summary?.runningAgents ?? 0,
            icon: <Play size={20} />,
            color: 'text-green-500',
            bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-50',
          },
          {
            label: '今日のタスク',
            value: summary?.totalTasksToday ?? 0,
            icon: <CheckCircle2 size={20} />,
            color: 'text-purple-500',
            bgColor: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50',
          },
          {
            label: '失敗タスク',
            value: summary?.failedTasksToday ?? 0,
            icon: <XCircle size={20} />,
            color: 'text-red-500',
            bgColor: isDarkMode ? 'bg-red-500/10' : 'bg-red-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-xl',
              stat.bgColor
            )}
          >
            <div className={cn('flex items-center gap-2 mb-2', stat.color)}>
              {stat.icon}
              <span className="text-xs font-medium">{stat.label}</span>
            </div>
            <p className={cn('text-2xl font-bold', themeClasses.text)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => navigateToTab('comments')}
          className={cn(
            'p-4 rounded-xl text-left transition-all hover:scale-[1.02]',
            isDarkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-500">
              <MessageCircle size={20} />
              <span className="text-sm font-medium">承認待ちコメント</span>
            </div>
            <ArrowRight size={16} className={themeClasses.textSecondary} />
          </div>
          <p className={cn('text-2xl font-bold mt-2', themeClasses.text)}>
            {summary?.pendingComments ?? 0}
          </p>
        </button>

        <button
          onClick={() => navigateToTab('alerts')}
          className={cn(
            'p-4 rounded-xl text-left transition-all hover:scale-[1.02]',
            isDarkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-pink-500">
              <TrendingUp size={20} />
              <span className="text-sm font-medium">未読トレンド</span>
            </div>
            <ArrowRight size={16} className={themeClasses.textSecondary} />
          </div>
          <p className={cn('text-2xl font-bold mt-2', themeClasses.text)}>
            {summary?.unreadTrendAlerts ?? 0}
          </p>
        </button>

        <button
          onClick={() => navigateToTab('alerts')}
          className={cn(
            'p-4 rounded-xl text-left transition-all hover:scale-[1.02]',
            isDarkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-500">
              <Eye size={20} />
              <span className="text-sm font-medium">未読競合アラート</span>
            </div>
            <ArrowRight size={16} className={themeClasses.textSecondary} />
          </div>
          <p className={cn('text-2xl font-bold mt-2', themeClasses.text)}>
            {summary?.unreadCompetitorAlerts ?? 0}
          </p>
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Agents */}
        <div
          className={cn(
            'rounded-2xl border p-5',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('font-bold', themeClasses.text)}>最近のエージェント</h3>
            <button
              onClick={() => navigateToTab('agents')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              すべて表示
            </button>
          </div>
          <div className="space-y-3">
            {recentAgents.length === 0 ? (
              <p className={cn('text-sm py-4 text-center', themeClasses.textSecondary)}>
                エージェントがありません
              </p>
            ) : (
              recentAgents.slice(0, 5).map((agent: Agent) => {
                const typeConfig = AGENT_TYPE_CONFIG[agent.agentType];
                const statusConfig = AGENT_STATUS_CONFIG[agent.status];
                return (
                  <div
                    key={agent.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl',
                      isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                        <Bot size={18} />
                      </div>
                      <div>
                        <p className={cn('font-medium text-sm', themeClasses.text)}>{agent.name}</p>
                        <p className={cn('text-xs', themeClasses.textSecondary)}>
                          {typeConfig?.label || agent.agentType}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        statusConfig?.color || 'text-slate-500'
                      )}
                    >
                      {agent.status === 'running' && (
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                      )}
                      {statusConfig?.label || agent.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div
          className={cn(
            'rounded-2xl border p-5',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('font-bold', themeClasses.text)}>最近のタスク</h3>
            <button
              onClick={() => navigateToTab('logs')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              すべて表示
            </button>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className={cn('text-sm py-4 text-center', themeClasses.textSecondary)}>
                タスクがありません
              </p>
            ) : (
              recentTasks.slice(0, 5).map((task: AgentTask) => {
                const statusConfig = AGENT_TASK_STATUS_CONFIG[task.status];
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl',
                      isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {task.status === 'completed' && <CheckCircle2 size={18} className="text-green-500" />}
                      {task.status === 'failed' && <XCircle size={18} className="text-red-500" />}
                      {task.status === 'running' && <Loader2 size={18} className="text-blue-500 animate-spin" />}
                      {task.status === 'pending' && <Clock size={18} className="text-slate-400" />}
                      {task.status === 'cancelled' && <XCircle size={18} className="text-slate-400" />}
                      <div>
                        <p className={cn('font-medium text-sm', themeClasses.text)}>{task.name}</p>
                        <p className={cn('text-xs', themeClasses.textSecondary)}>
                          {task.durationSeconds ? `${task.durationSeconds}秒` : '処理中...'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        statusConfig?.color || 'text-slate-500'
                      )}
                    >
                      {statusConfig?.label || task.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Trend Alerts */}
        <div
          className={cn(
            'rounded-2xl border p-5',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-pink-500" />
              <h3 className={cn('font-bold', themeClasses.text)}>トレンドアラート</h3>
            </div>
            <button
              onClick={() => navigateToTab('alerts')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              すべて表示
            </button>
          </div>
          <div className="space-y-3">
            {recentTrendAlerts.length === 0 ? (
              <p className={cn('text-sm py-4 text-center', themeClasses.textSecondary)}>
                トレンドアラートがありません
              </p>
            ) : (
              recentTrendAlerts.slice(0, 3).map((alert: TrendAlert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-xl',
                    isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50',
                    !alert.isRead && 'border-l-4 border-pink-500'
                  )}
                >
                  <p className={cn('font-medium text-sm', themeClasses.text)}>{alert.title}</p>
                  <p className={cn('text-xs mt-1 line-clamp-2', themeClasses.textSecondary)}>
                    {alert.description}
                  </p>
                  {alert.trendScore && (
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp size={12} className="text-pink-500" />
                      <span className="text-xs text-pink-500">スコア: {alert.trendScore}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Competitor Alerts */}
        <div
          className={cn(
            'rounded-2xl border p-5',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-cyan-500" />
              <h3 className={cn('font-bold', themeClasses.text)}>競合アラート</h3>
            </div>
            <button
              onClick={() => navigateToTab('alerts')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              すべて表示
            </button>
          </div>
          <div className="space-y-3">
            {recentCompetitorAlerts.length === 0 ? (
              <p className={cn('text-sm py-4 text-center', themeClasses.textSecondary)}>
                競合アラートがありません
              </p>
            ) : (
              recentCompetitorAlerts.slice(0, 3).map((alert: CompetitorAlert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-xl',
                    isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50',
                    !alert.isRead && 'border-l-4 border-cyan-500'
                  )}
                >
                  <p className={cn('font-medium text-sm', themeClasses.text)}>{alert.title}</p>
                  {alert.competitorChannelName && (
                    <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
                      {alert.competitorChannelName}
                    </p>
                  )}
                  <p className={cn('text-xs mt-1 line-clamp-2', themeClasses.textSecondary)}>
                    {alert.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Comments */}
      {pendingComments.length > 0 && (
        <div
          className={cn(
            'rounded-2xl border p-5',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-orange-500" />
              <h3 className={cn('font-bold', themeClasses.text)}>承認待ちコメント</h3>
              <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {pendingComments.length}
              </span>
            </div>
            <button
              onClick={() => navigateToTab('comments')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              すべて表示
            </button>
          </div>
          <div className="space-y-3">
            {pendingComments.slice(0, 3).map((comment: CommentQueueItem) => (
              <div
                key={comment.id}
                className={cn(
                  'p-3 rounded-xl',
                  isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium text-sm', themeClasses.text)}>
                      {comment.authorName || '匿名ユーザー'}
                    </p>
                    <p className={cn('text-xs mt-1 line-clamp-2', themeClasses.textSecondary)}>
                      {comment.commentText}
                    </p>
                    {comment.replyText && (
                      <div className={cn('mt-2 p-2 rounded-lg text-xs', isDarkMode ? 'bg-slate-700' : 'bg-slate-100')}>
                        <span className="text-blue-500 font-medium">提案返信: </span>
                        <span className={themeClasses.textSecondary}>{comment.replyText}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors">
                      承認
                    </button>
                    <button className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors">
                      却下
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
