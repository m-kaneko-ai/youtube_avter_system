import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Newspaper, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { researchService } from '../../../services/research';

export const TrendTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  // API: GET /api/v1/research/trends/keywords
  const {
    data: keywordData,
    isLoading: isLoadingKeywords,
    error: keywordError,
  } = useQuery({
    queryKey: ['research', 'trends', 'keywords'],
    queryFn: () => researchService.getTrendingKeywords(),
  });

  // API: GET /api/v1/research/trends/news
  const {
    data: newsData,
    isLoading: isLoadingNews,
    error: newsError,
  } = useQuery({
    queryKey: ['research', 'trends', 'news'],
    queryFn: () => researchService.getTrendingNews(),
  });

  // API: GET /api/v1/research/trends/books
  const {
    data: bookData,
    isLoading: isLoadingBooks,
    error: bookError,
  } = useQuery({
    queryKey: ['research', 'trends', 'books'],
    queryFn: () => researchService.getBookRankings(),
  });

  const trendKeywords = keywordData?.keywords ?? [];
  const trendNews = newsData?.news ?? [];
  const bookRankings = bookData?.books ?? [];
  const error = keywordError || newsError || bookError;

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'たった今';
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${Math.floor(diffHours / 24)}日前`;
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      <span className="flex items-center gap-0.5">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}
      </span>
    );
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
      {/* フィルター */}
      <div
        className={cn(
          'rounded-3xl p-6 shadow-sm border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <div className="flex gap-4">
          <select
            className={cn(
              'rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-blue-500/50 focus:outline-none',
              themeClasses.inputBg,
              themeClasses.text
            )}
          >
            <option>カテゴリ: 全て</option>
            <option>ビジネス</option>
            <option>テクノロジー</option>
            <option>マーケティング</option>
            <option>キャリア</option>
          </select>
          <select
            className={cn(
              'rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-blue-500/50 focus:outline-none',
              themeClasses.inputBg,
              themeClasses.text
            )}
          >
            <option>期間: 7日間</option>
            <option>24時間</option>
            <option>30日間</option>
            <option>90日間</option>
          </select>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
            更新
          </button>
        </div>
      </div>

      {/* 急上昇キーワード */}
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
          <TrendingUp size={24} className="text-orange-500" />
          急上昇キーワード
        </h2>
        {isLoadingKeywords ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-orange-500" />
          </div>
        ) : trendKeywords.length === 0 ? (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            キーワードが見つかりませんでした
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-4">
          {trendKeywords.map((keyword) => (
            <div
              key={keyword.id}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all',
                themeClasses.cardBorder,
                isDarkMode
                  ? 'hover:border-blue-500/30 hover:bg-blue-900/10'
                  : 'hover:border-blue-200 hover:bg-blue-50/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('font-bold flex items-center gap-2', themeClasses.text)}>
                  🔥 {keyword.keyword}
                </span>
                <span className="text-sm font-semibold text-green-600">
                  +{keyword.growthRate}%
                </span>
              </div>
              <p className={cn('text-sm', themeClasses.textSecondary)}>
                検索数: {formatNumber(keyword.searchVolume)}
              </p>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* 関連ニュース・話題 */}
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
          <Newspaper size={24} className="text-blue-600" />
          関連ニュース・話題
        </h2>
        {isLoadingNews ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : trendNews.length === 0 ? (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            ニュースが見つかりませんでした
          </div>
        ) : (
        <div className="space-y-4">
          {trendNews.map((news) => (
            <div
              key={news.id}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-colors',
                themeClasses.cardBorder,
                themeClasses.hoverBg
              )}
            >
              <div className="flex gap-4">
                <img
                  src={news.thumbnailUrl}
                  alt={news.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className={cn('font-semibold mb-1', themeClasses.text)}>
                    {news.title}
                  </h3>
                  <p className={cn('text-sm mb-2', themeClasses.textSecondary)}>
                    {news.description}
                  </p>
                  <span className={cn('text-xs', themeClasses.textSecondary)}>
                    {news.source} • {getTimeAgo(news.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Amazon書籍ランキング */}
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
          <BookOpen size={24} className="text-orange-600" />
          Amazon書籍ランキング（ビジネス・マーケティング）
        </h2>
        {isLoadingBooks ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-orange-600" />
          </div>
        ) : bookRankings.length === 0 ? (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            書籍が見つかりませんでした
          </div>
        ) : (
        <div className="space-y-3">
          {bookRankings.map((book) => (
            <div
              key={book.id}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg transition-colors',
                themeClasses.hoverBg
              )}
            >
              <span
                className={cn(
                  'font-bold text-xl w-6',
                  isDarkMode ? 'text-slate-700' : 'text-slate-300'
                )}
              >
                {book.rank}
              </span>
              <img
                src={book.imageUrl}
                alt={book.title}
                className="w-16 h-24 rounded object-cover"
              />
              <div className="flex-1">
                <h4 className={cn('font-semibold', themeClasses.text)}>
                  {book.title}
                </h4>
                <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
                  {renderStars(book.rating)} {book.rating.toFixed(1)} (
                  {formatNumber(book.reviewCount)}件)
                </p>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
