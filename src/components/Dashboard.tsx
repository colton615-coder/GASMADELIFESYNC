import React from 'react';
import DashboardStatsWidget from '@/components/DashboardStatsWidget';
import DataManagementModule from '@/components/DataManagementModule';
import TodayWidgetView from '@/components/TodayWidgetView';
import ProactiveSuggestions from '@/components/ProactiveSuggestions';
import JournalInsightWidget from '@/components/JournalInsightWidget';
import MindfulMomentsWidget from '@/components/MindfulMomentsWidget';
import WeeklyReviewWidget from '@/components/WeeklyReviewWidget';

const Dashboard: React.FC<{ 
  setActiveModule: (module: string) => void;
  setJournalLink: (dateKey: string | null) => void;
}> = ({ setActiveModule, setJournalLink }) => {

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // In a real app, this would come from user settings or context.
  const userName = "Alex"; 
  const greeting = userName ? `${getGreeting()}, ${userName}.` : `${getGreeting()}.`;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-module-header">{greeting}</h2>
      
      <ProactiveSuggestions setActiveModule={setActiveModule} />

      <WeeklyReviewWidget setActiveModule={setActiveModule} />
      
      <TodayWidgetView setActiveModule={setActiveModule} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <JournalInsightWidget setActiveModule={setActiveModule} setJournalLink={setJournalLink} /> 
        </div>
        <MindfulMomentsWidget setActiveModule={setActiveModule} />
        <div className="lg:col-span-3">
            <DashboardStatsWidget setActiveModule={setActiveModule} />
        </div>
        <div className="lg:col-span-3">
            <DataManagementModule />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;