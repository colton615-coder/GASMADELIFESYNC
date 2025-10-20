import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import Module from './Module';
import { RepeatIcon, PlusIcon, TrashIcon, CheckIcon, XIcon, FlameIcon, MinusIcon, SkipForwardIcon, RotateCcwIcon } from './icons';
import usePersistentState from '../hooks/usePersistentState';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from 'date-fns';
import AnimatedCheckbox from './AnimatedCheckbox';

interface Habit {
  id: number;
  name: string;
  icon: string; // Emoji
  history: { [date: string]: number }; // date key 'yyyy-MM-dd', value is progress, -1 for skipped
  target?: number; // Optional target for quantity-based habits
  unit?: string; // Optional unit for the target (e.g., 'glasses', 'minutes')
  schedule?: number[]; // Optional: array of days [0-6] for Sun-Sat. undefined means every day.
}

const DEFAULT_HABITS: Habit[] = [
  { id: 1, name: 'Read for 15 mins', icon: '📚', history: {}, target: 15, unit: 'mins' },
  { id: 2, name: 'Drink 8 glasses of water', icon: '💧', history: {}, target: 8, unit: 'glasses' },
  { id: 3, name: 'Morning meditation', icon: '🧘', history: {} },
  { id: 4, name: 'Gym workout', icon: '💪', history: {}, schedule: [1, 3, 5] }, // M, W, F
];

// Helper to check if a habit is scheduled for a specific day
const isScheduledForDay = (habit: Habit, date: Date): boolean => {
  if (!habit.schedule || habit.schedule.length === 0) {
    return true; // Scheduled every day
  }
  const dayOfWeek = getDay(date); // date-fns: Sunday = 0, Monday = 1, ...
  return habit.schedule.includes(dayOfWeek);
};


const HabitCard: React.FC<{
  habit: Habit;
  onUpdateProgress: (habitId: number, date: Date, delta: number) => void;
  onDelete: (habitId: number) => void;
  onSkip: (habitId: number, date: Date) => void;
  onUnskip: (habitId: number, date: Date) => void;
}> = ({ habit, onUpdateProgress, onDelete, onSkip, onUnskip }) => {
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');

  const target = habit.target ?? 1;
  const unit = habit.unit ?? '';
  const isSimpleHabit = target === 1 && !habit.unit;
  
  const dailyProgress = habit.history[todayKey] ?? 0;
  const isCompletedToday = dailyProgress >= target;
  const isSkippedToday = dailyProgress === -1;

  const streak = useMemo(() => {
    let currentStreak = 0;
    let dayToCheck = new Date();
    const effectiveTarget = habit.target ?? 1;
    
    // If today's habit isn't done, start checking from yesterday.
    const todayKey = format(dayToCheck, 'yyyy-MM-dd');
    const todayProgress = habit.history[todayKey] ?? 0;
    if (todayProgress < effectiveTarget && todayProgress !== -1) {
      dayToCheck = subDays(dayToCheck, 1);
    }
    
    while (true) {
      const dateKey = format(dayToCheck, 'yyyy-MM-dd');
      const progress = habit.history[dateKey];

      if (isScheduledForDay(habit, dayToCheck)) {
        if (progress !== undefined && (progress >= effectiveTarget || progress === -1)) {
          // It was scheduled and was completed or skipped.
          currentStreak++;
        } else {
          // It was scheduled but not completed. Streak is broken.
          break;
        }
      }
      // If it wasn't scheduled, we just skip it and continue the streak.
      dayToCheck = subDays(dayToCheck, 1);
      
      // Safety break for very old habits to avoid infinite loops
      if (currentStreak > 1000) break;
    }
    return currentStreak;
  }, [habit.history, habit.target, habit.schedule]);

  const weeklyProgress = useMemo(() => {
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    const weekDates = eachDayOfInterval({ start, end });
    const effectiveTarget = habit.target ?? 1;
    
    const scheduledDaysInWeek = weekDates.filter(date => isScheduledForDay(habit, date)).length;
    
    if (scheduledDaysInWeek === 0) return 100;

    const completedDays = weekDates.reduce((count, date) => {
        if (isScheduledForDay(habit, date)) {
            const dateKey = format(date, 'yyyy-MM-dd');
            const progress = habit.history[dateKey];
            if (progress !== undefined && (progress >= effectiveTarget || progress === -1)) {
                return count + 1;
            }
        }
        return count;
    }, 0);
    
    return (completedDays / scheduledDaysInWeek) * 100;
  }, [habit.history, habit.target, habit.schedule, today]);

  const quantityProgress = isSkippedToday ? 100 : (target > 1 ? (dailyProgress / target) * 100 : (isCompletedToday ? 100 : 0));

  return (
    <div className={`relative group bg-white/5 p-4 rounded-lg flex flex-col gap-4 transition-all duration-300 
      ${isCompletedToday ? 'bg-green-500/10 ring-1 ring-green-500/30' : ''}
      ${isSkippedToday ? 'bg-gray-500/10' : ''}
    `}>
        <div className="flex justify-between items-center">
            <div className="flex items-start gap-3">
                <span className="text-3xl mt-1" aria-hidden="true">{habit.icon}</span>
                <div>
                    <h4 className="text-body-emphasis text-white">{habit.name}</h4>
                    {streak > 0 && (
                        <div className="flex items-center gap-2 mt-1 bg-orange-500/10 text-orange-400 font-bold px-2 py-1 rounded-full text-xs w-fit">
                            <FlameIcon className="w-4 h-4" />
                            <span>{streak} Day Streak</span>
                        </div>
                    )}
                </div>
            </div>

            {isSimpleHabit ? (
                <div className="flex items-center gap-2 self-end">
                    <span className="text-sm font-semibold text-gray-300">
                      {isSkippedToday ? 'Skipped' : isCompletedToday ? 'Done!' : 'Done Today'}
                    </span>
                    <AnimatedCheckbox
                        checked={isCompletedToday}
                        onChange={() => onUpdateProgress(habit.id, today, isCompletedToday ? 0 : 1)}
                        variant="round"
                        disabled={isSkippedToday}
                    />
                </div>
            ) : (
                <div className="flex items-center gap-2 self-end">
                    <button 
                        onClick={() => onUpdateProgress(habit.id, today, -1)} 
                        disabled={dailyProgress <= 0 || isSkippedToday} 
                        className="p-1 w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold flex items-center justify-center transition-colors"
                        aria-label="Decrement progress"
                    >
                        <MinusIcon className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-semibold text-white w-24 text-center tabular-nums">
                        {isSkippedToday ? 'Skipped' : `${dailyProgress} / ${target}`}
                    </span>
                    <button 
                        onClick={() => onUpdateProgress(habit.id, today, 1)} 
                        disabled={isCompletedToday || isSkippedToday} 
                        className="p-1 w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold flex items-center justify-center transition-colors"
                        aria-label="Increment progress"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
        
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-400">{isSimpleHabit ? 'Weekly Consistency' : `Today's Goal: ${target} ${unit}`}</span>
                <span className="text-xs font-semibold text-gray-300">{Math.round(isSimpleHabit ? weeklyProgress : quantityProgress)}%</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-2 rounded-full transition-all duration-500 ease-out 
                      ${isCompletedToday ? 'bg-gradient-to-r from-green-400 to-teal-400' : 
                       isSkippedToday ? 'bg-gray-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                    style={{ width: `${isSimpleHabit ? weeklyProgress : quantityProgress}%` }}
                />
            </div>
        </div>
        
        <div className="absolute top-2 right-2 flex items-center">
          {!isCompletedToday && (
            isSkippedToday ? (
              <button onClick={() => onUnskip(habit.id, today)} className="p-2 rounded-full text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-colors" aria-label={`Undo skip for: ${habit.name}`}>
                <RotateCcwIcon className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => onSkip(habit.id, today)} className="p-2 rounded-full text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors opacity-0 group-hover:opacity-100" aria-label={`Skip today for: ${habit.name}`}>
                <SkipForwardIcon className="w-4 h-4" />
              </button>
            )
          )}
          <button onClick={() => onDelete(habit.id)} className="p-2 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100" aria-label={`Delete habit: ${habit.name}`}>
              <TrashIcon className="w-4 h-4" />
          </button>
        </div>
    </div>
  );
};

const HabitTrackerModule: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [habits, setHabits] = usePersistentState<Habit[]>('habits', DEFAULT_HABITS);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('✨');
  const [newHabitTarget, setNewHabitTarget] = useState('');
  const [newHabitUnit, setNewHabitUnit] = useState('');
  const [newHabitSchedule, setNewHabitSchedule] = useState<number[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingHabitId, setDeletingHabitId] = useState<number | null>(null);

  const habitsDueToday = useMemo(() => {
    const today = new Date();
    return habits.filter(habit => isScheduledForDay(habit, today));
  }, [habits]);

  useEffect(() => {
    const migrationKey = 'habitsMigrationV2_quantity';
    if (localStorage.getItem(migrationKey)) return;
    const needsMigration = habits.some(habit => Object.values(habit.history).some(value => typeof (value as any) === 'boolean'));
    if (needsMigration) {
        const migratedHabits = habits.map(habit => {
            const newHistory: { [date: string]: number } = {};
            Object.entries(habit.history).forEach(([date, value]) => { newHistory[date] = Number(value as any); });
            return { ...habit, history: newHistory };
        });
        setHabits(migratedHabits);
    }
    localStorage.setItem(migrationKey, 'true');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddHabit = (e: FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim() === '') return;
    const targetValue = newHabitTarget ? parseInt(newHabitTarget, 10) : undefined;
    const scheduleValue = (newHabitSchedule.length === 0 || newHabitSchedule.length === 7) ? undefined : newHabitSchedule.sort((a,b) => a - b);
    const newHabit: Habit = {
      id: Date.now(),
      name: newHabitName.trim(), icon: newHabitIcon, history: {},
      target: targetValue && !isNaN(targetValue) && targetValue > 0 ? targetValue : undefined,
      unit: newHabitUnit.trim() || undefined,
      schedule: scheduleValue,
    };
    setHabits([...habits, newHabit]);
    setNewHabitName(''); setNewHabitIcon('✨'); setNewHabitTarget(''); setNewHabitUnit(''); setNewHabitSchedule([]);
    setIsAdding(false);
  };

  const updateHabitProgress = (habitId: number, date: Date, delta: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newHistory = { ...habit.history };
        const currentProgress = newHistory[dateKey] ?? 0;
        let newProgress = (currentProgress === -1 && delta > 0) ? delta : Math.max(0, currentProgress + delta);
        const target = habit.target ?? 1;
        if (newProgress > target) { newProgress = target; }
        newHistory[dateKey] = newProgress;
        return { ...habit, history: newHistory };
      }
      return habit;
    }));
  };

  const handleSkipDay = (habitId: number, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setHabits(habits.map(habit => {
        if (habit.id === habitId) {
            const newHistory = { ...habit.history, [dateKey]: -1 };
            return { ...habit, history: newHistory };
        }
        return habit;
    }));
  };

  const handleUnskipDay = (habitId: number, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setHabits(habits.map(habit => {
        if (habit.id === habitId) {
            const newHistory = { ...habit.history, [dateKey]: 0 };
            return { ...habit, history: newHistory };
        }
        return habit;
    }));
  };

  const handleDeleteHabit = (id: number) => setDeletingHabitId(id);
  const confirmDeleteHabit = () => { if (deletingHabitId !== null) { setHabits(habits.filter(habit => habit.id !== deletingHabitId)); setDeletingHabitId(null); } };
  const cancelDeleteHabit = () => setDeletingHabitId(null);
  
  const toggleScheduleDay = (dayIndex: number) => {
    setNewHabitSchedule(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
  };

  const DayPicker: React.FC = () => (
    <div className="flex justify-center gap-1">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
        <button key={index} type="button" onClick={() => toggleScheduleDay(index)} className={`w-10 h-10 rounded-full font-semibold text-sm transition-colors ${newHabitSchedule.includes(index) ? 'bg-indigo-500 text-white' : 'bg-black/30 text-gray-300 hover:bg-white/20'}`}>
          {day}
        </button>
      ))}
    </div>
  );

  return (
    <Module title="Habit Tracker" icon={<RepeatIcon />} className={className}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        {habitsDueToday.length > 0 ? habitsDueToday.map(habit => (
            deletingHabitId === habit.id ? (
              <div key={habit.id} className="p-4 bg-red-500/10 rounded-lg flex items-center justify-between text-sm">
                <span className="text-red-400 font-semibold">Delete this habit?</span>
                <div className="flex items-center gap-2">
                  <button onClick={confirmDeleteHabit} className="p-2 rounded-full text-white bg-red-600 hover:bg-red-700" aria-label="Confirm"><CheckIcon className="w-4 h-4" /></button>
                  <button onClick={cancelDeleteHabit} className="p-2 rounded-full text-gray-300 bg-white/10 hover:bg-white/20" aria-label="Cancel"><XIcon className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <HabitCard key={habit.id} habit={habit} onUpdateProgress={updateHabitProgress} onDelete={handleDeleteHabit} onSkip={handleSkipDay} onUnskip={handleUnskipDay} />
            )
        )) : <p className="text-center text-caption py-4">No habits scheduled for today. Enjoy your day off!</p>}

        {isAdding ? (
          <form onSubmit={handleAddHabit} className="p-4 bg-white/10 rounded-lg flex flex-col gap-4">
            <div className="flex gap-2">
                <input value={newHabitIcon} onChange={(e) => setNewHabitIcon(e.target.value.slice(0, 2))} placeholder="✨" className="w-14 text-center bg-black/30 text-white rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" maxLength={2} aria-label="Habit icon" />
                <input value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="New habit name..." className="flex-grow bg-black/30 text-white placeholder-gray-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" autoFocus aria-label="Habit name" />
            </div>
            <div className="flex gap-2 text-sm">
                <input type="number" value={newHabitTarget} onChange={(e) => setNewHabitTarget(e.target.value)} placeholder="Target (e.g., 8)" min="1" className="w-full bg-black/30 text-white placeholder-gray-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" aria-label="Habit target quantity" />
                <input type="text" value={newHabitUnit} onChange={(e) => setNewHabitUnit(e.target.value)} placeholder="Unit (e.g., glasses)" className="w-full bg-black/30 text-white placeholder-gray-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" aria-label="Habit target unit" />
            </div>
            <div>
                <p className="text-sm text-center text-gray-400 mb-2">Schedule (or leave blank for everyday)</p>
                <DayPicker />
            </div>
            <p className="text-xs text-gray-400 text-center">Leave Target blank for a simple daily check-in habit.</p>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 font-semibold">Add Habit</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 rounded-lg text-center hover:bg-white/10 transition text-indigo-300 font-semibold">
            <PlusIcon /> Add New Habit
          </button>
        )}
      </div>
    </Module>
  );
};

export default HabitTrackerModule;
