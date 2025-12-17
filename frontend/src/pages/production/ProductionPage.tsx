import { useNavigationStore } from '../../stores/navigationStore';
import { VoiceTab } from './components/VoiceTab';
import { AvatarTab } from './components/AvatarTab';
import { EditTab } from './components/EditTab';
import { QualityTab } from './components/QualityTab';

export const ProductionPage = () => {
  const { getActiveTab } = useNavigationStore();
  const activeTab = getActiveTab('production');

  const renderContent = () => {
    switch (activeTab) {
      case 'voice':
        return <VoiceTab />;
      case 'avatar':
        return <AvatarTab />;
      case 'edit':
        return <EditTab />;
      case 'quality':
        return <QualityTab />;
      default:
        return <VoiceTab />;
    }
  };

  return (
    <div className="px-8 pb-12 animate-fade-in">
      {renderContent()}
    </div>
  );
};
export default ProductionPage;
