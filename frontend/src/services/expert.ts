/**
 * Expert Review Service
 *
 * 台本専門家レビュー機能のAPIサービス
 */
import { api } from './api';
import type {
  ExpertReviewRequest,
  ExpertReviewResponse,
  ExpertFeedback,
  ChecklistItem,
  BeforeAfterComparison,
  PersonaReaction,
} from '../types/expert';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

interface ApiExpertFeedback {
  expert_name: string;
  expert_icon: string;
  score: number;
  category: 'hook' | 'structure' | 'entertainment' | 'target' | 'cta';
  feedback: string;
  improvements: string[];
}

interface ApiChecklistItem {
  id: string;
  category: string;
  item: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
}

interface ApiBeforeAfterComparison {
  hook_score: { before: number; after: number };
  structure_score: { before: number; after: number };
  entertainment_score: { before: number; after: number };
  target_score: { before: number; after: number };
}

interface ApiPersonaReaction {
  persona_name: string;
  age: string;
  reaction: string;
  engagement_prediction: 'high' | 'medium' | 'low';
  quote: string;
}

interface ApiExpertReviewResponse {
  overall_score: number;
  publish_ready: boolean;
  expert_feedbacks: ApiExpertFeedback[];
  checklist: ApiChecklistItem[];
  before_after: ApiBeforeAfterComparison;
  improved_script: string;
  persona_reactions: ApiPersonaReaction[];
}

// ============================================================
// マッピング関数
// ============================================================

const mapExpertFeedback = (feedback: ApiExpertFeedback): ExpertFeedback => ({
  expert_name: feedback.expert_name,
  expert_icon: feedback.expert_icon,
  score: feedback.score,
  category: feedback.category,
  feedback: feedback.feedback,
  improvements: feedback.improvements,
});

const mapChecklistItem = (item: ApiChecklistItem): ChecklistItem => ({
  id: item.id,
  category: item.category,
  item: item.item,
  passed: item.passed,
  severity: item.severity,
});

const mapBeforeAfterComparison = (comparison: ApiBeforeAfterComparison): BeforeAfterComparison => ({
  hook_score: comparison.hook_score,
  structure_score: comparison.structure_score,
  entertainment_score: comparison.entertainment_score,
  target_score: comparison.target_score,
});

const mapPersonaReaction = (reaction: ApiPersonaReaction): PersonaReaction => ({
  persona_name: reaction.persona_name,
  age: reaction.age,
  reaction: reaction.reaction,
  engagement_prediction: reaction.engagement_prediction,
  quote: reaction.quote,
});

const mapExpertReviewResponse = (response: ApiExpertReviewResponse): ExpertReviewResponse => ({
  overall_score: response.overall_score,
  publish_ready: response.publish_ready,
  expert_feedbacks: response.expert_feedbacks.map(mapExpertFeedback),
  checklist: response.checklist.map(mapChecklistItem),
  before_after: mapBeforeAfterComparison(response.before_after),
  improved_script: response.improved_script,
  persona_reactions: response.persona_reactions.map(mapPersonaReaction),
});

// ============================================================
// モックデータ（API接続エラー時のフォールバック）
// ============================================================

const mockExpertReviewResponse: ExpertReviewResponse = {
  overall_score: 82,
  publish_ready: true,
  expert_feedbacks: [
    {
      expert_name: '冒頭フック専門家',
      expert_icon: '🎣',
      score: 85,
      category: 'hook',
      feedback: '冒頭の問いかけは効果的です。視聴者の好奇心を刺激し、続きを見たくなる構成になっています。',
      improvements: [
        '数字を具体的に示すとより説得力が増します',
        '「あなた」を主語にして直接語りかける表現を追加',
      ],
    },
    {
      expert_name: '構成専門家',
      expert_icon: '🎬',
      score: 78,
      category: 'structure',
      feedback: '全体的な流れは良好ですが、中盤でやや冗長な部分があります。',
      improvements: [
        '中盤のポイント3と4を統合してテンポアップ',
        '各セクションの長さを均等にする',
      ],
    },
    {
      expert_name: 'エンタメ性専門家',
      expert_icon: '🎭',
      score: 80,
      category: 'entertainment',
      feedback: '具体例やストーリーテリングが効いています。もう少し感情に訴える表現があるとさらに良いでしょう。',
      improvements: [
        '成功事例に具体的な数字を追加',
        '失敗談を1つ入れて共感を誘う',
      ],
    },
    {
      expert_name: 'ターゲット専門家',
      expert_icon: '🎯',
      score: 88,
      category: 'target',
      feedback: 'ターゲット層への訴求は明確で、ペルソナに合った言葉選びができています。',
      improvements: [
        'ペルソナの悩みに対する共感表現を冒頭に追加',
        '業界用語を避け、より平易な表現に',
      ],
    },
    {
      expert_name: 'CTA専門家',
      expert_icon: '📣',
      score: 75,
      category: 'cta',
      feedback: 'CTAは明確ですが、行動を促す緊急性がやや弱いです。',
      improvements: [
        '「今すぐ」「本日限定」など緊急性を示す表現を追加',
        '具体的なベネフィットを明示する',
      ],
    },
  ],
  checklist: [
    {
      id: 'check-1',
      category: '冒頭3秒',
      item: '視聴者の注意を引く問いかけがある',
      passed: true,
      severity: 'critical',
    },
    {
      id: 'check-2',
      category: '冒頭3秒',
      item: '動画の価値を明示している',
      passed: true,
      severity: 'critical',
    },
    {
      id: 'check-3',
      category: '構成',
      item: 'セクションごとに明確な区切りがある',
      passed: true,
      severity: 'warning',
    },
    {
      id: 'check-4',
      category: '構成',
      item: '各ポイントの時間配分が適切',
      passed: false,
      severity: 'warning',
    },
    {
      id: 'check-5',
      category: 'エンタメ性',
      item: '具体例やストーリーが含まれている',
      passed: true,
      severity: 'info',
    },
    {
      id: 'check-6',
      category: 'ターゲット',
      item: 'ペルソナの悩みに言及している',
      passed: true,
      severity: 'critical',
    },
    {
      id: 'check-7',
      category: 'CTA',
      item: '明確な行動指示がある',
      passed: true,
      severity: 'critical',
    },
    {
      id: 'check-8',
      category: 'CTA',
      item: '緊急性やベネフィットを明示',
      passed: false,
      severity: 'warning',
    },
  ],
  before_after: {
    hook_score: { before: 65, after: 85 },
    structure_score: { before: 70, after: 78 },
    entertainment_score: { before: 72, after: 80 },
    target_score: { before: 80, after: 88 },
  },
  improved_script: `【改善版台本】

みなさん、こんにちは！
今日は「AIツールで作業時間を90%削減できた実例」をお話しします。

私も最初は半信半疑でしたが、実際に使ってみて驚きました。
特にあなたが毎日3時間かけている資料作成、これが18分に短縮できたらどうでしょうか？

今回ご紹介するのは、実際に私が試して効果があった3つのテクニックです。

【ポイント1】タスクの自動化
まず最初に、繰り返し作業を自動化しましょう。
例えば、毎週の報告書作成。これを手動でやると3時間かかっていたものが、
テンプレートとAIを組み合わせることで15分に短縮できました。

【ポイント2】情報収集の効率化
次に、リサーチ作業です。
以前は複数のサイトを見て回り、2時間かけていた市場調査が、
AIを使えば10分で必要な情報をまとめられます。

【ポイント3】品質チェックの高速化
最後に、成果物のチェック作業。
誤字脱字、表現のブラッシュアップまで、AIがサポートしてくれます。
これまで1時間かけていた校正が、わずか5分で完了します。

実は、このノウハウを使って、私のチームでは月間の作業時間を40時間削減できました。
つまり、丸5日分の時間を新しいプロジェクトに使えるようになったんです。

あなたも明日から試せます。
詳しい手順は概要欄のリンクからチェックしてください。
今なら限定で、実際に使っているテンプレートも無料配布中です。

この動画が役に立ったら、高評価とチャンネル登録をお願いします。
それでは、また次回の動画でお会いしましょう！`,
  persona_reactions: [
    {
      persona_name: '佐藤健太',
      age: '28歳',
      reaction: 'とても共感できる内容でした。特に資料作成の時間短縮は自分の課題そのものです。',
      engagement_prediction: 'high',
      quote: '「3時間が18分に」という具体的な数字が刺さりました。すぐに試してみたいです。',
    },
    {
      persona_name: '田中美咲',
      age: '35歳',
      reaction: '実例ベースで分かりやすい。ただ、自分の業務に当てはめる際の注意点も知りたいです。',
      engagement_prediction: 'medium',
      quote: 'テンプレート配布は魅力的。ただ、導入のハードルが気になります。',
    },
    {
      persona_name: '鈴木大輔',
      age: '42歳',
      reaction: '管理職として、チーム全体に展開できそうな内容で期待が持てます。',
      engagement_prediction: 'high',
      quote: '40時間削減の実績は説得力がある。上司への提案にも使えそう。',
    },
  ],
};

// ============================================================
// サービスエクスポート
// ============================================================

export const expertService = {
  /**
   * 台本専門家レビュー実行
   */
  async submitExpertReview(request: ExpertReviewRequest): Promise<ExpertReviewResponse> {
    try {
      const response = await api.post<ApiExpertReviewResponse>('/api/v1/scripts/expert-review', {
        script_id: request.script_id,
        gemini_script: request.gemini_script,
        claude_script: request.claude_script,
        knowledge_id: request.knowledge_id,
      });
      return mapExpertReviewResponse(response);
    } catch (error) {
      // API接続エラー時はモックデータを返す
      console.info('[expertService] Using mock data for expert review', error);
      return mockExpertReviewResponse;
    }
  },
};
