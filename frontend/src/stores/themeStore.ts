import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, ThemeClasses } from '../types';

interface ThemeState {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  getThemeClasses: () => ThemeClasses;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',

      toggleTheme: () => {
        set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' }));
      },

      setTheme: (mode: ThemeMode) => {
        set({ mode });
      },

      getThemeClasses: (): ThemeClasses => {
        const isDarkMode = get().mode === 'dark';
        return {
          bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
          text: isDarkMode ? 'text-slate-100' : 'text-slate-800',
          textPrimary: isDarkMode ? 'text-slate-100' : 'text-slate-800',
          textSecondary: isDarkMode ? 'text-slate-400' : 'text-slate-500',
          cardBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
          cardBorder: isDarkMode ? 'border-slate-800' : 'border-slate-100',
          inputBg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
          sidebarBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
          sidebarBorder: isDarkMode ? 'border-slate-800' : 'border-slate-100',
          headerBg: isDarkMode ? 'bg-slate-900/80' : 'bg-white/80',
          headerBorder: isDarkMode ? 'border-slate-800/50' : 'border-slate-100/50',
          hoverBg: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
          activeNavBg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50',
          activeNavText: isDarkMode ? 'text-blue-400' : 'text-blue-700',
          scrollbar: isDarkMode ? 'scrollbar-thumb-slate-700' : 'scrollbar-thumb-slate-200',
        };
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
