import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Minus,
  Loader2,
  Clock,
  User,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { agentService } from '../../../services/agent';
import { Modal, DropdownMenu, toast } from '../../../components/common';
import { COMMENT_SENTIMENT_CONFIG } from '../../../types';
import type {
  CommentTemplate,
  CommentQueueItem,
  CommentSentimentType,
  CommentTemplateCreateRequest,
  CommentTemplateUpdateRequest,
} from '../../../types';

type TabType = 'templates' | 'queue';

const SENTIMENT_ICONS: Record<CommentSentimentType, React.ReactNode> = {
  positive: <ThumbsUp size={14} />,
  neutral: <Minus size={14} />,
  negative: <ThumbsDown size={14} />,
  question: <HelpCircle size={14} />,
};

// Reply status config for future use
// const STATUS_CONFIG: Record<ReplyStatus, { label: string; color: string }> = {
//   pending: { label: '承認待ち', color: 'text-yellow-500 bg-yellow-500/10' },
//   approved: { label: '承認済み', color: 'text-blue-500 bg-blue-500/10' },
//   sent: { label: '送信済み', color: 'text-green-500 bg-green-500/10' },
//   failed: { label: '失敗', color: 'text-red-500 bg-red-500/10' },
//   skipped: { label: 'スキップ', color: 'text-slate-500 bg-slate-500/10' },
// };

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  targetSentiment: CommentSentimentType | '';
  targetKeywords: string;
  excludeKeywords: string;
  templateText: string;
  useAiGeneration: boolean;
  aiPrompt: string;
  isActive: boolean;
  priority: number;
}

const initialTemplateFormData: TemplateFormData = {
  name: '',
  description: '',
  category: '',
  targetSentiment: '',
  targetKeywords: '',
  excludeKeywords: '',
  templateText: '',
  useAiGeneration: false,
  aiPrompt: '',
  isActive: true,
  priority: 0,
};

export const CommentsTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CommentTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>(initialTemplateFormData);
  const [editingReply, setEditingReply] = useState<{ id: string; text: string } | null>(null);

  // Fetch templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
  } = useQuery({
    queryKey: ['agent', 'comment-templates'],
    queryFn: () => agentService.getCommentTemplates(),
  });

  // Fetch queue
  const {
    data: queueData,
    isLoading: queueLoading,
  } = useQuery({
    queryKey: ['agent', 'comment-queue'],
    queryFn: () => agentService.getCommentQueue({ requiresApproval: true }),
  });

  const templates = templatesData?.templates ?? [];
  const queueItems = queueData?.comments ?? [];

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: (data: CommentTemplateCreateRequest) => agentService.createCommentTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'comment-templates'] });
      toast.success('テンプレートを作成しました');
      handleCloseTemplateModal();
    },
    onError: () => toast.error('テンプレートの作成に失敗しました'),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CommentTemplateUpdateRequest }) =>
      agentService.updateCommentTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'comment-templates'] });
      toast.success('テンプレートを更新しました');
      handleCloseTemplateModal();
    },
    onError: () => toast.error('テンプレートの更新に失敗しました'),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => agentService.deleteCommentTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'comment-templates'] });
      toast.success('テンプレートを削除しました');
    },
    onError: () => toast.error('テンプレートの削除に失敗しました'),
  });

  // Comment queue mutations
  const approveCommentMutation = useMutation({
    mutationFn: ({ id, approved, editedReply }: { id: string; approved: boolean; editedReply?: string }) =>
      agentService.approveComment(id, { approved, modifiedReply: editedReply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'comment-queue'] });
      toast.success('コメントを処理しました');
      setEditingReply(null);
    },
    onError: () => toast.error('コメントの処理に失敗しました'),
  });

  // For future use: send reply directly
  const _sendReplyMutation = useMutation({
    mutationFn: (id: string) => agentService.sendCommentReply(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'comment-queue'] });
      toast.success('返信を送信しました');
    },
    onError: () => toast.error('返信の送信に失敗しました'),
  });
  void _sendReplyMutation; // Prevent unused variable warning

  const handleCloseTemplateModal = () => {
    setShowTemplateModal(false);
    setSelectedTemplate(null);
    setTemplateFormData(initialTemplateFormData);
  };

  const handleEditTemplate = (template: CommentTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      targetSentiment: template.targetSentiment || '',
      targetKeywords: template.targetKeywords?.join(', ') || '',
      excludeKeywords: template.excludeKeywords?.join(', ') || '',
      templateText: template.templateText,
      useAiGeneration: template.useAiGeneration,
      aiPrompt: template.aiPrompt || '',
      isActive: template.isActive,
      priority: template.priority,
    });
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = (template: CommentTemplate) => {
    if (confirm(`${template.name}を削除してもよろしいですか？`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  const handleSubmitTemplate = () => {
    if (!templateFormData.name.trim()) {
      toast.error('名前を入力してください');
      return;
    }
    if (!templateFormData.templateText.trim() && !templateFormData.useAiGeneration) {
      toast.error('テンプレートテキストを入力するか、AI生成を有効にしてください');
      return;
    }

    const data = {
      name: templateFormData.name,
      description: templateFormData.description || undefined,
      category: templateFormData.category || undefined,
      targetSentiment: templateFormData.targetSentiment || undefined,
      targetKeywords: templateFormData.targetKeywords
        ? templateFormData.targetKeywords.split(',').map((k) => k.trim()).filter(Boolean)
        : undefined,
      excludeKeywords: templateFormData.excludeKeywords
        ? templateFormData.excludeKeywords.split(',').map((k) => k.trim()).filter(Boolean)
        : undefined,
      templateText: templateFormData.templateText,
      useAiGeneration: templateFormData.useAiGeneration,
      aiPrompt: templateFormData.aiPrompt || undefined,
      isActive: templateFormData.isActive,
      priority: templateFormData.priority,
    };

    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleApprove = (comment: CommentQueueItem) => {
    if (editingReply?.id === comment.id) {
      approveCommentMutation.mutate({
        id: comment.id,
        approved: true,
        editedReply: editingReply.text,
      });
    } else {
      approveCommentMutation.mutate({ id: comment.id, approved: true });
    }
  };

  const handleReject = (comment: CommentQueueItem) => {
    approveCommentMutation.mutate({ id: comment.id, approved: false });
  };

  const isLoading = templatesLoading || queueLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>コメント管理</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            コメント返信テンプレートと承認キュー
          </p>
        </div>
        {activeTab === 'templates' && (
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={16} />
            テンプレートを追加
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className={cn('flex p-1 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
        <button
          onClick={() => setActiveTab('queue')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'queue'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <MessageCircle size={16} />
          承認キュー
          {queueItems.length > 0 && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
              {queueItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'templates'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Edit size={16} />
          テンプレート
          <span className={cn('text-xs', themeClasses.textSecondary)}>({templates.length})</span>
        </button>
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {queueItems.length === 0 ? (
            <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <p className={themeClasses.text}>承認待ちのコメントはありません</p>
            </div>
          ) : (
            queueItems.map((comment: CommentQueueItem) => {
              const sentimentConfig = comment.sentiment ? COMMENT_SENTIMENT_CONFIG[comment.sentiment] : null;
              const isEditing = editingReply?.id === comment.id;

              return (
                <div
                  key={comment.id}
                  className={cn(
                    'rounded-2xl border p-5',
                    themeClasses.cardBg,
                    themeClasses.cardBorder
                  )}
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-full', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                        <User size={18} className={themeClasses.textSecondary} />
                      </div>
                      <div>
                        <p className={cn('font-medium', themeClasses.text)}>
                          {comment.authorName || '匿名ユーザー'}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          {sentimentConfig && (
                            <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full', sentimentConfig.color)}>
                              {SENTIMENT_ICONS[comment.sentiment!]}
                              {sentimentConfig.label}
                            </span>
                          )}
                          {comment.commentPublishedAt && (
                            <span className={themeClasses.textSecondary}>
                              <Clock size={12} className="inline mr-1" />
                              {new Date(comment.commentPublishedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {comment.commentLikes > 0 && (
                        <span className={cn('flex items-center gap-1 text-xs', themeClasses.textSecondary)}>
                          <ThumbsUp size={12} />
                          {comment.commentLikes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Original Comment */}
                  <div className={cn('p-3 rounded-xl mb-4', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                    <p className={cn('text-sm', themeClasses.text)}>{comment.commentText}</p>
                  </div>

                  {/* Suggested Reply */}
                  <div className="mb-4">
                    <label className={cn('block text-xs font-medium mb-2', themeClasses.textSecondary)}>
                      提案返信 {comment.replyGeneratedBy && `(${comment.replyGeneratedBy})`}
                    </label>
                    {isEditing && editingReply ? (
                      <textarea
                        value={editingReply.text}
                        onChange={(e) => setEditingReply({ id: editingReply.id, text: e.target.value })}
                        rows={3}
                        className={cn(
                          'w-full px-4 py-2 rounded-xl border resize-none text-sm',
                          themeClasses.cardBorder,
                          isDarkMode ? 'bg-slate-800' : 'bg-white',
                          themeClasses.text
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          'p-3 rounded-xl border-l-4 border-blue-500',
                          isDarkMode ? 'bg-slate-800/50' : 'bg-blue-50'
                        )}
                      >
                        <p className={cn('text-sm', themeClasses.text)}>
                          {comment.replyText || '返信テキストがありません'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {!isEditing && comment.replyText && (
                        <button
                          onClick={() => setEditingReply({ id: comment.id, text: comment.replyText || '' })}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300',
                            themeClasses.text
                          )}
                        >
                          <Edit size={12} className="inline mr-1" />
                          編集
                        </button>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => setEditingReply(null)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300',
                            themeClasses.text
                          )}
                        >
                          キャンセル
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(comment)}
                        disabled={approveCommentMutation.isPending}
                        className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} className="inline mr-1" />
                        却下
                      </button>
                      <button
                        onClick={() => handleApprove(comment)}
                        disabled={approveCommentMutation.isPending}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={14} className="inline mr-1" />
                        承認
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
              <MessageCircle size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
              <p className={themeClasses.textSecondary}>テンプレートがありません</p>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="mt-4 text-blue-500 hover:text-blue-600 text-sm"
              >
                最初のテンプレートを作成
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => {
                const sentimentConfig = template.targetSentiment
                  ? COMMENT_SENTIMENT_CONFIG[template.targetSentiment]
                  : null;

                return (
                  <div
                    key={template.id}
                    className={cn(
                      'rounded-2xl border p-5',
                      themeClasses.cardBg,
                      themeClasses.cardBorder,
                      !template.isActive && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={cn('font-bold', themeClasses.text)}>{template.name}</h3>
                        {template.category && (
                          <span className={cn('text-xs', themeClasses.textSecondary)}>
                            {template.category}
                          </span>
                        )}
                      </div>
                      <DropdownMenu
                        trigger="vertical"
                        items={[
                          {
                            id: 'edit',
                            label: '編集',
                            icon: <Edit size={14} />,
                            onClick: () => handleEditTemplate(template),
                          },
                          {
                            id: 'delete',
                            label: '削除',
                            icon: <Trash2 size={14} />,
                            onClick: () => handleDeleteTemplate(template),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>

                    {template.description && (
                      <p className={cn('text-sm mb-3 line-clamp-2', themeClasses.textSecondary)}>
                        {template.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {sentimentConfig && (
                        <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', sentimentConfig.color)}>
                          {SENTIMENT_ICONS[template.targetSentiment!]}
                          {sentimentConfig.label}
                        </span>
                      )}
                      {template.useAiGeneration && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full text-xs">
                          AI生成
                        </span>
                      )}
                      {!template.isActive && (
                        <span className="px-2 py-0.5 bg-slate-500/10 text-slate-500 rounded-full text-xs">
                          無効
                        </span>
                      )}
                    </div>

                    <div className={cn('p-3 rounded-xl text-sm mb-3', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
                      <p className={cn('line-clamp-3', themeClasses.text)}>
                        {template.templateText || '(AI生成テンプレート)'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={themeClasses.textSecondary}>
                        使用: {template.usageCount}回
                      </span>
                      {template.successRate !== undefined && (
                        <span className="text-green-500">
                          成功率: {Math.round(template.successRate)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={handleCloseTemplateModal}
        title={selectedTemplate ? 'テンプレートを編集' : 'テンプレートを追加'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleCloseTemplateModal}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300',
                themeClasses.text
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmitTemplate}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {createTemplateMutation.isPending || updateTemplateMutation.isPending
                ? '保存中...'
                : selectedTemplate
                  ? '保存'
                  : '作成'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                placeholder="テンプレート名"
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
                カテゴリ
              </label>
              <input
                type="text"
                value={templateFormData.category}
                onChange={(e) => setTemplateFormData({ ...templateFormData, category: e.target.value })}
                placeholder="例: 質問対応"
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
              説明
            </label>
            <input
              type="text"
              value={templateFormData.description}
              onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
              placeholder="テンプレートの説明"
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
              <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
                対象センチメント
              </label>
              <select
                value={templateFormData.targetSentiment}
                onChange={(e) => setTemplateFormData({ ...templateFormData, targetSentiment: e.target.value as CommentSentimentType | '' })}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              >
                <option value="">すべて</option>
                {(Object.keys(COMMENT_SENTIMENT_CONFIG) as CommentSentimentType[]).map((sentiment) => (
                  <option key={sentiment} value={sentiment}>
                    {COMMENT_SENTIMENT_CONFIG[sentiment].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
                優先度
              </label>
              <input
                type="number"
                value={templateFormData.priority}
                onChange={(e) => setTemplateFormData({ ...templateFormData, priority: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
                対象キーワード (カンマ区切り)
              </label>
              <input
                type="text"
                value={templateFormData.targetKeywords}
                onChange={(e) => setTemplateFormData({ ...templateFormData, targetKeywords: e.target.value })}
                placeholder="質問, どうやって"
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
                除外キーワード (カンマ区切り)
              </label>
              <input
                type="text"
                value={templateFormData.excludeKeywords}
                onChange={(e) => setTemplateFormData({ ...templateFormData, excludeKeywords: e.target.value })}
                placeholder="スパム, 広告"
                className={cn(
                  'w-full px-4 py-2 rounded-xl border',
                  themeClasses.cardBorder,
                  isDarkMode ? 'bg-slate-800' : 'bg-white',
                  themeClasses.text
                )}
              />
            </div>
          </div>

          <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <span className={cn('text-sm font-medium', themeClasses.text)}>AI生成を使用</span>
              <input
                type="checkbox"
                checked={templateFormData.useAiGeneration}
                onChange={(e) => setTemplateFormData({ ...templateFormData, useAiGeneration: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
            </label>
            {templateFormData.useAiGeneration && (
              <div>
                <label className={cn('block text-xs mb-1', themeClasses.textSecondary)}>
                  AIプロンプト
                </label>
                <textarea
                  value={templateFormData.aiPrompt}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, aiPrompt: e.target.value })}
                  placeholder="返信を生成するためのプロンプト"
                  rows={2}
                  className={cn(
                    'w-full px-4 py-2 rounded-xl border resize-none text-sm',
                    themeClasses.cardBorder,
                    isDarkMode ? 'bg-slate-700' : 'bg-white',
                    themeClasses.text
                  )}
                />
              </div>
            )}
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
              テンプレートテキスト {!templateFormData.useAiGeneration && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={templateFormData.templateText}
              onChange={(e) => setTemplateFormData({ ...templateFormData, templateText: e.target.value })}
              placeholder="返信テンプレート。{author}でコメント投稿者名を挿入できます。"
              rows={4}
              className={cn(
                'w-full px-4 py-2 rounded-xl border resize-none',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-800' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>

          <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
            <label className="flex items-center justify-between cursor-pointer">
              <span className={cn('text-sm font-medium', themeClasses.text)}>有効化</span>
              <input
                type="checkbox"
                checked={templateFormData.isActive}
                onChange={(e) => setTemplateFormData({ ...templateFormData, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};
