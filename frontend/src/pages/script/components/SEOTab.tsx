import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Hash,
  Tag,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Plus,
  X,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { scriptService, type Keyword } from '../../../services/script';

interface SEOTabProps {
  scriptId: string;
  videoId: string;
}

const DIFFICULTY_COLORS: Record<Keyword['difficulty'], string> = {
  easy: 'text-green-500 bg-green-500/10',
  medium: 'text-yellow-500 bg-yellow-500/10',
  hard: 'text-red-500 bg-red-500/10',
};

const DIFFICULTY_LABELS: Record<Keyword['difficulty'], string> = {
  easy: '低',
  medium: '中',
  hard: '高',
};

const MAX_DESCRIPTION_LENGTH = 5000;

export const SEOTab = ({ scriptId, videoId }: SEOTabProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // API: GET /api/v1/scripts/:id/seo
  const {
    data: seoData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['scripts', scriptId, 'seo'],
    queryFn: () => scriptService.getSEOData(scriptId),
    enabled: !!scriptId,
  });

  // ローカル状態の初期化
  useEffect(() => {
    if (seoData?.data) {
      setDescription(seoData.data.description);
      setTags(seoData.data.tags);
      setHashtags(seoData.data.hashtags);
    }
  }, [seoData]);

  // API: POST /api/v1/metadata/description
  const generateDescriptionMutation = useMutation({
    mutationFn: () => scriptService.generateDescription({
      videoId,
      scriptId,
      includeTimestamps: true,
      includeLinks: true,
    }),
    onSuccess: (data) => {
      setDescription(data.description);
      setHashtags(data.hashtags);
    },
  });

  // API: PUT /api/v1/scripts/:id/seo
  const updateSEOMutation = useMutation({
    mutationFn: () => scriptService.updateSEOData(scriptId, {
      description,
      tags,
      hashtags,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', scriptId, 'seo'] });
    },
  });

  const seoScore = seoData?.data?.score ?? {
    overall: 0,
    title: 0,
    description: 0,
    tags: 0,
    hashtags: 0,
  };
  const keywords = seoData?.data?.keywords ?? [];

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddHashtag = () => {
    const formatted = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
    if (formatted.length > 1 && !hashtags.includes(formatted)) {
      setHashtags([...hashtags, formatted]);
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (hashtag: string) => {
    setHashtags(hashtags.filter((h) => h !== hashtag));
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleGenerateDescription = () => {
    generateDescriptionMutation.mutate();
  };

  const handleSave = () => {
    updateSEOMutation.mutate();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return isDarkMode ? 'bg-green-900/30' : 'bg-green-50';
    if (score >= 60) return isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50';
    return isDarkMode ? 'bg-red-900/30' : 'bg-red-50';
  };

  // ローディング状態
  if (isLoading) {
    return (
      <div className="px-8 pb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className={cn('rounded-2xl border p-8', themeClasses.cardBg, themeClasses.cardBorder)}>
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle size={24} />
              <span>SEOデータの取得に失敗しました。再度お試しください。</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column - Description & Tags */}
          <div className="col-span-2 space-y-8">
            {/* Description */}
            <div
              className={cn(
                'p-6 rounded-2xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" />
                  <h3 className={cn('font-bold', themeClasses.text)}>動画説明文</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateDescription}
                    disabled={generateDescriptionMutation.isPending}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
                      generateDescriptionMutation.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <RefreshCw size={14} className={generateDescriptionMutation.isPending ? 'animate-spin' : ''} />
                    AI生成
                  </button>
                  <button
                    onClick={() => handleCopy(description, 'description')}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    )}
                  >
                    {copiedSection === 'description' ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} className={themeClasses.textSecondary} />
                    )}
                  </button>
                </div>
              </div>
              {generateDescriptionMutation.isPending ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Loader2 size={24} className="animate-spin text-blue-600 mx-auto mb-3" />
                    <p className={cn('text-sm', themeClasses.textSecondary)}>
                      説明文を生成中...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    rows={12}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border-2 text-sm transition-colors resize-y cursor-text',
                      isDarkMode
                        ? 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                        : 'bg-white border-slate-300 hover:border-slate-400',
                      themeClasses.text,
                      'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    )}
                    placeholder="動画の説明文を入力してください..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className={cn('text-xs', themeClasses.textSecondary)}>
                      最初の数行が検索結果に表示されます
                    </p>
                    <span className={cn('text-xs', themeClasses.textSecondary)}>
                      {description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Tags */}
            <div
              className={cn(
                'p-6 rounded-2xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <Tag size={18} className="text-purple-500" />
                <h3 className={cn('font-bold', themeClasses.text)}>タグ</h3>
                <span className={cn('text-xs', themeClasses.textSecondary)}>
                  ({tags.length}/500)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm',
                      isDarkMode
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="タグを追加..."
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg border text-sm',
                    themeClasses.inputBg,
                    themeClasses.cardBorder,
                    themeClasses.text
                  )}
                />
                <button
                  onClick={handleAddTag}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors',
                    isDarkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  )}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Hashtags */}
            <div
              className={cn(
                'p-6 rounded-2xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <Hash size={18} className="text-cyan-500" />
                <h3 className={cn('font-bold', themeClasses.text)}>ハッシュタグ</h3>
                <span className={cn('text-xs', themeClasses.textSecondary)}>
                  (最大15個推奨)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {hashtags.map((hashtag) => (
                  <span
                    key={hashtag}
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium',
                      isDarkMode
                        ? 'bg-cyan-900/30 text-cyan-400'
                        : 'bg-cyan-50 text-cyan-700'
                    )}
                  >
                    {hashtag}
                    <button
                      onClick={() => handleRemoveHashtag(hashtag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
                  placeholder="#ハッシュタグを追加..."
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg border text-sm',
                    themeClasses.inputBg,
                    themeClasses.cardBorder,
                    themeClasses.text
                  )}
                />
                <button
                  onClick={handleAddHashtag}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-colors',
                    isDarkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  )}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - SEO Score & Keywords */}
          <div className="space-y-8">
            {/* SEO Score */}
            <div
              className={cn(
                'p-6 rounded-2xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div className="flex items-center gap-2 mb-6">
                <Search size={18} className="text-green-500" />
                <h3 className={cn('font-bold', themeClasses.text)}>SEOスコア</h3>
              </div>

              {/* Overall Score */}
              <div className={cn('text-center p-6 rounded-xl mb-6', getScoreBgColor(seoScore.overall))}>
                <div className={cn('text-5xl font-bold mb-2', getScoreColor(seoScore.overall))}>
                  {seoScore.overall}
                </div>
                <p className={themeClasses.textSecondary}>総合スコア</p>
              </div>

              {/* Individual Scores */}
              <div className="space-y-4">
                {[
                  { label: 'タイトル', score: seoScore.title },
                  { label: '説明文', score: seoScore.description },
                  { label: 'タグ', score: seoScore.tags },
                  { label: 'ハッシュタグ', score: seoScore.hashtags },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn('text-sm', themeClasses.text)}>{item.label}</span>
                      <span className={cn('text-sm font-bold', getScoreColor(item.score))}>
                        {item.score}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'h-2 rounded-full overflow-hidden',
                        isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                      )}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          item.score >= 80
                            ? 'bg-green-500'
                            : item.score >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        )}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div
              className={cn(
                'p-6 rounded-2xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-orange-500" />
                <h3 className={cn('font-bold', themeClasses.text)}>推奨キーワード</h3>
              </div>
              {keywords.length === 0 ? (
                <p className={cn('text-sm text-center py-4', themeClasses.textSecondary)}>
                  キーワードデータがありません
                </p>
              ) : (
                <div className="space-y-3">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword.word}
                      className={cn(
                        'p-3 rounded-xl',
                        isDarkMode ? 'bg-slate-800' : 'bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn('font-medium text-sm', themeClasses.text)}>
                          {keyword.word}
                        </span>
                        {keyword.included ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <AlertTriangle size={16} className="text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs', themeClasses.textSecondary)}>
                          検索ボリューム: {keyword.volume.toLocaleString()}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            DIFFICULTY_COLORS[keyword.difficulty]
                          )}
                        >
                          競合{DIFFICULTY_LABELS[keyword.difficulty]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            <div
              className={cn(
                'p-4 rounded-xl',
                isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
              )}
            >
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="text-blue-500 mt-0.5" />
                <div>
                  <p className={cn('text-sm font-medium mb-1', themeClasses.text)}>
                    SEO改善のヒント
                  </p>
                  <p className={cn('text-xs', themeClasses.textSecondary)}>
                    {keywords.find((k) => !k.included)
                      ? `説明文に「${keywords.find((k) => !k.included)?.word}」を追加すると、スコアが向上する可能性があります。`
                      : '全ての推奨キーワードが含まれています。'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mt-8 gap-3">
          {updateSEOMutation.isSuccess && (
            <span className="flex items-center gap-2 text-green-500 text-sm">
              <Check size={16} />
              保存しました
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={updateSEOMutation.isPending}
            className={cn(
              'px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all',
              updateSEOMutation.isPending
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:from-blue-700 hover:to-indigo-700'
            )}
          >
            {updateSEOMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                保存中...
              </span>
            ) : (
              'SEO設定を保存'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
