import React, { useState } from 'react';
import Module from '@/components/Module';
import { SettingsIcon, ShieldIcon, SunIcon } from '@/components/icons';
import usePersistentState from '@/hooks/usePersistentState';
import { isBiometricSupported, registerCredential } from '@/services/biometricService';

interface BiometricSettings {
    isEnabled: boolean;
    credentialId: string | null;
}

interface AdaptiveThemeSettings {
    isEnabled: boolean;
}

const SettingsModule: React.FC = () => {
  const [biometricSettings, setBiometricSettings] = usePersistentState<BiometricSettings>('biometricSettings', { isEnabled: false, credentialId: null });
  const [adaptiveTheme, setAdaptiveTheme] = usePersistentState<AdaptiveThemeSettings>('adaptiveThemeSettings', { isEnabled: false });
  
  const [error, setError] = useState('');
  const [isProcessingBiometrics, setIsProcessingBiometrics] = useState(false);
  const [isProcessingTheme, setIsProcessingTheme] = useState(false);

  const isBiometricsSupported = isBiometricSupported();
  const isAdaptiveThemeSupported = 'AmbientLightSensor' in window;

  const handleBiometricToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = event.target.checked;
    setError('');
    setIsProcessingBiometrics(true);

    if (isEnabled) {
      try {
        const credentialId = await registerCredential();
        setBiometricSettings({ isEnabled: true, credentialId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(message);
        event.target.checked = false; // Revert toggle on failure
      }
    } else {
      localStorage.removeItem('biometricUserId');
      setBiometricSettings({ isEnabled: false, credentialId: null });
    }
    setIsProcessingBiometrics(false);
  };
  
  const handleThemeToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = event.target.checked;
    setIsProcessingTheme(true);
    setError('');

    if (isEnabled) {
      try {
        // @ts-ignore
        const { state } = await navigator.permissions.request({ name: 'ambient-light-sensor' });
        if (state === 'granted') {
          setAdaptiveTheme({ isEnabled: true });
        } else {
          throw new Error('Permission for light sensor was not granted.');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not activate sensor.';
        setError(message);
        event.target.checked = false; // Revert toggle on failure
      }
    } else {
      setAdaptiveTheme({ isEnabled: false });
    }
    setIsProcessingTheme(false);
  };


  return (
    <Module title="Settings" icon={<SettingsIcon />}>
      <div className="space-y-6">
        {/* Biometric Lock Setting */}
        <div className="bg-white/5 p-4 rounded-lg flex items-start gap-4">
            <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-300 mt-2" aria-hidden="true">
                <ShieldIcon className="w-6 h-6"/>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <label htmlFor="biometric-toggle" className="text-body-emphasis text-white cursor-pointer">Biometric Lock</label>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input 
                            type="checkbox" 
                            id="biometric-toggle" 
                            checked={biometricSettings.isEnabled}
                            onChange={handleBiometricToggle}
                            disabled={!isBiometricsSupported || isProcessingBiometrics}
                            role="switch"
                            className="toggle-checkbox absolute block w-7 h-7 rounded-full bg-white border-4 appearance-none cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="biometric-toggle" className="toggle-label block overflow-hidden h-7 rounded-full bg-gray-600 cursor-pointer"></label>
                    </div>
                </div>
                <p id="biometric-description" className="text-caption mt-2">
                    Secure your app with your device's biometrics (Face ID, Touch ID, etc.).
                </p>
                {!isBiometricsSupported && <p className="text-yellow-400 text-sm mt-2">Your browser does not support biometric authentication.</p>}
                 {isProcessingBiometrics && <p className="text-indigo-300 text-sm mt-2" aria-live="polite">Please follow your browser's instructions...</p>}
            </div>
        </div>

        {/* Adaptive Theme Setting */}
        <div className="bg-white/5 p-4 rounded-lg flex items-start gap-4">
            <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-300 mt-2" aria-hidden="true">
                <SunIcon className="w-6 h-6"/>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <label htmlFor="theme-toggle" className="text-body-emphasis text-white cursor-pointer">Adaptive Theme</label>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input 
                            type="checkbox" 
                            id="theme-toggle" 
                            checked={adaptiveTheme.isEnabled}
                            onChange={handleThemeToggle}
                            disabled={!isAdaptiveThemeSupported || isProcessingTheme}
                            role="switch"
                            className="toggle-checkbox absolute block w-7 h-7 rounded-full bg-white border-4 appearance-none cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="theme-toggle" className="toggle-label block overflow-hidden h-7 rounded-full bg-gray-600 cursor-pointer"></label>
                    </div>
                </div>
                <p id="theme-description" className="text-caption mt-2">
                    Automatically adjust brightness and warmth based on your ambient lighting for better eye comfort.
                </p>
                {!isAdaptiveThemeSupported && <p className="text-yellow-400 text-sm mt-2">Your browser does not support the Ambient Light Sensor.</p>}
                {isProcessingTheme && <p className="text-indigo-300 text-sm mt-2" aria-live="polite">Requesting sensor permission...</p>}
            </div>
        </div>
        
        {error && <p className="text-red-400 text-sm mt-2 text-center" role="alert">{error}</p>}
      </div>

      <style>{`
        .toggle-checkbox:checked {
            right: 0;
            border-color: #6366f1; /* indigo-500 */
            transform: translateX(calc(100% - 4px));
        }
        .toggle-checkbox {
            left: 0;
            transform: translateX(0);
            transition: transform 0.2s ease-in-out;
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #6366f1; /* indigo-500 */
        }
      `}</style>
    </Module>
  );
};

export default SettingsModule;