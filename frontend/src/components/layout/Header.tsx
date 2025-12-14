import { Search, Bell, Command } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useNavigationStore } from '../../stores/navigationStore';
import type { PageDefinition } from '../../types';

interface HeaderProps {
  page?: PageDefinition;
}

export const Header = ({ page }: HeaderProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const { user } = useAuthStore();
  const { getActiveTab, setActiveTab } = useNavigationStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const activeTab = page ? getActiveTab(page.id) : '';

  return (
    <header
      className={cn(
        'h-14 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 border-b transition-colors duration-300',
        themeClasses.headerBg,
        themeClasses.headerBorder
      )}
    >
      {/* Left Side: Page Title + Tabs */}
      <div className="flex items-center gap-6">
        {page && (
          <>
            <h2 className={cn('text-base font-bold whitespace-nowrap', themeClasses.text)}>
              {page.name}
            </h2>
            <div
              className={cn(
                'flex p-0.5 rounded-lg',
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100/80'
              )}
            >
              {page.tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(page.id, tab.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                      isActive
                        ? cn(
                            isDarkMode
                              ? 'bg-slate-700 text-white shadow-sm'
                              : 'bg-white text-slate-800 shadow-sm'
                          )
                        : cn(
                            isDarkMode
                              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                          )
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-sm hidden md:block group">
          <Search
            size={16}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors',
              themeClasses.textSecondary
            )}
          />
          <input
            type="text"
            placeholder="検索..."
            className={cn(
              'w-full pl-9 pr-4 py-1.5 border-none rounded-full text-xs focus:ring-2 focus:ring-blue-500/50 transition-all outline-none placeholder:text-slate-400',
              isDarkMode
                ? 'bg-slate-800 text-slate-200 focus:bg-slate-700'
                : 'bg-slate-100 text-slate-700 focus:bg-white'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:flex items-center gap-1">
            <span
              className={cn(
                'text-[10px] border px-1 py-0.5 rounded',
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              )}
            >
              <Command size={8} className="inline" /> K
            </span>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className={cn(
            'relative p-1.5 transition-colors rounded-full',
            isDarkMode
              ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
              : 'text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50'
          )}
        >
          <Bell size={18} />
          <span className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div
              className={cn(
                'text-xs font-bold transition-colors',
                isDarkMode
                  ? 'text-slate-200 group-hover:text-blue-400'
                  : 'text-slate-700 group-hover:text-blue-600'
              )}
            >
              {user?.name || 'Guest'}
            </div>
          </div>
          <div
            className={cn(
              'w-8 h-8 rounded-full border-2 shadow-sm overflow-hidden flex items-center justify-center',
              isDarkMode
                ? 'bg-slate-700 border-slate-600'
                : 'bg-slate-200 border-white'
            )}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={cn('text-xs font-bold', themeClasses.text)}>
                {user?.name?.charAt(0).toUpperCase() || 'G'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
