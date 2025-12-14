import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Video,
  Eye,
  Plus,
  Calendar,
  BarChart3,
  Play,
  Clock,
  Settings,
  Loader2,
  AlertCircle,
  GripVertical,
  Trash2,
  Edit3,
  ExternalLink,
  ListVideo,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Youtube,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { seriesService } from '../../../services/series';
import { Modal, DropdownMenu, toast } from '../../../components/common';
import type {
  Series,
  SeriesVideoItem,
  SeriesCreateRequest,
  SeriesStatus,
  SeriesType,
} from '../../../types';

// ============================================================
// 設定
// ============================================================

const STATUS_CONFIG: Record<SeriesStatus, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'text-slate-500 bg-slate-500/10' },
  active: { label: '進行中', color: 'text-green-500 bg-green-500/10' },
  paused: { label: '休止中', color: 'text-yellow-500 bg-yellow-500/10' },
  completed: { label: '完結', color: 'text-blue-500 bg-blue-500/10' },
  archived: { label: 'アーカイブ', color: 'text-slate-400 bg-slate-400/10' },
};

const TYPE_CONFIG: Record<SeriesType, { label: string; icon: React.ReactNode; color: string }> = {
  playlist: { label: '再生リスト', icon: <ListVideo size={16} />, color: 'text-blue-500 bg-blue-500/10' },
  topic: { label: 'トピック', icon: <Layers size={16} />, color: 'text-purple-500 bg-purple-500/10' },
  tutorial: { label: 'チュートリアル', icon: <Play size={16} />, color: 'text-green-500 bg-green-500/10' },
  seasonal: { label: '季節限定', icon: <Calendar size={16} />, color: 'text-orange-500 bg-orange-500/10' },
  campaign: { label: 'キャンペーン', icon: <TrendingUp size={16} />, color: 'text-pink-500 bg-pink-500/10' },
};

// ============================================================
// SeriesDetailTab Component
// ============================================================

export const SeriesDetailTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'all' | SeriesStatus>('all');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    seriesType: SeriesType;
    youtubePlaylistId: string;
    tags: string;
    targetVideoCount: number;
    releaseFrequency: string;
  }>({
    name: '',
    description: '',
    seriesType: 'playlist',
    youtubePlaylistId: '',
    tags: '',
    targetVideoCount: 10,
    releaseFrequency: 'weekly',
  });

  const [addVideoData, setAddVideoData] = useState({
    videoId: '',
    episodeNumber: 1,
    episodeTitle: '',
  });

  // Queries
  const {
    data: seriesListData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['series', 'list', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () =>
      seriesService.getSeriesList(
        statusFilter === 'all' ? undefined : { status: statusFilter }
      ),
  });

  const { data: stats } = useQuery({
    queryKey: ['series', 'stats'],
    queryFn: () => seriesService.getStats(),
  });

  const { data: seriesDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['series', 'detail', selectedSeries],
    queryFn: () => (selectedSeries ? seriesService.getSeries(selectedSeries) : null),
    enabled: !!selectedSeries,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: SeriesCreateRequest) => seriesService.createSeries(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('シリーズを作成しました');
      handleCloseCreateModal();
    },
    onError: () => {
      toast.error('シリーズの作成に失敗しました');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SeriesCreateRequest> }) =>
      seriesService.updateSeries(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('シリーズを更新しました');
      handleCloseCreateModal();
    },
    onError: () => {
      toast.error('シリーズの更新に失敗しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => seriesService.deleteSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('シリーズを削除しました');
      setSelectedSeries(null);
    },
    onError: () => {
      toast.error('シリーズの削除に失敗しました');
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: ({ seriesId, data }: { seriesId: string; data: { videoId: string; episodeNumber?: number; episodeTitle?: string } }) =>
      seriesService.addVideo(seriesId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('動画を追加しました');
      setShowAddVideoModal(false);
      setAddVideoData({ videoId: '', episodeNumber: 1, episodeTitle: '' });
    },
    onError: () => {
      toast.error('動画の追加に失敗しました');
    },
  });

  const removeVideoMutation = useMutation({
    mutationFn: ({ seriesId, videoId }: { seriesId: string; videoId: string }) =>
      seriesService.removeVideo(seriesId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      toast.success('動画を削除しました');
    },
    onError: () => {
      toast.error('動画の削除に失敗しました');
    },
  });

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingSeries(null);
    setFormData({
      name: '',
      description: '',
      seriesType: 'playlist',
      youtubePlaylistId: '',
      tags: '',
      targetVideoCount: 10,
      releaseFrequency: 'weekly',
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (series: Series) => {
    setEditingSeries(series);
    setFormData({
      name: series.name,
      description: series.description || '',
      seriesType: series.seriesType,
      youtubePlaylistId: series.youtubePlaylistId || '',
      tags: series.tags?.join(', ') || '',
      targetVideoCount: series.targetVideoCount || 10,
      releaseFrequency: series.releaseFrequency || 'weekly',
    });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setEditingSeries(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('シリーズ名を入力してください');
      return;
    }

    const data: SeriesCreateRequest = {
      name: formData.name,
      description: formData.description || undefined,
      seriesType: formData.seriesType,
      youtubePlaylistId: formData.youtubePlaylistId || undefined,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      targetVideoCount: formData.targetVideoCount,
      releaseFrequency: formData.releaseFrequency,
    };

    if (editingSeries) {
      updateMutation.mutate({ id: editingSeries.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (series: Series) => {
    if (confirm(`「${series.name}」を削除してもよろしいですか？`)) {
      deleteMutation.mutate(series.id);
    }
  };

  const handleAddVideo = () => {
    if (!selectedSeries || !addVideoData.videoId) {
      toast.error('動画IDを入力してください');
      return;
    }
    addVideoMutation.mutate({
      seriesId: selectedSeries,
      data: {
        videoId: addVideoData.videoId,
        episodeNumber: addVideoData.episodeNumber,
        episodeTitle: addVideoData.episodeTitle || undefined,
      },
    });
  };

  const handleRemoveVideo = (seriesId: string, videoId: string) => {
    if (confirm('この動画をシリーズから削除しますか？')) {
      removeVideoMutation.mutate({ seriesId, videoId });
    }
  };

  const toggleExpanded = (seriesId: string) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(seriesId)) {
      newExpanded.delete(seriesId);
    } else {
      newExpanded.add(seriesId);
    }
    setExpandedSeries(newExpanded);
  };

  const seriesList = seriesListData?.series ?? [];
  const filteredSeries =
    statusFilter === 'all' ? seriesList : seriesList.filter((s) => s.status === statusFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>シリーズデータを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mx-8 p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">シリーズデータの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>シリーズ詳細管理</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            シリーズの作成・編集・動画管理
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={16} />
          新規シリーズ作成
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: '総シリーズ', value: stats.totalSeries, icon: <Layers size={20} />, color: 'text-blue-500' },
            { label: '進行中', value: stats.activeSeries, icon: <Play size={20} />, color: 'text-green-500' },
            { label: '総動画数', value: stats.totalVideos, icon: <Video size={20} />, color: 'text-purple-500' },
            { label: '総再生数', value: `${(stats.totalViews / 10000).toFixed(0)}万`, icon: <Eye size={20} />, color: 'text-pink-500' },
            { label: '平均動画数', value: stats.avgVideosPerSeries.toFixed(1), icon: <BarChart3 size={20} />, color: 'text-orange-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn('p-5 rounded-2xl border', themeClasses.cardBg, themeClasses.cardBorder)}
            >
              <div className={cn('mb-3', stat.color)}>{stat.icon}</div>
              <p className={cn('text-2xl font-bold', themeClasses.text)}>{stat.value}</p>
              <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className={cn('flex p-1 rounded-xl w-fit', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
        {[
          { id: 'all' as const, label: 'すべて' },
          { id: 'active' as const, label: '進行中' },
          { id: 'completed' as const, label: '完結' },
          { id: 'paused' as const, label: '休止中' },
          { id: 'draft' as const, label: '下書き' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              statusFilter === f.id
                ? cn(themeClasses.cardBg, 'shadow-sm', themeClasses.text)
                : themeClasses.textSecondary
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Series List */}
      <div className="space-y-4">
        {filteredSeries.length === 0 ? (
          <div className={cn('p-8 rounded-2xl border text-center', themeClasses.cardBg, themeClasses.cardBorder)}>
            <Layers size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
            <p className={themeClasses.text}>シリーズがまだありません</p>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
              「新規シリーズ作成」ボタンから最初のシリーズを作成しましょう
            </p>
          </div>
        ) : (
          filteredSeries.map((series) => (
            <div
              key={series.id}
              className={cn(
                'rounded-2xl border transition-all',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                expandedSeries.has(series.id) && 'shadow-lg'
              )}
            >
              {/* Series Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => {
                  toggleExpanded(series.id);
                  setSelectedSeries(series.id);
                }}
              >
                <div className="flex items-start gap-5">
                  {/* Thumbnail Placeholder */}
                  <div
                    className={cn(
                      'w-40 h-24 rounded-xl flex items-center justify-center shrink-0',
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    )}
                  >
                    {series.thumbnailUrl ? (
                      <img
                        src={series.thumbnailUrl}
                        alt={series.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Layers size={32} className={themeClasses.textSecondary} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={cn('font-bold text-lg', themeClasses.text)}>{series.name}</h3>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_CONFIG[series.status].color)}>
                        {STATUS_CONFIG[series.status].label}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1', TYPE_CONFIG[series.seriesType].color)}>
                        {TYPE_CONFIG[series.seriesType].icon}
                        {TYPE_CONFIG[series.seriesType].label}
                      </span>
                    </div>
                    {series.description && (
                      <p className={cn('text-sm mb-3 line-clamp-2', themeClasses.textSecondary)}>
                        {series.description}
                      </p>
                    )}

                    {/* Metrics */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Video size={16} className="text-blue-500" />
                        <span className={cn('text-sm', themeClasses.text)}>
                          <span className="font-bold">{series.totalVideos}</span> 本
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-pink-500" />
                        <span className={cn('text-sm', themeClasses.text)}>
                          <span className="font-bold">{(series.totalViews / 10000).toFixed(1)}万</span> 再生
                        </span>
                      </div>
                      {series.totalWatchTimeHours && (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-green-500" />
                          <span className={cn('text-sm', themeClasses.text)}>
                            <span className="font-bold">{series.totalWatchTimeHours.toFixed(0)}</span> 時間
                          </span>
                        </div>
                      )}
                      {series.youtubePlaylistId && (
                        <div className="flex items-center gap-2">
                          <Youtube size={16} className="text-red-500" />
                          <span className={cn('text-sm', themeClasses.textSecondary)}>
                            YouTube連携済み
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSeries(series.id);
                        setShowAddVideoModal(true);
                      }}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                        isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
                      )}
                    >
                      <Plus size={16} />
                      動画追加
                    </button>
                    <DropdownMenu
                      items={[
                        {
                          id: 'edit',
                          label: 'シリーズ編集',
                          icon: <Edit3 size={16} />,
                          onClick: () => handleOpenEditModal(series),
                        },
                        {
                          id: 'settings',
                          label: '設定',
                          icon: <Settings size={16} />,
                          onClick: () => toast.info('設定画面を開きます'),
                        },
                        ...(series.youtubePlaylistUrl
                          ? [
                              {
                                id: 'youtube',
                                label: 'YouTubeで開く',
                                icon: <ExternalLink size={16} />,
                                onClick: () => window.open(series.youtubePlaylistUrl, '_blank'),
                              },
                            ]
                          : []),
                        {
                          id: 'delete',
                          label: '削除',
                          icon: <Trash2 size={16} />,
                          onClick: () => handleDelete(series),
                          variant: 'danger',
                        },
                      ]}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(series.id);
                        setSelectedSeries(series.id);
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                      )}
                    >
                      {expandedSeries.has(series.id) ? (
                        <ChevronUp size={20} className={themeClasses.textSecondary} />
                      ) : (
                        <ChevronDown size={20} className={themeClasses.textSecondary} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {series.tags && series.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    {series.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          'px-2 py-0.5 rounded text-xs',
                          isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timeline */}
                <div
                  className={cn(
                    'flex items-center gap-4 mt-4 pt-4 border-t text-xs',
                    isDarkMode ? 'border-slate-700' : 'border-slate-200',
                    themeClasses.textSecondary
                  )}
                >
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    作成: {new Date(series.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  {series.releaseFrequency && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      公開頻度: {series.releaseFrequency}
                    </span>
                  )}
                  {series.targetVideoCount && (
                    <span className="flex items-center gap-1">
                      <Video size={12} />
                      目標: {series.targetVideoCount}本
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Video List */}
              {expandedSeries.has(series.id) && (
                <div
                  className={cn(
                    'border-t px-6 py-4',
                    isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
                  )}
                >
                  {isLoadingDetail && selectedSeries === series.id ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="animate-spin text-blue-500" />
                    </div>
                  ) : seriesDetail && seriesDetail.id === series.id ? (
                    <div className="space-y-3">
                      <h4 className={cn('font-bold text-sm', themeClasses.text)}>
                        動画一覧 ({seriesDetail.videoItems?.length || 0}本)
                      </h4>
                      {seriesDetail.videoItems && seriesDetail.videoItems.length > 0 ? (
                        <div className="space-y-2">
                          {seriesDetail.videoItems.map((item: SeriesVideoItem, index: number) => (
                            <div
                              key={item.id}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border',
                                themeClasses.cardBg,
                                themeClasses.cardBorder
                              )}
                            >
                              <GripVertical size={16} className={themeClasses.textSecondary} />
                              <span className={cn('text-sm font-bold w-8', themeClasses.textSecondary)}>
                                #{item.episodeNumber || index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={cn('font-medium truncate', themeClasses.text)}>
                                  {item.episodeTitle || item.video?.title || '無題の動画'}
                                </p>
                                <div className={cn('flex items-center gap-4 text-xs mt-1', themeClasses.textSecondary)}>
                                  <span className="flex items-center gap-1">
                                    <Eye size={12} />
                                    {item.views.toLocaleString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users size={12} />
                                    {item.likes.toLocaleString()}
                                  </span>
                                  {item.isPublished && (
                                    <span className="text-green-500">公開済み</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveVideo(series.id, item.videoId)}
                                className={cn(
                                  'p-1.5 rounded-lg text-red-500 transition-colors',
                                  isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'
                                )}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={cn('text-center py-6', themeClasses.textSecondary)}>
                          このシリーズには動画がありません
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={cn('text-center py-6', themeClasses.textSecondary)}>
                      動画データを取得中...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Series Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title={editingSeries ? 'シリーズを編集' : '新規シリーズ作成'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleCloseCreateModal}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl text-sm font-medium',
                isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : editingSeries ? (
                '保存'
              ) : (
                '作成'
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              シリーズ名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例: AI解説シリーズ"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>

          {/* Description */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="シリーズの説明を入力"
              rows={3}
              className={cn(
                'w-full px-4 py-2 rounded-xl border resize-none',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>

          {/* Type & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                シリーズタイプ
              </label>
              <select
                value={formData.seriesType}
                onChange={(e) => setFormData({ ...formData, seriesType: e.target.value as SeriesType })}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              >
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                公開頻度
              </label>
              <select
                value={formData.releaseFrequency}
                onChange={(e) => setFormData({ ...formData, releaseFrequency: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              >
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="biweekly">隔週</option>
                <option value="monthly">毎月</option>
                <option value="irregular">不定期</option>
              </select>
            </div>
          </div>

          {/* YouTube & Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                YouTube再生リストID
              </label>
              <input
                type="text"
                value={formData.youtubePlaylistId}
                onChange={(e) => setFormData({ ...formData, youtubePlaylistId: e.target.value })}
                placeholder="PLxxxxxxxx"
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                目標動画数
              </label>
              <input
                type="number"
                value={formData.targetVideoCount}
                onChange={(e) => setFormData({ ...formData, targetVideoCount: parseInt(e.target.value) || 0 })}
                min={1}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              タグ
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="AI, 解説, チュートリアル（カンマ区切り）"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Add Video Modal */}
      <Modal
        isOpen={showAddVideoModal}
        onClose={() => setShowAddVideoModal(false)}
        title="動画を追加"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddVideoModal(false)}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl text-sm font-medium',
                isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleAddVideo}
              disabled={addVideoMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {addVideoMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : (
                '追加'
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              動画ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addVideoData.videoId}
              onChange={(e) => setAddVideoData({ ...addVideoData, videoId: e.target.value })}
              placeholder="動画のUUID"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                エピソード番号
              </label>
              <input
                type="number"
                value={addVideoData.episodeNumber}
                onChange={(e) => setAddVideoData({ ...addVideoData, episodeNumber: parseInt(e.target.value) || 1 })}
                min={1}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                エピソードタイトル
              </label>
              <input
                type="text"
                value={addVideoData.episodeTitle}
                onChange={(e) => setAddVideoData({ ...addVideoData, episodeTitle: e.target.value })}
                placeholder="省略可"
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
