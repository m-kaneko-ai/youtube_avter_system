/**
 * Analytics Reports Service
 *
 * レポート生成機能
 */
import { api } from '../api';
import {
  ReportGenerateRequest,
  ReportGenerateResponse,
  ApiReport,
  mapReport,
} from './types';

/**
 * レポート生成
 */
export async function generateReport(request: ReportGenerateRequest): Promise<ReportGenerateResponse> {
  const response = await api.post<{ report: ApiReport; estimated_time_seconds: number }>(
    '/api/v1/analytics/report',
    {
      report_type: request.reportType,
      date_from: request.dateFrom,
      date_to: request.dateTo,
      title: request.title,
      include_video_details: request.includeVideoDetails,
      include_recommendations: request.includeRecommendations,
      export_format: request.exportFormat,
    }
  );
  return {
    report: mapReport(response.report),
    estimatedTimeSeconds: response.estimated_time_seconds,
  };
}
