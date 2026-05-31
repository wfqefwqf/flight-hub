import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid2 as Grid, Stack, TextField, Typography } from '@mui/material';
import type { DispatchFlight, FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

function createEmptyDispatch(): DispatchFlight {
  return {
    id: crypto.randomUUID(),
    flightNumber: '',
    departure: '',
    arrival: '',
    alternate: '',
    route: '',
    payloadKg: 0,
    fuelKg: 0,
    source: 'manual',
    status: 'draft',
    createdAt: new Date().toISOString(),
    pilotMemberId: '',
    fleetAircraftId: '',
    simbriefUsername: '',
    simbriefUserId: '',
    simbriefNavlogId: ''
  };
}

export function DispatchPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const latest = useMemo(() => snapshot.dispatches[0] ?? createEmptyDispatch(), [snapshot.dispatches]);
  const [form, setForm] = useState<DispatchFlight>(latest);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm(latest);
  }, [latest]);

  const update = <K extends keyof DispatchFlight>(key: K, value: DispatchFlight[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const importSimBrief = async () => {
    try {
      const draft = await window.flightHub.importSimBrief(form);
      setForm(draft);
      setMessage('已创建 SimBrief 来源的签派草稿。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败');
    }
  };

  const save = async () => {
    try {
      const saved = await window.flightHub.saveDispatch(form);
      setForm(saved);
      setMessage('签派已保存。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  };

  const exportJson = async () => {
    try {
      const output = await window.flightHub.exportDispatch(form.id);
      setMessage(output ? `已导出到：${output}` : '已取消导出。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导出失败');
    }
  };

  const newDraft = () => {
    setForm(createEmptyDispatch());
    setMessage('已创建新的本地草稿，保存后会进入真实数据库。');
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, xl: 4 }}>
        <GlassCard title="现有签派">
          <Stack spacing={2}>
            <Button onClick={newDraft}>新建签派草稿</Button>
            {snapshot.dispatches.length > 0 ? (
              snapshot.dispatches.map((dispatch) => (
                <Button
                  key={dispatch.id}
                  variant="outlined"
                  color="inherit"
                  sx={{ justifyContent: 'space-between', p: 2, borderRadius: 4 }}
                  onClick={() => setForm(dispatch)}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography fontWeight={700}>{dispatch.flightNumber || '未命名航班'}</Typography>
                    <Typography variant="body2" color="text.secondary">{dispatch.departure || '----'} → {dispatch.arrival || '----'}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{dispatch.status}</Typography>
                </Button>
              ))
            ) : (
              <Typography color="text.secondary">当前还没有真实签派记录。请新建或导入一份草稿。</Typography>
            )}
          </Stack>
        </GlassCard>
      </Grid>

      <Grid size={{ xs: 12, xl: 8 }}>
        <GlassCard title="签派编辑器" extra={message ? <Typography variant="caption" color="primary.main">{message}</Typography> : undefined}>
          <Grid container spacing={2}>
            {[
              ['flightNumber', '航班号'],
              ['departure', '起飞机场'],
              ['arrival', '目的机场'],
              ['alternate', '备降机场'],
              ['simbriefUsername', 'SimBrief 用户名'],
              ['simbriefUserId', 'SimBrief 用户 ID'],
              ['simbriefNavlogId', 'SimBrief Navlog ID'],
              ['pilotMemberId', '成员 ID'],
              ['fleetAircraftId', '机队 ID']
            ].map(([key, label]) => (
              <Grid key={key} size={{ xs: 12, md: 6 }}>
                <TextField
                  label={label}
                  fullWidth
                  value={(form as any)[key] ?? ''}
                  onChange={(e) => update(key as keyof DispatchFlight, e.target.value as any)}
                />
              </Grid>
            ))}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="航路"
                fullWidth
                multiline
                minRows={4}
                value={form.route}
                onChange={(e) => update('route', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="业载 kg" fullWidth type="number" value={form.payloadKg} onChange={(e) => update('payloadKg', Number(e.target.value))} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="燃油 kg" fullWidth type="number" value={form.fuelKg} onChange={(e) => update('fuelKg', Number(e.target.value))} />
            </Grid>
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <Button onClick={importSimBrief}>导入 SimBrief</Button>
            <Button variant="outlined" onClick={save}>保存签派</Button>
            <Button variant="outlined" onClick={exportJson}>导出 dispatch.json</Button>
          </Stack>
        </GlassCard>
      </Grid>
    </Grid>
  );
}
