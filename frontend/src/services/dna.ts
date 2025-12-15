/**
 * DNA Service
 *
 * コンテンツDNA、テンプレート、プロファイル管理API
 */
import { api } from './api';
import type {
  ContentDNA,
  ContentDNACreateRequest,
  ContentDNAUpdateRequest,
  ContentDNAListResponse,
  DNAElement,
  DNATemplate,
  DNATemplateListResponse,
  DNAComparisonRequest,
  DNAComparisonResponse,
  ChannelDNAProfile,
  DNAExtractionRequest,
  DNAExtractionResponse,
  DNASummary,
  DNAElementType,
  DNAStrength,
  DNATemplateStatus,
} from '../types';

// ============================================================
// API レスポンス型定義
// ============================================================

interface ApiContentDNA {
  id: string;
  video_id?: string;
  knowledge_id?: string;
  name?: string;
  description?: string;
  hook_elements?: Record<string, unknown>;
  story_structure?: Record<string, unknown>;
  persona_traits?: Record<string, unknown>;
  visual_elements?: Record<string, unknown>;
  audio_elements?: Record<string, unknown>;
  pacing_data?: Record<string, unknown>;
  emotional_arc?: Record<string, unknown>;
  value_propositions?: Record<string, unknown>;
  cta_patterns?: Record<string, unknown>;
  overall_strength?: number;
  uniqueness_score?: number;
  consistency_score?: number;
  source_videos_count: number;
  last_analyzed_at?: string;
  analysis_version?: string;
  created_at: string;
  updated_at: string;
}

interface ApiDNAElement {
  id: string;
  content_dna_id: string;
  element_type: DNAElementType;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  examples?: Record<string, unknown>;
  timestamps?: number[];
  strength: DNAStrength;
  strength_score?: number;
  impact_on_retention?: number;
  impact_on_engagement?: number;
  created_at: string;
  updated_at: string;
}

interface ApiDNATemplate {
  id: string;
  knowledge_id?: string;
  name: string;
  description?: string;
  category?: string;
  video_type?: string;
  structure: Record<string, unknown>;
  required_elements?: string[];
  optional_elements?: string[];
  source_dna_ids?: string[];
  avg_performance_score?: number;
  status: DNATemplateStatus;
  usage_count: number;
  success_rate?: number;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface ApiDNAComparison {
  id: string;
  source_dna_id: string;
  target_dna_id: string;
  overall_similarity: number;
  hook_similarity?: number;
  structure_similarity?: number;
  style_similarity?: number;
  comparison_details?: Record<string, unknown>;
  shared_elements?: string[];
  unique_to_source?: string[];
  unique_to_target?: string[];
  recommendations?: Record<string, unknown>;
  created_at: string;
}

interface ApiChannelDNAProfile {
  id: string;
  knowledge_id: string;
  channel_name?: string;
  niche?: string;
  signature_elements?: Record<string, unknown>;
  strengths?: string[];
  weaknesses?: string[];
  content_style?: Record<string, unknown>;
  visual_identity?: Record<string, unknown>;
  voice_identity?: Record<string, unknown>;
  best_performing_elements?: Record<string, unknown>;
  underperforming_elements?: Record<string, unknown>;
  improvement_opportunities?: Record<string, unknown>;
  videos_analyzed: number;
  avg_dna_consistency?: number;
  last_updated_at?: string;
  created_at: string;
  updated_at: string;
}

interface ApiDNASummary {
  total_dnas: number;
  total_templates: number;
  total_profiles: number;
  avg_strength_score?: number;
  most_common_elements: string[];
  top_performing_patterns: Record<string, unknown>[];
}

interface ApiDNAExtractionResponse {
  dna_id: string;
  status: string;
  elements_extracted: number;
  processing_time_seconds: number;
  summary: Record<string, unknown>;
}

// ============================================================
// マッピング関数
// ============================================================

const mapContentDNA = (dna: ApiContentDNA): ContentDNA => ({
  id: dna.id,
  videoId: dna.video_id,
  knowledgeId: dna.knowledge_id,
  name: dna.name,
  description: dna.description,
  hookElements: dna.hook_elements,
  storyStructure: dna.story_structure,
  personaTraits: dna.persona_traits,
  visualElements: dna.visual_elements,
  audioElements: dna.audio_elements,
  pacingData: dna.pacing_data,
  emotionalArc: dna.emotional_arc,
  valuePropositions: dna.value_propositions,
  ctaPatterns: dna.cta_patterns,
  overallStrength: dna.overall_strength,
  uniquenessScore: dna.uniqueness_score,
  consistencyScore: dna.consistency_score,
  sourceVideosCount: dna.source_videos_count,
  lastAnalyzedAt: dna.last_analyzed_at,
  analysisVersion: dna.analysis_version,
  createdAt: dna.created_at,
  updatedAt: dna.updated_at,
});

const mapDNAElement = (element: ApiDNAElement): DNAElement => ({
  id: element.id,
  contentDnaId: element.content_dna_id,
  elementType: element.element_type,
  name: element.name,
  description: element.description,
  data: element.data,
  examples: element.examples,
  timestamps: element.timestamps,
  strength: element.strength,
  strengthScore: element.strength_score,
  impactOnRetention: element.impact_on_retention,
  impactOnEngagement: element.impact_on_engagement,
  createdAt: element.created_at,
  updatedAt: element.updated_at,
});

const mapDNATemplate = (template: ApiDNATemplate): DNATemplate => ({
  id: template.id,
  knowledgeId: template.knowledge_id,
  name: template.name,
  description: template.description,
  category: template.category,
  videoType: template.video_type,
  structure: template.structure,
  requiredElements: template.required_elements,
  optionalElements: template.optional_elements,
  sourceDnaIds: template.source_dna_ids,
  avgPerformanceScore: template.avg_performance_score,
  status: template.status,
  usageCount: template.usage_count,
  successRate: template.success_rate,
  tags: template.tags,
  createdBy: template.created_by,
  createdAt: template.created_at,
  updatedAt: template.updated_at,
});

const mapDNAComparison = (comparison: ApiDNAComparison): DNAComparisonResponse => ({
  id: comparison.id,
  sourceDnaId: comparison.source_dna_id,
  targetDnaId: comparison.target_dna_id,
  overallSimilarity: comparison.overall_similarity,
  hookSimilarity: comparison.hook_similarity,
  structureSimilarity: comparison.structure_similarity,
  styleSimilarity: comparison.style_similarity,
  comparisonDetails: comparison.comparison_details,
  sharedElements: comparison.shared_elements,
  uniqueToSource: comparison.unique_to_source,
  uniqueToTarget: comparison.unique_to_target,
  recommendations: comparison.recommendations,
  createdAt: comparison.created_at,
});

const mapChannelProfile = (profile: ApiChannelDNAProfile): ChannelDNAProfile => ({
  id: profile.id,
  knowledgeId: profile.knowledge_id,
  channelName: profile.channel_name,
  niche: profile.niche,
  signatureElements: profile.signature_elements,
  strengths: profile.strengths,
  weaknesses: profile.weaknesses,
  contentStyle: profile.content_style,
  visualIdentity: profile.visual_identity,
  voiceIdentity: profile.voice_identity,
  bestPerformingElements: profile.best_performing_elements,
  underperformingElements: profile.underperforming_elements,
  improvementOpportunities: profile.improvement_opportunities,
  videosAnalyzed: profile.videos_analyzed,
  avgDnaConsistency: profile.avg_dna_consistency,
  lastUpdatedAt: profile.last_updated_at,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

const mapDNASummary = (summary: ApiDNASummary): DNASummary => ({
  totalDnas: summary.total_dnas,
  totalTemplates: summary.total_templates,
  totalProfiles: summary.total_profiles,
  avgStrengthScore: summary.avg_strength_score,
  mostCommonElements: summary.most_common_elements,
  topPerformingPatterns: summary.top_performing_patterns,
});

// ============================================================
// モックデータ
// ============================================================

const mockSummary: DNASummary = {
  totalDnas: 0,
  totalTemplates: 0,
  totalProfiles: 0,
  avgStrengthScore: undefined,
  mostCommonElements: [],
  topPerformingPatterns: [],
};

// ============================================================
// DNA Service
// ============================================================

export const dnaService = {
  // Content DNA
  async getDNAs(params?: {
    knowledgeId?: string;
    videoId?: string;
    skip?: number;
    limit?: number;
  }): Promise<ContentDNAListResponse> {
    try {
      const response = await api.get<{ dnas: ApiContentDNA[]; total: number }>('/api/v1/dna/', {
        params: {
          knowledge_id: params?.knowledgeId,
          video_id: params?.videoId,
          skip: params?.skip,
          limit: params?.limit,
        },
      });
      return {
        dnas: response.dnas.map(mapContentDNA),
        total: response.total,
      };
    } catch {
      return { dnas: [], total: 0 };
    }
  },

  async getDNA(dnaId: string): Promise<ContentDNA> {
    const response = await api.get<ApiContentDNA>(`/api/v1/dna/${dnaId}`);
    return mapContentDNA(response);
  },

  async createDNA(data: ContentDNACreateRequest): Promise<ContentDNA> {
    const response = await api.post<ApiContentDNA>('/api/v1/dna/', {
      video_id: data.videoId,
      knowledge_id: data.knowledgeId,
      name: data.name,
      description: data.description,
      hook_elements: data.hookElements,
      story_structure: data.storyStructure,
      persona_traits: data.personaTraits,
      visual_elements: data.visualElements,
      audio_elements: data.audioElements,
      pacing_data: data.pacingData,
      emotional_arc: data.emotionalArc,
      value_propositions: data.valuePropositions,
      cta_patterns: data.ctaPatterns,
    });
    return mapContentDNA(response);
  },

  async updateDNA(dnaId: string, data: ContentDNAUpdateRequest): Promise<ContentDNA> {
    const response = await api.put<ApiContentDNA>(`/api/v1/dna/${dnaId}`, {
      name: data.name,
      description: data.description,
      hook_elements: data.hookElements,
      story_structure: data.storyStructure,
      persona_traits: data.personaTraits,
      visual_elements: data.visualElements,
      audio_elements: data.audioElements,
      pacing_data: data.pacingData,
      emotional_arc: data.emotionalArc,
      value_propositions: data.valuePropositions,
      cta_patterns: data.ctaPatterns,
      overall_strength: data.overallStrength,
      uniqueness_score: data.uniquenessScore,
      consistency_score: data.consistencyScore,
    });
    return mapContentDNA(response);
  },

  async deleteDNA(dnaId: string): Promise<void> {
    await api.delete(`/api/v1/dna/${dnaId}`);
  },

  // DNA Elements
  async getElements(dnaId: string, elementType?: DNAElementType): Promise<DNAElement[]> {
    try {
      const response = await api.get<ApiDNAElement[]>(`/api/v1/dna/${dnaId}/elements`, {
        params: { element_type: elementType },
      });
      return response.map(mapDNAElement);
    } catch {
      return [];
    }
  },

  // DNA Templates
  async getTemplates(params?: {
    knowledgeId?: string;
    category?: string;
    status?: DNATemplateStatus;
    skip?: number;
    limit?: number;
  }): Promise<DNATemplateListResponse> {
    try {
      const response = await api.get<{ templates: ApiDNATemplate[]; total: number }>(
        '/api/v1/dna/templates',
        {
          params: {
            knowledge_id: params?.knowledgeId,
            category: params?.category,
            status: params?.status,
            skip: params?.skip,
            limit: params?.limit,
          },
        }
      );
      return {
        templates: response.templates.map(mapDNATemplate),
        total: response.total,
      };
    } catch {
      return { templates: [], total: 0 };
    }
  },

  async getTemplate(templateId: string): Promise<DNATemplate> {
    const response = await api.get<ApiDNATemplate>(`/api/v1/dna/templates/${templateId}`);
    return mapDNATemplate(response);
  },

  async createTemplate(data: {
    name: string;
    description?: string;
    category?: string;
    videoType?: string;
    structure: Record<string, unknown>;
    requiredElements?: string[];
    optionalElements?: string[];
    sourceDnaIds?: string[];
    tags?: string[];
    knowledgeId?: string;
  }): Promise<DNATemplate> {
    const response = await api.post<ApiDNATemplate>('/api/v1/dna/templates', {
      name: data.name,
      description: data.description,
      category: data.category,
      video_type: data.videoType,
      structure: data.structure,
      required_elements: data.requiredElements,
      optional_elements: data.optionalElements,
      source_dna_ids: data.sourceDnaIds,
      tags: data.tags,
      knowledge_id: data.knowledgeId,
    });
    return mapDNATemplate(response);
  },

  async updateTemplate(
    templateId: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      videoType?: string;
      structure?: Record<string, unknown>;
      requiredElements?: string[];
      optionalElements?: string[];
      tags?: string[];
      status?: DNATemplateStatus;
    }
  ): Promise<DNATemplate> {
    const response = await api.put<ApiDNATemplate>(`/api/v1/dna/templates/${templateId}`, {
      name: data.name,
      description: data.description,
      category: data.category,
      video_type: data.videoType,
      structure: data.structure,
      required_elements: data.requiredElements,
      optional_elements: data.optionalElements,
      tags: data.tags,
      status: data.status,
    });
    return mapDNATemplate(response);
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await api.delete(`/api/v1/dna/templates/${templateId}`);
  },

  // DNA Comparison
  async compareDNAs(data: DNAComparisonRequest): Promise<DNAComparisonResponse> {
    const response = await api.post<ApiDNAComparison>('/api/v1/dna/compare', {
      source_dna_id: data.sourceDnaId,
      target_dna_id: data.targetDnaId,
    });
    return mapDNAComparison(response);
  },

  // Channel DNA Profile
  async getProfile(knowledgeId: string): Promise<ChannelDNAProfile> {
    const response = await api.get<ApiChannelDNAProfile>(`/api/v1/dna/profiles/${knowledgeId}`);
    return mapChannelProfile(response);
  },

  async createProfile(data: {
    knowledgeId: string;
    channelName?: string;
    niche?: string;
    signatureElements?: Record<string, unknown>;
    strengths?: string[];
    weaknesses?: string[];
    contentStyle?: Record<string, unknown>;
    visualIdentity?: Record<string, unknown>;
    voiceIdentity?: Record<string, unknown>;
    bestPerformingElements?: Record<string, unknown>;
    underperformingElements?: Record<string, unknown>;
    improvementOpportunities?: Record<string, unknown>;
  }): Promise<ChannelDNAProfile> {
    const response = await api.post<ApiChannelDNAProfile>('/api/v1/dna/profiles', {
      knowledge_id: data.knowledgeId,
      channel_name: data.channelName,
      niche: data.niche,
      signature_elements: data.signatureElements,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      content_style: data.contentStyle,
      visual_identity: data.visualIdentity,
      voice_identity: data.voiceIdentity,
      best_performing_elements: data.bestPerformingElements,
      underperforming_elements: data.underperformingElements,
      improvement_opportunities: data.improvementOpportunities,
    });
    return mapChannelProfile(response);
  },

  async updateProfile(
    knowledgeId: string,
    data: {
      channelName?: string;
      niche?: string;
      signatureElements?: Record<string, unknown>;
      strengths?: string[];
      weaknesses?: string[];
      contentStyle?: Record<string, unknown>;
      visualIdentity?: Record<string, unknown>;
      voiceIdentity?: Record<string, unknown>;
      bestPerformingElements?: Record<string, unknown>;
      underperformingElements?: Record<string, unknown>;
      improvementOpportunities?: Record<string, unknown>;
    }
  ): Promise<ChannelDNAProfile> {
    const response = await api.put<ApiChannelDNAProfile>(`/api/v1/dna/profiles/${knowledgeId}`, {
      channel_name: data.channelName,
      niche: data.niche,
      signature_elements: data.signatureElements,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      content_style: data.contentStyle,
      visual_identity: data.visualIdentity,
      voice_identity: data.voiceIdentity,
      best_performing_elements: data.bestPerformingElements,
      underperforming_elements: data.underperformingElements,
      improvement_opportunities: data.improvementOpportunities,
    });
    return mapChannelProfile(response);
  },

  // DNA Extraction
  async extractDNA(data: DNAExtractionRequest): Promise<DNAExtractionResponse> {
    const response = await api.post<ApiDNAExtractionResponse>('/api/v1/dna/extract', {
      video_id: data.videoId,
      knowledge_id: data.knowledgeId,
      video_ids: data.videoIds,
      include_transcript: data.includeTranscript ?? true,
      include_visual_analysis: data.includeVisualAnalysis ?? false,
      include_audio_analysis: data.includeAudioAnalysis ?? false,
    });
    return {
      dnaId: response.dna_id,
      status: response.status,
      elementsExtracted: response.elements_extracted,
      processingTimeSeconds: response.processing_time_seconds,
      summary: response.summary,
    };
  },

  // Summary
  async getSummary(knowledgeId?: string): Promise<DNASummary> {
    try {
      const response = await api.get<ApiDNASummary>('/api/v1/dna/summary', {
        params: { knowledge_id: knowledgeId },
      });
      return mapDNASummary(response);
    } catch {
      return mockSummary;
    }
  },
};
