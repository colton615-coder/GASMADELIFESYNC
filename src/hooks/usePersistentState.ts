import { useStore } from '@/store';
import { useMemo, useState } from 'react';

/**
 * An adapter hook that uses the central IndexedDB store but provides
 * the same API as the original localStorage-based hook.
 *
 * @param key The key for the data slice.
 * @param initialValue The initial value to return while data is loading.
 * @returns A state and a setter function.
 */
const usePersistentState = <T,>(key: string, initialValue: T | (() => T)): [T, (value: T | ((prevState: T) => T)) => void] => {
  const { data, setData, isLoaded } = useStore();

  // Lazily initialize the state only once.
  const [initialState] = useState(initialValue);

  const stateSlice = useMemo(() => {
    // While loading, or if data for this key doesn't exist, return the initial value.
    if (!isLoaded || data[key] === undefined) {
      return initialState;
    }
    return data[key] as T;
  }, [isLoaded, data, key, initialState]);

  const setStateSlice = (newValue: T | ((prevState: T) => T)) => {
    // Fix: If newValue is a function, we must resolve it here.
    // We use `stateSlice` as the previous state, which correctly falls back
    // to `initialValue` if the data hasn't been loaded from the store yet.
    // This prevents runtime errors when an updater function (e.g., `prev => ({ ...prev })`)
    // receives `undefined` and attempts an invalid operation like spreading it.
    if (typeof newValue === 'function') {
      const updater = newValue as (prevState: T) => T;
      setData(key, updater(stateSlice));
    } else {
      setData(key, newValue);
    }
  };

  return [stateSlice, setStateSlice];
};

export default usePersistentState;