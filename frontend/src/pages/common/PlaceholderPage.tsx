import { Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  return (
    <div
      className={cn(
        'p-8 flex flex-col items-center justify-center h-[70vh]',
        themeClasses.textSecondary
      )}
    >
      <div
        className={cn(
          'w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm',
          isDarkMode ? 'bg-slate-800' : 'bg-slate-50'
        )}
      >
        <Sparkles
          size={40}
          className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}
        />
      </div>
      <h3 className={cn('text-2xl font-bold mb-2', themeClasses.text)}>{title}</h3>
      <p className="max-w-sm text-center">
        この機能は現在準備中です。最高のクリエイティブ体験をお届けするために開発を進めています。
      </p>
    </div>
  );
};
