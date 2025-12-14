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
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
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
    </div>
  );
};
