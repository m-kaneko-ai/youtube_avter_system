import { Search, Bell, Command } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';

export const Header = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const { user } = useAuthStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  return (
    <header
      className={cn(
        'h-20 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8 border-b transition-colors duration-300',
        themeClasses.headerBg,
        themeClasses.headerBorder
      )}
    >
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block group">
          <Search
            size={18}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors',
              themeClasses.textSecondary
            )}
          />
          <input
            type="text"
            placeholder="プロジェクト、素材、アイデアを検索..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500/50 transition-all outline-none placeholder:text-slate-400',
              isDarkMode
                ? 'bg-slate-800 text-slate-200 focus:bg-slate-700'
                : 'bg-slate-100 text-slate-700 focus:bg-white'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:flex items-center gap-1">
            <span
              className={cn(
                'text-[10px] border px-1.5 py-0.5 rounded',
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              )}
            >
              <Command size={10} className="inline" /> K
            </span>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button
          className={cn(
            'relative p-2 transition-colors rounded-full',
            isDarkMode
              ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
              : 'text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50'
          )}
        >
          <Bell size={20} />
          <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-transparent"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div
              className={cn(
                'text-sm font-bold transition-colors',
                isDarkMode
                  ? 'text-slate-200 group-hover:text-blue-400'
                  : 'text-slate-700 group-hover:text-blue-600'
              )}
            >
              {user?.name || 'Guest'}
            </div>
            <div className="text-xs text-slate-500">
              {user?.role === 'owner' ? 'System Owner' :
               user?.role === 'team' ? 'Team Member' :
               user?.role === 'client_premium_plus' ? 'Premium+ Client' :
               user?.role === 'client_premium' ? 'Premium Client' :
               'Basic Client'}
            </div>
          </div>
          <div
            className={cn(
              'w-10 h-10 rounded-full border-2 shadow-sm overflow-hidden flex items-center justify-center',
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
              <span className={cn('text-sm font-bold', themeClasses.text)}>
                {user?.name?.charAt(0).toUpperCase() || 'G'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
