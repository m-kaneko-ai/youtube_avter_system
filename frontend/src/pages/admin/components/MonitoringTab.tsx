import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Database,
  Server,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Cpu,
  MemoryStick,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  memory_available_gb: number;
  disk_free_gb: number;
}

interface DatabaseMetrics {
  connections: number;
  query_time_avg_ms: number;
  error?: string;
}

interface ExternalAPI {
  status: string;
  latency_ms?: number | null;
}

interface TaskMetrics {
  pending: number;
  running: number;
  failed_24h: number;
  completed_24h: number;
}

interface MonitoringData {
  system: SystemMetrics;
  database: DatabaseMetrics;
  external_apis: Record<string, ExternalAPI>;
  tasks: TaskMetrics;
  timestamp: number;
}

export const MonitoringTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const {
    data: monitoringData,
    isLoading,
    error,
    refetch,
  } = useQuery<MonitoringData>({
    queryKey: ['monitoring', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/v1/monitoring/dashboard');
      if (!response.ok) {
        throw new Error('モニタリングデータの取得に失敗しました');
      }
      return response.json();
    },
    refetchInterval: 30000, // 30秒ごとに自動更新
  });

  const getStatusColor = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return 'text-green-500';
    if (value < thresholds[1]) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      healthy: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle2 className="w-3 h-3" /> },
      configured: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <CheckCircle2 className="w-3 h-3" /> },
      degraded: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <AlertCircle className="w-3 h-3" /> },
      unhealthy: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlertCircle className="w-3 h-3" /> },
    };

    const config = statusConfig[status] || statusConfig.degraded;

    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
        {config.icon}
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">モニタリングデータの取得に失敗しました</p>
        </div>
      </div>
    );
  }

  const { system, database, external_apis, tasks } = monitoringData || {};

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-2xl font-bold', themeClasses.text)}>
            システムモニタリング
          </h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            システムの健全性とパフォーマンスを監視
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          )}
        >
          <RefreshCw className="w-4 h-4" />
          更新
        </button>
      </div>

      {/* システムメトリクス */}
      {system && (
        <div className={cn('p-6 rounded-xl border', themeClasses.cardBg, themeClasses.cardBorder)}>
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-blue-500" />
            <h3 className={cn('text-lg font-semibold', themeClasses.text)}>
              システムリソース
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CPU使用率 */}
            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-500" />
                  <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                    CPU使用率
                  </span>
                </div>
                <span className={cn('text-2xl font-bold', getStatusColor(system.cpu_usage, [70, 90]))}>
                  {system.cpu_usage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all',
                    system.cpu_usage < 70 ? 'bg-green-500' :
                    system.cpu_usage < 90 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(system.cpu_usage, 100)}%` }}
                />
              </div>
            </div>

            {/* メモリ使用率 */}
            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-gray-500" />
                  <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                    メモリ使用率
                  </span>
                </div>
                <span className={cn('text-2xl font-bold', getStatusColor(system.memory_usage, [70, 90]))}>
                  {system.memory_usage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all',
                    system.memory_usage < 70 ? 'bg-green-500' :
                    system.memory_usage < 90 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(system.memory_usage, 100)}%` }}
                />
              </div>
              <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
                空き: {system.memory_available_gb?.toFixed(1)} GB
              </p>
            </div>

            {/* ディスク使用率 */}
            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-500" />
                  <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                    ディスク使用率
                  </span>
                </div>
                <span className={cn('text-2xl font-bold', getStatusColor(system.disk_usage, [70, 90]))}>
                  {system.disk_usage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all',
                    system.disk_usage < 70 ? 'bg-green-500' :
                    system.disk_usage < 90 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(system.disk_usage, 100)}%` }}
                />
              </div>
              <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
                空き: {system.disk_free_gb?.toFixed(1)} GB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* データベース状態 */}
      {database && (
        <div className={cn('p-6 rounded-xl border', themeClasses.cardBg, themeClasses.cardBorder)}>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-purple-500" />
            <h3 className={cn('text-lg font-semibold', themeClasses.text)}>
              データベース
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                接続数
              </span>
              <p className={cn('text-2xl font-bold mt-1', themeClasses.text)}>
                {database.connections}
              </p>
            </div>

            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                平均クエリ時間
              </span>
              <p className={cn('text-2xl font-bold mt-1', themeClasses.text)}>
                {database.query_time_avg_ms?.toFixed(2)} ms
              </p>
            </div>
          </div>

          {database.error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{database.error}</p>
            </div>
          )}
        </div>
      )}

      {/* 外部API状態 */}
      {external_apis && Object.keys(external_apis).length > 0 && (
        <div className={cn('p-6 rounded-xl border', themeClasses.cardBg, themeClasses.cardBorder)}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-500" />
            <h3 className={cn('text-lg font-semibold', themeClasses.text)}>
              外部API連携
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(external_apis).map(([name, api]) => (
              <div
                key={name}
                className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-sm font-medium capitalize', themeClasses.text)}>
                    {name.replace('_', ' ')}
                  </span>
                  {getStatusBadge(api.status)}
                </div>
                {api.latency_ms !== null && api.latency_ms !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {api.latency_ms.toFixed(0)} ms
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* タスクキュー状態 */}
      {tasks && (
        <div className={cn('p-6 rounded-xl border', themeClasses.cardBg, themeClasses.cardBorder)}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-orange-500" />
            <h3 className={cn('text-lg font-semibold', themeClasses.text)}>
              タスクキュー
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                保留中
              </span>
              <p className={cn('text-2xl font-bold mt-1', themeClasses.text)}>
                {tasks.pending}
              </p>
            </div>

            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                実行中
              </span>
              <p className={cn('text-2xl font-bold mt-1 text-blue-500')}>
                {tasks.running}
              </p>
            </div>

            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                完了(24h)
              </span>
              <p className={cn('text-2xl font-bold mt-1 text-green-500')}>
                {tasks.completed_24h}
              </p>
            </div>

            <div className={cn('p-4 rounded-lg', isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                失敗(24h)
              </span>
              <p className={cn('text-2xl font-bold mt-1 text-red-500')}>
                {tasks.failed_24h}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 最終更新時刻 */}
      {monitoringData && (
        <div className="text-center">
          <p className={cn('text-xs', themeClasses.textSecondary)}>
            最終更新: {new Date(monitoringData.timestamp * 1000).toLocaleString('ja-JP')}
          </p>
        </div>
      )}
    </div>
  );
};
