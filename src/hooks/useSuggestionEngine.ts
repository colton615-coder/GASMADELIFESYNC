  const [snoozed, setSnoozed] = usePersistentState<Record<string, number>>('snoozedSuggestions', {});
  const [tasks] = usePersistentState<any[]>('tasks', []);
  const [habits] = usePersistentState<any[]>('habits', []);
  const [dismissed, setDismissed] = usePersistentState<string[]>('dismissedSuggestions', []);
import { useEffect, useMemo, useState } from 'react';
import usePersistentState from '@/hooks/usePersistentState';

export type Suggestion = {
  id: string;
  type: 'mood' | 'task' | 'habit' | 'general';
  title: string;
  description: string;
  action?: {
    label: string;
    callback?: () => void;
  };
};

// Simple heuristic-based suggestion engine. Designed to be extendable.
export function useSuggestionEngine() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [journalEntries] = usePersistentState<Record<string, any>>('journalEntries', {});
  const [moodLogs] = usePersistentState<Record<string, any>>('moodLogs', {});

  useEffect(() => {
    let mounted = true;

    function build() {
      try {
        const allEntries = Object.keys(journalEntries || {}).map((date) => {
          return {
            date,
            entryText: journalEntries[date].entryText,
            mood: moodLogs?.[date]?.mood ?? null,
            createdAt: new Date(date).toISOString(),
          };
        });

        // Mood-based suggestion: check last 7 days for downward trend
        const last7 = (allEntries || []).filter((e: any) => {
          const d = new Date(e.createdAt || e.date || e.timestamp);
          return (Date.now() - d.getTime()) <= 1000 * 60 * 60 * 24 * 7;
        });

        const moods = last7
          .map((e: any) => {
            if (typeof e.mood === 'string') {
              // map textual moods used in JournalModule to numeric scores
              switch (e.mood) {
                case 'rad': return 5;
                case 'good': return 4;
                case 'meh': return 3;
                case 'bad': return 2;
                case 'awful': return 1;
                default: return null;
              }
            }
            return typeof e.mood === 'number' ? e.mood : null;
          })
          .filter((m: any) => typeof m === 'number') as number[];

        const moodSuggestion: Suggestion | null = (() => {
          if (moods.length < 3) return null; // not enough data

          const half = Math.floor(moods.length / 2);
          const firstAvg = moods.slice(0, half).reduce((a: number, b: number) => a + b, 0) / Math.max(1, half);
          const secondAvg = moods.slice(half).reduce((a: number, b: number) => a + b, 0) / Math.max(1, moods.length - half);

          if (secondAvg + 0.5 <= firstAvg) {
            return {
              id: 'sugg-mood-1',
              type: 'mood',
              title: 'Take a mindful moment',
              description: 'Your recent entries show a downward mood trend. Try a 3-minute breathing exercise or a short walk.',
              action: { label: 'Open Mindful Moments' },
            } as Suggestion;
          }

          return null;
        })();

        const built: Suggestion[] = [];
        if (moodSuggestion && !dismissed.includes(moodSuggestion.id) && !isSnoozed(moodSuggestion.id)) {
          built.push({
            ...moodSuggestion,
            action: {
              label: 'Open Mindful Moments',
              callback: () => {
                // Example: could trigger a modal or set a global state
                window.dispatchEvent(new CustomEvent('openMindfulMoments'));
              }
            }
          });
        }
        function isSnoozed(id: string) {
          const until = snoozed[id];
          return until && until > Date.now();
        }
        // Snooze suggestion by id for N minutes
        const snoozeSuggestion = (id: string, minutes: number = 60) => {
          setSnoozed({ ...snoozed, [id]: Date.now() + minutes * 60 * 1000 });
        };

        // Task-based suggestion: urgent or overdue tasks
        const now = new Date();
        const urgentTasks = (tasks || []).filter((t: any) => {
          if (t.completed) return false;
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due.getTime() - now.getTime() < 1000 * 60 * 60 * 24; // due within 24h
        });
        if (urgentTasks.length > 0 && !dismissed.includes('sugg-task-1')) {
          built.push({
            id: 'sugg-task-1',
            type: 'task',
            title: 'Focus on urgent tasks',
            description: `You have ${urgentTasks.length} task(s) due soon. Consider scheduling a Focus Block to complete them.`,
            action: {
              label: 'Schedule Focus Block',
              callback: () => {
                window.dispatchEvent(new CustomEvent('openFocusBlock'));
              }
            },
          });
        }

        // Habit-based suggestion: missed daily habit by evening
        const hour = now.getHours();
        if (hour >= 18 && habits && habits.length > 0 && !dismissed.includes('sugg-habit-1')) {
          const missed = habits.filter((h: any) => !h.completedToday);
          if (missed.length > 0) {
            built.push({
              id: 'sugg-habit-1',
              type: 'habit',
              title: 'Complete your daily habits',
              description: `You have ${missed.length} habit(s) left for today. Stay consistent!`,
              action: {
                label: 'Mark Habit Done',
                callback: () => {
                  window.dispatchEvent(new CustomEvent('markHabitDone', { detail: missed[0]?.id }));
                }
              },
            });
          }
        }

        if (mounted) setSuggestions(built);
        // Dismiss suggestion by id
        const dismissSuggestion = (id: string) => {
          setDismissed([...dismissed, id]);
        };

        // Return all suggestion actions
        return { suggestions: built, dismissSuggestion, snoozeSuggestion };
      } catch (err) {
        // Silently fail and leave suggestions empty
        console.error('Suggestion engine error:', err);
        return { suggestions: [], dismissSuggestion: () => {}, snoozeSuggestion: () => {} };
      }
    }

    const result = build();
    if (result && mounted) {
      // Only set suggestions if build succeeded
      setSuggestions(result.suggestions);
    }
    const id = setInterval(() => {
      const result = build();
      if (result && mounted) {
        setSuggestions(result.suggestions);
      }
    }, 1000 * 60 * 5); // refresh every 5 minutes

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Always return suggestion actions
  const snoozeSuggestion = (id: string, minutes: number = 60) => {
    setSnoozed({ ...snoozed, [id]: Date.now() + minutes * 60 * 1000 });
  };
  const dismissSuggestion = (id: string) => {
    setDismissed([...dismissed, id]);
  };
  return { suggestions, dismissSuggestion, snoozeSuggestion };
}

export default useSuggestionEngine;
