import { useNavigationStore } from '../../stores/navigationStore';
import { SchedulerTab } from './components/SchedulerTab';
import { MultiPlatformTab } from './components/MultiPlatformTab';
import { ShortToLongLinkTab } from './components/ShortToLongLinkTab';

export const PublishPage = () => {
  const { getActiveTab } = useNavigationStore();
  const activeTab = getActiveTab('publish');

  const renderContent = () => {
    switch (activeTab) {
      case 'scheduler':
        return <SchedulerTab />;
      case 'multi':
        return <MultiPlatformTab />;
      case 'engagement':
        return <ShortToLongLinkTab />;
      default:
        return <SchedulerTab />;
    }
  };

  return (
    <div className="px-8 pb-12 animate-fade-in">
      {renderContent()}
    </div>
  );
};
export default PublishPage;
