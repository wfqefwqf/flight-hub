import { useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import type { FlightHubSnapshot, SimConnectionConfig, SimSource } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';
import { StatPill } from '../components/ui/StatPill';

export function TrackingPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const { tracking } = snapshot;
  const [config, setConfig] = useState<SimConnectionConfig>(tracking.config);

  const center = useMemo(() => {
    const position = tracking.position;
    return position ? ([position.lat, position.lon] as [number, number]) : ([31.2304, 121.4737] as [number, number]);
  }, [tracking.position]);

  const changeSource = async (source: SimSource) => {
    await window.flightHub.setSimSource(source);
  };

  const patch = <K extends keyof SimConnectionConfig>(key: K, value: SimConnectionConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    await window.flightHub.updateSimConfig(config);
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">航班追踪</h1>
          <p className="mt-2 text-sm text-slate-400">MSFS 已接入 SimConnect 采样；X-Plane 当前使用本地 UDP 数据输出，需要你在模拟器内开启对应数据发送。</p>
        </div>
        <div className="flex gap-2 rounded-2xl bg-white/5 p-1">
          {(['MSFS', 'XPLANE', 'MOCK'] as SimSource[]).map((source) => (
            <button
              key={source}
              className={`rounded-xl px-4 py-2 text-sm ${tracking.source === source ? 'bg-sky-400/20 text-sky-200' : 'text-slate-300'}`}
              onClick={() => changeSource(source)}
            >
              {source}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <StatPill label="呼号" value={tracking.callsign} />
        <StatPill label="机型" value={tracking.aircraftType} />
        <StatPill label="高度" value={`${tracking.position?.altitude ?? 0} ft`} />
        <StatPill label="地速" value={`${tracking.position?.groundspeed ?? 0} kt`} />
        <StatPill label="阶段" value={tracking.phase} />
        <StatPill label="连接状态" value={tracking.status} />
        <StatPill label="活动会话" value={snapshot.currentSession ? '进行中' : '无'} />
        <StatPill label="最近 PIREP" value={snapshot.pireps[0]?.flightNumber ?? '无'} />
      </div>

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <GlassCard title="连接配置" extra={<span className="text-xs text-slate-400">{tracking.statusMessage}</span>}>
          <div className="space-y-4">
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">MSFS Host</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={config.msfsHost} onChange={(e) => patch('msfsHost', e.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">MSFS Port</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="number" value={config.msfsPort} onChange={(e) => patch('msfsPort', Number(e.target.value))} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">X-Plane UDP 接收端口</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="number" value={config.xplaneLocalPort} onChange={(e) => patch('xplaneLocalPort', Number(e.target.value))} />
            </label>
            <p className="text-xs leading-6 text-slate-500">提示：当前 X-Plane 方案依赖模拟器主动向本机端口发送 UDP Data Output。</p>
            <div className="flex flex-col gap-3 pt-2">
              <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm" onClick={saveConfig}>保存连接配置</button>
              <button className="rounded-2xl bg-sky-400/20 px-4 py-3 text-sm text-sky-200" onClick={() => changeSource(tracking.source)}>重新连接当前源</button>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="地图轨迹" extra={<span className="text-xs text-slate-400">实时更新</span>}>
          <div className="overflow-hidden rounded-[24px] border border-white/10">
            <MapContainer center={center} zoom={6} style={{ height: 560, width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <Polyline positions={tracking.track.map((point) => [point.lat, point.lon] as [number, number])} pathOptions={{ color: '#7dd3fc', weight: 4 }} />
              {tracking.position && <Marker position={[tracking.position.lat, tracking.position.lon]} />}
            </MapContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
