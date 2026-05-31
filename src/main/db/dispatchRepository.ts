import type { DispatchFlight } from '@shared/types';
import type { AppDatabase } from './bootstrap';

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function mapDispatch(row: any): DispatchFlight {
  return {
    id: row.id,
    flightNumber: row.flight_number,
    departure: row.departure,
    arrival: row.arrival,
    alternate: optionalString(row.alternate),
    route: row.route,
    payloadKg: Number(row.payload_kg),
    fuelKg: Number(row.fuel_kg),
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
    pilotMemberId: optionalString(row.pilot_member_id),
    fleetAircraftId: optionalString(row.fleet_aircraft_id),
    simbriefUsername: optionalString(row.simbrief_username),
    simbriefUserId: optionalString(row.simbrief_user_id),
    simbriefNavlogId: optionalString(row.simbrief_navlog_id)
  };
}

export class DispatchRepository {
  constructor(private readonly db: AppDatabase) {}

  list() {
    const rows = this.db.prepare('SELECT * FROM dispatches ORDER BY created_at DESC').all();
    return rows.map(mapDispatch);
  }

  getById(id: string) {
    const row = this.db.prepare('SELECT * FROM dispatches WHERE id = ?').get(id);
    return row ? mapDispatch(row) : null;
  }

  save(dispatch: DispatchFlight) {
    this.db.prepare(`
      INSERT INTO dispatches (
        id, flight_number, departure, arrival, alternate, route, payload_kg, fuel_kg, source, status, created_at,
        pilot_member_id, fleet_aircraft_id, simbrief_username, simbrief_user_id, simbrief_navlog_id
      ) VALUES (
        @id, @flightNumber, @departure, @arrival, @alternate, @route, @payloadKg, @fuelKg, @source, @status, @createdAt,
        @pilotMemberId, @fleetAircraftId, @simbriefUsername, @simbriefUserId, @simbriefNavlogId
      )
      ON CONFLICT(id) DO UPDATE SET
        flight_number = excluded.flight_number,
        departure = excluded.departure,
        arrival = excluded.arrival,
        alternate = excluded.alternate,
        route = excluded.route,
        payload_kg = excluded.payload_kg,
        fuel_kg = excluded.fuel_kg,
        source = excluded.source,
        status = excluded.status,
        created_at = excluded.created_at,
        pilot_member_id = excluded.pilot_member_id,
        fleet_aircraft_id = excluded.fleet_aircraft_id,
        simbrief_username = excluded.simbrief_username,
        simbrief_user_id = excluded.simbrief_user_id,
        simbrief_navlog_id = excluded.simbrief_navlog_id
    `).run({
      ...dispatch,
      alternate: dispatch.alternate ?? null,
      pilotMemberId: dispatch.pilotMemberId ?? null,
      fleetAircraftId: dispatch.fleetAircraftId ?? null,
      simbriefUsername: dispatch.simbriefUsername ?? null,
      simbriefUserId: dispatch.simbriefUserId ?? null,
      simbriefNavlogId: dispatch.simbriefNavlogId ?? null
    } as any);

    return dispatch;
  }

  getActiveDispatch() {
    const row = this.db.prepare('SELECT * FROM dispatches WHERE status = ? ORDER BY created_at DESC LIMIT 1').get('active');
    return row ? mapDispatch(row) : null;
  }

  getLatestDraftDispatch() {
    const row = this.db.prepare('SELECT * FROM dispatches WHERE status = ? ORDER BY created_at DESC LIMIT 1').get('draft');
    return row ? mapDispatch(row) : null;
  }

  markStatus(id: string, status: DispatchFlight['status']) {
    this.db.prepare('UPDATE dispatches SET status = ? WHERE id = ?').run(status, id);
  }

  createDraft() {
    const draft: DispatchFlight = {
      id: crypto.randomUUID(),
      flightNumber: '',
      departure: '',
      arrival: '',
      alternate: '',
      route: '',
      payloadKg: 0,
      fuelKg: 0,
      source: 'manual',
      status: 'draft',
      createdAt: new Date().toISOString(),
      pilotMemberId: '',
      fleetAircraftId: '',
      simbriefUsername: '',
      simbriefUserId: '',
      simbriefNavlogId: ''
    };

    this.save(draft);
    return draft;
  }
}
