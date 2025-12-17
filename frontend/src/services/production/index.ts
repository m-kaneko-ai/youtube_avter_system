/**
 * Production Service (Audio, Avatar, B-roll)
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from '../api';
import type {
  AudioGenerateRequest,
  AudioGenerateResponse,
  AvatarGenerateRequest,
  AvatarGenerateResponse,
  BrollGenerateRequest,
  BrollGenerateResponse,
  VoiceModelsResponse,
  VoiceProjectsResponse,
  AvatarModelsResponse,
  AvatarProjectsResponse,
  EditProjectsResponse,
  AudioGeneration,
  AvatarGeneration,
  BrollGeneration,
  VideoForReview,
  ApiVoiceModel,
  ApiVoiceProject,
  ApiAudioGeneration,
  ApiAvatarModel,
  ApiAvatarProject,
  ApiAvatarGeneration,
  ApiEditProject,
  ApiBrollGeneration,
  ApiVideoForReview,
} from './types';
import {
  mapVoiceModel,
  mapVoiceProject,
  mapAudioGeneration,
  mapAvatarModel,
  mapAvatarProject,
  mapAvatarGeneration,
  mapEditProject,
  mapBrollGeneration,
  mapVideoForReview,
} from './mappers';
import {
  mockVoiceModels,
  mockVoiceProjects,
  mockAvatarModels,
  mockAvatarProjects,
  mockEditProjects,
  mockVideoForReview,
} from './mocks';

export const productionService = {
  /**
   * ボイスモデル一覧取得
   */
  async getVoiceModels(): Promise<VoiceModelsResponse> {
    try {
      const response = await api.get<{ models: ApiVoiceModel[] }>('/api/v1/production/voice/models');
      return {
        models: response.models.map(mapVoiceModel),
      };
    } catch {
      console.info('[productionService] Using mock data for voice models');
      return {
        models: mockVoiceModels,
      };
    }
  },

  /**
   * 音声プロジェクト一覧取得
   */
  async getVoiceProjects(): Promise<VoiceProjectsResponse> {
    try {
      const response = await api.get<{ projects: ApiVoiceProject[]; total: number }>(
        '/api/v1/production/voice/projects'
      );
      return {
        projects: response.projects.map(mapVoiceProject),
        total: response.total,
      };
    } catch {
      console.info('[productionService] Using mock data for voice projects');
      return {
        projects: mockVoiceProjects,
        total: mockVoiceProjects.length,
      };
    }
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
    try {
      const response = await api.get<{ avatars: ApiAvatarModel[] }>('/api/v1/production/avatar/list');
      return {
        avatars: response.avatars.map(mapAvatarModel),
      };
    } catch {
      console.info('[productionService] Using mock data for avatar models');
      return {
        avatars: mockAvatarModels,
      };
    }
  },

  /**
   * アバタープロジェクト一覧取得
   */
  async getAvatarProjects(): Promise<AvatarProjectsResponse> {
    try {
      const response = await api.get<{ projects: ApiAvatarProject[]; total: number }>(
        '/api/v1/production/avatar/projects'
      );
      return {
        projects: response.projects.map(mapAvatarProject),
        total: response.total,
      };
    } catch {
      console.info('[productionService] Using mock data for avatar projects');
      return {
        projects: mockAvatarProjects,
        total: mockAvatarProjects.length,
      };
    }
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
    try {
      const response = await api.get<{ projects: ApiEditProject[]; total: number }>(
        '/api/v1/production/edit/projects'
      );
      return {
        projects: response.projects.map(mapEditProject),
        total: response.total,
      };
    } catch {
      console.info('[productionService] Using mock data for edit projects');
      return {
        projects: mockEditProjects,
        total: mockEditProjects.length,
      };
    }
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
    try {
      const response = await api.get<ApiVideoForReview>(`/api/v1/production/quality/${videoId}`);
      return mapVideoForReview(response);
    } catch {
      console.info('[productionService] Using mock data for video review');
      return mockVideoForReview;
    }
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

export * from './types';
