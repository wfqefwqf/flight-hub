import { useState } from 'react';
import { Box, Button, Chip, Grid2 as Grid, Stack, TextField, Typography } from '@mui/material';
import type { FlightHubSnapshot, SimConnectionConfig, SimSource } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';
import { StatPill } from '../components/ui/StatPill';
import { FlightMap } from '../components/ui/FlightMap';

export function TrackingPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const { tracking } = snapshot;
  const [config, setConfig] = useState<SimConnectionConfig>(tracking.config);

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
        </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Typography variant="body2" color="text.secondary">数据源</Typography>
            <Stack direction="row" spacing={1}>
              {(['MSFS', 'XPLANE'] as SimSource[]).map((source) => (
                <Chip
                  key={source}
                  label={source === 'MSFS' ? 'Microsoft Flight Simulator' : 'X-Plane'}
                  color={tracking.source === source ? 'primary' : 'default'}
                  variant={tracking.source === source ? 'filled' : 'outlined'}
                  onClick={() => changeSource(source)}
                />
              ))}
            </Stack>
          </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="呼号" value={tracking.callsign} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="机型" value={tracking.aircraftType} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="高度" value={`${Math.round(tracking.position?.altitude ?? 0)} ft`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="地速" value={`${Math.round(tracking.position?.groundspeed ?? 0)} kt`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="阶段" value={tracking.phase} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="连接状态" value={tracking.connected ? '已连接' : tracking.status === 'connecting' ? '连接中' : tracking.status === 'error' ? '连接失败' : '未连接'} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="活动会话" value={snapshot.currentSession ? '进行中' : '无'} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="最近 PIREP" value={snapshot.pireps[0]?.flightNumber ?? '无'} /></Grid>
      </Grid>

      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <GlassCard title="连接配置" extra={<Typography variant="caption" color="text.secondary">{tracking.statusMessage}</Typography>}>
            <Stack spacing={2}>
              {tracking.source === 'MSFS' ? (
                <>
                  <TextField label="MSFS Host（留空使用本地命名管道）" value={config.msfsHost} onChange={(e) => patch('msfsHost', e.target.value)} fullWidth />
                  <TextField label="MSFS Port" type="number" value={config.msfsPort} onChange={(e) => patch('msfsPort', Number(e.target.value))} fullWidth disabled={!config.msfsHost || config.msfsHost.trim() === '' || config.msfsHost.trim() === '127.0.0.1' || config.msfsHost.trim().toLowerCase() === 'localhost'} />
                  <Typography variant="body2" color="text.secondary">
                    {(!config.msfsHost || config.msfsHost.trim() === '' || config.msfsHost.trim() === '127.0.0.1' || config.msfsHost.trim().toLowerCase() === 'localhost')
                      ? '当前使用本地命名管道连接（推荐）。请确认 MSFS 已启动。只有需要远程连接时才填写 Host。'
                      : '当前使用 TCP 连接。请确认 MSFS 的 SimConnect.xml 中已开启对应端口。'}
                  </Typography>
                </>
              ) : (
                <>
                  <TextField label="X-Plane Host" value={config.xplaneHost} onChange={(e) => patch('xplaneHost', e.target.value)} fullWidth />
                  <TextField label="X-Plane UDP 接收端口" type="number" value={config.xplaneLocalPort} onChange={(e) => patch('xplaneLocalPort', Number(e.target.value))} fullWidth />
                  <Typography variant="body2" color="text.secondary">
                    Flight Hub 会自动通过 X-Plane Beacon 发现模拟器位置，并使用临时端口通信，无需手动配置端口。
                    <br />
                    如果 Beacon 发现失败，会回退到手动配置的 Host。XP12 用户需确认 Settings → Network 中已开启 "Accept incoming connections"。
                  </Typography>
                </>
              )}
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
              <FlightMap tracking={tracking} />
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
