import React, { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    HomeIcon, 
    TasksIcon, 
    CalendarDaysIcon, 
    RepeatIcon, 
    ShoppingCartIcon, 
    DumbbellIcon, 
    BookOpenIcon, 
    StatsIcon,
    SettingsIcon,
    ClipboardCheckIcon
} from '@/components/icons';

type NavButtonProps = {
    icon: React.ReactNode;
    label: string;
    moduleId: string;
    isActive: boolean;
    onClick: (moduleId: string) => void;
    route: string;
};

const NavButton: React.FC<NavButtonProps> = memo(({ icon, label, moduleId, isActive, onClick, route }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const navigate = useNavigate();

    const handleClick = useCallback(() => {
        onClick(moduleId);
        setIsAnimating(true);
        navigate(route);
    }, [onClick, moduleId, route, navigate]);

    return (
        <button 
            onClick={handleClick} 
            onAnimationEnd={() => setIsAnimating(false)}
            className={`flex flex-col items-center justify-center gap-2 w-20 h-16 rounded-xl flex-shrink-0 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 font-semibold text-sm tracking-tight ${
                isActive 
                ? 'text-indigo-400 bg-indigo-500/10 shadow-lg' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            } ${isAnimating ? 'nav-icon-pop-animation' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            tabIndex={0}
        >
            <div className="w-7 h-7 flex items-center justify-center">{icon}</div>
            <span className="text-xs font-semibold mt-1">{label}</span>
        </button>
    );
});

interface NavigationBarProps {
    activeModule: string;
    setActiveModule: (module: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeModule, setActiveModule }) => {
    const navItems = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: <HomeIcon />, route: '/' },
        { id: 'CALENDAR', label: 'Calendar', icon: <CalendarDaysIcon />, route: '/calendar' },
        { id: 'TASKS', label: 'Tasks', icon: <TasksIcon />, route: '/tasks' },
        { id: 'HABITS', label: 'Habits', icon: <RepeatIcon />, route: '/habits' },
        { id: 'SHOPPING', label: 'Shopping', icon: <ShoppingCartIcon />, route: '/shopping' },
        { id: 'WORKOUT', label: 'Workout', icon: <DumbbellIcon />, route: '/workouts' },
        { id: 'JOURNAL', label: 'Journal', icon: <BookOpenIcon />, route: '/journal' },
        { id: 'STATS', label: 'Stats', icon: <StatsIcon />, route: '/stats' },
        { id: 'WEEKLY_REVIEW', label: 'Review', icon: <ClipboardCheckIcon />, route: '/weekly-review' },
        { id: 'SETTINGS', label: 'Settings', icon: <SettingsIcon />, route: '/settings' },
    ];

    const handleNavigate = useCallback((moduleId: string) => {
        setActiveModule(moduleId);
    }, [setActiveModule]);

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--color-background-main)]/60 backdrop-blur-lg border-t border-white/10 z-50 shadow-2xl" role="navigation" aria-label="Main navigation">
            <div className="flex items-center justify-start sm:justify-center h-full px-4 overflow-x-auto overflow-y-hidden">
                <div className="flex items-center gap-3">
                    {navItems.map(item => (
                        <NavButton
                            key={item.id}
                            label={item.label}
                            icon={item.icon}
                            moduleId={item.id}
                            isActive={activeModule === item.id}
                            onClick={handleNavigate}
                            route={item.route}
                        />
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;