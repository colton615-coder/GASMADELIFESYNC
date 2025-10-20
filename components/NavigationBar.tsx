import React, { memo, useCallback, useState } from 'react';
import { 
    HomeIcon, 
    TasksIcon, 
    CalendarDaysIcon, 
    RepeatIcon, 
    ShoppingCartIcon, 
    DumbbellIcon, 
    GolfIcon, 
    BookOpenIcon, 
    StatsIcon,
    SettingsIcon,
    ClipboardCheckIcon
} from './icons';

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    moduleId: string;
    isActive: boolean;
    onClick: (moduleId: string) => void;
}

const NavButton: React.FC<NavButtonProps> = memo(({ icon, label, moduleId, isActive, onClick }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = useCallback(() => {
        onClick(moduleId);
        setIsAnimating(true);
    }, [onClick, moduleId]);

    return (
        <button 
            onClick={handleClick} 
            onAnimationEnd={() => setIsAnimating(false)}
            className={`flex flex-col items-center justify-center gap-2 w-20 h-16 rounded-lg flex-shrink-0 active:scale-95 ${
                isActive 
                ? 'text-indigo-400 bg-indigo-500/10' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            } ${isAnimating ? 'nav-icon-pop-animation' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
        >
            <div className="w-6 h-6">{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
});

interface NavigationBarProps {
    activeModule: string;
    setActiveModule: (module: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeModule, setActiveModule }) => {
    const navItems = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: <HomeIcon /> },
        { id: 'CALENDAR', label: 'Calendar', icon: <CalendarDaysIcon /> },
        { id: 'TASKS', label: 'Tasks', icon: <TasksIcon /> },
        { id: 'HABITS', label: 'Habits', icon: <RepeatIcon /> },
        { id: 'SHOPPING', label: 'Shopping', icon: <ShoppingCartIcon /> },
        { id: 'WORKOUT', label: 'Workout', icon: <DumbbellIcon /> },
        { id: 'SWING', label: 'Swing', icon: <GolfIcon /> },
        { id: 'JOURNAL', label: 'Journal', icon: <BookOpenIcon /> },
        { id: 'STATS', label: 'Stats', icon: <StatsIcon /> },
        { id: 'WEEKLY_REVIEW', label: 'Review', icon: <ClipboardCheckIcon /> },
        { id: 'SETTINGS', label: 'Settings', icon: <SettingsIcon /> },
    ];

    const handleNavigate = useCallback((moduleId: string) => {
        setActiveModule(moduleId);
    }, [setActiveModule]);

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#121212]/50 backdrop-blur-lg border-t border-white/10 z-50">
            <div className="flex items-center justify-start sm:justify-center h-full px-2 overflow-x-auto overflow-y-hidden">
                <div className="flex items-center gap-2">
                    {navItems.map(item => (
                        <NavButton
                            key={item.id}
                            label={item.label}
                            icon={item.icon}
                            moduleId={item.id}
                            isActive={activeModule === item.id}
                            onClick={handleNavigate}
                        />
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;
