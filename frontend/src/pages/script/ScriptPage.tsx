import { Lightbulb, Sparkles, MessageCircle, Image, Edit3, Share2, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigationStore } from '../../stores/navigationStore';

export const ScriptPage = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const { getActiveTab } = useNavigationStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const activeTab = getActiveTab('script');

  if (activeTab === 'script') {
    return (
      <div className="px-8 pb-8 h-[calc(100vh-11rem)]">
        <div className="h-full flex flex-col gap-6">
          {/* Input Area */}
          <div
            className={cn(
              'p-2 rounded-2xl shadow-sm border flex gap-2 items-center max-w-4xl mx-auto w-full transition-shadow focus-within:shadow-md ring-4',
              themeClasses.cardBg,
              themeClasses.cardBorder,
              isDarkMode ? 'ring-slate-800' : 'ring-slate-50/50'
            )}
          >
            <div className={cn('pl-4', themeClasses.textSecondary)}>
              <Lightbulb size={20} />
            </div>
            <input
              type="text"
              placeholder="どんな動画を作りたいですか？（例：30代向けの資産形成入門、楽しく学べるPython講座...）"
              className={cn(
                'flex-1 bg-transparent border-none py-3 text-base focus:ring-0 placeholder:text-slate-400',
                themeClasses.text
              )}
            />
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform active:scale-95">
              <Sparkles size={16} /> アイデアを生成
            </button>
          </div>

          {/* AI Comparison Columns */}
          <div className="flex-1 grid grid-cols-2 gap-8 min-h-0">
            {/* Gemini Column */}
            <div
              className={cn(
                'flex flex-col rounded-3xl shadow-sm border overflow-hidden group transition-colors',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                'hover:border-blue-500/50'
              )}
            >
              <div
                className={cn(
                  'p-4 border-b flex justify-between items-center',
                  isDarkMode
                    ? 'bg-blue-900/10 border-blue-900/20'
                    : 'bg-gradient-to-r from-blue-50 to-white border-blue-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-blue-500',
                      isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                    )}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className={cn('font-bold block text-sm', themeClasses.text)}>
                      Gemini 1.5 Pro
                    </span>
                    <span className={cn('text-[10px]', themeClasses.textSecondary)}>
                      論理的・構造的アプローチ
                    </span>
                  </div>
                </div>
                <span className="text-xs text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full font-bold border border-blue-500/20">
                  Recommended
                </span>
              </div>
              <div
                className={cn(
                  'flex-1 p-6 overflow-y-auto text-sm leading-relaxed scrollbar-thin',
                  themeClasses.scrollbar,
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                <h3 className={cn('font-bold text-xl mb-4', themeClasses.text)}>
                  【2025年版】Python入門完全ガイド
                </h3>
                <div className="space-y-6">
                  <div className={cn('pl-4 border-l-2', isDarkMode ? 'border-blue-900' : 'border-blue-100')}>
                    <p className="text-xs font-bold text-blue-500 mb-1">導入 (0:00-0:30)</p>
                    <p>
                      プログラミングを始めたいあなたへ。なぜPythonが選ばれるのか、その3つの理由を解説します。
                    </p>
                  </div>
                  <div className={cn('pl-4 border-l-2', isDarkMode ? 'border-blue-900' : 'border-blue-100')}>
                    <p className="text-xs font-bold text-blue-500 mb-1">理由1：読みやすさ (0:30-1:30)</p>
                    <p>
                      Pythonの最大の特徴は、英語を読むようにコードが読めることです。例えば...
                    </p>
                  </div>
                  <div
                    className={cn(
                      'p-4 rounded-xl italic text-xs',
                      isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-500'
                    )}
                  >
                    ... 続きを生成中
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'p-4 border-t flex justify-end gap-3 backdrop-blur-sm',
                  isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white/50'
                )}
              >
                <button
                  className={cn(
                    'px-4 py-2 text-sm rounded-lg transition-colors',
                    isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  書き直し
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
                  これを採用
                </button>
              </div>
            </div>

            {/* Claude Column */}
            <div
              className={cn(
                'flex flex-col rounded-3xl shadow-sm border overflow-hidden group transition-colors',
                themeClasses.cardBg,
                themeClasses.cardBorder,
                'hover:border-orange-500/50'
              )}
            >
              <div
                className={cn(
                  'p-4 border-b flex justify-between items-center',
                  isDarkMode
                    ? 'bg-orange-900/10 border-orange-900/20'
                    : 'bg-gradient-to-r from-orange-50 to-white border-orange-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-orange-500',
                      isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                    )}
                  >
                    <MessageCircle size={16} />
                  </div>
                  <div>
                    <span className={cn('font-bold block text-sm', themeClasses.text)}>
                      Claude 3.5 Sonnet
                    </span>
                    <span className={cn('text-[10px]', themeClasses.textSecondary)}>
                      自然的・ストーリーテリング
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'flex-1 p-6 overflow-y-auto text-sm leading-relaxed scrollbar-thin',
                  themeClasses.scrollbar,
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                <h3 className={cn('font-bold text-xl mb-4', themeClasses.text)}>
                  まだExcelで消耗してるの？Pythonで自動化しよう
                </h3>
                <div className="space-y-6">
                  <div className={cn('pl-4 border-l-2', isDarkMode ? 'border-orange-900' : 'border-orange-100')}>
                    <p className="text-xs font-bold text-orange-500 mb-1">導入 (0:00-0:30)</p>
                    <p>
                      毎日のルーチンワーク、退屈じゃありませんか？実はPythonを使えば、その作業、1クリックで終わります。
                    </p>
                  </div>
                  <div className={cn('pl-4 border-l-2', isDarkMode ? 'border-orange-900' : 'border-orange-100')}>
                    <p className="text-xs font-bold text-orange-500 mb-1">自動化の実例 (0:30-1:30)</p>
                    <p>
                      想像してみてください。朝出社してコーヒーを飲んでいる間に、昨日売上の集計が終わっている世界を...
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'p-4 border-t flex justify-end gap-3 backdrop-blur-sm',
                  isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white/50'
                )}
              >
                <button
                  className={cn(
                    'px-4 py-2 text-sm rounded-lg transition-colors',
                    isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  書き直し
                </button>
                <button
                  className={cn(
                    'px-6 py-2 text-white text-sm font-bold rounded-lg shadow-lg transition-all',
                    isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-900 hover:bg-slate-800'
                  )}
                >
                  これを採用
                </button>
              </div>
            </div>
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
                  <button className="text-white hover:text-blue-300 transition-colors">
                    <Edit3 size={18} />
                  </button>
                  <button className="text-white hover:text-blue-300 transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
                <div
                  className={cn(
                    'absolute top-3 right-3 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full shadow-sm',
                    isDarkMode ? 'bg-black/50 text-slate-200' : 'bg-white/90 text-slate-700'
                  )}
                >
                  Imagen 3
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
                  <button className="text-blue-500 font-bold text-sm hover:underline">選択する</button>
                </div>
              </div>
            </div>
          ))}
          <div
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

  // Default placeholder for other tabs
  return (
    <div className={cn('text-center py-20 px-8', themeClasses.textSecondary)}>
      {activeTab === 'title' && 'タイトル選定機能'}
      {activeTab === 'seo' && 'SEO設定機能'}
    </div>
  );
};
