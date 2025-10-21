import React, { useState, useMemo, useEffect } from 'react';
import NavigationBar from './components/NavigationBar';
import Dashboard from './components/Dashboard';
import CalendarModule from './components/CalendarModule';
import TasksModule from './components/TasksModule';
import HabitTrackerModule from './components/HabitTrackerModule';
import ShoppingListModule from './components/ShoppingListModule';
import WorkoutModule from './components/WorkoutModule';
import SwingStationModule from './components/SwingStationModule';
import JournalModule from './components/JournalModule';
import StatsModule from './components/StatsModule';
import StartupAffirmation from './components/StartupAffirmation';
import SettingsModule from './components/SettingsModule';
import BiometricLockScreen from './components/BiometricLockScreen';
import usePersistentState from './hooks/usePersistentState';
import SyncIndicator from './components/SyncIndicator';
import { DataProvider, useStore } from './store';
import { LoaderIcon } from './components/icons';
import useAdaptiveTheme from './hooks/useAdaptiveTheme';
import MindfulMomentsModule from './components/MindfulMomentsModule';
import WeeklyReviewModule from './components/WeeklyReviewModule';

interface BiometricSettings {
    isEnabled: boolean;
    credentialId: string | null;
}
interface AdaptiveThemeSettings {
    isEnabled: boolean;
}

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState('DASHBOARD');
  const [journalLink, setJournalLink] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isShowingAffirmation, setIsShowingAffirmation] = useState(true);
  
  const [biometricSettings] = usePersistentState<BiometricSettings>('biometricSettings', { isEnabled: false, credentialId: null });
  const [adaptiveThemeSettings] = usePersistentState<AdaptiveThemeSettings>('adaptiveThemeSettings', { isEnabled: false });
  const [isLocked, setIsLocked] = useState(biometricSettings.isEnabled);
  const [, setLastSyncTime] = usePersistentState<string>('lastSyncTime', new Date().toISOString());
  const [startInFocus, setStartInFocus] = useState(false);
  
  const { isLoaded } = useStore();

  // Activate adaptive theme based on user setting
  useAdaptiveTheme(adaptiveThemeSettings.isEnabled);

  // This effect ensures the sync time is updated on every app load/reload.
  useEffect(() => {
    setLastSyncTime(new Date().toISOString());
  }, [setLastSyncTime]);

  // This effect will run once on mount to check for shortcut actions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    if (action === 'new_task') {
      setActiveModule('TASKS');
    } else if (action === 'new_journal_entry') {
      setActiveModule('JOURNAL');
      setStartInFocus(true);
    }
    
    // Clean up the URL so the action isn't triggered on refresh
    if (action) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Pass API key to Service Worker
  useEffect(() => {
    const passApiKeyToSw = async () => {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
          registration.active.postMessage({
              type: 'SET_API_KEY',
              apiKey: process.env.API_KEY
          });
      }
    };
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        passApiKeyToSw();
    }
  }, []);

  const activeComponent = useMemo(() => {
    switch (activeModule) {
      case 'DASHBOARD':
        return <Dashboard setActiveModule={setActiveModule} setJournalLink={setJournalLink} />;
      case 'CALENDAR':
        return <CalendarModule />;
      case 'TASKS':
        return <TasksModule />;
      case 'HABITS':
        return <HabitTrackerModule />;
      case 'SHOPPING':
        return <ShoppingListModule />;
      case 'WORKOUT':
        return <WorkoutModule />;
      case 'SWING':
        return <SwingStationModule />;
      case 'JOURNAL':
        return <JournalModule setIsFocusMode={setIsFocusMode} startInFocus={startInFocus} journalLink={journalLink} setJournalLink={setJournalLink} />;
      case 'STATS':
        return <StatsModule />;
      case 'SETTINGS':
        return <SettingsModule />;
      case 'MINDFUL_MOMENTS':
        return <MindfulMomentsModule setIsFocusMode={setIsFocusMode} setActiveModule={setActiveModule} />;
      case 'WEEKLY_REVIEW':
        return <WeeklyReviewModule setIsFocusMode={setIsFocusMode} setActiveModule={setActiveModule} />;
      default:
        return <Dashboard setActiveModule={setActiveModule} setJournalLink={setJournalLink} />;
    }
  }, [activeModule, setIsFocusMode, startInFocus, journalLink]);

  if (!isLoaded) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center bg-[#181818]">
              <LoaderIcon className="w-12 h-12 text-indigo-400 mb-4" />
              <h1 className="text-title">Life Sync</h1>
              <p className="text-caption mt-2">Loading your personal command center...</p>
          </div>
      );
  }

  if (isLocked) {
      return <BiometricLockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen font-sans">
      <StartupAffirmation 
        onAnimationComplete={() => setIsShowingAffirmation(false)} 
        activeModule={activeModule}
      />
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{backgroundImage: "url('/background.png')", opacity: 0.05, zIndex: 0}}
      ></div>

      {/* Main content, fades in after affirmation */}
      <div className={`relative z-10 transition-opacity duration-500 ${isShowingAffirmation ? 'opacity-0' : 'opacity-100'}`}>
        {isFocusMode ? (
          activeComponent
        ) : (
          <>
            <main className="p-4 pt-20 pb-24">
              <header className="mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-title">Life Sync</h1>
                  <p className="text-caption mt-1">Your personal command center.</p>
                </div>
                <SyncIndicator />
              </header>
              {activeComponent}
            </main>
            <NavigationBar activeModule={activeModule} setActiveModule={setActiveModule} />
          </>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <DataProvider>
            <AppContent />
        </DataProvider>
    );
};

export default App;