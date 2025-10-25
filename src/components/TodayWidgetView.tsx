import React from 'react';
import usePersistentState from '@/hooks/usePersistentState';
import { TasksIcon, ChevronRightIcon } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const TodayWidgetView: React.FC<{ setActiveModule: (module: string) => void }> = ({ setActiveModule }) => {
  const [tasks] = usePersistentState<Task[]>('tasks', []);

  const topTasks = tasks
    .filter((task: Task) => !task.completed)
    .sort((a: Task, b: Task) => b.id - a.id) // Newest first, assuming higher ID is newer
    .slice(0, 3);
  
  const pendingTasksCount = tasks.filter((task: Task) => !task.completed).length;

  return (
    <motion.div
      onClick={() => setActiveModule('TASKS')}
      style={{
        backgroundColor: 'var(--color-surface-module)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
        transition: 'background-color 0.5s ease'
      }}
      className="border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-full cursor-pointer transition-all duration-300 ease-in-out hover:border-indigo-400/50 hover:-translate-y-1 group"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      aria-label="Today widget view"
      tabIndex={0}
      role="region"
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <TasksIcon className="w-6 h-6 text-indigo-300" />
            <h2 className="text-body-emphasis">Top 3 Critical Tasks</h2>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-300 transition-colors" />
        </div>
        {topTasks.length > 0 ? (
          <motion.ul layout className="space-y-4" aria-label="Top tasks">
            <AnimatePresence>
              {topTasks.map((task: Task) => (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="flex items-center gap-4 bg-white/5 p-4 rounded-lg transition-colors hover:bg-white/10"
                  tabIndex={0}
                  aria-label={`Task: ${task.text}`}
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"></div>
                  <span className="text-body truncate">{task.text}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-32 text-gray-400"
            aria-live="polite"
          >
            <p className="text-body">What's your top priority today?</p>
          </motion.div>
        )}
      </div>
      <p className="text-caption text-xs text-gray-400 mt-4 text-right">
        {pendingTasksCount > 0 ? 'Click to view all tasks' : 'Click to add a task'}
      </p>
    </motion.div>
  );
};

export default TodayWidgetView;