import type { DispatchFlight } from '@shared/types';
import type { AppDatabase } from './bootstrap';

function mapDispatch(row: any): DispatchFlight {
  return {
    id: row.id,
    flightNumber: row.flight_number,
    departure: row.departure,
    arrival: row.arrival,
    alternate: row.alternate ?? undefined,
    route: row.route,
    payloadKg: Number(row.payload_kg),
    fuelKg: Number(row.fuel_kg),
    source: row.source,
    status: row.status,
    createdAt: row.created_at
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
        id, flight_number, departure, arrival, alternate, route, payload_kg, fuel_kg, source, status, created_at
      ) VALUES (
        @id, @flightNumber, @departure, @arrival, @alternate, @route, @payloadKg, @fuelKg, @source, @status, @createdAt
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
        created_at = excluded.created_at
    `).run(dispatch as any);

    return dispatch;
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
      createdAt: new Date().toISOString()
    };

    this.save(draft);
    return draft;
  }
}
