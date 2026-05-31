import type { AircraftPosition } from '@shared/types';

export interface AdapterSample {
  position: AircraftPosition;
  callsign: string;
  aircraftType: string;
  onGround?: boolean;
}

export interface SimulatorAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  setUpdateHandler(handler: (sample: AdapterSample) => void): void;
}
