import { useNavigationStore } from '../../stores/navigationStore';
import { CalendarTab } from './components/CalendarTab';
import { ProjectListTab } from './components/ProjectListTab';
import { AIChatTab } from './components/AIChatTab';
import type { PlanningTabType } from '../../types';

export const PlanningPage = () => {
  const { getActiveTab } = useNavigationStore();
  const activeTab = getActiveTab('planning') as PlanningTabType;

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <CalendarTab />;
      case 'list':
        return <ProjectListTab />;
      case 'ai':
        return <AIChatTab />;
      default:
        return <CalendarTab />;
    }
  };

  return (
    <div className="px-8 pb-12 animate-fade-in">
      {renderContent()}
    </div>
  );
};
