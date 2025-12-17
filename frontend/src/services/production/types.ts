/**
 * Production Service - Type Definitions
 *
 * API型定義とフロントエンド型定義
 */

// ============================================================
// 共通型
// ============================================================

export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';
type ApiGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

// ============================================================
// Voice Model Types
// ============================================================

export interface ApiVoiceModel {
  id: string;
  name: string;
  provider: 'minimax' | 'elevenlabs';
  language: string;
  gender: 'male' | 'female';
  preview_url?: string;
  is_cloned: boolean;
  created_at: string;
}

export interface VoiceModel {
  id: string;
  name: string;
  provider: 'minimax' | 'elevenlabs';
  language: string;
  gender: 'male' | 'female';
  previewUrl?: string;
  isCloned: boolean;
  createdAt: string;
}

// ============================================================
// Audio Generation Types
// ============================================================

export interface ApiAudioGeneration {
  id: string;
  video_id: string;
  script_id?: string;
  voice_id?: string;
  voice_name?: string;
  text?: string;
  audio_url?: string;
  duration?: number;
  status: ApiGenerationStatus;
  speed?: number;
  pitch?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AudioGeneration {
  id: string;
  videoId: string;
  scriptId?: string;
  voiceId?: string;
  voiceName?: string;
  text?: string;
  audioUrl?: string;
  duration?: number;
  status: GenerationStatus;
  speed?: number;
  pitch?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiVoiceProject {
  id: string;
  title: string;
  status: ApiGenerationStatus;
  progress: number;
  audio_url?: string;
  duration?: number;
  voice_model_id: string;
  voice_model_name: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceProject {
  id: string;
  title: string;
  status: GenerationStatus;
  progress: number;
  audioUrl?: string;
  duration?: number;
  voiceModelId: string;
  voiceModelName: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Avatar Types
// ============================================================

export interface ApiAvatarModel {
  id: string;
  name: string;
  provider: 'heygen' | 'synthesia';
  preview_url?: string;
  thumbnail_url?: string;
  gender: 'male' | 'female';
  style: 'realistic' | 'cartoon' | 'anime';
  created_at: string;
}

export interface AvatarModel {
  id: string;
  name: string;
  provider: 'heygen' | 'synthesia';
  previewUrl?: string;
  thumbnailUrl?: string;
  gender: 'male' | 'female';
  style: 'realistic' | 'cartoon' | 'anime';
  createdAt: string;
}

export interface ApiAvatarGeneration {
  id: string;
  video_id: string;
  audio_id?: string;
  avatar_id?: string;
  avatar_name?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  status: ApiGenerationStatus;
  heygen_task_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AvatarGeneration {
  id: string;
  videoId: string;
  audioId?: string;
  avatarId?: string;
  avatarName?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  status: GenerationStatus;
  heygenTaskId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiAvatarProject {
  id: string;
  title: string;
  status: ApiGenerationStatus;
  progress: number;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  avatar_id: string;
  avatar_name: string;
  created_at: string;
  updated_at: string;
}

export interface AvatarProject {
  id: string;
  title: string;
  status: GenerationStatus;
  progress: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  avatarId: string;
  avatarName: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// B-roll Types
// ============================================================

export interface ApiBrollGeneration {
  id: string;
  video_id: string;
  prompt?: string;
  style?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  status: ApiGenerationStatus;
  veo_task_id?: string;
  timestamp_start?: number;
  timestamp_end?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface BrollGeneration {
  id: string;
  videoId: string;
  prompt?: string;
  style?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  status: GenerationStatus;
  veoTaskId?: string;
  timestampStart?: number;
  timestampEnd?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Edit Project Types
// ============================================================

export interface ApiEditProject {
  id: string;
  title: string;
  status: 'pending' | 'editing' | 'review' | 'approved' | 'exported';
  thumbnail_url?: string;
  duration?: number;
  elements_count: number;
  last_edited_at: string;
  created_at: string;
  updated_at: string;
}

export interface EditProject {
  id: string;
  title: string;
  status: 'pending' | 'editing' | 'review' | 'approved' | 'exported';
  thumbnailUrl?: string;
  duration?: number;
  elementsCount: number;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Quality Review Types
// ============================================================

export interface QualityIssue {
  type: 'audio' | 'video' | 'sync' | 'content';
  timestamp: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ApiVideoForReview {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'revision_needed';
  quality_scores: {
    overall: number;
    audio: number;
    video: number;
    sync: number;
  };
  issues: Array<{
    type: 'audio' | 'video' | 'sync' | 'content';
    timestamp: number;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  created_at: string;
  updated_at: string;
}

export interface VideoForReview {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'revision_needed';
  qualityScores: {
    overall: number;
    audio: number;
    video: number;
    sync: number;
  };
  issues: QualityIssue[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Request Types
// ============================================================

export interface AudioGenerateRequest {
  videoId: string;
  scriptId?: string;
  voiceId: string;
  text?: string;
  speed?: number;
  pitch?: number;
}

export interface AvatarGenerateRequest {
  videoId: string;
  audioId: string;
  avatarId: string;
  background?: string;
}

export interface BrollGenerateRequest {
  videoId: string;
  prompt: string;
  style?: string;
  duration?: number;
  timestampStart?: number;
  timestampEnd?: number;
}

// ============================================================
// Response Types
// ============================================================

export interface AudioGenerateResponse {
  audio: AudioGeneration;
  estimatedDurationSeconds: number;
}

export interface AvatarGenerateResponse {
  avatar: AvatarGeneration;
  estimatedDurationSeconds: number;
}

export interface BrollGenerateResponse {
  broll: BrollGeneration;
  estimatedDurationSeconds: number;
}

export interface VoiceModelsResponse {
  models: VoiceModel[];
}

export interface VoiceProjectsResponse {
  projects: VoiceProject[];
  total: number;
}

export interface AvatarModelsResponse {
  avatars: AvatarModel[];
}

export interface AvatarProjectsResponse {
  projects: AvatarProject[];
  total: number;
}

export interface EditProjectsResponse {
  projects: EditProject[];
  total: number;
}
