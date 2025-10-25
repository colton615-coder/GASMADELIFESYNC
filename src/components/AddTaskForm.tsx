import React, { useState, useCallback } from 'react';
import { useTaskContext, Priority } from './TaskContext';
import { PlusIcon, CalendarIcon } from './icons';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

const AddTaskForm: React.FC = () => {
  const { addTask, state } = useTaskContext();
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>('None');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addTask({ text: text.trim(), completed: false, dueDate, priority });
    setText('');
    setDueDate(null);
    setPriority('None');
  }, [text, dueDate, priority, addTask]);

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 mb-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      aria-label="Add new task form"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-grow bg-white/10 text-white placeholder-gray-400 px-4 py-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition"
          aria-label="New task"
          disabled={state.loading}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition font-semibold flex items-center justify-center flex-shrink-0 h-12 w-12"
          aria-label="Add task"
          disabled={state.loading}
        >
          {state.loading ? (
            <span className="loader w-6 h-6" />
          ) : (
            <PlusIcon className="w-6 h-6" />
          )}
        </motion.button>
      </div>
      <div className="flex items-center justify-start gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {/* open date picker modal here if needed */}}
          className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            dueDate ? 'text-indigo-300 bg-indigo-500/10' : 'text-gray-400 bg-white/10 hover:bg-white/20'
          }`}
          aria-label={dueDate ? `Change due date: ${format(parseISO(dueDate), 'MMM d, yyyy')}` : 'Set due date'}
          disabled={state.loading}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>{dueDate ? format(parseISO(dueDate), 'MMM d') : 'Due Date'}</span>
        </motion.button>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          className={`bg-white/10 border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 appearance-none transition-colors font-semibold ${
            priority === 'None' ? 'text-gray-400' : ''
          }`}
          aria-label="Priority"
          disabled={state.loading}
        >
          <option value="None">No Priority</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      {state.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-red-400 text-sm mt-2"
          aria-live="assertive"
        >
          {state.error}
        </motion.div>
      )}
    </motion.form>
  );
};

export default AddTaskForm;
