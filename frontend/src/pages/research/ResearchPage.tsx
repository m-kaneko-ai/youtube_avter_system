import { useNavigationStore } from '../../stores/navigationStore';
import { CompetitorTab } from './components/CompetitorTab';
import { TrendTab } from './components/TrendTab';
import { CommentTab } from './components/CommentTab';
import type { ResearchTabType } from '../../types';

export const ResearchPage = () => {
  const { getActiveTab } = useNavigationStore();
  const activeTab = getActiveTab('research') as ResearchTabType;

  const renderContent = () => {
    switch (activeTab) {
      case 'competitor':
        return <CompetitorTab />;
      case 'trend':
        return <TrendTab />;
      case 'comments':
        return <CommentTab />;
      default:
        return <CompetitorTab />;
    }
  };

  return (
    <div className="px-8 pb-12 animate-fade-in">
      {renderContent()}
    </div>
  );
};
export default ResearchPage;
