import type {
  CabinAnnouncement,
  DashboardStats,
  DispatchFlight,
  FleetAircraft,
  FlightHubSnapshot,
  FlightTrackingState,
  Member,
  PirepRecord
} from '@shared/types';

export const seedTrackingState: FlightTrackingState = {
  source: 'MOCK',
  connected: false,
  status: 'idle',
  statusMessage: 'No simulator connected',
  callsign: 'N/A',
  aircraftType: 'N/A',
  phase: 'preflight',
  config: {
    msfsHost: '127.0.0.1',
    msfsPort: 500,
    xplaneLocalPort: 49000,
    autoReconnect: true
  },
  position: null,
  track: []
};

export const seedDispatches: DispatchFlight[] = [
  {
    id: 'd1',
    flightNumber: 'FH1288',
    departure: 'ZSPD',
    arrival: 'ZBAA',
    alternate: 'ZBTJ',
    route: 'SASAN W40 MADUK B215 IGONA',
    payloadKg: 13840,
    fuelKg: 9420,
    source: 'simbrief',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export const seedPireps: PirepRecord[] = [
  {
    id: 'p1',
    flightNumber: 'FH1024',
    departure: 'VHHH',
    arrival: 'RJTT',
    blockTimeMinutes: 241,
    fuelUsedKg: 7120,
    landingRateFpm: -168,
    notes: 'Smooth arrival, light chop on descent.',
    submittedAt: new Date().toISOString()
  }
];

export const seedMembers: Member[] = [
  { id: 'm1', name: 'Luna Chen', rank: 'Captain', hours: 482.5, lastFlightAt: new Date().toISOString() },
  { id: 'm2', name: 'Kai Lin', rank: 'Senior FO', hours: 339.1, lastFlightAt: new Date().toISOString() },
  { id: 'm3', name: 'Mika Zhou', rank: 'First Officer', hours: 216.8, lastFlightAt: new Date().toISOString() }
];

export const seedFleet: FleetAircraft[] = [
  { id: 'f1', registration: 'B-320H', type: 'A320neo', hours: 1840, status: 'active' },
  { id: 'f2', registration: 'B-78XH', type: 'B787-10', hours: 920, status: 'maintenance' }
];

export const seedAnnouncements: CabinAnnouncement[] = [
  { id: 'a1', phase: 'takeoff', title: '起飞后广播', language: 'bilingual', mode: 'tts', autoPlay: false, text: '各位旅客您好，欢迎搭乘 Flight Hub 航班。Ladies and gentlemen, welcome aboard Flight Hub.' },
  { id: 'a2', phase: 'descent', title: '下降前广播', language: 'bilingual', mode: 'wav', autoPlay: false, text: '请将座椅靠背调直并系好安全带。Please return to your seat and fasten your seat belt.', mediaFile: 'descent-briefing.wav' }
];

export const seedDashboard = (): DashboardStats => ({
  todayFlights: 12,
  totalHours: seedMembers.reduce((sum, member) => sum + member.hours, 0),
  memberRanking: [...seedMembers].sort((a, b) => b.hours - a.hours),
  recentPireps: seedPireps
});

export const seedSnapshot = (): FlightHubSnapshot => ({
  tracking: seedTrackingState,
  currentSession: null,
  dispatches: seedDispatches,
  pireps: seedPireps,
  members: seedMembers,
  fleet: seedFleet,
  announcements: seedAnnouncements,
  dashboard: seedDashboard()
});
