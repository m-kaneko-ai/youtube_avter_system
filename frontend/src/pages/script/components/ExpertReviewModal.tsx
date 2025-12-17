import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import type { ExpertType, ExpertReviewProgress } from '../../../types';

// 専門家情報の定義
interface ExpertInfo {
  id: ExpertType;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
}

const EXPERTS: ExpertInfo[] = [
  {
    id: 'hook_master',
    name: 'フックマスター',
    emoji: '🎣',
    description: '冒頭30秒を分析中...',
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'story_architect',
    name: 'ストーリーアーキテクト',
    emoji: '🎬',
    description: '構成を添削中...',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'entertainment_producer',
    name: 'エンタメプロデューサー',
    emoji: '🎭',
    description: 'リズムと緩急を評価中...',
    gradient: 'from-orange-600 to-red-600',
  },
  {
    id: 'target_insight',
    name: 'ターゲットインサイター',
    emoji: '🎯',
    description: 'ペルソナとの適合性を確認中...',
    gradient: 'from-green-600 to-teal-600',
  },
  {
    id: 'cta_strategist',
    name: 'CTAストラテジスト',
    emoji: '📣',
    description: '行動喚起を最適化中...',
    gradient: 'from-yellow-600 to-amber-600',
  },
];

interface ExpertReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ExpertReviewProgress;
  completedExperts: ExpertType[];
}

export const ExpertReviewModal = ({
  isOpen,
  onClose,
  progress,
  completedExperts,
}: ExpertReviewModalProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const [elapsedTime, setElapsedTime] = useState(0);

  // 経過時間のカウントアップ
  useEffect(() => {
    if (!isOpen || progress.status !== 'processing') {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, progress.status]);

  if (!isOpen) return null;

  const isExpertCompleted = (expertId: ExpertType) => completedExperts.includes(expertId);
  const isExpertProcessing = (expertId: ExpertType) => progress.currentExpert === expertId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={progress.status !== 'processing' ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative max-w-2xl w-full rounded-3xl shadow-2xl p-8',
          isDarkMode ? 'bg-slate-900' : 'bg-white'
        )}
      >
        {/* Close Button (only when not processing) */}
        {progress.status !== 'processing' && (
          <button
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 p-2 rounded-full transition-colors',
              isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            )}
          >
            <X size={20} />
          </button>
        )}

        {/* Header */}
        <h2 className={cn('text-2xl font-bold text-center mb-6', themeClasses.text)}>
          {progress.status === 'processing' ? '専門家レビュー実行中' : '専門家レビュー完了'}
        </h2>

        {/* Expert List */}
        <div className="space-y-4">
          {EXPERTS.map((expert) => {
            const completed = isExpertCompleted(expert.id);
            const processing = isExpertProcessing(expert.id);

            return (
              <div
                key={expert.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl transition-all',
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-50',
                  processing && 'ring-2 ring-blue-500/50'
                )}
              >
                {/* Expert Avatar */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                    `bg-gradient-to-r ${expert.gradient}`
                  )}
                >
                  {expert.emoji}
                </div>

                {/* Expert Info */}
                <div className="flex-1">
                  <div className={cn('font-semibold', themeClasses.text)}>{expert.name}</div>
                  <div className={cn('text-sm', themeClasses.textSecondary)}>
                    {completed ? '分析完了' : expert.description}
                  </div>
                </div>

                {/* Status Indicator */}
                <div>
                  {completed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : processing ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  ) : (
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full',
                        isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Info */}
        <div className={cn('mt-6 text-center text-sm', themeClasses.textSecondary)}>
          {progress.status === 'processing' ? (
            <>
              約30秒で完了します...
              <span className="ml-2 font-mono">
                ({elapsedTime}秒経過)
              </span>
            </>
          ) : progress.status === 'error' ? (
            <span className="text-red-500">
              エラーが発生しました: {progress.errorMessage}
            </span>
          ) : (
            <span className="text-green-500">
              全ての専門家による分析が完了しました
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
