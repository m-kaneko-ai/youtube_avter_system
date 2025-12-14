import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Trophy,
  Search,
  Plus,
  ChevronRight,
  Target,
  Lightbulb,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { analyticsService, type KnowledgeItem } from '../../../services/analytics';
import { Modal, toast } from '../../../components/common';

type KnowledgeType = 'all' | KnowledgeItem['type'];

const TYPE_CONFIG: Record<KnowledgeItem['type'], { label: string; color: string; icon: React.ReactNode }> = {
  success: { label: '成功事例', color: 'text-green-500 bg-green-500/10', icon: <Trophy size={16} /> },
  insight: { label: 'インサイト', color: 'text-blue-500 bg-blue-500/10', icon: <Lightbulb size={16} /> },
  pattern: { label: 'パターン', color: 'text-purple-500 bg-purple-500/10', icon: <Target size={16} /> },
  failure: { label: '失敗事例', color: 'text-red-500 bg-red-500/10', icon: <AlertTriangle size={16} /> },
};

export const KnowledgeTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [filter, setFilter] = useState<KnowledgeType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null);
  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState('');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  const [newKnowledgeType, setNewKnowledgeType] = useState<KnowledgeItem['type']>('success');

  // Knowledge query
  const {
    data: knowledgeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['analytics', 'knowledge', filter === 'all' ? undefined : filter],
    queryFn: () => analyticsService.getKnowledge(filter === 'all' ? undefined : filter),
  });

  const knowledgeList = knowledgeData?.items ?? [];

  const filteredKnowledge = knowledgeList.filter((k) => {
    if (filter !== 'all' && k.type !== filter) return false;
    if (searchQuery && !k.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAddKnowledge = () => {
    if (!newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) {
      toast.error('タイトルと内容を入力してください');
      return;
    }
    toast.success('ナレッジを追加しました');
    setIsAddModalOpen(false);
    setNewKnowledgeTitle('');
    setNewKnowledgeContent('');
    setNewKnowledgeType('success');
  };

  const handleKnowledgeClick = (knowledge: KnowledgeItem) => {
    setSelectedKnowledge(knowledge);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>ナレッジデータを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mx-8 p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">ナレッジデータの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>ナレッジ・成功事例</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            チャンネル成長のための知見を蓄積
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={16} />
          ナレッジを追加
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '総ナレッジ', value: knowledgeList.length, icon: <BookOpen size={20} />, color: 'text-blue-500' },
          { label: '成功事例', value: knowledgeList.filter((k) => k.type === 'success').length, icon: <Trophy size={20} />, color: 'text-green-500' },
          { label: 'インサイト', value: knowledgeList.filter((k) => k.type === 'insight').length, icon: <Lightbulb size={20} />, color: 'text-yellow-500' },
          { label: 'パターン', value: knowledgeList.filter((k) => k.type === 'pattern').length, icon: <Target size={20} />, color: 'text-purple-500' },
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

      {/* Filter & Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={18} className={cn('absolute left-4 top-1/2 -translate-y-1/2', themeClasses.textSecondary)} />
          <input
            type="text"
            placeholder="ナレッジを検索..."
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
        <div className={cn('flex p-1 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
          {[
            { id: 'all' as KnowledgeType, label: 'すべて' },
            { id: 'success' as KnowledgeType, label: '成功事例' },
            { id: 'insight' as KnowledgeType, label: 'インサイト' },
            { id: 'pattern' as KnowledgeType, label: 'パターン' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
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

      {/* Knowledge List */}
      <div className="space-y-4">
        {filteredKnowledge.map((knowledge) => (
          <div
            key={knowledge.id}
            onClick={() => handleKnowledgeClick(knowledge)}
            className={cn(
              'p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="flex items-start gap-4">
              {/* Type Icon */}
              <div className={cn('p-3 rounded-xl', TYPE_CONFIG[knowledge.type].color)}>
                {TYPE_CONFIG[knowledge.type].icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className={cn('font-bold', themeClasses.text)}>{knowledge.title}</h4>
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', TYPE_CONFIG[knowledge.type].color)}>
                    {TYPE_CONFIG[knowledge.type].label}
                  </span>
                </div>
                <p className={cn('text-sm mb-3', themeClasses.textSecondary)}>
                  {knowledge.content}
                </p>

                {/* Source Info */}
                {knowledge.source && (
                  <p className={cn('text-xs mb-3', themeClasses.textSecondary)}>
                    出典: {knowledge.source}
                  </p>
                )}

                {/* Tags */}
                <div className="flex items-center gap-2">
                  {knowledge.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'px-2 py-1 rounded-lg text-xs',
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      #{tag}
                    </span>
                  ))}
                  <span className={cn('text-xs ml-auto', themeClasses.textSecondary)}>
                    {knowledge.createdAt}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight size={20} className={themeClasses.textSecondary} />
            </div>
          </div>
        ))}

        {filteredKnowledge.length === 0 && (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            該当するナレッジがありません
          </div>
        )}
      </div>

      {/* Add Knowledge Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ナレッジを追加"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl font-medium transition-colors',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleAddKnowledge}
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
              タイプ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TYPE_CONFIG) as KnowledgeItem['type'][]).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewKnowledgeType(type)}
                  className={cn(
                    'p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                    newKnowledgeType === type
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
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newKnowledgeTitle}
              onChange={(e) => setNewKnowledgeTitle(e.target.value)}
              placeholder="例: サムネイルのクリック率を2倍にした方法"
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
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newKnowledgeContent}
              onChange={(e) => setNewKnowledgeContent(e.target.value)}
              placeholder="具体的な内容を記述してください"
              rows={6}
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

      {/* Detail Modal */}
      {selectedKnowledge && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedKnowledge.title}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={cn('px-3 py-1 rounded-lg text-sm font-medium', TYPE_CONFIG[selectedKnowledge.type].color)}>
                {TYPE_CONFIG[selectedKnowledge.type].icon}
                <span className="ml-1">{TYPE_CONFIG[selectedKnowledge.type].label}</span>
              </span>
              <span className={cn('text-sm', themeClasses.textSecondary)}>
                {selectedKnowledge.createdAt}
              </span>
            </div>
            <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-700' : 'bg-slate-50')}>
              <p className={cn('whitespace-pre-wrap', themeClasses.text)}>
                {selectedKnowledge.content}
              </p>
            </div>
            {selectedKnowledge.source && (
              <div>
                <h5 className={cn('text-sm font-medium mb-1', themeClasses.text)}>出典</h5>
                <p className={cn('text-sm', themeClasses.textSecondary)}>
                  {selectedKnowledge.source}
                </p>
              </div>
            )}
            {selectedKnowledge.tags.length > 0 && (
              <div>
                <h5 className={cn('text-sm font-medium mb-2', themeClasses.text)}>タグ</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedKnowledge.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'px-3 py-1 rounded-lg text-sm',
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
