import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Users, Flame, Search, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { researchService } from '../../../services/research';

export const CompetitorTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // API: GET /api/v1/research/competitors
  const {
    data: competitorData,
    isLoading: isLoadingCompetitors,
    error: competitorError,
  } = useQuery({
    queryKey: ['research', 'competitors'],
    queryFn: () => researchService.getCompetitors(undefined, 10),
    retry: false, // モックデータを使用するため、リトライを無効化
  });

  // API: GET /api/v1/research/popular-videos
  const {
    data: videoData,
    isLoading: isLoadingVideos,
    error: videoError,
  } = useQuery({
    queryKey: ['research', 'popular-videos'],
    queryFn: () => researchService.getPopularVideos(undefined, 10),
    retry: false, // モックデータを使用するため、リトライを無効化
  });

  const competitors = competitorData?.competitors ?? [];
  const popularVideos = videoData?.videos ?? [];
  // エラーがあってもデータが存在する場合は正常とみなす（モックデータ対応）
  const error = (competitorError || videoError) && competitors.length === 0 && popularVideos.length === 0;

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toLocaleString();
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '今日';
    if (diff === 1) return '1日前';
    if (diff < 7) return `${diff}日前`;
    if (diff < 30) return `${Math.floor(diff / 7)}週間前`;
    return `${Math.floor(diff / 30)}ヶ月前`;
  };

  const handleStartSearch = async () => {
    // バリデーション: 空入力チェック
    if (!searchQuery.trim()) {
      setValidationError('チャンネル名またはURLを入力してください');
      return;
    }

    // バリデーション: YouTube URLチェック
    // URLの形式をチェック（http://またはhttps://で始まる場合）
    if (searchQuery.includes('http://') || searchQuery.includes('https://')) {
      // URLらしい入力の場合、YouTubeドメインかチェック
      const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i;
      if (!youtubePattern.test(searchQuery)) {
        setValidationError('有効なYouTube URLを入力してください');
        return;
      }
    }

    // バリデーション成功時はエラーをクリア
    setValidationError('');

    // ローディング開始
    setIsSearching(true);

    try {
      // TODO: 実際の検索処理を実装
      // 仮の遅延（実際のAPI呼び出しに置き換える）
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // ここで実際のAPI呼び出しを行う
      // await researchService.searchChannel(searchQuery);
    } catch {
      setValidationError('検索中にエラーが発生しました。');
    } finally {
      // ローディング終了
      setIsSearching(false);
    }
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
      {/* チャンネル検索 */}
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
          <UserPlus size={24} className="text-blue-600" />
          競合チャンネルを追加
        </h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="チャンネルURLまたはチャンネル名を入力"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // 入力が変更されたらエラーをクリア
                if (validationError) {
                  setValidationError('');
                }
              }}
              className={cn(
                'flex-1 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-blue-500/50 focus:outline-none',
                themeClasses.inputBg,
                themeClasses.text
              )}
            />
            <button
              onClick={handleStartSearch}
              disabled={isSearching}
              className={cn(
                "bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center gap-2",
                isSearching && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSearching ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  処理中
                </>
              ) : (
                <>
                  <Search size={20} />
                  調査開始
                </>
              )}
            </button>
          </div>
          {validationError && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
          )}
        </div>
      </div>

      {/* 登録済み競合チャンネル */}
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
          <Users size={24} className="text-blue-600" />
          登録済み競合チャンネル
        </h2>
        {isLoadingCompetitors ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : competitors.length === 0 ? (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            競合チャンネルが登録されていません
          </div>
        ) : (
        <div className="space-y-4">
          {competitors.map((competitor) => (
            <div
              key={competitor.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl transition-colors border',
                themeClasses.cardBorder,
                themeClasses.hoverBg
              )}
            >
              <img
                src={competitor.thumbnailUrl}
                alt={competitor.name}
                className="w-20 h-20 rounded-xl"
              />
              <div className="flex-1">
                <h3 className={cn('font-bold', themeClasses.text)}>
                  {competitor.name}
                </h3>
                <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
                  登録者 {formatNumber(competitor.subscriberCount)}人 • 動画{' '}
                  {competitor.videoCount}本
                </p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp size={12} />
                    +{competitor.growthRate}% (30日)
                  </span>
                  <span className={cn('text-xs', themeClasses.textSecondary)}>
                    平均視聴回数: {formatNumber(competitor.avgViews)}
                  </span>
                </div>
              </div>
              <button
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  isDarkMode
                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/40'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                )}
              >
                詳細を見る
              </button>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* 競合の人気動画TOP10 */}
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
          <Flame size={24} className="text-orange-500" />
          競合の人気動画 TOP10
        </h2>
        {isLoadingVideos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-orange-500" />
          </div>
        ) : popularVideos.length === 0 ? (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            人気動画が見つかりませんでした
          </div>
        ) : (
        <div className="space-y-3">
          {popularVideos.map((video, idx) => (
            <div
              key={video.id}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg transition-colors',
                themeClasses.hoverBg
              )}
            >
              <span
                className={cn(
                  'font-bold text-2xl w-8',
                  isDarkMode ? 'text-slate-700' : 'text-slate-300'
                )}
              >
                {idx + 1}
              </span>
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-32 h-18 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className={cn('font-semibold', themeClasses.text)}>
                  {video.title}
                </h4>
                <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
                  {video.channelName} • {formatNumber(video.views)}回視聴 •{' '}
                  {getTimeAgo(video.publishedAt)}
                </p>
              </div>
              <button
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                分析
              </button>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
