import React, { Suspense, lazy } from 'react';
const DashboardStatsWidget = lazy(() => import('@/components/DashboardStatsWidget'));
const DataManagementModule = lazy(() => import('@/components/DataManagementModule'));
const TodayWidgetView = lazy(() => import('@/components/TodayWidgetView'));
const ProactiveSuggestions = lazy(() => import('@/components/ProactiveSuggestions'));
const JournalInsightWidget = lazy(() => import('@/components/JournalInsightWidget'));
const MindfulMomentsWidget = lazy(() => import('@/components/MindfulMomentsWidget'));
const WeeklyReviewWidget = lazy(() => import('@/components/WeeklyReviewWidget'));
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

  // No user profile needed; always show generic greeting.
  const greeting = `${getGreeting()}.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex flex-col gap-8 px-4 md:px-8 lg:px-16 py-8 w-full max-w-7xl mx-auto"
      aria-label="Dashboard"
    >
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }}
        className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4"
      >
        {greeting}
      </motion.h2>

      <Suspense fallback={<div className="mb-6">Loading suggestions...</div>}>
        <motion.div layout className="mb-6">
          <ProactiveSuggestions setActiveModule={setActiveModule} />
        </motion.div>
      </Suspense>

      <Suspense fallback={<div className="mb-6">Loading weekly review...</div>}>
        <motion.div layout className="mb-6">
          <WeeklyReviewWidget setActiveModule={setActiveModule} />
        </motion.div>
      </Suspense>

      <Suspense fallback={<div className="mb-6">Loading today widget...</div>}>
        <motion.div layout className="mb-6">
          <TodayWidgetView setActiveModule={setActiveModule} />
        </motion.div>
      </Suspense>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Suspense fallback={<div>Loading journal insight...</div>}>
          <motion.div layout className="lg:col-span-2">
            <JournalInsightWidget setActiveModule={setActiveModule} setJournalLink={setJournalLink} /> 
          </motion.div>
        </Suspense>
        <Suspense fallback={<div>Loading mindful moments...</div>}>
          <motion.div layout>
            <MindfulMomentsWidget setActiveModule={setActiveModule} />
          </motion.div>
        </Suspense>
        <Suspense fallback={<div>Loading stats...</div>}>
          <motion.div layout className="lg:col-span-3">
            <DashboardStatsWidget setActiveModule={setActiveModule} />
          </motion.div>
        </Suspense>
        <Suspense fallback={<div>Loading data management...</div>}>
          <motion.div layout className="lg:col-span-3">
            <DataManagementModule />
          </motion.div>
        </Suspense>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;