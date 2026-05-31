import type { FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

export function AvailabilityPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">当前可用能力</h1>
        <p className="mt-2 text-sm text-slate-400">为确保项目真实可用，当前版本仅保留已经接通的功能，其余模块将在完成真实数据链路后重新开放。</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard title="已开放功能">
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="rounded-2xl bg-white/5 p-4">航班追踪：支持 MSFS SimConnect 采样，支持 X-Plane UDP Data Output 监听，并开始记录真实 flight session。</li>
            <li className="rounded-2xl bg-white/5 p-4">客舱语音：支持本地 WAV/MP3 媒体文件播放。</li>
            <li className="rounded-2xl bg-white/5 p-4">运行状态：可查看连接状态、航迹、飞行阶段、当前会话与最近自动生成的 PIREP 基础数据。</li>
          </ul>
        </GlassCard>

        <GlassCard title="暂未开放功能">
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="rounded-2xl bg-white/5 p-4">签派 / 成员 / 机队 / 完整仪表盘 仍待结构化表与 CRUD 完成后重新开放。</li>
            <li className="rounded-2xl bg-white/5 p-4">TTS、自动广播、SimBrief 导入当前未接通，不再展示为已可用。</li>
            <li className="rounded-2xl bg-white/5 p-4">当前连接状态：{snapshot.tracking.status} / {snapshot.tracking.statusMessage}</li>
            <li className="rounded-2xl bg-white/5 p-4">当前活动会话：{snapshot.currentSession ? `${snapshot.currentSession.callsign} / ${snapshot.currentSession.aircraftType} / ${snapshot.currentSession.lastPhase}` : '无活动会话'}</li>
            <li className="rounded-2xl bg-white/5 p-4">最近 PIREP 数量：{snapshot.pireps.length}</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
