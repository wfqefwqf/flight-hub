import { app, ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs';
import type { AppDatabase } from '../db/bootstrap';
import type { CabinAnnouncement, DispatchFlight, FlightHubSnapshot, PirepRecord, SimConnectionConfig } from '@shared/types';
import { SimBridgeService } from '../services/simBridgeService';
import { CabinService } from '../services/cabinService';
import { emptyAnnouncements } from '../services/seedData';
import { FlightSessionRepository } from '../db/flightSessionRepository';
import { DispatchRepository } from '../db/dispatchRepository';
import { MemberRepository } from '../db/memberRepository';
import { FleetRepository } from '../db/fleetRepository';
import { importDispatchFromSimBrief } from '../services/simbriefService';

interface RegisterDeps {
  db: AppDatabase;
  simBridgeService: SimBridgeService;
  getWindow: () => BrowserWindow | null;
}

function mapAnnouncement(row: any): CabinAnnouncement {
  return {
    id: row.id,
    phase: row.phase,
    title: row.title,
    language: row.language,
    mode: row.mode,
    autoPlay: !!row.auto_play,
    text: row.text,
    mediaFile: row.media_file ?? undefined
  };
}

function listAnnouncements(db: AppDatabase) {
  const rows = db.prepare('SELECT * FROM announcements ORDER BY title ASC').all();
  if (rows.length > 0) {
    return rows.map(mapAnnouncement);
  }

  return emptyAnnouncements;
}

export function registerIpcHandlers({ db, simBridgeService, getWindow }: RegisterDeps) {
  const cabinService = new CabinService();
  const sessionRepository = new FlightSessionRepository(db);
  const dispatchRepository = new DispatchRepository(db);
  const memberRepository = new MemberRepository(db);
  const fleetRepository = new FleetRepository(db);
  ipcMain.handle('app:get-snapshot', (): FlightHubSnapshot => ({
    tracking: simBridgeService.getState(),
    currentSession: simBridgeService.getCurrentSession(),
    dispatches: dispatchRepository.list(),
    pireps: sessionRepository.getRecentCompletedPireps(20),
    members: memberRepository.list(),
    fleet: fleetRepository.list(),
    announcements: listAnnouncements(db),
    dashboard: sessionRepository.getDashboardStats(memberRepository.list())
  }));

  ipcMain.handle('tracking:set-source', async (_event, source) => simBridgeService.setSource(source));

  ipcMain.handle('tracking:update-config', async (_event, config: Partial<SimConnectionConfig>) => simBridgeService.updateConfig(config));

  ipcMain.handle('dispatch:import-simbrief', async (_event, payload: Partial<DispatchFlight>) => {
    const imported = await importDispatchFromSimBrief(payload);
    const draft = dispatchRepository.createDraft();
    const merged: DispatchFlight = {
      ...draft,
      ...imported,
      simbriefUsername: payload.simbriefUsername,
      simbriefUserId: payload.simbriefUserId,
      simbriefNavlogId: payload.simbriefNavlogId,
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

  ipcMain.handle('pirep:save', (_event, payload: PirepRecord) => {
    return sessionRepository.savePirepNotes(payload.id, payload.notes ?? '');
  });

  ipcMain.handle('members:save', (_event, payload) => {
    return memberRepository.save(payload);
  });

  ipcMain.handle('members:remove', (_event, id: string) => {
    memberRepository.remove(id);
    return true;
  });

  ipcMain.handle('fleet:save', (_event, payload) => {
    return fleetRepository.save(payload);
  });

  ipcMain.handle('fleet:remove', (_event, id: string) => {
    fleetRepository.remove(id);
    return true;
  });

  ipcMain.handle('cabin:play', (_event, payload: CabinAnnouncement) => {
    return cabinService.playAnnouncement(payload);
  });
}
