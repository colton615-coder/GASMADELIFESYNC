import React, { useMemo } from 'react';
import { useTaskContext } from './TaskContext';
import TaskItem from './TaskItem';
import { motion, AnimatePresence } from 'framer-motion';

const TaskList: React.FC = React.memo(() => {
  const { state } = useTaskContext();

  // Memoize sorted tasks for performance
  const sortedTasks = useMemo(() => state.tasks, [state.tasks]);

  if (sortedTasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="text-center py-8 text-caption"
        aria-live="polite"
      >
        <p>Ready to take on the day? Add your first task above.</p>
      </motion.div>
    );
  }

  return (
    <motion.ul
      layout
      className="space-y-2 overflow-y-auto max-h-72 pr-2"
      role="list"
      aria-label="Task list"
    >
      <AnimatePresence>
        {sortedTasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </AnimatePresence>
    </motion.ul>
  );
});

export default TaskList;

