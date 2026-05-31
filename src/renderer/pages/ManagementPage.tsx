import { useState } from 'react';
import type { FleetAircraft, FlightHubSnapshot, Member } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

function createMember(): Member {
  return {
    id: crypto.randomUUID(),
    name: '',
    rank: '',
    hours: 0
  };
}

function createAircraft(): FleetAircraft {
  return {
    id: crypto.randomUUID(),
    registration: '',
    type: '',
    hours: 0,
    status: 'active'
  };
}

export function ManagementPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const [memberForm, setMemberForm] = useState<Member>(createMember());
  const [fleetForm, setFleetForm] = useState<FleetAircraft>(createAircraft());
  const [message, setMessage] = useState('');

  const saveMember = async () => {
    try {
      await window.flightHub.saveMember(memberForm);
      setMemberForm(createMember());
      setMessage('成员已保存。刷新页面即可看到最新排序。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存成员失败');
    }
  };

  const removeMember = async (id: string) => {
    try {
      await window.flightHub.removeMember(id);
      setMessage('成员已删除。刷新页面即可看到最新列表。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除成员失败');
    }
  };

  const saveFleet = async () => {
    try {
      await window.flightHub.saveFleetAircraft(fleetForm);
      setFleetForm(createAircraft());
      setMessage('机队记录已保存。刷新页面即可看到最新列表。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存机队失败');
    }
  };

  const removeFleet = async (id: string) => {
    try {
      await window.flightHub.removeFleetAircraft(id);
      setMessage('机队记录已删除。刷新页面即可看到最新列表。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除机队失败');
    }
  };

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">{message}</div> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard title="成员管理">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">姓名</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={memberForm.name} onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">级别</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={memberForm.rank} onChange={(e) => setMemberForm((prev) => ({ ...prev, rank: e.target.value }))} />
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="text-slate-400">累计小时</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="number" value={memberForm.hours} onChange={(e) => setMemberForm((prev) => ({ ...prev, hours: Number(e.target.value) }))} />
            </label>
          </div>
          <button className="mt-4 rounded-2xl bg-sky-400/20 px-4 py-3 text-sm text-sky-200" onClick={saveMember}>保存成员</button>
          <div className="mt-5 space-y-3">
            {snapshot.members.length > 0 ? snapshot.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-slate-400">{member.rank}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">{member.hours.toFixed(1)} h</div>
                    <div className="text-xs text-slate-400">总小时</div>
                  </div>
                  <button className="rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-200" onClick={() => removeMember(member.id)}>删除</button>
                </div>
              </div>
            )) : <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">还没有成员记录。</div>}
          </div>
        </GlassCard>

        <GlassCard title="机队管理">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">注册号</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={fleetForm.registration} onChange={(e) => setFleetForm((prev) => ({ ...prev, registration: e.target.value }))} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">机型</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={fleetForm.type} onChange={(e) => setFleetForm((prev) => ({ ...prev, type: e.target.value }))} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">累计小时</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="number" value={fleetForm.hours} onChange={(e) => setFleetForm((prev) => ({ ...prev, hours: Number(e.target.value) }))} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-400">状态</span>
              <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={fleetForm.status} onChange={(e) => setFleetForm((prev) => ({ ...prev, status: e.target.value as FleetAircraft['status'] }))}>
                <option value="active">active</option>
                <option value="maintenance">maintenance</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-2xl bg-sky-400/20 px-4 py-3 text-sm text-sky-200" onClick={saveFleet}>保存机队</button>
          <div className="mt-5 space-y-3">
            {snapshot.fleet.length > 0 ? snapshot.fleet.map((aircraft) => (
              <div key={aircraft.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                <div>
                  <div className="font-medium">{aircraft.registration}</div>
                  <div className="text-sm text-slate-400">{aircraft.type}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">{aircraft.hours.toFixed(1)} h</div>
                    <div className={`text-xs ${aircraft.status === 'active' ? 'text-emerald-300' : 'text-amber-300'}`}>{aircraft.status}</div>
                  </div>
                  <button className="rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-200" onClick={() => removeFleet(aircraft.id)}>删除</button>
                </div>
              </div>
            )) : <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">还没有机队记录。</div>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
