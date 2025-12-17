import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { adminService } from '../../../services/admin';
import { Modal, toast } from '../../../components/common';

type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'generate';

interface AuditLog {
  id: string;
  user_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  extra_data?: Record<string, unknown>;
  created_at: string;
}

const ACTION_CONFIG: Record<
  AuditAction,
  { label: string; color: string; bgColor: string }
> = {
  create: { label: '作成', color: 'text-green-600', bgColor: 'bg-green-500/10' },
  read: { label: '参照', color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  update: { label: '更新', color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
  delete: { label: '削除', color: 'text-red-600', bgColor: 'bg-red-500/10' },
  login: { label: 'ログイン', color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
  logout: { label: 'ログアウト', color: 'text-slate-600', bgColor: 'bg-slate-500/10' },
  export: { label: 'エクスポート', color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
  generate: { label: '生成', color: 'text-teal-600', bgColor: 'bg-teal-500/10' },
};

export const AuditLogTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [filterAction, setFilterAction] = useState<AuditAction | undefined>();
  const [filterResourceType, setFilterResourceType] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Audit logs query
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'audit-logs', page, pageSize, filterAction, filterResourceType],
    queryFn: () => adminService.getAuditLogs(page, pageSize, filterAction, filterResourceType),
  });

  const logs = logsData?.logs ?? [];
  const total = logsData?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleExport = () => {
    toast.info('エクスポート機能は近日実装予定です');
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>監査ログを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">監査ログの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
            )}
          >
            <FileText size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', themeClasses.textPrimary)}>
              監査ログ
            </h1>
            <p className={themeClasses.textSecondary}>
              システムの操作履歴を確認します
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            )}
          >
            <RefreshCw size={18} />
            <span>更新</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
              showFilters
                ? 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            )}
          >
            <Filter size={18} />
            <span>フィルター</span>
          </button>

          <button
            onClick={handleExport}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            )}
          >
            <Download size={18} />
            <span>エクスポート</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className={cn(
            'p-4 rounded-2xl',
            isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
          )}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.textPrimary)}>
                アクション
              </label>
              <select
                value={filterAction ?? ''}
                onChange={(e) => setFilterAction(e.target.value as AuditAction || undefined)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/50'
                    : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                )}
              >
                <option value="">すべて</option>
                {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.textPrimary)}>
                リソース種別
              </label>
              <input
                type="text"
                value={filterResourceType ?? ''}
                onChange={(e) => setFilterResourceType(e.target.value || undefined)}
                placeholder="例: video, user, project"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/50'
                    : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div
        className={cn(
          'rounded-2xl overflow-hidden',
          isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
        )}
      >
        <table className="w-full">
          <thead className={isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}>
            <tr>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                日時
              </th>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                アクション
              </th>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                リソース
              </th>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                説明
              </th>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                IPアドレス
              </th>
              <th
                className={cn(
                  'text-right px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className={cn('text-center py-12', themeClasses.textSecondary)}
                >
                  監査ログがありません
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actionConfig = ACTION_CONFIG[log.action];
                return (
                  <tr
                    key={log.id}
                    className={cn(
                      'border-t transition-colors',
                      isDarkMode
                        ? 'border-slate-700 hover:bg-slate-700/30'
                        : 'border-slate-100 hover:bg-slate-50'
                    )}
                  >
                    <td className={cn('px-6 py-4 text-sm', themeClasses.textSecondary)}>
                      {new Date(log.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium',
                          actionConfig.color,
                          actionConfig.bgColor
                        )}
                      >
                        {actionConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className={cn('text-sm font-medium', themeClasses.textPrimary)}>
                          {log.resource_type}
                        </div>
                        {log.resource_id && (
                          <div className={cn('text-xs', themeClasses.textSecondary)}>
                            ID: {log.resource_id}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={cn('px-6 py-4 text-sm', themeClasses.textSecondary)}>
                      {log.description || '-'}
                    </td>
                    <td className={cn('px-6 py-4 text-sm font-mono', themeClasses.textSecondary)}>
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isDarkMode
                              ? 'hover:bg-slate-700 text-slate-400'
                              : 'hover:bg-slate-100 text-slate-600'
                          )}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className={themeClasses.textSecondary}>
            {total}件中 {(page - 1) * pageSize + 1}〜{Math.min(page * pageSize, total)}件を表示
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                'p-2 rounded-lg transition-colors',
                page === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                  ? 'hover:bg-slate-700 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
              )}
            >
              <ChevronLeft size={18} />
            </button>

            <span className={themeClasses.textSecondary}>
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                'p-2 rounded-lg transition-colors',
                page === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                  ? 'hover:bg-slate-700 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
              )}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="ログ詳細"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div>
              <label className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                日時
              </label>
              <p className={themeClasses.textPrimary}>
                {new Date(selectedLog.created_at).toLocaleString('ja-JP')}
              </p>
            </div>

            <div>
              <label className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                アクション
              </label>
              <p className={themeClasses.textPrimary}>
                {ACTION_CONFIG[selectedLog.action].label}
              </p>
            </div>

            <div>
              <label className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                リソース種別
              </label>
              <p className={themeClasses.textPrimary}>{selectedLog.resource_type}</p>
            </div>

            {selectedLog.resource_id && (
              <div>
                <label className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                  リソースID
                </label>
                <p className={cn('font-mono text-sm', themeClasses.textPrimary)}>
                  {selectedLog.resource_id}
                </p>
              </div>
            )}

            {selectedLog.description && (
              <div>
                <label className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                  説明
                </label>
                <p className={themeClasses.textPrimary}>{selectedLog.description}</p>
              </div>
            )}

            {selectedLog.ip_address && (
              <div>
                <label className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                  IPアドレス
                </label>
                <p className={cn('font-mono text-sm', themeClasses.textPrimary)}>
                  {selectedLog.ip_address}
                </p>
              </div>
            )}

            {selectedLog.user_agent && (
              <div>
                <label className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                  ユーザーエージェント
                </label>
                <p className={cn('text-sm', themeClasses.textPrimary)}>
                  {selectedLog.user_agent}
                </p>
              </div>
            )}

            {selectedLog.extra_data && Object.keys(selectedLog.extra_data).length > 0 && (
              <div>
                <label className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                  追加データ
                </label>
                <pre
                  className={cn(
                    'mt-2 p-3 rounded-lg text-xs font-mono overflow-auto',
                    isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {JSON.stringify(selectedLog.extra_data, null, 2)}
                </pre>
              </div>
            )}

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all"
            >
              閉じる
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
