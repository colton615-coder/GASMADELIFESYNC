import React, { Suspense, lazy, useState, useEffect } from 'react'; // Added useState
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StartupAffirmation from '@/components/StartupAffirmation';
import NavigationBar from '@/components/NavigationBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy-loaded components
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const JournalPage = lazy(() => import('@/pages/JournalPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const HabitsPage = lazy(() => import('@/pages/HabitsPage'));
const WorkoutsPage = lazy(() => import('@/pages/WorkoutsPage'));

function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

const App: React.FC = () => {
  const [isStartupAnimationDone, setIsStartupAnimationDone] = useState(false);
  const [activeModule, setActiveModule] = useState('DASHBOARD');
  const [journalLink, setJournalLink] = useState<string | null>(null);

  return (
    <Router>
      <div className="flex h-screen w-full bg-slate-950 text-white">
        <Toaster position="bottom-center" />
        {!isStartupAnimationDone && (
          <StartupAffirmation
            onAnimationComplete={() => setIsStartupAnimationDone(true)}
            activeModule={activeModule}
          />
        )}
        <NavigationBar activeModule={activeModule} setActiveModule={setActiveModule} />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<DashboardPage setActiveModule={setActiveModule} setJournalLink={setJournalLink} />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/habits" element={<HabitsPage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
};

export default App;