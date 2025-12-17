/**
 * Analytics Service - Main Export
 */
import * as performanceService from './performance';
import * as reportsService from './reports';
import * as knowledgeService from './knowledge';

// すべての関数を集約してエクスポート
export const analyticsService = {
  // Performance
  getVideoAnalytics: performanceService.getVideoAnalytics,
  getChannelOverview: performanceService.getChannelOverview,
  getPerformanceReport: performanceService.getPerformanceReport,

  // Reports
  generateReport: reportsService.generateReport,

  // Knowledge
  getRevenues: knowledgeService.getRevenues,
  getMonthlyRevenue: knowledgeService.getMonthlyRevenue,
  getSeries: knowledgeService.getSeries,
  getKnowledge: knowledgeService.getKnowledge,
  getTemplates: knowledgeService.getTemplates,
};

// 型定義もエクスポート
export type * from './types';
