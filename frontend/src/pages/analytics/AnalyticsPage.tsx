import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { Modal } from '../../components/common';
import { RevenueTab, KnowledgeTab, BrandKnowledgeTab, TemplateTab, SeriesTab, SeriesDetailTab, CompoundStrategyTab } from './components';

type Period = '7days' | '30days' | '90days';

export const AnalyticsPage = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const { getActiveTab } = useNavigationStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const activeTab = getActiveTab('analytics');

  const [period, setPeriod] = useState<Period>('30days');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Render tab content based on active tab
  if (activeTab === 'revenue') {
    return <RevenueTab />;
  }
  if (activeTab === 'brand-knowledge') {
    return <BrandKnowledgeTab />;
  }
  if (activeTab === 'knowledge') {
    return <KnowledgeTab />;
  }
  if (activeTab === 'template') {
    return <TemplateTab />;
  }
  if (activeTab === 'series') {
    return <SeriesTab />;
  }
  if (activeTab === 'series-detail') {
    return <SeriesDetailTab />;
  }
  if (activeTab === 'compound-strategy') {
    return <CompoundStrategyTab />;
  }

  return (
    <div className="px-8 pb-12">
      {/* Chart Card */}
      <div
        className={cn(
          'p-8 rounded-3xl border shadow-sm mb-8',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className={cn('font-bold text-2xl', themeClasses.text)}>
              チャンネルパフォーマンス
            </h3>
            <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
              過去30日間の視聴データ推移
            </p>
          </div>
          <div
            className={cn(
              'flex p-1 rounded-xl',
              isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
            )}
          >
            {[
              { id: '7days' as Period, label: '7日間' },
              { id: '30days' as Period, label: '30日間' },
              { id: '90days' as Period, label: '90日間' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all',
                  period === p.id
                    ? cn(themeClasses.cardBg, 'shadow-sm', themeClasses.text)
                    : cn(
                        isDarkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                      )
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-80 flex items-end gap-3 px-2">
          {[...Array(30)].map((_, i) => {
            const height = Math.floor(Math.random() * 70) + 20;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end group h-full cursor-pointer"
              >
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-300 group-hover:bg-blue-500 group-hover:shadow-lg relative',
                    isDarkMode
                      ? 'bg-blue-900/40 group-hover:shadow-blue-900/50'
                      : 'bg-blue-100 group-hover:shadow-blue-200'
                  )}
                  style={{ height: `${height}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                    {height * 100} views
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Demographics */}
        <div
          className={cn(
            'p-8 rounded-3xl border shadow-sm',
            themeClasses.cardBg,
            themeClasses.cardBorder
          )}
        >
          <h3 className={cn('font-bold text-xl mb-6', themeClasses.text)}>
            視聴者属性
          </h3>
          <div className="space-y-6">
            {[
              { label: '18-24歳', val: 20 },
              { label: '25-34歳', val: 45 },
              { label: '35-44歳', val: 25 },
              { label: '45歳以上', val: 10 },
            ].map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className={cn('font-medium', themeClasses.textSecondary)}>
                    {d.label}
                  </span>
                  <span className={cn('font-bold', themeClasses.text)}>{d.val}%</span>
                </div>
                <div
                  className={cn(
                    'w-full h-2 rounded-full overflow-hidden',
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                  )}
                >
                  <div
                    className="bg-slate-500 h-full rounded-full"
                    style={{ width: `${d.val}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <CreditCard size={120} className="transform rotate-12" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-2 opacity-90">推定収益</h3>
            <p className="text-5xl font-bold mb-8 tracking-tight">¥452,000</p>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm opacity-80">RPM (1,000回再生あたりの収益)</span>
                <span className="font-bold">¥320</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-80">再生ベース収益</span>
                <span className="font-bold">¥410,500</span>
              </div>
            </div>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              詳細レポートを見る
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="詳細レポート"
        size="lg"
      >
        <div className="space-y-4">
          <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-700' : 'bg-slate-50')}>
            <h4 className={cn('font-bold mb-2', themeClasses.text)}>収益サマリー</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={themeClasses.textSecondary}>RPM (1,000回再生あたりの収益)</span>
                <span className={cn('font-bold', themeClasses.text)}>¥320</span>
              </div>
              <div className="flex justify-between">
                <span className={themeClasses.textSecondary}>再生ベース収益</span>
                <span className={cn('font-bold', themeClasses.text)}>¥410,500</span>
              </div>
              <div className="flex justify-between">
                <span className={themeClasses.textSecondary}>推定総収益</span>
                <span className={cn('font-bold text-lg', themeClasses.text)}>¥452,000</span>
              </div>
            </div>
          </div>
          <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-700' : 'bg-slate-50')}>
            <h4 className={cn('font-bold mb-2', themeClasses.text)}>パフォーマンス指標</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={themeClasses.textSecondary}>総再生回数</span>
                <span className={cn('font-bold', themeClasses.text)}>1,412,500回</span>
              </div>
              <div className="flex justify-between">
                <span className={themeClasses.textSecondary}>平均視聴維持率</span>
                <span className={cn('font-bold', themeClasses.text)}>42.3%</span>
              </div>
              <div className="flex justify-between">
                <span className={themeClasses.textSecondary}>エンゲージメント率</span>
                <span className={cn('font-bold', themeClasses.text)}>8.7%</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default AnalyticsPage;
