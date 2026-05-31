import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { registerIpcHandlers } from './ipc/registerHandlers';
import { bootstrapDatabase } from './db/bootstrap';
import { FlightSessionRepository } from './db/flightSessionRepository';
import { SimBridgeService } from './services/simBridgeService';

let mainWindow: BrowserWindow | null = null;
let simBridgeService: SimBridgeService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#020617',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist/preload/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist/renderer/index.html'));
  }
}

app.whenReady().then(() => {
  const db = bootstrapDatabase(app.getPath('userData'));
  const sessionRepository = new FlightSessionRepository(db);
  simBridgeService = new SimBridgeService(sessionRepository);
  registerIpcHandlers({ db, simBridgeService, getWindow: () => mainWindow });
  simBridgeService.start((tracking) => {
    mainWindow?.webContents.send('tracking:updated', tracking);
  });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error('Failed to bootstrap Flight Hub:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
