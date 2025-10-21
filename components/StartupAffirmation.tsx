import React, { useState, useEffect } from 'react';
import usePersistentState from '../hooks/usePersistentState';
import { format } from 'date-fns';
import { HeartIcon } from './icons';
import { Affirmation } from './AffirmationFormModal';
import { affirmations as defaultAffirmations } from '../services/affirmations';

interface DailyAffirmationLog {
  date: string;
  text: string;
}

type ComponentMode = 'splash' | 'banner' | 'hidden';

const StartupAffirmation: React.FC<{ onAnimationComplete: () => void; activeModule: string; }> = ({ onAnimationComplete, activeModule }) => {
  const [affirmations] = usePersistentState<Affirmation[]>('dailyAffirmations', defaultAffirmations);
  const [dailyLog, setDailyLog] = usePersistentState<DailyAffirmationLog>('dailyAffirmationLog', { date: '', text: '' });
  
  const [affirmationText, setAffirmationText] = useState('');
  const [mode, setMode] = useState<ComponentMode>('splash');

  // Effect for initial animation sequence
  useEffect(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    let currentAffirmation = '';

    if (dailyLog.date === todayKey && dailyLog.text) {
      currentAffirmation = dailyLog.text;
    } else {
      const availableAffirmations = affirmations.length > 0 ? affirmations : defaultAffirmations;
      const randomIndex = Math.floor(Math.random() * availableAffirmations.length);
      currentAffirmation = availableAffirmations[randomIndex].text;
      setDailyLog({ date: todayKey, text: currentAffirmation });
    }
    setAffirmationText(currentAffirmation);

    const t1 = setTimeout(() => {
        onAnimationComplete();
    }, 3000); // Signal app to fade in content
    
    const t2 = setTimeout(() => {
      // Start transition to banner if on dashboard, otherwise hide
      setMode(activeModule === 'DASHBOARD' ? 'banner' : 'hidden');
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Effect to handle visibility when changing modules
  useEffect(() => {
    if (mode === 'splash') return; // Don't change during initial animation

    if (activeModule === 'DASHBOARD') {
      setMode('banner');
    } else {
      setMode('hidden');
    }
  }, [activeModule, mode]);

  const splashStyles = "fixed inset-0 bg-slate-950 flex-col text-center p-8 text-3xl sm:text-4xl lg:text-5xl";
  const bannerStyles = "fixed top-0 left-0 right-0 h-16 bg-slate-900/50 backdrop-blur-sm flex-row text-center px-4 text-base sm:text-lg";
  const hiddenStyles = "opacity-0 -translate-y-full";

  const getModeStyles = () => {
    switch (mode) {
      case 'splash': return splashStyles;
      case 'banner': return bannerStyles;
      case 'hidden': return `${bannerStyles} ${hiddenStyles}`;
      default: return '';
    }
  };

  return (
    <div 
        className={`z-50 flex items-center justify-center font-semibold text-white leading-tight transition-all duration-700 ease-in-out
            ${getModeStyles()}
        `}
    >
      {mode !== 'splash' && <HeartIcon className="w-5 h-5 text-pink-400 mr-3 flex-shrink-0" />}
      <span className={`transition-all duration-700 ease-in-out ${mode === 'splash' ? 'max-w-3xl' : 'truncate'}`}>
         "{affirmationText}"
      </span>
    </div>
  );
};

export default StartupAffirmation;