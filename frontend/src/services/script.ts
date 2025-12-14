/**
 * Script & Metadata Service
 *
 * バックエンドAPIとフロントエンドの型をマッピングして返す
 */
import { api } from './api';

// ============================================================
// バックエンドAPIレスポンス型（snake_case）
// ============================================================

interface ApiScript {
  id: string;
  video_id: string;
  content: string;
  generator_type: 'claude' | 'gemini' | 'manual';
  status: 'draft' | 'generating' | 'generated' | 'approved' | 'rejected';
  version: number;
  word_count?: number;
  estimated_duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

interface ApiTitleSuggestion {
  id: string;
  title: string;
  ctr_prediction: number;
  style: 'hook' | 'howto' | 'listicle' | 'question' | 'challenge';
  keywords: string[];
  is_selected: boolean;
}

interface ApiSEOScore {
  overall: number;
  title: number;
  description: number;
  tags: number;
  hashtags: number;
}

interface ApiKeyword {
  word: string;
  volume: number;
  difficulty: 'easy' | 'medium' | 'hard';
  included: boolean;
}

interface ApiSEOData {
  score: ApiSEOScore;
  description: string;
  tags: string[];
  hashtags: string[];
  keywords: ApiKeyword[];
}

interface ApiThumbnail {
  id: string;
  video_id: string;
  image_url: string;
  prompt?: string;
  status: 'draft' | 'generating' | 'generated' | 'approved' | 'rejected';
  version: number;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// バックエンドレスポンス型
// ============================================================

interface ApiScriptGenerateResponse {
  script: ApiScript;
  generation_time_ms: number;
}

interface ApiTitleListResponse {
  data: ApiTitleSuggestion[];
  script_id: string;
}

interface ApiTitleGenerateResponse {
  data: ApiTitleSuggestion[];
  recommended_index: number;
}

interface ApiSEOResponse {
  data: ApiSEOData;
  script_id: string;
}

interface ApiDescriptionGenerateResponse {
  description: string;
  hashtags: string[];
}

interface ApiThumbnailGenerateResponse {
  thumbnail: ApiThumbnail;
  generation_time_ms: number;
}

// ============================================================
// フロントエンド用型
// ============================================================

export interface Script {
  id: string;
  videoId: string;
  content: string;
  generatorType: 'claude' | 'gemini' | 'manual';
  status: 'draft' | 'generating' | 'generated' | 'approved' | 'rejected';
  version: number;
  wordCount?: number;
  estimatedDurationSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TitleSuggestion {
  id: string;
  title: string;
  ctrPrediction: number;
  style: 'hook' | 'howto' | 'listicle' | 'question' | 'challenge';
  keywords: string[];
  isSelected: boolean;
}

export interface SEOScore {
  overall: number;
  title: number;
  description: number;
  tags: number;
  hashtags: number;
}

export interface Keyword {
  word: string;
  volume: number;
  difficulty: 'easy' | 'medium' | 'hard';
  included: boolean;
}

export interface SEOData {
  score: SEOScore;
  description: string;
  tags: string[];
  hashtags: string[];
  keywords: Keyword[];
}

export interface Thumbnail {
  id: string;
  videoId: string;
  imageUrl: string;
  prompt?: string;
  status: 'draft' | 'generating' | 'generated' | 'approved' | 'rejected';
  version: number;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// リクエスト型
// ============================================================

interface ScriptGenerateRequest {
  videoId: string;
  knowledgeId?: string;
  generatorType: 'claude' | 'gemini';
  prompt?: string;
  targetDuration?: number;
  style?: string;
}

interface TitleGenerateRequest {
  videoId: string;
  scriptId?: string;
  count?: number;
  style?: string;
}

interface DescriptionGenerateRequest {
  videoId: string;
  scriptId?: string;
  includeTimestamps?: boolean;
  includeLinks?: boolean;
}

interface ThumbnailGenerateRequest {
  videoId: string;
  prompt?: string;
  style?: string;
  includeText?: boolean;
  textContent?: string;
}

// ============================================================
// マッピング関数
// ============================================================

const mapScript = (script: ApiScript): Script => ({
  id: script.id,
  videoId: script.video_id,
  content: script.content,
  generatorType: script.generator_type,
  status: script.status,
  version: script.version,
  wordCount: script.word_count,
  estimatedDurationSeconds: script.estimated_duration_seconds,
  createdAt: script.created_at,
  updatedAt: script.updated_at,
});

const mapTitleSuggestion = (suggestion: ApiTitleSuggestion): TitleSuggestion => ({
  id: suggestion.id,
  title: suggestion.title,
  ctrPrediction: suggestion.ctr_prediction,
  style: suggestion.style,
  keywords: suggestion.keywords,
  isSelected: suggestion.is_selected,
});

const mapSEOData = (data: ApiSEOData): SEOData => ({
  score: data.score,
  description: data.description,
  tags: data.tags,
  hashtags: data.hashtags,
  keywords: data.keywords,
});

const mapThumbnail = (thumbnail: ApiThumbnail): Thumbnail => ({
  id: thumbnail.id,
  videoId: thumbnail.video_id,
  imageUrl: thumbnail.image_url,
  prompt: thumbnail.prompt,
  status: thumbnail.status,
  version: thumbnail.version,
  width: thumbnail.width,
  height: thumbnail.height,
  createdAt: thumbnail.created_at,
  updatedAt: thumbnail.updated_at,
});

// ============================================================
// レスポンス型
// ============================================================

interface ScriptGenerateResponse {
  script: Script;
  generationTimeMs: number;
}

interface TitleListResponse {
  suggestions: TitleSuggestion[];
  scriptId: string;
}

interface TitleGenerateResponse {
  suggestions: TitleSuggestion[];
  recommendedIndex: number;
}

interface SEOResponse {
  data: SEOData;
  scriptId: string;
}

interface DescriptionGenerateResponse {
  description: string;
  hashtags: string[];
}

interface ThumbnailGenerateResponse {
  thumbnail: Thumbnail;
  generationTimeMs: number;
}

// ============================================================
// サービスエクスポート
// ============================================================

export const scriptService = {
  /**
   * 台本生成
   */
  async generateScript(request: ScriptGenerateRequest): Promise<ScriptGenerateResponse> {
    const response = await api.post<ApiScriptGenerateResponse>('/api/v1/scripts/generate', {
      video_id: request.videoId,
      knowledge_id: request.knowledgeId,
      generator_type: request.generatorType,
      prompt: request.prompt,
      target_duration: request.targetDuration,
      style: request.style,
    });
    return {
      script: mapScript(response.script),
      generationTimeMs: response.generation_time_ms,
    };
  },

  /**
   * 台本取得
   */
  async getScript(scriptId: string): Promise<Script> {
    const response = await api.get<ApiScript>(`/api/v1/scripts/${scriptId}`);
    return mapScript(response);
  },

  /**
   * 台本更新
   */
  async updateScript(scriptId: string, content: string): Promise<Script> {
    const response = await api.put<ApiScript>(`/api/v1/scripts/${scriptId}`, { content });
    return mapScript(response);
  },

  /**
   * タイトル候補取得
   */
  async getTitles(scriptId: string): Promise<TitleListResponse> {
    const response = await api.get<ApiTitleListResponse>(`/api/v1/scripts/${scriptId}/titles`);
    return {
      suggestions: response.data.map(mapTitleSuggestion),
      scriptId: response.script_id,
    };
  },

  /**
   * タイトル生成
   */
  async generateTitles(request: TitleGenerateRequest): Promise<TitleGenerateResponse> {
    const response = await api.post<ApiTitleGenerateResponse>('/api/v1/metadata/title', {
      video_id: request.videoId,
      script_id: request.scriptId,
      count: request.count,
      style: request.style,
    });
    return {
      suggestions: response.data.map(mapTitleSuggestion),
      recommendedIndex: response.recommended_index,
    };
  },

  /**
   * タイトル選択
   */
  async selectTitle(scriptId: string, titleId: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/api/v1/scripts/${scriptId}/titles/${titleId}/select`);
  },

  /**
   * SEOデータ取得
   */
  async getSEOData(scriptId: string): Promise<SEOResponse> {
    const response = await api.get<ApiSEOResponse>(`/api/v1/scripts/${scriptId}/seo`);
    return {
      data: mapSEOData(response.data),
      scriptId: response.script_id,
    };
  },

  /**
   * 説明文生成
   */
  async generateDescription(request: DescriptionGenerateRequest): Promise<DescriptionGenerateResponse> {
    return api.post<ApiDescriptionGenerateResponse>('/api/v1/metadata/description', {
      video_id: request.videoId,
      script_id: request.scriptId,
      include_timestamps: request.includeTimestamps,
      include_links: request.includeLinks,
    });
  },

  /**
   * SEOデータ更新
   */
  async updateSEOData(scriptId: string, data: Partial<SEOData>): Promise<SEOData> {
    const response = await api.put<ApiSEOData>(`/api/v1/scripts/${scriptId}/seo`, data);
    return mapSEOData(response);
  },

  /**
   * サムネイル生成
   */
  async generateThumbnail(request: ThumbnailGenerateRequest): Promise<ThumbnailGenerateResponse> {
    const response = await api.post<ApiThumbnailGenerateResponse>('/api/v1/thumbnails/generate', {
      video_id: request.videoId,
      prompt: request.prompt,
      style: request.style,
      include_text: request.includeText,
      text_content: request.textContent,
    });
    return {
      thumbnail: mapThumbnail(response.thumbnail),
      generationTimeMs: response.generation_time_ms,
    };
  },

  /**
   * サムネイル取得
   */
  async getThumbnail(thumbnailId: string): Promise<Thumbnail> {
    const response = await api.get<ApiThumbnail>(`/api/v1/thumbnails/${thumbnailId}`);
    return mapThumbnail(response);
  },
};
