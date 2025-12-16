import { CheckSquare, TrendingUp, Lightbulb, Users, Check, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { DirectionSuggestionCard } from './DirectionSuggestionCard';
import type {
  ExpertReviewResult,
  ChecklistItem,
  BeforeAfterComparison,
  PersonaReaction,
  ExpertType,
  ThemeClasses,
} from '../../../types';

// 専門家の色とアイコン
const EXPERT_COLORS: Record<ExpertType, { border: string; text: string; emoji: string }> = {
  hook_master: { border: 'border-blue-500', text: 'text-blue-700', emoji: '🎣' },
  story_architect: { border: 'border-purple-500', text: 'text-purple-700', emoji: '🎬' },
  entertainment_producer: { border: 'border-orange-500', text: 'text-orange-700', emoji: '🎭' },
  target_insight: { border: 'border-green-500', text: 'text-green-700', emoji: '🎯' },
  cta_strategist: { border: 'border-yellow-500', text: 'text-yellow-700', emoji: '📣' },
};

// 専門家名の日本語マッピング
const EXPERT_NAMES: Record<ExpertType, string> = {
  hook_master: 'フックマスター',
  story_architect: 'ストーリーアーキテクト',
  entertainment_producer: 'エンタメプロデューサー',
  target_insight: 'ターゲットインサイター',
  cta_strategist: 'CTAストラテジスト',
};

interface QualityAssuranceSetProps {
  reviewResult: ExpertReviewResult;
  className?: string;
}

export const QualityAssuranceSet = ({ reviewResult, className }: QualityAssuranceSetProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const { checklist, beforeAfter, improvementReasons, personaReactions, directionSuggestions, timelineWarnings } = reviewResult;

  return (
    <div className={cn('grid grid-cols-2 gap-6', className)}>
      {/* 1. 必須項目チェックリスト */}
      <ChecklistCard
        checklist={checklist}
        isDarkMode={isDarkMode}
        themeClasses={themeClasses}
      />

      {/* 2. ビフォーアフター比較 */}
      <BeforeAfterCard
        beforeAfter={beforeAfter}
        isDarkMode={isDarkMode}
        themeClasses={themeClasses}
      />

      {/* 3. 改善の根拠 */}
      <ImprovementReasonsCard
        reasons={improvementReasons}
        isDarkMode={isDarkMode}
        themeClasses={themeClasses}
      />

      {/* 4. ペルソナ別反応予測 */}
      <PersonaReactionsCard
        reactions={personaReactions}
        isDarkMode={isDarkMode}
        themeClasses={themeClasses}
      />

      {/* 5. 演出提案（2カラム幅で表示） */}
      <DirectionSuggestionCard
        suggestions={directionSuggestions}
        warnings={timelineWarnings}
        isDarkMode={isDarkMode}
        themeClasses={themeClasses}
      />
    </div>
  );
};

// チェックリストカード
interface ChecklistCardProps {
  checklist: ChecklistItem[];
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
}

const ChecklistCard = ({ checklist, isDarkMode, themeClasses }: ChecklistCardProps) => (
  <div
    className={cn(
      'rounded-3xl shadow-sm border p-6',
      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
    )}
  >
    <div className="flex items-center gap-2 mb-4">
      <CheckSquare className="w-5 h-5 text-blue-600" />
      <h3 className={cn('text-lg font-semibold', themeClasses.text)}>必須項目チェックリスト</h3>
    </div>
    <div className="space-y-3">
      {checklist.map((item) => (
        <div
          key={item.id}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg',
            item.passed
              ? isDarkMode
                ? 'bg-green-900/20'
                : 'bg-green-50'
              : isDarkMode
              ? 'bg-red-900/20'
              : 'bg-red-50'
          )}
        >
          <div className="flex items-center gap-2">
            {item.passed ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
            <span className={cn('text-sm', themeClasses.text)}>{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {item.comment && (
              <span className={cn('text-xs', themeClasses.textSecondary)}>{item.comment}</span>
            )}
            <span
              className={cn(
                'text-xs font-semibold',
                item.passed ? 'text-green-700' : 'text-red-700'
              )}
            >
              {item.passed ? '✅' : '❌'}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ビフォーアフター比較カード
interface BeforeAfterCardProps {
  beforeAfter: BeforeAfterComparison;
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
}

const BeforeAfterCard = ({ beforeAfter, isDarkMode, themeClasses }: BeforeAfterCardProps) => {
  const metrics = [
    {
      label: 'フックスコア',
      before: beforeAfter.hookScore.before,
      after: beforeAfter.hookScore.after,
      gradient: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-600',
    },
    {
      label: '視聴維持率予測',
      before: beforeAfter.retentionScore.before,
      after: beforeAfter.retentionScore.after,
      gradient: 'from-purple-600 to-pink-600',
      textColor: 'text-purple-600',
      suffix: '%',
    },
    {
      label: 'CTA効果',
      before: beforeAfter.ctaScore.before,
      after: beforeAfter.ctaScore.after,
      gradient: 'from-green-600 to-emerald-600',
      textColor: 'text-green-600',
    },
    {
      label: '総合スコア',
      before: beforeAfter.overallScore.before,
      after: beforeAfter.overallScore.after,
      gradient: 'from-yellow-600 to-orange-600',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div
      className={cn(
        'rounded-3xl shadow-sm border p-6',
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className={cn('text-lg font-semibold', themeClasses.text)}>ビフォーアフター比較</h3>
      </div>
      <div className="space-y-4">
        {metrics.map((metric) => {
          const diff = metric.after - metric.before;
          const diffText =
            metric.suffix === '%'
              ? `+${diff.toFixed(1)}%`
              : `+${Math.round(diff)}`;

          return (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-sm', themeClasses.textSecondary)}>{metric.label}</span>
                <span className="text-sm font-semibold text-green-600">{diffText}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs', themeClasses.textSecondary)}>
                  {metric.suffix ? metric.before.toFixed(1) + metric.suffix : Math.round(metric.before)}
                </span>
                <div
                  className={cn(
                    'flex-1 rounded-full h-2',
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                  )}
                >
                  <div
                    className={cn('h-2 rounded-full bg-gradient-to-r', metric.gradient)}
                    style={{ width: `${Math.min(metric.after, 100)}%` }}
                  />
                </div>
                <span className={cn('text-xs font-semibold', metric.textColor)}>
                  {metric.suffix ? metric.after.toFixed(1) + metric.suffix : Math.round(metric.after)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 改善の根拠カード
interface ImprovementReasonsCardProps {
  reasons: ExpertReviewResult['improvementReasons'];
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
}

const ImprovementReasonsCard = ({ reasons, isDarkMode, themeClasses }: ImprovementReasonsCardProps) => (
  <div
    className={cn(
      'rounded-3xl shadow-sm border p-6',
      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
    )}
  >
    <div className="flex items-center gap-2 mb-4">
      <Lightbulb className="w-5 h-5 text-blue-600" />
      <h3 className={cn('text-lg font-semibold', themeClasses.text)}>改善の根拠</h3>
    </div>
    <div className="space-y-3">
      {reasons.map((reason) => {
        const expertColor = EXPERT_COLORS[reason.expertType];
        return (
          <div
            key={reason.expertType}
            className={cn('border-l-4 pl-3 py-2', expertColor.border)}
          >
            <div className={cn('text-xs font-semibold mb-1', expertColor.text)}>
              {expertColor.emoji} {EXPERT_NAMES[reason.expertType]}
            </div>
            <p className={cn('text-sm', themeClasses.text)}>{reason.reason}</p>
          </div>
        );
      })}
    </div>
  </div>
);

// ペルソナ別反応予測カード
interface PersonaReactionsCardProps {
  reactions: PersonaReaction[];
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
}

const PersonaReactionsCard = ({ reactions, isDarkMode, themeClasses }: PersonaReactionsCardProps) => {
  const getBgColor = (score: number) => {
    if (score >= 80) return isDarkMode ? 'bg-green-900/20' : 'bg-green-50';
    if (score >= 60) return isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50';
    return isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    return 'bg-purple-600';
  };

  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    return 'text-purple-600';
  };

  return (
    <div
      className={cn(
        'rounded-3xl shadow-sm border p-6',
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className={cn('text-lg font-semibold', themeClasses.text)}>ペルソナ別反応予測</h3>
      </div>
      <div className="space-y-4">
        {reactions.map((reaction) => (
          <div key={reaction.personaType} className={cn('p-4 rounded-xl', getBgColor(reaction.reactionScore))}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-sm font-semibold', themeClasses.text)}>
                {reaction.personaName}
              </span>
              <span className="text-2xl">{reaction.reactionEmoji}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  'flex-1 rounded-full h-2',
                  isDarkMode ? 'bg-slate-700' : 'bg-white'
                )}
              >
                <div
                  className={cn('h-2 rounded-full', getBarColor(reaction.reactionScore))}
                  style={{ width: `${reaction.reactionScore}%` }}
                />
              </div>
              <span className={cn('text-sm font-semibold', getTextColor(reaction.reactionScore))}>
                {reaction.reactionScore}%
              </span>
            </div>
            <p className={cn('text-xs', themeClasses.textSecondary)}>{reaction.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
