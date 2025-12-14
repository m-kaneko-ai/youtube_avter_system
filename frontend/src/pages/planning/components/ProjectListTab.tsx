import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { cn } from '../../../utils/cn';
import { planningService } from '../../../services/planning';
import { DropdownMenu, type DropdownMenuItem } from '../../../components/common';
import { Modal } from '../../../components/common';
import { toast } from '../../../components/common';
import type { VideoType, ProjectStatus, PlanningProject } from '../../../types';

export const ProjectListTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [videoTypeFilter, setVideoTypeFilter] = useState<VideoType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PlanningProject | null>(null);

  // API: GET /api/v1/planning/projects
  const {
    data: projectData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['planning', 'projects', statusFilter, videoTypeFilter, page],
    queryFn: () => planningService.getProjects(
      statusFilter === 'all' ? undefined : statusFilter,
      videoTypeFilter === 'all' ? undefined : videoTypeFilter,
      page,
      pageSize
    ),
  });

  const projects = projectData?.projects ?? [];
  const total = projectData?.total ?? 0;

  const getStatusStyle = (status: ProjectStatus) => {
    if (isDarkMode) {
      switch (status) {
        case 'published':
          return 'bg-green-900/40 text-green-300';
        case 'production':
          return 'bg-yellow-900/40 text-yellow-300';
        case 'planning':
          return 'bg-blue-900/40 text-blue-300';
        case 'scheduled':
          return 'bg-slate-700 text-slate-300';
      }
    } else {
      switch (status) {
        case 'published':
          return 'bg-green-50 text-green-700';
        case 'production':
          return 'bg-yellow-50 text-yellow-700';
        case 'planning':
          return 'bg-blue-50 text-blue-700';
        case 'scheduled':
          return 'bg-slate-100 text-slate-600';
      }
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'published':
        return '🟢 公開済み';
      case 'production':
        return '🟡 制作中';
      case 'planning':
        return '🔵 企画中';
      case 'scheduled':
        return '⚪ 予定';
    }
  };

  const getVideoTypeStyle = (type: VideoType) => {
    if (isDarkMode) {
      return type === 'short'
        ? 'bg-blue-900/40 text-blue-300'
        : 'bg-purple-900/40 text-purple-300';
    } else {
      return type === 'short' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700';
    }
  };

  // クライアントサイドでの検索フィルタリング（APIはステータスと種別のみサポート）
  const filteredProjects = projects.filter((project) => {
    if (
      searchQuery &&
      !project.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page * pageSize < total) setPage(page + 1);
  };

  // 削除ミューテーション
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => planningService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'projects'] });
      toast.success('企画を削除しました');
    },
    onError: () => {
      toast.error('企画の削除に失敗しました');
    },
  });

  const handleEdit = (project: PlanningProject) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleDelete = (project: PlanningProject) => {
    if (window.confirm(`「${project.title}」を削除してもよろしいですか？`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  const handleViewDetail = (project: PlanningProject) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const getDropdownMenuItems = (project: PlanningProject): DropdownMenuItem[] => [
    {
      id: 'edit',
      label: '編集',
      icon: <Edit size={16} />,
      onClick: () => handleEdit(project),
    },
    {
      id: 'detail',
      label: '詳細を見る',
      icon: <Eye size={16} />,
      onClick: () => handleViewDetail(project),
    },
    {
      id: 'delete',
      label: '削除',
      icon: <Trash2 size={16} />,
      onClick: () => handleDelete(project),
      variant: 'danger' as const,
    },
  ];

  // エラー表示
  if (error) {
    return (
      <div className={cn('rounded-3xl shadow-sm border p-8', themeClasses.cardBg, themeClasses.cardBorder)}>
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle size={24} />
          <span>企画一覧の取得に失敗しました。再度お試しください。</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-3xl shadow-sm border p-8', themeClasses.cardBg, themeClasses.cardBorder)}>
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className={cn('text-xl font-bold', themeClasses.text)}>企画一覧</h2>
      </div>

      {/* フィルター・検索 */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
          className={cn(
            'px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-white border-slate-200 text-slate-700'
          )}
        >
          <option value="all">全て</option>
          <option value="published">公開済み</option>
          <option value="production">制作中</option>
          <option value="planning">企画中</option>
          <option value="scheduled">予定</option>
        </select>

        <select
          value={videoTypeFilter}
          onChange={(e) => setVideoTypeFilter(e.target.value as VideoType | 'all')}
          className={cn(
            'px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-white border-slate-200 text-slate-700'
          )}
        >
          <option value="all">全種別</option>
          <option value="short">ショート</option>
          <option value="long">長尺</option>
        </select>

        <div className="flex-1 relative">
          <Search
            className={cn('w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2', themeClasses.textSecondary)}
          />
          <input
            type="text"
            placeholder="企画を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-12 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500'
                : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
            )}
          />
        </div>
      </div>

      {/* テーブル */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className={cn('text-center py-20', themeClasses.textSecondary)}>
          企画が見つかりませんでした
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', isDarkMode ? 'border-slate-700' : 'border-slate-100')}>
              <th
                className={cn('text-left py-3 px-4 text-sm font-semibold', themeClasses.textSecondary)}
              >
                タイトル
              </th>
              <th
                className={cn('text-left py-3 px-4 text-sm font-semibold', themeClasses.textSecondary)}
              >
                種別
              </th>
              <th
                className={cn('text-left py-3 px-4 text-sm font-semibold', themeClasses.textSecondary)}
              >
                ステータス
              </th>
              <th
                className={cn('text-left py-3 px-4 text-sm font-semibold', themeClasses.textSecondary)}
              >
                公開予定
              </th>
              <th
                className={cn('text-left py-3 px-4 text-sm font-semibold', themeClasses.textSecondary)}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project, index) => (
              <tr
                key={project.id}
                className={cn(
                  'transition-colors',
                  index < filteredProjects.length - 1
                    ? isDarkMode
                      ? 'border-b border-slate-700/50'
                      : 'border-b border-slate-50'
                    : '',
                  isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/50'
                )}
              >
                <td className="py-4 px-4">
                  <div className={cn('font-medium', themeClasses.text)}>{project.title}</div>
                  {project.description && (
                    <div className={cn('text-sm mt-0.5', themeClasses.textSecondary)}>
                      {project.description}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                      getVideoTypeStyle(project.videoType)
                    )}
                  >
                    {project.videoType === 'short' ? '📹 ショート' : '🎬 長尺'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                      getStatusStyle(project.status)
                    )}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </td>
                <td className={cn('py-4 px-4', themeClasses.text)}>
                  {project.scheduledDate || '-'}
                </td>
                <td className="py-4 px-4">
                  <DropdownMenu items={getDropdownMenuItems(project)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* ページネーション */}
      <div
        className={cn(
          'flex items-center justify-between mt-6 pt-6 border-t',
          isDarkMode ? 'border-slate-700' : 'border-slate-100'
        )}
      >
        <div className={cn('text-sm', themeClasses.textSecondary)}>
          {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} / {total}件
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className={cn(
              'px-4 py-2 border rounded-lg transition-colors',
              page <= 1
                ? 'opacity-50 cursor-not-allowed'
                : '',
              isDarkMode
                ? 'border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            前へ
          </button>
          <button
            onClick={handleNextPage}
            disabled={page * pageSize >= total}
            className={cn(
              'px-4 py-2 border rounded-lg transition-colors',
              page * pageSize >= total
                ? 'opacity-50 cursor-not-allowed'
                : '',
              isDarkMode
                ? 'border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            次へ
          </button>
        </div>
      </div>

      {/* 編集モーダル */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="企画を編集"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className={cn(
                'px-4 py-2 rounded-xl font-medium transition-colors',
                isDarkMode
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                toast.success('企画を更新しました');
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transition-all"
            >
              保存
            </button>
          </div>
        }
      >
        {selectedProject && (
          <div className="space-y-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                タイトル
              </label>
              <input
                type="text"
                defaultValue={selectedProject.title}
                className={cn(
                  'w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                説明
              </label>
              <textarea
                defaultValue={selectedProject.description}
                rows={3}
                className={cn(
                  'w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                  種別
                </label>
                <select
                  defaultValue={selectedProject.videoType}
                  className={cn(
                    'w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-700'
                  )}
                >
                  <option value="short">ショート</option>
                  <option value="long">長尺</option>
                </select>
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                  ステータス
                </label>
                <select
                  defaultValue={selectedProject.status}
                  className={cn(
                    'w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-700'
                  )}
                >
                  <option value="planning">企画中</option>
                  <option value="production">制作中</option>
                  <option value="scheduled">予定</option>
                  <option value="published">公開済み</option>
                </select>
              </div>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                公開予定日
              </label>
              <input
                type="date"
                defaultValue={selectedProject.scheduledDate}
                className={cn(
                  'w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-700'
                )}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 詳細モーダル */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="企画詳細"
        size="lg"
      >
        {selectedProject && (
          <div className="space-y-4">
            <div>
              <h4 className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                タイトル
              </h4>
              <p className={cn('text-base', themeClasses.text)}>{selectedProject.title}</p>
            </div>
            {selectedProject.description && (
              <div>
                <h4 className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                  説明
                </h4>
                <p className={cn('text-base', themeClasses.text)}>{selectedProject.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                  種別
                </h4>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                    getVideoTypeStyle(selectedProject.videoType)
                  )}
                >
                  {selectedProject.videoType === 'short' ? '📹 ショート' : '🎬 長尺'}
                </span>
              </div>
              <div>
                <h4 className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                  ステータス
                </h4>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                    getStatusStyle(selectedProject.status)
                  )}
                >
                  {getStatusLabel(selectedProject.status)}
                </span>
              </div>
            </div>
            {selectedProject.scheduledDate && (
              <div>
                <h4 className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                  公開予定日
                </h4>
                <p className={cn('text-base', themeClasses.text)}>{selectedProject.scheduledDate}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                  作成日
                </h4>
                <p className={cn('text-sm', themeClasses.text)}>
                  {new Date(selectedProject.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                  更新日
                </h4>
                <p className={cn('text-sm', themeClasses.text)}>
                  {new Date(selectedProject.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
