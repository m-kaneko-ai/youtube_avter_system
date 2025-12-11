import {
  Film,
  CheckCircle,
  Send,
  Sparkles,
  FileText,
  Image,
  Search,
  Video,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigationStore } from '../../stores/navigationStore';

export const DashboardPage = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const { getActiveTab } = useNavigationStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const activeTab = getActiveTab('dashboard');

  if (activeTab === 'tasks') {
    return (
      <div className={cn('text-center py-20 px-8', themeClasses.textSecondary)}>
        今日のタスクリストを表示
      </div>
    );
  }

  if (activeTab === 'notifications') {
    return (
      <div className={cn('text-center py-20 px-8', themeClasses.textSecondary)}>
        通知一覧を表示
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 animate-fade-in">
      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 今月の制作本数 */}
          <div
            className={cn(
              'group rounded-3xl p-6 shadow-sm border transition-all duration-300 relative overflow-hidden',
              themeClasses.cardBg,
              themeClasses.cardBorder,
              'hover:border-blue-500/30 hover:shadow-xl'
            )}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Film
                size={120}
                className="text-blue-600 transform rotate-12 translate-x-4 -translate-y-4"
              />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300',
                    isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                  )}
                >
                  <Film size={24} />
                </div>
                <span className="bg-green-500/10 text-green-500 text-xs font-bold px-2 py-1 rounded-full border border-green-500/20">
                  +12%
                </span>
              </div>
              <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                今月の制作本数
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className={cn('text-4xl font-bold tracking-tight', themeClasses.text)}>
                  45
                </h3>
                <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                  / 120本
                </span>
              </div>
              <div
                className={cn(
                  'mt-4 w-full h-2 rounded-full overflow-hidden',
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                )}
              >
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[37.5%] rounded-full"></div>
              </div>
            </div>
          </div>

          {/* 承認待ち案件 */}
          <div
            className={cn(
              'group rounded-3xl p-6 shadow-sm border transition-all duration-300 relative overflow-hidden',
              themeClasses.cardBg,
              themeClasses.cardBorder,
              'hover:border-orange-500/30 hover:shadow-xl'
            )}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle
                size={120}
                className="text-orange-500 transform rotate-12 translate-x-4 -translate-y-4"
              />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-300',
                    isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'
                  )}
                >
                  <CheckCircle size={24} />
                </div>
              </div>
              <p className={cn('text-sm font-medium mb-1', themeClasses.textSecondary)}>
                承認待ち案件
              </p>
              <h3 className={cn('text-4xl font-bold tracking-tight', themeClasses.text)}>
                3{' '}
                <span className={cn('text-lg font-normal', themeClasses.textSecondary)}>
                  件
                </span>
              </h3>
              <div className="flex -space-x-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 shadow-sm overflow-hidden flex items-center justify-center',
                      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'
                    )}
                  >
                    <span className="text-xs font-bold text-slate-500">U{i}</span>
                  </div>
                ))}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold',
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-400'
                      : 'bg-slate-100 border-white text-slate-500'
                  )}
                >
                  +
                </div>
              </div>
            </div>
          </div>

          {/* 本日の投稿予定 */}
          <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden text-white border border-slate-700">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Send
                size={120}
                className="text-white transform rotate-12 translate-x-4 -translate-y-4"
              />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  <Send size={24} />
                </div>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  Today
                </span>
              </div>
              <p className="text-slate-300 text-sm font-medium mb-1">本日の投稿予定</p>
              <h3 className="text-4xl font-bold text-white tracking-tight">
                4 <span className="text-lg text-slate-400 font-normal">本</span>
              </h3>
              <div className="mt-4 flex gap-2">
                {['18:00', '19:00', '20:00'].map((time, i) => (
                  <span
                    key={i}
                    className="text-xs bg-white/10 px-2 py-1 rounded-md text-slate-200 border border-white/5"
                  >
                    {time}
                  </span>
                ))}
                <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-slate-200 border border-white/5">
                  +1
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Insights */}
          <div
            className={cn(
              'lg:col-span-2 rounded-3xl p-8 shadow-sm border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={cn(
                  'font-bold text-xl flex items-center gap-2',
                  themeClasses.text
                )}
              >
                <Sparkles size={20} className="text-yellow-500" />
                今週のトレンドインサイト
              </h3>
              <button className="text-sm text-blue-500 font-medium hover:underline">
                すべて見る
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  title: 'AIプログラミング教育の需要急増',
                  tag: 'Tech',
                  views: '1.2M',
                  growth: '+45%',
                },
                {
                  title: 'Notionカレンダー活用術',
                  tag: 'Productivity',
                  views: '850K',
                  growth: '+32%',
                },
                {
                  title: '朝のルーティン vlog 2025冬',
                  tag: 'Lifestyle',
                  views: '2.1M',
                  growth: '+120%',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'group flex items-center p-4 rounded-2xl border border-transparent transition-all cursor-pointer',
                    isDarkMode
                      ? 'hover:bg-slate-800 hover:border-slate-700'
                      : 'hover:bg-slate-50 hover:border-slate-100'
                  )}
                >
                  <div className="font-bold text-2xl text-slate-200/20 mr-6 group-hover:text-blue-500 transition-colors w-6 text-center">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4
                      className={cn(
                        'font-bold transition-colors mb-1',
                        themeClasses.text,
                        'group-hover:text-blue-500'
                      )}
                    >
                      {item.title}
                    </h4>
                    <div
                      className={cn(
                        'flex items-center gap-3 text-xs',
                        themeClasses.textSecondary
                      )}
                    >
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded',
                          isDarkMode
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {item.tag}
                      </span>
                      <span>{item.views} views</span>
                    </div>
                  </div>
                  <div className="text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full text-sm border border-green-500/20">
                    {item.growth}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className={cn(
              'rounded-3xl p-8 shadow-sm border flex flex-col',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <h3 className={cn('font-bold text-xl mb-6', themeClasses.text)}>
              クイックアクション
            </h3>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-105',
                  isDarkMode
                    ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                )}
              >
                <FileText size={28} />
                <span className="font-bold text-sm">台本作成</span>
              </button>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-105',
                  isDarkMode
                    ? 'bg-purple-900/20 text-purple-400 hover:bg-purple-900/30'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                )}
              >
                <Image size={28} />
                <span className="font-bold text-sm">サムネ生成</span>
              </button>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-105',
                  isDarkMode
                    ? 'bg-orange-900/20 text-orange-400 hover:bg-orange-900/30'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                )}
              >
                <Search size={28} />
                <span className="font-bold text-sm">リサーチ</span>
              </button>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-105',
                  isDarkMode
                    ? 'bg-pink-900/20 text-pink-400 hover:bg-pink-900/30'
                    : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                )}
              >
                <Video size={28} />
                <span className="font-bold text-sm">編集依頼</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
