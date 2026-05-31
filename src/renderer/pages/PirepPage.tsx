import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material';
import type { FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';
import { StatPill } from '../components/ui/StatPill';
import { formatDateTime } from '../lib/format';

export function PirepPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const session = snapshot.currentSession;
  const latestPirep = snapshot.pireps[0] ?? null;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, xl: 6 }}>
        <GlassCard title="当前飞行会话">
          {session ? (
            <Stack spacing={2}>
              <StatPill label="呼号 / 机型" value={`${session.callsign} / ${session.aircraftType}`} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><StatPill label="开始时间" value={formatDateTime(session.startedAt)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><StatPill label="当前阶段" value={session.lastPhase} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><StatPill label="推出" value={formatDateTime(session.blockOffAt)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><StatPill label="起飞" value={formatDateTime(session.takeoffAt)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><StatPill label="落地" value={formatDateTime(session.landingAt)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><StatPill label="最大高度" value={`${session.maxAltitudeFt.toFixed(0)} ft`} /></Grid>
              </Grid>
              <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'rgba(127,207,255,0.12)', color: 'primary.light', border: '1px solid rgba(127,207,255,0.24)' }}>
                当前版本会在会话进入 parked 且已完成起飞/落地后，自动生成基础 PIREP 记录。
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">当前没有活动飞行会话。请先连接模拟器并开始滑行/飞行。</Typography>
          )}
        </GlassCard>
      </Grid>

      <Grid size={{ xs: 12, xl: 6 }}>
        <GlassCard title="最近自动生成的 PIREP">
          {latestPirep ? (
            <Stack spacing={2}>
              <StatPill label="航班" value={`${latestPirep.flightNumber} · ${latestPirep.departure} → ${latestPirep.arrival}`} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}><StatPill label="飞行时间" value={`${latestPirep.blockTimeMinutes} min`} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><StatPill label="燃油消耗" value={`${latestPirep.fuelUsedKg} kg`} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><StatPill label="着陆率" value={`${latestPirep.landingRateFpm} fpm`} /></Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary">提交时间：{formatDateTime(latestPirep.submittedAt)}</Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">还没有自动生成的 PIREP。完成一次完整起飞、落地并进入停靠阶段后会在这里显示。</Typography>
          )}
        </GlassCard>
      </Grid>
    </Grid>
  );
}
