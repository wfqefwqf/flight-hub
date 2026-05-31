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
      savePirep: (payload: import('@shared/types').PirepRecord) => Promise<import('@shared/types').PirepRecord | null>;
      saveMember: (payload: import('@shared/types').Member) => Promise<import('@shared/types').Member>;
      removeMember: (id: string) => Promise<boolean>;
      saveFleetAircraft: (payload: import('@shared/types').FleetAircraft) => Promise<import('@shared/types').FleetAircraft>;
      removeFleetAircraft: (id: string) => Promise<boolean>;
      playAnnouncement: (payload: import('@shared/types').CabinAnnouncement) => Promise<{ ok: boolean; message: string; mediaDirectory?: string }>;
      onTrackingUpdated: (listener: (tracking: import('@shared/types').FlightTrackingState) => void) => () => void;
    };
  }
}

export {};
