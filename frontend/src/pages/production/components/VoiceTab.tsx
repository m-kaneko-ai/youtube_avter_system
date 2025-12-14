import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Mic,
  Play,
  Pause,
  Download,
  RefreshCw,
  Settings,
  Volume2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { productionService, type VoiceProject } from '../../../services/production';

type VoiceStatus = VoiceProject['status'];

const STATUS_CONFIG: Record<VoiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待機中', color: 'text-slate-500 bg-slate-500/10', icon: <Clock size={14} /> },
  generating: { label: '生成中', color: 'text-blue-500 bg-blue-500/10', icon: <RefreshCw size={14} className="animate-spin" /> },
  completed: { label: '完了', color: 'text-green-500 bg-green-500/10', icon: <CheckCircle2 size={14} /> },
  failed: { label: '失敗', color: 'text-red-500 bg-red-500/10', icon: <AlertCircle size={14} /> },
};

export const VoiceTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  // Voice models query
  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: modelsError,
  } = useQuery({
    queryKey: ['production', 'voice', 'models'],
    queryFn: () => productionService.getVoiceModels(),
  });

  // Voice projects query
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ['production', 'voice', 'projects'],
    queryFn: () => productionService.getVoiceProjects(),
  });

  const voiceModels = modelsData?.models ?? [];
  const projects = projectsData?.projects ?? [];

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Set initial selected model when data loads
  if (voiceModels.length > 0 && !selectedModel) {
    setSelectedModel(voiceModels[0].id);
  }

  const handlePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  return (
    <div className="space-y-8">
      {/* Voice Model Selection */}
      <div
        className={cn(
          'p-6 rounded-2xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100')}>
              <Mic size={20} className="text-purple-500" />
            </div>
            <div>
              <h3 className={cn('font-bold', themeClasses.text)}>音声モデル選択</h3>
              <p className={cn('text-sm', themeClasses.textSecondary)}>MiniMax Audio</p>
            </div>
          </div>
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            )}
          >
            <Settings size={16} />
            詳細設定
          </button>
        </div>

        {isLoadingModels ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-purple-500" />
            <span className={cn('ml-2', themeClasses.textSecondary)}>音声モデルを読み込み中...</span>
          </div>
        ) : modelsError ? (
          <div className={cn('p-4 rounded-xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
            <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm">音声モデルの読み込みに失敗しました</p>
          </div>
        ) : voiceModels.length === 0 ? (
          <div className={cn('p-8 rounded-xl text-center', isDarkMode ? 'bg-slate-800' : 'bg-slate-50')}>
            <Mic size={32} className={cn('mx-auto mb-2', themeClasses.textSecondary)} />
            <p className={themeClasses.textSecondary}>利用可能な音声モデルがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {voiceModels.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedModel === model.id
                    ? isDarkMode
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-purple-500 bg-purple-50'
                    : cn(themeClasses.cardBorder, 'hover:border-purple-300')
                )}
              >
                <div className={cn('w-10 h-10 rounded-full mb-3 flex items-center justify-center', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                  <Volume2 size={18} className={themeClasses.textSecondary} />
                </div>
                <p className={cn('font-medium text-sm mb-1', themeClasses.text)}>{model.name}</p>
                <p className={cn('text-xs', themeClasses.textSecondary)}>{model.language} / {model.gender === 'male' ? '男性' : '女性'}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generation Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('font-bold text-lg', themeClasses.text)}>生成キュー</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all">
            <Sparkles size={16} />
            新規生成
          </button>
        </div>

        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-purple-500" />
            <span className={cn('ml-2', themeClasses.textSecondary)}>プロジェクトを読み込み中...</span>
          </div>
        ) : projectsError ? (
          <div className={cn('p-4 rounded-xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
            <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm">プロジェクトの読み込みに失敗しました</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={cn('p-8 rounded-xl text-center border', themeClasses.cardBg, themeClasses.cardBorder)}>
            <Sparkles size={32} className={cn('mx-auto mb-2', themeClasses.textSecondary)} />
            <p className={themeClasses.textSecondary}>まだ音声プロジェクトがありません</p>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>「新規生成」をクリックして始めましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
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
                  {/* Play Button */}
                  <button
                    onClick={() => handlePlay(project.id)}
                    disabled={project.status !== 'completed'}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                      project.status === 'completed'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                        : isDarkMode
                        ? 'bg-slate-700 text-slate-500'
                        : 'bg-slate-200 text-slate-400'
                    )}
                  >
                    {playingId === project.id ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn('font-medium', themeClasses.text)}>{project.title}</h4>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', STATUS_CONFIG[project.status].color)}>
                        {STATUS_CONFIG[project.status].icon}
                        {STATUS_CONFIG[project.status].label}
                      </span>
                    </div>
                    <p className={cn('text-sm truncate', themeClasses.textSecondary)}>ステータス: {STATUS_CONFIG[project.status].label}</p>
                    <div className={cn('flex items-center gap-4 mt-2 text-xs', themeClasses.textSecondary)}>
                      <span>モデル: {project.voiceModelName}</span>
                      {project.duration && <span>長さ: {project.duration}</span>}
                      <span>{project.createdAt}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {project.status === 'completed' && (
                      <>
                        <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                          <Download size={18} className={themeClasses.textSecondary} />
                        </button>
                        <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                          <RefreshCw size={18} className={themeClasses.textSecondary} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Waveform placeholder */}
                {project.status === 'completed' && (
                  <div className={cn('mt-4 h-12 rounded-lg overflow-hidden', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                    <div className="h-full flex items-center justify-center gap-0.5 px-4">
                      {Array.from({ length: 60 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn('w-1 rounded-full', playingId === project.id ? 'bg-purple-500' : isDarkMode ? 'bg-slate-600' : 'bg-slate-300')}
                          style={{ height: `${Math.random() * 80 + 20}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
