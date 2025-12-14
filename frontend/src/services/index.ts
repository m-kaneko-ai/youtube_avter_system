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
