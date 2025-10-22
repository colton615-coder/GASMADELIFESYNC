import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import Module from './Module';
import { TasksIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, CalendarIcon } from './icons';
import usePersistentState from '../hooks/usePersistentState';
import WheelPicker from './WheelPicker';
import { format, parseISO, getDaysInMonth, isValid } from 'date-fns';
import AnimatedCheckbox from './AnimatedCheckbox';
import BottomSheet from './BottomSheet';
import toast from 'react-hot-toast';
import { logToDailyLog } from '../services/logService';

type Priority = 'None' | 'Low' | 'Medium' | 'High';
type SortOption = 'creationDate' | 'dueDate' | 'priority';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  completedAt?: string | null;
  dueDate?: string | null;
  priority?: Priority;
}

const priorityOrder: Record<Priority, number> = {
  'High': 3,
  'Medium': 2,
  'Low': 1,
  'None': 0,
};

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case 'High': return 'text-red-400';
    case 'Medium': return 'text-yellow-400';
    case 'Low': return 'text-blue-400';
    default: return 'text-gray-400';
  }
};


const TasksModule: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', []);
  
  // New Task state
  const [newTaskText, setNewTaskText] = useState('');
  const [newDueDate, setNewDueDate] = useState<string | null>(null);
  const [newPriority, setNewPriority] = useState<Priority>('None');

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingTaskDueDate, setEditingTaskDueDate] = useState<string | null>('');
  const [editingTaskPriority, setEditingTaskPriority] = useState<Priority>('None');

  // UI state
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [justAddedTaskId, setJustAddedTaskId] = useState<number | null>(null);
  const [justCompletedTaskId, setJustCompletedTaskId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('creationDate');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerInitialValue, setPickerInitialValue] = useState<string | null>(null);
  const [datePickerCallback, setDatePickerCallback] = useState<(date: string | null) => void>(() => {});


  // Data migration to add dueDate and priority
  useEffect(() => {
    const migrationKey = 'tasksMigrationV3_dueDatePriority';
    if (localStorage.getItem(migrationKey)) return;

    const needsMigration = tasks.some(task => typeof task.dueDate === 'undefined' || typeof task.priority === 'undefined');
    
    if (needsMigration) {
        const updatedTasks = tasks.map(task => {
            const migratedTask: Task = { ...task };
            if (typeof task.dueDate === 'undefined') {
                migratedTask.dueDate = null;
            }
            if (typeof task.priority === 'undefined') {
                migratedTask.priority = 'None';
            }
            return migratedTask;
        });
        setTasks(updatedTasks);
    }
    localStorage.setItem(migrationKey, 'true');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDatePicker = (currentValue: string | null, onSave: (newValue: string | null) => void) => {
    setPickerInitialValue(currentValue);
    setDatePickerCallback(() => onSave);
    setIsDatePickerOpen(true);
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // 1. Incomplete tasks always come first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // 2. Apply selected sort criteria for incomplete tasks
      if (!a.completed) {
        switch (sortBy) {
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) return b.id - a.id; // fallback to creation date
            if (!a.dueDate) return 1; // Tasks without due date go to the bottom
            if (!b.dueDate) return -1;
            return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
          
          case 'priority':
            const priorityA = priorityOrder[a.priority || 'None'];
            const priorityB = priorityOrder[b.priority || 'None'];
            if (priorityA !== priorityB) {
              return priorityB - priorityA; // Higher priority first
            }
            break; // fallback to creation date if priorities are equal

          case 'creationDate':
          default:
            return b.id - a.id; // Newest first
        }
      }
      
      // 3. For completed tasks, sort by creation date
      return b.id - a.id;
    });
  }, [tasks, sortBy]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === '') return;

    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
      dueDate: newDueDate,
      priority: newPriority,
    };
    setTasks([newTask, ...tasks]);
    logToDailyLog('task_added', { text: newTask.text, priority: newTask.priority, hasDueDate: !!newTask.dueDate });
    setNewTaskText('');
    setNewDueDate(null);
    setNewPriority('None');
    setJustAddedTaskId(newTask.id);
    setTimeout(() => {
        setJustAddedTaskId(null);
    }, 500);
  };

  const toggleTaskCompletion = (id: number) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (taskToToggle && !taskToToggle.completed) {
        setJustCompletedTaskId(id);
        toast.success("Task completed! 🎉");
        logToDailyLog('task_completed', { taskId: id, text: taskToToggle.text });
        setTimeout(() => setJustCompletedTaskId(null), 500); // match animation duration
    }

    setTasks(
      tasks.map(task =>
        task.id === id 
          ? { ...task, 
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString() : undefined 
            } 
          : task
      )
    );
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
    setEditingTaskDueDate(task.dueDate || null);
    setEditingTaskPriority(task.priority || 'None');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    // Resetting other fields is not strictly necessary but good practice
    setEditingTaskText('');
    setEditingTaskDueDate('');
    setEditingTaskPriority('None');
  };

  const handleUpdateTask = () => {
    if (editingTaskId === null) return;
    if (editingTaskText.trim() === '') {
        handleDeleteItem(editingTaskId);
    } else {
        setTasks(
          tasks.map(task =>
            task.id === editingTaskId ? { 
                ...task, 
                text: editingTaskText.trim(),
                dueDate: editingTaskDueDate,
                priority: editingTaskPriority
            } : task
          )
        );
    }
    handleCancelEdit();
  };

  const handleDeleteItem = (id: number) => {
    setDeletingTaskId(id);
  };
  
  const confirmDeleteItem = () => {
    if (deletingTaskId !== null) {
      setTasks(tasks.filter(task => task.id !== deletingTaskId));
      setDeletingTaskId(null);
    }
  };

  return (
    <>
      <Module title="Tasks" icon={<TasksIcon />} className={className}>
        <div className="flex flex-col h-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Add a new task..."
                        className="flex-grow bg-white/10 text-white placeholder-gray-400 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        aria-label="New task"
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition font-semibold flex items-center justify-center active:scale-95 flex-shrink-0 h-12 w-12"
                        aria-label="Add task"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex items-center justify-start gap-3">
                    <button
                        type="button"
                        onClick={() => openDatePicker(newDueDate, setNewDueDate)}
                        className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors text-sm font-semibold ${
                            newDueDate ? 'text-indigo-300 bg-indigo-500/10' : 'text-gray-400 bg-white/10 hover:bg-white/20'
                        }`}
                        aria-label={newDueDate ? `Change due date: ${format(parseISO(newDueDate), 'MMM d, yyyy')}` : 'Set due date'}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        <span>{newDueDate ? format(parseISO(newDueDate), 'MMM d') : 'Due Date'}</span>
                    </button>
                    <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as Priority)}
                        className={`bg-white/10 border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none transition-colors font-semibold ${
                            newPriority === 'None' ? 'text-gray-400' : getPriorityColor(newPriority)
                        }`}
                        aria-label="Priority"
                    >
                        <option value="None">No Priority</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </form>
            
            <div className="flex items-center justify-end mb-4">
              <label htmlFor="sort-tasks" className="text-sm text-gray-400 mr-2">Sort by:</label>
              <select 
                id="sort-tasks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-white/10 text-gray-300 border border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
              >
                <option value="creationDate">Newest</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>

          <ul className="space-y-2 overflow-y-auto max-h-72 pr-2">
            {sortedTasks.length > 0 ? (
              sortedTasks.map(task => (
                <li
                  key={task.id}
                  className={`group flex items-start gap-4 p-4 rounded-md transition-all duration-300 ease-in-out 
                    ${task.completed ? 'bg-green-500/10' : 'hover:bg-white/10'} 
                    ${deletingTaskId === task.id ? 'bg-red-500/10' : ''} 
                    ${justAddedTaskId === task.id ? 'item-enter-animation' : ''}
                    ${justCompletedTaskId === task.id ? 'flash-green-animation' : ''}`}
                >
                  {deletingTaskId === task.id ? (
                    <div className="w-full flex items-center justify-between text-sm py-4">
                      <span className="text-red-400 font-semibold">Delete this task?</span>
                      <div className="flex items-center gap-2">
                        <button onClick={confirmDeleteItem} className="p-2 rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors" aria-label="Confirm delete"><CheckIcon className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingTaskId(null)} className="p-2 rounded-full text-gray-300 bg-white/10 hover:bg-white/20 transition-colors" aria-label="Cancel delete"><XIcon className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : editingTaskId === task.id ? (
                    <div className="w-full flex flex-col gap-2">
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateTask(); }} className="flex-grow">
                            <div className="flex items-center bg-white/10 rounded-md focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-200">
                                <input
                                    type="text"
                                    value={editingTaskText}
                                    onChange={(e) => setEditingTaskText(e.target.value)}
                                    className="flex-grow bg-transparent text-white px-4 py-2 focus:outline-none"
                                    aria-label="Edit task text"
                                    autoFocus
                                />
                                <div className="flex items-center gap-2 pr-2">
                                    <button
                                        type="button"
                                        onClick={() => openDatePicker(editingTaskDueDate, setEditingTaskDueDate)}
                                        className={`p-2 rounded-full flex-shrink-0 transition-colors ${
                                            editingTaskDueDate ? 'text-indigo-300 bg-indigo-500/10' : 'text-gray-400 hover:bg-white/10'
                                        }`}
                                        aria-label={editingTaskDueDate ? `Change due date: ${format(parseISO(editingTaskDueDate), 'MMM d, yyyy')}` : 'Set due date'}
                                    >
                                        <CalendarIcon className="w-4 h-4" />
                                    </button>
                                    <select
                                        value={editingTaskPriority}
                                        onChange={(e) => setEditingTaskPriority(e.target.value as Priority)}
                                        className={`bg-transparent border-0 rounded-md p-2 text-xs focus:outline-none focus:ring-0 appearance-none hover:bg-white/10 transition-colors font-semibold ${
                                            editingTaskPriority === 'None' ? 'text-gray-400' : getPriorityColor(editingTaskPriority)
                                        }`}
                                        aria-label="Edit priority"
                                    >
                                        <option value="None">Priority</option>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                        <div className="flex justify-end items-center gap-2">
                            <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-xs rounded bg-white/10 hover:bg-white/20">Cancel</button>
                            <button type="button" onClick={handleUpdateTask} className="px-4 py-2 text-xs rounded bg-indigo-600 hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                  ) : (
                      <>
                          <AnimatedCheckbox
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(task.id)}
                            variant="round"
                          />
                          
                          <div className="flex-1 min-w-0">
                              <span onDoubleClick={() => handleStartEdit(task)} className={`text-body cursor-pointer break-words transition-colors duration-300 ${task.completed ? 'line-through text-gray-400 opacity-70' : ''}`}>
                                  {task.text}
                              </span>
                              <div className="flex items-center gap-4 mt-2 flex-wrap">
                                  {task.dueDate && !task.completed && (
                                    <span className={`text-caption flex items-center gap-2 ${new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-gray-400'}`}>
                                      <CalendarIcon className="w-4 h-4" />
                                      {format(parseISO(task.dueDate), 'MMM d')}
                                    </span>
                                  )}
                                  {task.priority && task.priority !== 'None' && !task.completed && (
                                    <span className={`text-caption font-semibold px-2 rounded-full ${getPriorityColor(task.priority)} bg-opacity-10 ${task.priority === 'High' ? 'bg-red-500/10' : task.priority === 'Medium' ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}>
                                      {task.priority}
                                    </span>
                                  )}
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-auto pl-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => handleStartEdit(task)} className="p-2 rounded-full text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 transition-colors" aria-label={`Edit task: ${task.text}`}>
                                  <PencilIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteItem(task.id)} className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors" aria-label={`Delete task: ${task.text}`}>
                                  <TrashIcon className="w-4 h-4" />
                              </button>
                          </div>
                      </>
                  )}
                </li>
              ))
            ) : (
              <div className="text-center py-8 text-caption">
                <p>Ready to take on the day? Add your first task above.</p>
              </div>
            )}
          </ul>
        </div>
      </Module>
      {isDatePickerOpen && (
        <DatePicker
            initialValue={pickerInitialValue}
            onSave={(value) => {
                datePickerCallback(value);
                setIsDatePickerOpen(false);
            }}
            onCancel={() => setIsDatePickerOpen(false)}
        />
      )}
    </>
  );
};


const DatePicker: React.FC<{
  initialValue: string | null;
  onSave: (date: string | null) => void;
  onCancel: () => void;
}> = ({ initialValue, onSave, onCancel }) => {
    
    const [currentValue, setCurrentValue] = useState<string | null>(initialValue);

    const { options, value, setValue } = useMemo(() => {
        const date = currentValue ? parseISO(currentValue) : new Date();
        const isValidDate = isValid(date);
        
        const currentYear = new Date().getFullYear();
        const years = ['No Date', ...Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        let days: (string|number)[] = [];
        if (currentValue && isValidDate) {
            const numDays = getDaysInMonth(date);
            days = Array.from({ length: numDays }, (_, i) => i + 1);
        } else {
            days = Array.from({ length: 31 }, (_, i) => i + 1);
        }
        
        const pickerValue: (string | number)[] = currentValue && isValidDate
            ? [date.getFullYear(), months[date.getMonth()], date.getDate()]
            : ['No Date', months[new Date().getMonth()], new Date().getDate()];
        
        const handleValueChange = (newPickerValue: (string | number)[]) => {
            const [year, monthStr, day] = newPickerValue;
            if (year === 'No Date') {
                setCurrentValue(null);
                return;
            }
            const monthIndex = months.indexOf(monthStr as string);
            const numDaysInMonth = getDaysInMonth(new Date(year as number, monthIndex));
            const clampedDay = Math.min(day as number, numDaysInMonth);
            
            const newDate = new Date(year as number, monthIndex, clampedDay);
            setCurrentValue(format(newDate, 'yyyy-MM-dd'));
        };

        return {
            options: [years, months, days],
            value: pickerValue,
            setValue: handleValueChange,
        };
    }, [currentValue]);


    return (
        <BottomSheet
            isOpen={true}
            onClose={onCancel}
            title="Set Due Date"
            primaryAction={{ label: 'Done', onClick: () => onSave(currentValue) }}
            secondaryAction={{ label: 'Cancel', onClick: onCancel }}
        >
            <WheelPicker 
                options={options}
                value={value}
                onChange={setValue}
            />
        </BottomSheet>
    );
};


export default TasksModule;