import { Plus, LogOut, Sun, Moon, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { PAGES, PAGE_ICONS } from '../../constants/pages';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme, getThemeClasses } = useThemeStore();
  const { logout } = useAuthStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={cn(
        'w-72 flex flex-col h-full border-r z-20 transition-colors duration-300',
        themeClasses.sidebarBg,
        themeClasses.sidebarBorder
      )}
    >
      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles size={24} className="text-white" />
        </div>
        <div>
          <h1
            className={cn(
              'font-bold text-xl tracking-tight leading-none',
              themeClasses.text
            )}
          >
            Creator
            <br />
            <span className="text-blue-500">Studio</span>
          </h1>
        </div>
      </div>

      {/* New Project Button */}
      <div className="px-6 mb-6">
        <button
          className={cn(
            'w-full p-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg group',
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          )}
        >
          <Plus
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="font-medium">新規プロジェクト</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {PAGES.map((page) => {
          const isActive = location.pathname === page.path;
          return (
            <button
              key={page.id}
              onClick={() => navigate(page.path)}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? cn(themeClasses.activeNavBg, themeClasses.activeNavText, 'shadow-sm')
                  : cn(themeClasses.textSecondary, themeClasses.hoverBg)
              )}
            >
              <div
                className={cn(
                  'transition-colors',
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
              <div className="text-left">
                <span
                  className={cn(
                    'block text-sm font-semibold',
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
              </div>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Credit Card */}
      <div
        className="p-4 border-t mt-2 transition-colors duration-300"
        style={{ borderColor: isDarkMode ? '#1e293b' : '#f1f5f9' }}
      >
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={40} />
          </div>
          <p className="text-xs font-medium text-indigo-100 mb-1">Pro Plan</p>
          <p className="text-sm font-bold mb-3">AIクレジット残高</p>
          <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
            <div className="bg-white h-full w-[75%]"></div>
          </div>
          <p className="text-[10px] mt-2 text-indigo-100 text-right">
            あと 250 生成可能
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between gap-2">
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isDarkMode
              ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          )}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 text-sm w-full px-4 py-2 transition-colors rounded-lg',
            themeClasses.textSecondary,
            themeClasses.hoverBg
          )}
        >
          <LogOut size={16} /> <span className="text-xs">ログアウト</span>
        </button>
      </div>
    </div>
  );
};
