import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Zap,
  Volume2,
  ImagePlus,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileVideo,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { productionService, type QualityIssue } from '../../../services/production';
import { toast } from '../../../components/common';

const ENHANCEMENT_FEATURES = [
  { id: '1', name: 'ノイズ除去', description: 'AIで背景ノイズを自動除去', icon: <Volume2 size={20} />, color: 'text-blue-500 bg-blue-500/10' },
  { id: '2', name: '高画質化', description: '4Kアップスケーリング', icon: <ImagePlus size={20} />, color: 'text-purple-500 bg-purple-500/10' },
  { id: '3', name: '自動カット', description: '無音・間延び部分を検出', icon: <Zap size={20} />, color: 'text-orange-500 bg-orange-500/10' },
  { id: '4', name: 'カラー補正', description: 'AIによる自動色調補正', icon: <Sparkles size={20} />, color: 'text-pink-500 bg-pink-500/10' },
];

interface QualityTabProps {
  videoId?: string;
}

export const QualityTab = ({ videoId = 'current' }: QualityTabProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  // Video for review query
  const {
    data: video,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['production', 'quality', 'video', videoId],
    queryFn: () => productionService.getVideoForReview(videoId),
  });

  const handleQualityCheck = () => {
    toast.info('品質チェックを実行しています...');
    setTimeout(() => {
      refetch();
    }, 500);
  };

  const handlePreview = () => {
    toast.info('プレビューを開きます');
  };

  const handleEnhancement = (featureName: string) => {
    toast.info(`${featureName}を適用しています...`);
  };

  const getSeverityIcon = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'low':
        return <CheckCircle2 size={18} className="text-green-500" />;
      case 'medium':
        return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'high':
        return <AlertTriangle size={18} className="text-red-500" />;
      default:
        return <Gauge size={18} className="text-slate-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>品質チェックデータを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">品質チェックデータの読み込みに失敗しました</p>
        <p className={cn('text-sm mt-2', themeClasses.textSecondary)}>動画IDを確認してください</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className={cn('p-8 rounded-2xl text-center border', themeClasses.cardBg, themeClasses.cardBorder)}>
        <FileVideo size={48} className={cn('mx-auto mb-3', themeClasses.textSecondary)} />
        <p className={themeClasses.textSecondary}>レビュー対象の動画がありません</p>
        <p className={cn('text-sm mt-2', themeClasses.textSecondary)}>動画制作タブで動画を作成してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Video Preview & Overall Score */}
      <div className="grid grid-cols-3 gap-6">
        <div
          className={cn(
            'col-span-2 p-6 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-start gap-6">
            {/* Video Preview */}
            <div className={cn('w-64 h-40 rounded-xl overflow-hidden flex items-center justify-center relative group', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
              <FileVideo size={48} className={themeClasses.textSecondary} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Play size={32} className="text-white" />
              </div>
            </div>

            {/* Video Info */}
            <div className="flex-1">
              <h3 className={cn('font-bold text-xl mb-2', themeClasses.text)}>{video.title}</h3>
              <p className={cn('text-sm mb-4', themeClasses.textSecondary)}>長さ: {video.duration}</p>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleQualityCheck}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
                >
                  <Sparkles size={16} />
                  品質チェック実行
                </button>
                <button
                  onClick={handlePreview}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors', isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
                >
                  <Play size={16} />
                  プレビュー
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div
          className={cn(
            'p-6 rounded-2xl border text-center',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <Gauge size={24} className="text-blue-500 mx-auto mb-3" />
          <p className={cn('text-sm font-medium mb-2', themeClasses.textSecondary)}>総合スコア</p>
          <div className={cn('text-5xl font-bold mb-2', getScoreColor(video.qualityScores.overall))}>
            {video.qualityScores.overall}
          </div>
          <p className={cn('text-xs', themeClasses.textSecondary)}>
            {video.qualityScores.overall >= 80 ? '公開準備OK' : '改善推奨'}
          </p>
        </div>
      </div>

      {/* Quality Checks */}
      <div
        className={cn(
          'p-6 rounded-2xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <h3 className={cn('font-bold text-lg mb-6', themeClasses.text)}>品質チェック結果</h3>

        {/* Quality Scores */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: '音声', score: video.qualityScores.audio },
            { label: '映像', score: video.qualityScores.video },
            { label: '同期', score: video.qualityScores.sync },
          ].map((item) => (
            <div
              key={item.label}
              className={cn('p-4 rounded-xl text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}
            >
              <p className={cn('text-sm mb-1', themeClasses.textSecondary)}>{item.label}</p>
              <p className={cn('text-2xl font-bold', getScoreColor(item.score))}>{item.score}</p>
            </div>
          ))}
        </div>

        {/* Issues */}
        <h4 className={cn('font-medium mb-4', themeClasses.text)}>検出された問題点</h4>
        <div className="space-y-4">
          {video.issues.length === 0 ? (
            <div className={cn('text-center py-8', themeClasses.textSecondary)}>
              問題は検出されませんでした
            </div>
          ) : (
            video.issues.map((issue, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-xl',
                  isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(issue.severity)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn('font-medium', themeClasses.text)}>{issue.type}</h4>
                      <span className={cn('text-xs', themeClasses.textSecondary)}>
                        @{Math.floor(issue.timestamp / 60)}:{(issue.timestamp % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p className={cn('text-sm', themeClasses.textSecondary)}>{issue.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Enhancement Features */}
      <div>
        <h3 className={cn('font-bold text-lg mb-4', themeClasses.text)}>品質向上ツール</h3>
        <div className="grid grid-cols-4 gap-4">
          {ENHANCEMENT_FEATURES.map((feature) => (
            <button
              key={feature.id}
              onClick={() => handleEnhancement(feature.name)}
              className={cn(
                'p-5 rounded-2xl border text-left transition-all hover:shadow-md group',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', feature.color)}>
                {feature.icon}
              </div>
              <h4 className={cn('font-bold mb-1', themeClasses.text)}>{feature.name}</h4>
              <p className={cn('text-sm', themeClasses.textSecondary)}>{feature.description}</p>
              <div className={cn('mt-3 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity', 'text-blue-500')}>
                適用する <ArrowRight size={14} className="ml-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
