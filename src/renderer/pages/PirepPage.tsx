import type { FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';
import { formatDateTime } from '../lib/format';

export function PirepPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const session = snapshot.currentSession;
  const latestPirep = snapshot.pireps[0] ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <GlassCard title="当前飞行会话">
        {session ? (
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-slate-400">呼号 / 机型</div>
              <div className="mt-1 text-lg font-semibold">{session.callsign} / {session.aircraftType}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">开始时间</div>
                <div className="mt-1 font-medium">{formatDateTime(session.startedAt)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">当前阶段</div>
                <div className="mt-1 font-medium">{session.lastPhase}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">推出</div>
                <div className="mt-1 font-medium">{formatDateTime(session.blockOffAt)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">起飞</div>
                <div className="mt-1 font-medium">{formatDateTime(session.takeoffAt)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">落地</div>
                <div className="mt-1 font-medium">{formatDateTime(session.landingAt)}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">最大高度</div>
                <div className="mt-1 font-medium">{session.maxAltitudeFt.toFixed(0)} ft</div>
              </div>
            </div>
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sky-100">
              当前版本会在会话进入 parked 且已完成起飞/落地后，自动生成基础 PIREP 记录。
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">当前没有活动飞行会话。请先连接模拟器并开始滑行/飞行。</div>
        )}
      </GlassCard>

      <GlassCard title="最近自动生成的 PIREP">
        {latestPirep ? (
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-slate-400">航班号</div>
              <div className="mt-1 text-lg font-semibold">{latestPirep.flightNumber}</div>
              <div className="mt-2">{latestPirep.departure} → {latestPirep.arrival}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">飞行时间</div>
                <div className="mt-1 font-medium">{latestPirep.blockTimeMinutes} min</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">燃油消耗</div>
                <div className="mt-1 font-medium">{latestPirep.fuelUsedKg} kg</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-slate-400">着陆率</div>
                <div className="mt-1 font-medium">{latestPirep.landingRateFpm} fpm</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 text-slate-400">提交时间：{formatDateTime(latestPirep.submittedAt)}</div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">还没有自动生成的 PIREP。完成一次完整起飞、落地并进入停靠阶段后会在这里显示。</div>
        )}
      </GlassCard>
    </div>
  );
}
