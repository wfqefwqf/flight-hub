import type { Member } from '@shared/types';
import type { AppDatabase } from './bootstrap';

function mapMember(row: any): Member {
  return {
    id: row.id,
    name: row.name,
    rank: row.rank,
    hours: Number(row.hours ?? 0),
    lastFlightAt: row.last_flight_at ?? undefined
  };
}

export class MemberRepository {
  constructor(private readonly db: AppDatabase) {}

  list() {
    const rows = this.db.prepare('SELECT * FROM members ORDER BY hours DESC, name ASC').all();
    return rows.map(mapMember);
  }

  save(member: Member) {
    this.db.prepare(`
      INSERT INTO members (id, name, rank, hours, last_flight_at)
      VALUES (@id, @name, @rank, @hours, @lastFlightAt)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        rank = excluded.rank,
        hours = excluded.hours,
        last_flight_at = excluded.last_flight_at
    `).run({
      ...member,
      lastFlightAt: member.lastFlightAt ?? null
    } as any);

    return member;
  }

  remove(id: string) {
    this.db.prepare('DELETE FROM members WHERE id = ?').run(id);
  }

  addHours(id: string, hours: number, lastFlightAt: string) {
    this.db.prepare(`
      UPDATE members
      SET hours = COALESCE(hours, 0) + ?,
          last_flight_at = ?
      WHERE id = ?
    `).run(hours, lastFlightAt, id);
  }
}
