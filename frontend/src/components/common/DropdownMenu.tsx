import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, MoreVertical } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  trigger?: 'horizontal' | 'vertical';
  className?: string;
  align?: 'left' | 'right';
}

export const DropdownMenu = ({
  items,
  trigger = 'horizontal',
  className,
  align = 'right',
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { mode } = useThemeStore();
  const isDarkMode = mode === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDarkMode
            ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
            : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
        )}
      >
        {trigger === 'horizontal' ? (
          <MoreHorizontal size={18} />
        ) : (
          <MoreVertical size={18} />
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[160px] rounded-xl shadow-lg border py-1',
            align === 'right' ? 'right-0' : 'left-0',
            isDarkMode
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200'
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-left',
                item.disabled && 'opacity-50 cursor-not-allowed',
                item.variant === 'danger'
                  ? isDarkMode
                    ? 'text-red-400 hover:bg-red-900/30'
                    : 'text-red-600 hover:bg-red-50'
                  : isDarkMode
                  ? 'text-slate-200 hover:bg-slate-700'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
