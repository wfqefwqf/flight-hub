import { useEffect, useMemo, useState } from 'react';
import type { DispatchFlight, FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

function createEmptyDispatch(): DispatchFlight {
  return {
    id: crypto.randomUUID(),
    flightNumber: '',
    departure: '',
    arrival: '',
    alternate: '',
    route: '',
    payloadKg: 0,
    fuelKg: 0,
    source: 'manual',
    status: 'draft',
    createdAt: new Date().toISOString()
  };
}

export function DispatchPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const latest = useMemo(() => snapshot.dispatches[0] ?? createEmptyDispatch(), [snapshot.dispatches]);
  const [form, setForm] = useState<DispatchFlight>(latest);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm(latest);
  }, [latest]);

  const update = <K extends keyof DispatchFlight>(key: K, value: DispatchFlight[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const importSimBrief = async () => {
    const draft = await window.flightHub.importSimBrief({
      flightNumber: form.flightNumber,
      departure: form.departure,
      arrival: form.arrival,
      alternate: form.alternate,
      route: form.route,
      payloadKg: form.payloadKg,
      fuelKg: form.fuelKg
    });
    setForm(draft);
    setMessage('已创建 SimBrief 来源的签派草稿。');
  };

  const save = async () => {
    const saved = await window.flightHub.saveDispatch(form);
    setForm(saved);
    setMessage('签派已保存。');
  };

  const exportJson = async () => {
    const output = await window.flightHub.exportDispatch(form.id);
    setMessage(output ? `已导出到：${output}` : '已取消导出。');
  };

  const newDraft = () => {
    setForm(createEmptyDispatch());
    setMessage('已创建新的本地草稿，保存后会进入真实数据库。');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <GlassCard title="现有签派">
        <div className="space-y-3">
          <button className="w-full rounded-2xl bg-sky-400/20 px-4 py-3 text-sm text-sky-200" onClick={newDraft}>新建签派草稿</button>
          {snapshot.dispatches.length > 0 ? (
            snapshot.dispatches.map((dispatch) => (
              <button
                key={dispatch.id}
                className="flex w-full items-center justify-between rounded-2xl bg-white/5 p-4 text-left hover:bg-white/10"
                onClick={() => setForm(dispatch)}
              >
                <div>
                  <div className="font-medium">{dispatch.flightNumber || '未命名航班'}</div>
                  <div className="text-sm text-slate-400">{dispatch.departure || '----'} → {dispatch.arrival || '----'}</div>
                </div>
                <div className="text-xs text-slate-400">{dispatch.status}</div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">当前还没有真实签派记录。请新建或导入一份草稿。</div>
          )}
        </div>
      </GlassCard>

      <GlassCard title="签派编辑器" extra={message ? <span className="text-xs text-sky-300">{message}</span> : undefined}>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['flightNumber', '航班号'],
            ['departure', '起飞机场'],
            ['arrival', '目的机场'],
            ['alternate', '备降机场']
          ].map(([key, label]) => (
            <label key={key} className="space-y-2 text-sm">
              <span className="text-slate-400">{label}</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                value={(form as any)[key] ?? ''}
                onChange={(e) => update(key as keyof DispatchFlight, e.target.value as any)}
              />
            </label>
          ))}
          <label className="space-y-2 text-sm md:col-span-2">
            <span className="text-slate-400">航路</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              value={form.route}
              onChange={(e) => update('route', e.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-400">业载 kg</span>
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" type="number" value={form.payloadKg} onChange={(e) => update('payloadKg', Number(e.target.value))} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-400">燃油 kg</span>
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" type="number" value={form.fuelKg} onChange={(e) => update('fuelKg', Number(e.target.value))} />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-sky-400/20 px-4 py-3 text-sm text-sky-200" onClick={importSimBrief}>导入 SimBrief 草稿</button>
          <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm" onClick={save}>保存签派</button>
          <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm" onClick={exportJson}>导出 dispatch.json</button>
        </div>
      </GlassCard>
    </div>
  );
}
