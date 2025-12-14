import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Video,
  Eye,
  Plus,
  Calendar,
  BarChart3,
  Play,
  Clock,
  MoreHorizontal,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { analyticsService, type Series } from '../../../services/analytics';

type SeriesStatus = Series['status'];

const STATUS_CONFIG: Record<SeriesStatus, { label: string; color: string }> = {
  active: { label: '進行中', color: 'text-green-500 bg-green-500/10' },
  completed: { label: '完結', color: 'text-blue-500 bg-blue-500/10' },
  paused: { label: '休止中', color: 'text-yellow-500 bg-yellow-500/10' },
};

export const SeriesTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [statusFilter, setStatusFilter] = useState<'all' | SeriesStatus>('all');

  // Series query
  const {
    data: seriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['analytics', 'series', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () => analyticsService.getSeries(statusFilter === 'all' ? undefined : statusFilter),
  });

  const seriesList = seriesData?.series ?? [];

  const filteredSeries = statusFilter === 'all'
    ? seriesList
    : seriesList.filter((s) => s.status === statusFilter);

  const totalVideos = seriesList.reduce((sum, s) => sum + s.videoCount, 0);
  const totalViews = seriesList.reduce((sum, s) => sum + s.totalViews, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>シリーズデータを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mx-8 p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">シリーズデータの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>シリーズ管理</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            コンテンツシリーズの一元管理
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
          <Plus size={16} />
          新規シリーズ作成
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '総シリーズ', value: seriesList.length, icon: <Layers size={20} />, color: 'text-blue-500' },
          { label: '進行中', value: seriesList.filter((s) => s.status === 'active').length, icon: <Play size={20} />, color: 'text-green-500' },
          { label: '総動画数', value: totalVideos, icon: <Video size={20} />, color: 'text-purple-500' },
          { label: '総再生数', value: `${(totalViews / 10000).toFixed(0)}万`, icon: <Eye size={20} />, color: 'text-pink-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-5 rounded-2xl border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className={cn('mb-3', stat.color)}>{stat.icon}</div>
            <p className={cn('text-2xl font-bold', themeClasses.text)}>{stat.value}</p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className={cn('flex p-1 rounded-xl w-fit', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
        {[
          { id: 'all' as const, label: 'すべて' },
          { id: 'active' as const, label: '進行中' },
          { id: 'completed' as const, label: '完結' },
          { id: 'paused' as const, label: '休止中' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              statusFilter === f.id
                ? cn(themeClasses.cardBg, 'shadow-sm', themeClasses.text)
                : themeClasses.textSecondary
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Series List */}
      <div className="space-y-4">
        {filteredSeries.map((series) => (
          <div
            key={series.id}
            className={cn(
              'p-6 rounded-2xl border transition-all hover:shadow-md',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="flex items-start gap-5">
              {/* Thumbnail Placeholder */}
              <div className={cn(
                'w-40 h-24 rounded-xl flex items-center justify-center shrink-0',
                isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
              )}>
                <Layers size={32} className={themeClasses.textSecondary} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={cn('font-bold text-lg', themeClasses.text)}>{series.name}</h3>
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_CONFIG[series.status].color)}>
                    {STATUS_CONFIG[series.status].label}
                  </span>
                </div>
                <p className={cn('text-sm mb-4', themeClasses.textSecondary)}>
                  {series.description}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-blue-500" />
                    <span className={cn('text-sm', themeClasses.text)}>
                      <span className="font-bold">{series.videoCount}</span> 本
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-pink-500" />
                    <span className={cn('text-sm', themeClasses.text)}>
                      <span className="font-bold">{(series.totalViews / 10000).toFixed(0)}万</span> 再生
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-green-500" />
                    <span className={cn('text-sm', themeClasses.text)}>
                      維持率 <span className="font-bold">{series.avgRetention}%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
                )}>
                  <Plus size={16} />
                  動画追加
                </button>
                <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                  <Settings size={18} className={themeClasses.textSecondary} />
                </button>
                <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                  <MoreHorizontal size={18} className={themeClasses.textSecondary} />
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className={cn(
              'flex items-center gap-4 mt-4 pt-4 border-t text-xs',
              isDarkMode ? 'border-slate-700' : 'border-slate-200',
              themeClasses.textSecondary
            )}>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                開始: {series.createdAt}
              </span>
              {series.lastVideoAt && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  最終投稿: {series.lastVideoAt}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSeries.length === 0 && (
        <div className={cn('text-center py-12', themeClasses.textSecondary)}>
          該当するシリーズがありません
        </div>
      )}
    </div>
  );
};
