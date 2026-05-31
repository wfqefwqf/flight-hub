import type { FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

export function ManagementPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <GlassCard title="成员管理">
        <div className="space-y-3">
          {snapshot.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-slate-400">{member.rank}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{member.hours.toFixed(1)} h</div>
                <div className="text-sm text-slate-400">总小时</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="机队管理">
        <div className="space-y-3">
          {snapshot.fleet.map((aircraft) => (
            <div key={aircraft.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
              <div>
                <div className="font-medium">{aircraft.registration}</div>
                <div className="text-sm text-slate-400">{aircraft.type}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{aircraft.hours.toFixed(0)} h</div>
                <div className={`text-sm ${aircraft.status === 'active' ? 'text-emerald-300' : 'text-amber-300'}`}>{aircraft.status}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
