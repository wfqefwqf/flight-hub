import Database from 'better-sqlite3';
import path from 'node:path';

type ColumnDefinition = {
  name: string;
  sql: string;
};

function getTableColumns(db: Database, tableName: string) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
}

function ensureColumns(db: Database, tableName: string, columns: ColumnDefinition[]) {
  const existing = getTableColumns(db, tableName);
  const existingNames = new Set(existing.map((column) => column.name));

  for (const column of columns) {
    if (!existingNames.has(column.name)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${column.sql}`);
    }
  }
}

function ensureModernPirepsTable(db: Database) {
  const columns = getTableColumns(db, 'pireps');
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('data')) return;

  db.exec(`
    ALTER TABLE pireps RENAME TO pireps_legacy;

    CREATE TABLE pireps (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      flight_number TEXT NOT NULL,
      departure TEXT NOT NULL,
      arrival TEXT NOT NULL,
      block_time_minutes INTEGER NOT NULL,
      fuel_used_kg REAL NOT NULL,
      landing_rate_fpm REAL NOT NULL,
      notes TEXT,
      submitted_at TEXT NOT NULL
    );

    INSERT INTO pireps (id, submitted_at, flight_number, departure, arrival, block_time_minutes, fuel_used_kg, landing_rate_fpm, notes)
    SELECT
      id,
      COALESCE(submitted_at, ''),
      COALESCE(flight_number, ''),
      COALESCE(departure, ''),
      COALESCE(arrival, ''),
      COALESCE(block_time_minutes, 0),
      COALESCE(fuel_used_kg, 0),
      COALESCE(landing_rate_fpm, 0),
      notes
    FROM pireps_legacy;

    DROP TABLE pireps_legacy;
  `);
}

export function bootstrapDatabase(userDataPath: string) {
  const dbPath = path.join(userDataPath, 'flight-hub.db');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dispatches (
      id TEXT PRIMARY KEY,
      flight_number TEXT NOT NULL,
      departure TEXT NOT NULL,
      arrival TEXT NOT NULL,
      alternate TEXT,
      route TEXT NOT NULL,
      payload_kg REAL NOT NULL,
      fuel_kg REAL NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      pilot_member_id TEXT,
      fleet_aircraft_id TEXT,
      simbrief_username TEXT,
      simbrief_user_id TEXT,
      simbrief_navlog_id TEXT
    );

    CREATE TABLE IF NOT EXISTS pireps (
      id TEXT PRIMARY KEY,
      flight_number TEXT NOT NULL,
      departure TEXT NOT NULL,
      arrival TEXT NOT NULL,
      block_time_minutes INTEGER NOT NULL,
      fuel_used_kg REAL NOT NULL,
      landing_rate_fpm REAL NOT NULL,
      notes TEXT,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rank TEXT NOT NULL,
      hours REAL NOT NULL DEFAULT 0,
      last_flight_at TEXT
    );

    CREATE TABLE IF NOT EXISTS fleet (
      id TEXT PRIMARY KEY,
      registration TEXT NOT NULL,
      type TEXT NOT NULL,
      hours REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      phase TEXT NOT NULL,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      mode TEXT NOT NULL,
      auto_play INTEGER NOT NULL,
      text TEXT NOT NULL,
      media_file TEXT
    );

    CREATE TABLE IF NOT EXISTS flight_sessions (
      id TEXT PRIMARY KEY,
      simulator_source TEXT NOT NULL,
      callsign TEXT NOT NULL,
      aircraft_type TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      block_off_at TEXT,
      takeoff_at TEXT,
      landing_at TEXT,
      block_on_at TEXT,
      departure_icao TEXT,
      arrival_icao TEXT,
      pilot_member_id TEXT,
      fleet_aircraft_id TEXT,
      max_altitude_ft REAL NOT NULL DEFAULT 0,
      last_phase TEXT NOT NULL,
      landing_rate_fpm REAL,
      fuel_start_kg REAL,
      fuel_end_kg REAL,
      fuel_used_kg REAL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS flight_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      phase TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      lat REAL,
      lon REAL,
      altitude_ft REAL,
      groundspeed_kt REAL,
      vertical_speed_fpm REAL
    );
  `);

  ensureModernPirepsTable(db);

  ensureColumns(db, 'dispatches', [
    { name: 'flight_number', sql: 'flight_number TEXT NOT NULL DEFAULT ""' },
    { name: 'departure', sql: 'departure TEXT NOT NULL DEFAULT ""' },
    { name: 'arrival', sql: 'arrival TEXT NOT NULL DEFAULT ""' },
    { name: 'alternate', sql: 'alternate TEXT' },
    { name: 'route', sql: 'route TEXT NOT NULL DEFAULT ""' },
    { name: 'payload_kg', sql: 'payload_kg REAL NOT NULL DEFAULT 0' },
    { name: 'fuel_kg', sql: 'fuel_kg REAL NOT NULL DEFAULT 0' },
    { name: 'source', sql: 'source TEXT NOT NULL DEFAULT "manual"' },
    { name: 'status', sql: 'status TEXT NOT NULL DEFAULT "draft"' },
    { name: 'created_at', sql: 'created_at TEXT NOT NULL DEFAULT ""' },
    { name: 'pilot_member_id', sql: 'pilot_member_id TEXT' },
    { name: 'fleet_aircraft_id', sql: 'fleet_aircraft_id TEXT' },
    { name: 'simbrief_username', sql: 'simbrief_username TEXT' },
    { name: 'simbrief_user_id', sql: 'simbrief_user_id TEXT' },
    { name: 'simbrief_navlog_id', sql: 'simbrief_navlog_id TEXT' }
  ]);

  ensureColumns(db, 'pireps', [
    { name: 'session_id', sql: 'session_id TEXT' },
    { name: 'flight_number', sql: 'flight_number TEXT NOT NULL DEFAULT ""' },
    { name: 'departure', sql: 'departure TEXT NOT NULL DEFAULT ""' },
    { name: 'arrival', sql: 'arrival TEXT NOT NULL DEFAULT ""' },
    { name: 'block_time_minutes', sql: 'block_time_minutes INTEGER NOT NULL DEFAULT 0' },
    { name: 'fuel_used_kg', sql: 'fuel_used_kg REAL NOT NULL DEFAULT 0' },
    { name: 'landing_rate_fpm', sql: 'landing_rate_fpm REAL NOT NULL DEFAULT 0' },
    { name: 'notes', sql: 'notes TEXT' },
    { name: 'submitted_at', sql: 'submitted_at TEXT NOT NULL DEFAULT ""' }
  ]);

  ensureColumns(db, 'members', [
    { name: 'name', sql: 'name TEXT NOT NULL DEFAULT ""' },
    { name: 'rank', sql: 'rank TEXT NOT NULL DEFAULT ""' },
    { name: 'hours', sql: 'hours REAL NOT NULL DEFAULT 0' },
    { name: 'last_flight_at', sql: 'last_flight_at TEXT' }
  ]);

  ensureColumns(db, 'fleet', [
    { name: 'registration', sql: 'registration TEXT NOT NULL DEFAULT ""' },
    { name: 'type', sql: 'type TEXT NOT NULL DEFAULT ""' },
    { name: 'hours', sql: 'hours REAL NOT NULL DEFAULT 0' },
    { name: 'status', sql: 'status TEXT NOT NULL DEFAULT "active"' }
  ]);

  ensureColumns(db, 'announcements', [
    { name: 'phase', sql: 'phase TEXT NOT NULL DEFAULT "preflight"' },
    { name: 'title', sql: 'title TEXT NOT NULL DEFAULT ""' },
    { name: 'language', sql: 'language TEXT NOT NULL DEFAULT "zh-CN"' },
    { name: 'mode', sql: 'mode TEXT NOT NULL DEFAULT "wav"' },
    { name: 'auto_play', sql: 'auto_play INTEGER NOT NULL DEFAULT 0' },
    { name: 'text', sql: 'text TEXT NOT NULL DEFAULT ""' },
    { name: 'media_file', sql: 'media_file TEXT' }
  ]);

  ensureColumns(db, 'flight_sessions', [
    { name: 'simulator_source', sql: 'simulator_source TEXT NOT NULL DEFAULT "MOCK"' },
    { name: 'callsign', sql: 'callsign TEXT NOT NULL DEFAULT "UNKNOWN"' },
    { name: 'aircraft_type', sql: 'aircraft_type TEXT NOT NULL DEFAULT "UNKNOWN"' },
    { name: 'started_at', sql: 'started_at TEXT NOT NULL DEFAULT ""' },
    { name: 'ended_at', sql: 'ended_at TEXT' },
    { name: 'block_off_at', sql: 'block_off_at TEXT' },
    { name: 'takeoff_at', sql: 'takeoff_at TEXT' },
    { name: 'landing_at', sql: 'landing_at TEXT' },
    { name: 'block_on_at', sql: 'block_on_at TEXT' },
    { name: 'departure_icao', sql: 'departure_icao TEXT' },
    { name: 'arrival_icao', sql: 'arrival_icao TEXT' },
    { name: 'pilot_member_id', sql: 'pilot_member_id TEXT' },
    { name: 'fleet_aircraft_id', sql: 'fleet_aircraft_id TEXT' },
    { name: 'max_altitude_ft', sql: 'max_altitude_ft REAL NOT NULL DEFAULT 0' },
    { name: 'last_phase', sql: 'last_phase TEXT NOT NULL DEFAULT "preflight"' },
    { name: 'landing_rate_fpm', sql: 'landing_rate_fpm REAL' },
    { name: 'fuel_start_kg', sql: 'fuel_start_kg REAL' },
    { name: 'fuel_end_kg', sql: 'fuel_end_kg REAL' },
    { name: 'fuel_used_kg', sql: 'fuel_used_kg REAL' },
    { name: 'status', sql: 'status TEXT NOT NULL DEFAULT "active"' }
  ]);

  ensureColumns(db, 'flight_events', [
    { name: 'session_id', sql: 'session_id TEXT NOT NULL DEFAULT ""' },
    { name: 'event_type', sql: 'event_type TEXT NOT NULL DEFAULT ""' },
    { name: 'phase', sql: 'phase TEXT NOT NULL DEFAULT "preflight"' },
    { name: 'occurred_at', sql: 'occurred_at TEXT NOT NULL DEFAULT ""' },
    { name: 'lat', sql: 'lat REAL' },
    { name: 'lon', sql: 'lon REAL' },
    { name: 'altitude_ft', sql: 'altitude_ft REAL' },
    { name: 'groundspeed_kt', sql: 'groundspeed_kt REAL' },
    { name: 'vertical_speed_fpm', sql: 'vertical_speed_fpm REAL' }
  ]);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_flight_events_session_id ON flight_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_flight_sessions_status ON flight_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_pireps_session_id ON pireps(session_id);
  `);

  return db;
}

export type AppDatabase = ReturnType<typeof bootstrapDatabase>;
