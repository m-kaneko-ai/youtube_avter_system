import { useNavigationStore } from '../../stores/navigationStore';
import { TeamTab } from './components/TeamTab';
import { ApprovalTab } from './components/ApprovalTab';
import { ClientTab } from './components/ClientTab';
import { KnowledgeChatTab } from './components/KnowledgeChatTab';
import { CTATab } from './components/CTATab';

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
      case 'knowledge':
        return <KnowledgeChatTab />;
      case 'cta':
        return <CTATab />;
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
