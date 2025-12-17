import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, User, Send, PlusCircle, X, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { cn } from '../../../utils/cn';
import { planningService } from '../../../services/planning';
import { toast } from '../../../components/common';
import type { AIChatMessage, AISuggestion, VideoType } from '../../../types';

export const AIChatTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [knowledgeId, setKnowledgeId] = useState('business-marketing');
  const [videoType, setVideoType] = useState<VideoType | 'both'>('short');
  const [messageInput, setMessageInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<AIChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // API: GET /api/v1/planning/chat/context - ナレッジ一覧取得
  const { data: contextData } = useQuery({
    queryKey: ['planning', 'chat', 'context'],
    queryFn: () => planningService.getContext(),
  });

  // API: GET /api/v1/planning/chat/suggestions/adopted - 採用済み提案取得
  const {
    data: adoptedData,
    isLoading: isLoadingAdopted,
    error: adoptedError,
  } = useQuery({
    queryKey: ['planning', 'chat', 'suggestions', 'adopted'],
    queryFn: () => planningService.getAdoptedSuggestions(),
  });

  // API: POST /api/v1/planning/chat/sessions - セッション作成
  const createSessionMutation = useMutation({
    mutationFn: () => planningService.createChatSession(
      knowledgeId,
      videoType === 'both' ? undefined : videoType
    ),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setLocalMessages(data.messages);
    },
  });

  // API: POST /api/v1/planning/chat/sessions/{id}/messages - メッセージ送信
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => {
      if (!sessionId) throw new Error('Session not found');
      return planningService.sendChatMessage(sessionId, message);
    },
    onSuccess: (data) => {
      setLocalMessages((prev) => [...prev, data.message]);
    },
  });

  // API: POST /api/v1/planning/chat/suggestions/{id}/adopt - 提案採用
  const adoptSuggestionMutation = useMutation({
    mutationFn: (suggestionId: string) => planningService.adoptSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'chat', 'suggestions', 'adopted'] });
    },
  });

  // API: DELETE /api/v1/planning/chat/suggestions/{id}/adopt - 採用解除
  const unadoptSuggestionMutation = useMutation({
    mutationFn: (suggestionId: string) => planningService.unadoptSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'chat', 'suggestions', 'adopted'] });
    },
  });

  // API: POST /api/v1/planning/projects/from-suggestions - 採用済み提案をプロジェクトに追加
  const addToProjectsMutation = useMutation({
    mutationFn: (suggestions: AISuggestion[]) => planningService.addAdoptedSuggestionsToProjects(suggestions),
    onSuccess: (data) => {
      toast.success(`${data.addedCount}件の企画をプロジェクト一覧に追加しました`);
      // プロジェクト一覧と採用済み提案を更新
      queryClient.invalidateQueries({ queryKey: ['planning', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['planning', 'chat', 'suggestions', 'adopted'] });
    },
    onError: () => {
      toast.error('企画の追加に失敗しました');
    },
  });

  const messages = localMessages;
  const adoptedSuggestions = adoptedData?.suggestions ?? [];
  const activeKnowledges = contextData?.activeKnowledges ?? [
    { id: 'business-marketing', name: 'ビジネスマーケティング' },
    { id: 'programming', name: 'プログラミング教育' },
    { id: 'health', name: '健康・フィットネス' },
  ];

  // 初回セッション作成
  useEffect(() => {
    if (!sessionId && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = () => {
    if (!messageInput.trim() || sendMessageMutation.isPending) return;

    // ユーザーメッセージを即座に表示
    const userMessage: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageInput,
      timestamp: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMessage]);

    sendMessageMutation.mutate(messageInput);
    setMessageInput('');
  };

  const handleNewSession = () => {
    setLocalMessages([]);
    setSessionId(null);
    createSessionMutation.mutate();
  };

  const handleAdoptSuggestion = (suggestion: AISuggestion) => {
    adoptSuggestionMutation.mutate(suggestion.id);
  };

  const handleRemoveAdopted = (suggestionId: string) => {
    unadoptSuggestionMutation.mutate(suggestionId);
  };

  const handleAddToProjects = () => {
    if (adoptedSuggestions.length === 0 || addToProjectsMutation.isPending) return;
    // 採用済み企画をプロジェクト一覧に追加
    addToProjectsMutation.mutate(adoptedSuggestions);
  };

  const handleRequestModification = () => {
    // 入力フォームにフォーカス
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // エラー表示
  if (adoptedError) {
    return (
      <div className={cn('rounded-3xl shadow-sm border p-8', themeClasses.cardBg, themeClasses.cardBorder)}>
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle size={24} />
          <span>データの取得に失敗しました。再度お試しください。</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-3xl shadow-sm border p-8', themeClasses.cardBg, themeClasses.cardBorder)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn('text-xl font-bold', themeClasses.text)}>AI企画アシスタント</h2>
        <div className="flex items-center gap-3">
          <select
            value={knowledgeId}
            onChange={(e) => setKnowledgeId(e.target.value)}
            className={cn(
              'px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white border-slate-200 text-slate-700'
            )}
          >
            {activeKnowledges.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
          <select
            value={videoType}
            onChange={(e) => setVideoType(e.target.value as VideoType | 'both')}
            className={cn(
              'px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white border-slate-200 text-slate-700'
            )}
          >
            <option value="short">ショート</option>
            <option value="long">長尺</option>
            <option value="both">両方</option>
          </select>
          <button
            onClick={handleNewSession}
            disabled={createSessionMutation.isPending}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors',
              createSessionMutation.isPending ? 'opacity-50 cursor-not-allowed' : '',
              isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {createSessionMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            新しい会話を開始
          </button>
        </div>
      </div>

      {/* ハイブリッドレイアウト: チャット(65%) + 採用済み(35%) */}
      <div className="grid grid-cols-3 gap-6">
        {/* チャットエリア（左側・2カラム分） */}
        <div className="col-span-2 flex flex-col h-[calc(100vh-20rem)]">
          {/* チャットメッセージエリア */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
            {createSessionMutation.isPending ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className={cn('text-center py-20', themeClasses.textSecondary)}>
                新しい会話を開始してください
              </div>
            ) : (
            messages.map((message) => {
              if (message.role === 'assistant') {
                return (
                  <div key={message.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        isDarkMode
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      )}
                    >
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className={cn('text-sm font-medium mb-2', themeClasses.text)}>
                        AIアシスタント
                      </div>
                      <div
                        className={cn(
                          'rounded-2xl rounded-tl-none p-4',
                          isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'
                        )}
                      >
                        <p className={cn('mb-4', themeClasses.text)}>{message.content}</p>
                        {/* 企画提案カード */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="space-y-3">
                            {message.suggestions.map((suggestion) => (
                              <div
                                key={suggestion.id}
                                className={cn(
                                  'border rounded-xl p-4 hover:border-blue-300 transition-colors',
                                  isDarkMode
                                    ? 'border-slate-600 bg-slate-800/50'
                                    : 'border-slate-200 bg-white'
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                                      isDarkMode
                                        ? 'bg-blue-900/40 text-blue-300'
                                        : 'bg-blue-50 text-blue-700'
                                    )}
                                  >
                                    {suggestion.videoType === 'short' ? '📹 ショート' : '🎬 長尺'}
                                  </span>
                                </div>
                                <h4 className={cn('font-bold mb-2 text-sm', themeClasses.text)}>
                                  {suggestion.title}
                                </h4>
                                <div className={cn('text-xs mb-3', themeClasses.textSecondary)}>
                                  <div className="mb-1">
                                    <span className="font-medium">理由:</span> {suggestion.reason}
                                  </div>
                                  {suggestion.reference && (
                                    <div>
                                      <span className="font-medium">参考:</span> {suggestion.reference}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAdoptSuggestion(suggestion)}
                                    className={cn(
                                      'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                      isDarkMode
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md'
                                    )}
                                  >
                                    採用
                                  </button>
                                  <button
                                    onClick={handleRequestModification}
                                    className={cn(
                                      'flex-1 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors',
                                      isDarkMode
                                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                    )}
                                  >
                                    修正を依頼
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // ユーザーメッセージ
                return (
                  <div key={message.id} className="flex items-start gap-3 justify-end">
                    <div className="flex-1 max-w-lg">
                      <div
                        className={cn(
                          'rounded-2xl rounded-tr-none p-4',
                          isDarkMode
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                      )}
                    >
                      <User
                        className={cn('w-5 h-5', isDarkMode ? 'text-slate-300' : 'text-slate-600')}
                      />
                    </div>
                  </div>
                );
              }
            })
            )}
          </div>

          {/* チャット入力エリア */}
          <div className={cn('border-t pt-4', isDarkMode ? 'border-slate-700' : 'border-slate-200')}>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                placeholder="修正依頼や追加のリクエストを入力..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={cn(
                  'flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
                )}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                className={cn(
                  'px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all',
                  messageInput.trim() && !sendMessageMutation.isPending
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                    : isDarkMode
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                送信
              </button>
            </div>
          </div>
        </div>

        {/* 採用済みパネル（右側・1カラム分） */}
        <div
          className={cn(
            'col-span-1 border-l pl-6 flex flex-col h-[calc(100vh-20rem)]',
            isDarkMode ? 'border-slate-700' : 'border-slate-200'
          )}
        >
          <h3 className={cn('text-lg font-semibold mb-4', themeClasses.text)}>
            採用済み ({adoptedSuggestions.length}件)
          </h3>
          {isLoadingAdopted ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          ) : adoptedSuggestions.length === 0 ? (
            <div className={cn('text-center py-12 text-sm', themeClasses.textSecondary)}>
              採用済みの企画はありません
            </div>
          ) : (
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {adoptedSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={cn(
                  'border rounded-xl p-4 transition-colors',
                  suggestion.videoType === 'short'
                    ? isDarkMode
                      ? 'bg-blue-900/20 hover:border-blue-500 border-slate-600'
                      : 'bg-blue-50/30 hover:border-blue-300 border-slate-200'
                    : isDarkMode
                    ? 'bg-purple-900/20 hover:border-purple-500 border-slate-600'
                    : 'bg-purple-50/30 hover:border-purple-300 border-slate-200'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                      suggestion.videoType === 'short'
                        ? isDarkMode
                          ? 'bg-blue-900/40 text-blue-300'
                          : 'bg-blue-50 text-blue-700'
                        : isDarkMode
                        ? 'bg-purple-900/40 text-purple-300'
                        : 'bg-purple-50 text-purple-700'
                    )}
                  >
                    {suggestion.videoType === 'short' ? '📹 ショート' : '🎬 長尺'}
                  </span>
                  <button
                    onClick={() => handleRemoveAdopted(suggestion.id)}
                    className={cn(
                      'transition-colors',
                      isDarkMode
                        ? 'text-slate-500 hover:text-red-400'
                        : 'text-slate-400 hover:text-red-600'
                    )}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h4 className={cn('font-bold mb-1 text-sm', themeClasses.text)}>
                  {suggestion.title}
                </h4>
                <p className={cn('text-xs', themeClasses.textSecondary)}>企画中</p>
              </div>
            ))}
          </div>
          )}

          {/* 企画一覧に追加ボタン */}
          <div className={cn('border-t pt-4', isDarkMode ? 'border-slate-700' : 'border-slate-200')}>
            <button
              onClick={handleAddToProjects}
              disabled={adoptedSuggestions.length === 0 || addToProjectsMutation.isPending}
              className={cn(
                'w-full px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                adoptedSuggestions.length > 0 && !addToProjectsMutation.isPending
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                  : isDarkMode
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              {addToProjectsMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {addToProjectsMutation.isPending ? '追加中...' : '企画一覧に追加'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
