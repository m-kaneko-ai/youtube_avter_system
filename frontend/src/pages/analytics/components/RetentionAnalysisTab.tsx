import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { optimizationService } from '../../../services/optimization';
import type { RetentionAnalysisResponse, RetentionEvent } from '../../../types';

interface RetentionAnalysisTabProps {
  videoId: string;
}

export const RetentionAnalysisTab = ({ videoId }: RetentionAnalysisTabProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [showDropPoints, setShowDropPoints] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Retention analysis query
  const {
    data: analysisData,
    isLoading,
    error,
  } = useQuery<RetentionAnalysisResponse | null>({
    queryKey: ['optimization', 'retention', videoId],
    queryFn: () => optimizationService.analyzeRetention(videoId, true),
    enabled: !!videoId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>リテンション分析中...</span>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className={cn('mx-8 p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">リテンションデータの読み込みに失敗しました</p>
      </div>
    );
  }

  const { curve, dropPoints, recommendations, overallScore, comparisonToAverage } = analysisData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEventIcon = (eventType: RetentionEvent['eventType']) => {
    switch (eventType) {
      case 'drop':
        return <TrendingDown size={16} className="text-red-500" />;
      case 'recovery':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'stable':
        return <Clock size={16} className="text-blue-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div>
        <h2 className={cn('text-xl font-bold', themeClasses.text)}>リテンション分析</h2>
        <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
          視聴維持率の詳細分析と改善提案
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div
          className={cn(
            'p-5 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <p className={cn('text-sm mb-2', themeClasses.textSecondary)}>総合スコア</p>
          <p className={cn('text-3xl font-bold', getScoreColor(overallScore))}>
            {overallScore.toFixed(1)}
          </p>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>/ 100</p>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <p className={cn('text-sm mb-2', themeClasses.textSecondary)}>平均視聴率</p>
          <p className={cn('text-3xl font-bold', themeClasses.text)}>
            {curve.avgViewPercentage?.toFixed(1) ?? '-'}%
          </p>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
            {comparisonToAverage > 0 ? '+' : ''}{comparisonToAverage.toFixed(1)}% vs 平均
          </p>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <p className={cn('text-sm mb-2', themeClasses.textSecondary)}>フック維持率</p>
          <p className={cn('text-3xl font-bold', themeClasses.text)}>
            {curve.hookRetention?.toFixed(1) ?? '-'}%
          </p>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>最初の15秒</p>
        </div>

        <div
          className={cn(
            'p-5 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <p className={cn('text-sm mb-2', themeClasses.textSecondary)}>エンド維持率</p>
          <p className={cn('text-3xl font-bold', themeClasses.text)}>
            {curve.endRetention?.toFixed(1) ?? '-'}%
          </p>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>最後の20%</p>
        </div>
      </div>

      {/* Retention Curve Visualization */}
      <div
        className={cn(
          'p-6 rounded-2xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <h3 className={cn('text-lg font-bold mb-4', themeClasses.text)}>
          視聴維持率グラフ
        </h3>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {curve.dataPoints.map((point, index) => {
              const height = point.retentionRate;
              const isDropPoint = curve.majorDropPoints?.some(
                (dp) => Math.abs(dp.timestamp - point.timestamp) < 1
              );
              return (
                <div
                  key={index}
                  className={cn(
                    'flex-1 rounded-t transition-all hover:opacity-80',
                    isDropPoint
                      ? 'bg-gradient-to-t from-red-500 to-red-400'
                      : 'bg-gradient-to-t from-blue-500 to-indigo-400'
                  )}
                  style={{ height: `${height}%` }}
                  title={`${formatTime(point.timestamp)}: ${height.toFixed(1)}%`}
                />
              );
            })}
          </div>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 -ml-8">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>0:00</span>
          <span>{formatTime(curve.videoLengthSeconds ?? 0)}</span>
        </div>
      </div>

      {/* Drop Points */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <button
          onClick={() => setShowDropPoints(!showDropPoints)}
          className={cn(
            'w-full p-5 flex items-center justify-between hover:bg-opacity-50 transition-all',
            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
          )}
        >
          <div className="flex items-center gap-3">
            <TrendingDown size={20} className="text-red-500" />
            <h3 className={cn('text-lg font-bold', themeClasses.text)}>
              離脱ポイント分析 ({dropPoints.length})
            </h3>
          </div>
          {showDropPoints ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showDropPoints && (
          <div className="p-5 pt-0 space-y-3">
            {dropPoints.map((event) => (
              <div
                key={event.id}
                className={cn(
                  'p-4 rounded-xl border',
                  isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getEventIcon(event.eventType)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('font-bold', themeClasses.text)}>
                        {formatTime(event.timestampSeconds)}
                      </span>
                      {event.timestampPercentage && (
                        <span className={cn('text-sm', themeClasses.textSecondary)}>
                          ({event.timestampPercentage.toFixed(1)}%)
                        </span>
                      )}
                      {event.changeRate && (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            event.changeRate < 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                          )}
                        >
                          {event.changeRate > 0 ? '+' : ''}{event.changeRate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {event.contentAtTimestamp && (
                      <p className={cn('text-sm mb-2', themeClasses.textSecondary)}>
                        コンテンツ: {event.contentAtTimestamp}
                      </p>
                    )}
                    {event.analysisNotes && (
                      <p className={cn('text-sm mb-2', themeClasses.text)}>
                        {event.analysisNotes}
                      </p>
                    )}
                    {event.recommendedAction && (
                      <div className={cn('flex items-start gap-2 p-3 rounded-lg mt-2', isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50')}>
                        <Lightbulb size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {event.recommendedAction}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {dropPoints.length === 0 && (
              <p className={cn('text-center py-4', themeClasses.textSecondary)}>
                離脱ポイントが検出されませんでした
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <button
          onClick={() => setShowRecommendations(!showRecommendations)}
          className={cn(
            'w-full p-5 flex items-center justify-between hover:bg-opacity-50 transition-all',
            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
          )}
        >
          <div className="flex items-center gap-3">
            <Lightbulb size={20} className="text-yellow-500" />
            <h3 className={cn('text-lg font-bold', themeClasses.text)}>
              改善提案 ({recommendations.length})
            </h3>
          </div>
          {showRecommendations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showRecommendations && (
          <div className="p-5 pt-0 space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-xl border',
                  isDarkMode ? 'bg-yellow-900/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
                )}
              >
                <p className={cn('text-sm', themeClasses.text)}>{rec}</p>
              </div>
            ))}

            {recommendations.length === 0 && (
              <p className={cn('text-center py-4', themeClasses.textSecondary)}>
                改善提案がありません
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
