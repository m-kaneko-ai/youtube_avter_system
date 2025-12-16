import { useState, useRef } from 'react';
import {
  Trophy,
  FileText,
  Image,
  Edit3,
  Check,
  Video,
  Layers,
  Upload,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { toast } from '../../../components/common';
import type { RevisedScriptSection, ScriptViewMode } from '../../../types';

// ビジュアルタイプの定義
type VisualType = 'avatar' | 'image' | 'slide';

// ビジュアル設定の型定義
interface VisualSetting {
  type: VisualType;
  imageUrl?: string;
  imageName?: string;
  slideTitle?: string;
  slidePoints?: string[];
  avatarPosition?: 'hidden' | 'pip-left' | 'pip-right' | 'pip-bottom';
}

// 拡張セクション型（ビジュアル設定付き）
export interface ExpertReviewSectionData extends RevisedScriptSection {
  visual?: VisualSetting;
}

interface ExpertReviewSectionProps {
  sections: ExpertReviewSectionData[];
  onSectionsChange: (sections: ExpertReviewSectionData[]) => void;
  viewMode: ScriptViewMode;
  onViewModeChange: (mode: ScriptViewMode) => void;
  onAdopt: () => void;
}

export const ExpertReviewSection = ({
  sections,
  onSectionsChange,
  viewMode,
  onViewModeChange,
  onAdopt,
}: ExpertReviewSectionProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 編集状態管理
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  // セクション編集開始
  const handleStartEdit = (section: ExpertReviewSectionData) => {
    setEditingId(section.id);
    setEditContent(section.revisedContent);
  };

  // セクション編集保存
  const handleSaveEdit = (id: string) => {
    const updatedSections = sections.map((s) =>
      s.id === id ? { ...s, revisedContent: editContent } : s
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

  // ビジュアルタイプ変更
  const handleVisualTypeChange = (id: string, type: VisualType) => {
    const updatedSections = sections.map((s) => {
      if (s.id === id) {
        const defaultVisual: VisualSetting = {
          type,
          avatarPosition: type === 'avatar' ? undefined : 'pip-right',
        };
        return { ...s, visual: defaultVisual };
      }
      return s;
    });
    onSectionsChange(updatedSections);
  };

  // 画像アップロードトリガー
  const handleImageUploadClick = (id: string) => {
    setUploadTargetId(id);
    fileInputRef.current?.click();
  };

  // 画像アップロード処理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetId) {
      const mockUrl = URL.createObjectURL(file);
      const updatedSections = sections.map((s) => {
        if (s.id === uploadTargetId) {
          return {
            ...s,
            visual: {
              ...s.visual,
              type: 'image' as VisualType,
              imageUrl: mockUrl,
              imageName: file.name,
              avatarPosition: s.visual?.avatarPosition || 'pip-right',
            },
          };
        }
        return s;
      });
      onSectionsChange(updatedSections);
      toast.success(`${file.name} をアップロードしました`);
    }
    setUploadTargetId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 画像削除
  const handleRemoveImage = (id: string) => {
    const updatedSections = sections.map((s) => {
      if (s.id === id && s.visual) {
        return {
          ...s,
          visual: {
            ...s.visual,
            imageUrl: undefined,
            imageName: undefined,
          },
        };
      }
      return s;
    });
    onSectionsChange(updatedSections);
    toast.info('画像を削除しました');
  };

  // アバター位置変更
  const handleAvatarPositionChange = (
    id: string,
    position: VisualSetting['avatarPosition']
  ) => {
    const updatedSections = sections.map((s) => {
      if (s.id === id && s.visual) {
        return {
          ...s,
          visual: {
            ...s.visual,
            avatarPosition: position,
          },
        };
      }
      return s;
    });
    onSectionsChange(updatedSections);
  };

  // スライドコンテンツ更新
  const handleSlideUpdate = (id: string, title: string, points: string[]) => {
    const updatedSections = sections.map((s) => {
      if (s.id === id && s.visual) {
        return {
          ...s,
          visual: {
            ...s.visual,
            slideTitle: title,
            slidePoints: points,
          },
        };
      }
      return s;
    });
    onSectionsChange(updatedSections);
  };

  return (
    <div
      className={cn(
        'rounded-3xl shadow-sm border-2 border-purple-200 p-6',
        isDarkMode ? 'bg-slate-900 border-purple-500/30' : 'bg-white'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h3 className={cn('text-lg font-semibold', themeClasses.text)}>
            🏆 専門家レビュー版（最高版）
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {/* 表示モード切り替え */}
          <div
            className={cn(
              'flex rounded-lg p-0.5',
              isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
            )}
          >
            <button
              onClick={() => onViewModeChange('text_only')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-colors',
                viewMode === 'text_only'
                  ? 'bg-purple-600 text-white'
                  : cn(themeClasses.textSecondary, 'hover:bg-white dark:hover:bg-slate-700')
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              テキストのみ
            </button>
            <button
              onClick={() => onViewModeChange('with_visual')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-colors',
                viewMode === 'with_visual'
                  ? 'bg-purple-600 text-white'
                  : cn(themeClasses.textSecondary, 'hover:bg-white dark:hover:bg-slate-700')
              )}
            >
              <Image className="w-3.5 h-3.5" />
              ビジュアル付き
            </button>
          </div>
          <span className={cn('text-xs', themeClasses.textSecondary)}>60秒</span>
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded font-medium dark:bg-purple-900/30">
            ✏️ 編集可能
          </span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className={cn(
              'group border rounded-2xl p-4 transition-colors',
              isDarkMode
                ? 'border-slate-700 hover:border-purple-500/50'
                : 'border-slate-200 hover:border-purple-300'
            )}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-1 rounded',
                    section.isImproved
                      ? isDarkMode
                        ? 'text-purple-400 bg-purple-900/30'
                        : 'text-purple-700 bg-purple-100'
                      : isDarkMode
                      ? 'text-purple-300 bg-purple-900/20'
                      : 'text-purple-700 bg-purple-50'
                  )}
                >
                  {section.timestamp}
                </span>
                <span className={cn('text-xs font-medium', themeClasses.textSecondary)}>
                  {section.label}
                </span>
                {section.isImproved && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium dark:bg-green-900/30">
                    ✨ 改善済み
                  </span>
                )}
              </div>
              {editingId !== section.id && (
                <button
                  onClick={() => handleStartEdit(section)}
                  className={cn(
                    'opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all',
                    isDarkMode
                      ? 'text-slate-400 hover:text-purple-400 hover:bg-purple-900/30'
                      : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                  )}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Section Content */}
            {editingId === section.id ? (
              <div className="mb-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-700'
                  )}
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={handleCancelEdit}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg transition-colors',
                      isDarkMode
                        ? 'text-slate-400 hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleSaveEdit(section.id)}
                    className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p
                  className={cn(
                    'text-sm leading-relaxed cursor-pointer rounded p-2 -m-2 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    themeClasses.text
                  )}
                  onClick={() => handleStartEdit(section)}
                >
                  {section.revisedContent}
                </p>
              </div>
            )}

            {/* Visual Settings (only when with_visual mode) */}
            {viewMode === 'with_visual' && (
              <div
                className={cn(
                  'border-t pt-4',
                  isDarkMode ? 'border-slate-700' : 'border-slate-100'
                )}
              >
                {/* Visual Type Selection */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('text-xs font-medium', themeClasses.textSecondary)}>
                    ビジュアル:
                  </span>
                  <div
                    className={cn(
                      'flex rounded-lg p-0.5',
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                    )}
                  >
                    {(['avatar', 'image', 'slide'] as VisualType[]).map((type) => {
                      const isSelected = (section.visual?.type || 'avatar') === type;
                      const Icon = type === 'image' ? Image : type === 'slide' ? Layers : Video;
                      const label =
                        type === 'image' ? '画像' : type === 'slide' ? 'スライド' : 'アバター';

                      return (
                        <button
                          key={type}
                          onClick={() => handleVisualTypeChange(section.id, type)}
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors',
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : cn(themeClasses.textSecondary, 'hover:bg-white dark:hover:bg-slate-600')
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Image Type */}
                {section.visual?.type === 'image' && (
                  <div className="space-y-2">
                    {section.visual.imageUrl ? (
                      <div className="relative">
                        <div
                          className={cn(
                            'aspect-video rounded-xl overflow-hidden',
                            isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                          )}
                        >
                          <img
                            src={section.visual.imageUrl}
                            alt={section.visual.imageName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveImage(section.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <p className={cn('text-xs mt-1 truncate', themeClasses.textSecondary)}>
                          {section.visual.imageName}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImageUploadClick(section.id)}
                        className={cn(
                          'w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                          isDarkMode
                            ? 'border-slate-600 hover:border-purple-500 hover:bg-purple-900/10'
                            : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
                        )}
                      >
                        <Upload className={cn('w-8 h-8', themeClasses.textSecondary)} />
                        <span className={cn('text-xs', themeClasses.textSecondary)}>
                          画像をアップロード
                        </span>
                        <span className={cn('text-xs', themeClasses.textSecondary)}>
                          またはドラッグ＆ドロップ
                        </span>
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs', themeClasses.textSecondary)}>
                        アバター位置:
                      </span>
                      <select
                        value={section.visual.avatarPosition || 'pip-right'}
                        onChange={(e) =>
                          handleAvatarPositionChange(
                            section.id,
                            e.target.value as VisualSetting['avatarPosition']
                          )
                        }
                        className={cn(
                          'text-xs px-2 py-1 rounded-lg border',
                          isDarkMode
                            ? 'bg-slate-700 border-slate-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        )}
                      >
                        <option value="pip-right">右下(PiP)</option>
                        <option value="pip-left">左下(PiP)</option>
                        <option value="pip-bottom">下部(PiP)</option>
                        <option value="hidden">非表示</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Slide Type */}
                {section.visual?.type === 'slide' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="スライドタイトル"
                      value={section.visual.slideTitle || ''}
                      onChange={(e) =>
                        handleSlideUpdate(
                          section.id,
                          e.target.value,
                          section.visual?.slidePoints || []
                        )
                      }
                      className={cn(
                        'w-full text-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                          : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
                      )}
                    />
                    <textarea
                      placeholder="箇条書き（改行区切り）"
                      value={(section.visual.slidePoints || []).join('\n')}
                      onChange={(e) =>
                        handleSlideUpdate(
                          section.id,
                          section.visual?.slideTitle || '',
                          e.target.value.split('\n').filter(Boolean)
                        )
                      }
                      rows={3}
                      className={cn(
                        'w-full text-xs px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500',
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                          : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
                      )}
                    />
                    {/* Slide Preview */}
                    {(section.visual.slideTitle || (section.visual.slidePoints?.length ?? 0) > 0) && (
                      <div
                        className={cn(
                          'aspect-video rounded-xl p-4 flex flex-col justify-center border',
                          isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                        )}
                      >
                        {section.visual.slideTitle && (
                          <p className={cn('text-sm font-bold mb-3', themeClasses.text)}>
                            {section.visual.slideTitle}
                          </p>
                        )}
                        <ul className="space-y-1.5">
                          {section.visual.slidePoints?.map((point, i) => (
                            <li
                              key={i}
                              className={cn(
                                'text-xs flex items-start gap-2',
                                themeClasses.textSecondary
                              )}
                            >
                              <span className="text-purple-500">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs', themeClasses.textSecondary)}>
                        アバター位置:
                      </span>
                      <select
                        value={section.visual.avatarPosition || 'pip-right'}
                        onChange={(e) =>
                          handleAvatarPositionChange(
                            section.id,
                            e.target.value as VisualSetting['avatarPosition']
                          )
                        }
                        className={cn(
                          'text-xs px-2 py-1 rounded-lg border',
                          isDarkMode
                            ? 'bg-slate-700 border-slate-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        )}
                      >
                        <option value="pip-right">右下(PiP)</option>
                        <option value="pip-left">左下(PiP)</option>
                        <option value="pip-bottom">下部(PiP)</option>
                        <option value="hidden">非表示</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Avatar Only Type */}
                {(!section.visual?.type || section.visual?.type === 'avatar') && (
                  <div
                    className={cn(
                      'aspect-video rounded-xl flex items-center justify-center',
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                    )}
                  >
                    <div className="text-center">
                      <Video className={cn('w-8 h-8 mx-auto mb-2', themeClasses.textSecondary)} />
                      <p className={cn('text-xs', themeClasses.textSecondary)}>アバターのみ表示</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Action */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onAdopt}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          この台本を採用する
        </button>
      </div>
    </div>
  );
};
