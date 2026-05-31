import { create } from 'zustand';
import type { FlightHubSnapshot } from '@shared/types';

interface AppStore {
  snapshot: FlightHubSnapshot | null;
  loading: boolean;
  error: string | null;
  setSnapshot: (snapshot: FlightHubSnapshot) => void;
  setError: (error: string | null) => void;
  patchTracking: (tracking: FlightHubSnapshot['tracking']) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  snapshot: null,
  loading: true,
  error: null,
  setSnapshot: (snapshot) => set({ snapshot, loading: false, error: null }),
  setError: (error) => set({ error, loading: false }),
  patchTracking: (tracking) =>
    set((state) => ({
      snapshot: state.snapshot ? { ...state.snapshot, tracking } : state.snapshot
    }))
}));
