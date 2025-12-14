import { useState } from 'react';
import { Lightbulb, Sparkles, Wand2, Image, Edit3, Share2, Plus, ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { TitleTab } from './components/TitleTab';
import { SEOTab } from './components/SEOTab';
import { ScriptEditorColumn, ScriptSection } from './components/ScriptEditorColumn';
import { toast } from '../../components/common';

// 初期データ（実際にはAPIから取得）
const initialGeminiSections: ScriptSection[] = [
  {
    id: 'gemini-1',
    label: '導入',
    timestamp: '0:00-0:30',
    content: 'プログラミングを始めたいあなたへ。なぜPythonが選ばれるのか、その3つの理由を解説します。',
  },
  {
    id: 'gemini-2',
    label: '理由1：読みやすさ',
    timestamp: '0:30-1:30',
    content: 'Pythonの最大の特徴は、英語を読むようにコードが読めることです。例えば...',
  },
  {
    id: 'gemini-3',
    label: '理由2：豊富なライブラリ',
    timestamp: '1:30-2:30',
    content: 'データ分析、Web開発、AI開発。やりたいことに合わせたライブラリが揃っています。',
  },
  {
    id: 'gemini-4',
    label: '理由3：コミュニティ',
    timestamp: '2:30-3:30',
    content: '困ったときに助けてくれる仲間がたくさんいます。Stack Overflowでの質問数は常にトップクラス。',
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
    content: '毎日のルーチンワーク、退屈じゃありませんか？実はPythonを使えば、その作業、1クリックで終わります。',
  },
  {
    id: 'claude-2',
    label: '自動化の実例',
    timestamp: '0:30-1:30',
    content: '想像してみてください。朝出社してコーヒーを飲んでいる間に、昨日の売上集計が終わっている世界を...',
  },
  {
    id: 'claude-3',
    label: '具体的なコード',
    timestamp: '1:30-2:30',
    content: '実際のコードを見てみましょう。たった10行で、Excelファイルを自動で処理できます。',
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
    content: 'まずは小さな自動化から始めてみましょう。概要欄にサンプルコードを載せておきます。',
  },
];

// AIミックス版の初期データ（両方の良いところを組み合わせ）
const initialMixedSections: ScriptSection[] = [
  {
    id: 'mixed-1',
    label: '導入（感情訴求）',
    timestamp: '0:00-0:30',
    content: '毎日のルーチンワーク、退屈じゃありませんか？実はPythonを使えば、その作業、1クリックで終わります。',
  },
  {
    id: 'mixed-2',
    label: '理由1：読みやすさ',
    timestamp: '0:30-1:30',
    content: 'Pythonの最大の特徴は、英語を読むようにコードが読めることです。初心者でも理解しやすい構文で、挫折しにくいのが魅力です。',
  },
  {
    id: 'mixed-3',
    label: '自動化の実例',
    timestamp: '1:30-2:30',
    content: '想像してみてください。朝出社してコーヒーを飲んでいる間に、昨日の売上集計が終わっている世界を。たった10行のコードで実現できます。',
  },
  {
    id: 'mixed-4',
    label: '豊富なライブラリ',
    timestamp: '2:30-3:30',
    content: 'データ分析、Web開発、AI開発。やりたいことに合わせたライブラリが揃っています。車輪の再発明は不要です。',
  },
  {
    id: 'mixed-5',
    label: 'アクション',
    timestamp: '3:30-4:00',
    content: '今日からPythonを始めてみませんか？概要欄にサンプルコードを載せておきます。コメント欄で質問もお待ちしています。',
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
  const [mixedSections, setMixedSections] = useState<ScriptSection[]>(initialMixedSections);
  const [isMixedGenerated, setIsMixedGenerated] = useState(false);

  // 表示モード管理
  type ViewMode = 'compare' | 'withMix' | 'focus';
  type FocusTarget = 'gemini' | 'claude' | 'mixed' | null;
  const [viewMode, setViewMode] = useState<ViewMode>('compare');
  const [focusedColumn, setFocusedColumn] = useState<FocusTarget>(null);

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

  const handleRewriteMixed = () => {
    toast.info('AIミックス版を再生成しています...');
  };

  const handleGenerateMixed = () => {
    toast.info('両方の良いところをミックス中...');
    setTimeout(() => {
      setIsMixedGenerated(true);
      setViewMode('withMix');
      toast.success('AIミックス版を生成しました！');
    }, 1500);
  };

  const handleColumnDoubleClick = (column: FocusTarget) => {
    setFocusedColumn(column);
    setViewMode('focus');
  };

  const handleExitFocus = () => {
    setFocusedColumn(null);
    setViewMode(isMixedGenerated ? 'withMix' : 'compare');
  };

  const handleBackToCompare = () => {
    setViewMode('compare');
    setIsMixedGenerated(false);
  };

  const handleAdoptGemini = () => {
    toast.success('Geminiの台本を採用しました');
  };

  const handleAdoptClaude = () => {
    toast.success('Claudeの台本を採用しました');
  };

  const handleAdoptMixed = () => {
    toast.success('AIミックス版の台本を採用しました');
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

  if (activeTab === 'script') {
    // フォーカスモード（1カラム拡大）
    if (viewMode === 'focus' && focusedColumn) {
      const focusData = {
        gemini: { sections: geminiSections, setSections: setGeminiSections, title: '【2025年版】Python入門完全ガイド', onAdopt: handleAdoptGemini, onRewrite: handleRewriteGemini },
        claude: { sections: claudeSections, setSections: setClaudeSections, title: 'まだExcelで消耗してるの？Pythonで自動化しよう', onAdopt: handleAdoptClaude, onRewrite: handleRewriteClaude },
        mixed: { sections: mixedSections, setSections: setMixedSections, title: 'Python入門×自動化で始める効率化ライフ', onAdopt: handleAdoptMixed, onRewrite: handleRewriteMixed },
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
            <div
              className="flex-1 max-w-4xl mx-auto w-full min-h-0"
              onDoubleClick={handleExitFocus}
            >
              <ScriptEditorColumn
                aiType={focusedColumn}
                title={focusData.title}
                sections={focusData.sections}
                onSectionsChange={focusData.setSections}
                onAdopt={focusData.onAdopt}
                onRewriteAll={focusData.onRewrite}
                isRecommended={focusedColumn === 'mixed'}
              />
            </div>
          </div>
        </div>
      );
    }

    // 通常表示（比較モード / ミックス込みモード）
    return (
      <div className="px-6 pb-4 h-[calc(100vh-5rem)]">
        <div className="h-full flex flex-col gap-3">
          {/* ヘッダーエリア */}
          <div className="flex items-center justify-between">
            {/* Input Area */}
            <div
              className={cn(
                'p-1.5 rounded-xl shadow-sm border flex gap-2 items-center flex-1 max-w-2xl transition-shadow focus-within:shadow-md',
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

            {/* モード切替・戻るボタン */}
            <div className="flex items-center gap-2 ml-4">
              {viewMode === 'withMix' && (
                <button
                  onClick={handleBackToCompare}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  <ArrowLeft size={12} /> 比較に戻る
                </button>
              )}
              <span className={cn('text-[10px]', themeClasses.textSecondary)}>
                ダブルクリックで拡大
              </span>
            </div>
          </div>

          {/* AI Comparison Columns */}
          <div className={cn(
            'flex-1 grid gap-4 min-h-0',
            viewMode === 'withMix' ? 'grid-cols-3' : 'grid-cols-2'
          )}>
            {/* Gemini */}
            <div onDoubleClick={() => handleColumnDoubleClick('gemini')} className="cursor-pointer min-h-0">
              <ScriptEditorColumn
                aiType="gemini"
                title="【2025年版】Python入門完全ガイド"
                sections={geminiSections}
                onSectionsChange={setGeminiSections}
                onAdopt={handleAdoptGemini}
                onRewriteAll={handleRewriteGemini}
              />
            </div>

            {/* Claude */}
            <div onDoubleClick={() => handleColumnDoubleClick('claude')} className="cursor-pointer min-h-0">
              <ScriptEditorColumn
                aiType="claude"
                title="まだExcelで消耗してるの？Pythonで自動化しよう"
                sections={claudeSections}
                onSectionsChange={setClaudeSections}
                onAdopt={handleAdoptClaude}
                onRewriteAll={handleRewriteClaude}
              />
            </div>

            {/* ミックス生成ボタン or ミックス版 */}
            {viewMode === 'compare' ? (
              <div className="col-span-2 flex justify-center items-start pt-4">
                <button
                  onClick={handleGenerateMixed}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all transform active:scale-95"
                >
                  <Wand2 size={18} /> 両方の良いところをミックスして生成
                </button>
              </div>
            ) : (
              <div onDoubleClick={() => handleColumnDoubleClick('mixed')} className="cursor-pointer min-h-0">
                <ScriptEditorColumn
                  aiType="mixed"
                  title="Python入門×自動化で始める効率化ライフ"
                  sections={mixedSections}
                  onSectionsChange={setMixedSections}
                  onAdopt={handleAdoptMixed}
                  onRewriteAll={handleRewriteMixed}
                  isRecommended
                />
              </div>
            )}
          </div>
        </div>
      </div>
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
                  <Image size={48} className={isDarkMode ? 'text-slate-600' : 'text-slate-300'} />
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
