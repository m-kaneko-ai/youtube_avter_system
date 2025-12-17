/**
 * Expert Review Types
 *
 * 台本専門家レビュー機能の型定義
 */

// ============================================================
// Expert Feedback
// ============================================================

export interface ExpertFeedback {
  expert_name: string;
  expert_icon: string; // 🎣, 🎬, 🎭, 🎯, 📣
  score: number; // 0-100
  category: 'hook' | 'structure' | 'entertainment' | 'target' | 'cta';
  feedback: string;
  improvements: string[];
}

// ============================================================
// Checklist
// ============================================================

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
}

// ============================================================
// Before/After Comparison
// ============================================================

export interface BeforeAfterComparison {
  hook_score: { before: number; after: number };
  structure_score: { before: number; after: number };
  entertainment_score: { before: number; after: number };
  target_score: { before: number; after: number };
}

// ============================================================
// Persona Reaction
// ============================================================

export interface PersonaReaction {
  persona_name: string;
  age: string;
  reaction: string;
  engagement_prediction: 'high' | 'medium' | 'low';
  quote: string;
}

// ============================================================
// Request/Response
// ============================================================

export interface ExpertReviewRequest {
  script_id?: string;
  gemini_script: string;
  claude_script: string;
  knowledge_id?: string;
}

export interface ExpertReviewResponse {
  overall_score: number;
  publish_ready: boolean;
  expert_feedbacks: ExpertFeedback[];
  checklist: ChecklistItem[];
  before_after: BeforeAfterComparison;
  improved_script: string;
  persona_reactions: PersonaReaction[];
}
