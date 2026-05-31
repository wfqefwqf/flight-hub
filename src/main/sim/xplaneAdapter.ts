import dgram from 'node:dgram';
import type { SimConnectionConfig } from '@shared/types';
import type { AdapterSample, SimulatorAdapter } from './types';

type DatasetMapping = {
  group: string;
  fields: Array<string | null>;
};

const mappings: Record<number, DatasetMapping> = {
  3: { group: 'airspeed', fields: ['indicated', 'equivalent', 'true', 'truegnd', null, 'mph', 'mphair', 'mphgnd'] },
  4: { group: 'gload', fields: ['mach', null, 'vvi', null, 'normal', 'axial', 'side', null] },
  17: { group: 'attitude', fields: ['pitch', 'roll', 'truehdg', 'maghdg', null, null, null, null] },
  62: { group: 'fuel', fields: ['totalFuelWeightKg', null, null, null, null, null, null, null] }
};

export class XPlaneAdapter implements SimulatorAdapter {
  private socket: dgram.Socket | null = null;
  private connected = false;
  private handler: (sample: AdapterSample) => void = () => {};
  private latest: Record<string, Record<string, number>> = {};

  constructor(private readonly config: SimConnectionConfig) {}

  async connect() {
    await new Promise<void>((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      this.socket = socket;

      socket.once('error', (error) => {
        this.connected = false;
        reject(error);
      });

      socket.on('message', (message) => {
        try {
          if (message.length < 5) return;
          const header = message.subarray(0, 4).toString('ascii');
          if (header !== 'DATA') return;

          this.connected = true;
          this.parseDataMessage(message);
          const position = this.buildSample();
          if (position) this.handler(position);
        } catch {
          // ignore malformed packets
        }
      });

      socket.bind(this.config.xplaneLocalPort, () => resolve());
    });
  }

  private parseDataMessage(message: Buffer) {
    const payload = message.subarray(5);
    for (let offset = 0; offset + 36 <= payload.length; offset += 36) {
      const chunk = payload.subarray(offset, offset + 36);
      const index = chunk.readInt32LE(0);
      const mapping = mappings[index];
      if (!mapping) continue;

      const groupValues = (this.latest[mapping.group] ??= {});
      for (let i = 0; i < 8; i += 1) {
        const field = mapping.fields[i];
        if (!field) continue;
        groupValues[field] = chunk.readFloatLE(4 + i * 4);
      }
    }
  }

  private buildSample(): AdapterSample | null {
    const globalposition = this.latest.globalposition;
    if (!globalposition) return null;

    const airspeed = this.latest.airspeed ?? {};
    const attitude = this.latest.attitude ?? {};
    const gload = this.latest.gload ?? {};
    const fuel = this.latest.fuel ?? {};

    return {
      callsign: 'XPLANE',
      aircraftType: 'X-Plane Aircraft',
      onGround: (globalposition.altagl ?? 0) < 5,
      totalFuelKg: Number(fuel.totalFuelWeightKg ?? 0),
      nearestIcao: undefined,
      position: {
        lat: Number(globalposition.lat ?? 0),
        lon: Number(globalposition.lon ?? 0),
        altitude: Number(globalposition.altmsl ?? 0),
        groundspeed: Number(airspeed.truegnd ?? airspeed.true ?? 0),
        heading: Number(attitude.truehdg ?? 0),
        verticalSpeed: Number(gload.vvi ?? 0),
        timestamp: Date.now()
      }
    };
  }

  async disconnect() {
    this.connected = false;
    await new Promise<void>((resolve) => {
      if (!this.socket) return resolve();
      this.socket.close(() => resolve());
      this.socket = null;
    });
  }

  isConnected() {
    return this.connected;
  }

  setUpdateHandler(handler: (sample: AdapterSample) => void) {
    this.handler = handler;
  }
}
