import type { AdapterSample, SimulatorAdapter } from './types';
import { seedTrackingState } from '../services/seedData';

export class MockAdapter implements SimulatorAdapter {
  private timer?: NodeJS.Timeout;
  private connected = false;
  private handler: (sample: AdapterSample) => void = () => {};
  private current = {
    lat: 31.2304,
    lon: 121.4737,
    altitude: 0,
    groundspeed: 0,
    heading: 247,
    verticalSpeed: 0,
    timestamp: Date.now()
  };

  async connect() {
    this.connected = true;
    this.timer = setInterval(() => {
      this.current = {
        lat: this.current.lat + (Math.random() - 0.45) * 0.08,
        lon: this.current.lon + (Math.random() - 0.45) * 0.08,
        altitude: Math.max(0, this.current.altitude + Math.round((Math.random() - 0.4) * 1600)),
        groundspeed: Math.max(0, this.current.groundspeed + Math.round((Math.random() - 0.5) * 20)),
        heading: (this.current.heading + Math.round((Math.random() - 0.5) * 8) + 360) % 360,
        verticalSpeed: Math.round((Math.random() - 0.5) * 1800),
        timestamp: Date.now()
      };
      this.handler({
        position: this.current,
        callsign: 'MOCK1001',
        aircraftType: 'A32N',
        onGround: this.current.altitude < 5 && this.current.groundspeed < 30
      });
    }, 4000);
  }

  async disconnect() {
    this.connected = false;
    if (this.timer) clearInterval(this.timer);
  }

  isConnected() {
    return this.connected;
  }

  setUpdateHandler(handler: (sample: AdapterSample) => void) {
    this.handler = handler;
  }
}
