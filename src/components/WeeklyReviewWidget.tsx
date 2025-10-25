import React from 'react';
import { getDay } from 'date-fns';
import { ClipboardCheckIcon } from '@/components/icons';
import { motion } from 'framer-motion';

const WeeklyReviewWidget: React.FC<{
  setActiveModule: (module: string) => void;
}> = ({ setActiveModule }) => {
  const dayOfWeek = getDay(new Date()); // Sunday = 0, Monday = 1, etc.
  
  // The widget will only be visible on Sunday or Monday to encourage weekly reflection.
  const isVisible = dayOfWeek === 0 || dayOfWeek === 1;

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        backgroundColor: 'var(--color-surface-module)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
      }}
      className="border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:border-indigo-400/50 hover:-translate-y-1 group"
      aria-label="Weekly review widget"
      tabIndex={0}
      role="region"
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 mb-4">
        <ClipboardCheckIcon className="w-7 h-7" />
      </div>
      <h3 className="text-body-emphasis mb-2">Ready for Your Weekly Review?</h3>
      <p className="text-caption mb-4">
        Take a moment to reflect on your week. Aura will summarize your accomplishments and provide insights for the week ahead.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setActiveModule('WEEKLY_REVIEW')}
        className="w-full max-w-xs px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition"
        aria-label="Generate weekly review"
      >
        Generate My Review
      </motion.button>
    </motion.div>
  );
};

export default WeeklyReviewWidget;
