/**
 * Production Service (Audio, Avatar, B-roll)
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from './api';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

type ApiGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

interface ApiVoiceModel {
  id: string;
  name: string;
  provider: 'minimax' | 'elevenlabs';
  language: string;
  gender: 'male' | 'female';
  preview_url?: string;
  is_cloned: boolean;
  created_at: string;
}

interface ApiAudioGeneration {
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

interface ApiAvatarModel {
  id: string;
  name: string;
  provider: 'heygen' | 'synthesia';
  preview_url?: string;
  thumbnail_url?: string;
  gender: 'male' | 'female';
  style: 'realistic' | 'cartoon' | 'anime';
  created_at: string;
}

interface ApiAvatarGeneration {
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

interface ApiBrollGeneration {
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

interface ApiVoiceProject {
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

interface ApiAvatarProject {
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

interface ApiEditProject {
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

interface ApiVideoForReview {
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

// ============================================================
// フロントエンド用型（camelCase）
// ============================================================

export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

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

export interface QualityIssue {
  type: 'audio' | 'video' | 'sync' | 'content';
  timestamp: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
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
// マッピング関数
// ============================================================

const mapVoiceModel = (model: ApiVoiceModel): VoiceModel => ({
  id: model.id,
  name: model.name,
  provider: model.provider,
  language: model.language,
  gender: model.gender,
  previewUrl: model.preview_url,
  isCloned: model.is_cloned,
  createdAt: model.created_at,
});

const mapAudioGeneration = (audio: ApiAudioGeneration): AudioGeneration => ({
  id: audio.id,
  videoId: audio.video_id,
  scriptId: audio.script_id,
  voiceId: audio.voice_id,
  voiceName: audio.voice_name,
  text: audio.text,
  audioUrl: audio.audio_url,
  duration: audio.duration,
  status: audio.status,
  speed: audio.speed,
  pitch: audio.pitch,
  errorMessage: audio.error_message,
  createdAt: audio.created_at,
  updatedAt: audio.updated_at,
});

const mapAvatarModel = (avatar: ApiAvatarModel): AvatarModel => ({
  id: avatar.id,
  name: avatar.name,
  provider: avatar.provider,
  previewUrl: avatar.preview_url,
  thumbnailUrl: avatar.thumbnail_url,
  gender: avatar.gender,
  style: avatar.style,
  createdAt: avatar.created_at,
});

const mapAvatarGeneration = (avatar: ApiAvatarGeneration): AvatarGeneration => ({
  id: avatar.id,
  videoId: avatar.video_id,
  audioId: avatar.audio_id,
  avatarId: avatar.avatar_id,
  avatarName: avatar.avatar_name,
  videoUrl: avatar.video_url,
  thumbnailUrl: avatar.thumbnail_url,
  duration: avatar.duration,
  width: avatar.width,
  height: avatar.height,
  status: avatar.status,
  heygenTaskId: avatar.heygen_task_id,
  errorMessage: avatar.error_message,
  createdAt: avatar.created_at,
  updatedAt: avatar.updated_at,
});

const mapBrollGeneration = (broll: ApiBrollGeneration): BrollGeneration => ({
  id: broll.id,
  videoId: broll.video_id,
  prompt: broll.prompt,
  style: broll.style,
  videoUrl: broll.video_url,
  thumbnailUrl: broll.thumbnail_url,
  duration: broll.duration,
  width: broll.width,
  height: broll.height,
  status: broll.status,
  veoTaskId: broll.veo_task_id,
  timestampStart: broll.timestamp_start,
  timestampEnd: broll.timestamp_end,
  errorMessage: broll.error_message,
  createdAt: broll.created_at,
  updatedAt: broll.updated_at,
});

const mapVoiceProject = (project: ApiVoiceProject): VoiceProject => ({
  id: project.id,
  title: project.title,
  status: project.status,
  progress: project.progress,
  audioUrl: project.audio_url,
  duration: project.duration,
  voiceModelId: project.voice_model_id,
  voiceModelName: project.voice_model_name,
  createdAt: project.created_at,
  updatedAt: project.updated_at,
});

const mapAvatarProject = (project: ApiAvatarProject): AvatarProject => ({
  id: project.id,
  title: project.title,
  status: project.status,
  progress: project.progress,
  videoUrl: project.video_url,
  thumbnailUrl: project.thumbnail_url,
  duration: project.duration,
  avatarId: project.avatar_id,
  avatarName: project.avatar_name,
  createdAt: project.created_at,
  updatedAt: project.updated_at,
});

const mapEditProject = (project: ApiEditProject): EditProject => ({
  id: project.id,
  title: project.title,
  status: project.status,
  thumbnailUrl: project.thumbnail_url,
  duration: project.duration,
  elementsCount: project.elements_count,
  lastEditedAt: project.last_edited_at,
  createdAt: project.created_at,
  updatedAt: project.updated_at,
});

const mapVideoForReview = (video: ApiVideoForReview): VideoForReview => ({
  id: video.id,
  title: video.title,
  videoUrl: video.video_url,
  thumbnailUrl: video.thumbnail_url,
  duration: video.duration,
  status: video.status,
  qualityScores: video.quality_scores,
  issues: video.issues,
  createdAt: video.created_at,
  updatedAt: video.updated_at,
});

// ============================================================
// リクエスト型
// ============================================================

interface AudioGenerateRequest {
  videoId: string;
  scriptId?: string;
  voiceId: string;
  text?: string;
  speed?: number;
  pitch?: number;
}

interface AvatarGenerateRequest {
  videoId: string;
  audioId: string;
  avatarId: string;
  background?: string;
}

interface BrollGenerateRequest {
  videoId: string;
  prompt: string;
  style?: string;
  duration?: number;
  timestampStart?: number;
  timestampEnd?: number;
}

// ============================================================
// レスポンス型
// ============================================================

interface AudioGenerateResponse {
  audio: AudioGeneration;
  estimatedDurationSeconds: number;
}

interface AvatarGenerateResponse {
  avatar: AvatarGeneration;
  estimatedDurationSeconds: number;
}

interface BrollGenerateResponse {
  broll: BrollGeneration;
  estimatedDurationSeconds: number;
}

interface VoiceModelsResponse {
  models: VoiceModel[];
}

interface VoiceProjectsResponse {
  projects: VoiceProject[];
  total: number;
}

interface AvatarModelsResponse {
  avatars: AvatarModel[];
}

interface AvatarProjectsResponse {
  projects: AvatarProject[];
  total: number;
}

interface EditProjectsResponse {
  projects: EditProject[];
  total: number;
}

// ============================================================
// サービスエクスポート
// ============================================================

export const productionService = {
  /**
   * ボイスモデル一覧取得
   */
  async getVoiceModels(): Promise<VoiceModelsResponse> {
    const response = await api.get<{ models: ApiVoiceModel[] }>('/api/v1/production/voice/models');
    return {
      models: response.models.map(mapVoiceModel),
    };
  },

  /**
   * 音声プロジェクト一覧取得
   */
  async getVoiceProjects(): Promise<VoiceProjectsResponse> {
    const response = await api.get<{ projects: ApiVoiceProject[]; total: number }>(
      '/api/v1/production/voice/projects'
    );
    return {
      projects: response.projects.map(mapVoiceProject),
      total: response.total,
    };
  },

  /**
   * 音声生成
   */
  async generateAudio(request: AudioGenerateRequest): Promise<AudioGenerateResponse> {
    const response = await api.post<{ audio: ApiAudioGeneration; estimated_duration_seconds: number }>(
      '/api/v1/audio/generate',
      {
        video_id: request.videoId,
        script_id: request.scriptId,
        voice_id: request.voiceId,
        text: request.text,
        speed: request.speed,
        pitch: request.pitch,
      }
    );
    return {
      audio: mapAudioGeneration(response.audio),
      estimatedDurationSeconds: response.estimated_duration_seconds,
    };
  },

  /**
   * 音声生成状態取得
   */
  async getAudio(audioId: string): Promise<AudioGeneration> {
    const response = await api.get<ApiAudioGeneration>(`/api/v1/audio/${audioId}`);
    return mapAudioGeneration(response);
  },

  /**
   * アバターモデル一覧取得
   */
  async getAvatarModels(): Promise<AvatarModelsResponse> {
    const response = await api.get<{ avatars: ApiAvatarModel[] }>('/api/v1/production/avatar/list');
    return {
      avatars: response.avatars.map(mapAvatarModel),
    };
  },

  /**
   * アバタープロジェクト一覧取得
   */
  async getAvatarProjects(): Promise<AvatarProjectsResponse> {
    const response = await api.get<{ projects: ApiAvatarProject[]; total: number }>(
      '/api/v1/production/avatar/projects'
    );
    return {
      projects: response.projects.map(mapAvatarProject),
      total: response.total,
    };
  },

  /**
   * アバター動画生成
   */
  async generateAvatar(request: AvatarGenerateRequest): Promise<AvatarGenerateResponse> {
    const response = await api.post<{ avatar: ApiAvatarGeneration; estimated_duration_seconds: number }>(
      '/api/v1/avatar/generate',
      {
        video_id: request.videoId,
        audio_id: request.audioId,
        avatar_id: request.avatarId,
        background: request.background,
      }
    );
    return {
      avatar: mapAvatarGeneration(response.avatar),
      estimatedDurationSeconds: response.estimated_duration_seconds,
    };
  },

  /**
   * アバター動画生成状態取得
   */
  async getAvatar(avatarId: string): Promise<AvatarGeneration> {
    const response = await api.get<ApiAvatarGeneration>(`/api/v1/avatar/${avatarId}`);
    return mapAvatarGeneration(response);
  },

  /**
   * 編集プロジェクト一覧取得
   */
  async getEditProjects(): Promise<EditProjectsResponse> {
    const response = await api.get<{ projects: ApiEditProject[]; total: number }>(
      '/api/v1/production/edit/projects'
    );
    return {
      projects: response.projects.map(mapEditProject),
      total: response.total,
    };
  },

  /**
   * B-roll動画生成
   */
  async generateBroll(request: BrollGenerateRequest): Promise<BrollGenerateResponse> {
    const response = await api.post<{ broll: ApiBrollGeneration; estimated_duration_seconds: number }>(
      '/api/v1/broll/generate',
      {
        video_id: request.videoId,
        prompt: request.prompt,
        style: request.style,
        duration: request.duration,
        timestamp_start: request.timestampStart,
        timestamp_end: request.timestampEnd,
      }
    );
    return {
      broll: mapBrollGeneration(response.broll),
      estimatedDurationSeconds: response.estimated_duration_seconds,
    };
  },

  /**
   * B-roll動画生成状態取得
   */
  async getBroll(brollId: string): Promise<BrollGeneration> {
    const response = await api.get<ApiBrollGeneration>(`/api/v1/broll/${brollId}`);
    return mapBrollGeneration(response);
  },

  /**
   * レビュー用動画取得
   */
  async getVideoForReview(videoId: string): Promise<VideoForReview> {
    const response = await api.get<ApiVideoForReview>(`/api/v1/production/quality/${videoId}`);
    return mapVideoForReview(response);
  },

  /**
   * 動画レビュー送信
   */
  async submitReview(
    videoId: string,
    status: 'approved' | 'rejected' | 'revision_needed',
    comments?: string
  ): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/api/v1/production/quality/${videoId}/review`, {
      status,
      comments,
    });
  },
};
