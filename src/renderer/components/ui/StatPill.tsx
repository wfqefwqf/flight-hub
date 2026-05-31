import { Card, CardContent, Typography } from '@mui/material';

export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
