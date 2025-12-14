import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Image,
  Mic,
  Plus,
  Copy,
  Edit,
  Trash2,
  Star,
  Clock,
  Search,
  FolderOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { analyticsService, type Template } from '../../../services/analytics';
import { Modal, toast } from '../../../components/common';

type TemplateType = 'all' | Template['type'];

const TYPE_CONFIG: Record<Template['type'], { label: string; color: string; icon: React.ReactNode }> = {
  script: { label: '台本', color: 'text-blue-500 bg-blue-500/10', icon: <FileText size={18} /> },
  thumbnail: { label: 'サムネイル', color: 'text-purple-500 bg-purple-500/10', icon: <Image size={18} /> },
  description: { label: '説明文', color: 'text-green-500 bg-green-500/10', icon: <FileText size={18} /> },
  voice: { label: '音声', color: 'text-orange-500 bg-orange-500/10', icon: <Mic size={18} /> },
};

export const TemplateTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [filter, setFilter] = useState<TemplateType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHighRatedOnly, setShowHighRatedOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<Template['type']>('script');

  // Templates query
  const {
    data: templatesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['analytics', 'templates', filter === 'all' ? undefined : filter],
    queryFn: () => analyticsService.getTemplates(filter === 'all' ? undefined : filter),
  });

  const templateList = templatesData?.templates ?? [];

  const filteredTemplates = templateList.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (showHighRatedOnly && (!t.rating || t.rating < 4)) return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateDesc.trim()) {
      toast.error('テンプレート名と説明を入力してください');
      return;
    }
    toast.success('テンプレートを作成しました');
    setIsCreateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewTemplateType('script');
  };

  const handleUseTemplate = (templateName: string) => {
    toast.success(`${templateName} を使用します`);
  };

  const handleEditTemplate = (templateName: string) => {
    toast.info(`${templateName} を編集します`);
  };

  const handleDeleteTemplate = (templateName: string) => {
    toast.error(`${templateName} を削除しました`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>テンプレートを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mx-8 p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">テンプレートの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>テンプレート管理</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            よく使うテンプレートを管理して効率化
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={16} />
          テンプレート作成
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: '総テンプレート', value: templateList.length, icon: <FolderOpen size={20} />, color: 'text-slate-500' },
          { label: '台本', value: templateList.filter((t) => t.type === 'script').length, icon: <FileText size={20} />, color: 'text-blue-500' },
          { label: 'サムネイル', value: templateList.filter((t) => t.type === 'thumbnail').length, icon: <Image size={20} />, color: 'text-purple-500' },
          { label: '説明文', value: templateList.filter((t) => t.type === 'description').length, icon: <FileText size={20} />, color: 'text-green-500' },
          { label: '音声', value: templateList.filter((t) => t.type === 'voice').length, icon: <Mic size={20} />, color: 'text-orange-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-2xl border text-center',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className={cn('mb-2 flex justify-center', stat.color)}>{stat.icon}</div>
            <p className={cn('text-xl font-bold', themeClasses.text)}>{stat.value}</p>
            <p className={cn('text-xs', themeClasses.textSecondary)}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={18} className={cn('absolute left-4 top-1/2 -translate-y-1/2', themeClasses.textSecondary)} />
          <input
            type="text"
            placeholder="テンプレートを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl border',
              themeClasses.cardBg,
              themeClasses.cardBorder,
              themeClasses.text
            )}
          />
        </div>
        <button
          onClick={() => setShowHighRatedOnly(!showHighRatedOnly)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors',
            showHighRatedOnly
              ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
              : cn(themeClasses.cardBg, themeClasses.cardBorder, themeClasses.textSecondary)
          )}
        >
          <Star size={16} fill={showHighRatedOnly ? 'currentColor' : 'none'} />
          高評価
        </button>
        <div className={cn('flex p-1 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
          {[
            { id: 'all' as TemplateType, label: 'すべて' },
            { id: 'script' as TemplateType, label: '台本' },
            { id: 'thumbnail' as TemplateType, label: 'サムネイル' },
            { id: 'description' as TemplateType, label: '説明文' },
            { id: 'voice' as TemplateType, label: '音声' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                filter === f.id
                  ? cn(themeClasses.cardBg, 'shadow-sm', themeClasses.text)
                  : themeClasses.textSecondary
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={cn(
              'p-5 rounded-2xl border transition-all hover:shadow-md',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-xl', TYPE_CONFIG[template.type].color)}>
                  {TYPE_CONFIG[template.type].icon}
                </div>
                <div>
                  <h4 className={cn('font-bold', themeClasses.text)}>{template.name}</h4>
                  <span className={cn('text-xs', TYPE_CONFIG[template.type].color)}>
                    {TYPE_CONFIG[template.type].label}
                  </span>
                </div>
              </div>
              {template.rating && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span className="text-sm font-medium">{template.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <p className={cn('text-sm mb-4 line-clamp-2', themeClasses.textSecondary)}>
              {template.description}
            </p>

            <div className={cn('flex items-center gap-4 text-xs mb-4', themeClasses.textSecondary)}>
              <span className="flex items-center gap-1">
                <Copy size={12} />
                {template.usageCount}回使用
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                更新: {template.updatedAt}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUseTemplate(template.name)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Copy size={14} />
                使用する
              </button>
              <button
                onClick={() => handleEditTemplate(template.name)}
                className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
              >
                <Edit size={16} className={themeClasses.textSecondary} />
              </button>
              <button
                onClick={() => handleDeleteTemplate(template.name)}
                className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-500')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className={cn('text-center py-12', themeClasses.textSecondary)}>
          該当するテンプレートがありません
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="テンプレート作成"
        size="md"
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
              onClick={handleCreateTemplate}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all"
            >
              作成
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              テンプレートタイプ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TYPE_CONFIG) as Template['type'][]).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewTemplateType(type)}
                  className={cn(
                    'p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                    newTemplateType === type
                      ? TYPE_CONFIG[type].color
                      : cn(isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600')
                  )}
                >
                  {TYPE_CONFIG[type].icon}
                  {TYPE_CONFIG[type].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              テンプレート名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="例: 解説動画用台本テンプレート"
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
              説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
              placeholder="テンプレートの説明を入力してください"
              rows={4}
              className={cn(
                'w-full px-4 py-2 rounded-xl border resize-none',
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
