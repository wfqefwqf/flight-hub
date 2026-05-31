import Database from 'better-sqlite3';
import path from 'node:path';

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
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pireps (
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

    CREATE INDEX IF NOT EXISTS idx_flight_events_session_id ON flight_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_flight_sessions_status ON flight_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_pireps_session_id ON pireps(session_id);
  `);

  return db;
}

export type AppDatabase = ReturnType<typeof bootstrapDatabase>;
