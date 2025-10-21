import React from 'react';
import { FlagIcon, ChevronRightIcon } from './icons';
import usePersistentState from '../hooks/usePersistentState';
import { format, parseISO, isValid, isBefore, isAfter, addDays } from 'date-fns';

interface Milestone {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string | null;
  targetDate?: string | null;
  priority?: 'None' | 'Low' | 'Medium' | 'High';
}

const MilestonesWidget: React.FC<{
  setActiveModule: (module: string) => void;
}> = ({ setActiveModule }) => {
  const [milestones] = usePersistentState<Milestone[]>('milestones', []);

  // Get active milestones
  const activeMilestones = milestones.filter(m => !m.completed);
  
  // Get upcoming milestones (within next 30 days)
  const now = new Date();
  const upcomingMilestones = activeMilestones
    .filter(m => m.targetDate)
    .filter(m => {
      const targetDate = parseISO(m.targetDate!);
      return isValid(targetDate) && isAfter(targetDate, now) && isBefore(targetDate, addDays(now, 30));
    })
    .sort((a, b) => {
      return new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime();
    })
    .slice(0, 3);

  const formatDateShort = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '';
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  // If no milestones, show call to action
  if (activeMilestones.length === 0) {
    return (
      <div 
        style={{
          backgroundColor: 'var(--color-surface-module)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
        }}
        className="border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:border-indigo-400/50 hover:-translate-y-1 group cursor-pointer"
        onClick={() => setActiveModule('MILESTONES')}
      >
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 mb-4">
          <FlagIcon className="w-7 h-7" />
        </div>
        <h3 className="text-body-emphasis mb-2">Set Your First Milestone</h3>
        <p className="text-caption mb-4">
          Track important goals and achievements. Turn your aspirations into actionable milestones.
        </p>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
        >
          Create Milestone
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // If there are upcoming milestones, show them
  if (upcomingMilestones.length > 0) {
    return (
      <div 
        style={{
          backgroundColor: 'var(--color-surface-module)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
        }}
        className="border border-indigo-500/30 rounded-2xl p-6 transition-all duration-300 ease-in-out hover:border-indigo-400/50 hover:-translate-y-1 group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
              <FlagIcon className="w-6 h-6" />
            </div>
            <h3 className="text-body-emphasis">Upcoming Milestones</h3>
          </div>
          <button
            onClick={() => setActiveModule('MILESTONES')}
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
          >
            View All
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {upcomingMilestones.map(milestone => (
            <div
              key={milestone.id}
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer"
              onClick={() => setActiveModule('MILESTONES')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-white text-sm truncate">{milestone.title}</h4>
                  {milestone.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{milestone.description}</p>
                  )}
                </div>
                {milestone.targetDate && (
                  <span className="flex-shrink-0 text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">
                    {formatDateShort(milestone.targetDate)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-caption text-center">
            {activeMilestones.length} active milestone{activeMilestones.length !== 1 ? 's' : ''} • Keep pushing forward!
          </p>
        </div>
      </div>
    );
  }

  // Show general milestone status
  return (
    <div 
      style={{
        backgroundColor: 'var(--color-surface-module)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
      }}
      className="border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:border-indigo-400/50 hover:-translate-y-1 group cursor-pointer"
      onClick={() => setActiveModule('MILESTONES')}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 mb-4">
        <FlagIcon className="w-7 h-7" />
      </div>
      <h3 className="text-body-emphasis mb-2">Your Milestones</h3>
      <p className="text-caption mb-4">
        You have {activeMilestones.length} active milestone{activeMilestones.length !== 1 ? 's' : ''}.
        Keep making progress towards your goals!
      </p>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
      >
        View Milestones
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default MilestonesWidget;
