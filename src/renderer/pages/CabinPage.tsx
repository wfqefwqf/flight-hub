import { useState } from 'react';
import { Alert, Box, Button, Chip, Grid2 as Grid, Stack, Typography } from '@mui/material';
import type { CabinAnnouncement, FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

export function CabinPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const [message, setMessage] = useState<string>('');

  const play = async (announcement: CabinAnnouncement) => {
    try {
      const result = await window.flightHub.playAnnouncement(announcement);
      setMessage(result.message + (result.mediaDirectory ? ` Media dir: ${result.mediaDirectory}` : ''));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '播放失败');
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>客舱语音</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          当前保留真实可用能力：本地 WAV/MP3 媒体文件播放。
        </Typography>
      </Box>
      {message ? <Alert severity="info">{message}</Alert> : null}

      <Grid container spacing={3}>
        {snapshot.announcements.map((announcement) => (
          <Grid key={announcement.id} size={{ xs: 12, xl: 6 }}>
            <GlassCard title={announcement.title} extra={<Typography variant="caption" color="text.secondary">{announcement.phase}</Typography>}>
              <Stack spacing={2}>
                <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography variant="body2" color="text.secondary">广播内容</Typography>
                  <Typography sx={{ mt: 1 }}>{announcement.text}</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`语言：${announcement.language}`} variant="outlined" />
                  <Chip label={`模式：${announcement.mode}`} variant="outlined" />
                  <Chip label={announcement.autoPlay ? '自动播放已启用' : '自动播放未启用'} variant="outlined" />
                  {announcement.mediaFile ? <Chip label={`媒体：${announcement.mediaFile}`} variant="outlined" /> : null}
                </Stack>
                <Button onClick={() => play(announcement)}>{announcement.mode === 'wav' ? '播放媒体文件' : 'TTS 未接入'}</Button>
              </Stack>
            </GlassCard>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
