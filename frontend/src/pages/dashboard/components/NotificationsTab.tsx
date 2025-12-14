import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  MessageCircle,
  TrendingUp,
  Video,
  Users,
  Settings,
  Check,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { dashboardService } from '../../../services';
import type { NotificationType } from '../../../services/dashboard';

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  approval: {
    icon: <CheckCircle2 size={18} />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  alert: {
    icon: <AlertTriangle size={18} />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  info: {
    icon: <Info size={18} />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  comment: {
    icon: <MessageCircle size={18} />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  performance: {
    icon: <TrendingUp size={18} />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  video: {
    icon: <Video size={18} />,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  team: {
    icon: <Users size={18} />,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  system: {
    icon: <Settings size={18} />,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
  },
};

export const NotificationsTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // 通知一覧取得
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'notifications', filter],
    queryFn: () => dashboardService.getNotifications(filter === 'unread'),
  });

  // 既読にするミューテーション
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      dashboardService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] });
    },
  });

  // 全て既読にするミューテーション
  const markAllAsReadMutation = useMutation({
    mutationFn: () => dashboardService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] });
    },
  });

  // 削除ミューテーション
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) =>
      dashboardService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'notifications'] });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

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
          <p className="font-medium">通知の読み込みに失敗しました</p>
          <p className="text-sm mt-1">しばらく経ってから再度お試しください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-xl',
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
              )}
            >
              <Bell size={20} className={themeClasses.text} />
            </div>
            <div>
              <h2 className={cn('text-xl font-bold', themeClasses.text)}>
                通知
              </h2>
              <p className={cn('text-sm', themeClasses.textSecondary)}>
                {unreadCount > 0
                  ? `${unreadCount}件の未読があります`
                  : 'すべて既読です'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
                markAllAsReadMutation.isPending && 'opacity-50'
              )}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              すべて既読にする
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                filter === f
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {f === 'all' ? 'すべて' : `未読 (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'p-4 rounded-2xl border transition-all group',
                notification.isRead
                  ? isDarkMode
                    ? 'bg-slate-800/30 border-slate-700/50'
                    : 'bg-slate-50/50 border-slate-200/50'
                  : cn(themeClasses.cardBg, themeClasses.cardBorder),
                'hover:shadow-md'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'p-2 rounded-xl',
                    TYPE_CONFIG[notification.type].bgColor
                  )}
                >
                  <span className={TYPE_CONFIG[notification.type].color}>
                    {TYPE_CONFIG[notification.type].icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={cn(
                        'font-medium',
                        notification.isRead
                          ? themeClasses.textSecondary
                          : themeClasses.text
                      )}
                    >
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-sm',
                      notification.isRead
                        ? 'text-slate-400'
                        : themeClasses.textSecondary
                    )}
                  >
                    {notification.message}
                  </p>
                  <p
                    className={cn(
                      'text-xs mt-2',
                      themeClasses.textSecondary
                    )}
                  >
                    {notification.time}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isDarkMode
                          ? 'hover:bg-slate-700 text-slate-400'
                          : 'hover:bg-slate-100 text-slate-500',
                        markAsReadMutation.isPending && 'opacity-50'
                      )}
                      title="既読にする"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    disabled={deleteMutation.isPending}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode
                        ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400'
                        : 'hover:bg-red-50 text-slate-500 hover:text-red-500',
                      deleteMutation.isPending && 'opacity-50'
                    )}
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode
                        ? 'hover:bg-slate-700 text-slate-400'
                        : 'hover:bg-slate-100 text-slate-500'
                    )}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div
              className={cn(
                'text-center py-16',
                themeClasses.textSecondary
              )}
            >
              <Bell
                size={48}
                className={cn(
                  'mx-auto mb-4',
                  isDarkMode ? 'text-slate-700' : 'text-slate-300'
                )}
              />
              <p className="font-medium">通知はありません</p>
              <p className="text-sm mt-1">新しい通知があればここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
