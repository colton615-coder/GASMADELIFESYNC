import React from 'react';
import usePersistentState from '../hooks/usePersistentState';
import { format, parseISO } from 'date-fns';
import { TasksIcon, BookOpenIcon, RepeatIcon, ChevronRightIcon, CheckIcon } from './icons';

// Types from other modules
type Priority = 'None' | 'Low' | 'Medium' | 'High';
interface Task {
  id: number; text: string; completed: boolean; dueDate?: string | null; priority?: Priority;
}
interface Habit {
  id: number; name: string; icon: string; history: { [date: string]: boolean };
}

const priorityOrder: Record<Priority, number> = { 'High': 3, 'Medium': 2, 'Low': 1, 'None': 0 };

const FocusBlock: React.FC<{ setActiveModule: (module: string) => void }> = ({ setActiveModule }) => {
    const [tasks] = usePersistentState<Task[]>('tasks', []);
    const [promptHistory] = usePersistentState<Record<string, string>>('journalPromptHistory', {});
    const [habits] = usePersistentState<Habit[]>('habits', []);

    const todayKey = format(new Date(), 'yyyy-MM-dd');

    // --- Find Critical Task ---
    const criticalTask = tasks
        .filter(t => !t.completed)
        .sort((a, b) => {
            const priorityA = priorityOrder[a.priority || 'None'];
            const priorityB = priorityOrder[b.priority || 'None'];
            if (priorityA !== priorityB) return priorityB - priorityA;

            if (a.dueDate && b.dueDate) return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            
            return b.id - a.id;
        })[0];
    
    // --- Find Journal Prompt ---
    const journalPrompt = promptHistory[todayKey];

    // --- Find Next Habit ---
    const nextHabit = habits.find(h => !h.history[todayKey]);

    const FocusItem: React.FC<{
        icon: React.ReactNode;
        title: string;
        content: React.ReactNode;
        module: string;
        isComplete?: boolean;
    }> = ({ icon, title, content, module, isComplete = false }) => (
        <button 
            onClick={() => setActiveModule(module)}
            className="flex items-start gap-4 p-4 bg-white/5 rounded-lg w-full text-left transition-all duration-200 hover:bg-white/10 hover:ring-2 hover:ring-indigo-500/50"
        >
            <div className={`mt-1 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${isComplete ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
                {isComplete ? <CheckIcon className="w-5 h-5"/> : icon}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-caption text-gray-400">{title}</h4>
                <p className={`text-body-emphasis text-gray-100 truncate ${isComplete ? 'line-through text-gray-500' : ''}`}>
                    {content}
                </p>
            </div>
            <ChevronRightIcon className="w-6 h-6 text-gray-500 self-center flex-shrink-0" />
        </button>
    );

    return (
        <div 
            style={{ backgroundColor: '#252525', boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)' }}
            className="border border-indigo-500/30 rounded-2xl p-4"
        >
            <h2 className="text-module-header mb-4 px-2">Today's Focus</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FocusItem 
                    icon={<TasksIcon className="w-5 h-5"/>}
                    title="Critical Task"
                    content={criticalTask ? criticalTask.text : "All tasks complete!"}
                    module="TASKS"
                    isComplete={!criticalTask}
                />
                 <FocusItem 
                    icon={<BookOpenIcon className="w-5 h-5"/>}
                    title="Daily Reflection"
                    content={journalPrompt || "Loading prompt..."}
                    module="JOURNAL"
                />
                 <FocusItem 
                    icon={<RepeatIcon className="w-5 h-5"/>}
                    title="Next Habit"
                    content={nextHabit ? nextHabit.name : "All habits done!"}
                    module="HABITS"
                    isComplete={!nextHabit}
                />
            </div>
        </div>
    );
};

export default FocusBlock;