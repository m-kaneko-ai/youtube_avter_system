import { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  Circle,
  MessageSquare,
  Save,
  Upload,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { toast } from '../../../components/common';
import { knowledgeService } from '../../../services/knowledge';
import type {
  KnowledgeChatSession,
  KnowledgeChatMessage,
  KnowledgeChatStep,
  CollectedKnowledgeData,
  KnowledgeSection,
  UploadedKnowledgeFile,
  RAGAnalysisResult,
} from '../../../types';

/**
 * ナレッジ作成チャットボットモーダル
 *
 * 8ステップのヒアリング形式でナレッジを作成
 * - マニュアルモード: 順番に質問に答える
 * - RAGモード: PDFなどをアップロードして自動抽出
 */

// 8セクションの定義
// eslint-disable-next-line react-refresh/only-export-components
export const KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
  {
    id: 'business_info',
    stepNumber: 1,
    title: 'ビジネス基本情報',
    description: '業種・年商・サービス内容',
    isRequired: true,
    dataKeys: ['industry', 'yearsInBusiness', 'services', 'annualRevenue', 'businessModel'],
  },
  {
    id: 'main_target',
    stepNumber: 2,
    title: 'メインターゲット',
    description: '理想的なお客様像',
    isRequired: true,
    dataKeys: ['attributes', 'situation', 'frustrations', 'painPoints', 'desires', 'insights'],
  },
  {
    id: 'sub_target',
    stepNumber: 3,
    title: 'サブターゲット',
    description: '第二のターゲット層',
    isRequired: false,
    dataKeys: ['attributes', 'situation', 'frustrations', 'painPoints', 'desires', 'insights'],
  },
  {
    id: 'competitor',
    stepNumber: 4,
    title: '競合分析',
    description: '競合と差別化ポイント',
    isRequired: true,
    dataKeys: ['mainCompetitors', 'competitorValue', 'customerComplaints', 'differentiation'],
  },
  {
    id: 'company',
    stepNumber: 5,
    title: '自社分析',
    description: '強み・ミッション・実績',
    isRequired: true,
    dataKeys: ['strengths', 'mission', 'achievements', 'uniqueMethod'],
  },
  {
    id: 'aha_concept',
    stepNumber: 6,
    title: 'AHAコンセプト',
    description: '常識破壊とインサイト',
    isRequired: true,
    dataKeys: ['commonSense', 'destruction', 'insight', 'naming'],
  },
  {
    id: 'concept_story',
    stepNumber: 7,
    title: 'コンセプト・ストーリー',
    description: 'Before→After変容ストーリー',
    isRequired: true,
    dataKeys: ['character', 'beforeStory', 'transformationStory', 'afterStory'],
  },
  {
    id: 'product_design',
    stepNumber: 8,
    title: '商品設計',
    description: '価格・カリキュラム・提供物',
    isRequired: false,
    dataKeys: ['priceRange', 'curriculum', 'deliverables', 'support'],
  },
];

interface KnowledgeChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  knowledge?: any;
  onSave: () => void;
}

export const KnowledgeChatbotModal = ({
  isOpen,
  onClose,
  knowledge,
  onSave,
}: KnowledgeChatbotModalProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [chatMode, setChatMode] = useState<'manual' | 'rag'>('manual');
  const [session, setSession] = useState<KnowledgeChatSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [deepDiveCount, setDeepDiveCount] = useState(0);

  // RAGモード用
  const [uploadedFiles, setUploadedFiles] = useState<UploadedKnowledgeFile[]>([]);
  const [ragAnalysis, setRagAnalysis] = useState<RAGAnalysisResult | null>(null);
  const [missingFieldIndex, setMissingFieldIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  // セッション初期化
  useEffect(() => {
    if (isOpen && !session) {
      initializeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const initializeSession = async () => {
    setIsLoading(true);
    try {
      const newSession = await knowledgeService.createSession(
        undefined,
        knowledge?.name
      );
      setSession(newSession);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast.error('セッションの初期化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !session) return;

    const userMessage: KnowledgeChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      step: session.currentStep,
      timestamp: new Date().toISOString(),
    };

    setSession({
      ...session,
      messages: [...session.messages, userMessage],
    });
    setInputMessage('');
    setIsLoading(true);

    try {
      // 「次へ」の検出
      if (inputMessage.toLowerCase().includes('次') || inputMessage.toLowerCase() === 'next') {
        handleMoveToNextStep();
        return;
      }

      const { assistantMessage, shouldMoveNext, extractedData, newDeepDiveCount } =
        await knowledgeService.sendMessage(
          session.id,
          inputMessage,
          session.currentStep,
          session.collectedData,
          questionIndex,
          deepDiveCount
        );

      // データを更新
      const updatedData = { ...session.collectedData };
      const dataKeyMap: Record<KnowledgeChatStep, keyof CollectedKnowledgeData> = {
        business_info: 'businessInfo',
        main_target: 'mainTarget',
        sub_target: 'subTarget',
        competitor: 'competitor',
        company: 'company',
        aha_concept: 'ahaConcept',
        concept_story: 'conceptStory',
        product_design: 'productDesign',
      };
      const key = dataKeyMap[session.currentStep];
      if (Object.keys(extractedData).length > 0) {
        updatedData[key] = {
          ...(updatedData[key] as Record<string, string> || {}),
          ...extractedData,
        };
      }

      setSession({
        ...session,
        messages: [...session.messages, userMessage, assistantMessage],
        collectedData: updatedData,
      });

      setDeepDiveCount(newDeepDiveCount);

      if (shouldMoveNext) {
        setQuestionIndex(questionIndex + 1);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('メッセージの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToNextStep = () => {
    if (!session) return;

    const currentStepIndex = KNOWLEDGE_SECTIONS.findIndex(
      (s) => s.id === session.currentStep
    );
    const nextSection = KNOWLEDGE_SECTIONS[currentStepIndex + 1];

    if (!nextSection) {
      // 全ステップ完了
      const completionMessage = knowledgeService.getCompletionMessage(
        session.collectedData
      );
      setSession({
        ...session,
        messages: [...session.messages, completionMessage],
        status: 'completed',
        completedSteps: [...session.completedSteps, session.currentStep],
      });
      return;
    }

    const transitionMessage = knowledgeService.getStepTransitionMessage(
      nextSection.id
    );

    setSession({
      ...session,
      currentStep: nextSection.id,
      currentStepNumber: nextSection.stepNumber,
      messages: [...session.messages, transitionMessage],
      completedSteps: [...session.completedSteps, session.currentStep],
    });

    setQuestionIndex(0);
    setDeepDiveCount(0);
  };

  const handleSaveKnowledge = async () => {
    if (!session) return;

    setIsSaving(true);
    try {
      const result = await knowledgeService.saveKnowledge(session);
      if (result.success) {
        toast.success('ナレッジを保存しました');
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save knowledge:', error);
      toast.error('ナレッジの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      toast.error('PDFまたはテキストファイルのみアップロード可能です');
      return;
    }

    setIsLoading(true);
    try {
      const content = await readFileContent(file);
      const uploadedFile: UploadedKnowledgeFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 'txt',
        size: file.size,
        content,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedFiles([uploadedFile]);

      // RAG解析実行
      const analysis = await knowledgeService.analyzeUploadedContent([uploadedFile]);
      setRagAnalysis(analysis);

      // 解析メッセージを表示
      const analysisMessage = knowledgeService.generateRAGAnalysisMessage(analysis);
      setSession({
        ...session!,
        messages: [...session!.messages, analysisMessage],
        collectedData: analysis.extractedData,
      });

      setMissingFieldIndex(0);
      toast.success(`ファイルを解析しました（信頼度: ${analysis.confidence}%）`);
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('ファイルのアップロードに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleRAGHearingStart = () => {
    if (!ragAnalysis || ragAnalysis.missingFields.length === 0) return;

    const firstMissing = ragAnalysis.missingFields[0];
    const question = knowledgeService.generateMissingFieldQuestion(firstMissing);
    setSession({
      ...session!,
      messages: [...session!.messages, question],
      currentStep: firstMissing.step,
    });
  };

  // RAGモードで次のフィールドへ移動（将来の機能拡張用）
  // const handleRAGNextField = () => {
  //   if (!ragAnalysis) return;
  //   const nextIndex = missingFieldIndex + 1;
  //   if (nextIndex >= ragAnalysis.missingFields.length) {
  //     const completionMessage = knowledgeService.getCompletionMessage(
  //       session!.collectedData
  //     );
  //     setSession({
  //       ...session!,
  //       messages: [...session!.messages, completionMessage],
  //       status: 'completed',
  //     });
  //     return;
  //   }
  //   const nextMissing = ragAnalysis.missingFields[nextIndex];
  //   const question = knowledgeService.generateMissingFieldQuestion(
  //     nextMissing,
  //     inputMessage
  //   );
  //   setSession({
  //     ...session!,
  //     messages: [...session!.messages, question],
  //     currentStep: nextMissing.step,
  //   });
  //   setMissingFieldIndex(nextIndex);
  // };

  const progressPercent = session
    ? (session.completedSteps.length / KNOWLEDGE_SECTIONS.length) * 100
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={cn(
          'w-full max-w-6xl h-[90vh] rounded-2xl border shadow-2xl flex flex-col',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'px-6 py-4 border-b flex items-center justify-between',
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100')}>
              <MessageSquare size={20} className="text-blue-500" />
            </div>
            <div>
              <h3 className={cn('text-lg font-bold', themeClasses.text)}>
                ナレッジ作成チャットボット
              </h3>
              <p className={cn('text-xs', themeClasses.textSecondary)}>
                {knowledge?.name || '新規ナレッジ'}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className={cn('flex rounded-xl p-1', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
              <button
                onClick={() => setChatMode('manual')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  chatMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-md'
                    : themeClasses.textSecondary
                )}
              >
                マニュアル
              </button>
              <button
                onClick={() => setChatMode('rag')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5',
                  chatMode === 'rag'
                    ? 'bg-blue-600 text-white shadow-md'
                    : themeClasses.textSecondary
                )}
              >
                <Sparkles size={12} />
                RAG自動抽出
              </button>
            </div>
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                themeClasses.textSecondary
              )}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: Progress Steps */}
          <div
            className={cn(
              'w-64 border-r p-4 overflow-y-auto',
              themeClasses.cardBorder
            )}
          >
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className={themeClasses.textSecondary}>全体進捗</span>
                <span className={cn('font-medium', themeClasses.text)}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div
                className={cn(
                  'w-full h-2 rounded-full overflow-hidden',
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                )}
              >
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {KNOWLEDGE_SECTIONS.map((section) => {
                const isCompleted = session?.completedSteps.includes(section.id);
                const isCurrent = session?.currentStep === section.id;

                return (
                  <div
                    key={section.id}
                    className={cn(
                      'p-3 rounded-xl border transition-all',
                      isCurrent
                        ? 'border-blue-500 bg-blue-500/10'
                        : isCompleted
                        ? 'border-green-500/30 bg-green-500/5'
                        : themeClasses.cardBorder
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle
                          size={16}
                          className={cn(
                            'mt-0.5 flex-shrink-0',
                            isCurrent ? 'text-blue-500' : themeClasses.textSecondary
                          )}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-xs font-medium mb-0.5',
                            isCurrent
                              ? 'text-blue-500'
                              : isCompleted
                              ? 'text-green-500'
                              : themeClasses.text
                          )}
                        >
                          {section.stepNumber}. {section.title}
                        </p>
                        <p className={cn('text-[10px]', themeClasses.textSecondary)}>
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMode === 'rag' && uploadedFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={cn('p-6 rounded-2xl border-2 border-dashed', themeClasses.cardBorder)}>
                    <Upload size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
                    <p className={cn('text-center mb-2 font-medium', themeClasses.text)}>
                      PDFまたはテキストファイルをアップロード
                    </p>
                    <p className={cn('text-xs text-center mb-4', themeClasses.textSecondary)}>
                      資料から自動でナレッジを抽出します
                    </p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium text-center hover:shadow-md transition-all">
                        ファイルを選択
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {session?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : isDarkMode
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-slate-100'
                    )}
                  >
                    <p className={cn('text-sm whitespace-pre-wrap', msg.role === 'user' ? 'text-white' : themeClasses.text)}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className={cn(
                      'px-4 py-3 rounded-2xl flex items-center gap-2',
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                    )}
                  >
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span className={cn('text-sm', themeClasses.textSecondary)}>考え中...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={cn('p-4 border-t', themeClasses.cardBorder)}>
              {ragAnalysis && ragAnalysis.missingFields.length > 0 && missingFieldIndex === 0 && (
                <button
                  onClick={handleRAGHearingStart}
                  className="w-full mb-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all"
                >
                  不足項目のヒアリングを開始
                </button>
              )}

              {session?.status === 'completed' && (
                <button
                  onClick={handleSaveKnowledge}
                  disabled={isSaving}
                  className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      ナレッジを保存
                    </>
                  )}
                </button>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="メッセージを入力..."
                  disabled={isLoading || session?.status === 'completed'}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-xl border',
                    themeClasses.cardBg,
                    themeClasses.cardBorder,
                    themeClasses.text,
                    'disabled:opacity-50'
                  )}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim() || session?.status === 'completed'}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-md transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
