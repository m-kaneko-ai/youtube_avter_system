import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Scissors,
  FileVideo,
  Clock,
  Upload,
  Download,
  RefreshCw,
  Play,
  Layers,
  Music,
  Type,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { productionService, type EditProject } from '../../../services/production';
import { toast } from '../../../components/common';

type EditStatus = EditProject['status'];

const STATUS_CONFIG: Record<EditStatus, { label: string; color: string }> = {
  pending: { label: '待機中', color: 'text-slate-500 bg-slate-500/10' },
  editing: { label: '編集中', color: 'text-blue-500 bg-blue-500/10' },
  review: { label: 'レビュー中', color: 'text-orange-500 bg-orange-500/10' },
  approved: { label: '承認済み', color: 'text-green-500 bg-green-500/10' },
  exported: { label: 'エクスポート済み', color: 'text-purple-500 bg-purple-500/10' },
};

export const EditTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit projects query
  const {
    data: projectsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['production', 'edit', 'projects'],
    queryFn: () => productionService.getEditProjects(),
  });

  const projects = projectsData?.projects ?? [];

  const handleSubtitleGenerate = () => {
    toast.info('字幕生成を開始しました');
  };

  const handleBGMAdd = () => {
    toast.info('BGM追加を開始しました');
  };

  const handleBRollInsert = () => {
    toast.info('B-roll挿入を開始しました');
  };

  const handleImportVideo = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`${file.name} をインポートしています...`);
    }
  };

  const handleEdit = (_projectId: string) => {
    toast.info('編集画面を開きます');
  };

  const handleDownload = (_projectId: string) => {
    toast.info('ダウンロードを開始しました');
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-8">
      {/* 素材ダウンロードセクション */}
      <div
        className={cn(
          'p-6 rounded-2xl bg-gradient-to-r',
          isDarkMode
            ? 'from-indigo-900/40 to-purple-900/40 border border-indigo-500/30'
            : 'from-indigo-50 to-purple-50 border border-indigo-200'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-xl', isDarkMode ? 'bg-indigo-900/50' : 'bg-indigo-100')}>
              <Download size={24} className="text-indigo-500" />
            </div>
            <div>
              <h3 className={cn('font-bold text-lg', themeClasses.text)}>素材ダウンロード</h3>
              <p className={cn('text-sm', themeClasses.textSecondary)}>
                生成した音声・動画素材をダウンロードしてPremiere Pro等で編集
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.info('全素材をZIPでダウンロードします')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Download size={16} />
            全素材をダウンロード
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={handleSubtitleGenerate}
          className={cn(
            'p-5 rounded-2xl border text-left transition-all hover:shadow-md',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <Type size={24} className="text-blue-500 mb-3" />
          <h4 className={cn('font-bold mb-1', themeClasses.text)}>字幕生成</h4>
          <p className={cn('text-sm', themeClasses.textSecondary)}>
            AIで自動字幕を生成
          </p>
        </button>
        <button
          onClick={handleBGMAdd}
          className={cn(
            'p-5 rounded-2xl border text-left transition-all hover:shadow-md',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <Music size={24} className="text-pink-500 mb-3" />
          <h4 className={cn('font-bold mb-1', themeClasses.text)}>BGM追加</h4>
          <p className={cn('text-sm', themeClasses.textSecondary)}>
            フリーBGMを選択・追加
          </p>
        </button>
        <button
          onClick={handleBRollInsert}
          className={cn(
            'p-5 rounded-2xl border text-left transition-all hover:shadow-md',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <Layers size={24} className="text-green-500 mb-3" />
          <h4 className={cn('font-bold mb-1', themeClasses.text)}>B-roll挿入</h4>
          <p className={cn('text-sm', themeClasses.textSecondary)}>
            関連動画を自動挿入
          </p>
        </button>
      </div>

      {/* Project List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('font-bold text-lg', themeClasses.text)}>編集プロジェクト</h3>
          <button
            onClick={handleImportVideo}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            )}
          >
            <Upload size={16} />
            動画をインポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
            <span className={cn('ml-2', themeClasses.textSecondary)}>プロジェクトを読み込み中...</span>
          </div>
        ) : error ? (
          <div className={cn('p-4 rounded-xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
            <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm">プロジェクトの読み込みに失敗しました</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={cn('p-8 rounded-xl text-center border', themeClasses.cardBg, themeClasses.cardBorder)}>
            <FileVideo size={32} className={cn('mx-auto mb-2', themeClasses.textSecondary)} />
            <p className={themeClasses.textSecondary}>まだ編集プロジェクトがありません</p>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>動画をインポートして始めましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  'p-5 rounded-2xl border transition-all hover:shadow-md',
                  themeClasses.cardBg,
                  themeClasses.cardBorder
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className={cn('w-40 h-24 rounded-xl overflow-hidden flex items-center justify-center relative group', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                    <FileVideo size={32} className={themeClasses.textSecondary} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={24} className="text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={cn('font-medium', themeClasses.text)}>{project.title}</h4>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_CONFIG[project.status].color)}>
                        {STATUS_CONFIG[project.status].label}
                      </span>
                    </div>

                    <div className={cn('flex items-center gap-4 text-sm mb-3', themeClasses.textSecondary)}>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {project.duration}
                      </span>
                      <span>最終編集: {project.lastEditedAt}</span>
                    </div>

                    {/* Elements Count */}
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-1 rounded text-xs', 'text-blue-500 bg-blue-500/10')}>
                        <Layers size={12} className="inline mr-1" />
                        {project.elementsCount} 要素
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(project.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                        isDarkMode
                          ? 'bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                      )}
                    >
                      <Scissors size={16} />
                      編集
                    </button>
                    {project.status === 'exported' && (
                      <button
                        onClick={() => handleDownload(project.id)}
                        className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                      >
                        <Download size={18} className={themeClasses.textSecondary} />
                      </button>
                    )}
                    <button
                      onClick={handleRefresh}
                      className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                    >
                      <RefreshCw size={18} className={themeClasses.textSecondary} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
