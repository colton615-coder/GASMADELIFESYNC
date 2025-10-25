import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, useTaskContext } from './TaskContext';
import AnimatedCheckbox from './AnimatedCheckbox';
import { PencilIcon, TrashIcon, CalendarIcon, CheckIcon, XIcon } from './icons';
import { format, parseISO } from 'date-fns';

interface TaskItemProps {
  task: Task;
}

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'High': return 'text-red-400';
    case 'Medium': return 'text-yellow-400';
    case 'Low': return 'text-blue-400';
    default: return 'text-gray-400';
  }
};

const TaskItem: React.FC<TaskItemProps> = React.memo(({ task }) => {
  const { toggleTaskCompletion, deleteTask, updateTask, state } = useTaskContext();

  // Callbacks for performance
  const handleToggle = useCallback(() => {
    toggleTaskCompletion(task.id);
  }, [toggleTaskCompletion, task.id]);

  const handleDelete = useCallback(() => {
    deleteTask(task.id);
  }, [deleteTask, task.id]);

  // Editing logic can be expanded as needed

  return (
    <AnimatePresence>
      <motion.li
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`group flex items-start gap-4 p-4 rounded-md transition-all duration-300 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary/60 
          ${task.completed ? 'bg-green-500/10' : 'hover:bg-white/10'} 
        `}
        tabIndex={0}
        aria-label={`Task: ${task.text}${task.completed ? ' (completed)' : ''}`}
        role="listitem"
      >
        <AnimatedCheckbox
          checked={task.completed}
          onChange={handleToggle}
          variant="round"
          aria-label={task.completed ? `Mark as incomplete: ${task.text}` : `Mark as complete: ${task.text}`}
        />
        <div className="flex-1 min-w-0">
          <span className={`text-body break-words transition-colors duration-300 ${task.completed ? 'line-through text-gray-400 opacity-70' : ''}`}>{task.text}</span>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {task.dueDate && !task.completed && (
              <span className={`text-caption flex items-center gap-2 ${new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-gray-400'}`}> 
                <CalendarIcon className="w-4 h-4" />
                {format(parseISO(task.dueDate), 'MMM d')}
              </span>
            )}
            {task.priority && task.priority !== 'None' && !task.completed && (
              <span className={`text-caption font-semibold px-2 rounded-full ${getPriorityColor(task.priority)} bg-opacity-10`}>
                {task.priority}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto pl-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
          {/* Expand with edit modal if needed */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/20 focus-visible:ring-2 focus-visible:ring-red-400 transition-colors"
            aria-label={`Delete task: ${task.text}`}
            tabIndex={0}
          >
            <TrashIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.li>
    </AnimatePresence>
  );
});

export default TaskItem;
