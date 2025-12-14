import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  PlusCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  Circle,
  SkipForward,
  Pause,
  Upload,
  FileText,
  X,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { useKnowledgeChatStore, KNOWLEDGE_SECTIONS } from '../../../stores/knowledgeChatStore';
import { knowledgeService } from '../../../services/knowledge';
import { extractTextFromFile, formatFileSize } from '../../../utils/fileParser';
import { cn } from '../../../utils/cn';
import { toast } from '../../../components/common';
import type { KnowledgeChatStep, UploadedKnowledgeFile } from '../../../types';

export const KnowledgeChatTab = () => {
  const { mode: themeMode, getThemeClasses } = useThemeStore();
  const isDarkMode = themeMode === 'dark';
  const themeClasses = getThemeClasses();

  const {
    session,
    mode,
    uploadedFiles,
    ragAnalysis,
    currentMissingFieldIndex,
    isSending,
    isAnalyzing,
    setMode,
    addUploadedFile,
    removeUploadedFile,
    setRagAnalysis,
    setIsAnalyzing,
    nextMissingField,
    initSession,
    addMessage,
    updateCollectedData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    completeStep,
    setSending,
    saveSession,
    resetSession,
    getProgress,
    getCurrentSection,
  } = useKnowledgeChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [deepDiveCount, setDeepDiveCount] = useState(0); // 深掘り回数のトラッキング
  const [knowledgeName, setKnowledgeName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [ragHearingStarted, setRagHearingStarted] = useState(false);
  const [hearingComplete, setHearingComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progress = getProgress();
  const currentSection = getCurrentSection();

  // メッセージエリアを自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  // ファイルアップロード処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const content = await extractTextFromFile(file);
        const uploadedFile: UploadedKnowledgeFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt',
          size: file.size,
          content,
          uploadedAt: new Date().toISOString(),
        };
        addUploadedFile(uploadedFile);
        toast.success(`${file.name}をアップロードしました`);
      } catch (error) {
        console.error('File upload error:', error);
        toast.error(`${file.name}の読み込みに失敗しました`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // RAG解析実行
  const handleAnalyzeFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('ファイルをアップロードしてください');
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysis = await knowledgeService.analyzeUploadedContent(uploadedFiles);
      setRagAnalysis(analysis);

      // セッション初期化
      if (!session) {
        initSession(undefined, knowledgeName || 'RAGナレッジ');
      }

      // 解析結果メッセージを追加
      const analysisMessage = knowledgeService.generateRAGAnalysisMessage(analysis);
      addMessage({
        role: analysisMessage.role,
        content: analysisMessage.content,
      });

      // 抽出されたデータをセッションに反映
      if (analysis.extractedData) {
        Object.entries(analysis.extractedData).forEach(([key, data]) => {
          if (data) {
            const stepMap: Record<string, KnowledgeChatStep> = {
              businessInfo: 'business_info',
              mainTarget: 'main_target',
              subTarget: 'sub_target',
              competitor: 'competitor',
              company: 'company',
              ahaConcept: 'aha_concept',
              conceptStory: 'concept_story',
              productDesign: 'product_design',
            };
            const step = stepMap[key];
            if (step) {
              updateCollectedData(step, data as Record<string, string>);
            }
          }
        });
      }

      setShowNameInput(false);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('ファイル解析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 新しいセッション開始
  const handleStartSession = () => {
    if (!knowledgeName.trim()) {
      toast.error('ナレッジ名を入力してください');
      return;
    }
    initSession(undefined, knowledgeName);
    setShowNameInput(false);
    setQuestionIndex(0);
    setDeepDiveCount(0);
  };

  // メッセージ送信
  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending || !session) return;

    const userContent = messageInput.trim();
    setMessageInput('');

    // ユーザーメッセージを追加
    addMessage({
      role: 'user',
      content: userContent,
      step: session.currentStep,
    });

    setSending(true);

    try {
      // RAGモードで不足項目ヒアリング中
      if (mode === 'rag' && ragAnalysis && ragHearingStarted) {
        // 「開始」コマンド
        if (userContent === '開始' && currentMissingFieldIndex === 0) {
          if (ragAnalysis.missingFields.length > 0) {
            const firstQuestion = knowledgeService.generateMissingFieldQuestion(
              ragAnalysis.missingFields[0]
            );
            addMessage({
              role: firstQuestion.role,
              content: firstQuestion.content,
              step: firstQuestion.step,
            });
          }
          setSending(false);
          return;
        }

        // 不足項目への回答を処理
        const currentField = ragAnalysis.missingFields[currentMissingFieldIndex];
        if (currentField) {
          // 回答をデータに保存
          updateCollectedData(currentField.step, { [currentField.field]: userContent });

          // 次の不足項目へ
          const nextIndex = currentMissingFieldIndex + 1;
          if (nextIndex < ragAnalysis.missingFields.length) {
            nextMissingField();
            const nextQuestion = knowledgeService.generateMissingFieldQuestion(
              ragAnalysis.missingFields[nextIndex],
              userContent
            );
            addMessage({
              role: nextQuestion.role,
              content: nextQuestion.content,
              step: nextQuestion.step,
            });
          } else {
            // 全項目完了
            setHearingComplete(true);
            const completionMessage = knowledgeService.getCompletionMessage(
              session.collectedData
            );
            addMessage({
              role: completionMessage.role,
              content: completionMessage.content,
            });
          }
          setSending(false);
          return;
        }
      }

      // 通常モード（手動）
      // 「次へ」の検出
      if (
        userContent === '次へ' ||
        userContent === '次' ||
        userContent.toLowerCase() === 'next'
      ) {
        handleNextStep();
        setSending(false);
        return;
      }

      // 「開始」コマンド（RAGモード）
      if (mode === 'rag' && userContent === '開始' && ragAnalysis) {
        setRagHearingStarted(true);
        if (ragAnalysis.missingFields.length > 0) {
          const firstQuestion = knowledgeService.generateMissingFieldQuestion(
            ragAnalysis.missingFields[0]
          );
          addMessage({
            role: firstQuestion.role,
            content: firstQuestion.content,
            step: firstQuestion.step,
          });
        }
        setSending(false);
        return;
      }

      // AIレスポンス取得（深掘りカウント付き）
      const { assistantMessage, shouldMoveNext, extractedData, newDeepDiveCount } =
        await knowledgeService.sendMessage(
          session.id,
          userContent,
          session.currentStep,
          session.collectedData,
          questionIndex,
          deepDiveCount
        );

      // 収集データを更新
      if (Object.keys(extractedData).length > 0) {
        updateCollectedData(session.currentStep, extractedData);
      }

      // アシスタントメッセージを追加
      addMessage({
        role: assistantMessage.role,
        content: assistantMessage.content,
        step: assistantMessage.step,
      });

      // 深掘りカウントを更新
      setDeepDiveCount(newDeepDiveCount);

      // 質問インデックスを更新
      if (!shouldMoveNext) {
        // 深掘りカウントが0にリセットされた場合のみ質問インデックスを進める
        if (newDeepDiveCount === 0) {
          setQuestionIndex((prev) => prev + 1);
        }
      } else {
        handleNextStep();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  // 次のステップへ
  const handleNextStep = () => {
    if (!session) return;

    const currentIndex = KNOWLEDGE_SECTIONS.findIndex(
      (s) => s.id === session.currentStep
    );

    completeStep(session.currentStep);

    if (currentIndex < KNOWLEDGE_SECTIONS.length - 1) {
      const nextStep = KNOWLEDGE_SECTIONS[currentIndex + 1].id;
      goToNextStep();
      setQuestionIndex(0);
      setDeepDiveCount(0); // ステップ移動時に深掘りカウントをリセット

      const transitionMessage = knowledgeService.getStepTransitionMessage(nextStep);
      addMessage({
        role: transitionMessage.role,
        content: transitionMessage.content,
        step: transitionMessage.step,
      });
    } else {
      const completionMessage = knowledgeService.getCompletionMessage(
        session.collectedData
      );
      addMessage({
        role: completionMessage.role,
        content: completionMessage.content,
      });
    }
  };

  // 前のステップへ
  const handlePreviousStep = () => {
    if (!session) return;
    goToPreviousStep();
    setQuestionIndex(0);
    setDeepDiveCount(0);
  };

  // ステップをスキップ
  const handleSkipStep = () => {
    if (!session) return;
    const section = getCurrentSection();
    if (section?.isRequired) {
      toast.error('このステップは必須です。スキップできません。');
      return;
    }
    handleNextStep();
  };

  // セッション保存
  const handleSaveSession = async () => {
    if (!session) return;

    try {
      const result = await knowledgeService.saveKnowledge(session);
      if (result.success) {
        toast.success('ナレッジを保存しました');
        saveSession();
      }
    } catch (error) {
      console.error('Error saving knowledge:', error);
      toast.error('ナレッジの保存に失敗しました');
    }
  };

  // 新規セッション
  const handleNewSession = () => {
    resetSession();
    setShowNameInput(true);
    setKnowledgeName('');
    setQuestionIndex(0);
    setDeepDiveCount(0);
    setRagHearingStarted(false);
    setHearingComplete(false);
  };

  // ヒアリング開始（RAGモード）
  const handleStartHearing = () => {
    if (!ragAnalysis || ragAnalysis.missingFields.length === 0) {
      toast.success('すべての項目が抽出されました！');
      setHearingComplete(true);
      return;
    }

    setRagHearingStarted(true);

    // 最初の質問を表示
    const firstQuestion = knowledgeService.generateMissingFieldQuestion(
      ragAnalysis.missingFields[0]
    );
    addMessage({
      role: firstQuestion.role,
      content: firstQuestion.content,
      step: firstQuestion.step,
    });

    // 入力欄にフォーカス
    inputRef.current?.focus();
  };

  // ヒアリングスキップ（現在の質問をスキップ）
  const handleSkipHearing = () => {
    if (!ragAnalysis) return;

    const nextIndex = currentMissingFieldIndex + 1;
    if (nextIndex < ragAnalysis.missingFields.length) {
      nextMissingField();
      const nextQuestion = knowledgeService.generateMissingFieldQuestion(
        ragAnalysis.missingFields[nextIndex]
      );
      addMessage({
        role: 'assistant',
        content: `スキップしました。次の質問です。\n\n${nextQuestion.content.split('\n\n').slice(1).join('\n\n')}`,
        step: nextQuestion.step,
      });
    } else {
      // 全項目完了（スキップ含む）
      setHearingComplete(true);
      const completionMessage = knowledgeService.getCompletionMessage(
        session?.collectedData || {}
      );
      addMessage({
        role: completionMessage.role,
        content: completionMessage.content,
      });
    }
  };

  // 特定のステップへジャンプ
  const handleJumpToStep = (step: KnowledgeChatStep) => {
    if (!session) return;
    goToStep(step);
    setQuestionIndex(0);
    setDeepDiveCount(0);

    const transitionMessage = knowledgeService.getStepTransitionMessage(step);
    addMessage({
      role: transitionMessage.role,
      content: transitionMessage.content,
      step: transitionMessage.step,
    });
  };

  // ナレッジ名入力・モード選択画面
  if (showNameInput || !session) {
    return (
      <div
        className={cn(
          'rounded-3xl shadow-sm border p-8',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <div className="max-w-2xl mx-auto py-8">
          <div className="text-center mb-8">
            <div
              className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4',
                'bg-gradient-to-r from-blue-600 to-indigo-600'
              )}
            >
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className={cn('text-2xl font-bold mb-2', themeClasses.text)}>
              ナレッジ作成チャットボット
            </h2>
            <p className={cn('text-sm', themeClasses.textSecondary)}>
              8つのステップで、あなたのビジネスナレッジを構築します
            </p>
          </div>

          {/* モード選択 */}
          <div className="mb-6">
            <label className={cn('block text-sm font-medium mb-3', themeClasses.text)}>
              作成モードを選択
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('manual')}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  mode === 'manual'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isDarkMode
                    ? 'border-slate-700 hover:border-slate-600'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <MessageSquare
                  className={cn(
                    'w-6 h-6 mb-2',
                    mode === 'manual' ? 'text-blue-600' : themeClasses.textSecondary
                  )}
                />
                <div className={cn('font-medium', themeClasses.text)}>手動入力</div>
                <div className={cn('text-xs mt-1', themeClasses.textSecondary)}>
                  AIの質問に答えながらナレッジを構築
                </div>
              </button>
              <button
                onClick={() => setMode('rag')}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  mode === 'rag'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isDarkMode
                    ? 'border-slate-700 hover:border-slate-600'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <Sparkles
                  className={cn(
                    'w-6 h-6 mb-2',
                    mode === 'rag' ? 'text-blue-600' : themeClasses.textSecondary
                  )}
                />
                <div className={cn('font-medium', themeClasses.text)}>RAGモード</div>
                <div className={cn('text-xs mt-1', themeClasses.textSecondary)}>
                  既存資料から抽出＋不足項目をヒアリング
                </div>
              </button>
            </div>
          </div>

          {/* ナレッジ名入力 */}
          <div className="mb-6">
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              ナレッジ名（ブランド名 or シリーズ名）
            </label>
            <input
              type="text"
              value={knowledgeName}
              onChange={(e) => setKnowledgeName(e.target.value)}
              placeholder="例: AIアバター超集客法"
              className={cn(
                'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500'
                  : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
              )}
            />
          </div>

          {/* RAGモード: ファイルアップロード */}
          {mode === 'rag' && (
            <div className="mb-6">
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                既存のナレッジ資料をアップロード（PDF/TXT）
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'w-full px-4 py-6 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 transition-colors',
                  isDarkMode
                    ? 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                )}
              >
                {isUploading ? (
                  <Loader2 className={cn('w-8 h-8 animate-spin', themeClasses.textSecondary)} />
                ) : (
                  <Upload className={cn('w-8 h-8', themeClasses.textSecondary)} />
                )}
                <span className={cn('text-sm', themeClasses.textSecondary)}>
                  クリックしてファイルを選択
                </span>
              </button>

              {/* アップロード済みファイル一覧 */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-xl',
                        isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={cn('w-5 h-5', themeClasses.textSecondary)} />
                        <div>
                          <div className={cn('text-sm font-medium', themeClasses.text)}>
                            {file.name}
                          </div>
                          <div className={cn('text-xs', themeClasses.textSecondary)}>
                            {formatFileSize(file.size)} • {file.content.length.toLocaleString()}文字
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeUploadedFile(file.id)}
                        className={cn(
                          'p-1 rounded-lg transition-colors',
                          isDarkMode
                            ? 'hover:bg-slate-700 text-slate-400'
                            : 'hover:bg-slate-200 text-slate-500'
                        )}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 開始ボタン */}
          {mode === 'manual' ? (
            <button
              onClick={handleStartSession}
              disabled={!knowledgeName.trim()}
              className={cn(
                'w-full px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                knowledgeName.trim()
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                  : isDarkMode
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <PlusCircle className="w-5 h-5" />
              ナレッジ作成を開始
            </button>
          ) : (
            <button
              onClick={handleAnalyzeFiles}
              disabled={uploadedFiles.length === 0 || isAnalyzing}
              className={cn(
                'w-full px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                uploadedFiles.length > 0 && !isAnalyzing
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                  : isDarkMode
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  ファイルを解析してナレッジ抽出
                </>
              )}
            </button>
          )}

          {/* 8ステップのプレビュー */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h3 className={cn('text-sm font-medium mb-4', themeClasses.textSecondary)}>
              作成ステップ（8セクション）
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {KNOWLEDGE_SECTIONS.map((section) => (
                <div
                  key={section.id}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm',
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-50'
                  )}
                >
                  <span className={cn('font-medium', themeClasses.text)}>
                    {section.stepNumber}. {section.title}
                  </span>
                  {!section.isRequired && (
                    <span className={cn('ml-2 text-xs', themeClasses.textSecondary)}>
                      (任意)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-3xl shadow-sm border p-8',
        themeClasses.cardBg,
        themeClasses.cardBorder
      )}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={cn('text-xl font-bold', themeClasses.text)}>
              ナレッジ作成: {session.knowledgeName}
            </h2>
            {mode === 'rag' && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'
                )}
              >
                RAGモード
              </span>
            )}
          </div>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            {mode === 'rag' && ragAnalysis
              ? `不足項目: ${currentMissingFieldIndex + 1}/${ragAnalysis.missingFields.length}`
              : `STEP ${session.currentStepNumber}/${KNOWLEDGE_SECTIONS.length}: ${currentSection?.title}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveSession}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors',
              isDarkMode
                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            <Pause className="w-4 h-4" />
            保存して中断
          </button>
          <button
            onClick={handleNewSession}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors',
              isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <PlusCircle className="w-4 h-4" />
            新規作成
          </button>
        </div>
      </div>

      {/* ハイブリッドレイアウト */}
      <div className="grid grid-cols-3 gap-6">
        {/* チャットエリア */}
        <div className="col-span-2 flex flex-col h-[calc(100vh-20rem)]">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
            {session.messages.map((message) => {
              if (message.role === 'assistant' || message.role === 'system') {
                return (
                  <div key={message.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        'bg-gradient-to-r from-blue-600 to-indigo-600'
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
                        <div
                          className={cn('whitespace-pre-wrap', themeClasses.text)}
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br />'),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={message.id} className="flex items-start gap-3 justify-end">
                    <div className="flex-1 max-w-lg">
                      <div
                        className={cn(
                          'rounded-2xl rounded-tr-none p-4',
                          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                      )}
                    >
                      <User
                        className={cn(
                          'w-5 h-5',
                          isDarkMode ? 'text-slate-300' : 'text-slate-600'
                        )}
                      />
                    </div>
                  </div>
                );
              }
            })}
            {(isSending || isAnalyzing) && (
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    'bg-gradient-to-r from-blue-600 to-indigo-600'
                  )}
                >
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div
                  className={cn(
                    'rounded-2xl rounded-tl-none p-4',
                    isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'
                  )}
                >
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div
            className={cn(
              'border-t pt-4',
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            )}
          >
            <div className="flex gap-3 mb-3">
              <input
                ref={inputRef}
                type="text"
                placeholder="メッセージを入力..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
                className={cn(
                  'flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400',
                  isSending && 'opacity-50'
                )}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                className={cn(
                  'px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all',
                  messageInput.trim() && !isSending
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                    : isDarkMode
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                送信
              </button>
            </div>

            {/* ナビゲーション（手動モードのみ） */}
            {mode === 'manual' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousStep}
                    disabled={session.currentStepNumber <= 1}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors',
                      session.currentStepNumber > 1
                        ? isDarkMode
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-100'
                        : 'text-slate-400 cursor-not-allowed'
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    前のステップ
                  </button>
                  {!currentSection?.isRequired && (
                    <button
                      onClick={handleSkipStep}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors',
                        isDarkMode
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      <SkipForward className="w-4 h-4" />
                      スキップ
                    </button>
                  )}
                </div>
                <button
                  onClick={handleNextStep}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors',
                    isDarkMode
                      ? 'text-blue-400 hover:bg-blue-900/30'
                      : 'text-blue-600 hover:bg-blue-50'
                  )}
                >
                  次のステップ
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* RAGモード: ヒアリング開始ボタン */}
            {mode === 'rag' && ragAnalysis && !ragHearingStarted && !hearingComplete && (
              <div className="flex items-center justify-center">
                <button
                  onClick={handleStartHearing}
                  className={cn(
                    'px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all',
                    'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg'
                  )}
                >
                  <MessageSquare className="w-5 h-5" />
                  不足項目のヒアリングを開始（{ragAnalysis.missingFields.length}件）
                </button>
              </div>
            )}

            {/* RAGモード: ヒアリング中のナビゲーション */}
            {mode === 'rag' && ragHearingStarted && !hearingComplete && ragAnalysis && (
              <div className="flex items-center justify-between">
                <div className={cn('text-sm', themeClasses.textSecondary)}>
                  質問 {currentMissingFieldIndex + 1} / {ragAnalysis.missingFields.length}
                </div>
                <button
                  onClick={handleSkipHearing}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors',
                    isDarkMode
                      ? 'text-slate-300 hover:bg-slate-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <SkipForward className="w-4 h-4" />
                  この質問をスキップ
                </button>
              </div>
            )}

            {/* RAGモード: ヒアリング完了 */}
            {mode === 'rag' && hearingComplete && (
              <div className="flex items-center justify-center">
                <div
                  className={cn(
                    'px-4 py-2 rounded-xl flex items-center gap-2',
                    isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                  )}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  ヒアリング完了！保存してナレッジを作成できます
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 進捗パネル */}
        <div
          className={cn(
            'col-span-1 border-l pl-6 flex flex-col h-[calc(100vh-20rem)]',
            isDarkMode ? 'border-slate-700' : 'border-slate-200'
          )}
        >
          {/* 進捗バー */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-sm font-medium', themeClasses.text)}>
                全体進捗
              </span>
              <span className={cn('text-sm font-bold', themeClasses.text)}>
                {progress.progressPercent}%
              </span>
            </div>
            <div
              className={cn(
                'h-2 rounded-full overflow-hidden',
                isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
              )}
            >
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>

          {/* RAGモード: 抽出結果サマリー & ヒアリング進捗 */}
          {mode === 'rag' && ragAnalysis && (
            <div className="mb-4 space-y-3">
              {/* 解析結果サマリー */}
              <div
                className={cn(
                  'p-3 rounded-xl',
                  isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'
                )}
              >
                <div className={cn('text-xs font-medium mb-1', themeClasses.text)}>
                  📊 RAG解析結果
                </div>
                <div className={cn('text-xs', themeClasses.textSecondary)}>
                  信頼度: {ragAnalysis.confidence}% • 抽出済み: {ragAnalysis.extractedFields}/{ragAnalysis.totalFields}
                </div>
              </div>

              {/* ヒアリング進捗 */}
              {ragHearingStarted && (
                <div
                  className={cn(
                    'p-3 rounded-xl',
                    isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                  )}
                >
                  <div className={cn('text-xs font-medium mb-2', themeClasses.text)}>
                    🎙️ ヒアリング進捗
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        'flex-1 h-1.5 rounded-full overflow-hidden',
                        isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                      )}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                        style={{
                          width: `${((currentMissingFieldIndex + (hearingComplete ? 1 : 0)) / ragAnalysis.missingFields.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className={cn('text-xs font-medium', themeClasses.textSecondary)}>
                      {currentMissingFieldIndex + (hearingComplete ? 1 : 0)}/{ragAnalysis.missingFields.length}
                    </span>
                  </div>
                  {!hearingComplete && ragAnalysis.missingFields[currentMissingFieldIndex] && (
                    <div className={cn('text-xs', themeClasses.textSecondary)}>
                      現在: {ragAnalysis.missingFields[currentMissingFieldIndex].fieldLabel}
                    </div>
                  )}
                  {hearingComplete && (
                    <div className={cn('text-xs text-green-500')}>
                      ✓ 全項目完了
                    </div>
                  )}
                </div>
              )}

              {/* 残りの不足項目リスト（ヒアリング開始前） */}
              {!ragHearingStarted && ragAnalysis.missingFields.length > 0 && (
                <div
                  className={cn(
                    'p-3 rounded-xl',
                    isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'
                  )}
                >
                  <div className={cn('text-xs font-medium mb-2', themeClasses.text)}>
                    📝 不足項目（{ragAnalysis.missingFields.length}件）
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {ragAnalysis.missingFields.slice(0, 8).map((field, idx) => (
                      <div
                        key={`${field.step}-${field.field}`}
                        className={cn('text-xs', themeClasses.textSecondary)}
                      >
                        {idx + 1}. {field.fieldLabel}
                      </div>
                    ))}
                    {ragAnalysis.missingFields.length > 8 && (
                      <div className={cn('text-xs', themeClasses.textSecondary)}>
                        ...他 {ragAnalysis.missingFields.length - 8}件
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ステップ一覧 */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {KNOWLEDGE_SECTIONS.map((section) => {
              const isCompleted = session.completedSteps.includes(section.id);
              const isCurrent = session.currentStep === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => handleJumpToStep(section.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl transition-all',
                    isCurrent
                      ? isDarkMode
                        ? 'bg-blue-900/30 border border-blue-500'
                        : 'bg-blue-50 border border-blue-200'
                      : isDarkMode
                      ? 'hover:bg-slate-800'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    ) : (
                      <Circle
                        className={cn(
                          'w-5 h-5 flex-shrink-0',
                          isDarkMode ? 'text-slate-600' : 'text-slate-300'
                        )}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'text-sm font-medium truncate',
                          isCurrent
                            ? 'text-blue-600'
                            : isCompleted
                            ? themeClasses.text
                            : themeClasses.textSecondary
                        )}
                      >
                        {section.stepNumber}. {section.title}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 収集済み情報 */}
          <div
            className={cn(
              'border-t pt-4 mt-4',
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            )}
          >
            <h4 className={cn('text-sm font-medium mb-3', themeClasses.text)}>
              収集済み情報
            </h4>
            <div className="space-y-2 text-xs max-h-32 overflow-y-auto">
              {session.collectedData.businessInfo?.industry && (
                <div className={cn('flex items-center gap-2', themeClasses.textSecondary)}>
                  <span className="font-medium">業種:</span>
                  <span className="truncate">{session.collectedData.businessInfo.industry}</span>
                </div>
              )}
              {session.collectedData.mainTarget?.attributes && (
                <div className={cn('flex items-center gap-2', themeClasses.textSecondary)}>
                  <span className="font-medium">ターゲット:</span>
                  <span className="truncate">{session.collectedData.mainTarget.attributes}</span>
                </div>
              )}
              {session.collectedData.ahaConcept?.naming && (
                <div className={cn('flex items-center gap-2', themeClasses.textSecondary)}>
                  <span className="font-medium">コンセプト:</span>
                  <span className="truncate">{session.collectedData.ahaConcept.naming}</span>
                </div>
              )}
              {progress.collectedFieldsCount === 0 && (
                <div className={themeClasses.textSecondary}>まだ情報がありません</div>
              )}
            </div>
          </div>

          {/* 保存ボタン */}
          {progress.progressPercent === 100 && (
            <button
              onClick={handleSaveSession}
              className={cn(
                'w-full mt-4 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
              )}
            >
              <Save className="w-5 h-5" />
              ナレッジを保存
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
