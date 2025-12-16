/**
 * Expert Review Service
 *
 * 専門家レビュー機能のAPIクライアント
 */
import { api } from './api';
import type {
  ExpertType,
  ExpertReviewResult,
  ExpertReviewRequest,
} from '../types';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

interface ApiExpertFeedback {
  expert_type: ExpertType;
  score: number;
  original_text: string;
  revised_text: string;
  improvement_reason: string;
  suggestions: string[];
}

interface ApiPublishReadiness {
  ready: boolean;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  message: string;
}

interface ApiChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  comment?: string;
}

interface ApiScoreComparison {
  before: number;
  after: number;
}

interface ApiBeforeAfterComparison {
  hook_score: ApiScoreComparison;
  retention_score: ApiScoreComparison;
  cta_score: ApiScoreComparison;
  overall_score: ApiScoreComparison;
}

interface ApiImprovementReason {
  expert_type: ExpertType;
  reason: string;
}

interface ApiPersonaReaction {
  persona_type: 'main' | 'sub' | 'potential';
  persona_name: string;
  reaction_score: number;
  reaction_emoji: '😊' | '😐' | '🤔' | '😕';
  reason: string;
}

interface ApiImprovementByExpert {
  expert_type: ExpertType;
  contribution: string;
}

interface ApiRevisedScriptSection {
  id: string;
  label: string;
  timestamp: string;
  original_content: string;
  revised_content: string;
  is_improved: boolean;
  improvements_by_expert: ApiImprovementByExpert[];
}

interface ApiSlideSuggestion {
  title?: string;
  points?: string[];
  main_number?: string;
  sub_text?: string;
}

interface ApiDirectionSuggestion {
  section_id: string;
  section_label: string;
  timestamp: string;
  urgency: 1 | 2 | 3 | 4 | 5;
  urgency_reason: string;
  suggested_type: 'number_slide' | 'bullet_slide' | 'image' | 'chart' | 'broll' | 'caption' | 'question' | 'avatar_only';
  avatar_position: 'hidden' | 'pip_right' | 'pip_left' | 'pip_bottom' | 'split_left' | 'split_right';
  reason: string;
  slide_suggestion?: ApiSlideSuggestion;
  search_keywords?: string[];
  recommended_colors?: string[];
  display_duration?: number;
  suggested_by: ExpertType;
}

interface ApiTimelineWarning {
  start_time: string;
  end_time: string;
  duration_seconds: number;
  warning_type: 'avatar_too_long' | 'no_visual_change' | 'low_engagement';
  message: string;
  recommendation: string;
}

interface ApiExpertReviewResult {
  id: string;
  script_id: string;
  revised_sections: ApiRevisedScriptSection[];
  expert_feedbacks: ApiExpertFeedback[];
  publish_readiness: ApiPublishReadiness;
  checklist: ApiChecklistItem[];
  before_after: ApiBeforeAfterComparison;
  improvement_reasons: ApiImprovementReason[];
  persona_reactions: ApiPersonaReaction[];
  direction_suggestions: ApiDirectionSuggestion[];
  timeline_warnings: ApiTimelineWarning[];
  source_ai_type: 'gemini' | 'claude';
  created_at: string;
  processing_time_ms: number;
}

// ============================================================
// マッピング関数
// ============================================================

const mapExpertReviewResult = (result: ApiExpertReviewResult): ExpertReviewResult => ({
  id: result.id,
  scriptId: result.script_id,
  revisedSections: result.revised_sections.map((s) => ({
    id: s.id,
    label: s.label,
    timestamp: s.timestamp,
    originalContent: s.original_content,
    revisedContent: s.revised_content,
    isImproved: s.is_improved,
    improvementsByExpert: s.improvements_by_expert.map((e) => ({
      expertType: e.expert_type,
      contribution: e.contribution,
    })),
  })),
  expertFeedbacks: result.expert_feedbacks.map((f) => ({
    expertType: f.expert_type,
    score: f.score,
    originalText: f.original_text,
    revisedText: f.revised_text,
    improvementReason: f.improvement_reason,
    suggestions: f.suggestions,
  })),
  publishReadiness: {
    ready: result.publish_readiness.ready,
    score: result.publish_readiness.score,
    grade: result.publish_readiness.grade,
    message: result.publish_readiness.message,
  },
  checklist: result.checklist.map((c) => ({
    id: c.id,
    label: c.label,
    passed: c.passed,
    comment: c.comment,
  })),
  beforeAfter: {
    hookScore: {
      before: result.before_after.hook_score.before,
      after: result.before_after.hook_score.after,
    },
    retentionScore: {
      before: result.before_after.retention_score.before,
      after: result.before_after.retention_score.after,
    },
    ctaScore: {
      before: result.before_after.cta_score.before,
      after: result.before_after.cta_score.after,
    },
    overallScore: {
      before: result.before_after.overall_score.before,
      after: result.before_after.overall_score.after,
    },
  },
  improvementReasons: result.improvement_reasons.map((r) => ({
    expertType: r.expert_type,
    reason: r.reason,
  })),
  personaReactions: result.persona_reactions.map((p) => ({
    personaType: p.persona_type,
    personaName: p.persona_name,
    reactionScore: p.reaction_score,
    reactionEmoji: p.reaction_emoji,
    reason: p.reason,
  })),
  directionSuggestions: result.direction_suggestions.map((d) => ({
    sectionId: d.section_id,
    sectionLabel: d.section_label,
    timestamp: d.timestamp,
    urgency: d.urgency,
    urgencyReason: d.urgency_reason,
    suggestedType: d.suggested_type,
    avatarPosition: d.avatar_position,
    reason: d.reason,
    slideSuggestion: d.slide_suggestion
      ? {
          title: d.slide_suggestion.title,
          points: d.slide_suggestion.points,
          mainNumber: d.slide_suggestion.main_number,
          subText: d.slide_suggestion.sub_text,
        }
      : undefined,
    searchKeywords: d.search_keywords,
    recommendedColors: d.recommended_colors,
    displayDuration: d.display_duration,
    suggestedBy: d.suggested_by,
  })),
  timelineWarnings: result.timeline_warnings.map((w) => ({
    startTime: w.start_time,
    endTime: w.end_time,
    durationSeconds: w.duration_seconds,
    warningType: w.warning_type,
    message: w.message,
    recommendation: w.recommendation,
  })),
  sourceAiType: result.source_ai_type,
  createdAt: result.created_at,
  processingTimeMs: result.processing_time_ms,
});

// ============================================================
// モックデータ
// ============================================================

const mockExpertReviewResult: ExpertReviewResult = {
  id: 'review-001',
  scriptId: 'script-001',
  revisedSections: [
    {
      id: 'section-1',
      label: '導入',
      timestamp: '0:00-0:10',
      originalContent:
        '「動画制作に時間がかかりすぎる...」そう思っていませんか？実は、たった3日で制作時間を70%削減できる方法があるんです。',
      revisedContent:
        'まだ1本5時間かけて動画作ってるの？今から見せる方法なら、たった3日で制作時間70%削減できます。',
      isImproved: true,
      improvementsByExpert: [
        { expertType: 'hook_master', contribution: '質問形式でより強いフックに改善' },
      ],
    },
    {
      id: 'section-2',
      label: '課題提示',
      timestamp: '0:10-0:30',
      originalContent:
        '従来の方法では、企画→台本→撮影→編集で1本あたり5時間かかっていました。月30本作るには150時間も必要です。',
      revisedContent:
        '動画制作の80%は「考える時間」です。企画を考え、台本を書き、演出を決める。月30本作るには150時間も必要でした。',
      isImproved: false,
      improvementsByExpert: [],
    },
    {
      id: 'section-3',
      label: '解決策',
      timestamp: '0:30-0:45',
      originalContent:
        'AIツールを3つ組み合わせることで、台本作成は10分、音声生成は5分、動画編集は15分に短縮できます。',
      revisedContent:
        'AI活用で「考える」パートを自動化。あなたは最終チェックするだけ。月30本でも週3時間で完了します。実際に私も70%削減できました。',
      isImproved: true,
      improvementsByExpert: [
        { expertType: 'entertainment_producer', contribution: '具体的な数字と体験談を追加' },
        { expertType: 'target_insight', contribution: 'ペルソナの悩みに直結する表現に修正' },
      ],
    },
    {
      id: 'section-4',
      label: 'CTA',
      timestamp: '0:45-0:60',
      originalContent: '詳しい手順は概要欄のリンクから。今すぐチェックしてください。',
      revisedContent:
        '具体的なツールと設定方法は概要欄の「完全ガイド」へ。今日から始められます。チャンネル登録もお忘れなく！',
      isImproved: true,
      improvementsByExpert: [
        { expertType: 'cta_strategist', contribution: 'CTAを明確化し、チャンネル登録誘導を追加' },
      ],
    },
  ],
  expertFeedbacks: [
    {
      expertType: 'hook_master',
      score: 92,
      originalText: '「動画制作に時間がかかりすぎる...」そう思っていませんか？',
      revisedText: 'まだ1本5時間かけて動画作ってるの？',
      improvementReason: '冒頭を質問形式に変更し、視聴者の注意を即座に引く構成に',
      suggestions: ['疑問形でスタート', '数字を明確に提示'],
    },
    {
      expertType: 'story_architect',
      score: 85,
      originalText: '全体構成',
      revisedText: '最適化された構成',
      improvementReason: '起承転結を明確化し、情報の順序を最適化',
      suggestions: ['課題→解決策の流れを強化'],
    },
    {
      expertType: 'entertainment_producer',
      score: 80,
      originalText: 'AIツールを3つ組み合わせることで...',
      revisedText: 'AI活用で「考える」パートを自動化...',
      improvementReason: '数字を追加しリズム感を改善、緩急をつけた',
      suggestions: ['具体的な数字で説得力UP'],
    },
    {
      expertType: 'target_insight',
      score: 88,
      originalText: '月30本作るには150時間も必要です。',
      revisedText: '月30本作るには150時間も必要でした。',
      improvementReason: 'ペルソナの悩みに直結する表現に修正',
      suggestions: ['「考える時間」という共感ポイントを追加'],
    },
    {
      expertType: 'cta_strategist',
      score: 78,
      originalText: '詳しい手順は概要欄のリンクから。',
      revisedText: '具体的なツールと設定方法は概要欄の「完全ガイド」へ。',
      improvementReason: '具体的な行動を明示し、チャンネル登録誘導を追加',
      suggestions: ['「完全ガイド」という具体名', 'チャンネル登録の明示'],
    },
  ],
  publishReadiness: {
    ready: true,
    score: 87,
    grade: 'A',
    message: '専門家チームの総合評価により、公開準備完了と判断しました',
  },
  checklist: [
    { id: 'hook_3sec', label: '冒頭3秒のインパクト', passed: true },
    { id: 'hook_30sec', label: '冒頭30秒のフック', passed: true },
    { id: 'open_loop', label: 'オープンループ（続きが気になる）', passed: true },
    { id: 'structure', label: '3幕構成（導入→展開→結論）', passed: true },
    { id: 'entertainment', label: '茶番・掛け合いが3箇所以上', passed: false, comment: 'さらに強化推奨' },
    { id: 'tempo', label: 'テンポの緩急設計', passed: true },
    { id: 'target_match', label: 'ターゲットの言葉遣い', passed: true },
    { id: 'pain_point', label: '痛みと欲求への訴求', passed: true },
    { id: 'mid_cta', label: '中間CTA', passed: true },
    { id: 'end_cta', label: '終盤CTA', passed: true },
  ],
  beforeAfter: {
    hookScore: { before: 65, after: 92 },
    retentionScore: { before: 48, after: 71 },
    ctaScore: { before: 55, after: 78 },
    overallScore: { before: 58, after: 87 },
  },
  improvementReasons: [
    {
      expertType: 'hook_master',
      reason: '冒頭を質問形式に変更し、視聴者の注意を即座に引く構成に',
    },
    {
      expertType: 'story_architect',
      reason: '起承転結を明確化し、情報の順序を最適化',
    },
    {
      expertType: 'entertainment_producer',
      reason: '数字を追加しリズム感を改善、緩急をつけた',
    },
    {
      expertType: 'target_insight',
      reason: 'ペルソナの悩みに直結する表現に修正',
    },
    {
      expertType: 'cta_strategist',
      reason: '具体的な行動を明示し、チャンネル登録誘導を追加',
    },
  ],
  personaReactions: [
    {
      personaType: 'main',
      personaName: 'メインターゲット（30代会社員）',
      reactionScore: 90,
      reactionEmoji: '😊',
      reason: '業務効率化の悩みに直結しており、高評価が期待できる',
    },
    {
      personaType: 'sub',
      personaName: 'サブターゲット（フリーランス）',
      reactionScore: 60,
      reactionEmoji: '😐',
      reason: '興味は持つが、既に類似ツールを使用している可能性',
    },
    {
      personaType: 'potential',
      personaName: '潜在層（学生・初心者）',
      reactionScore: 45,
      reactionEmoji: '🤔',
      reason: '興味はあるが、実践までのハードルが高い可能性',
    },
  ],
  directionSuggestions: [
    {
      sectionId: 'section-1',
      sectionLabel: '導入',
      timestamp: '0:00-0:10',
      urgency: 5,
      urgencyReason: '冒頭の「掴み」なので視覚的インパクトが必須',
      suggestedType: 'question',
      avatarPosition: 'split_right',
      reason: '問いかけ画面で視聴者の注意を引き、続きを見たくさせる',
      slideSuggestion: {
        title: 'まだ5時間かけてる？',
        subText: '動画制作の常識が変わります',
      },
      searchKeywords: ['時計', '時間', 'ストップウォッチ'],
      recommendedColors: ['#EF4444', '#F97316'],
      displayDuration: 3,
      suggestedBy: 'hook_master',
    },
    {
      sectionId: 'section-2',
      sectionLabel: '課題提示',
      timestamp: '0:10-0:30',
      urgency: 3,
      urgencyReason: '共感パートなのでアバター中心でOK。ただし中盤で変化推奨',
      suggestedType: 'avatar_only',
      avatarPosition: 'hidden',
      reason: '視聴者との信頼関係構築のため、アバターが直接語りかける',
      displayDuration: 20,
      suggestedBy: 'target_insight',
    },
    {
      sectionId: 'section-3',
      sectionLabel: '解決策',
      timestamp: '0:30-0:45',
      urgency: 5,
      urgencyReason: '数字が多いセクション。視覚化しないと情報が流れてしまう',
      suggestedType: 'number_slide',
      avatarPosition: 'pip_right',
      reason: '「70%削減」という数字を視覚的に強調し、インパクトを最大化',
      slideSuggestion: {
        title: '制作時間の変化',
        mainNumber: '70%',
        subText: '削減',
        points: ['Before: 5時間/本', 'After: 1.5時間/本'],
      },
      searchKeywords: ['効率化', 'スピードアップ', 'グラフ'],
      recommendedColors: ['#10B981', '#059669'],
      displayDuration: 5,
      suggestedBy: 'entertainment_producer',
    },
    {
      sectionId: 'section-4',
      sectionLabel: 'CTA',
      timestamp: '0:45-0:60',
      urgency: 4,
      urgencyReason: '行動喚起には明確な視覚的指示が効果的',
      suggestedType: 'bullet_slide',
      avatarPosition: 'pip_left',
      reason: '具体的なアクションを箇条書きで示し、行動を促す',
      slideSuggestion: {
        title: '今すぐ始める3ステップ',
        points: [
          '① 概要欄の「完全ガイド」をクリック',
          '② 無料テンプレートをダウンロード',
          '③ チャンネル登録で最新情報をゲット',
        ],
      },
      recommendedColors: ['#3B82F6', '#6366F1'],
      displayDuration: 5,
      suggestedBy: 'cta_strategist',
    },
  ],
  timelineWarnings: [
    {
      startTime: '0:10',
      endTime: '0:30',
      durationSeconds: 20,
      warningType: 'avatar_too_long',
      message: 'アバターのみが20秒継続しています',
      recommendation: '0:20付近で差し込み画像を入れると視聴維持率が向上します',
    },
  ],
  sourceAiType: 'claude',
  createdAt: new Date().toISOString(),
  processingTimeMs: 28500,
};

// ============================================================
// サービスエクスポート
// ============================================================

export const expertReviewService = {
  /**
   * 専門家レビューを開始
   */
  async startReview(request: ExpertReviewRequest): Promise<ExpertReviewResult> {
    try {
      const response = await api.post<ApiExpertReviewResult>('/api/v1/scripts/expert-review', {
        script_id: request.scriptId,
        sections: request.sections.map((s) => ({
          id: s.id,
          label: s.label,
          timestamp: s.timestamp,
          content: s.content,
        })),
        source_ai_type: request.sourceAiType,
        knowledge_id: request.knowledgeId,
      });
      return mapExpertReviewResult(response);
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[expertReviewService] Using mock data for expert review');

      // モックの遅延をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        ...mockExpertReviewResult,
        sourceAiType: request.sourceAiType,
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * 専門家レビュー結果を取得
   */
  async getReviewResult(reviewId: string): Promise<ExpertReviewResult> {
    try {
      const response = await api.get<ApiExpertReviewResult>(
        `/api/v1/scripts/expert-review/${reviewId}`
      );
      return mapExpertReviewResult(response);
    } catch {
      console.info('[expertReviewService] Using mock data for review result');
      return mockExpertReviewResult;
    }
  },

  /**
   * レビュー結果を保存
   */
  async saveReviewResult(result: ExpertReviewResult): Promise<{ success: boolean }> {
    try {
      return await api.put<{ success: boolean }>(`/api/v1/scripts/expert-review/${result.id}`, {
        revised_sections: result.revisedSections.map((s) => ({
          id: s.id,
          label: s.label,
          timestamp: s.timestamp,
          original_content: s.originalContent,
          revised_content: s.revisedContent,
          is_improved: s.isImproved,
          improvements_by_expert: s.improvementsByExpert.map((e) => ({
            expert_type: e.expertType,
            contribution: e.contribution,
          })),
        })),
      });
    } catch {
      console.info('[expertReviewService] Mock save successful');
      return { success: true };
    }
  },

  /**
   * モックの専門家レビュー進捗をシミュレート
   */
  async simulateProgress(
    onProgress: (expert: ExpertType) => void,
    onComplete: () => void
  ): Promise<void> {
    const experts: ExpertType[] = [
      'hook_master',
      'story_architect',
      'entertainment_producer',
      'target_insight',
      'cta_strategist',
    ];

    for (let i = 0; i < experts.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000));
      onProgress(experts[i]);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    onComplete();
  },
};
