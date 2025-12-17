import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Image,
  Plus,
  Play,
  Pause,
  TrendingUp,
  Eye,
  MousePointer,
  Loader2,
  AlertCircle,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { optimizationService } from '../../../services/optimization';
import { Modal, toast } from '../../../components/common';
import type { ABTestCreateRequest, ABTestStatus } from '../../../types';

export const ThumbnailABTestTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<ABTestStatus | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [testName, setTestName] = useState('');
  const [videoId, setVideoId] = useState('');
  const [variantAUrl, setVariantAUrl] = useState('');
  const [variantBUrl, setVariantBUrl] = useState('');
  const [durationHours, setDurationHours] = useState(24);

  // A/B Tests query
  const {
    data: testsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['optimization', 'abtest', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () => optimizationService.getABTests({
      status: statusFilter === 'all' ? undefined : statusFilter,
      testType: 'thumbnail',
    }),
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: (data: ABTestCreateRequest) => optimizationService.createABTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization', 'abtest'] });
      toast.success('A/Bテストを作成しました');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('A/Bテストの作成に失敗しました');
    },
  });

  // Start test mutation
  const startTestMutation = useMutation({
    mutationFn: (testId: string) => optimizationService.startABTest(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization', 'abtest'] });
      toast.success('テストを開始しました');
    },
    onError: () => {
      toast.error('テストの開始に失敗しました');
    },
  });

  // Stop test mutation
  const stopTestMutation = useMutation({
    mutationFn: (testId: string) => optimizationService.stopABTest(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization', 'abtest'] });
      toast.success('テストを停止しました');
    },
    onError: () => {
      toast.error('テストの停止に失敗しました');
    },
  });

  const resetForm = () => {
    setTestName('');
    setVideoId('');
    setVariantAUrl('');
    setVariantBUrl('');
    setDurationHours(24);
  };

  const handleCreateTest = () => {
    if (!testName.trim() || !videoId.trim() || !variantAUrl.trim() || !variantBUrl.trim()) {
      toast.error('すべての項目を入力してください');
      return;
    }

    const data: ABTestCreateRequest = {
      videoId,
      name: testName,
      testType: 'thumbnail',
      durationHours,
      trafficSplit: 50.0,
      minSampleSize: 1000,
      confidenceLevel: 0.95,
      variants: [
        {
          variantName: 'A',
          isControl: true,
          imageUrl: variantAUrl,
        },
        {
          variantName: 'B',
          isControl: false,
          imageUrl: variantBUrl,
        },
      ],
    };

    createTestMutation.mutate(data);
  };

  const getStatusBadge = (status: ABTestStatus) => {
    const config = {
      draft: { label: '下書き', color: 'bg-gray-500/20 text-gray-500' },
      running: { label: '実行中', color: 'bg-green-500/20 text-green-500' },
      paused: { label: '一時停止', color: 'bg-yellow-500/20 text-yellow-500' },
      completed: { label: '完了', color: 'bg-blue-500/20 text-blue-500' },
      cancelled: { label: 'キャンセル', color: 'bg-red-500/20 text-red-500' },
    };
    return config[status];
  };

  const tests = testsData?.tests ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>A/Bテストデータを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mx-8 p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">A/Bテストデータの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>サムネイルA/Bテスト</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            2つのサムネイルを比較してCTRを最適化
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={16} />
          新規テスト作成
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '総テスト数', value: tests.length, icon: <BarChart3 size={20} />, color: 'text-blue-500' },
          { label: '実行中', value: tests.filter((t) => t.status === 'running').length, icon: <Play size={20} />, color: 'text-green-500' },
          { label: '完了', value: tests.filter((t) => t.status === 'completed').length, icon: <Trophy size={20} />, color: 'text-yellow-500' },
          { label: '下書き', value: tests.filter((t) => t.status === 'draft').length, icon: <Image size={20} />, color: 'text-gray-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-5 rounded-2xl border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className={cn('mb-3', stat.color)}>{stat.icon}</div>
            <p className={cn('text-2xl font-bold', themeClasses.text)}>{stat.value}</p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className={cn('flex p-1 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
        {[
          { id: 'all' as const, label: 'すべて' },
          { id: 'draft' as const, label: '下書き' },
          { id: 'running' as const, label: '実行中' },
          { id: 'completed' as const, label: '完了' },
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

      {/* Tests List */}
      <div className="space-y-4">
        {tests.map((test) => {
          const variantA = test.variants.find((v) => v.isControl);
          const variantB = test.variants.find((v) => !v.isControl);
          const statusBadge = getStatusBadge(test.status);

          return (
            <div
              key={test.id}
              className={cn(
                'p-6 rounded-2xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={cn('text-lg font-bold mb-1', themeClasses.text)}>{test.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-1 rounded text-xs font-medium', statusBadge.color)}>
                      {statusBadge.label}
                    </span>
                    {test.startedAt && (
                      <span className={cn('text-xs', themeClasses.textSecondary)}>
                        開始: {new Date(test.startedAt).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {test.status === 'draft' && (
                    <button
                      onClick={() => startTestMutation.mutate(test.id)}
                      disabled={startTestMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                      <Play size={16} />
                      開始
                    </button>
                  )}
                  {test.status === 'running' && (
                    <button
                      onClick={() => stopTestMutation.mutate(test.id)}
                      disabled={stopTestMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                      <Pause size={16} />
                      停止
                    </button>
                  )}
                </div>
              </div>

              {/* Variants Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {/* Variant A */}
                {variantA && (
                  <div
                    className={cn(
                      'p-4 rounded-xl border',
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn('text-sm font-bold', themeClasses.text)}>
                        バリアントA (Control)
                      </span>
                      {test.winnerVariant === variantA.variantName && (
                        <Trophy size={16} className="text-yellow-500" />
                      )}
                    </div>
                    {variantA.imageUrl && (
                      <div className="aspect-video bg-slate-800 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={variantA.imageUrl}
                          alt="Variant A"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye size={14} className={themeClasses.textSecondary} />
                        <span className={themeClasses.textSecondary}>表示回数:</span>
                        <span className={cn('font-bold', themeClasses.text)}>{variantA.impressions.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MousePointer size={14} className={themeClasses.textSecondary} />
                        <span className={themeClasses.textSecondary}>クリック:</span>
                        <span className={cn('font-bold', themeClasses.text)}>{variantA.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className={themeClasses.textSecondary} />
                        <span className={themeClasses.textSecondary}>CTR:</span>
                        <span className={cn('font-bold text-lg', themeClasses.text)}>
                          {variantA.ctr?.toFixed(2) ?? '-'}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Variant B */}
                {variantB && (
                  <div
                    className={cn(
                      'p-4 rounded-xl border',
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn('text-sm font-bold', themeClasses.text)}>
                        バリアントB
                      </span>
                      {test.winnerVariant === variantB.variantName && (
                        <Trophy size={16} className="text-yellow-500" />
                      )}
                    </div>
                    {variantB.imageUrl && (
                      <div className="aspect-video bg-slate-800 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={variantB.imageUrl}
                          alt="Variant B"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye size={14} className={themeClasses.textSecondary} />
                        <span className={themeClasses.textSecondary}>表示回数:</span>
                        <span className={cn('font-bold', themeClasses.text)}>{variantB.impressions.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MousePointer size={14} className={themeClasses.textSecondary} />
                        <span className={themeClasses.textSecondary}>クリック:</span>
                        <span className={cn('font-bold', themeClasses.text)}>{variantB.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className={themeClasses.textSecondary} />
                        <span className={themeClasses.textSecondary}>CTR:</span>
                        <span className={cn('font-bold text-lg', themeClasses.text)}>
                          {variantB.ctr?.toFixed(2) ?? '-'}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Winner Info */}
              {test.status === 'completed' && test.winnerVariant && (
                <div className={cn('mt-4 p-4 rounded-xl', isDarkMode ? 'bg-green-900/20' : 'bg-green-50')}>
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-green-500" />
                    <span className={cn('text-sm font-bold', themeClasses.text)}>
                      バリアント{test.winnerVariant}が勝者です
                    </span>
                    {test.statisticalSignificance && (
                      <span className={cn('text-xs', themeClasses.textSecondary)}>
                        (有意水準: {(test.statisticalSignificance * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tests.length === 0 && (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            A/Bテストがありません
          </div>
        )}
      </div>

      {/* Create Test Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="新規A/Bテスト作成"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl font-medium transition-colors',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleCreateTest}
              disabled={createTestMutation.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
            >
              {createTestMutation.isPending ? '作成中...' : '作成'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              テスト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="例: サムネイルテスト - 赤 vs 青"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                themeClasses.text
              )}
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              動画ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="YouTube動画ID"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                themeClasses.text
              )}
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              バリアントA (Control) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={variantAUrl}
              onChange={(e) => setVariantAUrl(e.target.value)}
              placeholder="サムネイル画像URL"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                themeClasses.text
              )}
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              バリアントB <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={variantBUrl}
              onChange={(e) => setVariantBUrl(e.target.value)}
              placeholder="サムネイル画像URL"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                themeClasses.text
              )}
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              テスト期間（時間）
            </label>
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              min={1}
              max={168}
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                themeClasses.text
              )}
            />
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
              推奨: 24-72時間
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
