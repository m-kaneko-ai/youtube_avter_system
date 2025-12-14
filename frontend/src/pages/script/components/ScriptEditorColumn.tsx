import { useState } from 'react';
import { Sparkles, MessageCircle, Wand2, Edit3, Check, X, RefreshCw } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { toast } from '../../../components/common';

// セクションの型定義
export interface ScriptSection {
  id: string;
  label: string;
  timestamp: string;
  content: string;
}

interface ScriptEditorColumnProps {
  aiType: 'gemini' | 'claude' | 'mixed';
  title: string;
  sections: ScriptSection[];
  onSectionsChange: (sections: ScriptSection[]) => void;
  onAdopt: () => void;
  onRewriteAll: () => void;
  isRecommended?: boolean;
}

export const ScriptEditorColumn = ({
  aiType,
  title,
  sections,
  onSectionsChange,
  onAdopt,
  onRewriteAll,
  isRecommended = false,
}: ScriptEditorColumnProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  // 編集中のセクションID
  const [editingId, setEditingId] = useState<string | null>(null);
  // 編集中の一時的な内容
  const [editContent, setEditContent] = useState<string>('');
  // タイトル編集
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const isGemini = aiType === 'gemini';
  const isMixed = aiType === 'mixed';
  const accentColor = isGemini ? 'blue' : isMixed ? 'purple' : 'orange';

  // セクション編集開始
  const handleStartEdit = (section: ScriptSection) => {
    setEditingId(section.id);
    setEditContent(section.content);
  };

  // セクション編集保存
  const handleSaveEdit = (sectionId: string) => {
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, content: editContent } : s
    );
    onSectionsChange(updatedSections);
    setEditingId(null);
    setEditContent('');
    toast.success('セクションを保存しました');
  };

  // セクション編集キャンセル
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // セクションのAI再生成
  const handleRewriteSection = (_sectionId: string) => {
    toast.info(`${isGemini ? 'Gemini' : 'Claude'}でセクションを再生成中...`);
    // 実際のAPI呼び出しはここに実装（_sectionIdを使用）
  };

  // タイトル保存
  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    toast.success('タイトルを保存しました');
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl shadow-sm border overflow-hidden transition-colors',
        themeClasses.cardBg,
        themeClasses.cardBorder,
        isGemini ? 'hover:border-blue-500/50' : isMixed ? 'hover:border-purple-500/50' : 'hover:border-orange-500/50'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'px-3 py-2.5 border-b flex justify-between items-center',
          isGemini
            ? isDarkMode
              ? 'bg-blue-900/10 border-blue-900/20'
              : 'bg-gradient-to-r from-blue-50 to-white border-blue-50'
            : isMixed
            ? isDarkMode
              ? 'bg-purple-900/10 border-purple-900/20'
              : 'bg-gradient-to-r from-purple-50 to-white border-purple-50'
            : isDarkMode
            ? 'bg-orange-900/10 border-orange-900/20'
            : 'bg-gradient-to-r from-orange-50 to-white border-orange-50'
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center',
              isGemini
                ? cn('text-blue-500', isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100')
                : isMixed
                ? cn('text-purple-500', isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100')
                : cn('text-orange-500', isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100')
            )}
          >
            {isGemini ? <Sparkles size={14} /> : isMixed ? <Wand2 size={14} /> : <MessageCircle size={14} />}
          </div>
          <div>
            <span className={cn('font-bold block text-xs', themeClasses.text)}>
              {isGemini ? 'Gemini 1.5 Pro' : isMixed ? 'AIミックス' : 'Claude 3.5 Sonnet'}
            </span>
            <span className={cn('text-[9px]', themeClasses.textSecondary)}>
              {isGemini ? '論理的・構造的' : isMixed ? '両方の良いとこ取り' : 'ストーリーテリング'}
            </span>
          </div>
        </div>
        {isRecommended && (
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-bold border',
              isMixed
                ? 'text-purple-500 bg-purple-500/10 border-purple-500/20'
                : `text-${accentColor}-500 bg-${accentColor}-500/10 border-${accentColor}-500/20`
            )}
          >
            {isMixed ? '✨ おすすめ' : 'Recommended'}
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 px-5 py-4 overflow-y-auto text-sm leading-relaxed scrollbar-thin',
          themeClasses.scrollbar,
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        )}
      >
        {/* Title */}
        <div className="mb-4 group">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={cn(
                  'flex-1 font-bold text-xl px-2 py-1 rounded-lg border',
                  themeClasses.text,
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200'
                )}
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => {
                  setIsEditingTitle(false);
                  setEditTitle(title);
                }}
                className={cn(
                  'p-1.5 rounded-lg',
                  isDarkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className={cn('font-bold text-xl', themeClasses.text)}>{editTitle}</h3>
              <button
                onClick={() => setIsEditingTitle(true)}
                className={cn(
                  'opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-opacity',
                  isDarkMode
                    ? 'hover:bg-slate-800 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-400'
                )}
              >
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className={cn(
                'group relative pl-3 border-l-2 transition-colors',
                isGemini
                  ? isDarkMode
                    ? 'border-blue-900'
                    : 'border-blue-100'
                  : isMixed
                  ? isDarkMode
                    ? 'border-purple-900'
                    : 'border-purple-100'
                  : isDarkMode
                  ? 'border-orange-900'
                  : 'border-orange-100'
              )}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-1">
                <p
                  className={cn(
                    'text-[11px] font-bold',
                    isGemini ? 'text-blue-500' : isMixed ? 'text-purple-500' : 'text-orange-500'
                  )}
                >
                  {section.label} ({section.timestamp})
                </p>
                {editingId !== section.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(section)}
                      className={cn(
                        'p-1 rounded transition-colors',
                        isDarkMode
                          ? 'hover:bg-slate-800 text-slate-400'
                          : 'hover:bg-slate-100 text-slate-400'
                      )}
                      title="編集"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleRewriteSection(section.id)}
                      className={cn(
                        'p-1 rounded transition-colors',
                        isDarkMode
                          ? 'hover:bg-slate-800 text-slate-400'
                          : 'hover:bg-slate-100 text-slate-400'
                      )}
                      title="AIで再生成"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Section Content */}
              {editingId === section.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border text-sm resize-none min-h-[100px]',
                      themeClasses.text,
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 focus:border-slate-600'
                        : 'bg-white border-slate-200 focus:border-slate-300'
                    )}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg transition-colors',
                        isDarkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleSaveEdit(section.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <p className="cursor-text" onClick={() => handleStartEdit(section)}>
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className={cn(
          'px-3 py-2 border-t flex justify-end gap-2 backdrop-blur-sm',
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white/50'
        )}
      >
        <button
          onClick={onRewriteAll}
          className={cn(
            'px-3 py-1.5 text-xs rounded-lg transition-colors',
            isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
          )}
        >
          書き直し
        </button>
        <button
          onClick={onAdopt}
          className={cn(
            'px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-md transition-all',
            isGemini
              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              : isMixed
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/20'
              : isDarkMode
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-slate-900 hover:bg-slate-800'
          )}
        >
          これを採用
        </button>
      </div>
    </div>
  );
};
