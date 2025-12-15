/**
 * Services Index
 *
 * Export all API services
 */

export { api } from './api';
export type { ApiError } from './api';

export { authService } from './auth';
export { researchService } from './research';
export { planningService } from './planning';
export { scriptService } from './script';
export { productionService } from './production';
export { publishService } from './publish';
export { analyticsService } from './analytics';
export { adminService } from './admin';
export { dashboardService } from './dashboard';
export { ctaService } from './cta';
export type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TasksResponse,
  Notification,
  NotificationType,
  NotificationsResponse,
} from './dashboard';
export type {
  CTATemplate,
  CTACreateRequest,
  CTAUpdateRequest,
  CTAListResponse,
  CTAStats,
} from './cta';
export { engagementService } from './engagement';
export type {
  ShortToLongLink,
  ShortToLongLinkListResponse,
  EngagementSummary,
  LinkPerformance,
} from './engagement';
export { seriesService } from './series';
export type {
  Series,
  SeriesWithVideos,
  SeriesVideoItem,
  SeriesListResponse,
  SeriesStats,
  SeriesPerformance,
} from './series';
export { learningService } from './learning';
export { dnaService } from './dna';
export { optimizationService } from './optimization';
export { agentService } from './agent';
