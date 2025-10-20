import React, { useState, useEffect } from 'react';
import Module from './Module';
import { StatsIcon, ChevronRightIcon } from './icons';
import { subDays, format, parseISO, isAfter } from 'date-fns';

// Simplified Sparkline component for the dashboard
const Sparkline: React.FC<{ data: number[]; className?: string }> = ({ data, className = '' }) => {
    const width = 100;
    const height = 30;
    if (data.length < 2) return <div style={{width, height}} className="flex items-center justify-center text-xs text-gray-400">Not enough data</div>;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * (height - 4) + 2; // Add padding
        return `${x},${y}`;
    }).join(' ');

    const isTrendingUp = data.length > 1 && data[data.length - 1] >= data[0];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={isTrendingUp ? '#34d399' : '#f87171'}
                strokeWidth="2"
                points={points}
            />
        </svg>
    );
};

const DashboardStatsWidget: React.FC<{ setActiveModule: (module: string) => void }> = ({ setActiveModule }) => {
    const [taskTrend, setTaskTrend] = useState<number[]>([]);
    const [habitTrend, setHabitTrend] = useState<number[]>([]);

    useEffect(() => {
        // Calculate trends
        const calculateTrends = () => {
            try {
                // Task trend: tasks completed per day for last 7 days
                const storedTasksRaw = localStorage.getItem('tasks');
                const tasks = storedTasksRaw ? JSON.parse(storedTasksRaw).data : [];
                const taskCompletionsByDay: number[] = [];
                for (let i = 6; i >= 0; i--) {
                    const date = subDays(new Date(), i);
                    const count = tasks.filter((t: any) => t.completed && t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).length;
                    taskCompletionsByDay.push(count);
                }
                setTaskTrend(taskCompletionsByDay);

                // Habit trend: completion % per day for last 7 days
                const storedHabitsRaw = localStorage.getItem('habits');
                const habits = storedHabitsRaw ? JSON.parse(storedHabitsRaw).data : [];
                const habitCompletionByDay: number[] = [];
                if (habits.length > 0) {
                     for (let i = 6; i >= 0; i--) {
                        const date = subDays(new Date(), i);
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const completedCount = habits.reduce((acc: number, h: any) => acc + (h.history[dateKey] ? 1 : 0), 0);
                        const percentage = Math.round((completedCount / habits.length) * 100);
                        habitCompletionByDay.push(percentage);
                    }
                }
                setHabitTrend(habitCompletionByDay);

            } catch (error) {
                console.error("Failed to calculate stats for widget:", error);
            }
        };
        
        calculateTrends();
        const interval = setInterval(calculateTrends, 5000);
        return () => clearInterval(interval);
    }, []);

    const StatTrendCard = ({ label, sparklineData, unit = '' }: { label: string, sparklineData: number[], unit?: string }) => (
        <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
            <div>
                <div className="text-sm text-gray-300">{label}</div>
                <div className="text-lg font-bold">{sparklineData.length > 0 ? sparklineData[sparklineData.length - 1] : 0}{unit}</div>
            </div>
            <Sparkline data={sparklineData} />
        </div>
    );

    return (
        <div onClick={() => setActiveModule('STATS')} className="cursor-pointer group">
            <Module title="Quick Stats" icon={<StatsIcon />}>
                <div className="space-y-4">
                    <StatTrendCard label="Tasks Completed" sparklineData={taskTrend} />
                    <StatTrendCard label="Habit Consistency" sparklineData={habitTrend} unit="%" />
                </div>
                 <div className="mt-4 text-xs text-indigo-400 flex items-center justify-end group-hover:text-indigo-300 transition-colors">
                    <span>View Full Report</span>
                    <ChevronRightIcon className="w-4 h-4 ml-2" />
                </div>
            </Module>
        </div>
    );
};

export default DashboardStatsWidget;