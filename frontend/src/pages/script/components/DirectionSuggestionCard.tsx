import { Film, AlertTriangle, Clock, Search, Palette, MonitorPlay } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type {
  DirectionSuggestion,
  TimelineWarning,
  ThemeClasses,
  ExpertType,
  AvatarPositionType,
} from '../../../types';
import {
  VISUAL_INSERT_CONFIG,
  AVATAR_POSITION_CONFIG,
} from '../../../types';

// 専門家の色とアイコン
const EXPERT_COLORS: Record<ExpertType, { border: string; text: string; bg: string; emoji: string }> = {
  hook_master: { border: 'border-blue-500', text: 'text-blue-700', bg: 'bg-blue-100', emoji: '🎣' },
  story_architect: { border: 'border-purple-500', text: 'text-purple-700', bg: 'bg-purple-100', emoji: '🎬' },
  entertainment_producer: { border: 'border-orange-500', text: 'text-orange-700', bg: 'bg-orange-100', emoji: '🎭' },
  target_insight: { border: 'border-green-500', text: 'text-green-700', bg: 'bg-green-100', emoji: '🎯' },
  cta_strategist: { border: 'border-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-100', emoji: '📣' },
};

// 専門家名の日本語マッピング
const EXPERT_NAMES: Record<ExpertType, string> = {
  hook_master: 'フックマスター',
  story_architect: 'ストーリーアーキテクト',
  entertainment_producer: 'エンタメプロデューサー',
  target_insight: 'ターゲットインサイター',
  cta_strategist: 'CTAストラテジスト',
};

// 緊急度の色
const URGENCY_COLORS: Record<1 | 2 | 3 | 4 | 5, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-slate-100', text: 'text-slate-600', label: '低' },
  2: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'やや低' },
  3: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '中' },
  4: { bg: 'bg-orange-100', text: 'text-orange-600', label: '高' },
  5: { bg: 'bg-red-100', text: 'text-red-600', label: '最重要' },
};

interface DirectionSuggestionCardProps {
  suggestions: DirectionSuggestion[];
  warnings: TimelineWarning[];
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
}

export const DirectionSuggestionCard = ({
  suggestions,
  warnings,
  isDarkMode,
  themeClasses,
}: DirectionSuggestionCardProps) => {
  return (
    <div
      className={cn(
        'rounded-3xl shadow-sm border p-6 col-span-2',
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Film className="w-5 h-5 text-blue-600" />
        <h3 className={cn('text-lg font-semibold', themeClasses.text)}>演出提案</h3>
        <span className={cn('text-xs px-2 py-0.5 rounded-full', isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700')}>
          {suggestions.length}件の提案
        </span>
      </div>

      {/* タイムライン警告 */}
      {warnings.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className={cn('text-sm font-medium', themeClasses.text)}>タイムライン警告</span>
          </div>
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <TimelineWarningItem
                key={index}
                warning={warning}
                isDarkMode={isDarkMode}
                themeClasses={themeClasses}
              />
            ))}
          </div>
        </div>
      )}

      {/* 演出提案一覧 */}
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.sectionId}
            suggestion={suggestion}
            isDarkMode={isDarkMode}
            themeClasses={themeClasses}
          />
        ))}
      </div>
    </div>
  );
};

// タイムライン警告アイテム
interface TimelineWarningItemProps {
  warning: TimelineWarning;
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
}

const TimelineWarningItem = ({ warning, isDarkMode, themeClasses }: TimelineWarningItemProps) => {
  const warningLabels: Record<TimelineWarning['warningType'], string> = {
    avatar_too_long: 'アバター継続が長い',
    no_visual_change: '視覚変化なし',
    low_engagement: 'エンゲージメント低下リスク',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg',
        isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'
      )}
    >
      <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-sm font-medium', themeClasses.text)}>
            {warning.startTime} - {warning.endTime}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
            {warning.durationSeconds}秒
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {warningLabels[warning.warningType]}
          </span>
        </div>
        <p className={cn('text-xs', themeClasses.textSecondary)}>{warning.message}</p>
        <p className="text-xs text-amber-700 mt-1">💡 {warning.recommendation}</p>
      </div>
    </div>
  );
};

// 演出提案アイテム
interface SuggestionItemProps {
  suggestion: DirectionSuggestion;
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
}

const SuggestionItem = ({ suggestion, isDarkMode, themeClasses }: SuggestionItemProps) => {
  const expertColor = EXPERT_COLORS[suggestion.suggestedBy];
  const urgencyColor = URGENCY_COLORS[suggestion.urgency];
  const visualConfig = VISUAL_INSERT_CONFIG[suggestion.suggestedType];
  const positionConfig = AVATAR_POSITION_CONFIG[suggestion.avatarPosition];

  return (
    <div
      className={cn(
        'border-l-4 rounded-r-xl p-4',
        expertColor.border,
        isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
      )}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold', themeClasses.text)}>
            {suggestion.sectionLabel}
          </span>
          <span className={cn('text-xs', themeClasses.textSecondary)}>
            {suggestion.timestamp}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 緊急度バッジ */}
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              isDarkMode
                ? `${urgencyColor.bg.replace('100', '900/30')} ${urgencyColor.text.replace('600', '400')}`
                : `${urgencyColor.bg} ${urgencyColor.text}`
            )}
          >
            緊急度: {urgencyColor.label}
          </span>
          {/* 提案元の専門家 */}
          <span className={cn('text-xs', expertColor.text)}>
            {expertColor.emoji} {EXPERT_NAMES[suggestion.suggestedBy]}
          </span>
        </div>
      </div>

      {/* 緊急度の理由 */}
      <p className={cn('text-xs mb-3', themeClasses.textSecondary)}>
        {suggestion.urgencyReason}
      </p>

      {/* 提案内容 */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* 推奨ビジュアルタイプ */}
        <div
          className={cn(
            'p-3 rounded-lg',
            isDarkMode ? 'bg-slate-700/50' : 'bg-white'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <MonitorPlay className="w-4 h-4 text-blue-500" />
            <span className={cn('text-xs font-medium', themeClasses.text)}>推奨ビジュアル</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{visualConfig.emoji}</span>
            <div>
              <p className={cn('text-sm font-medium', themeClasses.text)}>{visualConfig.label}</p>
              <p className={cn('text-xs', themeClasses.textSecondary)}>{visualConfig.description}</p>
            </div>
          </div>
        </div>

        {/* アバター位置 */}
        <div
          className={cn(
            'p-3 rounded-lg',
            isDarkMode ? 'bg-slate-700/50' : 'bg-white'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('text-xs font-medium', themeClasses.text)}>アバター位置</span>
          </div>
          <AvatarPositionPreview position={suggestion.avatarPosition} isDarkMode={isDarkMode} />
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
            {positionConfig.label} - {positionConfig.description}
          </p>
        </div>
      </div>

      {/* 提案理由 */}
      <p className={cn('text-sm mb-3', themeClasses.text)}>
        💡 {suggestion.reason}
      </p>

      {/* 具体的な内容案 */}
      <div className="flex flex-wrap gap-2">
        {/* スライド提案 */}
        {suggestion.slideSuggestion && (
          <SlideSuggestionPreview
            slideSuggestion={suggestion.slideSuggestion}
            isDarkMode={isDarkMode}
            themeClasses={themeClasses}
          />
        )}

        {/* 検索キーワード */}
        {suggestion.searchKeywords && suggestion.searchKeywords.length > 0 && (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              isDarkMode ? 'bg-slate-700/50' : 'bg-white'
            )}
          >
            <Search className="w-4 h-4 text-slate-500" />
            <div className="flex flex-wrap gap-1">
              {suggestion.searchKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 推奨カラー */}
        {suggestion.recommendedColors && suggestion.recommendedColors.length > 0 && (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              isDarkMode ? 'bg-slate-700/50' : 'bg-white'
            )}
          >
            <Palette className="w-4 h-4 text-slate-500" />
            <div className="flex gap-1">
              {suggestion.recommendedColors.map((color, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* 表示時間 */}
        {suggestion.displayDuration && (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              isDarkMode ? 'bg-slate-700/50' : 'bg-white'
            )}
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span className={cn('text-xs', themeClasses.text)}>
              推奨表示: {suggestion.displayDuration}秒
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// アバター位置プレビュー
interface AvatarPositionPreviewProps {
  position: AvatarPositionType;
  isDarkMode: boolean;
}

const AvatarPositionPreview = ({ position, isDarkMode }: AvatarPositionPreviewProps) => {
  const getPreviewLayout = () => {
    const bgClass = isDarkMode ? 'bg-slate-600' : 'bg-slate-200';
    const avatarClass = isDarkMode ? 'bg-blue-600' : 'bg-blue-400';
    const visualClass = isDarkMode ? 'bg-purple-600' : 'bg-purple-400';

    switch (position) {
      case 'hidden':
        return (
          <div className={cn('w-full h-8 rounded', visualClass)} />
        );
      case 'pip_right':
        return (
          <div className={cn('relative w-full h-8 rounded', visualClass)}>
            <div className={cn('absolute bottom-0.5 right-0.5 w-3 h-3 rounded', avatarClass)} />
          </div>
        );
      case 'pip_left':
        return (
          <div className={cn('relative w-full h-8 rounded', visualClass)}>
            <div className={cn('absolute bottom-0.5 left-0.5 w-3 h-3 rounded', avatarClass)} />
          </div>
        );
      case 'pip_bottom':
        return (
          <div className={cn('relative w-full h-8 rounded', visualClass)}>
            <div className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 rounded-t', avatarClass)} />
          </div>
        );
      case 'split_left':
        return (
          <div className="flex gap-0.5 w-full h-8">
            <div className={cn('w-1/2 rounded-l', avatarClass)} />
            <div className={cn('w-1/2 rounded-r', visualClass)} />
          </div>
        );
      case 'split_right':
        return (
          <div className="flex gap-0.5 w-full h-8">
            <div className={cn('w-1/2 rounded-l', visualClass)} />
            <div className={cn('w-1/2 rounded-r', avatarClass)} />
          </div>
        );
      default:
        return <div className={cn('w-full h-8 rounded', bgClass)} />;
    }
  };

  return (
    <div className="w-24">
      {getPreviewLayout()}
    </div>
  );
};

// スライド提案プレビュー
interface SlideSuggestionPreviewProps {
  slideSuggestion: DirectionSuggestion['slideSuggestion'];
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
}

const SlideSuggestionPreview = ({ slideSuggestion, isDarkMode, themeClasses }: SlideSuggestionPreviewProps) => {
  if (!slideSuggestion) return null;

  return (
    <div
      className={cn(
        'p-3 rounded-lg min-w-[200px]',
        isDarkMode ? 'bg-slate-700/50' : 'bg-white'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs">📝</span>
        <span className={cn('text-xs font-medium', themeClasses.text)}>スライド案</span>
      </div>
      <div
        className={cn(
          'p-3 rounded border',
          isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'
        )}
      >
        {slideSuggestion.title && (
          <p className={cn('text-sm font-bold mb-1', themeClasses.text)}>
            {slideSuggestion.title}
          </p>
        )}
        {slideSuggestion.mainNumber && (
          <p className="text-2xl font-bold text-blue-600 mb-1">
            {slideSuggestion.mainNumber}
          </p>
        )}
        {slideSuggestion.subText && (
          <p className={cn('text-xs', themeClasses.textSecondary)}>
            {slideSuggestion.subText}
          </p>
        )}
        {slideSuggestion.points && slideSuggestion.points.length > 0 && (
          <ul className="mt-2 space-y-1">
            {slideSuggestion.points.map((point, index) => (
              <li key={index} className={cn('text-xs flex items-start gap-1', themeClasses.text)}>
                <span className="text-blue-500">•</span>
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
