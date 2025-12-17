import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useThemeStore.getState();
    store.setTheme('light');
  });

  it('should have light mode as default', () => {
    const { mode } = useThemeStore.getState();
    expect(mode).toBe('light');
  });

  it('should toggle theme from light to dark', () => {
    const store = useThemeStore.getState();
    store.toggleTheme();

    const { mode } = useThemeStore.getState();
    expect(mode).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    const store = useThemeStore.getState();
    store.setTheme('dark');
    store.toggleTheme();

    const { mode } = useThemeStore.getState();
    expect(mode).toBe('light');
  });

  it('should set theme to dark', () => {
    const store = useThemeStore.getState();
    store.setTheme('dark');

    const { mode } = useThemeStore.getState();
    expect(mode).toBe('dark');
  });

  it('should set theme to light', () => {
    const store = useThemeStore.getState();
    store.setTheme('dark');
    store.setTheme('light');

    const { mode } = useThemeStore.getState();
    expect(mode).toBe('light');
  });

  describe('getThemeClasses', () => {
    it('should return light theme classes when mode is light', () => {
      const store = useThemeStore.getState();
      store.setTheme('light');

      const classes = store.getThemeClasses();

      expect(classes.bg).toBe('bg-slate-50');
      expect(classes.text).toBe('text-slate-800');
      expect(classes.cardBg).toBe('bg-white');
      expect(classes.sidebarBg).toBe('bg-white');
    });

    it('should return dark theme classes when mode is dark', () => {
      const store = useThemeStore.getState();
      store.setTheme('dark');

      const classes = store.getThemeClasses();

      expect(classes.bg).toBe('bg-slate-950');
      expect(classes.text).toBe('text-slate-100');
      expect(classes.cardBg).toBe('bg-slate-900');
      expect(classes.sidebarBg).toBe('bg-slate-900');
    });

    it('should return consistent theme classes', () => {
      const store = useThemeStore.getState();

      const lightClasses = store.getThemeClasses();
      store.setTheme('dark');
      const darkClasses = store.getThemeClasses();

      expect(lightClasses).not.toEqual(darkClasses);
      expect(Object.keys(lightClasses)).toEqual(Object.keys(darkClasses));
    });

    it('should include all required theme class keys', () => {
      const store = useThemeStore.getState();
      const classes = store.getThemeClasses();

      const requiredKeys = [
        'bg',
        'text',
        'textSecondary',
        'cardBg',
        'cardBorder',
        'inputBg',
        'sidebarBg',
        'sidebarBorder',
        'headerBg',
        'headerBorder',
        'hoverBg',
        'activeNavBg',
        'activeNavText',
        'scrollbar',
      ];

      requiredKeys.forEach((key) => {
        expect(classes).toHaveProperty(key);
      });
    });
  });
});
