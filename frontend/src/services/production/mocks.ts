/**
 * Production Service - Mock Data
 *
 * 開発・テスト用モックデータ
 */
import type {
  VoiceModel,
  VoiceProject,
  AvatarModel,
  AvatarProject,
  EditProject,
  VideoForReview,
} from './types';

export const mockVoiceModels: VoiceModel[] = [
  {
    id: 'voice-1',
    name: 'ナレーター（男性）',
    provider: 'minimax',
    language: 'ja',
    gender: 'male',
    previewUrl: undefined,
    isCloned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'voice-2',
    name: 'ナレーター（女性）',
    provider: 'minimax',
    language: 'ja',
    gender: 'female',
    previewUrl: undefined,
    isCloned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'voice-3',
    name: 'カスタムボイス A',
    provider: 'elevenlabs',
    language: 'ja',
    gender: 'male',
    previewUrl: undefined,
    isCloned: true,
    createdAt: new Date().toISOString(),
  },
];

export const mockVoiceProjects: VoiceProject[] = [
  {
    id: 'vp-1',
    title: 'AIツール解説動画 - 音声',
    status: 'completed',
    progress: 100,
    audioUrl: undefined,
    duration: 180,
    voiceModelId: 'voice-1',
    voiceModelName: 'ナレーター（男性）',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'vp-2',
    title: 'プログラミング入門 - 音声',
    status: 'generating',
    progress: 65,
    audioUrl: undefined,
    duration: undefined,
    voiceModelId: 'voice-2',
    voiceModelName: 'ナレーター（女性）',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockAvatarModels: AvatarModel[] = [
  {
    id: 'avatar-1',
    name: 'ビジネスマン A',
    provider: 'heygen',
    previewUrl: undefined,
    thumbnailUrl: undefined,
    gender: 'male',
    style: 'realistic',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-2',
    name: 'プレゼンター B',
    provider: 'heygen',
    previewUrl: undefined,
    thumbnailUrl: undefined,
    gender: 'female',
    style: 'realistic',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avatar-3',
    name: 'アニメキャラ C',
    provider: 'synthesia',
    previewUrl: undefined,
    thumbnailUrl: undefined,
    gender: 'female',
    style: 'anime',
    createdAt: new Date().toISOString(),
  },
];

export const mockAvatarProjects: AvatarProject[] = [
  {
    id: 'ap-1',
    title: 'AIツール解説動画 - アバター',
    status: 'completed',
    progress: 100,
    videoUrl: undefined,
    thumbnailUrl: undefined,
    duration: 180,
    avatarId: 'avatar-1',
    avatarName: 'ビジネスマン A',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockEditProjects: EditProject[] = [
  {
    id: 'ep-1',
    title: 'AIツール解説動画 - 編集中',
    status: 'editing',
    thumbnailUrl: undefined,
    duration: 180,
    elementsCount: 12,
    lastEditedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockVideoForReview: VideoForReview = {
  id: 'video-review-1',
  title: 'AIツール活用術【初心者向け完全ガイド】',
  videoUrl: '',
  thumbnailUrl: undefined,
  duration: 480,
  status: 'pending_review',
  qualityScores: {
    overall: 85,
    audio: 90,
    video: 82,
    sync: 88,
  },
  issues: [
    {
      type: 'audio',
      timestamp: 45,
      description: '軽微な背景ノイズが検出されました',
      severity: 'low',
    },
    {
      type: 'video',
      timestamp: 120,
      description: '一部フレームでわずかなブレが検出されました',
      severity: 'low',
    },
  ],
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
};
