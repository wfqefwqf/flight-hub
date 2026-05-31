import type { FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';
import { StatPill } from '../components/ui/StatPill';
import { formatDateTime } from '../lib/format';

export function DashboardPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const { dashboard, tracking, currentSession } = snapshot;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">运行总览</h1>
        <p className="mt-2 text-sm text-slate-400">只展示当前已经落到真实数据库的会话与 PIREP 聚合结果。</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <StatPill label="今日航班" value={dashboard.todayFlights} />
        <StatPill label="累计小时" value={dashboard.totalHours.toFixed(1)} />
        <StatPill label="当前阶段" value={tracking.phase} />
        <StatPill label="活动会话" value={currentSession ? currentSession.callsign : '无'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard title="当前会话状态">
          {currentSession ? (
            <div className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4">呼号：{currentSession.callsign}</div>
              <div className="rounded-2xl bg-white/5 p-4">机型：{currentSession.aircraftType}</div>
              <div className="rounded-2xl bg-white/5 p-4">开始时间：{formatDateTime(currentSession.startedAt)}</div>
              <div className="rounded-2xl bg-white/5 p-4">当前阶段：{currentSession.lastPhase}</div>
              <div className="rounded-2xl bg-white/5 p-4">最大高度：{currentSession.maxAltitudeFt.toFixed(0)} ft</div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">当前没有活动 flight session。</div>
          )}
        </GlassCard>

        <GlassCard title="最近 PIREP">
          {dashboard.recentPireps.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentPireps.map((pirep) => (
                <div key={pirep.id} className="rounded-2xl bg-white/5 p-4">
                  <div className="font-medium">{pirep.flightNumber}</div>
                  <div className="mt-1 text-sm text-slate-400">{pirep.departure} → {pirep.arrival}</div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                    <span>{pirep.blockTimeMinutes} min</span>
                    <span>{pirep.landingRateFpm} fpm</span>
                    <span>{pirep.fuelUsedKg} kg</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">暂无真实 PIREP 记录。</div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
