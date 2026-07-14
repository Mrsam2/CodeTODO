export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function timeToMins(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function slotDurationMins(startTime: string, endTime: string): number {
  const start = timeToMins(startTime);
  const end = timeToMins(endTime);
  return end - start;
}

export function dateTimeMs(dateStr: string, time: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, mins] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, mins).getTime();
}

export function dayOfWeek(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
}

export function lastNDates(n: number, anchorDateStr?: string): string[] {
  const result: string[] = [];
  const anchor = anchorDateStr || todayISO();
  for (let i = n - 1; i >= 0; i--) {
    result.push(addDays(anchor, -i));
  }
  return result;
}

export function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}
