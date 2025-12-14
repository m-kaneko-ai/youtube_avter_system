import { useNavigationStore } from '../../stores/navigationStore';
import { TeamTab } from './components/TeamTab';
import { ApprovalTab } from './components/ApprovalTab';
import { ClientTab } from './components/ClientTab';

export const AdminPage = () => {
  const { getActiveTab } = useNavigationStore();
  const activeTab = getActiveTab('admin');

  const renderContent = () => {
    switch (activeTab) {
      case 'team':
        return <TeamTab />;
      case 'approval':
        return <ApprovalTab />;
      case 'client':
        return <ClientTab />;
      default:
        return <TeamTab />;
    }
  };

  return (
    <div className="px-8 pb-12 animate-fade-in">
      {renderContent()}
    </div>
  );
};
