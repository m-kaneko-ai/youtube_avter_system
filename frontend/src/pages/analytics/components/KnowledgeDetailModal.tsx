import { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Save,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  BookOpen,
  Target,
  Users,
  TrendingUp,
  Building2,
  Zap,
  FileText,
  Package,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { toast } from '../../../components/common';
import { knowledgeService } from '../../../services/knowledge';
import type { KnowledgeResponse } from '../../../types';
import { KNOWLEDGE_SECTIONS } from './KnowledgeChatbotModal';

interface KnowledgeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeId: string;
  onUpdate: () => void;
}

interface SectionData {
  [key: string]: string;
}

const SECTION_ICONS = {
  business_info: BookOpen,
  main_target: Target,
  sub_target: Users,
  competitor: TrendingUp,
  company: Building2,
  aha_concept: Zap,
  concept_story: FileText,
  product_design: Package,
};

const FIELD_LABELS: Record<string, Record<string, string>> = {
  businessInfo: {
    industry: '業種・業態',
    annualRevenue: '年商規模',
    yearsInBusiness: '事業年数',
    services: '主なサービス',
    businessModel: 'ビジネスモデル',
  },
  mainTarget: {
    attributes: 'ターゲット属性',
    situation: '現在の状況',
    frustrations: '挫折経験',
    painPoints: '悩み・痛み',
    desires: '本当の欲求',
    insights: 'インサイト',
  },
  subTarget: {
    attributes: 'サブターゲット属性',
    situation: '現在の状況',
    frustrations: '挫折経験',
    painPoints: '悩み・痛み',
    desires: '本当の欲求',
    insights: 'インサイト',
  },
  competitor: {
    mainCompetitors: '主な競合',
    competitorValue: '競合の価値',
    customerComplaints: '顧客の不満',
    differentiation: '差別化ポイント',
  },
  company: {
    strengths: '強み',
    mission: 'ミッション',
    achievements: '成果事例',
    uniqueMethod: '独自メソッド',
  },
  ahaConcept: {
    commonSense: '業界の常識',
    destruction: '常識破壊',
    insight: 'インサイト',
    naming: 'ネーミング',
  },
  conceptStory: {
    character: 'キャラクター設定',
    beforeStory: 'Beforeストーリー',
    transformationStory: '変容のきっかけ',
    afterStory: 'Afterストーリー',
  },
  productDesign: {
    priceRange: '価格帯',
    curriculum: 'カリキュラム',
    deliverables: '提供物',
    support: 'サポート',
  },
};

export const KnowledgeDetailModal = ({
  isOpen,
  onClose,
  knowledgeId,
  onUpdate,
}: KnowledgeDetailModalProps) => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [knowledge, setKnowledge] = useState<KnowledgeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<SectionData>({});

  useEffect(() => {
    if (isOpen && knowledgeId) {
      loadKnowledge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, knowledgeId]);

  const loadKnowledge = async () => {
    setIsLoading(true);
    try {
      const data = await knowledgeService.getKnowledge(knowledgeId);
      setKnowledge(data as KnowledgeResponse);
    } catch (error) {
      console.error('Failed to load knowledge:', error);
      toast.error('ナレッジの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSection = (sectionKey: string, currentData: Record<string, unknown>) => {
    setEditingSection(sectionKey);
    setEditData(currentData as SectionData);
  };

  const handleSaveSection = async (sectionKey: string) => {
    if (!knowledge) return;

    setIsSaving(true);
    try {
      const updatedKnowledge = {
        ...knowledge,
        [sectionKey]: editData,
      };

      await knowledgeService.updateKnowledge(knowledgeId, updatedKnowledge);
      setKnowledge(updatedKnowledge);
      setEditingSection(null);
      toast.success('セクションを更新しました');
      onUpdate();
    } catch (error) {
      console.error('Failed to update section:', error);
      toast.error('セクションの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditData({});
  };

  const getSectionData = (sectionId: string): Record<string, unknown> => {
    if (!knowledge) return {};

    // バックエンドのキーマッピング
    const actualKeyMap: Record<string, keyof KnowledgeResponse> = {
      business_info: 'section_1_main_target',
      main_target: 'section_1_main_target',
      sub_target: 'section_2_sub_target',
      competitor: 'section_3_competitor',
      company: 'section_4_company',
      aha_concept: 'section_5_aha_concept',
      concept_story: 'section_6_concept_summary',
      product_design: 'section_8_promotion_strategy',
    };

    const backendKey = actualKeyMap[sectionId];
    return (knowledge[backendKey] as Record<string, unknown>) || {};
  };

  const calculateCompletionRate = () => {
    if (!knowledge) return 0;

    const completedSections = [
      knowledge.section_1_main_target,
      knowledge.section_2_sub_target,
      knowledge.section_3_competitor,
      knowledge.section_4_company,
      knowledge.section_5_aha_concept,
      knowledge.section_6_concept_summary,
      knowledge.section_7_customer_journey,
      knowledge.section_8_promotion_strategy,
    ].filter((section) => section && Object.keys(section).length > 0).length;

    return Math.round((completedSections / 8) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={cn(
          'w-full max-w-6xl h-[90vh] rounded-2xl border shadow-2xl flex flex-col',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'px-6 py-4 border-b flex items-center justify-between',
            themeClasses.cardBorder
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100')}>
              <BookOpen size={20} className="text-blue-500" />
            </div>
            <div>
              <h3 className={cn('text-lg font-bold', themeClasses.text)}>
                {knowledge?.name || 'ナレッジ詳細'}
              </h3>
              <p className={cn('text-xs', themeClasses.textSecondary)}>
                完成度: {calculateCompletionRate()}%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
              themeClasses.textSecondary
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {KNOWLEDGE_SECTIONS.map((section) => {
                const sectionData = getSectionData(section.id);
                const hasData = Object.keys(sectionData).length > 0;
                const isExpanded = expandedSection === section.id;
                const isEditing = editingSection === section.id;
                const Icon = SECTION_ICONS[section.id] || BookOpen;

                const dataKeyMap: Record<string, string> = {
                  business_info: 'businessInfo',
                  main_target: 'mainTarget',
                  sub_target: 'subTarget',
                  competitor: 'competitor',
                  company: 'company',
                  aha_concept: 'ahaConcept',
                  concept_story: 'conceptStory',
                  product_design: 'productDesign',
                };

                const fieldLabelKey = dataKeyMap[section.id];
                const fieldLabels = FIELD_LABELS[fieldLabelKey] || {};

                return (
                  <div
                    key={section.id}
                    className={cn(
                      'rounded-2xl border transition-all',
                      themeClasses.cardBorder,
                      isExpanded && 'ring-2 ring-blue-500/20'
                    )}
                  >
                    {/* Section Header */}
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className={cn(
                        'w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-2xl',
                        !isExpanded && themeClasses.cardBg
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-xl',
                            hasData
                              ? isDarkMode
                                ? 'bg-green-900/40'
                                : 'bg-green-100'
                              : isDarkMode
                              ? 'bg-slate-800'
                              : 'bg-slate-100'
                          )}
                        >
                          <Icon
                            size={18}
                            className={hasData ? 'text-green-500' : themeClasses.textSecondary}
                          />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <h4 className={cn('font-bold', themeClasses.text)}>
                              {section.stepNumber}. {section.title}
                            </h4>
                            {hasData ? (
                              <CheckCircle2 size={16} className="text-green-500" />
                            ) : section.isRequired ? (
                              <AlertCircle size={16} className="text-orange-500" />
                            ) : (
                              <Circle size={16} className={themeClasses.textSecondary} />
                            )}
                          </div>
                          <p className={cn('text-xs mt-0.5', themeClasses.textSecondary)}>
                            {section.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        className={cn(
                          'transition-transform',
                          isExpanded && 'rotate-90',
                          themeClasses.textSecondary
                        )}
                      />
                    </button>

                    {/* Section Content */}
                    {isExpanded && (
                      <div className={cn('px-4 pb-4 space-y-3', themeClasses.cardBg)}>
                        {!hasData ? (
                          <div className={cn('text-center py-6', themeClasses.textSecondary)}>
                            <p className="text-sm">このセクションはまだ入力されていません</p>
                          </div>
                        ) : isEditing ? (
                          <div className="space-y-3">
                            {Object.entries(sectionData).map(([key]) => (
                              <div key={key}>
                                <label className={cn('block text-sm font-medium mb-1.5', themeClasses.text)}>
                                  {fieldLabels[key] || key}
                                </label>
                                <textarea
                                  value={editData[key] || ''}
                                  onChange={(e) =>
                                    setEditData({ ...editData, [key]: e.target.value })
                                  }
                                  rows={3}
                                  className={cn(
                                    'w-full px-3 py-2 rounded-xl border text-sm',
                                    themeClasses.cardBg,
                                    themeClasses.cardBorder,
                                    themeClasses.text
                                  )}
                                />
                              </div>
                            ))}
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => handleSaveSection(section.id)}
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 size={16} className="animate-spin" />
                                    保存中...
                                  </>
                                ) : (
                                  <>
                                    <Save size={16} />
                                    保存
                                  </>
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className={cn(
                                  'flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50',
                                  isDarkMode
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200'
                                )}
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(sectionData).map(([key, val]) => (
                              <div key={key}>
                                <p className={cn('text-xs font-medium mb-1', themeClasses.textSecondary)}>
                                  {fieldLabels[key] || key}
                                </p>
                                <p className={cn('text-sm whitespace-pre-wrap', themeClasses.text)}>
                                  {String(val)}
                                </p>
                              </div>
                            ))}
                            <div className="pt-2">
                              <button
                                onClick={() => handleEditSection(section.id, sectionData as Record<string, unknown>)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all flex items-center gap-2"
                              >
                                <Edit2 size={14} />
                                編集
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
