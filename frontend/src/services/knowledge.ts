/**
 * Knowledge Service
 *
 * ナレッジ作成チャットボット用API
 * バックエンドAPI連携 + フォールバック対応
 */
import { api } from './api';
import type {
  KnowledgeChatStep,
  KnowledgeChatMessage,
  KnowledgeChatSession,
  CollectedKnowledgeData,
  RAGAnalysisResult,
  UploadedKnowledgeFile,
} from '../types';
import { KNOWLEDGE_SECTIONS } from '../stores/knowledgeChatStore';

// ============================================================
// RAG解析用フィールドラベルマッピング
// ============================================================

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

const STEP_KEY_MAP: Record<KnowledgeChatStep, keyof typeof FIELD_LABELS> = {
  business_info: 'businessInfo',
  main_target: 'mainTarget',
  sub_target: 'subTarget',
  competitor: 'competitor',
  company: 'company',
  aha_concept: 'ahaConcept',
  concept_story: 'conceptStory',
  product_design: 'productDesign',
};

// ============================================================
// 質問テンプレート
// ============================================================

interface QuestionTemplate {
  step: KnowledgeChatStep;
  initialQuestion: string;
  followUpQuestions: string[];
  dontKnowResponses: string[];
  summaryTemplate: (data: Record<string, string>) => string;
}

const QUESTION_TEMPLATES: Record<KnowledgeChatStep, QuestionTemplate> = {
  business_info: {
    step: 'business_info',
    initialQuestion: `**【STEP 1: ビジネス基本情報】**

まずは基本的なことからお聞かせください。

**現在のお仕事について教えてください。**
- どんな業種・業態ですか？
- 何年目のビジネスですか？
- 主にどんなサービスを提供されていますか？`,
    followUpQuestions: [
      '年商規模はどのくらいですか？（目安で構いません）',
      'ビジネスモデルは主にどのような形ですか？（コンサル、コーチング、講座販売、物販など）',
      '現在の主な集客方法は何ですか？',
    ],
    dontKnowResponses: [
      'なるほど、まだ明確でない部分もありますよね。では、別の角度から聞かせてください。**お客様からどんなお仕事をしている人だと思われていますか？**',
      '大丈夫です！では、**これまでで一番多かったお客様はどんな方でしたか？** その方にどんなサービスを提供しましたか？',
    ],
    summaryTemplate: (data) =>
      `【ビジネス基本情報まとめ】
- 業種: ${data.industry || '未回答'}
- 事業年数: ${data.yearsInBusiness || '未回答'}
- 主なサービス: ${data.services || '未回答'}
- 年商規模: ${data.annualRevenue || '未回答'}
- ビジネスモデル: ${data.businessModel || '未回答'}

この内容でよろしいですか？修正があれば教えてください。`,
  },

  main_target: {
    step: 'main_target',
    initialQuestion: `**【STEP 2: メインターゲット】**

次に、あなたの**理想的なお客様像**について深掘りさせてください。

**一番助けたいお客様は、どんな人ですか？**
- 年齢層、性別、職業は？
- どんな状況にいる人ですか？
- 何に悩んでいますか？`,
    followUpQuestions: [
      'その方が「これは自分のことだ！」と思うような、**具体的なエピソード**を1つ教えてください。',
      'その方が今まで試してうまくいかなかったことは何ですか？',
      'その方が本当に欲しいもの（表面的な欲求の奥にある本音）は何だと思いますか？',
      'その方が気づいていない「本当の課題」は何だと思いますか？（インサイト）',
    ],
    dontKnowResponses: [
      '分かりづらいですよね。では、**過去に一番成果が出たお客様**を1人思い浮かべてください。その方について教えてください。',
      'では角度を変えて、**あなたが「この人は助けられない」と感じるお客様**はどんな人ですか？その逆を考えてみましょう。',
      '例えば、**最近の相談で印象に残っているエピソード**はありますか？どんな悩みを持って来られましたか？',
    ],
    summaryTemplate: (data) =>
      `【メインターゲットまとめ】
- 属性: ${data.attributes || '未回答'}
- 状況: ${data.situation || '未回答'}
- 挫折経験: ${data.frustrations || '未回答'}
- 悩み: ${data.painPoints || '未回答'}
- 本当の欲求: ${data.desires || '未回答'}
- インサイト: ${data.insights || '未回答'}

この内容でよろしいですか？`,
  },

  sub_target: {
    step: 'sub_target',
    initialQuestion: `**【STEP 3: サブターゲット】**（任意）

メインターゲット以外に、**第二のターゲット層**はいますか？

「いない」または「スキップ」と入力すると次に進みます。`,
    followUpQuestions: [
      'そのサブターゲットは、メインターゲットとどう違いますか？',
      'なぜその層もターゲットにしたいのですか？',
    ],
    dontKnowResponses: [
      '特に明確でなければ、このステップはスキップして大丈夫です。次に進みましょうか？',
    ],
    summaryTemplate: (data) =>
      data.attributes
        ? `【サブターゲットまとめ】
- 属性: ${data.attributes || '未回答'}
- 状況: ${data.situation || '未回答'}
- メインとの違い: ${data.frustrations || '未回答'}`
        : '（サブターゲット: スキップ）',
  },

  competitor: {
    step: 'competitor',
    initialQuestion: `**【STEP 4: 競合分析】**

あなたの**競合**について教えてください。

**お客様が「あなた以外」に検討する選択肢は何ですか？**
- 同業他社は誰ですか？
- お客様が比較検討するサービスは？
- 代替手段（本、YouTube、独学など）は？`,
    followUpQuestions: [
      'その競合が提供している「価値」は何だと思いますか？',
      'お客様が競合に対して持っている「不満」や「物足りなさ」は何ですか？',
      'あなたと競合の決定的な違いは何ですか？',
    ],
    dontKnowResponses: [
      'お客様の立場で考えてみましょう。**お客様があなたに出会う前に、まず何を試しますか？**',
      '例えば、**お客様が「〇〇で検索する」としたら、何というキーワードで検索しますか？** その検索結果に出てくるものが競合です。',
    ],
    summaryTemplate: (data) =>
      `【競合分析まとめ】
- 主な競合: ${data.mainCompetitors || '未回答'}
- 競合の価値: ${data.competitorValue || '未回答'}
- 顧客の不満: ${data.customerComplaints || '未回答'}
- 差別化ポイント: ${data.differentiation || '未回答'}`,
  },

  company: {
    step: 'company',
    initialQuestion: `**【STEP 5: 自社分析】**

次に、**あなた自身・あなたの会社**について教えてください。

**あなたの強みは何ですか？**
- お客様によく褒められることは？
- 他の人にはできないことは？
- あなただけの独自メソッドは？`,
    followUpQuestions: [
      'なぜこのビジネスをしているのですか？（ミッション・想い）',
      '印象的な成果事例を1つ教えてください。',
      'あなたの方法の特徴的な名前やフレームワークはありますか？',
    ],
    dontKnowResponses: [
      'お客様に聞いてみてください。**お客様があなたを選んだ理由**は何だと言っていますか？',
      '逆に、**あなたが苦手なこと・やりたくないこと**は何ですか？その裏返しが強みかもしれません。',
    ],
    summaryTemplate: (data) =>
      `【自社分析まとめ】
- 強み: ${data.strengths || '未回答'}
- ミッション: ${data.mission || '未回答'}
- 成果事例: ${data.achievements || '未回答'}
- 独自メソッド: ${data.uniqueMethod || '未回答'}`,
  },

  aha_concept: {
    step: 'aha_concept',
    initialQuestion: `**【STEP 6: AHAコンセプト】**

ここが一番重要なステップです。**「常識破壊」**を作りましょう。

**業界やお客様の中にある「常識」は何ですか？**
（例：「集客には毎日SNS投稿が必要」「コンサルは高額じゃないと成果が出ない」など）`,
    followUpQuestions: [
      'その常識に対して、あなたはどう「破壊」しますか？「実は〇〇なんです」という形で教えてください。',
      'お客様が「えっ！そうだったの？」と驚く瞬間（AHA体験）はどんな時ですか？',
      'この常識破壊を表現するキャッチーな言葉・ネーミングを考えてみましょう。',
    ],
    dontKnowResponses: [
      'お客様からよく聞く「思い込み」や「勘違い」は何ですか？それが常識です。',
      '「みんなは〇〇だと思っているけど、実は△△なんだよね」という文を完成させてください。',
      'あなたのサービスを受けた後、お客様が「もっと早く知りたかった！」と言うことは何ですか？',
    ],
    summaryTemplate: (data) =>
      `【AHAコンセプトまとめ】
- 常識: ${data.commonSense || '未回答'}
- 常識破壊: ${data.destruction || '未回答'}
- インサイト: ${data.insight || '未回答'}
- ネーミング: ${data.naming || '未回答'}`,
  },

  concept_story: {
    step: 'concept_story',
    initialQuestion: `**【STEP 7: コンセプト・ストーリー】**

ナレッジの**キャラクター設定**と**変容ストーリー**を作りましょう。

**あなた自身の「Before→After」ストーリーを教えてください。**
- 以前はどんな状態でしたか？
- 何がきっかけで変わりましたか？
- 今はどんな状態ですか？`,
    followUpQuestions: [
      'お客様の典型的な「Before→After」ストーリーも教えてください。',
      'このストーリーを一言で表すと？（例：「〇〇から△△へ」）',
    ],
    dontKnowResponses: [
      '難しければ、**一番印象的なお客様の変化**を思い出してください。その方はどう変わりましたか？',
    ],
    summaryTemplate: (data) =>
      `【コンセプト・ストーリーまとめ】
- キャラクター: ${data.character || '未回答'}
- Beforeストーリー: ${data.beforeStory || '未回答'}
- 変容のきっかけ: ${data.transformationStory || '未回答'}
- Afterストーリー: ${data.afterStory || '未回答'}`,
  },

  product_design: {
    step: 'product_design',
    initialQuestion: `**【STEP 8: 商品設計】**（任意）

最後に、**商品・サービス設計**について教えてください。

**現在の価格帯はどのくらいですか？**

「スキップ」と入力するとこのステップを飛ばせます。`,
    followUpQuestions: [
      'カリキュラム・プログラムの構成を教えてください。',
      '提供物（動画、テンプレート、サポートなど）は何がありますか？',
    ],
    dontKnowResponses: [
      'このステップは任意です。スキップして完了することもできます。',
    ],
    summaryTemplate: (data) =>
      data.priceRange
        ? `【商品設計まとめ】
- 価格帯: ${data.priceRange || '未回答'}
- カリキュラム: ${data.curriculum || '未回答'}
- 提供物: ${data.deliverables || '未回答'}
- サポート: ${data.support || '未回答'}`
        : '（商品設計: スキップ）',
  },
};

// ============================================================
// AIレスポンス生成（モック）
// ============================================================

/**
 * 「分からない」を検出
 */
const detectDontKnow = (message: string): boolean => {
  const patterns = [
    '分からない',
    'わからない',
    '分かりません',
    'わかりません',
    '思いつかない',
    '考えたことない',
    '難しい',
    'むずかしい',
    'ちょっと...',
    'うーん',
    '何も浮かばない',
  ];
  return patterns.some((p) => message.includes(p));
};

/**
 * スキップを検出
 */
const detectSkip = (message: string): boolean => {
  const patterns = ['スキップ', 'skip', 'いない', 'なし', '次へ', '飛ばす'];
  return patterns.some((p) => message.toLowerCase().includes(p));
};

/**
 * AIレスポンスを生成
 */
const generateAIResponse = (
  userMessage: string,
  currentStep: KnowledgeChatStep,
  collectedData: CollectedKnowledgeData,
  questionIndex: number
): { content: string; shouldMoveNext: boolean; extractedData: Record<string, string> } => {
  const template = QUESTION_TEMPLATES[currentStep];
  const section = KNOWLEDGE_SECTIONS.find((s) => s.id === currentStep);

  // スキップ検出
  if (detectSkip(userMessage) && !section?.isRequired) {
    return {
      content: `了解しました。このステップはスキップして次に進みますね。`,
      shouldMoveNext: true,
      extractedData: {},
    };
  }

  // 「分からない」検出
  if (detectDontKnow(userMessage)) {
    const dontKnowResponse =
      template.dontKnowResponses[
        Math.floor(Math.random() * template.dontKnowResponses.length)
      ];
    return {
      content: dontKnowResponse,
      shouldMoveNext: false,
      extractedData: {},
    };
  }

  // フォローアップ質問がまだある場合
  if (questionIndex < template.followUpQuestions.length) {
    // ユーザーの回答から情報を抽出（簡易版）
    const dataKey = section?.dataKeys[questionIndex] || '';
    const extractedData: Record<string, string> = {};
    if (dataKey) {
      extractedData[dataKey] = userMessage;
    }

    return {
      content: `なるほど、ありがとうございます！

${template.followUpQuestions[questionIndex]}`,
      shouldMoveNext: false,
      extractedData,
    };
  }

  // 全質問完了 → サマリー表示
  const dataKey = section?.dataKeys[questionIndex] || '';
  const extractedData: Record<string, string> = {};
  if (dataKey) {
    extractedData[dataKey] = userMessage;
  }

  // コレクトされたデータでサマリー生成
  const dataKeyMap: Record<KnowledgeChatStep, keyof CollectedKnowledgeData> = {
    business_info: 'businessInfo',
    main_target: 'mainTarget',
    sub_target: 'subTarget',
    competitor: 'competitor',
    company: 'company',
    aha_concept: 'ahaConcept',
    concept_story: 'conceptStory',
    product_design: 'productDesign',
  };
  const key = dataKeyMap[currentStep];
  const currentStepData = {
    ...(collectedData[key] as Record<string, string> || {}),
    ...extractedData,
  };

  return {
    content: `素晴らしい回答をありがとうございます！

${template.summaryTemplate(currentStepData)}

問題なければ「次へ」と入力してください。修正があれば教えてください。`,
    shouldMoveNext: false,
    extractedData,
  };
};

// ============================================================
// バックエンドAPI型（将来の実装用）
// ============================================================

// TODO: バックエンド実装時に使用
// interface ApiKnowledgeChatSession {
//   id: string;
//   client_id?: string;
//   knowledge_name?: string;
//   current_step: string;
//   current_step_number: number;
//   messages: Array<{
//     id: string;
//     role: 'user' | 'assistant' | 'system';
//     content: string;
//     step?: string;
//     created_at: string;
//     metadata?: Record<string, unknown>;
//   }>;
//   collected_data: Record<string, Record<string, string>>;
//   completed_steps: string[];
//   status: 'active' | 'paused' | 'completed';
//   created_at: string;
//   updated_at: string;
// }

// ============================================================
// Service Functions
// ============================================================

export const knowledgeService = {
  /**
   * チャットセッション作成
   */
  createSession: async (
    clientId?: string,
    knowledgeName?: string
  ): Promise<KnowledgeChatSession> => {
    // TODO: バックエンド実装後は実際のAPIを呼び出す
    // return api.post<ApiKnowledgeChatSession>('/api/v1/knowledge/chat/sessions', {
    //   client_id: clientId,
    //   knowledge_name: knowledgeName,
    // }).then(transformSession);

    // モック: 新しいセッションを返す
    const now = new Date().toISOString();
    const session: KnowledgeChatSession = {
      id: `session-${Date.now()}`,
      clientId,
      knowledgeName,
      currentStep: 'business_info',
      currentStepNumber: 1,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: QUESTION_TEMPLATES.business_info.initialQuestion,
          step: 'business_info',
          timestamp: now,
        },
      ],
      collectedData: {},
      completedSteps: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    return session;
  },

  /**
   * メッセージ送信
   */
  sendMessage: async (
    _sessionId: string,
    message: string,
    currentStep: KnowledgeChatStep,
    collectedData: CollectedKnowledgeData,
    questionIndex: number
  ): Promise<{
    assistantMessage: KnowledgeChatMessage;
    shouldMoveNext: boolean;
    extractedData: Record<string, string>;
  }> => {
    // TODO: バックエンド実装後は実際のAPIを呼び出す
    // return api.post('/api/v1/knowledge/chat/sessions/${sessionId}/messages', {
    //   content: message,
    // });

    // モック: AIレスポンスを生成
    await new Promise((resolve) => setTimeout(resolve, 800)); // 擬似遅延

    const { content, shouldMoveNext, extractedData } = generateAIResponse(
      message,
      currentStep,
      collectedData,
      questionIndex
    );

    const assistantMessage: KnowledgeChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      step: currentStep,
      timestamp: new Date().toISOString(),
    };

    return { assistantMessage, shouldMoveNext, extractedData };
  },

  /**
   * 次のステップへ進む際のメッセージを取得
   */
  getStepTransitionMessage: (nextStep: KnowledgeChatStep): KnowledgeChatMessage => {
    const template = QUESTION_TEMPLATES[nextStep];
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: template.initialQuestion,
      step: nextStep,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * ナレッジを保存
   */
  saveKnowledge: async (
    _session: KnowledgeChatSession
  ): Promise<{ success: boolean; knowledgeId: string }> => {
    // TODO: バックエンド実装後は実際のAPIを呼び出す
    // return api.post('/api/v1/knowledge', {
    //   name: session.knowledgeName,
    //   client_id: session.clientId,
    //   content: session.collectedData,
    // });

    // モック
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      knowledgeId: `knowledge-${Date.now()}`,
    };
  },

  /**
   * セッション一覧を取得
   */
  getSessions: async (_clientId?: string): Promise<KnowledgeChatSession[]> => {
    // TODO: バックエンド実装後は実際のAPIを呼び出す
    return [];
  },

  /**
   * セッションを取得
   */
  getSession: async (_sessionId: string): Promise<KnowledgeChatSession | null> => {
    // TODO: バックエンド実装後は実際のAPIを呼び出す
    return null;
  },

  /**
   * 完了メッセージを生成
   */
  getCompletionMessage: (collectedData: CollectedKnowledgeData): KnowledgeChatMessage => {
    const summaries = Object.entries(QUESTION_TEMPLATES)
      .map(([step, template]) => {
        const dataKeyMap: Record<string, keyof CollectedKnowledgeData> = {
          business_info: 'businessInfo',
          main_target: 'mainTarget',
          sub_target: 'subTarget',
          competitor: 'competitor',
          company: 'company',
          aha_concept: 'ahaConcept',
          concept_story: 'conceptStory',
          product_design: 'productDesign',
        };
        const key = dataKeyMap[step];
        const data = (collectedData[key] as Record<string, string>) || {};
        return template.summaryTemplate(data);
      })
      .join('\n\n');

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `おめでとうございます！全てのステップが完了しました！

以下があなたのナレッジデータです：

${summaries}

---

「保存」ボタンを押すと、このナレッジがデータベースに登録されます。
修正が必要な場合は、該当するステップに戻って編集できます。`,
      timestamp: new Date().toISOString(),
    };
  },

  // ============================================================
  // RAG機能
  // ============================================================

  /**
   * アップロードされたファイルを解析してナレッジデータを抽出
   */
  analyzeUploadedContent: async (
    files: UploadedKnowledgeFile[]
  ): Promise<RAGAnalysisResult> => {
    // 全ファイルのコンテンツを結合
    const combinedContent = files.map((f) => f.content).join('\n\n---\n\n');

    // バックエンドAPI呼び出しを試行
    try {
      const response = await api.post<{
        extracted_data: Record<string, Record<string, string>>;
        missing_fields: Array<{ step: string; field: string; field_label: string }>;
        needs_confirmation: Array<{ step: string; field: string; value: string; reason: string }>;
        confidence: number;
        total_fields: number;
        extracted_fields: number;
      }>('/api/v1/knowledges/rag/analyze', {
        content: combinedContent,
        file_name: files[0]?.name,
      });

      // バックエンドのレスポンスをフロントエンドの型に変換
      const extractedData: CollectedKnowledgeData = {};

      // snake_case to camelCase 変換
      const stepKeyMap: Record<string, keyof CollectedKnowledgeData> = {
        business_info: 'businessInfo',
        main_target: 'mainTarget',
        sub_target: 'subTarget',
        competitor: 'competitor',
        company: 'company',
        aha_concept: 'ahaConcept',
        concept_story: 'conceptStory',
        product_design: 'productDesign',
      };

      // フィールド名のsnake_case to camelCase変換マップ
      const fieldKeyMap: Record<string, string> = {
        annual_revenue: 'annualRevenue',
        years_in_business: 'yearsInBusiness',
        business_model: 'businessModel',
        pain_points: 'painPoints',
        main_competitors: 'mainCompetitors',
        competitor_value: 'competitorValue',
        customer_complaints: 'customerComplaints',
        unique_method: 'uniqueMethod',
        common_sense: 'commonSense',
        before_story: 'beforeStory',
        transformation_story: 'transformationStory',
        after_story: 'afterStory',
        price_range: 'priceRange',
      };

      for (const [step, data] of Object.entries(response.extracted_data || {})) {
        const camelStep = stepKeyMap[step] || step;
        if (data) {
          const convertedData: Record<string, string> = {};
          for (const [key, value] of Object.entries(data)) {
            const camelKey = fieldKeyMap[key] || key;
            convertedData[camelKey] = value;
          }
          (extractedData as Record<string, Record<string, string>>)[camelStep as string] = convertedData;
        }
      }

      // missing_fieldsを変換
      const missingFields = (response.missing_fields || []).map((f) => ({
        step: f.step as KnowledgeChatStep,
        field: fieldKeyMap[f.field] || f.field,
        fieldLabel: f.field_label,
      }));

      // needs_confirmationを変換
      const needsConfirmation = (response.needs_confirmation || []).map((c) => ({
        step: c.step as KnowledgeChatStep,
        field: fieldKeyMap[c.field] || c.field,
        value: c.value,
        reason: c.reason,
      }));

      return {
        extractedData,
        missingFields,
        needsConfirmation,
        confidence: Math.round(response.confidence * 100),
        extractedFields: response.extracted_fields,
        totalFields: response.total_fields,
      };
    } catch (error) {
      console.warn('Backend RAG analysis failed, falling back to mock:', error);
    }

    // フォールバック: モック解析
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const extractedData: CollectedKnowledgeData = {};
    const missingFields: RAGAnalysisResult['missingFields'] = [];
    const needsConfirmation: RAGAnalysisResult['needsConfirmation'] = [];

    // 各セクションを解析
    for (const section of KNOWLEDGE_SECTIONS) {
      const stepKey = STEP_KEY_MAP[section.id];
      const fieldLabels = FIELD_LABELS[stepKey];
      const sectionData: Record<string, string> = {};

      for (const dataKey of section.dataKeys) {
        const label = fieldLabels[dataKey] || dataKey;
        const extracted = extractFieldFromContent(combinedContent, label, dataKey);

        if (extracted) {
          sectionData[dataKey] = extracted;
          // 抽出された値の確認が必要かチェック
          if (extracted.length < 10) {
            needsConfirmation.push({
              step: section.id,
              field: dataKey,
              value: extracted,
              reason: '情報が短いため、詳細の確認をお願いします',
            });
          }
        } else {
          // 必須セクションの場合のみ不足としてマーク
          if (section.isRequired) {
            missingFields.push({
              step: section.id,
              field: dataKey,
              fieldLabel: label,
            });
          }
        }
      }

      if (Object.keys(sectionData).length > 0) {
        (extractedData as Record<string, Record<string, string>>)[stepKey] = sectionData;
      }
    }

    // 信頼度を計算
    const totalFieldsCount = KNOWLEDGE_SECTIONS.reduce((acc, s) => acc + s.dataKeys.length, 0);
    const extractedCount = Object.values(extractedData).reduce(
      (acc, section) => acc + Object.keys(section || {}).length,
      0
    );
    const confidence = Math.round((extractedCount / totalFieldsCount) * 100);

    return {
      extractedData,
      missingFields,
      needsConfirmation,
      confidence,
      extractedFields: extractedCount,
      totalFields: totalFieldsCount,
    };
  },

  /**
   * RAGモードで不足項目をヒアリングするメッセージを生成
   */
  generateMissingFieldQuestion: (
    missingField: RAGAnalysisResult['missingFields'][0],
    previousAnswer?: string
  ): KnowledgeChatMessage => {
    const section = KNOWLEDGE_SECTIONS.find((s) => s.id === missingField.step);

    // フィールドに応じた質問を生成
    const questionMap: Record<string, string> = {
      industry: 'どんな業種・業態でビジネスをされていますか？',
      annualRevenue: '年商規模はどのくらいですか？（目安で構いません）',
      yearsInBusiness: 'お仕事は何年目ですか？',
      services: '主にどんなサービスを提供されていますか？',
      businessModel: 'ビジネスモデルは主にどのような形ですか？（コンサル、コーチング、講座販売など）',
      attributes: 'ターゲット顧客の属性（年齢、性別、職業など）を教えてください。',
      situation: 'ターゲット顧客は現在どんな状況にいますか？',
      frustrations: 'ターゲット顧客の過去の挫折経験を教えてください。',
      painPoints: 'ターゲット顧客の主な悩みは何ですか？',
      desires: 'ターゲット顧客が本当に欲しいものは何だと思いますか？',
      insights: 'ターゲット顧客が気づいていない本当の課題は何ですか？',
      mainCompetitors: '主な競合は誰ですか？',
      competitorValue: '競合が提供している価値は何ですか？',
      customerComplaints: '顧客が競合に対して持っている不満は何ですか？',
      differentiation: 'あなたと競合の違いは何ですか？',
      strengths: 'あなたの強みは何ですか？',
      mission: 'なぜこのビジネスをしているのですか？',
      achievements: '印象的な成果事例を教えてください。',
      uniqueMethod: 'あなた独自のメソッドや方法論はありますか？',
      commonSense: '業界やお客様の中にある「常識」は何ですか？',
      destruction: 'その常識をどう「破壊」しますか？',
      insight: 'お客様が「そうだったのか！」と驚く瞬間は？',
      naming: 'この常識破壊を表すキャッチーな言葉は？',
      character: 'あなたのキャラクター設定を教えてください。',
      beforeStory: 'あなた（またはお客様）のBeforeストーリーは？',
      transformationStory: '変容のきっかけは何でしたか？',
      afterStory: '変容後のAfterストーリーを教えてください。',
      priceRange: '商品の価格帯はどのくらいですか？',
      curriculum: 'カリキュラム構成を教えてください。',
      deliverables: '提供物は何がありますか？',
      support: 'どんなサポートを提供していますか？',
    };

    const question = questionMap[missingField.field] || `「${missingField.fieldLabel}」について教えてください。`;

    let content = '';
    if (previousAnswer) {
      content = `ありがとうございます！では次の質問です。\n\n`;
    }

    content += `**【${section?.title}】**\n\n${question}`;

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      step: missingField.step,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * RAG解析結果の初期メッセージを生成
   */
  generateRAGAnalysisMessage: (analysis: RAGAnalysisResult): KnowledgeChatMessage => {
    const extractedSections = Object.entries(analysis.extractedData)
      .filter(([, data]) => data && Object.keys(data).length > 0)
      .map(([key]) => {
        const section = KNOWLEDGE_SECTIONS.find(
          (s) => STEP_KEY_MAP[s.id] === key
        );
        return section?.title || key;
      });

    const missingSections = [...new Set(analysis.missingFields.map((f) => {
      const section = KNOWLEDGE_SECTIONS.find((s) => s.id === f.step);
      return section?.title || f.step;
    }))];

    let content = `ファイルを解析しました！\n\n`;
    content += `**解析結果（信頼度: ${analysis.confidence}%）**\n\n`;

    if (extractedSections.length > 0) {
      content += `**抽出できた情報:**\n`;
      extractedSections.forEach((s) => {
        content += `- ${s}\n`;
      });
      content += '\n';
    }

    if (missingSections.length > 0) {
      content += `**不足している情報:**\n`;
      missingSections.forEach((s) => {
        content += `- ${s}\n`;
      });
      content += '\n';
    }

    if (analysis.missingFields.length > 0) {
      content += `不足している${analysis.missingFields.length}項目についてヒアリングさせてください。\n`;
      content += `準備ができたら「開始」と入力してください。`;
    } else {
      content += `全ての情報が揃っています！「確認」と入力して内容を確認してください。`;
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
  },
};

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * テキストからフィールドの値を抽出（簡易版）
 * TODO: LLM APIを使用してより高度な抽出を行う
 */
function extractFieldFromContent(
  content: string,
  label: string,
  _fieldKey: string
): string | null {
  // ラベルベースで検索
  const patterns = [
    new RegExp(`${label}[：:・]\\s*(.+?)(?:\\n|$)`, 'i'),
    new RegExp(`【${label}】\\s*(.+?)(?:\\n|$)`, 'i'),
    new RegExp(`■${label}\\s*(.+?)(?:\\n|$)`, 'i'),
    new RegExp(`●${label}\\s*(.+?)(?:\\n|$)`, 'i'),
    new RegExp(`${label}\\s*[:：]?\\s*「(.+?)」`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value.length > 0 && value.length < 500) {
        return value;
      }
    }
  }

  // セクションベースで検索
  const sectionPatterns = [
    new RegExp(`${label}[\\s\\S]*?([^\\n]+)`, 'i'),
  ];

  for (const pattern of sectionPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value.length > 5 && value.length < 200) {
        return value;
      }
    }
  }

  return null;
}
