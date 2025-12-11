import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigationStore } from '../../stores/navigationStore';
import type { PageDefinition } from '../../types';

interface TabNavigationProps {
  page: PageDefinition;
}

export const TabNavigation = ({ page }: TabNavigationProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const { getActiveTab, setActiveTab } = useNavigationStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const activeTab = getActiveTab(page.id);

  return (
    <div className="px-8 pt-8 pb-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className={cn('text-2xl font-bold mb-1', themeClasses.text)}>
            {page.name}
          </h2>
          <p className={cn('text-sm', themeClasses.textSecondary)}>
            {page.description}
          </p>
        </div>
        <div
          className={cn(
            'flex p-1 rounded-xl',
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
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
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
      </div>
    </div>
  );
};
