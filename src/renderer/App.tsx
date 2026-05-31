import { useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import FlightIcon from '@mui/icons-material/Flight';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupsIcon from '@mui/icons-material/Groups';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  Stack
} from '@mui/material';
import { useAppStore } from './store/useAppStore';
import { TrackingPage } from './pages/TrackingPage';
import { CabinPage } from './pages/CabinPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { PirepPage } from './pages/PirepPage';
import { DashboardPage } from './pages/DashboardPage';
import { DispatchPage } from './pages/DispatchPage';
import { ManagementPage } from './pages/ManagementPage';

const drawerWidth = 280;

const navItems = [
  { to: '/', label: '总览', icon: <FlightIcon /> },
  { to: '/tracking', label: '航班追踪', icon: <GraphicEqIcon /> },
  { to: '/dispatch', label: '签派', icon: <DescriptionIcon /> },
  { to: '/pirep', label: 'PIREP', icon: <DescriptionIcon /> },
  { to: '/management', label: '成员 / 机队', icon: <GroupsIcon /> },
  { to: '/cabin', label: '客舱语音', icon: <AirlineSeatReclineNormalIcon /> }
];

export default function App() {
  const { snapshot, loading, error, setSnapshot, setError, patchTracking } = useAppStore();

  useEffect(() => {
    if (!window.flightHub) return;

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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" color="transparent" elevation={0} sx={{ height: 16, backdropFilter: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'background.default', ml: `${drawerWidth}px`, width: `calc(100% - ${drawerWidth}px)` }} />

      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid rgba(255,255,255,0.08)', bgcolor: 'background.paper', pt: 2 } }}>
        <List sx={{ px: 1.5 }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} style={{ textDecoration: 'none', color: 'inherit' }}>
              {({ isActive }) => (
                <ListItemButton sx={{ mb: 1, borderRadius: 4, bgcolor: isActive ? 'rgba(127,207,255,0.16)' : 'transparent' }}>
                  <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }} />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 2, minWidth: 0 }}>
        {loading || !snapshot ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'text.secondary' }}>
            {error ? `加载失败：${error}` : window.flightHub ? 'Loading Flight Hub...' : '请通过 Electron 启动本应用，浏览器直开仅用于前端调试。'}
          </Box>
        ) : (
          <Routes>
            <Route path="/" element={<DashboardPage snapshot={snapshot} />} />
            <Route path="/tracking" element={<TrackingPage snapshot={snapshot} />} />
            <Route path="/dispatch" element={<DispatchPage snapshot={snapshot} />} />
            <Route path="/pirep" element={<PirepPage snapshot={snapshot} />} />
            <Route path="/management" element={<ManagementPage snapshot={snapshot} />} />
            <Route path="/cabin" element={<CabinPage snapshot={snapshot} />} />
            <Route path="/availability" element={<AvailabilityPage snapshot={snapshot} />} />
          </Routes>
        )}
      </Box>
    </Box>
  );
}
