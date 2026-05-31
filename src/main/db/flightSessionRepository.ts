import type { FlightEvent, FlightPhase, FlightSession, PirepRecord } from '@shared/types';
import type { AppDatabase } from './bootstrap';

function mapSession(row: any): FlightSession {
  return {
    id: row.id,
    simulatorSource: row.simulator_source,
    callsign: row.callsign,
    aircraftType: row.aircraft_type,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    blockOffAt: row.block_off_at ?? undefined,
    takeoffAt: row.takeoff_at ?? undefined,
    landingAt: row.landing_at ?? undefined,
    blockOnAt: row.block_on_at ?? undefined,
    departureIcao: row.departure_icao ?? undefined,
    arrivalIcao: row.arrival_icao ?? undefined,
    maxAltitudeFt: Number(row.max_altitude_ft ?? 0),
    lastPhase: row.last_phase,
    landingRateFpm: row.landing_rate_fpm ?? undefined,
    fuelStartKg: row.fuel_start_kg ?? undefined,
    fuelEndKg: row.fuel_end_kg ?? undefined,
    fuelUsedKg: row.fuel_used_kg ?? undefined,
    status: row.status
  };
}

function mapPirep(row: any): PirepRecord {
  return {
    id: row.id,
    flightNumber: row.flight_number,
    departure: row.departure,
    arrival: row.arrival,
    blockTimeMinutes: row.block_time_minutes,
    fuelUsedKg: row.fuel_used_kg,
    landingRateFpm: row.landing_rate_fpm,
    notes: row.notes ?? undefined,
    submittedAt: row.submitted_at
  };
}

export class FlightSessionRepository {
  constructor(private readonly db: AppDatabase) {}

  getActiveSession() {
    const row = this.db.prepare('SELECT * FROM flight_sessions WHERE status = ? ORDER BY started_at DESC LIMIT 1').get('active');
    return row ? mapSession(row) : null;
  }

  getRecentCompletedPireps(limit = 5) {
    const rows = this.db.prepare('SELECT * FROM pireps ORDER BY submitted_at DESC LIMIT ?').all(limit);
    return rows.map(mapPirep);
  }

  createSession(session: FlightSession) {
    this.db.prepare(`
      INSERT INTO flight_sessions (
        id, simulator_source, callsign, aircraft_type, started_at, ended_at, block_off_at, takeoff_at,
        landing_at, block_on_at, departure_icao, arrival_icao, max_altitude_ft, last_phase,
        landing_rate_fpm, fuel_start_kg, fuel_end_kg, fuel_used_kg, status
      ) VALUES (
        @id, @simulatorSource, @callsign, @aircraftType, @startedAt, @endedAt, @blockOffAt, @takeoffAt,
        @landingAt, @blockOnAt, @departureIcao, @arrivalIcao, @maxAltitudeFt, @lastPhase,
        @landingRateFpm, @fuelStartKg, @fuelEndKg, @fuelUsedKg, @status
      )
    `).run(session as any);
    return session;
  }

  updateSession(session: FlightSession) {
    this.db.prepare(`
      UPDATE flight_sessions SET
        simulator_source = @simulatorSource,
        callsign = @callsign,
        aircraft_type = @aircraftType,
        ended_at = @endedAt,
        block_off_at = @blockOffAt,
        takeoff_at = @takeoffAt,
        landing_at = @landingAt,
        block_on_at = @blockOnAt,
        departure_icao = @departureIcao,
        arrival_icao = @arrivalIcao,
        max_altitude_ft = @maxAltitudeFt,
        last_phase = @lastPhase,
        landing_rate_fpm = @landingRateFpm,
        fuel_start_kg = @fuelStartKg,
        fuel_end_kg = @fuelEndKg,
        fuel_used_kg = @fuelUsedKg,
        status = @status
      WHERE id = @id
    `).run(session as any);
    return session;
  }

  addEvent(event: Omit<FlightEvent, 'id'>) {
    this.db.prepare(`
      INSERT INTO flight_events (
        session_id, event_type, phase, occurred_at, lat, lon, altitude_ft, groundspeed_kt, vertical_speed_fpm
      ) VALUES (
        @sessionId, @eventType, @phase, @occurredAt, @lat, @lon, @altitudeFt, @groundspeedKt, @verticalSpeedFpm
      )
    `).run(event as any);
  }

  getSessionEvents(sessionId: string) {
    const rows = this.db.prepare('SELECT * FROM flight_events WHERE session_id = ? ORDER BY occurred_at ASC').all(sessionId);
    return rows as FlightEvent[];
  }

  completeSessionAndCreatePirep(session: FlightSession) {
    this.updateSession(session);

    if (!session.takeoffAt || !session.landingAt) return null;

    const existing = this.db.prepare('SELECT id FROM pireps WHERE id = ?').get(session.id) as { id: string } | undefined;
    if (existing) {
      const row = this.db.prepare('SELECT * FROM pireps WHERE id = ?').get(session.id);
      return row ? mapPirep(row) : null;
    }

    const blockTimeMinutes = Math.max(1, Math.round((Date.parse(session.endedAt ?? session.landingAt) - Date.parse(session.startedAt)) / 60000));
    const pirep: PirepRecord = {
      id: session.id,
      flightNumber: session.callsign,
      departure: session.departureIcao ?? 'UNK',
      arrival: session.arrivalIcao ?? 'UNK',
      blockTimeMinutes,
      fuelUsedKg: session.fuelUsedKg ?? 0,
      landingRateFpm: session.landingRateFpm ?? 0,
      submittedAt: new Date().toISOString()
    };

    this.db.prepare(`
      INSERT OR REPLACE INTO pireps (
        id, session_id, flight_number, departure, arrival, block_time_minutes, fuel_used_kg, landing_rate_fpm, notes, submitted_at
      ) VALUES (
        @id, @sessionId, @flightNumber, @departure, @arrival, @blockTimeMinutes, @fuelUsedKg, @landingRateFpm, @notes, @submittedAt
      )
    `).run({ ...pirep, sessionId: session.id, notes: null } as any);

    return pirep;
  }

  getDashboardStats() {
    const todayFlightsRow = this.db.prepare(`SELECT COUNT(*) as count FROM pireps WHERE date(submitted_at) = date('now', 'localtime')`).get() as { count: number };
    const totalHoursRow = this.db.prepare('SELECT COALESCE(SUM(block_time_minutes), 0) as totalMinutes FROM pireps').get() as { totalMinutes: number };

    return {
      todayFlights: todayFlightsRow.count,
      totalHours: Number((totalHoursRow.totalMinutes / 60).toFixed(1)),
      recentPireps: this.getRecentCompletedPireps(5),
      memberRanking: []
    };
  }
}
