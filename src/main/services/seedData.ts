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
  source: 'MSFS',
  connected: false,
  status: 'idle',
  statusMessage: 'No simulator connected',
  callsign: 'N/A',
  aircraftType: 'N/A',
  phase: 'preflight',
  config: {
    msfsHost: '',
    msfsPort: 500,
    xplaneHost: '127.0.0.1',
    xplaneLocalPort: 49000,
    autoReconnect: true
  },
  position: null,
  track: []
};

export const emptyDispatches: DispatchFlight[] = [];
export const emptyPireps: PirepRecord[] = [];
export const emptyMembers: Member[] = [];
export const emptyFleet: FleetAircraft[] = [];
export const emptyAnnouncements: CabinAnnouncement[] = [];

export const emptyDashboard = (): DashboardStats => ({
  todayFlights: 0,
  totalHours: 0,
  memberRanking: [],
  recentPireps: []
});

export const emptySnapshot = (): FlightHubSnapshot => ({
  tracking: seedTrackingState,
  currentSession: null,
  dispatches: [],
  pireps: [],
  members: [],
  fleet: [],
  announcements: [],
  dashboard: emptyDashboard()
});
