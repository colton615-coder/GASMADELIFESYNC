import { useStore } from '../store';
import { useMemo } from 'react';

/**
 * An adapter hook that uses the central IndexedDB store but provides
 * the same API as the original localStorage-based hook.
 *
 * @param key The key for the data slice.
 * @param initialValue The initial value to return while data is loading.
 * @returns A state and a setter function.
 */
// Fix: Update the setter's type to correctly accept functional updates.
const usePersistentState = <T,>(key: string, initialValue: T): [T, (value: T | ((prevState: T) => T)) => void] => {
  const { data, setData, isLoaded } = useStore();

  const stateSlice = useMemo(() => {
    // While loading, or if data for this key doesn't exist, return the initial value.
    if (!isLoaded || data[key] === undefined) {
      return initialValue;
    }
    return data[key] as T;
  }, [isLoaded, data, key, initialValue]);

  const setStateSlice = (newValue: T | ((prevState: T) => T)) => {
    // Fix: Pass the updater function directly to the store's setData to avoid stale state.
    setData(key, newValue);
  };

  return [stateSlice, setStateSlice];
};

export default usePersistentState;