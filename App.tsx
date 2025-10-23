import React, { Suspense, lazy, useState } from 'react'; // Added useState
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import usePersistentState from './hooks/usePersistentState';
import BiometricLockScreen from './components/BiometricLockScreen';
import StartupAffirmation from './components/StartupAffirmation';
import NavigationBar from './components/NavigationBar';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded components
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const HabitsPage = lazy(() => import('./pages/HabitsPage'));
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage'));

const App: React.FC = () => {
  const [isLocked, setIsLocked] = usePersistentState('isAppLocked', true);
  const [isStartupAnimationDone, setIsStartupAnimationDone] = useState(false);
  const [activeModule, setActiveModule] = useState('DASHBOARD');

  if (isLocked) {
    return <BiometricLockScreen onUnlock={() => setIsLocked(false)} />;
  }

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
              <Route path="/" element={<DashboardPage setActiveModule={setActiveModule} />} />
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