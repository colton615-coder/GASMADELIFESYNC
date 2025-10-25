import React from 'react';
import Module from '@/components/Module';
import { TasksIcon } from '@/components/icons';
import { TaskProvider } from './TaskContext';
import AddTaskForm from './AddTaskForm';
import TaskList from './TaskList';
import { motion } from 'framer-motion';

const TasksModule: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <TaskProvider>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={className}
        aria-label="Tasks module"
      >
        <Module title="Tasks" icon={<TasksIcon />} className="h-full">
          <div className="flex flex-col h-full">
            <AddTaskForm />
            <TaskList />
          </div>
        </Module>
      </motion.div>
    </TaskProvider>
  );
};

export default TasksModule;