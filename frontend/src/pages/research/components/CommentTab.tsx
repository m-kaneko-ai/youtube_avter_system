import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Smile, Hash, Star, ThumbsUp, ThumbsDown, Minus, Play, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { researchService } from '../../../services/research';

export const CommentTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=example123');
  const [videoId, setVideoId] = useState('example123');

  // API: GET /api/v1/research/comments/sentiment
  const {
    data: sentimentData,
    isLoading: isLoadingSentiment,
    error: sentimentError,
  } = useQuery({
    queryKey: ['research', 'comments', 'sentiment', videoId],
    queryFn: () => researchService.getCommentSentiment(videoId),
    enabled: !!videoId,
  });

  // API: GET /api/v1/research/comments/keywords
  const {
    data: keywordData,
    isLoading: isLoadingKeywords,
    error: keywordError,
  } = useQuery({
    queryKey: ['research', 'comments', 'keywords', videoId],
    queryFn: () => researchService.getCommentKeywords(videoId),
    enabled: !!videoId,
  });

  // API: GET /api/v1/research/comments/notable
  const {
    data: commentData,
    isLoading: isLoadingComments,
    error: commentError,
  } = useQuery({
    queryKey: ['research', 'comments', 'notable', videoId],
    queryFn: () => researchService.getNotableComments(videoId),
    enabled: !!videoId,
  });

  const sentiment = sentimentData?.sentiment;
  const keywords = keywordData?.keywords ?? [];
  const notableComments = commentData?.comments ?? [];
  const error = sentimentError || keywordError || commentError;

  const handleAnalyze = () => {
    const match = videoUrl.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/);
    if (match) {
      setVideoId(match[1]);
    }
  };

  const getKeywordColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    const colors = {
      positive: isDarkMode
        ? 'bg-blue-900/30 text-blue-400'
        : 'bg-blue-100 text-blue-700',
      neutral: isDarkMode
        ? 'bg-slate-800 text-slate-400'
        : 'bg-slate-100 text-slate-700',
      negative: isDarkMode
        ? 'bg-red-900/30 text-red-400'
        : 'bg-red-100 text-red-700',
    };
    return colors[sentiment];
  };

  const getSentimentBadge = (sentiment: 'positive' | 'neutral' | 'negative') => {
    const configs = {
      positive: {
        text: 'ポジティブ',
        color: 'bg-green-100 text-green-700',
      },
      neutral: {
        text: '中立',
        color: isDarkMode
          ? 'bg-slate-800 text-slate-400'
          : 'bg-slate-100 text-slate-600',
      },
      negative: {
        text: 'ネガティブ',
        color: 'bg-red-100 text-red-700',
      },
    };
    return configs[sentiment];
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '1日前';
    return `${diffDays}日前`;
  };

  // エラー表示
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className={cn('rounded-3xl p-8 shadow-sm border', themeClasses.cardBg, themeClasses.cardBorder)}>
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle size={24} />
            <span>データの取得に失敗しました。再度お試しください。</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* URL入力 */}
      <div
        className={cn(
          'rounded-3xl p-8 shadow-sm border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <h2
          className={cn(
            'text-xl font-bold mb-6 flex items-center gap-2',
            themeClasses.text
          )}
        >
          <MessageSquare size={24} className="text-blue-600" />
          YouTube動画のコメントを分析
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="YouTube動画のURLを入力"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={cn(
              'flex-1 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-blue-500/50 focus:outline-none',
              themeClasses.inputBg,
              themeClasses.text
            )}
          />
          <button
            onClick={handleAnalyze}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Play size={20} />
            分析開始
          </button>
        </div>
      </div>

      {/* 感情分析 */}
      <div
        className={cn(
          'rounded-3xl p-8 shadow-sm border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <h2
          className={cn(
            'text-xl font-bold mb-6 flex items-center gap-2',
            themeClasses.text
          )}
        >
          <Smile size={24} className="text-green-600" />
          コメント感情分析
        </h2>
        {isLoadingSentiment ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-green-600" />
          </div>
        ) : !sentiment ? (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            分析結果がありません
          </div>
        ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-2xl bg-green-50 border border-green-100">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {sentiment.positive}%
            </div>
            <div className="text-sm font-medium text-green-700 flex items-center justify-center gap-2">
              <ThumbsUp size={16} />
              ポジティブ
            </div>
            <div className="text-xs text-green-600 mt-1">
              {sentiment.positiveCount.toLocaleString()}件
            </div>
          </div>
          <div
            className={cn(
              'text-center p-6 rounded-2xl border',
              isDarkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-50 border-slate-100'
            )}
          >
            <div
              className={cn(
                'text-4xl font-bold mb-2',
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              {sentiment.neutral}%
            </div>
            <div
              className={cn(
                'text-sm font-medium flex items-center justify-center gap-2',
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              )}
            >
              <Minus size={16} />
              中立
            </div>
            <div
              className={cn(
                'text-xs mt-1',
                isDarkMode ? 'text-slate-500' : 'text-slate-600'
              )}
            >
              {sentiment.neutralCount.toLocaleString()}件
            </div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-red-50 border border-red-100">
            <div className="text-4xl font-bold text-red-600 mb-2">
              {sentiment.negative}%
            </div>
            <div className="text-sm font-medium text-red-700 flex items-center justify-center gap-2">
              <ThumbsDown size={16} />
              ネガティブ
            </div>
            <div className="text-xs text-red-600 mt-1">
              {sentiment.negativeCount.toLocaleString()}件
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 頻出キーワード */}
      <div
        className={cn(
          'rounded-3xl p-8 shadow-sm border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <h2
          className={cn(
            'text-xl font-bold mb-6 flex items-center gap-2',
            themeClasses.text
          )}
        >
          <Hash size={24} className="text-indigo-600" />
          頻出キーワード
        </h2>
        {isLoadingKeywords ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : keywords.length === 0 ? (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            キーワードが見つかりませんでした
          </div>
        ) : (
        <div className="flex flex-wrap gap-3">
          {keywords.map((keyword) => (
            <span
              key={keyword.keyword}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium',
                getKeywordColor(keyword.sentiment)
              )}
            >
              {keyword.keyword} ({keyword.count})
            </span>
          ))}
        </div>
        )}
      </div>

      {/* 注目コメント */}
      <div
        className={cn(
          'rounded-3xl p-8 shadow-sm border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <h2
          className={cn(
            'text-xl font-bold mb-6 flex items-center gap-2',
            themeClasses.text
          )}
        >
          <Star size={24} className="text-yellow-500" />
          注目コメント（高評価順）
        </h2>
        {isLoadingComments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-yellow-500" />
          </div>
        ) : notableComments.length === 0 ? (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            注目コメントが見つかりませんでした
          </div>
        ) : (
        <div className="space-y-4">
          {notableComments.map((comment) => {
            const sentimentConfig = getSentimentBadge(comment.sentiment);
            return (
              <div
                key={comment.id}
                className={cn(
                  'p-4 rounded-xl border transition-colors',
                  themeClasses.cardBorder,
                  themeClasses.hoverBg
                )}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={comment.authorAvatarUrl}
                    alt={comment.authorName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('font-semibold', themeClasses.text)}>
                        {comment.authorName}
                      </span>
                      <span className={cn('text-xs', themeClasses.textSecondary)}>
                        {getTimeAgo(comment.publishedAt)}
                      </span>
                    </div>
                    <p className={cn('mb-2', themeClasses.text)}>{comment.text}</p>
                    <div
                      className={cn(
                        'flex items-center gap-4 text-sm',
                        themeClasses.textSecondary
                      )}
                    >
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={16} />
                        {comment.likes.toLocaleString()}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          sentimentConfig.color
                        )}
                      >
                        {sentimentConfig.text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};
