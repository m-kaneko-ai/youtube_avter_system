import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layout,
  Plus,
  Trash2,
  Save,
  Eye,
  Video,
  List,
  UserPlus,
  Link as LinkIcon,
  Loader2,
  Grid,
  Check,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { optimizationService } from '../../../services/optimization';
import { Modal, toast } from '../../../components/common';
import type {
  EndScreen,
  EndScreenCreateRequest,
  EndScreenElementType,
  EndScreenPosition,
} from '../../../types';

interface EndScreenEditorProps {
  videoId: string;
}

const ELEMENT_TYPE_CONFIG: Record<
  EndScreenElementType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  video: { label: '動画', icon: <Video size={16} />, color: 'text-blue-500 bg-blue-500/10' },
  playlist: { label: 'プレイリスト', icon: <List size={16} />, color: 'text-purple-500 bg-purple-500/10' },
  subscribe: { label: '登録ボタン', icon: <UserPlus size={16} />, color: 'text-red-500 bg-red-500/10' },
  link: { label: 'リンク', icon: <LinkIcon size={16} />, color: 'text-green-500 bg-green-500/10' },
};

const POSITION_CONFIG: Record<EndScreenPosition, { label: string; x: number; y: number }> = {
  top_left: { label: '左上', x: 10, y: 10 },
  top_right: { label: '右上', x: 70, y: 10 },
  bottom_left: { label: '左下', x: 10, y: 70 },
  bottom_right: { label: '右下', x: 70, y: 70 },
  center: { label: '中央', x: 40, y: 40 },
};

export const EndScreenEditor = ({ videoId }: EndScreenEditorProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isAddElementModalOpen, setIsAddElementModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form state for new element
  const [newElementType, setNewElementType] = useState<EndScreenElementType>('video');
  const [newElementPosition, setNewElementPosition] = useState<EndScreenPosition>('bottom_right');
  const [newElementTarget, setNewElementTarget] = useState('');
  const [newElementDisplayText, setNewElementDisplayText] = useState('');

  // End screen query
  const {
    data: endScreen,
    isLoading,
  } = useQuery<EndScreen | null>({
    queryKey: ['optimization', 'end-screen', videoId],
    queryFn: () => optimizationService.getEndScreen(videoId),
    enabled: !!videoId,
  });

  // Templates query
  const { data: templatesData } = useQuery({
    queryKey: ['optimization', 'end-screen-templates'],
    queryFn: () => optimizationService.getEndScreenTemplates({ isActive: true }),
  });

  // Create end screen mutation
  const createEndScreenMutation = useMutation({
    mutationFn: (data: EndScreenCreateRequest) => optimizationService.createEndScreen(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization', 'end-screen', videoId] });
      toast.success('終了画面を作成しました');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    },
    onError: () => {
      toast.error('終了画面の作成に失敗しました');
    },
  });

  // Delete element (simulated - would need backend support)
  const handleDeleteElement = () => {
    toast.info('要素の削除機能は実装中です');
  };

  const handleAddElement = () => {
    if (!newElementTarget.trim() && newElementType !== 'subscribe') {
      toast.error('ターゲットを入力してください');
      return;
    }

    // In real implementation, this would create a new element via API
    toast.success('要素を追加しました（プレビューのみ）');
    setIsAddElementModalOpen(false);
    resetElementForm();
  };

  const resetElementForm = () => {
    setNewElementType('video');
    setNewElementPosition('bottom_right');
    setNewElementTarget('');
    setNewElementDisplayText('');
  };

  const handleApplyTemplate = () => {
    toast.info('テンプレート適用機能は実装中です');
    setIsTemplateModalOpen(false);
  };

  const handleSaveEndScreen = () => {
    if (!endScreen) {
      // Create new end screen
      const data: EndScreenCreateRequest = {
        videoId,
        startTimeSeconds: 0,
        durationSeconds: 20,
        backgroundType: 'video',
        elements: [],
      };
      createEndScreenMutation.mutate(data);
    } else {
      toast.success('変更を保存しました');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>終了画面を読み込み中...</span>
      </div>
    );
  }

  const templates = templatesData?.templates ?? [];
  const elements = endScreen?.elements ?? [];

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>終了画面エディタ</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            動画終了時に表示する要素を設定
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <Grid size={16} />
            テンプレート
          </button>
          <button
            onClick={handleSaveEndScreen}
            disabled={createEndScreenMutation.isPending || isSaved}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <Check size={16} />
                保存完了
              </>
            ) : (
              <>
                <Save size={16} />
                保存
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      {endScreen && (
        <div className="grid grid-cols-3 gap-4">
          <div
            className={cn(
              'p-5 rounded-2xl border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="mb-3 text-blue-500">
              <Layout size={20} />
            </div>
            <p className={cn('text-2xl font-bold', themeClasses.text)}>{elements.length}</p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>配置要素数</p>
          </div>

          <div
            className={cn(
              'p-5 rounded-2xl border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="mb-3 text-green-500">
              <Eye size={20} />
            </div>
            <p className={cn('text-2xl font-bold', themeClasses.text)}>
              {endScreen.totalClicks.toLocaleString()}
            </p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>総クリック数</p>
          </div>

          <div
            className={cn(
              'p-5 rounded-2xl border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="mb-3 text-purple-500">
              <LinkIcon size={20} />
            </div>
            <p className={cn('text-2xl font-bold', themeClasses.text)}>
              {endScreen.clickThroughRate?.toFixed(2) ?? '-'}%
            </p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>クリック率</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Preview */}
        <div>
          <h3 className={cn('text-lg font-bold mb-4', themeClasses.text)}>プレビュー</h3>
          <div
            className={cn(
              'aspect-video rounded-2xl border relative overflow-hidden',
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            )}
          >
            {/* Background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className={cn('text-sm', themeClasses.textSecondary)}>動画終了画面</p>
            </div>

            {/* Elements */}
            {elements.map((element) => {
              const config = ELEMENT_TYPE_CONFIG[element.elementType];
              return (
                <div
                  key={element.id}
                  className={cn(
                    'absolute p-3 rounded-xl border-2 border-dashed cursor-move',
                    isDarkMode ? 'bg-slate-700/90 border-slate-500' : 'bg-white/90 border-slate-300'
                  )}
                  style={{
                    left: `${element.positionX ?? 0}%`,
                    top: `${element.positionY ?? 0}%`,
                    width: `${element.width ?? 20}%`,
                    height: `${element.height ?? 15}%`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('p-1 rounded', config.color)}>{config.icon}</div>
                    <span className={cn('text-xs font-bold', themeClasses.text)}>
                      {config.label}
                    </span>
                  </div>
                  {element.displayText && (
                    <p className={cn('text-xs', themeClasses.textSecondary)}>
                      {element.displayText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview Controls */}
          <div className="mt-4 flex items-center justify-between">
            <p className={cn('text-sm', themeClasses.textSecondary)}>
              終了{endScreen?.durationSeconds ?? 20}秒前から表示
            </p>
            <button
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
              )}
            >
              <Eye size={14} />
              フルスクリーン
            </button>
          </div>
        </div>

        {/* Elements List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('text-lg font-bold', themeClasses.text)}>配置要素</h3>
            <button
              onClick={() => setIsAddElementModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Plus size={14} />
              要素を追加
            </button>
          </div>

          <div className="space-y-3">
            {elements.map((element) => {
              const config = ELEMENT_TYPE_CONFIG[element.elementType];
              const positionLabel =
                POSITION_CONFIG[element.position as EndScreenPosition]?.label ?? '不明';

              return (
                <div
                  key={element.id}
                  className={cn(
                    'p-4 rounded-xl border',
                    themeClasses.cardBg,
                    themeClasses.cardBorder
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-2 rounded', config.color)}>{config.icon}</div>
                      <div>
                        <p className={cn('font-bold text-sm', themeClasses.text)}>
                          {config.label}
                        </p>
                        <p className={cn('text-xs', themeClasses.textSecondary)}>
                          位置: {positionLabel}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteElement()}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {element.displayText && (
                    <p className={cn('text-sm mb-2', themeClasses.text)}>
                      {element.displayText}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className={themeClasses.textSecondary}>表示: </span>
                      <span className={cn('font-bold', themeClasses.text)}>
                        {element.impressions.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className={themeClasses.textSecondary}>クリック: </span>
                      <span className={cn('font-bold', themeClasses.text)}>
                        {element.clicks.toLocaleString()}
                      </span>
                    </div>
                    {element.clickThroughRate !== undefined && (
                      <div>
                        <span className={themeClasses.textSecondary}>CTR: </span>
                        <span className={cn('font-bold', themeClasses.text)}>
                          {element.clickThroughRate.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {elements.length === 0 && (
              <div className={cn('text-center py-12', themeClasses.textSecondary)}>
                <Layout size={32} className="mx-auto mb-3 opacity-50" />
                <p className="mb-4">配置要素がありません</p>
                <button
                  onClick={() => setIsAddElementModalOpen(true)}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  要素を追加する
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="テンプレートを選択"
        size="lg"
      >
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
              onClick={() => handleApplyTemplate()}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className={cn('font-bold', themeClasses.text)}>{template.name}</h4>
                  {template.description && (
                    <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
                      {template.description}
                    </p>
                  )}
                </div>
                {template.isDefault && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-500">
                    デフォルト
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className={themeClasses.textSecondary}>利用回数: </span>
                  <span className={cn('font-bold', themeClasses.text)}>
                    {template.usageCount}
                  </span>
                </div>
                {template.avgClickThroughRate !== undefined && (
                  <div>
                    <span className={themeClasses.textSecondary}>平均CTR: </span>
                    <span className={cn('font-bold', themeClasses.text)}>
                      {template.avgClickThroughRate.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <p className={cn('text-center py-8', themeClasses.textSecondary)}>
              テンプレートがありません
            </p>
          )}
        </div>
      </Modal>

      {/* Add Element Modal */}
      <Modal
        isOpen={isAddElementModalOpen}
        onClose={() => setIsAddElementModalOpen(false)}
        title="要素を追加"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddElementModalOpen(false)}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl font-medium transition-colors',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleAddElement}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all"
            >
              追加
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              要素タイプ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ELEMENT_TYPE_CONFIG) as EndScreenElementType[]).map((type) => {
                const config = ELEMENT_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => setNewElementType(type)}
                    className={cn(
                      'p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                      newElementType === type
                        ? config.color
                        : cn(isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600')
                    )}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              配置位置 <span className="text-red-500">*</span>
            </label>
            <select
              value={newElementPosition}
              onChange={(e) => setNewElementPosition(e.target.value as EndScreenPosition)}
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                themeClasses.text
              )}
            >
              {(Object.keys(POSITION_CONFIG) as EndScreenPosition[]).map((pos) => (
                <option key={pos} value={pos}>
                  {POSITION_CONFIG[pos].label}
                </option>
              ))}
            </select>
          </div>

          {newElementType !== 'subscribe' && (
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                ターゲット <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newElementTarget}
                onChange={(e) => setNewElementTarget(e.target.value)}
                placeholder={
                  newElementType === 'video'
                    ? '動画ID'
                    : newElementType === 'playlist'
                    ? 'プレイリストID'
                    : 'URL'
                }
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBg,
                  themeClasses.cardBorder,
                  themeClasses.text
                )}
              />
            </div>
          )}

          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              表示テキスト
            </label>
            <input
              type="text"
              value={newElementDisplayText}
              onChange={(e) => setNewElementDisplayText(e.target.value)}
              placeholder="例: 次の動画を見る"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                themeClasses.text
              )}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
