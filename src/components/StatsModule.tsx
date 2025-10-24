import React, { useState, useEffect, useMemo } from 'react';
import Module from '@/components/Module';
import { StatsIcon, CheckIcon, RepeatIcon, DumbbellIcon, SmileIcon } from '@/components/icons';
import { format, subDays, eachDayOfInterval, startOfWeek, getDay, parseISO, isAfter } from 'date-fns';

// --- Reusable Chart Components ---

const Tooltip: React.FC<{ content: string; x: number; y: number; visible: boolean }> = ({ content, x, y, visible }) => {
    if (!visible) return null;
    const [finalX, setFinalX] = useState(x);
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (tooltipRef.current) {
            const { innerWidth } = window;
            const { width } = tooltipRef.current.getBoundingClientRect();
            if (x + width / 2 > innerWidth) {
                setFinalX(innerWidth - width / 2 - 10);
            } else if (x - width / 2 < 0) {
                setFinalX(width / 2 + 10);
            } else {
                setFinalX(x);
            }
        }
    }, [x]);

    return (
        <div
            ref={tooltipRef}
            className="absolute bg-black/80 text-white text-xs px-2 py-2 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity z-50"
            style={{ left: finalX, top: y, opacity: visible ? 1 : 0 }}
        >
            {content}
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string; value: number }[]; color: string }> = ({ data, color }) => {
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; visible: boolean }>({ content: '', x: 0, y: 0, visible: false });
    const containerRef = React.useRef<HTMLDivElement>(null);
    const width = 320;
    const height = 160;
    const paddingY = 24;
    const paddingX = 8;
    const barPadding = 8;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const barWidth = (width - paddingX * 2) / data.length - barPadding;

    const handleMouseOver = (e: React.MouseEvent, d: { label: string; value: number }) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setTooltip({
                content: `${d.label}: ${d.value}`,
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top,
                visible: true,
            });
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                 {/* Y-axis labels */}
                <text x="8" y={paddingY} className="text-xs fill-gray-500">{maxValue}</text>
                <text x="8" y={height} className="text-xs fill-gray-500">0</text>
                {data.map((d, i) => {
                    const barHeight = d.value === 0 ? 0 : Math.max(2, (d.value / maxValue) * (height - paddingY));
                    const x = paddingX + i * (barWidth + barPadding);
                    const y = height - barHeight;
                    return (
                        <g key={d.label}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={color}
                                className="transition-all duration-300"
                                onMouseOver={(e) => handleMouseOver(e, d)}
                                onMouseOut={() => setTooltip(prev => ({ ...prev, visible: false }))}
                                rx="2"
                                ry="2"
                            />
                             <text x={x + barWidth/2} y={height + 16} textAnchor="middle" className="text-xs fill-gray-400">{d.label}</text>
                        </g>
                    );
                })}
            </svg>
            <Tooltip {...tooltip} />
        </div>
    );
};

const HabitHeatmap: React.FC<{ data: Record<string, number>; totalHabits: number }> = ({ data, totalHabits }) => {
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; visible: boolean }>({ content: '', x: 0, y: 0, visible: false });
    const containerRef = React.useRef<HTMLDivElement>(null);
    const endDate = new Date();
    const startDate = subDays(endDate, 90);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks = useMemo(() => {
        const weekMap: (Date | null)[][] = [];
        let currentWeekIndex = 0;
        let startDay = getDay(days[0]);
        
        weekMap[0] = Array(7).fill(null);
        
        days.forEach(day => {
            const dayOfWeek = getDay(day);
            if (dayOfWeek < startDay && day !== days[0]) {
                 currentWeekIndex++;
                 weekMap[currentWeekIndex] = Array(7).fill(null);
            }
            weekMap[currentWeekIndex][dayOfWeek] = day;
            startDay = dayOfWeek;
        });
        return weekMap;
    }, [days]);

    const getColor = (count: number) => {
        if (totalHabits === 0) return 'fill-gray-800';
        if (count === 0) return 'fill-gray-800/50';
        const percentage = count / totalHabits;
        if (percentage < 0.25) return 'fill-indigo-900';
        if (percentage < 0.5) return 'fill-indigo-700';
        if (percentage < 0.75) return 'fill-indigo-500';
        return 'fill-indigo-300';
    };
    
    const handleMouseOver = (e: React.MouseEvent, day: Date, count: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setTooltip({
                content: `${format(day, 'MMM d')}: ${count}/${totalHabits} habits`,
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 8,
                visible: true,
            });
        }
    };

    return (
        <div className="relative w-full overflow-x-auto" ref={containerRef}>
            <svg viewBox={`0 0 ${weeks.length * 16 + 24} 128`} className="min-w-[400px]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <text key={day + i} x="0" y={i * 16 + 12} className="text-[10px] fill-gray-400">{day}</text>
                ))}
                {weeks.map((week, weekIndex) => (
                    week.map((day, dayIndex) => {
                        if (!day) return null;
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const count = data[dateKey] || 0;
                        return (
                            <rect
                                key={dateKey}
                                x={weekIndex * 16 + 24}
                                y={dayIndex * 16}
                                width="16"
                                height="16"
                                rx="2"
                                ry="2"
                                className={`${getColor(count)} transition-colors`}
                                onMouseOver={(e) => handleMouseOver(e, day, count)}
                                onMouseOut={() => setTooltip(prev => ({...prev, visible: false}))}
                            />
                        );
                    })
                ))}
            </svg>
             <Tooltip {...tooltip} />
        </div>
    );
};

// --- Main Stats Module ---

type StatView = 'overview' | 'tasks' | 'habits' | 'moods' | 'workouts';

const StatsModule: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [view, setView] = useState<StatView>('overview');
    const [processedData, setProcessedData] = useState<any>({});

    useEffect(() => {
        const calculateStats = () => {
            try {
                // --- TASKS ---
                const tasksRaw = localStorage.getItem('tasks');
                const tasks = tasksRaw ? JSON.parse(tasksRaw).data : [];
                const tasksCompletedLast7Days = tasks.filter((t: any) => t.completed && t.completedAt && isAfter(parseISO(t.completedAt), subDays(new Date(), 7)));
                const tasksCompletedByDay: { [key: string]: number } = {};
                for (let i = 6; i >= 0; i--) {
                    const date = subDays(new Date(), i);
                    const dateKey = format(date, 'EEE');
                    tasksCompletedByDay[dateKey] = 0;
                }
                tasks.filter((t: any) => t.completed && t.completedAt).forEach((t: any) => {
                     const dateKey = format(parseISO(t.completedAt), 'EEE');
                     if(tasksCompletedByDay[dateKey] !== undefined) tasksCompletedByDay[dateKey]++;
                });
                const taskChartData = Object.entries(tasksCompletedByDay).map(([label, value]) => ({ label, value }));

                // --- HABITS ---
                const habitsRaw = localStorage.getItem('habits');
                const habits = habitsRaw ? JSON.parse(habitsRaw).data : [];
                const habitCompletionsByDay: Record<string, number> = {};
                if (habits.length > 0) {
                    for (let i = 90; i >= 0; i--) {
                        const date = subDays(new Date(), i);
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const completedCount = habits.reduce((acc: number, h: any) => acc + (h.history[dateKey] ? 1 : 0), 0);
                        habitCompletionsByDay[dateKey] = completedCount;
                    }
                }
                
                // --- MOODS ---
                const MOOD_ORDER = ['rad', 'good', 'meh', 'bad', 'awful'];
                const moodsRaw = localStorage.getItem('moodLogs');
                const moodLogs = moodsRaw ? JSON.parse(moodsRaw).data : {};
                const moodCounts: Record<string, number> = { 'rad': 0, 'good': 0, 'meh': 0, 'bad': 0, 'awful': 0 };
                 for (let i = 0; i < 30; i++) {
                    const date = subDays(new Date(), i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const log = moodLogs[dateKey];
                    if (log && log.mood in moodCounts) {
                        moodCounts[log.mood]++;
                    }
                }
                const moodChartData = MOOD_ORDER.map(mood => ({ label: mood, value: moodCounts[mood] || 0}));

                // --- WORKOUTS ---
                const historyRaw = localStorage.getItem('workoutHistory');
                const workouts = historyRaw ? JSON.parse(historyRaw).data : [];
                const workoutsLast30Days = workouts.filter((w: any) => w.completedAt && isAfter(parseISO(w.completedAt), subDays(new Date(), 30)));
                
                setProcessedData({
                    totalTasks: tasks.length,
                    tasksCompletedLast7Days: tasksCompletedLast7Days.length,
                    taskChartData,
                    totalHabits: habits.length,
                    habitCompletionsByDay,
                    moodChartData,
                    totalWorkouts: workouts.length,
                    workoutsLast30Days: workoutsLast30Days.length,
                });

            } catch (error) {
                console.error("Failed to calculate detailed stats:", error);
            }
        };

        calculateStats();
        const interval = setInterval(calculateStats, 5000); // Refresh data periodically
        return () => clearInterval(interval);
    }, []);

    const StatCard = ({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) => (
        <div className="bg-white/5 p-4 rounded-lg flex items-start gap-4">
            <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-300">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-gray-400">{label}</div>
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch (view) {
            case 'tasks':
                return (
                    <div className="w-full">
                        <h3 className="font-semibold mb-2 text-center">Tasks Completed (Last 7 Days)</h3>
                        {processedData.taskChartData ? <BarChart data={processedData.taskChartData} color="#818cf8" /> : <p>Loading...</p>}
                    </div>
                );
            case 'habits':
                 return (
                    <div className="w-full">
                        <h3 className="font-semibold mb-2">Habit Consistency (Last 90 Days)</h3>
                        {processedData.habitCompletionsByDay && processedData.totalHabits !== undefined ? (
                            <HabitHeatmap data={processedData.habitCompletionsByDay} totalHabits={processedData.totalHabits} />
                        ) : <p>Loading...</p>}
                    </div>
                );
            case 'moods':
                return (
                     <div className="w-full">
                        <h3 className="font-semibold mb-2 text-center">Mood Distribution (Last 30 Days)</h3>
                        {processedData.moodChartData ? <BarChart data={processedData.moodChartData} color="#a5b4fc" /> : <p>Loading...</p>}
                    </div>
                );
            case 'workouts':
                 return (
                    <div className="text-center p-8">
                         <DumbbellIcon className="w-12 h-12 mx-auto text-indigo-400 mb-4"/>
                         <p className="text-4xl font-bold">{processedData.workoutsLast30Days}</p>
                         <p className="text-gray-400">Workouts in the last 30 days</p>
                         <p className="text-sm text-gray-500 mt-4">Total workouts logged: {processedData.totalWorkouts}</p>
                     </div>
                 );
            default: // overview
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard icon={<CheckIcon />} value={processedData.tasksCompletedLast7Days || 0} label="Tasks this week" />
                        <StatCard icon={<RepeatIcon />} value={processedData.totalHabits || 0} label="Tracked Habits" />
                        <StatCard icon={<DumbbellIcon />} value={processedData.workoutsLast30Days || 0} label="Workouts this month" />
                        <StatCard icon={<SmileIcon />} value={processedData.moodChartData?.some((d: any) => d.value > 0) ? "Tracking" : "N/A"} label="Mood Logged" />
                    </div>
                );
        }
    };

    const tabs: { id: StatView; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'habits', label: 'Habits' },
        { id: 'moods', label: 'Moods' },
        { id: 'workouts', label: 'Workouts' },
    ];

    return (
        <Module title="Stats & Visualizations" icon={<StatsIcon />} className={className}>
            <div className="flex border-b border-white/10 mb-4 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setView(tab.id)}
                        className={`px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${view === tab.id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="min-h-[200px] flex items-center justify-center">
                 {renderContent()}
            </div>
        </Module>
    );
};

export default StatsModule;