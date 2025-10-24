import React, { useState, useEffect, useCallback } from 'react';
import { authenticate } from '@/services/biometricService';
import usePersistentState from '@/hooks/usePersistentState';
import { ShieldIcon } from '@/components/icons';

interface BiometricLockScreenProps {
  onUnlock: () => void;
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onUnlock }) => {
  const [settings] = usePersistentState('biometricSettings', { isEnabled: false, credentialId: null });
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (isAuthenticating) return;

    if (!settings.credentialId) {
      setError('Biometric credential not found. Please re-enable in settings.');
      return;
    }
    setIsAuthenticating(true);
    setError('');
    const success = await authenticate(settings.credentialId);
    if (success) {
      onUnlock();
    } else {
      setError('Authentication failed. Please try again.');
    }
    setIsAuthenticating(false);
  }, [settings.credentialId, onUnlock, isAuthenticating]);

  useEffect(() => {
    // Attempt to authenticate immediately on load
    const timer = setTimeout(() => {
        handleUnlock();
    }, 500); // Small delay to allow UI to render smoothly
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-[#121212] z-[100] flex flex-col items-center justify-center p-4 text-center transition-opacity duration-300 animate-fade-in">
      <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div className="mb-8">
        <ShieldIcon className="w-16 h-16 text-indigo-400" />
      </div>
      <h1 className="text-title mb-2">Life Sync is Locked</h1>
      <p className="text-caption mb-8">Authenticate to continue.</p>

      <button
        onClick={handleUnlock}
        disabled={isAuthenticating}
        className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-4 disabled:bg-gray-500 disabled:cursor-wait w-48"
        aria-live="polite"
      >
        {isAuthenticating && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>}
        {isAuthenticating ? 'Authenticating...' : 'Unlock'}
      </button>

      {error && <p className="text-red-400 mt-6" role="alert">{error}</p>}
    </div>
  );
};

export default BiometricLockScreen;