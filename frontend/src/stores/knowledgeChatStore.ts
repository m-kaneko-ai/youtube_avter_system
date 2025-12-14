import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  KnowledgeChatStep,
  KnowledgeChatMessage,
  KnowledgeChatSession,
  CollectedKnowledgeData,
  KnowledgeSection,
  KnowledgeChatProgress,
  KnowledgeChatMode,
  UploadedKnowledgeFile,
  RAGAnalysisResult,
} from '../types';

// =============================================
// 8ステップのセクション定義
// =============================================
export const KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
  {
    id: 'business_info',
    stepNumber: 1,
    title: 'ビジネス基本情報',
    description: '業種、年商、事業年数、提供サービスについて教えてください',
    isRequired: true,
    dataKeys: ['industry', 'annualRevenue', 'yearsInBusiness', 'services', 'businessModel'],
  },
  {
    id: 'main_target',
    stepNumber: 2,
    title: 'メインターゲット',
    description: '主なターゲット顧客の属性、状況、悩み、インサイトを深掘りします',
    isRequired: true,
    dataKeys: ['attributes', 'situation', 'frustrations', 'painPoints', 'desires', 'insights'],
  },
  {
    id: 'sub_target',
    stepNumber: 3,
    title: 'サブターゲット',
    description: '第二のターゲット層がいれば教えてください（任意）',
    isRequired: false,
    dataKeys: ['attributes', 'situation', 'frustrations', 'painPoints', 'desires', 'insights'],
  },
  {
    id: 'competitor',
    stepNumber: 4,
    title: '競合分析',
    description: '主な競合、競合の価値、顧客の不満について分析します',
    isRequired: true,
    dataKeys: ['mainCompetitors', 'competitorValue', 'customerComplaints', 'differentiation'],
  },
  {
    id: 'company',
    stepNumber: 5,
    title: '自社分析',
    description: '御社の強み、ミッション、成果事例について教えてください',
    isRequired: true,
    dataKeys: ['strengths', 'mission', 'achievements', 'uniqueMethod'],
  },
  {
    id: 'aha_concept',
    stepNumber: 6,
    title: 'AHAコンセプト',
    description: '常識破壊、インサイト、ネーミングを一緒に考えましょう',
    isRequired: true,
    dataKeys: ['commonSense', 'destruction', 'insight', 'naming'],
  },
  {
    id: 'concept_story',
    stepNumber: 7,
    title: 'コンセプト・ストーリー',
    description: 'キャラクター設定と変容ストーリーを構築します',
    isRequired: true,
    dataKeys: ['character', 'beforeStory', 'transformationStory', 'afterStory'],
  },
  {
    id: 'product_design',
    stepNumber: 8,
    title: '商品設計',
    description: '価格帯、カリキュラム構成について（任意）',
    isRequired: false,
    dataKeys: ['priceRange', 'curriculum', 'deliverables', 'support'],
  },
];

// =============================================
// Store State Interface
// =============================================
interface KnowledgeChatState {
  // セッション
  session: KnowledgeChatSession | null;

  // モード（手動 or RAG）
  mode: KnowledgeChatMode;

  // アップロードファイル
  uploadedFiles: UploadedKnowledgeFile[];

  // RAG解析結果
  ragAnalysis: RAGAnalysisResult | null;

  // 現在のヒアリング対象（RAGモードで不足項目を順に聞く）
  currentMissingFieldIndex: number;

  // UI状態
  isLoading: boolean;
  isSending: boolean;
  isAnalyzing: boolean;
  error: string | null;

  // アクション
  setMode: (mode: KnowledgeChatMode) => void;
  addUploadedFile: (file: UploadedKnowledgeFile) => void;
  removeUploadedFile: (fileId: string) => void;
  setRagAnalysis: (analysis: RAGAnalysisResult) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  nextMissingField: () => void;
  initSession: (clientId?: string, knowledgeName?: string) => void;
  addMessage: (message: Omit<KnowledgeChatMessage, 'id' | 'timestamp'>) => void;
  updateCollectedData: (step: KnowledgeChatStep, data: Record<string, string>) => void;
  goToStep: (step: KnowledgeChatStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  completeStep: (step: KnowledgeChatStep) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  saveSession: () => void;
  loadSession: (sessionId: string) => void;
  resetSession: () => void;
  getProgress: () => KnowledgeChatProgress;
  getCurrentSection: () => KnowledgeSection | undefined;
}

// =============================================
// Helper Functions
// =============================================
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getStepIndex = (step: KnowledgeChatStep): number => {
  return KNOWLEDGE_SECTIONS.findIndex(s => s.id === step);
};

const createInitialSession = (clientId?: string, knowledgeName?: string): KnowledgeChatSession => ({
  id: generateId(),
  clientId,
  knowledgeName,
  currentStep: 'business_info',
  currentStepNumber: 1,
  messages: [],
  collectedData: {},
  completedSteps: [],
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// =============================================
// Zustand Store
// =============================================
export const useKnowledgeChatStore = create<KnowledgeChatState>()(
  persist(
    (set, get) => ({
      session: null,
      mode: 'manual' as KnowledgeChatMode,
      uploadedFiles: [],
      ragAnalysis: null,
      currentMissingFieldIndex: 0,
      isLoading: false,
      isSending: false,
      isAnalyzing: false,
      error: null,

      setMode: (mode: KnowledgeChatMode) => set({ mode }),

      addUploadedFile: (file: UploadedKnowledgeFile) => {
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file],
        }));
      },

      removeUploadedFile: (fileId: string) => {
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.id !== fileId),
        }));
      },

      setRagAnalysis: (analysis: RAGAnalysisResult) => {
        set({ ragAnalysis: analysis, currentMissingFieldIndex: 0 });
      },

      setIsAnalyzing: (analyzing: boolean) => set({ isAnalyzing: analyzing }),

      nextMissingField: () => {
        set((state) => ({
          currentMissingFieldIndex: state.currentMissingFieldIndex + 1,
        }));
      },

      initSession: (clientId?: string, knowledgeName?: string) => {
        const newSession = createInitialSession(clientId, knowledgeName);

        // 初期メッセージを追加
        const welcomeMessage: KnowledgeChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `こんにちは！ナレッジ作成アシスタントです。

これから8つのステップで、あなたのビジネスに関するナレッジを一緒に構築していきます。

**【STEP 1: ビジネス基本情報】**

まずは基本的なことからお聞かせください。

**現在のお仕事について教えてください。**
- どんな業種・業態ですか？
- 何年目のビジネスですか？
- 主にどんなサービスを提供されていますか？`,
          step: 'business_info',
          timestamp: new Date().toISOString(),
        };

        newSession.messages = [welcomeMessage];

        set({
          session: newSession,
          error: null,
        });
      },

      addMessage: (message) => {
        const { session } = get();
        if (!session) return;

        const newMessage: KnowledgeChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };

        set({
          session: {
            ...session,
            messages: [...session.messages, newMessage],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateCollectedData: (step, data) => {
        const { session } = get();
        if (!session) return;

        const dataKeyMap: Record<KnowledgeChatStep, keyof CollectedKnowledgeData> = {
          'business_info': 'businessInfo',
          'main_target': 'mainTarget',
          'sub_target': 'subTarget',
          'competitor': 'competitor',
          'company': 'company',
          'aha_concept': 'ahaConcept',
          'concept_story': 'conceptStory',
          'product_design': 'productDesign',
        };

        const key = dataKeyMap[step];

        set({
          session: {
            ...session,
            collectedData: {
              ...session.collectedData,
              [key]: {
                ...(session.collectedData[key] as Record<string, string> || {}),
                ...data,
              },
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      goToStep: (step) => {
        const { session } = get();
        if (!session) return;

        const stepIndex = getStepIndex(step);

        set({
          session: {
            ...session,
            currentStep: step,
            currentStepNumber: stepIndex + 1,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      goToNextStep: () => {
        const { session } = get();
        if (!session) return;

        const currentIndex = getStepIndex(session.currentStep);
        if (currentIndex < KNOWLEDGE_SECTIONS.length - 1) {
          const nextSection = KNOWLEDGE_SECTIONS[currentIndex + 1];

          set({
            session: {
              ...session,
              currentStep: nextSection.id,
              currentStepNumber: nextSection.stepNumber,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      goToPreviousStep: () => {
        const { session } = get();
        if (!session) return;

        const currentIndex = getStepIndex(session.currentStep);
        if (currentIndex > 0) {
          const prevSection = KNOWLEDGE_SECTIONS[currentIndex - 1];

          set({
            session: {
              ...session,
              currentStep: prevSection.id,
              currentStepNumber: prevSection.stepNumber,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      completeStep: (step) => {
        const { session } = get();
        if (!session) return;

        if (!session.completedSteps.includes(step)) {
          set({
            session: {
              ...session,
              completedSteps: [...session.completedSteps, step],
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setSending: (sending) => set({ isSending: sending }),
      setError: (error) => set({ error }),

      saveSession: () => {
        // persist middleware が自動で保存
        const { session } = get();
        if (session) {
          set({
            session: {
              ...session,
              status: 'paused',
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      loadSession: (sessionId: string) => {
        // persist middleware から自動ロード
        // 追加のロジックが必要な場合はここに実装
        console.log('Loading session:', sessionId);
      },

      resetSession: () => {
        set({
          session: null,
          mode: 'manual',
          uploadedFiles: [],
          ragAnalysis: null,
          currentMissingFieldIndex: 0,
          isLoading: false,
          isSending: false,
          isAnalyzing: false,
          error: null,
        });
      },

      getProgress: () => {
        const { session } = get();
        if (!session) {
          return {
            currentStep: 0,
            totalSteps: KNOWLEDGE_SECTIONS.length,
            progressPercent: 0,
            completedSections: [],
            collectedFieldsCount: 0,
            totalFieldsCount: 0,
          };
        }

        const totalFields = KNOWLEDGE_SECTIONS.reduce((acc, s) => acc + s.dataKeys.length, 0);
        let collectedFields = 0;

        // 収集済みフィールドをカウント
        Object.values(session.collectedData).forEach((sectionData) => {
          if (sectionData) {
            collectedFields += Object.keys(sectionData).filter(k =>
              sectionData[k as keyof typeof sectionData]
            ).length;
          }
        });

        return {
          currentStep: session.currentStepNumber,
          totalSteps: KNOWLEDGE_SECTIONS.length,
          progressPercent: Math.round((session.completedSteps.length / KNOWLEDGE_SECTIONS.length) * 100),
          completedSections: session.completedSteps,
          collectedFieldsCount: collectedFields,
          totalFieldsCount: totalFields,
        };
      },

      getCurrentSection: () => {
        const { session } = get();
        if (!session) return undefined;
        return KNOWLEDGE_SECTIONS.find(s => s.id === session.currentStep);
      },
    }),
    {
      name: 'knowledge-chat-storage',
      partialize: (state) => ({
        session: state.session,
        mode: state.mode,
        uploadedFiles: state.uploadedFiles,
        ragAnalysis: state.ragAnalysis,
      }),
    }
  )
);
