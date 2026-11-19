/** 0 → "0:00", 65_000 → "1:05", 3_725_000 → "1:02:05". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Late night listening";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
