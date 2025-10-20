import React, { useState, useEffect, useMemo } from 'react';
import Module from './Module';
import { SparklesIcon, LoaderIcon, XIcon, ChevronRightIcon } from './icons';
import usePersistentState from '../hooks/usePersistentState';
import { format, subDays, parseISO, getDay } from 'date-fns';

// --- TYPE DEFINITIONS (aligned with other modules) ---
interface Task {
  id: number;
  text: string;
  completed: boolean;
  completedAt?: string | null;
}
interface MoodLog {
  mood: 'rad' | 'good' | 'meh' | 'bad' | 'awful';
  note: string;
}
interface Habit {
    id: number;
    name: string;
    history: { [date: string]: number }; // Using number for progress
    schedule?: number[];
}

// --- ANALYSIS CONSTANTS ---
const ANALYSIS_PERIOD_DAYS = 30;
const LATE_HOUR_THRESHOLD = 22; // 10 PM
const MOOD_RISK_SCORE = { 'rad': -1, 'good': 0, 'meh': 1, 'bad': 2, 'awful': 3 };
const WORKOUT_HABIT_KEYWORDS = ['workout', 'gym', 'run', 'exercise', 'fitness'];

const ProactiveSuggestions: React.FC<{ setActiveModule: (module: string) => void }> = ({ setActiveModule }) => {
  const [tasks] = usePersistentState<Task[]>('tasks', []);
  const [moods] = usePersistentState<Record<string, MoodLog>>('moodLogs', {});
  const [habits] = usePersistentState<Habit[]>('habits', []);
  
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const [dismissedInsights, setDismissedInsights] = usePersistentState<Record<string, boolean>>('dismissedInsights', {});

  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState<{ text: string, suggestion: string, module: string } | null>(null);

  const isDismissedToday = dismissedInsights[todayKey];

  useEffect(() => {
    const runAnalysis = () => {
      // Don't re-run if already dismissed
      if (isDismissedToday) {
        setIsLoading(false);
        return;
      }

      // 1. GATHER DATA for the last 30 days
      const startDate = subDays(new Date(), ANALYSIS_PERIOD_DAYS);
      const dateRange = Array.from({ length: ANALYSIS_PERIOD_DAYS }, (_, i) => subDays(new Date(), i));
      
      let riskScore = 0;
      let lateNights = 0;
      let lowMoodDays = 0;
      let workoutSkipCount = 0;
      let workoutOpportunityCount = 0;

      const workoutHabit = habits.find(h => WORKOUT_HABIT_KEYWORDS.some(keyword => h.name.toLowerCase().includes(keyword)));
      
      // 2. ANALYZE PATTERNS
      dateRange.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDay(date);

        // Mood analysis
        const mood = moods[dateKey];
        if (mood) {
            const moodScore = MOOD_RISK_SCORE[mood.mood] || 0;
            if(moodScore > 1) lowMoodDays++;
        }

        // Late night task completion analysis
        const lateTasks = tasks.filter(t => t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dateKey && parseISO(t.completedAt).getHours() >= LATE_HOUR_THRESHOLD);
        if (lateTasks.length > 0) lateNights++;

        // Workout habit analysis
        if (workoutHabit) {
          const isScheduled = !workoutHabit.schedule || workoutHabit.schedule.includes(dayOfWeek);
          if (isScheduled) {
            workoutOpportunityCount++;
            const progress = workoutHabit.history[dateKey];
            const isSkipped = progress === undefined || progress <= 0;
            
            // If mood was low the day before, did they skip a workout?
            const yesterdayKey = format(subDays(date, 1), 'yyyy-MM-dd');
            const yesterdayMood = moods[yesterdayKey];
            if (isSkipped && yesterdayMood && (yesterdayMood.mood === 'bad' || yesterdayMood.mood === 'awful')) {
              workoutSkipCount++;
            }
          }
        }
      });

      // 3. GENERATE TODAY'S PREDICTION
      let generatedInsight: { text: string, suggestion: string, module: string } | null = null;
      
      // Insight 1: Workout skip prediction
      if (workoutHabit) {
        const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        const yesterdayMood = moods[yesterdayKey];
        const isWorkoutScheduledToday = !workoutHabit.schedule || workoutHabit.schedule.includes(getDay(new Date()));
        const isWorkoutDoneToday = workoutHabit.history[todayKey] !== undefined && workoutHabit.history[todayKey] > 0;
        
        if (isWorkoutScheduledToday && !isWorkoutDoneToday && yesterdayMood && (yesterdayMood.mood === 'bad' || yesterdayMood.mood === 'awful')) {
            const skipProbability = workoutOpportunityCount > 0 ? Math.round((workoutSkipCount / workoutOpportunityCount) * 100) : 0;
            if (skipProbability > 30) {
                 generatedInsight = {
                    text: `Based on your recent patterns, you're about ${skipProbability}% more likely to skip a workout after a low-mood day.`,
                    suggestion: "Consider a lighter 15-minute routine to stay on track.",
                    module: "WORKOUT"
                };
            }
        }
      }

      // Insight 2: Burnout warning (if no workout insight was generated)
      if (!generatedInsight && lateNights > 5 && lowMoodDays > 5) {
          const burnoutRisk = Math.round(((lateNights + lowMoodDays) / (ANALYSIS_PERIOD_DAYS * 2)) * 100);
           generatedInsight = {
              text: `You've had ${lateNights} late nights and ${lowMoodDays} low-mood days this month, indicating a ${burnoutRisk}% risk of burnout.`,
              suggestion: "Try journaling for 5 minutes to reflect and de-stress.",
              module: "JOURNAL"
          };
      }

      setInsight(generatedInsight);
      setIsLoading(false);
    };

    // Run analysis after a short delay to allow the main UI to render
    const timer = setTimeout(runAnalysis, 1500);
    return () => clearTimeout(timer);
  }, [tasks, moods, habits, todayKey, isDismissedToday]);

  const handleDismiss = () => {
    setDismissedInsights({ ...dismissedInsights, [todayKey]: true });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-2xl border border-transparent">
        <LoaderIcon className="w-5 h-5 text-indigo-300" />
        <span className="text-sm text-gray-400">Analyzing recent patterns...</span>
      </div>
    );
  }

  if (!insight || isDismissedToday) {
    return null; // Don't render if there's no insight or it's been dismissed
  }

  return (
    <Module
        title="AI Insight"
        icon={<SparklesIcon />}
        className="!border-indigo-500/50"
    >
        <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="flex-1">
                <p className="text-body text-gray-200">{insight.text}</p>
                <button 
                  onClick={() => setActiveModule(insight.module)}
                  className="mt-2 flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors group"
                >
                    <span>{insight.suggestion}</span>
                    <ChevronRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            <button 
                onClick={handleDismiss}
                className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Dismiss insight for today"
            >
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    </Module>
  );
};

export default ProactiveSuggestions;