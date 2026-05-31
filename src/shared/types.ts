export type FlightPhase =
  | 'preflight'
  | 'taxi'
  | 'takeoff'
  | 'climb'
  | 'cruise'
  | 'descent'
  | 'approach'
  | 'landing'
  | 'parked';

export type SimSource = 'MSFS' | 'XPLANE' | 'MOCK';
export type FlightSessionStatus = 'active' | 'completed' | 'aborted';

export interface AircraftPosition {
  lat: number;
  lon: number;
  altitude: number;
  groundspeed: number;
  heading: number;
  verticalSpeed: number;
  timestamp: number;
}

export interface FlightTrackPoint extends AircraftPosition {
  phase: FlightPhase;
}

export interface SimConnectionConfig {
  msfsHost: string;
  msfsPort: number;
  xplaneLocalPort: number;
  autoReconnect: boolean;
}

export interface FlightTrackingState {
  source: SimSource;
  connected: boolean;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  statusMessage: string;
  callsign: string;
  aircraftType: string;
  phase: FlightPhase;
  position: AircraftPosition | null;
  track: FlightTrackPoint[];
  config: SimConnectionConfig;
}

export interface DispatchFlight {
  id: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  alternate?: string;
  route: string;
  payloadKg: number;
  fuelKg: number;
  source: 'manual' | 'simbrief';
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

export interface PirepRecord {
  id: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  blockTimeMinutes: number;
  fuelUsedKg: number;
  landingRateFpm: number;
  notes?: string;
  submittedAt: string;
}

export interface Member {
  id: string;
  name: string;
  rank: string;
  hours: number;
  lastFlightAt?: string;
}

export interface FleetAircraft {
  id: string;
  registration: string;
  type: string;
  hours: number;
  status: 'active' | 'maintenance';
}

export interface CabinAnnouncement {
  id: string;
  phase: FlightPhase;
  title: string;
  language: 'zh-CN' | 'en-US' | 'bilingual';
  mode: 'wav' | 'tts';
  autoPlay: boolean;
  text: string;
  mediaFile?: string;
}

export interface FlightSession {
  id: string;
  simulatorSource: SimSource;
  callsign: string;
  aircraftType: string;
  startedAt: string;
  endedAt?: string;
  blockOffAt?: string;
  takeoffAt?: string;
  landingAt?: string;
  blockOnAt?: string;
  departureIcao?: string;
  arrivalIcao?: string;
  maxAltitudeFt: number;
  lastPhase: FlightPhase;
  landingRateFpm?: number;
  fuelStartKg?: number;
  fuelEndKg?: number;
  fuelUsedKg?: number;
  status: FlightSessionStatus;
}

export interface FlightEvent {
  id: number;
  sessionId: string;
  eventType: string;
  phase: FlightPhase;
  occurredAt: string;
  lat?: number;
  lon?: number;
  altitudeFt?: number;
  groundspeedKt?: number;
  verticalSpeedFpm?: number;
}

export interface DashboardStats {
  todayFlights: number;
  totalHours: number;
  memberRanking: Member[];
  recentPireps: PirepRecord[];
}

export interface FlightHubSnapshot {
  tracking: FlightTrackingState;
  currentSession: FlightSession | null;
  dispatches: DispatchFlight[];
  pireps: PirepRecord[];
  members: Member[];
  fleet: FleetAircraft[];
  announcements: CabinAnnouncement[];
  dashboard: DashboardStats;
}
