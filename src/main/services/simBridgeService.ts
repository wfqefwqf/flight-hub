import type { FlightPhase, FlightSession, FlightTrackingState, PirepRecord, SimConnectionConfig, SimSource } from '@shared/types';
import { detectFlightPhase } from '../sim/phase';
import { MockAdapter } from '../sim/mockAdapter';
import { MsfsAdapter } from '../sim/msfsAdapter';
import { XPlaneAdapter } from '../sim/xplaneAdapter';
import type { SimulatorAdapter } from '../sim/types';
import { seedTrackingState } from './seedData';
import { FlightSessionRepository } from '../db/flightSessionRepository';

const defaultConfig: SimConnectionConfig = structuredClone(seedTrackingState.config);

export class SimBridgeService {
  private tracking: FlightTrackingState = structuredClone(seedTrackingState);
  private adapter: SimulatorAdapter | null = null;
  private onUpdate: (state: FlightTrackingState) => void = () => {};
  private currentSession: FlightSession | null = null;
  private latestPirep: PirepRecord | null = null;
  private lastEventPhase: FlightPhase | null = null;

  constructor(private readonly sessionRepository: FlightSessionRepository) {
    this.currentSession = this.sessionRepository.getActiveSession();
  }

  start(onUpdate: (state: FlightTrackingState) => void) {
    this.onUpdate = onUpdate;
    return this.connectTo(this.tracking.source);
  }

  private createAdapter(source: SimSource) {
    if (source === 'MSFS') return new MsfsAdapter(this.tracking.config);
    if (source === 'XPLANE') return new XPlaneAdapter(this.tracking.config);
    return new MockAdapter();
  }

  private ensureSession(source: SimSource) {
    if (this.currentSession) return this.currentSession;
    const now = new Date().toISOString();
    this.currentSession = this.sessionRepository.createSession({
      id: crypto.randomUUID(),
      simulatorSource: source,
      callsign: this.tracking.callsign || 'UNKNOWN',
      aircraftType: this.tracking.aircraftType || 'UNKNOWN',
      startedAt: now,
      endedAt: undefined,
      blockOffAt: undefined,
      takeoffAt: undefined,
      landingAt: undefined,
      blockOnAt: undefined,
      departureIcao: undefined,
      arrivalIcao: undefined,
      maxAltitudeFt: 0,
      lastPhase: this.tracking.phase,
      landingRateFpm: undefined,
      fuelStartKg: undefined,
      fuelEndKg: undefined,
      fuelUsedKg: undefined,
      status: 'active'
    });
    this.lastEventPhase = null;
    return this.currentSession;
  }

  private updateSessionForPhase(phase: FlightPhase) {
    const session = this.ensureSession(this.tracking.source);
    const now = new Date().toISOString();

    if (phase === 'taxi' && !session.blockOffAt) session.blockOffAt = now;
    if ((phase === 'takeoff' || phase === 'climb') && !session.takeoffAt) session.takeoffAt = now;
    if ((phase === 'landing' || phase === 'parked') && !session.landingAt && session.takeoffAt) {
      session.landingAt = now;
      session.landingRateFpm = this.tracking.position?.verticalSpeed ?? session.landingRateFpm;
    }
    if (phase === 'parked' && session.takeoffAt && !session.blockOnAt) {
      session.blockOnAt = now;
      session.endedAt = now;
      session.status = 'completed';
    }

    session.callsign = this.tracking.callsign;
    session.aircraftType = this.tracking.aircraftType;
    session.lastPhase = phase;
    session.maxAltitudeFt = Math.max(session.maxAltitudeFt, this.tracking.position?.altitude ?? 0);

    this.sessionRepository.updateSession(session);

    if (this.lastEventPhase !== phase) {
      this.sessionRepository.addEvent({
        sessionId: session.id,
        eventType: `phase:${phase}`,
        phase,
        occurredAt: now,
        lat: this.tracking.position?.lat,
        lon: this.tracking.position?.lon,
        altitudeFt: this.tracking.position?.altitude,
        groundspeedKt: this.tracking.position?.groundspeed,
        verticalSpeedFpm: this.tracking.position?.verticalSpeed
      });
      this.lastEventPhase = phase;
    }

    if (session.status === 'completed') {
      this.latestPirep = this.sessionRepository.completeSessionAndCreatePirep(session);
      this.currentSession = null;
      this.lastEventPhase = null;
    }
  }

  async connectTo(source: SimSource) {
    await this.adapter?.disconnect();
    this.tracking = {
      ...this.tracking,
      source,
      connected: false,
      status: 'connecting',
      statusMessage: `Connecting to ${source}...`
    };
    this.onUpdate(this.tracking);

    try {
      this.adapter = this.createAdapter(source);
      this.adapter.setUpdateHandler((sample) => {
        const phase = detectFlightPhase({
          altitude: sample.position.altitude,
          groundspeed: sample.position.groundspeed,
          verticalSpeed: sample.position.verticalSpeed,
          onGround: sample.onGround
        });

        this.tracking = {
          ...this.tracking,
          source,
          connected: true,
          status: 'connected',
          statusMessage: `${source} connected`,
          callsign: sample.callsign,
          aircraftType: sample.aircraftType,
          phase,
          position: sample.position,
          track: [...this.tracking.track.slice(-199), { ...sample.position, phase }]
        };

        this.updateSessionForPhase(phase);
        this.onUpdate(this.tracking);
      });
      await this.adapter.connect();
      return this.tracking;
    } catch (error) {
      this.tracking = {
        ...this.tracking,
        source,
        connected: false,
        status: 'error',
        statusMessage: error instanceof Error ? error.message : `Failed to connect to ${source}`
      };
      this.onUpdate(this.tracking);
      return this.tracking;
    }
  }

  async setSource(source: SimSource) {
    return this.connectTo(source);
  }

  updateConfig(config: Partial<SimConnectionConfig>) {
    this.tracking = {
      ...this.tracking,
      config: {
        ...defaultConfig,
        ...this.tracking.config,
        ...config
      }
    };
    this.onUpdate(this.tracking);
    return this.tracking;
  }

  getState() {
    return this.tracking;
  }

  getCurrentSession() {
    return this.currentSession ?? this.sessionRepository.getActiveSession();
  }

  getLatestPirep() {
    return this.latestPirep;
  }
}
