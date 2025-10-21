import React from 'react';
import DashboardStatsWidget from './DashboardStatsWidget';
import DataManagementModule from './DataManagementModule';
import TodayWidgetView from './TodayWidgetView';
import ProactiveSuggestions from './ProactiveSuggestions';
import JournalInsightWidget from './JournalInsightWidget';
import MindfulMomentsWidget from './MindfulMomentsWidget';
import WeeklyReviewWidget from './WeeklyReviewWidget';
import MilestonesWidget from './MilestonesWidget';

const Dashboard: React.FC<{ 
  setActiveModule: (module: string) => void;
  setJournalLink: (dateKey: string | null) => void;
}> = ({ setActiveModule, setJournalLink }) => {
  return (
    <div className="flex flex-col gap-6">
      <ProactiveSuggestions setActiveModule={setActiveModule} />

      <WeeklyReviewWidget setActiveModule={setActiveModule} />
      
      <TodayWidgetView setActiveModule={setActiveModule} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <JournalInsightWidget setActiveModule={setActiveModule} setJournalLink={setJournalLink} /> 
        </div>
        <MindfulMomentsWidget setActiveModule={setActiveModule} />
        <MilestonesWidget setActiveModule={setActiveModule} />
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
