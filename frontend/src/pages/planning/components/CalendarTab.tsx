import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { cn } from '../../../utils/cn';
import { planningService } from '../../../services/planning';
import type { CalendarView, CalendarEvent } from '../../../types';

export const CalendarTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [view, setView] = useState<CalendarView>('month');
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(12);

  // API: GET /api/v1/planning/calendar
  const {
    data: calendarData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['planning', 'calendar', currentYear, currentMonth],
    queryFn: () => planningService.getCalendar(currentYear, currentMonth),
  });

  // API: GET /api/v1/planning/stats
  const { data: statsData } = useQuery({
    queryKey: ['planning', 'stats'],
    queryFn: () => planningService.getStats(),
  });

  const events = calendarData?.events ?? [];

  const getStatusStyle = (status: CalendarEvent['status']) => {
    if (isDarkMode) {
      switch (status) {
        case 'published':
          return 'bg-green-900/40 text-green-300';
        case 'production':
          return 'bg-yellow-900/40 text-yellow-300';
        case 'planning':
          return 'bg-blue-900/40 text-blue-300';
        case 'scheduled':
          return 'bg-slate-700 text-slate-300';
      }
    } else {
      switch (status) {
        case 'published':
          return 'bg-green-50 text-green-700';
        case 'production':
          return 'bg-yellow-50 text-yellow-700';
        case 'planning':
          return 'bg-blue-50 text-blue-700';
        case 'scheduled':
          return 'bg-slate-50 text-slate-500';
      }
    }
  };

  const getStatusLabel = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'published':
        return '公開済み';
      case 'production':
        return '制作中';
      case 'planning':
        return '企画中';
      case 'scheduled':
        return '予定';
    }
  };

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const days: (number | null)[] = [];

    // 前月の空白
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // 次月の空白（7の倍数にする）
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 0; i < remainingDays; i++) {
        days.push(null);
      }
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((event) => event.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth && today.getDate() === day;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  const calendarDays = generateCalendarDays();

  // 今月の目標進捗データ（統計APIから取得）
  const byStatus = statsData?.byStatus ?? {};
  const byType = statsData?.byType ?? {};
  const totalProjects = statsData?.totalProjects ?? 0;
  const completedCount = byStatus['published'] ?? 0;
  const shortCompleted = Math.round((byType['short'] ?? 0) * (completedCount / totalProjects) || 0);
  const longCompleted = Math.round((byType['long'] ?? 0) * (completedCount / totalProjects) || 0);

  const monthlyGoal = {
    total: 90,
    completed: completedCount,
    shortTotal: 70,
    shortCompleted,
    longTotal: 20,
    longCompleted,
  };

  const progress = monthlyGoal.total > 0 ? (monthlyGoal.completed / monthlyGoal.total) * 100 : 0;

  // エラー表示
  if (error) {
    return (
      <div className={cn('rounded-3xl shadow-sm border p-8', themeClasses.cardBg, themeClasses.cardBorder)}>
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle size={24} />
          <span>カレンダーデータの取得に失敗しました。再度お試しください。</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-3xl shadow-sm border p-8', themeClasses.cardBg, themeClasses.cardBorder)}>
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn('text-xl font-bold', themeClasses.text)}>{currentYear}年{currentMonth}月</h2>
        <div className="flex items-center gap-3">
          {/* 表示切り替え */}
          <div
            className={cn(
              'flex items-center gap-1 rounded-xl p-1',
              isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100/80'
            )}
          >
            <button
              onClick={() => setView('month')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                view === 'month'
                  ? isDarkMode
                    ? 'bg-slate-600 shadow-sm text-white'
                    : 'bg-white shadow-sm text-slate-800'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-800'
              )}
            >
              月表示
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                view === 'week'
                  ? isDarkMode
                    ? 'bg-slate-600 shadow-sm text-white'
                    : 'bg-white shadow-sm text-slate-800'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-800'
              )}
            >
              週表示
            </button>
          </div>

          {/* ナビゲーション */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                isDarkMode
                  ? 'text-slate-200 hover:bg-slate-700'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              今日
            </button>
            <button
              onClick={handleNextMonth}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="mb-6">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div
              key={day}
              className={cn('text-center text-sm font-medium py-2', themeClasses.textSecondary)}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : (
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className={cn(
                    'border rounded-xl p-3 min-h-28',
                    isDarkMode
                      ? 'border-slate-700 bg-slate-800/30'
                      : 'border-slate-100 bg-slate-50/50'
                  )}
                />
              );
            }

            const events = getEventsForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day}
                className={cn(
                  'border rounded-xl p-3 min-h-28 cursor-pointer transition-colors',
                  isTodayDate
                    ? isDarkMode
                      ? 'border-blue-500 bg-blue-900/20 hover:border-blue-400'
                      : 'border-blue-200 bg-blue-50 hover:border-blue-300'
                    : isDarkMode
                    ? 'border-slate-700 hover:border-slate-600'
                    : 'border-slate-100 hover:border-slate-200',
                  isDarkMode ? 'bg-slate-800/50' : 'bg-white'
                )}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-2',
                    isTodayDate
                      ? isDarkMode
                        ? 'text-blue-300'
                        : 'text-blue-700'
                      : isDarkMode
                      ? 'text-slate-200'
                      : 'text-slate-700'
                  )}
                >
                  {day} {isTodayDate && <span className="text-xs">今日</span>}
                </div>
                <div className="space-y-1">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'flex items-center gap-1 text-xs rounded px-2 py-1',
                        getStatusStyle(event.status)
                      )}
                    >
                      {event.videoType === 'short' ? '📹' : '🎬'}{' '}
                      <span className="truncate">{getStatusLabel(event.status)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* 目標進捗 */}
      <div
        className={cn(
          'rounded-2xl p-6',
          isDarkMode
            ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50'
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className={cn('font-semibold', themeClasses.text)}>今月の目標</h3>
          <span className={cn('text-2xl font-bold', themeClasses.text)}>
            {monthlyGoal.completed} / {monthlyGoal.total}本 ({Math.round(progress)}%)
          </span>
        </div>
        <div
          className={cn(
            'w-full rounded-full h-3',
            isDarkMode ? 'bg-slate-700/50' : 'bg-white/50'
          )}
        >
          <div
            className={cn(
              'h-3 rounded-full',
              isDarkMode
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={cn(
            'flex items-center justify-between mt-3 text-sm',
            themeClasses.textSecondary
          )}
        >
          <div>
            <span className="font-medium">📹 ショート:</span> {monthlyGoal.shortCompleted}/
            {monthlyGoal.shortTotal}本
          </div>
          <div>
            <span className="font-medium">🎬 長尺:</span> {monthlyGoal.longCompleted}/
            {monthlyGoal.longTotal}本
          </div>
        </div>
      </div>
    </div>
  );
};
