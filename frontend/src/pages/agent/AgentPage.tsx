import { useNavigationStore } from '../../stores/navigationStore';
import { DashboardTab } from './components/DashboardTab';
import { AgentsTab } from './components/AgentsTab';
import { CommentsTab } from './components/CommentsTab';
import { AlertsTab } from './components/AlertsTab';
import { LogsTab } from './components/LogsTab';

export const AgentPage = () => {
  const { getActiveTab } = useNavigationStore();
  const activeTab = getActiveTab('agent');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'agents':
        return <AgentsTab />;
      case 'comments':
        return <CommentsTab />;
      case 'alerts':
        return <AlertsTab />;
      case 'logs':
        return <LogsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="px-8 pb-12 animate-fade-in">
      {renderContent()}
    </div>
  );
};
export default AgentPage;
