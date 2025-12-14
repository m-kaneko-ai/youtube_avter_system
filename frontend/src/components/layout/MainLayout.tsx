import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getPageByPath } from '../../constants/pages';

export const MainLayout = () => {
  const location = useLocation();
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const currentPage = getPageByPath(location.pathname);

  return (
    <div
      className={cn(
        'flex h-screen font-sans overflow-hidden selection:bg-blue-500 selection:text-white transition-colors duration-300',
        themeClasses.bg,
        themeClasses.text
      )}
    >
      <Sidebar />
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 backdrop-blur-3xl relative transition-colors duration-300',
          isDarkMode ? 'bg-slate-950/50' : 'bg-white/50'
        )}
      >
        {/* Background Gradients */}
        <div
          className={cn(
            'absolute top-0 left-0 w-full h-96 -z-10 pointer-events-none bg-gradient-to-b',
            isDarkMode ? 'from-blue-900/10 to-transparent' : 'from-blue-50/50 to-transparent'
          )}
        ></div>

        <Header page={currentPage} />
        <main
          className={cn(
            'flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent',
            themeClasses.scrollbar
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
