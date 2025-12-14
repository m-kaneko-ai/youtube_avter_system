import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Youtube,
  Instagram,
  CheckCircle2,
  AlertCircle,
  Settings,
  Link2,
  Unlink,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { publishService } from '../../../services/publish';

// Platform UI configuration
const PLATFORM_CONFIG: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  youtube: { name: 'YouTube', icon: <Youtube size={24} />, color: 'text-red-500' },
  tiktok: {
    name: 'TikTok',
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>,
    color: 'text-black dark:text-white',
  },
  instagram: { name: 'Instagram', icon: <Instagram size={24} />, color: 'text-pink-500' },
};

export const MultiPlatformTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  // Platform connections query
  const {
    data: platformsData,
    isLoading: isLoadingPlatforms,
    error: platformsError,
  } = useQuery({
    queryKey: ['publish', 'platforms'],
    queryFn: () => publishService.getPlatforms(),
  });

  // Cross-posts query
  const {
    data: crossPostsData,
    isLoading: isLoadingCrossPosts,
    error: crossPostsError,
  } = useQuery({
    queryKey: ['publish', 'crossPosts'],
    queryFn: () => publishService.getCrossPosts(),
  });

  const crossPosts = crossPostsData?.crossPosts ?? [];

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['youtube', 'tiktok']);

  // Transform platform connections to include UI config
  const platforms = useMemo(() => {
    const platformConnections = platformsData?.platforms ?? [];
    return platformConnections.map((conn) => ({
      ...conn,
      name: PLATFORM_CONFIG[conn.platform]?.name ?? conn.platform,
      icon: PLATFORM_CONFIG[conn.platform]?.icon,
      color: PLATFORM_CONFIG[conn.platform]?.color ?? 'text-slate-500',
    }));
  }, [platformsData?.platforms]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getPlatformIcon = (platformId: string) => {
    return PLATFORM_CONFIG[platformId]?.icon;
  };

  const isLoading = isLoadingPlatforms || isLoadingCrossPosts;
  const hasError = platformsError || crossPostsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>プラットフォーム情報を読み込み中...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">プラットフォーム情報の読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Platform Connections */}
      <div>
        <h3 className={cn('font-bold text-lg mb-4', themeClasses.text)}>連携プラットフォーム</h3>
        {platforms.length === 0 ? (
          <div className={cn('p-8 rounded-xl text-center border', themeClasses.cardBg, themeClasses.cardBorder)}>
            <Link2 size={32} className={cn('mx-auto mb-2', themeClasses.textSecondary)} />
            <p className={themeClasses.textSecondary}>連携可能なプラットフォームがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className={cn(
                  'p-5 rounded-2xl border transition-all',
                  platform.isConnected
                    ? cn(themeClasses.cardBg, themeClasses.cardBorder)
                    : isDarkMode
                    ? 'bg-slate-800/30 border-slate-700/50 border-dashed'
                    : 'bg-slate-50/50 border-slate-200/50 border-dashed'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('p-3 rounded-xl', isDarkMode ? 'bg-slate-700' : 'bg-slate-100')}>
                    <span className={platform.color}>{platform.icon}</span>
                  </div>
                  {platform.isConnected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500">
                      <CheckCircle2 size={14} />
                      接続済み
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                      <AlertCircle size={14} />
                      未接続
                    </span>
                  )}
                </div>

                <h4 className={cn('font-bold mb-1', themeClasses.text)}>{platform.name}</h4>

                {platform.isConnected ? (
                  <>
                    <p className={cn('text-sm mb-2', themeClasses.textSecondary)}>
                      {platform.accountName}
                    </p>
                    <div className={cn('text-xs mb-4', themeClasses.textSecondary)}>
                      {platform.connectedAt && (
                        <span>接続日: {platform.connectedAt}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className={cn('flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors', isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}>
                        <RefreshCw size={14} />
                        同期
                      </button>
                      <button className={cn('flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors', isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}>
                        <Settings size={14} />
                        設定
                      </button>
                      <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-500')}>
                        <Unlink size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <button className={cn('w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors mt-4', isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')}>
                    <Link2 size={16} />
                    連携する
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cross-Post Settings */}
      <div
        className={cn(
          'p-6 rounded-2xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <h3 className={cn('font-bold text-lg mb-4', themeClasses.text)}>クロスポスト設定</h3>
        <p className={cn('text-sm mb-6', themeClasses.textSecondary)}>
          YouTubeに投稿した動画を他のプラットフォームに自動展開します
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className={cn('p-3 rounded-xl', isDarkMode ? 'bg-red-900/30' : 'bg-red-100')}>
            <Youtube size={24} className="text-red-500" />
          </div>
          <ArrowRight size={20} className={themeClasses.textSecondary} />
          <div className="flex items-center gap-2">
            {platforms
              .filter((p) => p.platform !== 'youtube')
              .map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.platform)}
                  disabled={!platform.isConnected}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all',
                    selectedPlatforms.includes(platform.platform)
                      ? isDarkMode
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-blue-500 bg-blue-50'
                      : platform.isConnected
                      ? cn(themeClasses.cardBorder, 'hover:border-blue-300')
                      : 'border-slate-300 opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className={platform.color}>{platform.icon}</span>
                </button>
              ))}
          </div>
        </div>

        <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-50')}>
          <h4 className={cn('font-medium mb-2', themeClasses.text)}>自動変換オプション</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className={cn('text-sm', themeClasses.textSecondary)}>ショート動画形式に自動トリミング</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className={cn('text-sm', themeClasses.textSecondary)}>字幕を自動追加</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className={cn('text-sm', themeClasses.textSecondary)}>ハッシュタグを自動生成</span>
            </label>
          </div>
        </div>
      </div>

      {/* Cross-Post History */}
      <div>
        <h3 className={cn('font-bold text-lg mb-4', themeClasses.text)}>クロスポスト履歴</h3>
        {crossPosts.length === 0 ? (
          <div className={cn('p-8 rounded-xl text-center border', themeClasses.cardBg, themeClasses.cardBorder)}>
            <ArrowRight size={32} className={cn('mx-auto mb-2', themeClasses.textSecondary)} />
            <p className={themeClasses.textSecondary}>まだクロスポストの履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {crossPosts.map((post) => (
              <div
                key={post.id}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  themeClasses.cardBg,
                  themeClasses.cardBorder
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn('p-2 rounded-lg', isDarkMode ? 'bg-slate-700' : 'bg-slate-100')}>
                    {getPlatformIcon(post.originalPlatform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn('font-medium truncate', themeClasses.text)}>{post.title}</h4>
                    <p className={cn('text-sm', themeClasses.textSecondary)}>{post.createdAt}</p>
                  </div>
                  <ArrowRight size={16} className={themeClasses.textSecondary} />
                  <div className="flex items-center gap-2">
                    {post.platforms.map((target) => (
                      <div
                        key={target.platform}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-lg',
                          target.status === 'published'
                            ? isDarkMode
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-green-100 text-green-700'
                            : target.status === 'scheduled'
                            ? isDarkMode
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-yellow-100 text-yellow-700'
                            : isDarkMode
                            ? 'bg-red-900/30 text-red-400'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {getPlatformIcon(target.platform)}
                        <span className="text-xs font-medium">
                          {target.status === 'published' ? '投稿済' : target.status === 'scheduled' ? '待機中' : '失敗'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                    <ExternalLink size={16} className={themeClasses.textSecondary} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
