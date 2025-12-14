import { Plus, LogOut, Sun, Moon, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { PAGES, PAGE_ICONS } from '../../constants/pages';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme, getThemeClasses } = useThemeStore();
  const { logout } = useAuthStore();
  const { setActiveTab, sidebarCollapsed, toggleSidebar } = useNavigationStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full border-r z-20 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        themeClasses.sidebarBg,
        themeClasses.sidebarBorder
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3', sidebarCollapsed ? 'p-3 justify-center' : 'p-6')}>
        <div className={cn(
          'bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20',
          'w-10 h-10'
        )}>
          <Sparkles size={sidebarCollapsed ? 20 : 24} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <h1
              className={cn(
                'font-bold text-lg tracking-tight leading-none',
                themeClasses.text
              )}
            >
              Creator
              <br />
              <span className="text-blue-500">Studio</span>
            </h1>
          </div>
        )}
      </div>

      {/* New Project Button */}
      <div className={cn(sidebarCollapsed ? 'px-2 mb-4' : 'px-4 mb-4')}>
        <button
          className={cn(
            'w-full rounded-xl flex items-center justify-center transition-all shadow-md hover:shadow-lg group',
            sidebarCollapsed ? 'p-2.5' : 'p-2.5 gap-2',
            'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
          )}
          title={sidebarCollapsed ? '新規プロジェクト' : undefined}
        >
          <Plus
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
          {!sidebarCollapsed && <span className="font-medium text-sm">新規プロジェクト</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto space-y-1', sidebarCollapsed ? 'px-2' : 'px-3')}>
        {PAGES.map((page) => {
          const isActive = location.pathname === page.path;
          return (
            <button
              key={page.id}
              onClick={() => {
                if (page.tabs[0]) {
                  setActiveTab(page.id, page.tabs[0].id);
                }
                navigate(page.path);
              }}
              className={cn(
                'w-full flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden',
                sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? cn(themeClasses.activeNavBg, themeClasses.activeNavText, 'shadow-sm')
                  : cn(themeClasses.textSecondary, themeClasses.hoverBg)
              )}
              title={sidebarCollapsed ? page.name : undefined}
            >
              <div
                className={cn(
                  'transition-colors flex-shrink-0',
                  isActive
                    ? isDarkMode
                      ? 'text-blue-400'
                      : 'text-blue-600'
                    : isDarkMode
                    ? 'text-slate-500 group-hover:text-slate-300'
                    : 'text-slate-400 group-hover:text-slate-600'
                )}
              >
                {PAGE_ICONS[page.id]}
              </div>
              {!sidebarCollapsed && (
                <span
                  className={cn(
                    'text-sm font-medium truncate',
                    isActive
                      ? isDarkMode
                        ? 'text-blue-400'
                        : 'text-blue-700'
                      : isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  )}
                >
                  {page.name}
                </span>
              )}
              {isActive && !sidebarCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-l-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Credit Card - 折りたたみ時は非表示 */}
      {!sidebarCollapsed && (
        <div
          className="px-3 py-3 border-t transition-colors duration-300"
          style={{ borderColor: isDarkMode ? '#1e293b' : '#f1f5f9' }}
        >
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 text-white relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles size={30} />
            </div>
            <p className="text-[10px] font-medium text-indigo-100 mb-0.5">Pro Plan</p>
            <p className="text-xs font-bold mb-2">AIクレジット残高</p>
            <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden">
              <div className="bg-white h-full w-[75%]"></div>
            </div>
            <p className="text-[9px] mt-1.5 text-indigo-100 text-right">
              あと 250 生成可能
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={cn(
        'border-t transition-colors duration-300 flex items-center',
        sidebarCollapsed ? 'flex-col gap-2 p-2' : 'justify-between gap-2 p-3',
      )}
        style={{ borderColor: isDarkMode ? '#1e293b' : '#f1f5f9' }}
      >
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isDarkMode
              ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          )}
          title={isDarkMode ? 'ライトモード' : 'ダークモード'}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {!sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 text-xs px-3 py-2 transition-colors rounded-lg',
              themeClasses.textSecondary,
              themeClasses.hoverBg
            )}
          >
            <LogOut size={14} /> ログアウト
          </button>
        )}

        {sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className={cn(
              'p-2 rounded-lg transition-colors',
              themeClasses.textSecondary,
              themeClasses.hoverBg
            )}
            title="ログアウト"
          >
            <LogOut size={16} />
          </button>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isDarkMode
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          )}
          title={sidebarCollapsed ? '展開' : '折りたたむ'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
};
