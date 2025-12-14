import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  PiggyBank,
  BarChart3,
  ArrowUpRight,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { analyticsService } from '../../../services/analytics';

type Period = '7days' | '30days' | '90days' | 'year';

export const RevenueTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [period, setPeriod] = useState<Period>('30days');

  // Revenue data query
  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    error: revenueError,
  } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsService.getRevenues(),
  });

  // Monthly revenue query
  const {
    data: monthlyData,
    isLoading: isLoadingMonthly,
    error: monthlyError,
  } = useQuery({
    queryKey: ['analytics', 'revenue', 'monthly'],
    queryFn: () => analyticsService.getMonthlyRevenue(),
  });

  const revenues = revenueData?.revenues ?? [];
  const monthlyRevenues = monthlyData?.data ?? [];

  const isLoading = isLoadingRevenue || isLoadingMonthly;
  const hasError = revenueError || monthlyError;

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const maxMonthly = monthlyRevenues.length > 0 ? Math.max(...monthlyRevenues.map((m) => m.amount)) : 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-8">
        <Loader2 size={32} className="animate-spin text-green-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>収益データを読み込み中...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={cn('mx-8 p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">収益データの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>収益管理</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            チャンネル収益の詳細分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex p-1 rounded-xl', isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}>
            {[
              { id: '7days' as Period, label: '7日間' },
              { id: '30days' as Period, label: '30日間' },
              { id: '90days' as Period, label: '90日間' },
              { id: 'year' as Period, label: '年間' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  period === p.id
                    ? cn(themeClasses.cardBg, 'shadow-sm', themeClasses.text)
                    : themeClasses.textSecondary
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200'
          )}>
            <Download size={16} />
            エクスポート
          </button>
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <DollarSign size={120} className="transform rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank size={24} />
            <span className="font-medium opacity-90">総収益（{period === 'year' ? '今年' : period === '90days' ? '過去90日' : period === '30days' ? '過去30日' : '過去7日'}）</span>
          </div>
          <p className="text-5xl font-bold mb-4 tracking-tight">
            ¥{totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 text-green-200">
            <ArrowUpRight size={20} />
            <span className="font-medium">前期比 +15.3%</span>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      {revenues.length === 0 ? (
        <div className={cn('p-8 rounded-xl text-center border', themeClasses.cardBg, themeClasses.cardBorder)}>
          <DollarSign size={32} className={cn('mx-auto mb-2', themeClasses.textSecondary)} />
          <p className={themeClasses.textSecondary}>まだ収益データがありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {revenues.map((revenue) => (
            <div
              key={revenue.id}
              className={cn(
                'p-5 rounded-2xl border',
                themeClasses.cardBg,
                themeClasses.cardBorder
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={cn('text-sm font-medium', themeClasses.textSecondary)}>
                  {revenue.label}
                </span>
                <div className="flex items-center gap-1 text-xs font-medium text-green-500">
                  <TrendingUp size={14} />
                  {revenue.source}
                </div>
              </div>
              <p className={cn('text-2xl font-bold', themeClasses.text)}>
                ¥{revenue.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly Chart & Details */}
      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className={cn(
          'col-span-2 p-6 rounded-2xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={cn('font-bold', themeClasses.text)}>月別収益推移</h3>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className={themeClasses.textSecondary} />
              <span className={cn('text-sm', themeClasses.textSecondary)}>過去6ヶ月</span>
            </div>
          </div>
          {monthlyRevenues.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className={themeClasses.textSecondary}>月別データがありません</p>
            </div>
          ) : (
            <div className="h-64 flex items-end gap-4">
              {monthlyRevenues.map((month) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-emerald-400 rounded-t-lg transition-all hover:from-green-500 hover:to-emerald-300"
                    style={{ height: `${(month.amount / maxMonthly) * 100}%` }}
                  />
                  <span className={cn('text-xs font-medium', themeClasses.textSecondary)}>
                    {month.month}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div className={cn(
          'p-6 rounded-2xl border',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}>
          <h3 className={cn('font-bold mb-4', themeClasses.text)}>支払い情報</h3>
          <div className="space-y-4">
            <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
              <div className="flex items-center gap-3 mb-2">
                <CreditCard size={20} className="text-blue-500" />
                <span className={cn('font-medium', themeClasses.text)}>次回支払い予定</span>
              </div>
              <p className={cn('text-2xl font-bold', themeClasses.text)}>¥462,000</p>
              <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>2025年1月25日</p>
            </div>

            <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={20} className="text-purple-500" />
                <span className={cn('font-medium', themeClasses.text)}>前回支払い</span>
              </div>
              <p className={cn('text-2xl font-bold', themeClasses.text)}>¥485,000</p>
              <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>2024年12月25日</p>
            </div>

            <button className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all">
              収益レポートをダウンロード
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
