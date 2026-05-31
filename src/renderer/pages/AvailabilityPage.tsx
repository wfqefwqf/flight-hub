import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material';
import type { FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

export function AvailabilityPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>当前可用能力</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          当前页面已改为 Material Design 3 视觉风格，只保留真实接通的能力说明。
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard title="已开放功能">
            <Stack spacing={2}>
              {[
                '航班追踪：支持 MSFS SimConnect 采样，支持 X-Plane UDP Data Output 监听，并记录真实 flight session。',
                '签派：支持手动创建、保存、导出，并支持通过 SimBrief 参数导入。',
                'PIREP：支持真实 session 结束后自动生成基础 PIREP。',
                '成员 / 机队：支持真实 CRUD，并可在会话完成后自动累计小时。',
                '客舱语音：支持本地 WAV/MP3 媒体文件播放。'
              ].map((item) => (
                <Box key={item} sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography>{item}</Typography>
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard title="当前状态">
            <Stack spacing={2}>
              <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography>连接状态：{snapshot.tracking.status} / {snapshot.tracking.statusMessage}</Typography>
              </Box>
              <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography>当前活动会话：{snapshot.currentSession ? `${snapshot.currentSession.callsign} / ${snapshot.currentSession.aircraftType} / ${snapshot.currentSession.lastPhase}` : '无活动会话'}</Typography>
              </Box>
              <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography>最近 PIREP 数量：{snapshot.pireps.length}</Typography>
              </Box>
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
