import React, { useState, useEffect, useMemo } from 'react';
import usePersistentState from '@/hooks/usePersistentState';
import { ClipboardCheckIcon, LoaderIcon, SparklesIcon, XIcon } from '@/components/icons';
import { format, subDays, getWeek, parseISO, isWithinInterval } from 'date-fns';

// --- TYPE DEFINITIONS ---
interface Task {
  id: number;
  text: string;
  completed: boolean;
  completedAt?: string | null;
}
interface MoodLog {
  mood: string;
  note: string;
}
interface Habit {
  id: number;
  name: string;
  history: { [date: string]: number };
  schedule?: number[];
}
interface JournalEntry {
  promptText: string;
  entryText: string;
}

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('##').filter(line => line.trim() !== '');
    
    return (
        <div className="space-y-6 font-serif">
            {lines.map((line, index) => {
                const [title, ...bodyParts] = line.split('\n').filter(part => part.trim() !== '');
                const body = bodyParts.join('\n');
                return (
                    <div key={index} className="bg-black/30 p-6 rounded-lg ring-1 ring-white/10">
                        <h2 className="text-xl font-semibold text-indigo-300 mb-3 text-center">{title.replace(/-/g, '').trim()}</h2>
                        <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap">{body.trim()}</p>
                    </div>
                );
            })}
        </div>
    );
};

const WeeklyReviewModule: React.FC<{
    setIsFocusMode: (isFocused: boolean) => void;
    setActiveModule: (module: string) => void;
}> = ({ setIsFocusMode, setActiveModule }) => {
    const [tasks] = usePersistentState<Task[]>('tasks', []);
    const [journalEntries] = usePersistentState<Record<string, JournalEntry>>('journalEntries', {});
    const [moods] = usePersistentState<Record<string, MoodLog>>('moodLogs', {});
    const [habits] = usePersistentState<Habit[]>('habits', []);
    const [reviewCache, setReviewCache] = usePersistentState<Record<string, string>>('weeklyReviewCache', {});
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [review, setReview] = useState<string | null>(null);

    const cacheKey = useMemo(() => `${new Date().getFullYear()}-${getWeek(new Date())}`, []);

    useEffect(() => {
        setIsFocusMode(true);
        if (reviewCache[cacheKey]) {
            setReview(reviewCache[cacheKey]);
        }
        return () => setIsFocusMode(false);
    }, [setIsFocusMode, cacheKey, reviewCache]);
    
    const handleGenerateReview = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const sevenDaysAgo = subDays(new Date(), 7);
            const today = new Date();

            const weeklyTasks = tasks.filter((task: Task) => 
                task.completedAt && isWithinInterval(parseISO(task.completedAt), { start: sevenDaysAgo, end: today })
            );

            const weeklyJournal = Object.entries(journalEntries)
                .filter(([date]) => isWithinInterval(parseISO(date), { start: sevenDaysAgo, end: today }))
                .map(([date, entry]: [string, JournalEntry]) => ({
                    date,
                    mood: moods[date]?.mood,
                    entryText: entry.entryText.replace(/<[^>]*>?/gm, '') // Sanitize HTML
                }));
                
            const weeklyHabits = habits.map((habit: Habit) => {
                let completedDays = 0;
                let totalDays = 0;
                for (let i = 0; i < 7; i++) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    if (!habit.schedule || habit.schedule.includes(date.getDay())) {
                        totalDays++;
                        if (habit.history[dateKey] && habit.history[dateKey] > 0) {
                            completedDays++;
                        }
                    }
                }
                return { name: habit.name, completedDays, totalDays };
            });

            const response = await fetch('/api/journal/weekly-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tasks: weeklyTasks,
                    journalEntries: weeklyJournal,
                    moods,
                    habits: weeklyHabits,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const newReview = data.weeklyReview.trim();

            setReview(newReview);
            setReviewCache((prev: Record<string, string>) => ({ ...prev, [cacheKey]: newReview }));

        } catch (err) {
            console.error("Failed to generate weekly review:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in">
            <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
            
            <header className="flex-shrink-0 w-full max-w-4xl mx-auto flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <ClipboardCheckIcon className="w-8 h-8 text-indigo-300" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Weekly Review</h1>
                </div>
                <button 
                  onClick={() => setActiveModule('DASHBOARD')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close review"
                >
                  <XIcon className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-grow w-full max-w-3xl mx-auto overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <LoaderIcon className="w-12 h-12 text-indigo-400 mb-4" />
                        <h2 className="text-xl font-semibold text-white">Aura is reflecting on your week...</h2>
                        <p className="text-gray-400 mt-2">This may take a moment.</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center bg-red-500/10 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-red-300">Generation Failed</h2>
                        <p className="text-red-400 mt-2">{error}</p>
                        <button onClick={handleGenerateReview} className="mt-6 px-4 py-2 bg-indigo-600 rounded-md font-semibold">Try Again</button>
                    </div>
                ) : review ? (
                    <SimpleMarkdownRenderer content={review} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <SparklesIcon className="w-16 h-16 text-indigo-400 mb-6" />
                        <h2 className="text-2xl font-semibold text-white">Unlock Your Weekly Insights</h2>
                        <p className="text-gray-300 mt-4 max-w-md">
                            Let Aura analyze your progress, find patterns in your journal, and provide personalized feedback to help you grow.
                        </p>
                        <button 
                            onClick={handleGenerateReview} 
                            className="mt-8 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-transform hover:scale-105"
                        >
                            Generate My Review
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default WeeklyReviewModule;
