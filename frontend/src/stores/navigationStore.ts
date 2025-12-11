import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TabState } from '../types';
import { PAGES } from '../constants/pages';

interface NavigationState {
  currentPageId: string;
  tabState: TabState;
  setCurrentPage: (pageId: string) => void;
  setActiveTab: (pageId: string, tabId: string) => void;
  getActiveTab: (pageId: string) => string;
}

// 初期タブ状態を生成
const initialTabState: TabState = PAGES.reduce((acc, page) => {
  acc[page.id] = page.tabs[0]?.id || '';
  return acc;
}, {} as TabState);

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      currentPageId: 'dashboard',
      tabState: initialTabState,

      setCurrentPage: (pageId: string) => {
        set({ currentPageId: pageId });
      },

      setActiveTab: (pageId: string, tabId: string) => {
        set((state) => ({
          tabState: {
            ...state.tabState,
            [pageId]: tabId,
          },
        }));
      },

      getActiveTab: (pageId: string): string => {
        const state = get();
        return (
          state.tabState[pageId] ||
          PAGES.find((p) => p.id === pageId)?.tabs[0]?.id ||
          ''
        );
      },
    }),
    {
      name: 'navigation-storage',
    }
  )
);
