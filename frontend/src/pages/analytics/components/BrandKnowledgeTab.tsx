import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  Search,
  ChevronRight,
  Loader2,
  MessageSquare,
  FileText,
  Building2,
  Eye,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { Modal, toast } from '../../../components/common';
import { KnowledgeChatbotModal } from './KnowledgeChatbotModal';
import { KnowledgeDetailModal } from './KnowledgeDetailModal';

/**
 * ブランドナレッジタブ
 *
 * 1ナレッジ = 1ブランド/YouTubeチャンネル/テーマ
 * 8セクション構造でターゲット・競合・コンセプト・戦略を管理
 */
export const BrandKnowledgeTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedKnowledge, setSelectedKnowledge] = useState<any>(null);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string>('');
  const [newKnowledgeName, setNewKnowledgeName] = useState('');

  // Knowledgeリスト取得
  const {
    data: knowledgeData,
    isLoading,
    error: _error,
  } = useQuery({
    queryKey: ['brand-knowledges'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: async () => ({ data: [] as any[] }),
  });

  const knowledgeList = knowledgeData?.data ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredKnowledge = knowledgeList.filter((k: any) => {
    if (searchQuery && !k.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // ナレッジ作成（空のナレッジを作成してチャットボットを開く）
  const createMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (name: string) => ({ name, type: 'brand' } as any),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brand-knowledges'] });
      setSelectedKnowledge(data);
      setIsCreateModalOpen(false);
      setIsChatbotOpen(true);
      setNewKnowledgeName('');
      toast.success('ナレッジを作成しました。チャットボットで情報を入力してください。');
    },
    onError: () => {
      toast.error('ナレッジの作成に失敗しました');
    },
  });

  const handleCreateKnowledge = () => {
    if (!newKnowledgeName.trim()) {
      toast.error('ナレッジ名を入力してください');
      return;
    }
    createMutation.mutate(newKnowledgeName);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleKnowledgeClick = (knowledge: any) => {
    setSelectedKnowledge(knowledge);
    setSelectedKnowledgeId(knowledge.id);
    setIsDetailOpen(true);
  };

  const handleUpdateKnowledge = () => {
    queryClient.invalidateQueries({ queryKey: ['brand-knowledges'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>ナレッジデータを読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>ブランドナレッジ</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            ブランド・YouTubeチャンネル・テーマごとのナレッジを管理
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={16} />
          ナレッジを作成
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '総ナレッジ', value: knowledgeList.length, icon: <BookOpen size={20} />, color: 'text-blue-500' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { label: 'ブランド', value: knowledgeList.filter((k: any) => k.type === 'brand').length, icon: <Building2 size={20} />, color: 'text-purple-500' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { label: 'コンテンツシリーズ', value: knowledgeList.filter((k: any) => k.type === 'content_series').length, icon: <FileText size={20} />, color: 'text-green-500' },
          { label: '完成度', value: '75%', icon: <Eye size={20} />, color: 'text-orange-500' },
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
            <p className={cn('text-2xl font-bold', themeClasses.text)}>
              {typeof stat.value === 'number' ? stat.value : stat.value}
            </p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
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

      {/* Knowledge List */}
      <div className="space-y-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {filteredKnowledge.map((knowledge: any) => {
          // 完成度計算（8セクションのうち何セクション埋まっているか）
          const completedSections = [
            knowledge.section_1_main_target,
            knowledge.section_2_sub_target,
            knowledge.section_3_competitor,
            knowledge.section_4_company,
            knowledge.section_5_aha_concept,
            knowledge.section_6_concept_summary,
            knowledge.section_7_customer_journey,
            knowledge.section_8_promotion_strategy,
          ].filter((section) => section && Object.keys(section).length > 0).length;

          const completionRate = Math.round((completedSections / 8) * 100);

          return (
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
                {/* Icon */}
                <div className={cn('p-3 rounded-xl', isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100')}>
                  <BookOpen size={20} className="text-blue-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={cn('font-bold', themeClasses.text)}>{knowledge.name}</h4>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700')}>
                      {knowledge.type === 'brand' ? 'ブランド' : 'コンテンツシリーズ'}
                    </span>
                  </div>

                  {/* Completion Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={themeClasses.textSecondary}>完成度</span>
                      <span className={cn('font-medium', themeClasses.text)}>{completionRate}%</span>
                    </div>
                    <div className={cn('w-full h-2 rounded-full overflow-hidden', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <p className={cn('text-sm mb-3', themeClasses.textSecondary)}>
                    {completedSections === 0 ? 'まだ情報が入力されていません' : `${completedSections}/8セクション完成`}
                  </p>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className={themeClasses.textSecondary}>
                      作成: {new Date(knowledge.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    <span className={themeClasses.textSecondary}>
                      更新: {new Date(knowledge.updated_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={20} className={themeClasses.textSecondary} />
              </div>
            </div>
          );
        })}

        {filteredKnowledge.length === 0 && (
          <div className={cn('text-center py-12', themeClasses.textSecondary)}>
            {searchQuery ? '該当するナレッジがありません' : 'ナレッジがまだありません。「ナレッジを作成」ボタンから始めましょう。'}
          </div>
        )}
      </div>

      {/* Create Knowledge Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="ナレッジを作成"
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
              onClick={handleCreateKnowledge}
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  作成中...
                </span>
              ) : (
                '作成してチャットボットへ'
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              ナレッジ名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newKnowledgeName}
              onChange={(e) => setNewKnowledgeName(e.target.value)}
              placeholder="例: AIアバター超集客法"
              className={cn(
                'w-full px-4 py-2 rounded-xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                themeClasses.text
              )}
            />
            <p className={cn('text-xs mt-2', themeClasses.textSecondary)}>
              1ナレッジ = 1ブランド/YouTubeチャンネル/テーマ
            </p>
          </div>
          <div className={cn('p-4 rounded-xl border-l-4 border-blue-500', isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50')}>
            <div className="flex items-start gap-3">
              <MessageSquare size={18} className="text-blue-500 mt-0.5" />
              <div>
                <p className={cn('text-sm font-medium mb-1', themeClasses.text)}>
                  チャットボットで情報を収集
                </p>
                <p className={cn('text-xs', themeClasses.textSecondary)}>
                  作成後、AIチャットボットが8ステップのヒアリングを行い、ナレッジを自動構築します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Chatbot Modal */}
      <KnowledgeChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => {
          setIsChatbotOpen(false);
          setSelectedKnowledge(null);
        }}
        knowledge={selectedKnowledge}
        onSave={handleUpdateKnowledge}
      />

      {/* Detail Modal */}
      {isDetailOpen && selectedKnowledgeId && (
        <KnowledgeDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedKnowledge(null);
            setSelectedKnowledgeId('');
          }}
          knowledgeId={selectedKnowledgeId}
          onUpdate={handleUpdateKnowledge}
        />
      )}
    </div>
  );
};
