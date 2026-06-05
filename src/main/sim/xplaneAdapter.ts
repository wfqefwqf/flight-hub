import dgram from 'node:dgram';
import type { SimConnectionConfig } from '@shared/types';
import type { AdapterSample, SimulatorAdapter } from './adapter';

const XPLANE_DEFAULT_COMMAND_PORT = 49000;
const BEACON_MULTICAST_ADDR = '239.255.1.1';
const BEACON_PORT = 49707;

interface RrefDef {
  id: number;
  path: string;
  field: string;
}

const RREF_DEFINITIONS: RrefDef[] = [
  { id: 100, path: 'sim/flightmodel/position/latitude', field: 'lat' },
  { id: 101, path: 'sim/flightmodel/position/longitude', field: 'lon' },
  { id: 102, path: 'sim/flightmodel/position/elevation', field: 'elevation' },
  { id: 103, path: 'sim/flightmodel/position/groundspeed', field: 'groundspeed' },
  { id: 104, path: 'sim/flightmodel/position/true_psi', field: 'heading' },
  { id: 105, path: 'sim/flightmodel/position/vh_ind_fpm', field: 'verticalSpeed' },
  { id: 106, path: 'sim/flightmodel2/gear/on_ground', field: 'onGround' },
  { id: 107, path: 'sim/flightmodel/weight/m_fuel_total', field: 'fuelKg' },
];

// DSEL DATA group mappings (backup data source)
type DatasetMapping = {
  group: string;
  fields: Array<string | null>;
};

const mappings: Record<number, DatasetMapping> = {
  3: { group: 'airspeed', fields: ['indicated', 'equivalent', 'true', 'truegnd', null, 'mph', 'mphair', 'mphgnd'] },
  4: { group: 'gload', fields: ['mach', null, 'vvi', null, 'normal', 'axial', 'side', null] },
  17: { group: 'attitude', fields: ['pitch', 'roll', 'truehdg', 'maghdg', null, null, null, null] },
  20: { group: 'globalposition', fields: ['lat', 'lon', 'altmsl', 'altagl', null, null, null, null] },
  62: { group: 'fuel', fields: ['totalFuelWeightKg', null, null, null, null, null, null, null] }
};

const REQUIRED_GROUPS = [3, 4, 17, 20, 62];

interface XPlaneBeacon {
  host: string;
  port: number;
}

function buildRrefPacket(def: RrefDef, freq: number): Buffer {
  const buf = Buffer.alloc(413);
  buf.write('RREF', 0, 4, 'ascii');
  buf.writeUInt8(0, 4);
  buf.writeInt32LE(freq, 5);
  buf.writeInt32LE(def.id, 9);
  buf.write(def.path, 13, 400, 'ascii');
  return buf;
}

function buildDselPacket(index: number): Buffer {
  const buf = Buffer.alloc(9);
  buf.write('DSEL', 0, 4, 'ascii');
  buf.writeUInt8(0, 4);
  buf.writeInt32LE(index, 5);
  return buf;
}

export class XPlaneAdapter implements SimulatorAdapter {
  private socket: dgram.Socket | null = null;
  private connected = false;
  private handler: (sample: AdapterSample) => void = () => {};
  private latest: Record<string, Record<string, number>> = {};
  private firstDataReceived = false;
  private reRequestInterval?: ReturnType<typeof setInterval>;
  private dataWatchdogTimer?: ReturnType<typeof setInterval>;
  private lastDataTimestamp = 0;
  private bindPort = 0;
  private rrefValues: Record<string, number> = {};
  private xplaneTarget: { host: string; port: number } | null = null;

  constructor(private readonly config: SimConnectionConfig) {}

  async connect() {
    const manualHost = this.config.xplaneHost?.trim() || '127.0.0.1';
    const manualPort = XPLANE_DEFAULT_COMMAND_PORT;
    const isLocal = this.isLocalhost(manualHost);

    // 本机连接：跳过 Beacon，直接用手动配置
    // 远程连接：尝试 Beacon 发现，失败则回退手动配置
    let xplaneTarget = isLocal
      ? null
      : await this.tryDiscover();

    if (!xplaneTarget) {
      xplaneTarget = { host: manualHost, port: manualPort };
      console.log(`[XPlaneAdapter] 使用手动配置: ${xplaneTarget.host}:${xplaneTarget.port}`);
    }

    this.xplaneTarget = xplaneTarget;
    await this.connectWithEphemeralPort(xplaneTarget);
  }

  private isLocalhost(host: string): boolean {
    const h = host.trim().toLowerCase();
    return h === '' || h === '127.0.0.1' || h === 'localhost' || h === '::1';
  }

  private async tryDiscover(): Promise<XPlaneBeacon | null> {
    try {
      const beacon = await this.discoverXPlane();
      if (beacon) {
        console.log(`[XPlaneAdapter] Beacon 发现 X-Plane: ${beacon.host}:${beacon.port}`);
        return beacon;
      }
    } catch (err) {
      console.log('[XPlaneAdapter] Beacon 发现失败:', err instanceof Error ? err.message : String(err));
    }
    return null;
  }

  private discoverXPlane(timeoutMs = 3000): Promise<XPlaneBeacon | null> {
    return new Promise((resolve, reject) => {
      const beaconSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          beaconSocket.close();
          resolve(null);
        }
      }, timeoutMs);

      beaconSocket.on('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          beaconSocket.close();
          reject(err);
        }
      });

      beaconSocket.on('message', (msg) => {
        if (msg.length < 17) return;
        const header = msg.subarray(0, 5).toString('ascii');
        if (header !== 'BECN\0') return;

        try {
          // XPlaneConnect struct xpcBeacon layout:
          //   header[5]="BECN\0" | verMajor(1) | verMinor(1)
          //   role(int32) | port(uint16 LE) | hostId[4] | machineId(8)
          const port = msg.readUInt16LE(11);
          const ipBytes = msg.subarray(13, 17);
          const ip = `${ipBytes[0]}.${ipBytes[1]}.${ipBytes[2]}.${ipBytes[3]}`;

          // 验证：端口应在合法范围内，IP 不应为 0.0.0.0
          if (port < 1024 || port > 65535) return;
          if (ip === '0.0.0.0' || ip.startsWith('0.')) return;

          const targetHost = ip;
          const targetPort = port;

          if (!settled) {
            settled = true;
            clearTimeout(timer);
            beaconSocket.close();
            console.log(`[XPlaneAdapter] Beacon 解析成功: ${targetHost}:${targetPort}`);
            resolve({ host: targetHost, port: targetPort });
          }
        } catch {
          // ignore malformed beacon
        }
      });

      beaconSocket.bind(BEACON_PORT, () => {
        try {
          beaconSocket.addMembership(BEACON_MULTICAST_ADDR);
          console.log(`[XPlaneAdapter] 正在监听 Beacon 多播 ${BEACON_MULTICAST_ADDR}:${BEACON_PORT}`);
        } catch (err) {
          console.log('[XPlaneAdapter] 加入多播组失败:', err instanceof Error ? err.message : String(err));
        }
      });
    });
  }

  private connectWithEphemeralPort(xplaneTarget: { host: string; port: number }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      this.socket = socket;
      this.firstDataReceived = false;
      this.rrefValues = {};
      this.latest = {};
      this.bindPort = 0;
      this.lastDataTimestamp = 0;

      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.stopReRequest();
          this.stopWatchdog();
          this.cleanupSocket();
          const hasRref = Object.keys(this.rrefValues).length;
          reject(
            new Error(
              `X-Plane 未在 10 秒内响应。\n` +
              `已收到的 DataRef 数：${hasRref}/8\n` +
              `请确认：\n` +
              `1. X-Plane 已启动并进入飞行场景（非菜单/暂停）\n` +
              `2. X-Plane 12: Settings → Network → "Accept incoming connections" 已开启\n` +
              `3. X-Plane 11: Settings → Network → 对应选项已开启\n` +
              `4. Windows 防火墙没有阻止 Flight Hub 的 UDP 通信\n` +
              `5. 如果 X-Plane 运行在另一台电脑上，请确认 xplaneHost 配置正确\n` +
              `目标地址：${xplaneTarget.host}:${xplaneTarget.port}`
            )
          );
        }
      }, 10000);

      socket.once('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.connected = false;
        this.stopReRequest();
        this.stopWatchdog();
        this.cleanupSocket();
        reject(new Error(`X-Plane UDP Socket 错误：${error.message}`));
      });

      socket.on('message', (message) => {
        try {
          this.handleMessage(message);
          this.lastDataTimestamp = Date.now();

          const position = this.buildSample();
          if (position) {
            this.connected = true;

            if (!this.firstDataReceived) {
              this.firstDataReceived = true;
              clearTimeout(timer);
              if (!settled) {
                settled = true;
                resolve();
              }
              console.log(`[XPlaneAdapter] 首次收到 X-Plane 数据，连接已建立（本地端口 ${this.bindPort}）`);
              this.startReRequest();
              this.startWatchdog();
            }

            this.handler(position);
          }
        } catch {
          // ignore malformed packets
        }
      });

      socket.bind(0, () => {
        const address = socket.address();
        this.bindPort = address.port;
        console.log(`[XPlaneAdapter] UDP socket 已绑定到临时端口 ${address.port}`);

        this.requestRrefData(socket, xplaneTarget);
        this.requestDataGroups(socket, xplaneTarget);
      });
    });
  }

  private requestRrefData(socket: dgram.Socket, target: { host: string; port: number }) {
    for (const def of RREF_DEFINITIONS) {
      const buf = buildRrefPacket(def, 5);
      socket.send(buf, target.port, target.host, (err) => {
        if (err) {
          console.error(`[XPlaneAdapter] RREF 请求发送失败 (${def.path}):`, err.message);
        }
      });
    }
    console.log(`[XPlaneAdapter] 已向 ${target.host}:${target.port} 发送 ${RREF_DEFINITIONS.length} 个 RREF 请求`);
  }

  private requestDataGroups(socket: dgram.Socket, target: { host: string; port: number }) {
    for (const index of REQUIRED_GROUPS) {
      const buf = buildDselPacket(index);
      socket.send(buf, target.port, target.host, (err) => {
        if (err) {
          console.error(`[XPlaneAdapter] DSEL 请求发送失败 (group ${index}):`, err.message);
        }
      });
    }
    console.log(`[XPlaneAdapter] 已向 ${target.host}:${target.port} 发送 DSEL 数据组请求`);
  }

  private startReRequest() {
    this.stopReRequest();
    this.reRequestInterval = setInterval(() => {
      if (this.socket && this.xplaneTarget) {
        this.requestRrefData(this.socket, this.xplaneTarget);
      }
    }, 1000);
  }

  private stopReRequest() {
    if (this.reRequestInterval) {
      clearInterval(this.reRequestInterval);
      this.reRequestInterval = undefined;
    }
  }

  private startWatchdog() {
    this.stopWatchdog();
    this.dataWatchdogTimer = setInterval(() => {
      if (!this.firstDataReceived) return;
      const elapsed = Date.now() - this.lastDataTimestamp;
      if (elapsed > 8000 && this.connected) {
        console.log('[XPlaneAdapter] 数据超时，标记为断开');
        this.connected = false;
        this.stopReRequest();
      }
    }, 3000);
  }

  private stopWatchdog() {
    if (this.dataWatchdogTimer) {
      clearInterval(this.dataWatchdogTimer);
      this.dataWatchdogTimer = undefined;
    }
  }

  private handleMessage(message: Buffer) {
    if (message.length < 5) return;
    const header4 = message.subarray(0, 4).toString('ascii');

    // XP11 使用文本头 "RREF," (5 bytes)，XP12/bin 格式用 "RREF" (4 bytes)
    if (header4 === 'DATA') {
      this.parseDataMessage(message);
    } else if (header4 === 'RREF') {
      const header5 = message.subarray(0, 5).toString('ascii');
      const dataOffset = header5 === 'RREF,' ? 5 : 4;
      this.parseRrefMessage(message, dataOffset);
    }
  }

  private parseDataMessage(message: Buffer) {
    let parsed = this.tryParseDataAtOffset(message, 5);
    if (!parsed) {
      parsed = this.tryParseDataAtOffset(message, 4);
    }
  }

  private tryParseDataAtOffset(message: Buffer, dataOffset: number): boolean {
    if (message.length < dataOffset + 36) return false;
    const payload = message.subarray(dataOffset);
    let found = false;

    for (let offset = 0; offset + 36 <= payload.length; offset += 36) {
      const chunk = payload.subarray(offset, offset + 36);
      const index = chunk.readInt32LE(0);
      const mapping = mappings[index];
      if (!mapping) continue;

      found = true;
      const groupValues = (this.latest[mapping.group] ??= {});
      for (let i = 0; i < 8; i += 1) {
        const field = mapping.fields[i];
        if (!field) continue;
        groupValues[field] = chunk.readFloatLE(4 + i * 4);
      }
    }

    return found;
  }

  private parseRrefMessage(message: Buffer, dataOffset: number) {
    // XP11 将多个 RREF 响应合并在一个包中，每条记录 8 字节 (id int32LE + value float32LE)
    for (let offset = dataOffset; offset + 8 <= message.length; offset += 8) {
      const id = message.readInt32LE(offset);
      const value = message.readFloatLE(offset + 4);
      const def = RREF_DEFINITIONS.find((d) => d.id === id);
      if (def) {
        this.rrefValues[def.field] = value;
      }
    }
  }

  private buildSample(): AdapterSample | null {
    const hasRref = Object.keys(this.rrefValues).length > 0;

    if (hasRref) {
      const lat = this.rrefValues.lat;
      const lon = this.rrefValues.lon;

      if (lat === undefined || lon === undefined) return null;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

      const elevationMeters = this.rrefValues.elevation ?? 0;
      const groundspeedMs = this.rrefValues.groundspeed ?? 0;
      const headingRaw = this.rrefValues.heading ?? 0;
      const verticalSpeedFpmRaw = this.rrefValues.verticalSpeed;
      const onGroundRaw = this.rrefValues.onGround ?? 1;
      const fuelKgRref = this.rrefValues.fuelKg;

      const gs = Number.isFinite(groundspeedMs) ? groundspeedMs * 1.94384 : 0;
      const alt = Number.isFinite(elevationMeters) ? elevationMeters * 3.28084 : 0;
      const hdg = Number.isFinite(headingRaw) ? headingRaw : 0;

      const verticalSpeed = (verticalSpeedFpmRaw !== undefined && Number.isFinite(verticalSpeedFpmRaw))
        ? verticalSpeedFpmRaw
        : (Number(this.latest.gload?.vvi ?? 0));

      const fuelKg = (fuelKgRref !== undefined && Number.isFinite(fuelKgRref) && fuelKgRref > 0)
        ? fuelKgRref
        : Number(this.latest.fuel?.totalFuelWeightKg ?? 0);

      const onGround = onGroundRaw > 0;

      return {
        callsign: 'XPLANE',
        aircraftType: 'X-Plane Aircraft',
        onGround,
        totalFuelKg: fuelKg > 0 ? fuelKg : undefined,
        nearestIcao: undefined,
        position: {
          lat,
          lon,
          altitude: alt,
          groundspeed: gs,
          heading: hdg,
          verticalSpeed,
          timestamp: Date.now()
        }
      };
    }

    // Fallback to DATA messages (when RREF doesn't work at all)
    const globalposition = this.latest.globalposition;
    if (!globalposition) return null;

    const lat = Number(globalposition.lat);
    const lon = Number(globalposition.lon);
    const altitude = Number(globalposition.altmsl ?? 0);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

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
        lat,
        lon,
        altitude,
        groundspeed: Number(airspeed.truegnd ?? airspeed.true ?? 0),
        heading: Number(attitude.truehdg ?? 0),
        verticalSpeed: Number(gload.vvi ?? 0),
        timestamp: Date.now()
      }
    };
  }

  private cleanupSocket() {
    this.stopReRequest();
    this.stopWatchdog();
    try {
      if (this.socket) {
        this.socket.close();
      }
    } catch {
      // ignore
    } finally {
      this.socket = null;
    }
  }

  async disconnect() {
    if (this.socket && this.xplaneTarget) {
      const targetHost = this.xplaneTarget.host;
      const targetPort = this.xplaneTarget.port;
      for (const def of RREF_DEFINITIONS) {
        const buf = buildRrefPacket(def, 0);
        try {
          this.socket.send(buf, targetPort, targetHost);
        } catch {
          // ignore
        }
      }
    }

    this.connected = false;
    this.firstDataReceived = false;
    this.cleanupSocket();
    this.latest = {};
    this.rrefValues = {};
    this.xplaneTarget = null;
  }

  isConnected() {
    return this.connected;
  }

  setUpdateHandler(handler: (sample: AdapterSample) => void) {
    this.handler = handler;
  }
}
