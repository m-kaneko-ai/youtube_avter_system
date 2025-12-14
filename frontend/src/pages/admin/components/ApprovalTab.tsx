import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Video,
  Image,
  Send,
  Eye,
  MessageSquare,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { adminService, type ApprovalStatus, type ApprovalType } from '../../../services/admin';

const TYPE_CONFIG: Record<ApprovalType, { label: string; icon: React.ReactNode; color: string }> = {
  script: { label: '台本', icon: <FileText size={16} />, color: 'text-blue-500 bg-blue-500/10' },
  thumbnail: { label: 'サムネイル', icon: <Image size={16} />, color: 'text-purple-500 bg-purple-500/10' },
  video: { label: '動画', icon: <Video size={16} />, color: 'text-pink-500 bg-pink-500/10' },
  publish: { label: '公開', icon: <Send size={16} />, color: 'text-green-500 bg-green-500/10' },
};

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '承認待ち', color: 'text-yellow-500 bg-yellow-500/10', icon: <Clock size={14} /> },
  approved: { label: '承認済み', color: 'text-green-500 bg-green-500/10', icon: <CheckCircle2 size={14} /> },
  rejected: { label: '却下', color: 'text-red-500 bg-red-500/10', icon: <XCircle size={14} /> },
};

const PRIORITY_CONFIG = {
  high: { label: '高', color: 'bg-red-500' },
  normal: { label: '中', color: 'bg-yellow-500' },
  low: { label: '低', color: 'bg-slate-400' },
};

export const ApprovalTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [filter, setFilter] = useState<'all' | ApprovalStatus>('all');

  // Approvals query
  const {
    data: approvalsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'approvals'],
    queryFn: () => adminService.getApprovals(),
  });

  const approvals = approvalsData?.approvals ?? [];
  const filteredApprovals = filter === 'all' ? approvals : approvals.filter((a) => a.status === filter);
  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-yellow-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>承認リクエストを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">承認リクエストの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>承認ワークフロー</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            {pendingCount}件の承認待ち
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '承認待ち', count: pendingCount, color: 'text-yellow-500', filter: 'pending' as const },
          { label: '承認済み', count: approvals.filter((a) => a.status === 'approved').length, color: 'text-green-500', filter: 'approved' as const },
          { label: '却下', count: approvals.filter((a) => a.status === 'rejected').length, color: 'text-red-500', filter: 'rejected' as const },
          { label: '合計', count: approvals.length, color: themeClasses.text, filter: 'all' as const },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setFilter(stat.filter)}
            className={cn(
              'p-4 rounded-xl text-center transition-all',
              filter === stat.filter
                ? isDarkMode
                  ? 'bg-blue-900/30 ring-2 ring-blue-500'
                  : 'bg-blue-50 ring-2 ring-blue-500'
                : isDarkMode
                ? 'bg-slate-800/50 hover:bg-slate-800'
                : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.count}</p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Approval List */}
      <div className="space-y-3">
        {filteredApprovals.map((approval) => (
          <div
            key={approval.id}
            className={cn(
              'p-5 rounded-2xl border transition-all hover:shadow-md',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="flex items-start gap-4">
              {/* Priority indicator */}
              <div className={cn('w-1 h-16 rounded-full', PRIORITY_CONFIG[approval.priority].color)} />

              {/* Type icon */}
              <div className={cn('p-2 rounded-xl', TYPE_CONFIG[approval.type].color)}>
                {TYPE_CONFIG[approval.type].icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={cn('font-medium', themeClasses.text)}>{approval.title}</h4>
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', TYPE_CONFIG[approval.type].color)}>
                    {TYPE_CONFIG[approval.type].label}
                  </span>
                </div>
                <div className={cn('flex items-center gap-3 text-sm', themeClasses.textSecondary)}>
                  <span>申請者: {approval.requestedBy}</span>
                  <span>{approval.requestedAt}</span>
                  {approval.comments && (
                    <span className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      {approval.comments}
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3">
                <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium', STATUS_CONFIG[approval.status].color)}>
                  {STATUS_CONFIG[approval.status].icon}
                  {STATUS_CONFIG[approval.status].label}
                </span>

                {approval.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                      <Eye size={18} className={themeClasses.textSecondary} />
                    </button>
                    <button className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors">
                      <CheckCircle2 size={18} />
                    </button>
                    <button className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                      <XCircle size={18} />
                    </button>
                  </div>
                )}

                <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                  <ChevronRight size={18} className={themeClasses.textSecondary} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredApprovals.length === 0 && (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            該当する承認リクエストがありません
          </div>
        )}
      </div>
    </div>
  );
};
