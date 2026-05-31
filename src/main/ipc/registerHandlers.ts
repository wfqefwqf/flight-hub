import { app, ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs';
import type { AppDatabase } from '../db/bootstrap';
import type { CabinAnnouncement, DispatchFlight, FlightHubSnapshot, PirepRecord, SimConnectionConfig } from '@shared/types';
import { SimBridgeService } from '../services/simBridgeService';
import { CabinService } from '../services/cabinService';
import { seedAnnouncements } from '../services/seedData';
import { FlightSessionRepository } from '../db/flightSessionRepository';
import { DispatchRepository } from '../db/dispatchRepository';

interface RegisterDeps {
  db: AppDatabase;
  simBridgeService: SimBridgeService;
  getWindow: () => BrowserWindow | null;
}

const upsert = (db: AppDatabase, table: string, id: string, data: unknown) => {
  db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data`).run(id, JSON.stringify(data));
};

const readTable = <T>(db: AppDatabase, table: string, seed: T[]): T[] => {
  const rows = db.prepare(`SELECT data FROM ${table}`).all() as Array<{ data: string }>;
  if (rows.length === 0) {
    seed.forEach((item: any) => upsert(db, table, item.id, item));
    return seed;
  }
  return rows.map((row) => JSON.parse(row.data) as T);
};

export function registerIpcHandlers({ db, simBridgeService, getWindow }: RegisterDeps) {
  const cabinService = new CabinService();
  const sessionRepository = new FlightSessionRepository(db);
  const dispatchRepository = new DispatchRepository(db);
  ipcMain.handle('app:get-snapshot', (): FlightHubSnapshot => ({
    tracking: simBridgeService.getState(),
    currentSession: simBridgeService.getCurrentSession(),
    dispatches: dispatchRepository.list(),
    pireps: sessionRepository.getRecentCompletedPireps(20),
    members: [],
    fleet: [],
    announcements: readTable(db, 'announcements', seedAnnouncements),
    dashboard: sessionRepository.getDashboardStats()
  }));

  ipcMain.handle('tracking:set-source', async (_event, source) => simBridgeService.setSource(source));

  ipcMain.handle('tracking:update-config', (_event, config: Partial<SimConnectionConfig>) => simBridgeService.updateConfig(config));

  ipcMain.handle('dispatch:import-simbrief', (_event, payload: Partial<DispatchFlight>) => {
    const draft = dispatchRepository.createDraft();
    const merged: DispatchFlight = {
      ...draft,
      flightNumber: payload.flightNumber ?? draft.flightNumber,
      departure: payload.departure ?? draft.departure,
      arrival: payload.arrival ?? draft.arrival,
      alternate: payload.alternate ?? draft.alternate,
      route: payload.route ?? draft.route,
      payloadKg: payload.payloadKg ?? draft.payloadKg,
      fuelKg: payload.fuelKg ?? draft.fuelKg,
      source: 'simbrief'
    };
    return dispatchRepository.save(merged);
  });

  ipcMain.handle('dispatch:save', (_event, payload: DispatchFlight) => {
    return dispatchRepository.save(payload);
  });

  ipcMain.handle('dispatch:export', async (_event, id: string) => {
    const dispatch = dispatchRepository.getById(id);
    if (!dispatch) throw new Error('Dispatch not found');

    const json = JSON.stringify(dispatch, null, 2);
    const browserWindow = getWindow();
    const result = browserWindow
      ? await dialog.showSaveDialog(browserWindow, {
          defaultPath: app.getPath('documents') + '\\dispatch.json',
          filters: [{ name: 'JSON', extensions: ['json'] }]
        })
      : await dialog.showSaveDialog({
          defaultPath: app.getPath('documents') + '\\dispatch.json',
          filters: [{ name: 'JSON', extensions: ['json'] }]
        });

    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, json, 'utf-8');
    return result.filePath;
  });

  ipcMain.handle('pirep:save', () => {
    throw new Error('PIREP submission is hidden until real flight session tracking is implemented');
  });

  ipcMain.handle('cabin:play', (_event, payload: CabinAnnouncement) => {
    return cabinService.playAnnouncement(payload);
  });
}
