import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { logToDailyLog } from '@/services/logService';

export type Priority = 'None' | 'Low' | 'Medium' | 'High';
export interface Task {
  id: number;
  text: string;
  completed: boolean;
  completedAt?: string | null;
  dueDate?: string | null;
  priority?: Priority;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export type TaskAction =
  | { type: 'ADD_TASK_OPTIMISTIC'; payload: Task }
  | { type: 'ADD_TASK_REVERT'; payload: number }
  | { type: 'UPDATE_TASK_OPTIMISTIC'; payload: Task }
  | { type: 'UPDATE_TASK_REVERT'; payload: Task }
  | { type: 'DELETE_TASK_OPTIMISTIC'; payload: number }
  | { type: 'DELETE_TASK_REVERT'; payload: Task }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK_OPTIMISTIC':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'ADD_TASK_REVERT':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'UPDATE_TASK_OPTIMISTIC':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'UPDATE_TASK_REVERT':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'DELETE_TASK_OPTIMISTIC':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'DELETE_TASK_REVERT':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const TaskContext = createContext<{
  state: TaskState;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  toggleTaskCompletion: (id: number) => Promise<void>;
} | undefined>(undefined);

export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Memoized sorted tasks
  const sortedTasks = useMemo(() => {
    return [...state.tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.id - a.id;
    });
  }, [state.tasks]);

  // Add Task (Optimistic UI)
  const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
    const optimisticTask: Task = { ...task, id: Date.now() };
    dispatch({ type: 'ADD_TASK_OPTIMISTIC', payload: optimisticTask });
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simulate async Firestore call
      await new Promise(res => setTimeout(res, 400));
      logToDailyLog('task_added', { text: optimisticTask.text, priority: optimisticTask.priority, hasDueDate: !!optimisticTask.dueDate });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Task added!');
    } catch (err) {
      dispatch({ type: 'ADD_TASK_REVERT', payload: optimisticTask.id });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add task.' });
      toast.error('Failed to add task.');
    }
  }, []);

  // Update Task (Optimistic UI)
  const updateTask = useCallback(async (task: Task) => {
    const prevTask = state.tasks.find(t => t.id === task.id);
    dispatch({ type: 'UPDATE_TASK_OPTIMISTIC', payload: task });
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await new Promise(res => setTimeout(res, 400));
      logToDailyLog('task_updated', { taskId: task.id, text: task.text });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Task updated!');
    } catch (err) {
      if (prevTask) dispatch({ type: 'UPDATE_TASK_REVERT', payload: prevTask });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task.' });
      toast.error('Failed to update task.');
    }
  }, [state.tasks]);

  // Delete Task (Optimistic UI)
  const deleteTask = useCallback(async (id: number) => {
    const prevTask = state.tasks.find(t => t.id === id);
    dispatch({ type: 'DELETE_TASK_OPTIMISTIC', payload: id });
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await new Promise(res => setTimeout(res, 400));
      logToDailyLog('task_deleted', { taskId: id });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Task deleted!');
    } catch (err) {
      if (prevTask) dispatch({ type: 'DELETE_TASK_REVERT', payload: prevTask });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task.' });
      toast.error('Failed to delete task.');
    }
  }, [state.tasks]);

  // Toggle Completion (Optimistic UI)
  const toggleTaskCompletion = useCallback(async (id: number) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask: Task = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    };
    dispatch({ type: 'UPDATE_TASK_OPTIMISTIC', payload: updatedTask });
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await new Promise(res => setTimeout(res, 400));
      logToDailyLog('task_completed', { taskId: id, text: task.text });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success(task.completed ? 'Task marked incomplete.' : 'Task completed! 🎉');
    } catch (err) {
      dispatch({ type: 'UPDATE_TASK_REVERT', payload: task });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task.' });
      toast.error('Failed to update task.');
    }
  }, [state.tasks]);

  // Context value
  const value = useMemo(() => ({
    state: { ...state, tasks: sortedTasks },
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
  }), [state, sortedTasks, addTask, updateTask, deleteTask, toggleTaskCompletion]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
