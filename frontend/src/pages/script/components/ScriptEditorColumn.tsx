import { useState, useRef } from 'react';
import { Sparkles, MessageCircle, Wand2, Edit3, Check, X, RefreshCw, Image, Video, Layers, Upload, Trash2, Eye, EyeOff, Users } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { toast } from '../../../components/common';

// ビジュアルタイプの定義
export type VisualType = 'avatar' | 'image' | 'slide';

// ビジュアル設定の型定義
export interface VisualSetting {
  type: VisualType;
  imageUrl?: string;        // 画像URL（アップロード済みまたは外部URL）
  imageName?: string;       // 画像ファイル名
  slideTitle?: string;      // スライドタイトル
  slidePoints?: string[];   // スライドの箇条書き
  avatarPosition?: 'hidden' | 'pip-left' | 'pip-right' | 'pip-bottom';  // アバター表示位置
}

// セクションの型定義
export interface ScriptSection {
  id: string;
  label: string;
  timestamp: string;
  content: string;
  visual?: VisualSetting;   // ビジュアル設定（オプション）
}

interface ScriptEditorColumnProps {
  aiType: 'gemini' | 'claude' | 'mixed';
  title: string;
  sections: ScriptSection[];
  onSectionsChange: (sections: ScriptSection[]) => void;
  onAdopt: () => void;
  onRewriteAll: () => void;
  onRequestExpertReview?: () => void;
  isRecommended?: boolean;
  showExpertReviewButton?: boolean;
}

export const ScriptEditorColumn = ({
  aiType,
  title,
  sections,
  onSectionsChange,
  onAdopt,
  onRewriteAll,
  onRequestExpertReview,
  isRecommended = false,
  showExpertReviewButton = false,
}: ScriptEditorColumnProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 編集中のセクションID
  const [editingId, setEditingId] = useState<string | null>(null);
  // 編集中の一時的な内容
  const [editContent, setEditContent] = useState<string>('');
  // タイトル編集
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  // ビジュアルプレビュー表示
  const [showVisualPreview, setShowVisualPreview] = useState(true);
  // 画像アップロード用のセクションID
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

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

  // ビジュアルタイプ変更
  const handleVisualTypeChange = (sectionId: string, type: VisualType) => {
    const updatedSections = sections.map((s) => {
      if (s.id === sectionId) {
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
  const handleImageUploadClick = (sectionId: string) => {
    setUploadTargetId(sectionId);
    fileInputRef.current?.click();
  };

  // 画像アップロード処理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetId) {
      // 実際にはファイルをサーバーにアップロードしてURLを取得
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
  const handleRemoveImage = (sectionId: string) => {
    const updatedSections = sections.map((s) => {
      if (s.id === sectionId && s.visual) {
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
  const handleAvatarPositionChange = (sectionId: string, position: VisualSetting['avatarPosition']) => {
    const updatedSections = sections.map((s) => {
      if (s.id === sectionId && s.visual) {
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
  const handleSlideUpdate = (sectionId: string, title: string, points: string[]) => {
    const updatedSections = sections.map((s) => {
      if (s.id === sectionId && s.visual) {
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

  // ビジュアルタイプのラベル取得
  const getVisualTypeLabel = (type?: VisualType) => {
    switch (type) {
      case 'image': return '画像';
      case 'slide': return 'スライド';
      default: return 'アバターのみ';
    }
  };

  // ビジュアルタイプのアイコン取得
  const getVisualTypeIcon = (type?: VisualType) => {
    switch (type) {
      case 'image': return Image;
      case 'slide': return Layers;
      default: return Video;
    }
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
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowVisualPreview(!showVisualPreview)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
              showVisualPreview ? 'text-emerald-500' : themeClasses.textSecondary
            )}
            title={showVisualPreview ? 'ビジュアル設定を隠す' : 'ビジュアル設定を表示'}
          >
            {showVisualPreview ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      </div>

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

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

              {/* ビジュアル設定UI */}
              {showVisualPreview && (
                <div className={cn(
                  'mt-3 p-3 rounded-xl border transition-all',
                  isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                )}>
                  {/* ビジュアルタイプ選択 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('text-[10px] font-medium', themeClasses.textSecondary)}>ビジュアル:</span>
                    <div className={cn('flex rounded-lg p-0.5', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                      {(['avatar', 'image', 'slide'] as VisualType[]).map((type) => {
                        const IconComponent = getVisualTypeIcon(type);
                        const isSelected = (section.visual?.type || 'avatar') === type;
                        return (
                          <button
                            key={type}
                            onClick={() => handleVisualTypeChange(section.id, type)}
                            className={cn(
                              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all',
                              isSelected
                                ? 'bg-emerald-500 text-white'
                                : cn(themeClasses.textSecondary, 'hover:bg-slate-300 dark:hover:bg-slate-600')
                            )}
                          >
                            <IconComponent size={10} />
                            {getVisualTypeLabel(type)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 画像タイプの場合 */}
                  {section.visual?.type === 'image' && (
                    <div className="space-y-2">
                      {section.visual.imageUrl ? (
                        <div className="relative">
                          <div className={cn(
                            'aspect-video rounded-lg overflow-hidden',
                            isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                          )}>
                            <img
                              src={section.visual.imageUrl}
                              alt={section.visual.imageName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={() => handleRemoveImage(section.id)}
                              className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600"
                              title="画像を削除"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p className={cn('text-[10px] mt-1 truncate', themeClasses.textSecondary)}>
                            {section.visual.imageName}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleImageUploadClick(section.id)}
                          className={cn(
                            'w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                            isDarkMode
                              ? 'border-slate-600 hover:border-emerald-500 hover:bg-emerald-900/10'
                              : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'
                          )}
                        >
                          <Upload size={20} className={themeClasses.textSecondary} />
                          <span className={cn('text-[10px]', themeClasses.textSecondary)}>
                            画像をアップロード
                          </span>
                        </button>
                      )}

                      {/* アバター位置選択 */}
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px]', themeClasses.textSecondary)}>アバター位置:</span>
                        <select
                          value={section.visual.avatarPosition || 'pip-right'}
                          onChange={(e) => handleAvatarPositionChange(section.id, e.target.value as VisualSetting['avatarPosition'])}
                          className={cn(
                            'text-[10px] px-2 py-1 rounded-lg border',
                            isDarkMode
                              ? 'bg-slate-700 border-slate-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700'
                          )}
                        >
                          <option value="hidden">非表示</option>
                          <option value="pip-left">左下(PiP)</option>
                          <option value="pip-right">右下(PiP)</option>
                          <option value="pip-bottom">下部(PiP)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* スライドタイプの場合 */}
                  {section.visual?.type === 'slide' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="スライドタイトル"
                        value={section.visual.slideTitle || ''}
                        onChange={(e) => handleSlideUpdate(
                          section.id,
                          e.target.value,
                          section.visual?.slidePoints || []
                        )}
                        className={cn(
                          'w-full text-[11px] px-2 py-1.5 rounded-lg border',
                          isDarkMode
                            ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                            : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
                        )}
                      />
                      <textarea
                        placeholder="箇条書き（改行区切り）"
                        value={(section.visual.slidePoints || []).join('\n')}
                        onChange={(e) => handleSlideUpdate(
                          section.id,
                          section.visual?.slideTitle || '',
                          e.target.value.split('\n').filter(Boolean)
                        )}
                        className={cn(
                          'w-full text-[11px] px-2 py-1.5 rounded-lg border min-h-[60px] resize-none',
                          isDarkMode
                            ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                            : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
                        )}
                      />
                      {/* スライドプレビュー */}
                      {(section.visual.slideTitle || (section.visual.slidePoints?.length ?? 0) > 0) && (
                        <div className={cn(
                          'aspect-video rounded-lg p-3 flex flex-col justify-center',
                          isDarkMode ? 'bg-slate-700' : 'bg-white border border-slate-200'
                        )}>
                          {section.visual.slideTitle && (
                            <p className={cn('text-[11px] font-bold mb-2', themeClasses.text)}>
                              {section.visual.slideTitle}
                            </p>
                          )}
                          <ul className="space-y-1">
                            {section.visual.slidePoints?.map((point, i) => (
                              <li key={i} className={cn('text-[10px] flex items-start gap-1', themeClasses.textSecondary)}>
                                <span className="text-emerald-500">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* アバター位置選択 */}
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px]', themeClasses.textSecondary)}>アバター位置:</span>
                        <select
                          value={section.visual.avatarPosition || 'pip-right'}
                          onChange={(e) => handleAvatarPositionChange(section.id, e.target.value as VisualSetting['avatarPosition'])}
                          className={cn(
                            'text-[10px] px-2 py-1 rounded-lg border',
                            isDarkMode
                              ? 'bg-slate-700 border-slate-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700'
                          )}
                        >
                          <option value="hidden">非表示</option>
                          <option value="pip-left">左下(PiP)</option>
                          <option value="pip-right">右下(PiP)</option>
                          <option value="pip-bottom">下部(PiP)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* アバターのみの場合 */}
                  {(!section.visual?.type || section.visual?.type === 'avatar') && (
                    <div className={cn(
                      'aspect-video rounded-lg flex items-center justify-center',
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    )}>
                      <div className="text-center">
                        <Video size={24} className={cn('mx-auto mb-1', themeClasses.textSecondary)} />
                        <p className={cn('text-[10px]', themeClasses.textSecondary)}>アバターのみ表示</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className={cn(
          'px-3 py-2 border-t flex flex-col gap-2 backdrop-blur-sm',
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white/50'
        )}
      >
        {/* 専門家レビューボタン */}
        {showExpertReviewButton && onRequestExpertReview && (
          <button
            onClick={onRequestExpertReview}
            className="w-full px-4 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 shadow-purple-500/30 flex items-center justify-center gap-2"
          >
            <Users size={16} />
            5人の専門家に添削してもらう
          </button>
        )}

        {/* 従来のアクションボタン */}
        <div className="flex justify-end gap-2">
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
    </div>
  );
};
