import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Link2,
  Video,
  Play,
  Eye,
  MousePointerClick,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { engagementService } from '../../../services/engagement';
import { Modal, DropdownMenu, toast } from '../../../components/common';
import type {
  ShortToLongLink,
  ShortToLongLinkCreateRequest,
  EngagementStatus,
  LinkType,
  LinkPosition,
} from '../../../types';

// ============================================================
// 設定
// ============================================================

const STATUS_CONFIG: Record<EngagementStatus, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'text-slate-500 bg-slate-500/10' },
  active: { label: '有効', color: 'text-green-500 bg-green-500/10' },
  paused: { label: '一時停止', color: 'text-yellow-500 bg-yellow-500/10' },
  completed: { label: '完了', color: 'text-blue-500 bg-blue-500/10' },
  archived: { label: 'アーカイブ', color: 'text-slate-400 bg-slate-400/10' },
};

const LINK_TYPE_CONFIG: Record<LinkType, { label: string; description: string }> = {
  description: { label: '説明欄リンク', description: '動画説明欄にリンクを配置' },
  pinned_comment: { label: '固定コメント', description: '固定コメントでリンク誘導' },
  card: { label: 'カード', description: 'YouTubeカードで表示' },
  end_screen: { label: '終了画面', description: '動画終了時に表示' },
};

const LINK_POSITION_CONFIG: Record<LinkPosition, { label: string }> = {
  top: { label: '上部' },
  middle: { label: '中央' },
  bottom: { label: '下部' },
};

// ============================================================
// ShortToLongLinkTab Component
// ============================================================

export const ShortToLongLinkTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'all' | EngagementStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ShortToLongLink | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    shortVideoId: string;
    longVideoId: string;
    linkType: LinkType;
    linkText: string;
    linkPosition: LinkPosition;
    isActive: boolean;
  }>({
    shortVideoId: '',
    longVideoId: '',
    linkType: 'description',
    linkText: '',
    linkPosition: 'top',
    isActive: true,
  });

  // Queries
  const {
    data: linkData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['engagement', 'links', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () =>
      engagementService.getLinkList(
        statusFilter === 'all' ? undefined : { status: statusFilter }
      ),
  });

  const { data: summary } = useQuery({
    queryKey: ['engagement', 'summary'],
    queryFn: () => engagementService.getSummary(),
  });

  const { data: performance, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['engagement', 'performance', selectedLink?.id],
    queryFn: () =>
      selectedLink ? engagementService.getLinkPerformance(selectedLink.id) : null,
    enabled: !!selectedLink && showPerformanceModal,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ShortToLongLinkCreateRequest) => engagementService.createLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
      toast.success('連携を作成しました');
      handleCloseModal();
    },
    onError: () => {
      toast.error('連携の作成に失敗しました');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShortToLongLinkCreateRequest> }) =>
      engagementService.updateLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
      toast.success('連携を更新しました');
      handleCloseModal();
    },
    onError: () => {
      toast.error('連携の更新に失敗しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => engagementService.deleteLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
      toast.success('連携を削除しました');
    },
    onError: () => {
      toast.error('連携の削除に失敗しました');
    },
  });

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedLink(null);
    setFormData({
      shortVideoId: '',
      longVideoId: '',
      linkType: 'description',
      linkText: '',
      linkPosition: 'top',
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (link: ShortToLongLink) => {
    setSelectedLink(link);
    setFormData({
      shortVideoId: link.shortVideoId,
      longVideoId: link.longVideoId,
      linkType: link.linkType as LinkType,
      linkText: link.linkText || '',
      linkPosition: (link.linkPosition as LinkPosition) || 'top',
      isActive: link.isActive,
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedLink(null);
  };

  const handleSubmit = () => {
    if (!formData.shortVideoId || !formData.longVideoId) {
      toast.error('ショート動画と長尺動画を選択してください');
      return;
    }

    const data: ShortToLongLinkCreateRequest = {
      shortVideoId: formData.shortVideoId,
      longVideoId: formData.longVideoId,
      linkType: formData.linkType,
      linkText: formData.linkText || undefined,
      linkPosition: formData.linkPosition,
      isActive: formData.isActive,
    };

    if (selectedLink) {
      updateMutation.mutate({ id: selectedLink.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (link: ShortToLongLink) => {
    if (confirm('この連携を削除してもよろしいですか？')) {
      deleteMutation.mutate(link.id);
    }
  };

  const handleToggleActive = (link: ShortToLongLink) => {
    updateMutation.mutate({
      id: link.id,
      data: { isActive: !link.isActive },
    });
  };

  const handleShowPerformance = (link: ShortToLongLink) => {
    setSelectedLink(link);
    setShowPerformanceModal(true);
  };

  const links = linkData?.links ?? [];
  const filteredLinks =
    statusFilter === 'all' ? links : links.filter((l) => l.status === statusFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>連携データを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">連携データの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>ショート→長尺連携</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            ショート動画から長尺動画への誘導リンクを管理
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={16} />
          連携を追加
        </button>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '総連携数', value: summary.totalLinks, icon: <Link2 size={20} />, color: 'text-blue-500' },
            { label: '有効な連携', value: summary.activeLinks, icon: <ToggleRight size={20} />, color: 'text-green-500' },
            { label: '総クリック数', value: summary.totalClicks.toLocaleString(), icon: <MousePointerClick size={20} />, color: 'text-pink-500' },
            { label: '平均CTR', value: `${summary.avgCTR.toFixed(2)}%`, icon: <TrendingUp size={20} />, color: 'text-purple-500' },
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
          { id: 'active' as const, label: '有効' },
          { id: 'paused' as const, label: '一時停止' },
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

      {/* Link List */}
      <div className="space-y-4">
        {filteredLinks.length === 0 ? (
          <div className={cn('p-8 rounded-2xl border text-center', themeClasses.cardBg, themeClasses.cardBorder)}>
            <Link2 size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
            <p className={themeClasses.text}>連携がまだありません</p>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
              「連携を追加」ボタンから最初の連携を作成しましょう
            </p>
          </div>
        ) : (
          filteredLinks.map((link) => (
            <div
              key={link.id}
              className={cn(
                'p-5 rounded-2xl border transition-all hover:shadow-md',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                !link.isActive && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Short Video */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                      )}
                    >
                      <Play size={20} className="text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-xs uppercase font-medium', themeClasses.textSecondary)}>
                        ショート
                      </p>
                      <p className={cn('font-bold truncate', themeClasses.text)}>
                        {link.shortVideo?.title || 'ショート動画'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrow with Link Type */}
                <div className="flex flex-col items-center gap-1 px-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      STATUS_CONFIG[link.status].color
                    )}
                  >
                    {STATUS_CONFIG[link.status].label}
                  </span>
                  <ArrowRight size={24} className={themeClasses.textSecondary} />
                  <span className={cn('text-xs', themeClasses.textSecondary)}>
                    {LINK_TYPE_CONFIG[link.linkType as LinkType]?.label || link.linkType}
                  </span>
                </div>

                {/* Long Video */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                      )}
                    >
                      <Video size={20} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-xs uppercase font-medium', themeClasses.textSecondary)}>
                        長尺
                      </p>
                      <p className={cn('font-bold truncate', themeClasses.text)}>
                        {link.longVideo?.title || '長尺動画'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    )}
                    title={link.isActive ? '無効にする' : '有効にする'}
                  >
                    {link.isActive ? (
                      <ToggleRight size={20} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={20} className={themeClasses.textSecondary} />
                    )}
                  </button>

                  <button
                    onClick={() => handleShowPerformance(link)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    )}
                    title="パフォーマンス"
                  >
                    <BarChart3 size={16} className={themeClasses.textSecondary} />
                  </button>

                  <DropdownMenu
                    items={[
                      {
                        id: 'edit',
                        label: '編集',
                        icon: <Edit3 size={16} />,
                        onClick: () => handleOpenEditModal(link),
                      },
                      {
                        id: 'view-short',
                        label: 'ショート動画を見る',
                        icon: <ExternalLink size={16} />,
                        onClick: () =>
                          link.shortVideo?.youtubeUrl &&
                          window.open(link.shortVideo.youtubeUrl, '_blank'),
                      },
                      {
                        id: 'view-long',
                        label: '長尺動画を見る',
                        icon: <ExternalLink size={16} />,
                        onClick: () =>
                          link.longVideo?.youtubeUrl &&
                          window.open(link.longVideo.youtubeUrl, '_blank'),
                      },
                      {
                        id: 'delete',
                        label: '削除',
                        icon: <Trash2 size={16} />,
                        onClick: () => handleDelete(link),
                        variant: 'danger',
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Link Text Preview */}
              {link.linkText && (
                <div
                  className={cn(
                    'mt-4 p-3 rounded-lg text-sm',
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-50'
                  )}
                >
                  <p className={cn('text-xs mb-1', themeClasses.textSecondary)}>誘導テキスト:</p>
                  <p className={themeClasses.text}>{link.linkText}</p>
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
                  作成: {new Date(link.createdAt).toLocaleDateString('ja-JP')}
                </span>
                <span className="flex items-center gap-1">
                  更新: {new Date(link.updatedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={selectedLink ? '連携を編集' : '連携を追加'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleCloseModal}
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
              ) : selectedLink ? (
                '保存'
              ) : (
                '作成'
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Video Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                ショート動画 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.shortVideoId}
                onChange={(e) => setFormData({ ...formData, shortVideoId: e.target.value })}
                placeholder="ショート動画ID"
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
                長尺動画 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.longVideoId}
                onChange={(e) => setFormData({ ...formData, longVideoId: e.target.value })}
                placeholder="長尺動画ID"
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
          </div>

          {/* Link Type & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                連携タイプ
              </label>
              <select
                value={formData.linkType}
                onChange={(e) => setFormData({ ...formData, linkType: e.target.value as LinkType })}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              >
                {Object.entries(LINK_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                配置位置
              </label>
              <select
                value={formData.linkPosition}
                onChange={(e) =>
                  setFormData({ ...formData, linkPosition: e.target.value as LinkPosition })
                }
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              >
                {Object.entries(LINK_POSITION_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Link Text */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              誘導テキスト
            </label>
            <textarea
              value={formData.linkText}
              onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
              placeholder="例: フル動画はこちら → [リンク]"
              rows={3}
              className={cn(
                'w-full px-4 py-2 rounded-xl border resize-none',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <span className={cn('text-sm font-medium', themeClasses.text)}>有効にする</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Modal>

      {/* Performance Modal */}
      <Modal
        isOpen={showPerformanceModal}
        onClose={() => {
          setShowPerformanceModal(false);
          setSelectedLink(null);
        }}
        title="連携パフォーマンス"
        size="lg"
      >
        {isLoadingPerformance ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : performance ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className={cn('font-bold', themeClasses.text)}>
                {performance.shortVideoTitle} → {performance.longVideoTitle}
              </h3>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'ショート再生', value: performance.totalShortViews.toLocaleString(), icon: <Eye size={16} /> },
                { label: 'クリック数', value: performance.totalClicks.toLocaleString(), icon: <MousePointerClick size={16} /> },
                { label: 'CTR', value: `${performance.ctr.toFixed(2)}%`, icon: <TrendingUp size={16} /> },
                { label: 'コンバージョン', value: performance.totalConversions.toLocaleString(), icon: <BarChart3 size={16} /> },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className={cn(
                    'p-4 rounded-xl border text-center',
                    themeClasses.cardBg,
                    themeClasses.cardBorder
                  )}
                >
                  <div className={cn('mb-2', themeClasses.textSecondary)}>{metric.icon}</div>
                  <p className={cn('text-xl font-bold', themeClasses.text)}>{metric.value}</p>
                  <p className={cn('text-xs', themeClasses.textSecondary)}>{metric.label}</p>
                </div>
              ))}
            </div>

            {/* Daily Stats */}
            {performance.dailyStats.length > 0 && (
              <div>
                <h4 className={cn('font-bold mb-3', themeClasses.text)}>日別統計</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={cn('text-xs', themeClasses.textSecondary)}>
                        <th className="text-left py-2 px-3">日付</th>
                        <th className="text-right py-2 px-3">ショート再生</th>
                        <th className="text-right py-2 px-3">長尺再生</th>
                        <th className="text-right py-2 px-3">クリック</th>
                        <th className="text-right py-2 px-3">CV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.dailyStats.slice(0, 7).map((day) => (
                        <tr
                          key={day.date}
                          className={cn(
                            'border-t',
                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                          )}
                        >
                          <td className={cn('py-2 px-3 text-sm', themeClasses.text)}>
                            {new Date(day.date).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className={cn('py-2 px-3 text-sm text-right', themeClasses.text)}>
                            {day.shortViews.toLocaleString()}
                          </td>
                          <td className={cn('py-2 px-3 text-sm text-right', themeClasses.text)}>
                            {day.longViews.toLocaleString()}
                          </td>
                          <td className={cn('py-2 px-3 text-sm text-right', themeClasses.text)}>
                            {day.clicks.toLocaleString()}
                          </td>
                          <td className={cn('py-2 px-3 text-sm text-right', themeClasses.text)}>
                            {day.conversions.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={cn('text-center py-10', themeClasses.textSecondary)}>
            パフォーマンスデータがありません
          </div>
        )}
      </Modal>
    </div>
  );
};
