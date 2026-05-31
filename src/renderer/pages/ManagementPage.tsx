import { useState } from 'react';
import { Alert, Box, Button, Grid2 as Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import type { FleetAircraft, FlightHubSnapshot, Member } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

function createMember(): Member {
  return { id: crypto.randomUUID(), name: '', rank: '', hours: 0 };
}

function createAircraft(): FleetAircraft {
  return { id: crypto.randomUUID(), registration: '', type: '', hours: 0, status: 'active' };
}

export function ManagementPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const [memberForm, setMemberForm] = useState<Member>(createMember());
  const [fleetForm, setFleetForm] = useState<FleetAircraft>(createAircraft());
  const [message, setMessage] = useState('');

  const saveMember = async () => {
    try {
      await window.flightHub.saveMember(memberForm);
      setMemberForm(createMember());
      setMessage('成员已保存。刷新页面即可看到最新排序。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存成员失败');
    }
  };

  const removeMember = async (id: string) => {
    try {
      await window.flightHub.removeMember(id);
      setMessage('成员已删除。刷新页面即可看到最新列表。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除成员失败');
    }
  };

  const saveFleet = async () => {
    try {
      await window.flightHub.saveFleetAircraft(fleetForm);
      setFleetForm(createAircraft());
      setMessage('机队记录已保存。刷新页面即可看到最新列表。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存机队失败');
    }
  };

  const removeFleet = async (id: string) => {
    try {
      await window.flightHub.removeFleetAircraft(id);
      setMessage('机队记录已删除。刷新页面即可看到最新列表。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除机队失败');
    }
  };

  return (
    <Stack spacing={3}>
      {message ? <Alert severity="info">{message}</Alert> : null}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard title="成员管理">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="姓名" fullWidth value={memberForm.name} onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="级别" fullWidth value={memberForm.rank} onChange={(e) => setMemberForm((prev) => ({ ...prev, rank: e.target.value }))} /></Grid>
              <Grid size={{ xs: 12 }}><TextField label="累计小时" fullWidth type="number" value={memberForm.hours} onChange={(e) => setMemberForm((prev) => ({ ...prev, hours: Number(e.target.value) }))} /></Grid>
            </Grid>
            <Button sx={{ mt: 2.5 }} onClick={saveMember}>保存成员</Button>
            <Stack spacing={2} sx={{ mt: 3 }}>
              {snapshot.members.length > 0 ? snapshot.members.map((member) => (
                <Box key={member.id} sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography fontWeight={700}>{member.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{member.rank}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {member.id}</Typography>
                  </Box>
                  <Stack alignItems="flex-end" spacing={1}>
                    <Typography fontWeight={700}>{member.hours.toFixed(1)} h</Typography>
                    <Button size="small" color="error" variant="outlined" onClick={() => removeMember(member.id)}>删除</Button>
                  </Stack>
                </Box>
              )) : <Typography color="text.secondary">还没有成员记录。</Typography>}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard title="机队管理">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="注册号" fullWidth value={fleetForm.registration} onChange={(e) => setFleetForm((prev) => ({ ...prev, registration: e.target.value }))} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="机型" fullWidth value={fleetForm.type} onChange={(e) => setFleetForm((prev) => ({ ...prev, type: e.target.value }))} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="累计小时" fullWidth type="number" value={fleetForm.hours} onChange={(e) => setFleetForm((prev) => ({ ...prev, hours: Number(e.target.value) }))} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select label="状态" fullWidth value={fleetForm.status} onChange={(e) => setFleetForm((prev) => ({ ...prev, status: e.target.value as FleetAircraft['status'] }))}>
                  <MenuItem value="active">active</MenuItem>
                  <MenuItem value="maintenance">maintenance</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Button sx={{ mt: 2.5 }} onClick={saveFleet}>保存机队</Button>
            <Stack spacing={2} sx={{ mt: 3 }}>
              {snapshot.fleet.length > 0 ? snapshot.fleet.map((aircraft) => (
                <Box key={aircraft.id} sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography fontWeight={700}>{aircraft.registration}</Typography>
                    <Typography variant="body2" color="text.secondary">{aircraft.type}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {aircraft.id}</Typography>
                  </Box>
                  <Stack alignItems="flex-end" spacing={1}>
                    <Typography fontWeight={700}>{aircraft.hours.toFixed(1)} h</Typography>
                    <Typography variant="body2" color={aircraft.status === 'active' ? 'success.light' : 'warning.light'}>{aircraft.status}</Typography>
                    <Button size="small" color="error" variant="outlined" onClick={() => removeFleet(aircraft.id)}>删除</Button>
                  </Stack>
                </Box>
              )) : <Typography color="text.secondary">还没有机队记录。</Typography>}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
