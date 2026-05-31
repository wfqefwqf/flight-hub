import { useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { Plane, Radio, ScrollText, Volume2 } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { TrackingPage } from './pages/TrackingPage';
import { CabinPage } from './pages/CabinPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { PirepPage } from './pages/PirepPage';
import { DashboardPage } from './pages/DashboardPage';
import { DispatchPage } from './pages/DispatchPage';

const navItems = [
  { to: '/', label: '总览', icon: Plane },
  { to: '/tracking', label: '航班追踪', icon: Radio },
  { to: '/dispatch', label: '签派', icon: ScrollText },
  { to: '/pirep', label: 'PIREP', icon: ScrollText },
  { to: '/cabin', label: '客舱语音', icon: Volume2 }
];

export default function App() {
  const { snapshot, loading, error, setSnapshot, setError, patchTracking } = useAppStore();

  useEffect(() => {
    if (!window.flightHub) {
      return;
    }

    let mounted = true;

    window.flightHub
      .getSnapshot()
      .then((data) => {
        if (mounted) setSnapshot(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load snapshot');
      });

    const unsubscribe = window.flightHub.onTrackingUpdated((tracking) => patchTracking(tracking));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setSnapshot, setError, patchTracking]);

  return (
    <div className="flex h-screen gap-6 overflow-hidden p-6 text-slate-100">
      <aside className="flex w-64 shrink-0 flex-col rounded-[28px] border border-white/8 bg-slate-950/70 p-5 shadow-glass backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/20 text-sky-300">
            <Plane size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Flight Hub</h1>
            <p className="text-xs text-slate-400">Flight Operations Companion</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  isActive ? 'bg-white/12 text-white' : 'text-slate-300 hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto rounded-[32px] border border-white/8 bg-slate-900/45 p-6 shadow-glass backdrop-blur-xl">
        {loading || !snapshot ? (
          <div className="flex h-full min-h-[60vh] items-center justify-center text-slate-400">
            {error
              ? `加载失败：${error}`
              : window.flightHub
                ? 'Loading Flight Hub...'
                : '请通过 Electron 启动本应用，浏览器直开仅用于前端调试。'}
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<DashboardPage snapshot={snapshot} />} />
            <Route path="/tracking" element={<TrackingPage snapshot={snapshot} />} />
            <Route path="/dispatch" element={<DispatchPage snapshot={snapshot} />} />
            <Route path="/pirep" element={<PirepPage snapshot={snapshot} />} />
            <Route path="/cabin" element={<CabinPage snapshot={snapshot} />} />
            <Route path="/availability" element={<AvailabilityPage snapshot={snapshot} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
