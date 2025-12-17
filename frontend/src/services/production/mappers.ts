/**
 * Production Service - Data Mappers
 *
 * API型とフロントエンド型のマッピング関数
 */
import type {
  ApiVoiceModel,
  VoiceModel,
  ApiAudioGeneration,
  AudioGeneration,
  ApiVoiceProject,
  VoiceProject,
  ApiAvatarModel,
  AvatarModel,
  ApiAvatarGeneration,
  AvatarGeneration,
  ApiAvatarProject,
  AvatarProject,
  ApiBrollGeneration,
  BrollGeneration,
  ApiEditProject,
  EditProject,
  ApiVideoForReview,
  VideoForReview,
} from './types';

export const mapVoiceModel = (model: ApiVoiceModel): VoiceModel => ({
  id: model.id,
  name: model.name,
  provider: model.provider,
  language: model.language,
  gender: model.gender,
  previewUrl: model.preview_url,
  isCloned: model.is_cloned,
  createdAt: model.created_at,
});

export const mapAudioGeneration = (audio: ApiAudioGeneration): AudioGeneration => ({
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

export const mapVoiceProject = (project: ApiVoiceProject): VoiceProject => ({
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

export const mapAvatarModel = (avatar: ApiAvatarModel): AvatarModel => ({
  id: avatar.id,
  name: avatar.name,
  provider: avatar.provider,
  previewUrl: avatar.preview_url,
  thumbnailUrl: avatar.thumbnail_url,
  gender: avatar.gender,
  style: avatar.style,
  createdAt: avatar.created_at,
});

export const mapAvatarGeneration = (avatar: ApiAvatarGeneration): AvatarGeneration => ({
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

export const mapAvatarProject = (project: ApiAvatarProject): AvatarProject => ({
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

export const mapBrollGeneration = (broll: ApiBrollGeneration): BrollGeneration => ({
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

export const mapEditProject = (project: ApiEditProject): EditProject => ({
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

export const mapVideoForReview = (video: ApiVideoForReview): VideoForReview => ({
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
