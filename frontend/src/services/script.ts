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
// モックデータ（API接続エラー時のフォールバック）
// ============================================================

const mockTitleSuggestions: TitleSuggestion[] = [
  {
    id: 'title-1',
    title: '【完全版】AIツール活用術10選｜初心者でも今日から使える',
    ctrPrediction: 8.5,
    style: 'listicle',
    keywords: ['AI', 'ツール', '初心者'],
    isSelected: false,
  },
  {
    id: 'title-2',
    title: '知らないと損！ChatGPTの隠れた機能5つ',
    ctrPrediction: 9.2,
    style: 'hook',
    keywords: ['ChatGPT', '機能', '裏技'],
    isSelected: true,
  },
  {
    id: 'title-3',
    title: 'なぜプロはこのAIツールを使うのか？',
    ctrPrediction: 7.8,
    style: 'question',
    keywords: ['プロ', 'AI', 'ツール'],
    isSelected: false,
  },
  {
    id: 'title-4',
    title: '【保存版】生成AIの使い方完全ガイド',
    ctrPrediction: 8.1,
    style: 'howto',
    keywords: ['生成AI', '使い方', 'ガイド'],
    isSelected: false,
  },
];

const mockSEOData: SEOData = {
  score: {
    overall: 78,
    title: 85,
    description: 72,
    tags: 80,
    hashtags: 75,
  },
  description: 'この動画では、AIツールの基本的な使い方から応用テクニックまで徹底解説します。初心者の方でも分かりやすく、すぐに実践できる内容となっています。',
  tags: ['AI', 'ChatGPT', 'Claude', '生成AI', 'AIツール', '初心者向け', 'チュートリアル'],
  hashtags: ['#AI活用', '#ChatGPT', '#生成AI', '#AIツール'],
  keywords: [
    { word: 'AI', volume: 12000, difficulty: 'hard', included: true },
    { word: 'ChatGPT', volume: 8500, difficulty: 'medium', included: true },
    { word: '生成AI', volume: 4200, difficulty: 'easy', included: true },
    { word: 'AIツール', volume: 2800, difficulty: 'easy', included: false },
  ],
};

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
    try {
      const response = await api.get<ApiTitleListResponse>(`/api/v1/scripts/${scriptId}/titles`);
      return {
        suggestions: response.data.map(mapTitleSuggestion),
        scriptId: response.script_id,
      };
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[scriptService] Using mock data for titles');
      return {
        suggestions: mockTitleSuggestions,
        scriptId,
      };
    }
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
    try {
      const response = await api.get<ApiSEOResponse>(`/api/v1/scripts/${scriptId}/seo`);
      return {
        data: mapSEOData(response.data),
        scriptId: response.script_id,
      };
    } catch {
      // API接続エラー時はモックデータを返す
      console.info('[scriptService] Using mock data for SEO');
      return {
        data: mockSEOData,
        scriptId,
      };
    }
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
