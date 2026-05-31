import { create } from 'zustand';
import type { FlightHubSnapshot } from '@shared/types';

interface AppStore {
  snapshot: FlightHubSnapshot | null;
  loading: boolean;
  setSnapshot: (snapshot: FlightHubSnapshot) => void;
  patchTracking: (tracking: FlightHubSnapshot['tracking']) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  snapshot: null,
  loading: true,
  setSnapshot: (snapshot) => set({ snapshot, loading: false }),
  patchTracking: (tracking) =>
    set((state) => ({
      snapshot: state.snapshot ? { ...state.snapshot, tracking } : state.snapshot
    }))
}));
