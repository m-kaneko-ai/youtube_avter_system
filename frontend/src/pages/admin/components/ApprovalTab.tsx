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
  ChevronDown,
  Loader2,
  AlertCircle,
  User,
  Calendar,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { adminService, type ApprovalStatus, type ApprovalType } from '../../../services/admin';
import { Modal, toast } from '../../../components/common';

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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<typeof approvals[0] | null>(null);

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

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleViewDetail = (approval: typeof approvals[0]) => {
    setSelectedApproval(approval);
    setShowDetailModal(true);
  };

  const handleApprove = (approval: typeof approvals[0]) => {
    if (confirm(`「${approval.title}」を承認してもよろしいですか?`)) {
      toast.success('承認しました');
    }
  };

  const handleReject = (approval: typeof approvals[0]) => {
    if (confirm(`「${approval.title}」を却下してもよろしいですか?`)) {
      toast.success('却下しました');
    }
  };

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
                    <button
                      onClick={() => handleViewDetail(approval)}
                      className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                      title="確認"
                    >
                      <Eye size={18} className={themeClasses.textSecondary} />
                    </button>
                    <button
                      onClick={() => handleApprove(approval)}
                      className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                      title="承認"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button
                      onClick={() => handleReject(approval)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      title="却下"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => toggleExpand(approval.id)}
                  className={cn('p-2 rounded-lg transition-all', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                >
                  {expandedItems.has(approval.id) ? (
                    <ChevronDown size={18} className={themeClasses.textSecondary} />
                  ) : (
                    <ChevronRight size={18} className={themeClasses.textSecondary} />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedItems.has(approval.id) && (
              <div className={cn('mt-4 pt-4 border-t', isDarkMode ? 'border-slate-700' : 'border-slate-200')}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>申請者</p>
                    <div className="flex items-center gap-2">
                      <User size={16} className={themeClasses.textSecondary} />
                      <span className={cn('text-sm', themeClasses.text)}>{approval.requestedBy}</span>
                    </div>
                  </div>
                  <div>
                    <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>申請日時</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className={themeClasses.textSecondary} />
                      <span className={cn('text-sm', themeClasses.text)}>{approval.requestedAt}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>説明</p>
                    <p className={cn('text-sm', themeClasses.text)}>
                      この{TYPE_CONFIG[approval.type].label}の承認をお願いします。内容を確認の上、承認または却下してください。
                    </p>
                  </div>
                  {approval.comments && (
                    <div className="col-span-2">
                      <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>コメント</p>
                      <div className={cn('p-3 rounded-lg text-sm', isDarkMode ? 'bg-slate-800' : 'bg-slate-50')}>
                        <MessageSquare size={14} className="inline mr-2" />
                        {approval.comments}件のコメント
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleViewDetail(approval)}
                    className={cn('flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors', isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
                  >
                    詳細を確認
                  </button>
                  {approval.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(approval)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold"
                      >
                        承認
                      </button>
                      <button
                        onClick={() => handleReject(approval)}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold"
                      >
                        却下
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredApprovals.length === 0 && (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            該当する承認リクエストがありません
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApproval && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedApproval(null);
          }}
          title={selectedApproval.title}
          size="lg"
          footer={
            selectedApproval.status === 'pending' ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedApproval(null);
                  }}
                  className={cn('flex-1 px-4 py-2 rounded-xl text-sm font-medium', isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700')}
                >
                  閉じる
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedApproval);
                    setShowDetailModal(false);
                    setSelectedApproval(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold"
                >
                  却下
                </button>
                <button
                  onClick={() => {
                    handleApprove(selectedApproval);
                    setShowDetailModal(false);
                    setSelectedApproval(null);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold"
                >
                  承認
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedApproval(null);
                }}
                className={cn('w-full px-4 py-2 rounded-xl text-sm font-medium', isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700')}
              >
                閉じる
              </button>
            )
          }
        >
          <div className="space-y-4">
            {/* Type & Status */}
            <div className="flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium', TYPE_CONFIG[selectedApproval.type].color)}>
                {TYPE_CONFIG[selectedApproval.type].icon}
                {TYPE_CONFIG[selectedApproval.type].label}
              </span>
              <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium', STATUS_CONFIG[selectedApproval.status].color)}>
                {STATUS_CONFIG[selectedApproval.status].icon}
                {STATUS_CONFIG[selectedApproval.status].label}
              </span>
            </div>

            {/* Details */}
            <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-50')}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>申請者</p>
                  <p className={cn('text-sm', themeClasses.text)}>{selectedApproval.requestedBy}</p>
                </div>
                <div>
                  <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>申請日時</p>
                  <p className={cn('text-sm', themeClasses.text)}>{selectedApproval.requestedAt}</p>
                </div>
                <div>
                  <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>優先度</p>
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', PRIORITY_CONFIG[selectedApproval.priority].color)} />
                    <span className={cn('text-sm', themeClasses.text)}>{PRIORITY_CONFIG[selectedApproval.priority].label}</span>
                  </div>
                </div>
                {selectedApproval.comments && (
                  <div>
                    <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>コメント数</p>
                    <p className={cn('text-sm', themeClasses.text)}>{selectedApproval.comments}件</p>
                  </div>
                )}
              </div>
            </div>

            {/* Content Preview */}
            <div>
              <p className={cn('text-sm font-medium mb-2', themeClasses.text)}>プレビュー</p>
              <div className={cn('p-6 rounded-xl border-2 border-dashed text-center', isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50')}>
                <div className={cn('mb-2', TYPE_CONFIG[selectedApproval.type].color)}>
                  {TYPE_CONFIG[selectedApproval.type].icon}
                </div>
                <p className={cn('text-sm', themeClasses.textSecondary)}>
                  {selectedApproval.type === 'script' && '台本のプレビューがここに表示されます'}
                  {selectedApproval.type === 'thumbnail' && 'サムネイルのプレビューがここに表示されます'}
                  {selectedApproval.type === 'video' && '動画のプレビューがここに表示されます'}
                  {selectedApproval.type === 'publish' && '公開設定のプレビューがここに表示されます'}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
