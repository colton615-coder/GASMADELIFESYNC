import { useEffect, useRef } from 'react';

// Define theme levels based on illuminance (lux)
const THEME_LEVELS = {
  level0: { // Very Dark (< 10 lux)
    '--color-background-main': '#121212',
    '--color-surface-module': '#1e1e1e',
    '--color-surface-bottom-sheet': '#1a1a1a',
    '--color-text-primary': '#d1d1d1',
    '--color-text-title': '#e0e0e0',
    '--color-text-header': '#d8d8d8',
  },
  level1: { // Dim (10-50 lux) - The app's default
    '--color-background-main': '#181818',
    '--color-surface-module': '#252525',
    '--color-surface-bottom-sheet': '#1f1f1f',
    '--color-text-primary': 'rgba(255, 255, 255, 0.87)',
    '--color-text-title': '#f9fafb',
    '--color-text-header': '#f3f4f6',
  },
  level2: { // Normal (50-300 lux)
    '--color-background-main': '#1f1f1f',
    '--color-surface-module': '#2d2d2d',
    '--color-surface-bottom-sheet': '#262626',
    '--color-text-primary': 'rgba(255, 255, 255, 0.9)',
    '--color-text-title': '#ffffff',
    '--color-text-header': '#fafafa',
  },
  level3: { // Bright (> 300 lux)
    '--color-background-main': '#2a2a2a',
    '--color-surface-module': '#3a3a3a',
    '--color-surface-bottom-sheet': '#313131',
    '--color-text-primary': 'rgba(255, 255, 255, 0.95)',
    '--color-text-title': '#ffffff',
    '--color-text-header': '#ffffff',
  },
};

const getThemeForLux = (lux: number): keyof typeof THEME_LEVELS => {
  if (lux < 10) return 'level0';
  if (lux < 50) return 'level1';
  if (lux < 300) return 'level2';
  return 'level3';
};

const useAdaptiveTheme = (isEnabled: boolean) => {
  const currentThemeLevel = useRef<keyof typeof THEME_LEVELS | null>(null);

  useEffect(() => {
    if (!isEnabled || !('AmbientLightSensor' in window)) {
      // If disabled or not supported, ensure default theme is applied
      if (currentThemeLevel.current !== 'level1') {
          Object.entries(THEME_LEVELS.level1).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
          });
          currentThemeLevel.current = 'level1';
      }
      return;
    }

    let sensor: any; // Using `any` to avoid TS errors for experimental API

    const initializeSensor = async () => {
      try {
        // @ts-ignore
        const { state } = await navigator.permissions.query({ name: 'ambient-light-sensor' });
        if (state !== 'granted') {
          console.warn('Ambient light sensor permission not granted.');
          return;
        }

        // @ts-ignore
        sensor = new AmbientLightSensor({ frequency: 1 });

        sensor.onreading = () => {
          const newLevel = getThemeForLux(sensor.illuminance);
          if (newLevel !== currentThemeLevel.current) {
            console.log(`Ambient Light: ${sensor.illuminance.toFixed(2)} lux. Theme changed to ${newLevel}.`);
            const theme = THEME_LEVELS[newLevel];
            Object.entries(theme).forEach(([key, value]) => {
              document.documentElement.style.setProperty(key, value);
            });
            currentThemeLevel.current = newLevel;
          }
        };

        sensor.onerror = (event: any) => {
          console.error('Ambient Light Sensor error:', event.error.name, event.error.message);
        };

        sensor.start();
        console.log('Adaptive theme sensor started.');

      } catch (error) {
        console.error('Failed to initialize ambient light sensor:', error);
      }
    };

    initializeSensor();

    return () => {
      if (sensor) {
        sensor.stop();
        console.log('Adaptive theme sensor stopped.');
      }
    };
  }, [isEnabled]);
};

export default useAdaptiveTheme;
