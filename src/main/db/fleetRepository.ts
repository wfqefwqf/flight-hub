import type { FleetAircraft } from '@shared/types';
import type { AppDatabase } from './bootstrap';

function mapFleet(row: any): FleetAircraft {
  return {
    id: row.id,
    registration: row.registration,
    type: row.type,
    hours: Number(row.hours ?? 0),
    status: row.status
  };
}

export class FleetRepository {
  constructor(private readonly db: AppDatabase) {}

  list() {
    const rows = this.db.prepare('SELECT * FROM fleet ORDER BY registration ASC').all();
    return rows.map(mapFleet);
  }

  save(aircraft: FleetAircraft) {
    this.db.prepare(`
      INSERT INTO fleet (id, registration, type, hours, status)
      VALUES (@id, @registration, @type, @hours, @status)
      ON CONFLICT(id) DO UPDATE SET
        registration = excluded.registration,
        type = excluded.type,
        hours = excluded.hours,
        status = excluded.status
    `).run(aircraft as any);

    return aircraft;
  }

  remove(id: string) {
    this.db.prepare('DELETE FROM fleet WHERE id = ?').run(id);
  }

  addHours(id: string, hours: number) {
    this.db.prepare(`
      UPDATE fleet
      SET hours = COALESCE(hours, 0) + ?
      WHERE id = ?
    `).run(hours, id);
  }
}
