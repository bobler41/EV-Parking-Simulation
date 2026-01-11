export function tickIndexToTimeLabel(tickIndex: number): string {
  const minutes = tickIndex * 15;
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const h = String(hh).padStart(2, "0");
  const m = String(mm).padStart(2, "0");
  return `${h}:${m}`;
}
