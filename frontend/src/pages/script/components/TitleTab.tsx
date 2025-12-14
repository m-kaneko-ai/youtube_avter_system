import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Check,
  Copy,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Target,
  Zap,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { scriptService, type TitleSuggestion } from '../../../services/script';
import { toast } from '../../../components/common';

interface TitleTabProps {
  scriptId: string;
  videoId: string;
}

const STYLE_LABELS: Record<string, { label: string; color: string }> = {
  hook: { label: 'フック型', color: 'text-red-500 bg-red-500/10' },
  howto: { label: 'How-to型', color: 'text-blue-500 bg-blue-500/10' },
  listicle: { label: 'リスト型', color: 'text-green-500 bg-green-500/10' },
  question: { label: '疑問型', color: 'text-purple-500 bg-purple-500/10' },
  challenge: { label: '挑戦型', color: 'text-orange-500 bg-orange-500/10' },
};

const MAX_TITLE_LENGTH = 100;
const OPTIMAL_TITLE_LENGTH = 60;

export const TitleTab = ({ scriptId, videoId }: TitleTabProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [customTitle, setCustomTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localSuggestions, setLocalSuggestions] = useState<TitleSuggestion[] | null>(null);

  // API: GET /api/v1/scripts/:id/titles
  const {
    data: titlesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['scripts', scriptId, 'titles'],
    queryFn: () => scriptService.getTitles(scriptId),
    enabled: !!scriptId,
  });

  // API: POST /api/v1/metadata/title
  const generateMutation = useMutation({
    mutationFn: () => scriptService.generateTitles({
      videoId,
      scriptId,
      count: 5,
    }),
    onSuccess: (data) => {
      setLocalSuggestions(data.suggestions);
      queryClient.invalidateQueries({ queryKey: ['scripts', scriptId, 'titles'] });
    },
  });

  // API: POST /api/v1/scripts/:id/titles/:titleId/select
  const selectMutation = useMutation({
    mutationFn: (titleId: string) => scriptService.selectTitle(scriptId, titleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', scriptId, 'titles'] });
    },
  });

  const suggestions = localSuggestions ?? titlesData?.suggestions ?? [];

  const handleSelect = (id: string) => {
    // 楽観的更新
    setLocalSuggestions(
      suggestions.map((s) => ({
        ...s,
        isSelected: s.id === id,
      }))
    );
    selectMutation.mutate(id);
  };

  const handleCopy = (title: string, id: string) => {
    navigator.clipboard.writeText(title);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    generateMutation.mutate();
  };

  const handleConfirmTitle = () => {
    const titleToConfirm = customTitle || selectedTitle?.title;
    if (titleToConfirm) {
      toast.success(`タイトルを確定しました: ${titleToConfirm.substring(0, 30)}...`);
    }
  };

  const selectedTitle = suggestions.find((s) => s.isSelected);
  const titleLength = customTitle.length || (selectedTitle?.title.length ?? 0);
  const isOptimalLength = titleLength <= OPTIMAL_TITLE_LENGTH;
  const isTooLong = titleLength > MAX_TITLE_LENGTH;

  // ローディング状態
  if (isLoading) {
    return (
      <div className="px-8 pb-8">
        <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className={cn('rounded-2xl border p-8', themeClasses.cardBg, themeClasses.cardBorder)}>
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle size={24} />
              <span>タイトル候補の取得に失敗しました。再度お試しください。</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn('text-xl font-bold', themeClasses.text)}>
              タイトル候補
            </h2>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
              AIが台本に基づいて最適なタイトルを提案します
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={generateMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
              generateMutation.isPending && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw size={16} className={generateMutation.isPending ? 'animate-spin' : ''} />
            再生成
          </button>
        </div>

        {/* Title Suggestions */}
        {generateMutation.isPending ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className={cn('text-sm', themeClasses.textSecondary)}>
                タイトル候補を生成中...
              </p>
            </div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className={cn('rounded-2xl border p-8 text-center', themeClasses.cardBg, themeClasses.cardBorder)}>
            <Sparkles size={32} className="text-blue-500 mx-auto mb-4" />
            <p className={cn('font-medium mb-2', themeClasses.text)}>
              タイトル候補がありません
            </p>
            <p className={cn('text-sm mb-4', themeClasses.textSecondary)}>
              「再生成」ボタンをクリックしてAIにタイトルを生成してもらいましょう
            </p>
            <button
              onClick={handleRegenerate}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all"
            >
              タイトルを生成
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => handleSelect(suggestion.id)}
                className={cn(
                  'p-5 rounded-2xl border-2 cursor-pointer transition-all',
                  suggestion.isSelected
                    ? isDarkMode
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-blue-500 bg-blue-50'
                    : cn(
                        themeClasses.cardBorder,
                        themeClasses.cardBg,
                        'hover:border-blue-300'
                      ),
                  selectMutation.isPending && 'opacity-70 pointer-events-none'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={cn(
                          'text-xs font-bold px-2 py-1 rounded-md',
                          STYLE_LABELS[suggestion.style]?.color ?? 'text-slate-500 bg-slate-500/10'
                        )}
                      >
                        {STYLE_LABELS[suggestion.style]?.label ?? suggestion.style}
                      </span>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-green-500" />
                        <span className={cn('text-sm font-bold', themeClasses.text)}>
                          CTR予測: {suggestion.ctrPrediction}%
                        </span>
                      </div>
                    </div>
                    <p className={cn('text-lg font-medium leading-relaxed', themeClasses.text)}>
                      {suggestion.title}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {suggestion.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            isDarkMode
                              ? 'bg-slate-700 text-slate-400'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {keyword}
                        </span>
                      ))}
                      <span className={cn('text-xs ml-2', themeClasses.textSecondary)}>
                        {suggestion.title.length}文字
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(suggestion.title, suggestion.id);
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                      )}
                    >
                      {copiedId === suggestion.id ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Copy size={18} className={themeClasses.textSecondary} />
                      )}
                    </button>
                    {suggestion.isSelected && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Title Input */}
        <div
          className={cn(
            'p-6 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-yellow-500" />
            <h3 className={cn('font-bold', themeClasses.text)}>カスタムタイトル</h3>
          </div>
          <div className="relative">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="独自のタイトルを入力..."
              maxLength={MAX_TITLE_LENGTH}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-base transition-colors',
                themeClasses.inputBg,
                themeClasses.cardBorder,
                themeClasses.text,
                'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              )}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  isTooLong
                    ? 'text-red-500'
                    : isOptimalLength
                    ? 'text-green-500'
                    : 'text-yellow-500'
                )}
              >
                {customTitle.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-3">
            {customTitle.length > OPTIMAL_TITLE_LENGTH && customTitle.length <= MAX_TITLE_LENGTH && (
              <>
                <AlertCircle size={14} className="text-yellow-500 mt-0.5" />
                <p className="text-xs text-yellow-500">
                  60文字以内が推奨です。検索結果で途切れる可能性があります。
                </p>
              </>
            )}
            {isTooLong && (
              <>
                <AlertCircle size={14} className="text-red-500 mt-0.5" />
                <p className="text-xs text-red-500">
                  タイトルが長すぎます。100文字以内にしてください。
                </p>
              </>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div
          className={cn(
            'p-6 rounded-2xl',
            isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-blue-500" />
            <h3 className={cn('font-bold', themeClasses.text)}>高CTRタイトルのコツ</h3>
          </div>
          <ul className={cn('space-y-2 text-sm', themeClasses.textSecondary)}>
            <li className="flex items-start gap-2">
              <Sparkles size={14} className="text-blue-500 mt-1 flex-shrink-0" />
              <span>数字を含める（例：「5選」「3つの方法」）</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={14} className="text-blue-500 mt-1 flex-shrink-0" />
              <span>感情を刺激するワード（「衝撃」「必見」「知らないと損」）</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={14} className="text-blue-500 mt-1 flex-shrink-0" />
              <span>ターゲットを明示（「初心者向け」「30代必見」）</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles size={14} className="text-blue-500 mt-1 flex-shrink-0" />
              <span>結果・ベネフィットを示す（「〇〇できるようになる」）</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleConfirmTitle}
            disabled={!selectedTitle && !customTitle}
            className={cn(
              'px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all',
              selectedTitle || customTitle
                ? 'hover:from-blue-700 hover:to-indigo-700'
                : 'opacity-50 cursor-not-allowed'
            )}
          >
            タイトルを確定
          </button>
        </div>
      </div>
    </div>
  );
};
