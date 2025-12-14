import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Image,
  Video,
  Send,
  AlertCircle,
  ChevronRight,
  Filter,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { dashboardService } from '../../../services';
import type { Task, TaskStatus, TaskCategory } from '../../../services/dashboard';

const CATEGORY_CONFIG: Record<
  TaskCategory,
  { icon: React.ReactNode; label: string; color: string }
> = {
  script: {
    icon: <FileText size={16} />,
    label: '台本',
    color: 'text-blue-500 bg-blue-500/10',
  },
  thumbnail: {
    icon: <Image size={16} />,
    label: 'サムネイル',
    color: 'text-purple-500 bg-purple-500/10',
  },
  video: {
    icon: <Video size={16} />,
    label: '動画',
    color: 'text-pink-500 bg-pink-500/10',
  },
  publish: {
    icon: <Send size={16} />,
    label: '公開',
    color: 'text-green-500 bg-green-500/10',
  },
  review: {
    icon: <CheckCircle2 size={16} />,
    label: '承認',
    color: 'text-orange-500 bg-orange-500/10',
  },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '未着手', color: 'text-slate-500' },
  in_progress: { label: '進行中', color: 'text-blue-500' },
  completed: { label: '完了', color: 'text-green-500' },
  overdue: { label: '期限超過', color: 'text-red-500' },
};

const PRIORITY_CONFIG: Record<Task['priority'], { label: string; color: string }> = {
  high: { label: '高', color: 'bg-red-500' },
  medium: { label: '中', color: 'bg-yellow-500' },
  low: { label: '低', color: 'bg-slate-400' },
};

// Map task categories to navigation paths
const CATEGORY_PATHS: Record<TaskCategory, string> = {
  script: '/script',
  thumbnail: '/script?tab=thumbnail',
  video: '/production',
  publish: '/publish',
  review: '/planning',
};

export const TasksTab = () => {
  const navigate = useNavigate();
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | TaskStatus>('all');

  // タスク一覧取得
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'tasks'],
    queryFn: () => dashboardService.getTodayTasks(),
  });

  // ステータス更新ミューテーション
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      dashboardService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'tasks'] });
    },
  });

  const handleToggleComplete = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateStatusMutation.mutate({ taskId: task.id, status: newStatus });
  };

  const handleNavigateToTask = (task: Task) => {
    const path = CATEGORY_PATHS[task.category];
    navigate(path);
  };

  const tasks = data?.tasks ?? [];
  const filteredTasks = filter === 'all' ? tasks : tasks.filter((task) => task.status === filter);

  const pendingCount = data?.pendingCount ?? 0;
  const inProgressCount = data?.inProgressCount ?? 0;
  const completedCount = data?.completedCount ?? 0;
  const overdueCount = data?.overdueCount ?? 0;
  const totalCount = tasks.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 pb-8">
        <div className={cn('text-center py-12', themeClasses.textSecondary)}>
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="font-medium">タスクの読み込みに失敗しました</p>
          <p className="text-sm mt-1">しばらく経ってから再度お試しください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn('text-xl font-bold', themeClasses.text)}>
              今日のタスク
            </h2>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
              {new Date().toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className={themeClasses.textSecondary} />
            <span className={cn('text-sm font-medium', themeClasses.text)}>
              {completedCount}/{totalCount} 完了
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '未着手', count: pendingCount, color: 'text-slate-500', bg: 'bg-slate-500/10' },
            { label: '進行中', count: inProgressCount, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: '完了', count: completedCount, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: '期限超過', count: overdueCount, color: 'text-red-500', bg: 'bg-red-500/10' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'p-4 rounded-xl text-center',
                isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
              )}
            >
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.count}</p>
              <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className={themeClasses.textSecondary} />
          <div className="flex gap-2">
            {(['all', 'pending', 'in_progress', 'overdue', 'completed'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filter === status
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {status === 'all'
                    ? 'すべて'
                    : STATUS_CONFIG[status as TaskStatus].label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'p-4 rounded-2xl border transition-all',
                task.status === 'completed'
                  ? isDarkMode
                    ? 'bg-slate-800/30 border-slate-700/50'
                    : 'bg-slate-50/50 border-slate-200/50'
                  : cn(themeClasses.cardBg, themeClasses.cardBorder),
                task.status === 'overdue' &&
                  (isDarkMode ? 'border-red-900/50' : 'border-red-200'),
                'hover:shadow-md'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  disabled={updateStatusMutation.isPending}
                  className={cn(
                    'mt-1 transition-colors',
                    task.status === 'completed'
                      ? 'text-green-500'
                      : themeClasses.textSecondary,
                    updateStatusMutation.isPending && 'opacity-50'
                  )}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <Circle size={22} />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Priority indicator */}
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        PRIORITY_CONFIG[task.priority].color
                      )}
                    />
                    {/* Category badge */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        CATEGORY_CONFIG[task.category].color
                      )}
                    >
                      {CATEGORY_CONFIG[task.category].icon}
                      {CATEGORY_CONFIG[task.category].label}
                    </span>
                    {/* Overdue badge */}
                    {task.status === 'overdue' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-red-500 bg-red-500/10">
                        <AlertCircle size={12} />
                        期限超過
                      </span>
                    )}
                  </div>

                  <h4
                    className={cn(
                      'font-medium',
                      task.status === 'completed'
                        ? 'line-through text-slate-400'
                        : themeClasses.text
                    )}
                  >
                    {task.title}
                  </h4>

                  <p
                    className={cn(
                      'text-sm mt-1',
                      task.status === 'completed'
                        ? 'text-slate-400'
                        : themeClasses.textSecondary
                    )}
                  >
                    {task.description}
                  </p>

                  {task.project && (
                    <p className={cn('text-xs mt-2', themeClasses.textSecondary)}>
                      プロジェクト: {task.project}
                    </p>
                  )}
                </div>

                {/* Time & Action */}
                <div className="flex flex-col items-end gap-2">
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm',
                      task.status === 'overdue'
                        ? 'text-red-500'
                        : themeClasses.textSecondary
                    )}
                  >
                    <Clock size={14} />
                    {task.dueTime}
                  </div>
                  <button
                    onClick={() => handleNavigateToTask(task)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode
                        ? 'hover:bg-slate-700 text-slate-400'
                        : 'hover:bg-slate-100 text-slate-500'
                    )}
                    title="タスクを開く"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div
              className={cn(
                'text-center py-12',
                themeClasses.textSecondary
              )}
            >
              該当するタスクがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
