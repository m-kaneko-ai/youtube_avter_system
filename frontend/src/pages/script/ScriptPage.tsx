import { useState, useCallback } from 'react';
import {
  Lightbulb,
  Sparkles,
  Image,
  Edit3,
  Share2,
  Plus,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { TitleTab } from './components/TitleTab';
import { SEOTab } from './components/SEOTab';
import { ScriptEditorColumn, ScriptSection } from './components/ScriptEditorColumn';
import { ExpertReviewModal } from './components/ExpertReviewModal';
import { ExpertReviewSection, ExpertReviewSectionData } from './components/ExpertReviewSection';
import { QualityAssuranceSet } from './components/QualityAssuranceSet';
import { toast } from '../../components/common';
import { expertReviewService } from '../../services/expertReview';
import type {
  ExpertType,
  ExpertReviewResult,
  ExpertReviewProgress,
  ScriptViewMode,
} from '../../types';

// 初期データ（実際にはAPIから取得）
const initialGeminiSections: ScriptSection[] = [
  {
    id: 'gemini-1',
    label: '導入',
    timestamp: '0:00-0:30',
    content:
      'プログラミングを始めたいあなたへ。なぜPythonが選ばれるのか、その3つの理由を解説します。',
  },
  {
    id: 'gemini-2',
    label: '理由1：読みやすさ',
    timestamp: '0:30-1:30',
    content:
      'Pythonの最大の特徴は、英語を読むようにコードが読めることです。例えば...',
  },
  {
    id: 'gemini-3',
    label: '理由2：豊富なライブラリ',
    timestamp: '1:30-2:30',
    content:
      'データ分析、Web開発、AI開発。やりたいことに合わせたライブラリが揃っています。',
  },
  {
    id: 'gemini-4',
    label: '理由3：コミュニティ',
    timestamp: '2:30-3:30',
    content:
      '困ったときに助けてくれる仲間がたくさんいます。Stack Overflowでの質問数は常にトップクラス。',
  },
  {
    id: 'gemini-5',
    label: 'まとめ',
    timestamp: '3:30-4:00',
    content: '今日からPythonを始めてみませんか？コメント欄で質問もお待ちしています。',
  },
];

const initialClaudeSections: ScriptSection[] = [
  {
    id: 'claude-1',
    label: '導入',
    timestamp: '0:00-0:30',
    content:
      '毎日のルーチンワーク、退屈じゃありませんか？実はPythonを使えば、その作業、1クリックで終わります。',
  },
  {
    id: 'claude-2',
    label: '自動化の実例',
    timestamp: '0:30-1:30',
    content:
      '想像してみてください。朝出社してコーヒーを飲んでいる間に、昨日の売上集計が終わっている世界を...',
  },
  {
    id: 'claude-3',
    label: '具体的なコード',
    timestamp: '1:30-2:30',
    content:
      '実際のコードを見てみましょう。たった10行で、Excelファイルを自動で処理できます。',
  },
  {
    id: 'claude-4',
    label: '応用例',
    timestamp: '2:30-3:30',
    content: 'メール送信、ファイル整理、データ収集...自動化できることは無限大です。',
  },
  {
    id: 'claude-5',
    label: 'アクション',
    timestamp: '3:30-4:00',
    content:
      'まずは小さな自動化から始めてみましょう。概要欄にサンプルコードを載せておきます。',
  },
];


export const ScriptPage = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const { getActiveTab } = useNavigationStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const activeTab = getActiveTab('script');

  // 現在選択中の台本・動画ID（実際にはURLパラメータやストアから取得）
  const [currentScriptId] = useState<string>('script-001');
  const [currentVideoId] = useState<string>('video-001');

  // 台本データ
  const [geminiSections, setGeminiSections] = useState<ScriptSection[]>(initialGeminiSections);
  const [claudeSections, setClaudeSections] = useState<ScriptSection[]>(initialClaudeSections);

  // 表示モード管理
  type ViewMode = 'compare' | 'focus' | 'expertReview';
  type FocusTarget = 'gemini' | 'claude' | null;
  type SourceAiType = 'gemini' | 'claude';
  const [viewMode, setViewMode] = useState<ViewMode>('compare');
  const [focusedColumn, setFocusedColumn] = useState<FocusTarget>(null);

  // 専門家レビュー対象のAIタイプ（将来の拡張用に保持）
  const [_selectedAiForReview, setSelectedAiForReview] = useState<SourceAiType>('gemini');

  // 専門家レビュー関連の状態
  const [isExpertReviewModalOpen, setIsExpertReviewModalOpen] = useState(false);
  const [expertReviewProgress, setExpertReviewProgress] = useState<ExpertReviewProgress>({
    status: 'idle',
    completedExperts: [],
    progress: 0,
  });
  const [completedExperts, setCompletedExperts] = useState<ExpertType[]>([]);
  const [expertReviewResult, setExpertReviewResult] = useState<ExpertReviewResult | null>(null);
  const [expertReviewSections, setExpertReviewSections] = useState<ExpertReviewSectionData[]>([]);
  const [scriptViewMode, setScriptViewMode] = useState<ScriptViewMode>('with_visual');

  // ハンドラー関数
  const handleGenerateIdea = () => {
    toast.info('アイデアを生成中です...');
  };

  const handleRewriteGemini = () => {
    toast.info('Geminiで台本を書き直しています...');
  };

  const handleRewriteClaude = () => {
    toast.info('Claudeで台本を書き直しています...');
  };

  const handleColumnDoubleClick = (column: FocusTarget) => {
    setFocusedColumn(column);
    setViewMode('focus');
  };

  const handleExitFocus = () => {
    setFocusedColumn(null);
    setViewMode('compare');
  };

  const handleBackToCompare = () => {
    setViewMode('compare');
    setExpertReviewResult(null);
  };

  const handleAdoptGemini = () => {
    toast.success('Geminiの台本を採用しました');
  };

  const handleAdoptClaude = () => {
    toast.success('Claudeの台本を採用しました');
  };

  const handleAdoptExpertReview = () => {
    toast.success('専門家レビュー版の台本を採用しました');
  };

  const handleEditThumbnail = () => {
    toast.info('サムネイルを編集します');
  };

  const handleShareThumbnail = () => {
    toast.info('サムネイルを共有します');
  };

  const handleSelectThumbnail = (index: number) => {
    toast.success(`案 ${index} のサムネイルを選択しました`);
  };

  const handleGenerateVariation = () => {
    toast.info('新しいバリエーションを生成中です...');
  };

  // 専門家レビュー開始（AIタイプを指定）
  const handleStartExpertReview = useCallback(async (aiType: 'gemini' | 'claude') => {
    setSelectedAiForReview(aiType);
    setIsExpertReviewModalOpen(true);
    setExpertReviewProgress({
      status: 'processing',
      currentExpert: 'hook_master',
      completedExperts: [],
      progress: 0,
    });
    setCompletedExperts([]);

    try {
      // 選択されたAIの台本を取得
      const sourceSections = aiType === 'gemini' ? geminiSections : claudeSections;

      // 進捗シミュレーション
      await expertReviewService.simulateProgress(
        (expert) => {
          setCompletedExperts((prev) => {
            const newCompleted = [...prev, expert];
            const nextExpert = getNextExpert(expert);
            if (nextExpert) {
              setExpertReviewProgress({
                status: 'processing',
                currentExpert: nextExpert,
                completedExperts: newCompleted,
                progress: Math.round((newCompleted.length / 5) * 100),
              });
            }
            return newCompleted;
          });
        },
        async () => {
          // レビュー完了 - APIからデータを取得
          const sections = sourceSections.map((s) => ({
            id: s.id,
            label: s.label,
            timestamp: s.timestamp,
            content: s.content,
          }));

          const result = await expertReviewService.startReview({
            scriptId: currentScriptId,
            sections,
            sourceAiType: aiType,
          });

          setExpertReviewResult(result);
          setExpertReviewSections(
            result.revisedSections.map((s) => ({
              ...s,
              visual: { type: 'avatar' as const },
            }))
          );
          const allExperts: ExpertType[] = [
            'hook_master',
            'story_architect',
            'entertainment_producer',
            'target_insight',
            'cta_strategist',
          ];
          setExpertReviewProgress({
            status: 'completed',
            completedExperts: allExperts,
            progress: 100,
          });
          setIsExpertReviewModalOpen(false);
          setViewMode('expertReview');
          toast.success('専門家レビューが完了しました！');
        }
      );
    } catch {
      setExpertReviewProgress({
        status: 'error',
        errorMessage: 'レビュー中にエラーが発生しました',
        completedExperts: [],
        progress: 0,
      });
    }
  }, [geminiSections, claudeSections, currentScriptId]);

  // 次の専門家を取得
  const getNextExpert = (current: ExpertType): ExpertType | null => {
    const order: ExpertType[] = [
      'hook_master',
      'story_architect',
      'entertainment_producer',
      'target_insight',
      'cta_strategist',
    ];
    const currentIndex = order.indexOf(current);
    return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
  };

  if (activeTab === 'script') {
    // 専門家レビュー結果表示モード
    if (viewMode === 'expertReview' && expertReviewResult) {
      return (
        <div className="px-6 pb-4 min-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="space-y-6">
            {/* 戻るボタン */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToCompare}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <ArrowLeft size={14} /> 比較画面に戻る
              </button>
            </div>

            {/* 公開OK判定 */}
            <div
              className={cn(
                'rounded-3xl p-6 border',
                expertReviewResult.publishReadiness.ready
                  ? isDarkMode
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                  : isDarkMode
                  ? 'bg-yellow-900/20 border-yellow-500/30'
                  : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center',
                      expertReviewResult.publishReadiness.ready
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                        : 'bg-gradient-to-r from-yellow-600 to-amber-600'
                    )}
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className={cn('text-2xl font-bold', themeClasses.text)}>
                      {expertReviewResult.publishReadiness.ready
                        ? '公開OK判定'
                        : '改善推奨'}
                    </h2>
                    <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
                      専門家チームの総合評価
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'text-5xl font-bold',
                      expertReviewResult.publishReadiness.ready
                        ? 'text-green-700'
                        : 'text-yellow-700'
                    )}
                  >
                    {expertReviewResult.publishReadiness.score}
                  </div>
                  <div className={cn('text-sm', themeClasses.textSecondary)}>/100点</div>
                </div>
              </div>
            </div>

            {/* 専門家レビュー版台本 */}
            <ExpertReviewSection
              sections={expertReviewSections}
              onSectionsChange={setExpertReviewSections}
              viewMode={scriptViewMode}
              onViewModeChange={setScriptViewMode}
              onAdopt={handleAdoptExpertReview}
            />

            {/* 安心セット */}
            <QualityAssuranceSet reviewResult={expertReviewResult} />
          </div>
        </div>
      );
    }

    // フォーカスモード（1カラム拡大）
    if (viewMode === 'focus' && focusedColumn) {
      const focusData = {
        gemini: {
          sections: geminiSections,
          setSections: setGeminiSections,
          title: '【2025年版】Python入門完全ガイド',
          onAdopt: handleAdoptGemini,
          onRewrite: handleRewriteGemini,
        },
        claude: {
          sections: claudeSections,
          setSections: setClaudeSections,
          title: 'まだExcelで消耗してるの？Pythonで自動化しよう',
          onAdopt: handleAdoptClaude,
          onRewrite: handleRewriteClaude,
        },
      }[focusedColumn];

      return (
        <div className="px-6 pb-4 h-[calc(100vh-5rem)]">
          <div className="h-full flex flex-col gap-3">
            {/* 戻るボタン */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExitFocus}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <ArrowLeft size={14} /> 比較画面に戻る
              </button>
              <span className={cn('text-xs', themeClasses.textSecondary)}>
                ダブルクリックで比較画面に戻れます
              </span>
            </div>

            {/* フォーカス表示（1カラム） */}
            <div className="flex-1 max-w-4xl mx-auto w-full min-h-0" onDoubleClick={handleExitFocus}>
              <ScriptEditorColumn
                aiType={focusedColumn}
                title={focusData.title}
                sections={focusData.sections}
                onSectionsChange={focusData.setSections}
                onAdopt={focusData.onAdopt}
                onRewriteAll={focusData.onRewrite}
                onRequestExpertReview={() => handleStartExpertReview(focusedColumn)}
                showExpertReviewButton
              />
            </div>
          </div>
        </div>
      );
    }

    // 通常表示（比較モード）
    return (
      <>
        <div className="px-6 pb-4 h-[calc(100vh-5rem)]">
          <div className="h-full flex flex-col gap-3">
            {/* ヘッダーエリア */}
            <div className="flex items-center justify-between">
              {/* Input Area */}
              <div className="flex items-center gap-3 flex-1 max-w-3xl">
                <div
                  className={cn(
                    'p-1.5 rounded-xl shadow-sm border flex gap-2 items-center flex-1 transition-shadow focus-within:shadow-md',
                    themeClasses.cardBg,
                    themeClasses.cardBorder
                  )}
                >
                  <div className={cn('pl-3', themeClasses.textSecondary)}>
                    <Lightbulb size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="どんな動画を作りたいですか？"
                    className={cn(
                      'flex-1 bg-transparent border-none py-2 text-sm focus:ring-0 placeholder:text-slate-400',
                      themeClasses.text
                    )}
                  />
                  <button
                    onClick={handleGenerateIdea}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all transform active:scale-95"
                  >
                    <Sparkles size={14} /> 生成
                  </button>
                </div>
              </div>

              {/* ヒント */}
              <div className="flex items-center gap-2 ml-4">
                <span className={cn('text-[10px]', themeClasses.textSecondary)}>
                  ダブルクリックで拡大 / 各カラムから専門家レビューを開始
                </span>
              </div>
            </div>

            {/* AI Comparison Columns */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              {/* Gemini */}
              <div
                onDoubleClick={() => handleColumnDoubleClick('gemini')}
                className="cursor-pointer min-h-0"
              >
                <ScriptEditorColumn
                  aiType="gemini"
                  title="【2025年版】Python入門完全ガイド"
                  sections={geminiSections}
                  onSectionsChange={setGeminiSections}
                  onAdopt={handleAdoptGemini}
                  onRewriteAll={handleRewriteGemini}
                  onRequestExpertReview={() => handleStartExpertReview('gemini')}
                  showExpertReviewButton
                />
              </div>

              {/* Claude */}
              <div
                onDoubleClick={() => handleColumnDoubleClick('claude')}
                className="cursor-pointer min-h-0"
              >
                <ScriptEditorColumn
                  aiType="claude"
                  title="まだExcelで消耗してるの？Pythonで自動化しよう"
                  sections={claudeSections}
                  onSectionsChange={setClaudeSections}
                  onAdopt={handleAdoptClaude}
                  onRewriteAll={handleRewriteClaude}
                  onRequestExpertReview={() => handleStartExpertReview('claude')}
                  showExpertReviewButton
                />
              </div>
            </div>
          </div>
        </div>

        {/* 専門家レビューモーダル */}
        <ExpertReviewModal
          isOpen={isExpertReviewModalOpen}
          onClose={() => setIsExpertReviewModalOpen(false)}
          progress={expertReviewProgress}
          completedExperts={completedExperts}
        />
      </>
    );
  }

  // Thumbnail Tab
  if (activeTab === 'thumbnail') {
    return (
      <div className="px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-3xl overflow-hidden shadow-sm border group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div
                className={cn(
                  'aspect-video relative overflow-hidden',
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform duration-700">
                  <Image
                    size={48}
                    className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditThumbnail();
                    }}
                    className="text-white hover:text-blue-300 transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareThumbnail();
                    }}
                    className="text-white hover:text-blue-300 transition-colors"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
                <div
                  className={cn(
                    'absolute top-3 right-3 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full shadow-sm',
                    isDarkMode ? 'bg-black/50 text-slate-200' : 'bg-white/90 text-slate-700'
                  )}
                >
                  Nano Banana Pro
                </div>
              </div>
              <div className="p-5">
                <h4 className={cn('font-bold mb-3 text-lg', themeClasses.text)}>
                  案 {i}: インパクト重視のデザインパターン
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500/10 text-green-500 px-2 py-1 rounded-md text-xs font-bold">
                      CTR予測
                    </div>
                    <span className={cn('font-bold', themeClasses.text)}>8.{i}%</span>
                  </div>
                  <button
                    onClick={() => handleSelectThumbnail(i)}
                    className="text-blue-500 font-bold text-sm hover:underline"
                  >
                    選択する
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div
            onClick={handleGenerateVariation}
            className={cn(
              'border-2 border-dashed rounded-3xl flex flex-col items-center justify-center min-h-[300px] transition-all cursor-pointer',
              isDarkMode
                ? 'border-slate-700 text-slate-500 hover:border-blue-500 hover:bg-blue-900/10 hover:text-blue-400'
                : 'border-slate-200 text-slate-400 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-500'
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors',
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
              )}
            >
              <Plus size={24} />
            </div>
            <span className="font-bold">新しいバリエーションを生成</span>
          </div>
        </div>
      </div>
    );
  }

  // Title Tab
  if (activeTab === 'title') {
    return <TitleTab scriptId={currentScriptId} videoId={currentVideoId} />;
  }

  // SEO Tab
  if (activeTab === 'seo') {
    return <SEOTab scriptId={currentScriptId} videoId={currentVideoId} />;
  }

  // Default fallback
  return (
    <div className={cn('text-center py-20 px-8', themeClasses.textSecondary)}>
      コンテンツを読み込み中...
    </div>
  );
};
