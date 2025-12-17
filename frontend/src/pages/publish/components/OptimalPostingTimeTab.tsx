import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  TrendingUp,
  Calendar,
  Lightbulb,
  Loader2,
  AlertCircle,
  Star,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { optimizationService } from '../../../services/optimization';
import { toast } from '../../../components/common';
import type { PostingTimeAnalysis } from '../../../types';

interface OptimalPostingTimeTabProps {
  knowledgeId: string;
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

export const OptimalPostingTimeTab = ({ knowledgeId }: OptimalPostingTimeTabProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [selectedSlot, setSelectedSlot] = useState<{ day: number; hour: number } | null>(null);

  // Posting time analysis query
  const {
    data: analysisData,
    isLoading,
    error,
  } = useQuery<PostingTimeAnalysis | null>({
    queryKey: ['optimization', 'posting-time', knowledgeId],
    queryFn: () => optimizationService.getPostingTimeAnalysis(knowledgeId),
    enabled: !!knowledgeId,
  });

  // Create analysis mutation
  const createAnalysisMutation = useMutation({
    mutationFn: () =>
      optimizationService.createPostingTimeAnalysis({
        knowledgeId,
        analysisPeriodDays: 90,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization', 'posting-time', knowledgeId] });
      toast.success('分析を更新しました');
    },
    onError: () => {
      toast.error('分析の更新に失敗しました');
    },
  });

  const getHeatmapColor = (value: number | undefined) => {
    if (!value) return isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
    if (value >= 0.8) return 'bg-green-500';
    if (value >= 0.6) return 'bg-green-400';
    if (value >= 0.4) return 'bg-yellow-400';
    if (value >= 0.2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>最適投稿時間を分析中...</span>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="px-8 pb-12">
        <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50')}>
          <AlertCircle size={32} className="text-yellow-500 mx-auto mb-3" />
          <p className={cn('mb-4', themeClasses.text)}>投稿時間の分析データがありません</p>
          <button
            onClick={() => createAnalysisMutation.mutate()}
            disabled={createAnalysisMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 mx-auto"
          >
            <RefreshCw size={16} className={createAnalysisMutation.isPending ? 'animate-spin' : ''} />
            {createAnalysisMutation.isPending ? '分析中...' : '分析を開始'}
          </button>
        </div>
      </div>
    );
  }

  const heatmapData = analysisData.heatmapData ?? [];
  const recommendedSlots = analysisData.recommendedSlots ?? [];

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>最適投稿時間</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            曜日・時間帯ごとのパフォーマンス分析
          </p>
        </div>
        <button
          onClick={() => createAnalysisMutation.mutate()}
          disabled={createAnalysisMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={createAnalysisMutation.isPending ? 'animate-spin' : ''} />
          {createAnalysisMutation.isPending ? '更新中...' : '分析を更新'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div
          className={cn(
            'p-5 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="mb-3 text-blue-500">
            <Calendar size={20} />
          </div>
          <p className={cn('text-2xl font-bold', themeClasses.text)}>
            {analysisData.optimalDayOfWeek !== undefined ? DAY_NAMES[analysisData.optimalDayOfWeek] : '-'}
          </p>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>最適曜日</p>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="mb-3 text-green-500">
            <Clock size={20} />
          </div>
          <p className={cn('text-2xl font-bold', themeClasses.text)}>
            {analysisData.optimalHour !== undefined ? `${analysisData.optimalHour}:${analysisData.optimalMinute.toString().padStart(2, '0')}` : '-'}
          </p>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>最適時刻</p>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="mb-3 text-yellow-500">
            <TrendingUp size={20} />
          </div>
          <p className={cn('text-2xl font-bold', getScoreColor(analysisData.confidenceScore ?? 0))}>
            {analysisData.confidenceScore ? (analysisData.confidenceScore * 100).toFixed(0) : '-'}%
          </p>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>信頼度スコア</p>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="mb-3 text-purple-500">
            <Star size={20} />
          </div>
          <p className={cn('text-2xl font-bold', themeClasses.text)}>
            {analysisData.sampleSize.toLocaleString()}
          </p>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>分析動画数</p>
        </div>
      </div>

      {/* Heatmap */}
      <div
        className={cn(
          'p-6 rounded-2xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <h3 className={cn('text-lg font-bold mb-4', themeClasses.text)}>
          投稿時間ヒートマップ
        </h3>
        <p className={cn('text-sm mb-4', themeClasses.textSecondary)}>
          濃い緑ほどパフォーマンスが高い時間帯
        </p>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels */}
            <div className="flex mb-2">
              <div className="w-12"></div>
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className={cn('w-8 text-center text-xs', themeClasses.textSecondary)}
                >
                  {i}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {DAY_NAMES.map((dayName, dayIndex) => (
              <div key={dayIndex} className="flex mb-1">
                <div className={cn('w-12 text-sm flex items-center', themeClasses.text)}>
                  {dayName}
                </div>
                {Array.from({ length: 24 }, (_, hourIndex) => {
                  const value = heatmapData[dayIndex]?.[hourIndex];
                  const isOptimal =
                    analysisData.optimalDayOfWeek === dayIndex &&
                    analysisData.optimalHour === hourIndex;
                  const isRecommended = recommendedSlots.some(
                    (slot) => slot.day === dayIndex && slot.hour === hourIndex
                  );
                  const isSelected =
                    selectedSlot?.day === dayIndex && selectedSlot?.hour === hourIndex;

                  return (
                    <button
                      key={hourIndex}
                      onClick={() => setSelectedSlot({ day: dayIndex, hour: hourIndex })}
                      className={cn(
                        'w-8 h-8 rounded transition-all hover:scale-110 relative',
                        getHeatmapColor(value),
                        isSelected && 'ring-2 ring-blue-500 scale-110'
                      )}
                      title={`${dayName} ${hourIndex}:00 - スコア: ${value ? (value * 100).toFixed(0) : 'N/A'}%`}
                    >
                      {isOptimal && (
                        <Star
                          size={12}
                          className="absolute inset-0 m-auto text-white fill-white"
                        />
                      )}
                      {isRecommended && !isOptimal && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className={themeClasses.textSecondary}>高パフォーマンス</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400"></div>
            <span className={themeClasses.textSecondary}>中パフォーマンス</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-400"></div>
            <span className={themeClasses.textSecondary}>低パフォーマンス</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className={themeClasses.textSecondary}>最適時間</span>
          </div>
        </div>
      </div>

      {/* Recommended Slots */}
      <div
        className={cn(
          'p-6 rounded-2xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb size={20} className="text-yellow-500" />
          <h3 className={cn('text-lg font-bold', themeClasses.text)}>
            推奨投稿時間 (上位5枠)
          </h3>
        </div>

        <div className="space-y-3">
          {recommendedSlots.slice(0, 5).map((slot, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-xl border',
                isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      index === 0
                        ? 'bg-yellow-500 text-white'
                        : index === 1
                        ? 'bg-slate-400 text-white'
                        : index === 2
                        ? 'bg-orange-600 text-white'
                        : isDarkMode
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    )}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className={cn('font-bold', themeClasses.text)}>
                      {DAY_NAMES[slot.day]} {slot.hour}:00
                    </p>
                    {slot.reasoning && (
                      <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
                        {slot.reasoning}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('text-2xl font-bold', getScoreColor(slot.score))}>
                    {(slot.score * 100).toFixed(0)}
                  </p>
                  <p className={cn('text-xs', themeClasses.textSecondary)}>スコア</p>
                </div>
              </div>
            </div>
          ))}

          {recommendedSlots.length === 0 && (
            <p className={cn('text-center py-4', themeClasses.textSecondary)}>
              推奨時間がありません
            </p>
          )}
        </div>
      </div>

      {/* Day Performance */}
      {analysisData.dayPerformance && analysisData.dayPerformance.length > 0 && (
        <div
          className={cn(
            'p-6 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <h3 className={cn('text-lg font-bold mb-4', themeClasses.text)}>
            曜日別パフォーマンス
          </h3>
          <div className="space-y-2">
            {analysisData.dayPerformance.map((dayPerf) => {
              const maxViews = Math.max(...analysisData.dayPerformance!.map((d) => d.avgViews));
              const percentage = (dayPerf.avgViews / maxViews) * 100;

              return (
                <div key={dayPerf.day}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-sm font-medium', themeClasses.text)}>
                      {DAY_NAMES[dayPerf.day]}
                    </span>
                    <span className={cn('text-sm', themeClasses.textSecondary)}>
                      平均 {dayPerf.avgViews.toLocaleString()} 回再生
                    </span>
                  </div>
                  <div className={cn('h-2 rounded-full', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
