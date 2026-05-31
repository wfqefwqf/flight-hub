import { contextBridge, ipcRenderer } from 'electron';
import type {
  CabinAnnouncement,
  DispatchFlight,
  FleetAircraft,
  FlightHubSnapshot,
  Member,
  PirepRecord,
  SimConnectionConfig,
  SimSource
} from '@shared/types';

const api = {
  getSnapshot: () => ipcRenderer.invoke('app:get-snapshot') as Promise<FlightHubSnapshot>,
  setSimSource: (source: SimSource) => ipcRenderer.invoke('tracking:set-source', source),
  updateSimConfig: (config: Partial<SimConnectionConfig>) => ipcRenderer.invoke('tracking:update-config', config),
  importSimBrief: (payload: Partial<DispatchFlight>) => ipcRenderer.invoke('dispatch:import-simbrief', payload),
  saveDispatch: (payload: DispatchFlight) => ipcRenderer.invoke('dispatch:save', payload),
  exportDispatch: (id: string) => ipcRenderer.invoke('dispatch:export', id),
  savePirep: (payload: PirepRecord) => ipcRenderer.invoke('pirep:save', payload),
  saveMember: (payload: Member) => ipcRenderer.invoke('members:save', payload),
  removeMember: (id: string) => ipcRenderer.invoke('members:remove', id),
  saveFleetAircraft: (payload: FleetAircraft) => ipcRenderer.invoke('fleet:save', payload),
  removeFleetAircraft: (id: string) => ipcRenderer.invoke('fleet:remove', id),
  playAnnouncement: (payload: CabinAnnouncement) => ipcRenderer.invoke('cabin:play', payload),
  onTrackingUpdated: (listener: (tracking: FlightHubSnapshot['tracking']) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tracking: FlightHubSnapshot['tracking']) => listener(tracking);
    ipcRenderer.on('tracking:updated', handler);
    return () => ipcRenderer.removeListener('tracking:updated', handler);
  }
};

contextBridge.exposeInMainWorld('flightHub', api);

declare global {
  interface Window {
    flightHub: typeof api;
  }
}
