export function formatDateTime(value?: string) {
  if (!value || value.trim().length === 0) return '尚未记录';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '尚未记录';

  return date.toLocaleString();
}
