import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Play,
  Pause,
  Download,
  RefreshCw,
  Settings,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Video,
  Layers,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { productionService, type AvatarProject, type AvatarModel, type GenerationStatus } from '../../../services/production';
import { Modal, toast } from '../../../components/common';

type AvatarStatus = AvatarProject['status'];

const STATUS_CONFIG: Record<AvatarStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待機中', color: 'text-slate-500 bg-slate-500/10', icon: <Clock size={14} /> },
  generating: { label: '生成中', color: 'text-blue-500 bg-blue-500/10', icon: <RefreshCw size={14} className="animate-spin" /> },
  completed: { label: '完了', color: 'text-green-500 bg-green-500/10', icon: <CheckCircle2 size={14} /> },
  failed: { label: '失敗', color: 'text-red-500 bg-red-500/10', icon: <AlertCircle size={14} /> },
};

const BACKGROUNDS = ['オフィス', 'スタジオ', 'グリーンバック', 'カスタム背景'];

export const AvatarTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  // Avatar models query
  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: modelsError,
  } = useQuery({
    queryKey: ['production', 'avatar', 'models'],
    queryFn: () => productionService.getAvatarModels(),
  });

  // Avatar projects query
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch,
  } = useQuery({
    queryKey: ['production', 'avatar', 'projects'],
    queryFn: () => productionService.getAvatarProjects(),
  });

  const avatarModels = modelsData?.avatars ?? [];
  const projects = projectsData?.projects ?? [];

  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [selectedBackground, setSelectedBackground] = useState<string>(BACKGROUNDS[0]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Set initial selected avatar when data loads
  if (avatarModels.length > 0 && !selectedAvatar) {
    setSelectedAvatar(avatarModels[0].id);
  }

  const handlePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };

  const handleNewGeneration = () => {
    toast.info('生成を開始しました');
  };

  const handleDownload = (_id: string) => {
    toast.info('ダウンロードを開始しました');
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-8">
      {/* Avatar Selection */}
      <div className="grid grid-cols-2 gap-6">
        <div
          className={cn(
            'p-6 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={cn('p-2 rounded-xl', isDarkMode ? 'bg-pink-900/30' : 'bg-pink-100')}>
              <User size={20} className="text-pink-500" />
            </div>
            <div>
              <h3 className={cn('font-bold', themeClasses.text)}>アバター選択</h3>
              <p className={cn('text-sm', themeClasses.textSecondary)}>HeyGen</p>
            </div>
          </div>

          {isLoadingModels ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-pink-500" />
              <span className={cn('ml-2', themeClasses.textSecondary)}>アバターを読み込み中...</span>
            </div>
          ) : modelsError ? (
            <div className={cn('p-4 rounded-xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
              <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
              <p className="text-red-500 text-sm">アバターの読み込みに失敗しました</p>
            </div>
          ) : avatarModels.length === 0 ? (
            <div className={cn('p-6 rounded-xl text-center', isDarkMode ? 'bg-slate-800' : 'bg-slate-50')}>
              <User size={32} className={cn('mx-auto mb-2', themeClasses.textSecondary)} />
              <p className={themeClasses.textSecondary}>利用可能なアバターがありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {avatarModels.map((avatar: AvatarModel) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-center transition-all',
                    selectedAvatar === avatar.id
                      ? isDarkMode
                        ? 'border-pink-500 bg-pink-900/20'
                        : 'border-pink-500 bg-pink-50'
                      : cn(themeClasses.cardBorder, 'hover:border-pink-300')
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                    <User size={24} className={themeClasses.textSecondary} />
                  </div>
                  <p className={cn('text-xs font-medium truncate', themeClasses.text)}>{avatar.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            'p-6 rounded-2xl border',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={cn('p-2 rounded-xl', isDarkMode ? 'bg-cyan-900/30' : 'bg-cyan-100')}>
              <Layers size={20} className="text-cyan-500" />
            </div>
            <div>
              <h3 className={cn('font-bold', themeClasses.text)}>背景設定</h3>
              <p className={cn('text-sm', themeClasses.textSecondary)}>シーン選択</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedBackground(bg)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedBackground === bg
                    ? isDarkMode
                      ? 'border-cyan-500 bg-cyan-900/20'
                      : 'border-cyan-500 bg-cyan-50'
                    : cn(themeClasses.cardBorder, 'hover:border-cyan-300')
                )}
              >
                <div className={cn('w-full h-16 rounded-lg mb-2 flex items-center justify-center', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                  <Video size={24} className={themeClasses.textSecondary} />
                </div>
                <p className={cn('text-sm font-medium', themeClasses.text)}>{bg}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generation Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('font-bold text-lg', themeClasses.text)}>動画生成キュー</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSettingsClick}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors', isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
            >
              <Settings size={16} />
              詳細設定
            </button>
            <button
              onClick={handleNewGeneration}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-500/20 transition-all"
            >
              <Sparkles size={16} />
              新規生成
            </button>
          </div>
        </div>

        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-pink-500" />
            <span className={cn('ml-2', themeClasses.textSecondary)}>プロジェクトを読み込み中...</span>
          </div>
        ) : projectsError ? (
          <div className={cn('p-4 rounded-xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
            <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm">プロジェクトの読み込みに失敗しました</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={cn('p-8 rounded-xl text-center border', themeClasses.cardBg, themeClasses.cardBorder)}>
            <Video size={32} className={cn('mx-auto mb-2', themeClasses.textSecondary)} />
            <p className={themeClasses.textSecondary}>まだアバター動画プロジェクトがありません</p>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>「新規生成」をクリックして始めましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project: AvatarProject) => (
              <div
                key={project.id}
                className={cn(
                  'p-5 rounded-2xl border transition-all',
                  themeClasses.cardBg,
                  themeClasses.cardBorder,
                  'hover:shadow-md'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className={cn('w-32 h-20 rounded-xl overflow-hidden flex items-center justify-center relative', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                    <Video size={32} className={themeClasses.textSecondary} />
                    {project.status === 'completed' && (
                      <button
                        onClick={() => handlePlay(project.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {playingId === project.id ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn('font-medium', themeClasses.text)}>{project.title}</h4>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', STATUS_CONFIG[project.status as GenerationStatus].color)}>
                        {STATUS_CONFIG[project.status as GenerationStatus].icon}
                        {STATUS_CONFIG[project.status as GenerationStatus].label}
                      </span>
                    </div>
                    <div className={cn('flex items-center gap-4 text-sm', themeClasses.textSecondary)}>
                      <span>アバター: {project.avatarName}</span>
                      {project.duration && <span>長さ: {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}</span>}
                    </div>
                    <p className={cn('text-xs mt-2', themeClasses.textSecondary)}>{project.createdAt}</p>

                    {/* Progress bar */}
                    {project.status === 'generating' && project.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn('text-xs', themeClasses.textSecondary)}>生成中...</span>
                          <span className={cn('text-xs font-medium', themeClasses.text)}>{project.progress}%</span>
                        </div>
                        <div className={cn('h-2 rounded-full overflow-hidden', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {project.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handleDownload(project.id)}
                          className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                        >
                          <Download size={18} className={themeClasses.textSecondary} />
                        </button>
                        <button
                          onClick={handleRefresh}
                          className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                        >
                          <RefreshCw size={18} className={themeClasses.textSecondary} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="アバター動画詳細設定"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              動画解像度
            </label>
            <select
              className={cn(
                'w-full px-3 py-2 rounded-lg border',
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              )}
            >
              <option value="1080p">1080p (フルHD)</option>
              <option value="720p">720p (HD)</option>
              <option value="4k">4K (UHD)</option>
            </select>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              フレームレート
            </label>
            <select
              className={cn(
                'w-full px-3 py-2 rounded-lg border',
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              )}
            >
              <option value="24">24 fps</option>
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
            </select>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              アバター表情の強度
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              defaultValue="70"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>控えめ</span>
              <span>標準</span>
              <span>豊か</span>
            </div>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              カメラアングル
            </label>
            <select
              className={cn(
                'w-full px-3 py-2 rounded-lg border',
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              )}
            >
              <option value="center">センター</option>
              <option value="closeup">クローズアップ</option>
              <option value="wide">ワイド</option>
            </select>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              リップシンク精度
            </label>
            <select
              className={cn(
                'w-full px-3 py-2 rounded-lg border',
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              )}
            >
              <option value="standard">標準</option>
              <option value="high">高精度</option>
              <option value="ultra">最高精度</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
