import React from 'react';
import DashboardStatsWidget from '@/components/DashboardStatsWidget';
import DataManagementModule from '@/components/DataManagementModule';
import TodayWidgetView from '@/components/TodayWidgetView';
import ProactiveSuggestions from '@/components/ProactiveSuggestions';
import JournalInsightWidget from '@/components/JournalInsightWidget';
import MindfulMomentsWidget from '@/components/MindfulMomentsWidget';
import WeeklyReviewWidget from '@/components/WeeklyReviewWidget';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex flex-col gap-6"
      aria-label="Dashboard"
    >
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }}
        className="text-module-header"
      >
        {greeting}
      </motion.h2>

      <motion.div layout>
        <ProactiveSuggestions setActiveModule={setActiveModule} />
      </motion.div>

      <motion.div layout>
        <WeeklyReviewWidget setActiveModule={setActiveModule} />
      </motion.div>

      <motion.div layout>
        <TodayWidgetView setActiveModule={setActiveModule} />
      </motion.div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div layout className="lg:col-span-2">
           <JournalInsightWidget setActiveModule={setActiveModule} setJournalLink={setJournalLink} /> 
        </motion.div>
        <motion.div layout>
          <MindfulMomentsWidget setActiveModule={setActiveModule} />
        </motion.div>
        <motion.div layout className="lg:col-span-3">
            <DashboardStatsWidget setActiveModule={setActiveModule} />
        </motion.div>
        <motion.div layout className="lg:col-span-3">
            <DataManagementModule />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;