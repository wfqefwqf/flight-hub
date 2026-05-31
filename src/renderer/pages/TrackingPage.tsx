import { useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import { Box, Button, Chip, Grid2 as Grid, Stack, TextField, Typography } from '@mui/material';
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
    <Stack spacing={3} sx={{ minHeight: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>航班追踪</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            当前使用 Material Design 3 布局展示 MSFS / X-Plane 实时飞行数据与轨迹。
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(['MSFS', 'XPLANE', 'MOCK'] as SimSource[]).map((source) => (
            <Chip
              key={source}
              label={source}
              color={tracking.source === source ? 'primary' : 'default'}
              variant={tracking.source === source ? 'filled' : 'outlined'}
              onClick={() => changeSource(source)}
            />
          ))}
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="呼号" value={tracking.callsign} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="机型" value={tracking.aircraftType} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="高度" value={`${tracking.position?.altitude ?? 0} ft`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="地速" value={`${tracking.position?.groundspeed ?? 0} kt`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="阶段" value={tracking.phase} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="连接状态" value={tracking.status} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="活动会话" value={snapshot.currentSession ? '进行中' : '无'} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="最近 PIREP" value={snapshot.pireps[0]?.flightNumber ?? '无'} /></Grid>
      </Grid>

      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <GlassCard title="连接配置" extra={<Typography variant="caption" color="text.secondary">{tracking.statusMessage}</Typography>}>
            <Stack spacing={2}>
              <TextField label="MSFS Host" value={config.msfsHost} onChange={(e) => patch('msfsHost', e.target.value)} fullWidth />
              <TextField label="MSFS Port" type="number" value={config.msfsPort} onChange={(e) => patch('msfsPort', Number(e.target.value))} fullWidth />
              <TextField label="X-Plane UDP 接收端口" type="number" value={config.xplaneLocalPort} onChange={(e) => patch('xplaneLocalPort', Number(e.target.value))} fullWidth />
              <Typography variant="body2" color="text.secondary">当前 X-Plane 方案依赖模拟器主动发送 UDP Data Output。</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button onClick={saveConfig}>保存连接配置</Button>
                <Button variant="outlined" onClick={() => changeSource(tracking.source)}>重新连接当前源</Button>
              </Stack>
            </Stack>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 8 }}>
          <GlassCard title="地图轨迹" extra={<Typography variant="caption" color="text.secondary">实时更新</Typography>}>
            <Box sx={{ overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
              <MapContainer center={center} zoom={6} style={{ height: 560, width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <Polyline positions={tracking.track.map((point) => [point.lat, point.lon] as [number, number])} pathOptions={{ color: '#7fcfff', weight: 4 }} />
                {tracking.position && <Marker position={[tracking.position.lat, tracking.position.lon]} />}
              </MapContainer>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
