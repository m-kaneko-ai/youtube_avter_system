import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link as LinkIcon,
  Plus,
  TestTube,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { adminService } from '../../../services/admin';
import { Modal, toast } from '../../../components/common';

type ApiConnectionStatus = 'active' | 'inactive' | 'error';

interface ApiConnection {
  id: string;
  name: string;
  service: string;
  client_id?: string;
  status: ApiConnectionStatus;
  settings?: Record<string, unknown>;
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

const SERVICE_CONFIG: Record<string, { label: string; icon: string }> = {
  youtube: { label: 'YouTube', icon: '🎥' },
  tiktok: { label: 'TikTok', icon: '🎵' },
  instagram: { label: 'Instagram', icon: '📷' },
  claude: { label: 'Claude AI', icon: '🤖' },
  gemini: { label: 'Gemini AI', icon: '✨' },
  heygen: { label: 'HeyGen', icon: '👤' },
  minimax: { label: 'MiniMax Audio', icon: '🔊' },
  veo: { label: 'Veo', icon: '🎬' },
  serpapi: { label: 'SerpAPI', icon: '🔍' },
  socialblade: { label: 'Social Blade', icon: '📊' },
};

const STATUS_CONFIG: Record<
  ApiConnectionStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  active: { label: 'アクティブ', color: 'text-green-500', icon: <CheckCircle2 size={18} /> },
  inactive: { label: '無効', color: 'text-slate-400', icon: <Clock size={18} /> },
  error: { label: 'エラー', color: 'text-red-500', icon: <XCircle size={18} /> },
};

export const APIConnectionsTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Connections query
  const {
    data: connectionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'connections'],
    queryFn: () => adminService.getConnections(),
  });

  const connections = connectionsData?.connections ?? [];

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: (connectionId: string) => adminService.testConnection(connectionId),
    onSuccess: (data) => {
      if (data.status === 'active') {
        toast.success('接続テストに成功しました');
      } else {
        toast.error(`接続テストに失敗しました: ${data.message}`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'connections'] });
      setTestingConnection(null);
    },
    onError: (error: Error) => {
      toast.error(`接続テストに失敗しました: ${error.message}`);
      setTestingConnection(null);
    },
  });

  // Delete connection mutation
  const deleteMutation = useMutation({
    mutationFn: (connectionId: string) => adminService.deleteConnection(connectionId),
    onSuccess: () => {
      toast.success('API連携を削除しました');
      queryClient.invalidateQueries({ queryKey: ['admin', 'connections'] });
    },
    onError: (error: Error) => {
      toast.error(`削除に失敗しました: ${error.message}`);
    },
  });

  const handleTestConnection = (connectionId: string) => {
    setTestingConnection(connectionId);
    testMutation.mutate(connectionId);
  };

  const handleDeleteConnection = (connection: ApiConnection) => {
    if (confirm(`${connection.name}を削除してもよろしいですか?`)) {
      deleteMutation.mutate(connection.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>API連携を読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">API連携の読み込みに失敗しました</p>
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
            <LinkIcon size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', themeClasses.textPrimary)}>
              API連携管理
            </h1>
            <p className={themeClasses.textSecondary}>
              外部サービスとの連携状態を管理します
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all"
          >
            <Plus size={18} />
            <span>新規連携</span>
          </button>
        </div>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.length === 0 ? (
          <div
            className={cn(
              'col-span-full text-center py-12 rounded-2xl',
              isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
            )}
          >
            <p className={themeClasses.textSecondary}>API連携がありません</p>
          </div>
        ) : (
          connections.map((connection) => {
            const serviceConfig = SERVICE_CONFIG[connection.service] || {
              label: connection.service,
              icon: '🔗',
            };
            const statusConfig = STATUS_CONFIG[connection.status];
            const isTesting = testingConnection === connection.id;

            return (
              <div
                key={connection.id}
                className={cn(
                  'p-6 rounded-2xl transition-all',
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700/80'
                    : 'bg-white hover:shadow-md border border-slate-200'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{serviceConfig.icon}</div>
                    <div>
                      <h3 className={cn('font-semibold', themeClasses.textPrimary)}>
                        {connection.name}
                      </h3>
                      <p className={cn('text-sm', themeClasses.textSecondary)}>
                        {serviceConfig.label}
                      </p>
                    </div>
                  </div>
                  <div className={cn('flex items-center gap-2', statusConfig.color)}>
                    {statusConfig.icon}
                    <span className="text-sm font-medium">{statusConfig.label}</span>
                  </div>
                </div>

                {/* Error Message */}
                {connection.error_message && (
                  <div
                    className={cn(
                      'mb-4 p-3 rounded-lg text-sm',
                      isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
                    )}
                  >
                    {connection.error_message}
                  </div>
                )}

                {/* Last Sync */}
                {connection.last_sync_at && (
                  <div className={cn('text-sm mb-4', themeClasses.textSecondary)}>
                    最終同期: {new Date(connection.last_sync_at).toLocaleString('ja-JP')}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(connection.id)}
                    disabled={isTesting || testMutation.isPending}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all',
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
                      (isTesting || testMutation.isPending) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">テスト中...</span>
                      </>
                    ) : (
                      <>
                        <TestTube size={16} />
                        <span className="text-sm">テスト</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toast.info('編集機能は近日追加予定です')}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      isDarkMode
                        ? 'hover:bg-slate-700 text-slate-400'
                        : 'hover:bg-slate-100 text-slate-600'
                    )}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDeleteConnection(connection)}
                    disabled={deleteMutation.isPending}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      'hover:bg-red-500/10 text-red-500',
                      deleteMutation.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新規API連携"
      >
        <div className="space-y-4">
          <p className={themeClasses.textSecondary}>
            新規API連携の追加機能は近日実装予定です。
          </p>
          <button
            onClick={() => setShowCreateModal(false)}
            className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all"
          >
            閉じる
          </button>
        </div>
      </Modal>
    </div>
  );
};
