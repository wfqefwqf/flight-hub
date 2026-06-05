import type { SimConnectionConfig } from '@shared/types';
import type { AdapterSample, SimulatorAdapter } from './types';

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

function isLocalhost(host: string | undefined): boolean {
  if (!host) return true;
  const h = host.trim().toLowerCase();
  return h === '' || h === '127.0.0.1' || h === 'localhost' || h === '::1';
}

export class MsfsAdapter implements SimulatorAdapter {
  private api: any;
  private off?: () => void;
  private connected = false;
  private handler: (sample: AdapterSample) => void = () => {};

  constructor(private readonly config: SimConnectionConfig) {}

  async connect() {
    let mod: any;
    try {
      mod = await dynamicImport('msfs-simconnect-api-wrapper');
    } catch (importErr) {
      const errMsg = importErr instanceof Error ? importErr.message : String(importErr);
      throw new Error(
        `无法加载 msfs-simconnect-api-wrapper 模块。可能原因：\n` +
        `1. 未执行 npm install\n` +
        `2. 原生模块未针对当前 Electron 版本编译（请运行 npx electron-builder install-app-deps）\n` +
        `3. 打包后 ASAR 中模块路径解析失败\n` +
        `原始错误：${errMsg}`
      );
    }

    const MSFS_API = mod?.MSFS_API;
    if (!MSFS_API) {
      throw new Error('msfs-simconnect-api-wrapper 模块导出异常，找不到 MSFS_API 构造函数。');
    }

    const api = new MSFS_API('Flight Hub');
    this.api = api;

    const connectOpts: any = {
      autoReconnect: this.config.autoReconnect,
      retries: 0,
      retryInterval: 3,
      onConnect: () => {},
      onException: (_exceptionName: string) => {},
      onRetry: () => {}
    };

    // 只有非本地地址时才传入 host/port，让 node-simconnect 使用 TCP 连接。
    // 本地连接（host 为空、127.0.0.1、localhost）不传 host，使用默认命名管道。
    const host = this.config.msfsHost?.trim() ?? '';
    if (!isLocalhost(host)) {
      connectOpts.host = host;
      connectOpts.port = this.config.msfsPort;
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(
            new Error(
              `MSFS SimConnect 连接超时（${isLocalhost(host) ? '本地命名管道' : `${host}:${this.config.msfsPort}`}）。\n` +
              `请确认 Microsoft Flight Simulator 已启动。\n` +
              `如果使用远程连接，请确认 SimConnect.xml 中已开启对应端口。`
            )
          );
        }
      }, 8000);

      connectOpts.onConnect = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.connected = true;
        resolve();
      };

      connectOpts.onException = (exceptionName: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(`MSFS SimConnect 错误：${exceptionName}`));
      };

      api.connect(connectOpts).catch((err: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });

    // 连接成功后立即拉取一次数据，避免用户等 1 秒才看到状态
    let firstSample = true;
    this.off = api.schedule(async (data: Record<string, number | string>) => {
      this.connected = true;
      const sample: AdapterSample = {
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
      };
      this.handler(sample);
      if (firstSample) {
        firstSample = false;
      }
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
    try {
      if (this.off) {
        this.off();
        this.off = undefined;
      }
      if (this.api?.handle) {
        this.api.handle.close();
      }
    } catch {
      // ignore cleanup errors
    }
  }

  isConnected() {
    return this.connected;
  }

  setUpdateHandler(handler: (sample: AdapterSample) => void) {
    this.handler = handler;
  }
}
