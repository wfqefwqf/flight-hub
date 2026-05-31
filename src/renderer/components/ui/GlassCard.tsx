import { ReactNode } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

export function GlassCard({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'background.paper' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ letterSpacing: '0.2em', color: 'text.secondary', fontWeight: 700 }}>
            {title}
          </Typography>
          <Box>{extra}</Box>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}
