/**
 * Analytics Performance Service
 *
 * 動画・チャンネルのパフォーマンス分析機能
 */
import { api } from '../api';
import {
  VideoAnalyticsData,
  ChannelOverview,
  PerformanceReport,
  ApiVideoAnalyticsData,
  ApiChannelOverview,
  ApiPerformanceReport,
  mapVideoAnalyticsData,
  mapChannelOverview,
  mapPerformanceReport,
} from './types';

/**
 * 動画分析データ取得
 */
export async function getVideoAnalytics(
  videoId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<VideoAnalyticsData> {
  const response = await api.get<ApiVideoAnalyticsData>(`/api/v1/analytics/video/${videoId}`, {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return mapVideoAnalyticsData(response);
}

/**
 * チャンネル概要取得
 */
export async function getChannelOverview(dateFrom?: string, dateTo?: string): Promise<ChannelOverview> {
  const response = await api.get<ApiChannelOverview>('/api/v1/analytics/channel', {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return mapChannelOverview(response);
}

/**
 * パフォーマンスレポート取得
 */
export async function getPerformanceReport(dateFrom?: string, dateTo?: string): Promise<PerformanceReport> {
  const response = await api.get<ApiPerformanceReport>('/api/v1/analytics/performance', {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return mapPerformanceReport(response);
}
