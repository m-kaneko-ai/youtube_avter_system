import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2,
  MousePointerClick,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  MessageSquare,
  Mail,
  Download,
  Disc,
  Radio,
  Globe,
  Settings2,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { ctaService } from '../../../services/cta';
import { Modal, DropdownMenu, toast } from '../../../components/common';
import type {
  CTATemplate,
  CTAType,
  CTAPlacement,
  CTACreateRequest,
  UTMParams,
} from '../../../types';

// ============================================================
// 設定
// ============================================================

const CTA_TYPE_CONFIG: Record<CTAType, { label: string; icon: React.ReactNode; color: string }> = {
  line: { label: 'LINE', icon: <MessageSquare size={16} />, color: 'text-green-500 bg-green-500/10' },
  email: { label: 'メール', icon: <Mail size={16} />, color: 'text-blue-500 bg-blue-500/10' },
  download: { label: 'ダウンロード', icon: <Download size={16} />, color: 'text-purple-500 bg-purple-500/10' },
  discord: { label: 'Discord', icon: <Disc size={16} />, color: 'text-indigo-500 bg-indigo-500/10' },
  webinar: { label: 'ウェビナー', icon: <Radio size={16} />, color: 'text-orange-500 bg-orange-500/10' },
  lp: { label: 'LP', icon: <Globe size={16} />, color: 'text-pink-500 bg-pink-500/10' },
  custom: { label: 'カスタム', icon: <Link2 size={16} />, color: 'text-slate-500 bg-slate-500/10' },
};

const CTA_PLACEMENT_CONFIG: Record<CTAPlacement, { label: string; icon: React.ReactNode }> = {
  description_top: { label: '説明欄（上部）', icon: <ArrowUpRight size={16} /> },
  description_bottom: { label: '説明欄（下部）', icon: <ArrowDownRight size={16} /> },
  pinned_comment: { label: '固定コメント', icon: <MessageSquare size={16} /> },
};

// ============================================================
// CTATab Component
// ============================================================

export const CTATab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showUTMModal, setShowUTMModal] = useState(false);
  const [selectedCTA, setSelectedCTA] = useState<CTATemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    type: CTAType;
    url: string;
    displayText: string;
    placement: CTAPlacement;
    utmParams: UTMParams;
    generateShortUrl: boolean;
    isActive: boolean;
  }>({
    name: '',
    type: 'line',
    url: '',
    displayText: '',
    placement: 'description_top',
    utmParams: { source: 'youtube', medium: 'video', campaign: '' },
    generateShortUrl: false,
    isActive: true,
  });

  // UTM settings form
  const [utmSettings, setUTMSettings] = useState({
    defaultSource: 'youtube',
    defaultMedium: 'video',
    campaignNamingRule: '{video_id}_{cta_type}',
  });

  // Queries
  const {
    data: ctaData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cta', 'list'],
    queryFn: () => ctaService.getCTAList(),
  });

  const { data: utmData } = useQuery({
    queryKey: ['cta', 'utm-settings'],
    queryFn: () => ctaService.getUTMSettings(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CTACreateRequest) => ctaService.createCTA(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cta'] });
      toast.success('CTAを作成しました');
      handleCloseModal();
    },
    onError: () => {
      toast.error('CTAの作成に失敗しました');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CTACreateRequest> }) =>
      ctaService.updateCTA(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cta'] });
      toast.success('CTAを更新しました');
      handleCloseModal();
    },
    onError: () => {
      toast.error('CTAの更新に失敗しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ctaService.deleteCTA(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cta'] });
      toast.success('CTAを削除しました');
    },
    onError: () => {
      toast.error('CTAの削除に失敗しました');
    },
  });

  const updateUTMMutation = useMutation({
    mutationFn: (data: typeof utmSettings) => ctaService.updateUTMSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cta', 'utm-settings'] });
      toast.success('UTM設定を更新しました');
      setShowUTMModal(false);
    },
    onError: () => {
      toast.error('UTM設定の更新に失敗しました');
    },
  });

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedCTA(null);
    setFormData({
      name: '',
      type: 'line',
      url: '',
      displayText: '',
      placement: 'description_top',
      utmParams: {
        source: utmData?.defaultSource || 'youtube',
        medium: utmData?.defaultMedium || 'video',
        campaign: '',
      },
      generateShortUrl: false,
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cta: CTATemplate) => {
    setSelectedCTA(cta);
    setFormData({
      name: cta.name,
      type: cta.type,
      url: cta.url,
      displayText: cta.displayText,
      placement: cta.placement,
      utmParams: cta.utmParams || { source: '', medium: '', campaign: '' },
      generateShortUrl: false,
      isActive: cta.isActive,
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedCTA(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.url || !formData.displayText) {
      toast.error('必須項目を入力してください');
      return;
    }

    const data: CTACreateRequest = {
      name: formData.name,
      type: formData.type,
      url: formData.url,
      displayText: formData.displayText,
      placement: formData.placement,
      utmParams: formData.utmParams.source ? formData.utmParams : undefined,
      generateShortUrl: formData.generateShortUrl,
      isActive: formData.isActive,
    };

    if (selectedCTA) {
      updateMutation.mutate({ id: selectedCTA.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (cta: CTATemplate) => {
    if (confirm(`「${cta.name}」を削除してもよろしいですか？`)) {
      deleteMutation.mutate(cta.id);
    }
  };

  const handleToggleActive = (cta: CTATemplate) => {
    updateMutation.mutate({
      id: cta.id,
      data: { isActive: !cta.isActive },
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URLをコピーしました');
  };

  const handleOpenUTMModal = () => {
    if (utmData) {
      setUTMSettings({
        defaultSource: utmData.defaultSource,
        defaultMedium: utmData.defaultMedium,
        campaignNamingRule: utmData.campaignNamingRule,
      });
    }
    setShowUTMModal(true);
  };

  const ctas = ctaData?.ctas ?? [];
  const stats = ctaData?.stats;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>CTA情報を読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">CTA情報の読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>CTA管理</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            動画説明欄・固定コメント用のCTAテンプレートを管理
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpenUTMModal}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            )}
          >
            <Settings2 size={16} />
            UTM設定
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={16} />
            CTAを追加
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '総CTA数', value: stats.totalCTAs, icon: <Link2 size={20} />, color: 'text-blue-500' },
            { label: '有効なCTA', value: stats.activeCTAs, icon: <ToggleRight size={20} />, color: 'text-green-500' },
            { label: '総クリック数', value: stats.totalClicks.toLocaleString(), icon: <MousePointerClick size={20} />, color: 'text-pink-500' },
            { label: '平均CTR', value: `${stats.avgCTR.toFixed(2)}%`, icon: <TrendingUp size={20} />, color: 'text-purple-500' },
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

      {/* CTA List */}
      <div className="space-y-4">
        {ctas.length === 0 ? (
          <div className={cn('p-8 rounded-2xl border text-center', themeClasses.cardBg, themeClasses.cardBorder)}>
            <Link2 size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
            <p className={themeClasses.text}>CTAがまだありません</p>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
              「CTAを追加」ボタンから最初のCTAを作成しましょう
            </p>
          </div>
        ) : (
          ctas.map((cta) => (
            <div
              key={cta.id}
              className={cn(
                'p-5 rounded-2xl border transition-all hover:shadow-md',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                !cta.isActive && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Type Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    CTA_TYPE_CONFIG[cta.type].color
                  )}
                >
                  {CTA_TYPE_CONFIG[cta.type].icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn('font-bold', themeClasses.text)}>{cta.name}</h4>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        CTA_TYPE_CONFIG[cta.type].color
                      )}
                    >
                      {CTA_TYPE_CONFIG[cta.type].label}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {CTA_PLACEMENT_CONFIG[cta.placement].label}
                    </span>
                    {!cta.isActive && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500">
                        無効
                      </span>
                    )}
                  </div>

                  <p className={cn('text-sm truncate', themeClasses.textSecondary)}>
                    {cta.shortUrl || cta.url}
                  </p>

                  <div className={cn('flex items-center gap-6 mt-3 text-sm', themeClasses.textSecondary)}>
                    <span className="flex items-center gap-1">
                      <MousePointerClick size={14} />
                      {cta.conversionCount.toLocaleString()} クリック
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      CTR: {(cta.ctr ?? 0).toFixed(2)}%
                    </span>
                    <span>更新: {new Date(cta.updatedAt).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(cta)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    )}
                    title={cta.isActive ? '無効にする' : '有効にする'}
                  >
                    {cta.isActive ? (
                      <ToggleRight size={20} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={20} className={themeClasses.textSecondary} />
                    )}
                  </button>

                  <button
                    onClick={() => handleCopyUrl(cta.shortUrl || cta.url)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    )}
                    title="URLをコピー"
                  >
                    <Copy size={16} className={themeClasses.textSecondary} />
                  </button>

                  <a
                    href={cta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    )}
                    title="リンクを開く"
                  >
                    <ExternalLink size={16} className={themeClasses.textSecondary} />
                  </a>

                  <DropdownMenu
                    items={[
                      {
                        id: 'edit',
                        label: '編集',
                        icon: <Edit3 size={16} />,
                        onClick: () => handleOpenEditModal(cta),
                      },
                      {
                        id: 'copy',
                        label: '複製',
                        icon: <Copy size={16} />,
                        onClick: () => {
                          setSelectedCTA(null);
                          setFormData({
                            name: `${cta.name} (コピー)`,
                            type: cta.type,
                            url: cta.url,
                            displayText: cta.displayText,
                            placement: cta.placement,
                            utmParams: cta.utmParams || { source: '', medium: '', campaign: '' },
                            generateShortUrl: false,
                            isActive: true,
                          });
                          setShowAddModal(true);
                        },
                      },
                      {
                        id: 'delete',
                        label: '削除',
                        icon: <Trash2 size={16} />,
                        onClick: () => handleDelete(cta),
                        variant: 'danger',
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Display Text Preview */}
              <div
                className={cn(
                  'mt-4 p-3 rounded-lg text-sm font-mono whitespace-pre-wrap',
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-50'
                )}
              >
                {cta.displayText}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit CTA Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={selectedCTA ? 'CTAを編集' : 'CTAを追加'}
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
              ) : selectedCTA ? (
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
              CTA名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例: LINE公式アカウント誘導"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>

          {/* Type & Placement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                タイプ
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CTAType })}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              >
                {Object.entries(CTA_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                配置場所
              </label>
              <select
                value={formData.placement}
                onChange={(e) =>
                  setFormData({ ...formData, placement: e.target.value as CTAPlacement })
                }
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              >
                {Object.entries(CTA_PLACEMENT_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              リンクURL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="generateShortUrl"
                checked={formData.generateShortUrl}
                onChange={(e) => setFormData({ ...formData, generateShortUrl: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="generateShortUrl" className={cn('text-sm', themeClasses.textSecondary)}>
                短縮URLを自動生成（TinyURL）
              </label>
            </div>
          </div>

          {/* UTM Parameters */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              UTMパラメータ
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={formData.utmParams.source || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    utmParams: { ...formData.utmParams, source: e.target.value },
                  })
                }
                placeholder="utm_source"
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
              <input
                type="text"
                value={formData.utmParams.medium || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    utmParams: { ...formData.utmParams, medium: e.target.value },
                  })
                }
                placeholder="utm_medium"
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
              <input
                type="text"
                value={formData.utmParams.campaign || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    utmParams: { ...formData.utmParams, campaign: e.target.value },
                  })
                }
                placeholder="utm_campaign"
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
              campaign で {'{video_id}'} や {'{cta_type}'} を使用すると自動置換されます
            </p>
          </div>

          {/* Display Text */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              表示テキスト <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.displayText}
              onChange={(e) => setFormData({ ...formData, displayText: e.target.value })}
              placeholder={`例:\n無料特典を受け取る\nhttps://lin.ee/example`}
              rows={4}
              className={cn(
                'w-full px-4 py-2 rounded-xl border font-mono text-sm',
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

      {/* UTM Settings Modal */}
      <Modal
        isOpen={showUTMModal}
        onClose={() => setShowUTMModal(false)}
        title="UTMデフォルト設定"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowUTMModal(false)}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl text-sm font-medium',
                isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={() => updateUTMMutation.mutate(utmSettings)}
              disabled={updateUTMMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {updateUTMMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : (
                '保存'
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              デフォルト utm_source
            </label>
            <input
              type="text"
              value={utmSettings.defaultSource}
              onChange={(e) => setUTMSettings({ ...utmSettings, defaultSource: e.target.value })}
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
              デフォルト utm_medium
            </label>
            <input
              type="text"
              value={utmSettings.defaultMedium}
              onChange={(e) => setUTMSettings({ ...utmSettings, defaultMedium: e.target.value })}
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
              キャンペーン命名規則
            </label>
            <input
              type="text"
              value={utmSettings.campaignNamingRule}
              onChange={(e) =>
                setUTMSettings({ ...utmSettings, campaignNamingRule: e.target.value })
              }
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
              使用可能な変数: {'{video_id}'}, {'{cta_type}'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
