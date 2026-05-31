import { ReactNode } from 'react';

export function GlassCard({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-slate-900/55 p-5 shadow-glass backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
