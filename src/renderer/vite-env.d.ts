/// <reference types="vite/client" />

declare global {
  interface Window {
    flightHub: {
      getSnapshot: () => Promise<import('@shared/types').FlightHubSnapshot>;
      setSimSource: (source: import('@shared/types').SimSource) => Promise<import('@shared/types').FlightTrackingState>;
      updateSimConfig: (config: Partial<import('@shared/types').SimConnectionConfig>) => Promise<import('@shared/types').FlightTrackingState>;
      importSimBrief: (payload: Partial<import('@shared/types').DispatchFlight>) => Promise<import('@shared/types').DispatchFlight>;
      saveDispatch: (payload: import('@shared/types').DispatchFlight) => Promise<import('@shared/types').DispatchFlight>;
      exportDispatch: (id: string) => Promise<string | null>;
      savePirep: (payload: import('@shared/types').PirepRecord) => Promise<import('@shared/types').PirepRecord>;
      playAnnouncement: (payload: import('@shared/types').CabinAnnouncement) => Promise<{ ok: boolean; message: string; mediaDirectory?: string }>;
      onTrackingUpdated: (listener: (tracking: import('@shared/types').FlightTrackingState) => void) => () => void;
    };
  }
}

export {};
