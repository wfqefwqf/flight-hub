import type { SimConnectionConfig } from '@shared/types';
import type { AdapterSample, SimulatorAdapter } from './types';

export class MsfsAdapter implements SimulatorAdapter {
  private api: any;
  private off?: () => void;
  private connected = false;
  private handler: (sample: AdapterSample) => void = () => {};

  constructor(private readonly config: SimConnectionConfig) {}

  async connect() {
    const mod = await import('msfs-simconnect-api-wrapper');
    const api = new mod.MSFS_API();
    this.api = api;

    await new Promise<void>((resolve, reject) => {
      api.connect({
        autoReconnect: this.config.autoReconnect,
        retries: this.config.autoReconnect ? Infinity : 0,
        retryInterval: 3,
        host: this.config.msfsHost,
        port: this.config.msfsPort,
        onConnect: () => {
          this.connected = true;
          resolve();
        },
        onException: (exceptionName: string) => {
          reject(new Error(exceptionName));
        }
      });
    });

    this.off = api.schedule(async (data: Record<string, number | string>) => {
      this.connected = true;
      this.handler({
        callsign: String(data.ATC_ID ?? data.ATC_AIRLINE ?? 'MSFS'),
        aircraftType: String(data.TITLE ?? data.ATC_MODEL ?? 'MSFS Aircraft'),
        onGround: Number(data.SIM_ON_GROUND ?? 0) === 1,
        totalFuelKg: Number(data.FUEL_TOTAL_QUANTITY_WEIGHT ?? 0) * 0.45359237,
        nearestIcao: String(data.AIRPORT_ID ?? '').trim() || undefined,
        position: {
          lat: Number(data.PLANE_LATITUDE ?? 0),
          lon: Number(data.PLANE_LONGITUDE ?? 0),
          altitude: Number(data.INDICATED_ALTITUDE ?? 0),
          groundspeed: Number(data.GROUND_VELOCITY ?? 0),
          heading: Number(data.PLANE_HEADING_DEGREES_TRUE ?? 0),
          verticalSpeed: Number(data.VERTICAL_SPEED ?? 0),
          timestamp: Date.now()
        }
      });
    }, 1000,
    'ATC ID',
    'ATC AIRLINE',
    'ATC MODEL',
    'TITLE',
    'PLANE LATITUDE',
    'PLANE LONGITUDE',
    'INDICATED ALTITUDE',
    'GROUND VELOCITY',
    'PLANE HEADING DEGREES TRUE',
    'VERTICAL SPEED',
    'SIM ON GROUND',
    'FUEL TOTAL QUANTITY WEIGHT',
    'AIRPORT ID');
  }

  async disconnect() {
    this.connected = false;
    if (this.off) this.off();
  }

  isConnected() {
    return this.connected;
  }

  setUpdateHandler(handler: (sample: AdapterSample) => void) {
    this.handler = handler;
  }
}
