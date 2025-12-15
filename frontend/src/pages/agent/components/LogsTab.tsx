import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Bug,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { agentService } from '../../../services/agent';
import { toast } from '../../../components/common';
import {
  AGENT_TASK_STATUS_CONFIG,
  AGENT_TASK_PRIORITY_CONFIG,
} from '../../../types';
import type { AgentTaskStatus, AgentTaskPriority } from '../../../types';

type TabType = 'tasks' | 'logs';

const LOG_LEVEL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  debug: { label: 'DEBUG', color: 'text-slate-400 bg-slate-400/10', icon: <Bug size={12} /> },
  info: { label: 'INFO', color: 'text-blue-500 bg-blue-500/10', icon: <Info size={12} /> },
  warning: { label: 'WARNING', color: 'text-yellow-500 bg-yellow-500/10', icon: <AlertTriangle size={12} /> },
  error: { label: 'ERROR', color: 'text-red-500 bg-red-500/10', icon: <XCircle size={12} /> },
};

export const LogsTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [taskStatusFilter, setTaskStatusFilter] = useState<AgentTaskStatus | 'all'>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<AgentTaskPriority | 'all'>('all');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Fetch tasks
  const {
    data: tasksData,
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ['agent', 'tasks', taskStatusFilter, taskPriorityFilter],
    queryFn: () => agentService.getTasks({
      status: taskStatusFilter === 'all' ? undefined : taskStatusFilter,
      priority: taskPriorityFilter === 'all' ? undefined : taskPriorityFilter,
      limit: 50,
    }),
  });

  // Fetch logs
  const {
    data: logsData,
    isLoading: logsLoading,
  } = useQuery({
    queryKey: ['agent', 'logs', logLevelFilter],
    queryFn: () => agentService.getLogs({
      level: logLevelFilter === 'all' ? undefined : logLevelFilter,
      limit: 100,
    }),
  });

  const tasks = tasksData?.tasks ?? [];
  const logs = logsData?.logs ?? [];

  // Cancel task mutation
  const cancelTaskMutation = useMutation({
    mutationFn: (taskId: string) => agentService.cancelTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'tasks'] });
      toast.success('タスクをキャンセルしました');
    },
    onError: () => toast.error('タスクのキャンセルに失敗しました'),
  });

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleLogExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const isLoading = tasksLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={cn('text-xl font-bold', themeClasses.text)}>実行履歴</h2>
        <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
          タスク実行履歴とエージェントログ
        </p>
      </div>

      {/* Tab Switcher */}
      <div className={cn('flex p-1 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'tasks'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Clock size={16} />
          タスク履歴
          <span className={cn('text-xs', themeClasses.textSecondary)}>({tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'logs'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <FileText size={16} />
          ログ
          <span className={cn('text-xs', themeClasses.textSecondary)}>({logs.length})</span>
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value as AgentTaskStatus | 'all')}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            >
              <option value="all">すべてのステータス</option>
              {(Object.keys(AGENT_TASK_STATUS_CONFIG) as AgentTaskStatus[]).map((status) => (
                <option key={status} value={status}>
                  {AGENT_TASK_STATUS_CONFIG[status].label}
                </option>
              ))}
            </select>
            <select
              value={taskPriorityFilter}
              onChange={(e) => setTaskPriorityFilter(e.target.value as AgentTaskPriority | 'all')}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            >
              <option value="all">すべての優先度</option>
              {(Object.keys(AGENT_TASK_PRIORITY_CONFIG) as AgentTaskPriority[]).map((priority) => (
                <option key={priority} value={priority}>
                  {AGENT_TASK_PRIORITY_CONFIG[priority].label}
                </option>
              ))}
            </select>
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
              <Clock size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
              <p className={themeClasses.textSecondary}>タスク履歴がありません</p>
            </div>
          ) : (
            <div
              className={cn(
                'rounded-2xl border overflow-hidden',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                    <th className={cn('px-4 py-3 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>タスク</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>ステータス</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>優先度</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>所要時間</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>開始</th>
                    <th className={cn('px-4 py-3 text-right text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tasks.map((task) => {
                    const statusConfig = AGENT_TASK_STATUS_CONFIG[task.status];
                    const priorityConfig = AGENT_TASK_PRIORITY_CONFIG[task.priority];
                    const isExpanded = expandedTasks.has(task.id);

                    return (
                      <>
                        <tr
                          key={task.id}
                          className={cn(
                            'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors',
                            isExpanded && (isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50')
                          )}
                          onClick={() => toggleTaskExpanded(task.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp size={14} className={themeClasses.textSecondary} />
                              ) : (
                                <ChevronDown size={14} className={themeClasses.textSecondary} />
                              )}
                              <div>
                                <p className={cn('font-medium text-sm', themeClasses.text)}>{task.name}</p>
                                {task.taskType && (
                                  <p className={cn('text-xs', themeClasses.textSecondary)}>{task.taskType}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', statusConfig?.color)}>
                              {task.status === 'running' && <Loader2 size={12} className="animate-spin" />}
                              {task.status === 'completed' && <CheckCircle size={12} />}
                              {task.status === 'failed' && <XCircle size={12} />}
                              {task.status === 'pending' && <Clock size={12} />}
                              {task.status === 'cancelled' && <XCircle size={12} />}
                              {statusConfig?.label || task.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', priorityConfig?.color)}>
                              {priorityConfig?.label || task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('text-sm', themeClasses.text)}>
                              {formatDuration(task.durationSeconds)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('text-sm', themeClasses.textSecondary)}>
                              {task.startedAt ? new Date(task.startedAt).toLocaleString() : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(task.status === 'pending' || task.status === 'running') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelTaskMutation.mutate(task.id);
                                }}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                              >
                                キャンセル
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${task.id}-details`}>
                            <td colSpan={6} className={cn('px-4 py-4', isDarkMode ? 'bg-slate-800/20' : 'bg-slate-50/50')}>
                              <div className="space-y-3">
                                {task.description && (
                                  <div>
                                    <span className={cn('text-xs font-medium', themeClasses.textSecondary)}>説明:</span>
                                    <p className={cn('text-sm mt-1', themeClasses.text)}>{task.description}</p>
                                  </div>
                                )}
                                {task.progressPercent !== undefined && task.progressPercent > 0 && (
                                  <div>
                                    <span className={cn('text-xs font-medium', themeClasses.textSecondary)}>進捗:</span>
                                    <div className="flex items-center gap-3 mt-1">
                                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-500 transition-all"
                                          style={{ width: `${task.progressPercent}%` }}
                                        />
                                      </div>
                                      <span className={cn('text-sm', themeClasses.text)}>{task.progressPercent}%</span>
                                    </div>
                                    {task.progressMessage && (
                                      <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{task.progressMessage}</p>
                                    )}
                                  </div>
                                )}
                                {task.errorMessage && (
                                  <div className={cn('p-3 rounded-lg', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
                                    <span className="text-xs font-medium text-red-500">エラー:</span>
                                    <p className="text-sm text-red-500 mt-1">{task.errorMessage}</p>
                                  </div>
                                )}
                                {task.outputData && Object.keys(task.outputData).length > 0 && (
                                  <div>
                                    <span className={cn('text-xs font-medium', themeClasses.textSecondary)}>出力:</span>
                                    <pre className={cn('text-xs mt-1 p-2 rounded-lg overflow-auto max-h-40', isDarkMode ? 'bg-slate-800' : 'bg-slate-100', themeClasses.text)}>
                                      {JSON.stringify(task.outputData, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            >
              <option value="all">すべてのレベル</option>
              {Object.keys(LOG_LEVEL_CONFIG).map((level) => (
                <option key={level} value={level}>
                  {LOG_LEVEL_CONFIG[level].label}
                </option>
              ))}
            </select>
          </div>

          {/* Log List */}
          {logs.length === 0 ? (
            <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
              <FileText size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
              <p className={themeClasses.textSecondary}>ログがありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const levelConfig = LOG_LEVEL_CONFIG[log.level] || LOG_LEVEL_CONFIG.info;
                const isExpanded = expandedLogs.has(log.id);

                return (
                  <div
                    key={log.id}
                    className={cn(
                      'rounded-xl border transition-all',
                      themeClasses.cardBg,
                      themeClasses.cardBorder,
                      log.level === 'error' && 'border-l-4 border-l-red-500',
                      log.level === 'warning' && 'border-l-4 border-l-yellow-500'
                    )}
                  >
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => toggleLogExpanded(log.id)}
                    >
                      <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono', levelConfig.color)}>
                        {levelConfig.icon}
                        {levelConfig.label}
                      </span>
                      <span className={cn('flex-1 text-sm truncate', themeClasses.text)}>
                        {log.message}
                      </span>
                      <span className={cn('text-xs whitespace-nowrap', themeClasses.textSecondary)}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {log.details && (
                        isExpanded ? (
                          <ChevronUp size={14} className={themeClasses.textSecondary} />
                        ) : (
                          <ChevronDown size={14} className={themeClasses.textSecondary} />
                        )
                      )}
                    </div>
                    {isExpanded && log.details && (
                      <div className={cn('px-3 pb-3')}>
                        <pre className={cn('text-xs p-2 rounded-lg overflow-auto max-h-40', isDarkMode ? 'bg-slate-800' : 'bg-slate-100', themeClasses.text)}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
