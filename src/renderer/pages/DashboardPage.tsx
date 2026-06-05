import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material';
import type { FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';
import { StatPill } from '../components/ui/StatPill';
import { formatDateTime } from '../lib/format';

export function DashboardPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const { dashboard, tracking, currentSession } = snapshot;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>运行总览</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="今日航班" value={dashboard.todayFlights} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="累计小时" value={dashboard.totalHours.toFixed(1)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="当前阶段" value={tracking.phase} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatPill label="活动会话" value={currentSession ? currentSession.callsign : '无'} /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <GlassCard title="当前会话状态">
            {currentSession ? (
              <Stack spacing={2}>
                <StatPill label="呼号" value={currentSession.callsign} />
                <StatPill label="机型" value={currentSession.aircraftType} />
                <StatPill label="开始时间" value={formatDateTime(currentSession.startedAt)} />
                <StatPill label="当前阶段" value={currentSession.lastPhase} />
                <StatPill label="最大高度" value={`${currentSession.maxAltitudeFt.toFixed(0)} ft`} />
              </Stack>
            ) : (
              <Typography color="text.secondary">当前没有活动 flight session。</Typography>
            )}
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <GlassCard title="最近 PIREP">
            {dashboard.recentPireps.length > 0 ? (
              <Stack spacing={2}>
                {dashboard.recentPireps.map((pirep) => (
                  <Box key={pirep.id} sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography fontWeight={700}>{pirep.flightNumber}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{pirep.departure} → {pirep.arrival}</Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                      <Typography variant="body2">{pirep.blockTimeMinutes} min</Typography>
                      <Typography variant="body2">{pirep.landingRateFpm} fpm</Typography>
                      <Typography variant="body2">{pirep.fuelUsedKg} kg</Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">暂无真实 PIREP 记录。</Typography>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard title="成员排行">
        {dashboard.memberRanking.length > 0 ? (
          <Stack spacing={2}>
            {dashboard.memberRanking.map((member, index) => (
              <Box key={member.id} sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">#{index + 1}</Typography>
                  <Typography fontWeight={700}>{member.name}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">{member.rank}</Typography>
                  <Typography fontWeight={700}>{member.hours.toFixed(1)} h</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">暂无成员排行数据。</Typography>
        )}
      </GlassCard>
    </Stack>
  );
}
