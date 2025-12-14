import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Youtube,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { publishService, type PublishStatus } from '../../../services/publish';
import { Modal, toast } from '../../../components/common';

type ScheduleStatus = PublishStatus;

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: '下書き', color: 'text-slate-500 bg-slate-500/10', icon: <Edit size={14} /> },
  scheduled: { label: '予約済み', color: 'text-blue-500 bg-blue-500/10', icon: <Clock size={14} /> },
  publishing: { label: '公開中', color: 'text-orange-500 bg-orange-500/10', icon: <Loader2 size={14} className="animate-spin" /> },
  published: { label: '公開済み', color: 'text-green-500 bg-green-500/10', icon: <CheckCircle2 size={14} /> },
  failed: { label: '失敗', color: 'text-red-500 bg-red-500/10', icon: <AlertCircle size={14} /> },
};

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export const SchedulerTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    scheduledDate: '',
    scheduledTime: '',
  });

  // Scheduled videos query
  const {
    data: schedulesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['publish', 'schedules'],
    queryFn: () => publishService.getSchedules(),
  });

  const videos = schedulesData?.schedules ?? [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getVideosForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return videos.filter((v) => v.scheduledAt.startsWith(dateStr));
  };

  const handleScheduleSubmit = () => {
    toast.success(`「${scheduleForm.title}」を${scheduleForm.scheduledDate} ${scheduleForm.scheduledTime}に予約しました`);
    setIsScheduleModalOpen(false);
    setScheduleForm({ title: '', scheduledDate: '', scheduledTime: '' });
  };

  const handleEditClick = (video: typeof videos[0]) => {
    setScheduleForm({
      title: video.title,
      scheduledDate: video.scheduledAt.split(' ')[0],
      scheduledTime: video.scheduledAt.split(' ')[1] || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    toast.success(`「${scheduleForm.title}」の予約を更新しました`);
    setIsEditModalOpen(false);
    setScheduleForm({ title: '', scheduledDate: '', scheduledTime: '' });
  };

  const handleDeleteClick = (video: typeof videos[0]) => {
    if (window.confirm(`「${video.title}」の予約を削除してもよろしいですか？`)) {
      toast.success(`「${video.title}」の予約を削除しました`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-red-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>スケジュールを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">スケジュールの読み込みに失敗しました</p>
      </div>
    );
  }

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className={cn('text-2xl font-bold', themeClasses.text)}>
            {year}年{month + 1}月
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
            >
              <ChevronLeft size={20} className={themeClasses.textSecondary} />
            </button>
            <button
              onClick={nextMonth}
              className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
            >
              <ChevronRight size={20} className={themeClasses.textSecondary} />
            </button>
            <button
              onClick={goToToday}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ml-2', isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
            >
              今日
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all"
        >
          <Plus size={16} />
          投稿をスケジュール
        </button>
      </div>

      {/* Calendar */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}>
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                'p-3 text-center text-sm font-medium',
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : themeClasses.textSecondary
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayVideos = day ? getVideosForDate(day) : [];
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSunday = index % 7 === 0;
            const isSaturday = index % 7 === 6;

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[120px] p-2 border-b border-r',
                  isDarkMode ? 'border-slate-800' : 'border-slate-100',
                  !day && (isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50')
                )}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                          isToday
                            ? 'bg-red-500 text-white'
                            : isSunday
                            ? 'text-red-500'
                            : isSaturday
                            ? 'text-blue-500'
                            : themeClasses.text
                        )}
                      >
                        {day}
                      </span>
                      {dayVideos.length > 0 && (
                        <span className={cn('text-xs', themeClasses.textSecondary)}>
                          {dayVideos.length}件
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayVideos.slice(0, 3).map((video) => (
                        <div
                          key={video.id}
                          className={cn(
                            'px-2 py-1 rounded text-xs truncate cursor-pointer transition-colors',
                            video.status === 'published'
                              ? isDarkMode
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-green-100 text-green-700'
                              : video.status === 'scheduled'
                              ? isDarkMode
                                ? 'bg-blue-900/30 text-blue-400'
                                : 'bg-blue-100 text-blue-700'
                              : isDarkMode
                              ? 'bg-slate-700 text-slate-400'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {video.scheduledAt.split(' ')[1]} {video.title}
                        </div>
                      ))}
                      {dayVideos.length > 3 && (
                        <div className={cn('text-xs pl-2', themeClasses.textSecondary)}>
                          +{dayVideos.length - 3}件
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming List */}
      <div>
        <h3 className={cn('font-bold text-lg mb-4', themeClasses.text)}>今後の投稿予定</h3>
        <div className="space-y-3">
          {videos
            .filter((v) => v.status === 'scheduled')
            .map((video) => (
              <div
                key={video.id}
                className={cn(
                  'p-4 rounded-2xl border flex items-center gap-4 transition-all hover:shadow-md',
                  themeClasses.cardBg,
                  themeClasses.cardBorder
                )}
              >
                {/* Thumbnail */}
                <div className={cn('w-24 h-14 rounded-lg flex items-center justify-center', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                  <Play size={20} className={themeClasses.textSecondary} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn('font-medium truncate', themeClasses.text)}>{video.title}</h4>
                  </div>
                  <div className={cn('flex items-center gap-3 text-sm', themeClasses.textSecondary)}>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {video.scheduledAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Youtube size={14} className="text-red-500" />
                      YouTube
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', STATUS_CONFIG[video.status].color)}>
                    {STATUS_CONFIG[video.status].icon}
                    {STATUS_CONFIG[video.status].label}
                  </span>
                  <button
                    onClick={() => handleEditClick(video)}
                    className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                  >
                    <Edit size={16} className={themeClasses.textSecondary} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(video)}
                    className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-500')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="投稿をスケジュール"
        size="md"
        footer={
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleScheduleSubmit}
              disabled={!scheduleForm.title || !scheduleForm.scheduledDate || !scheduleForm.scheduledTime}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              予約する
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              動画タイトル
            </label>
            <input
              type="text"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
              placeholder="動画のタイトルを入力"
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors',
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                日付
              </label>
              <input
                type="date"
                value={scheduleForm.scheduledDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border transition-colors',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                時刻
              </label>
              <input
                type="time"
                value={scheduleForm.scheduledTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border transition-colors',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                )}
              />
            </div>
          </div>
          <div className={cn('p-3 rounded-lg text-sm', isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700')}>
            <Info size={16} className="inline mr-2" />
            予約投稿は指定された日時に自動的に公開されます
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="予約を編集"
        size="md"
        footer={
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={!scheduleForm.title || !scheduleForm.scheduledDate || !scheduleForm.scheduledTime}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              更新する
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
              動画タイトル
            </label>
            <input
              type="text"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
              placeholder="動画のタイトルを入力"
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors',
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                日付
              </label>
              <input
                type="date"
                value={scheduleForm.scheduledDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border transition-colors',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>
                時刻
              </label>
              <input
                type="time"
                value={scheduleForm.scheduledTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border transition-colors',
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                )}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
