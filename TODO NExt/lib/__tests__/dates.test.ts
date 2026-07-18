import {
  toISODate,
  addDays,
  timeToMins,
  minsToTime,
  slotDurationMins,
  dayOfWeek,
  lastNDates,
} from '../dates';

describe('dates', () => {
  it('toISODate formats date correctly', () => {
    const date = new Date('2020-01-15');
    expect(toISODate(date)).toBe('2020-01-15');
  });

  it('addDays adds days correctly', () => {
    expect(addDays('2020-01-15', 1)).toBe('2020-01-16');
    expect(addDays('2020-01-15', -1)).toBe('2020-01-14');
    expect(addDays('2020-01-31', 1)).toBe('2020-02-01');
  });

  it('timeToMins converts time to minutes', () => {
    expect(timeToMins('01:00')).toBe(60);
    expect(timeToMins('10:30')).toBe(630);
    expect(timeToMins('00:00')).toBe(0);
  });

  it('minsToTime converts minutes to time', () => {
    expect(minsToTime(60)).toBe('01:00');
    expect(minsToTime(630)).toBe('10:30');
    expect(minsToTime(0)).toBe('00:00');
  });

  it('slotDurationMins calculates slot duration', () => {
    expect(slotDurationMins('09:00', '10:00')).toBe(60);
    expect(slotDurationMins('09:00', '10:30')).toBe(90);
    expect(slotDurationMins('14:15', '15:45')).toBe(90);
  });

  it('dayOfWeek returns correct day', () => {
    expect(dayOfWeek('2020-01-13')).toBe('mon');
    expect(dayOfWeek('2020-01-14')).toBe('tue');
    expect(dayOfWeek('2020-01-15')).toBe('wed');
  });

  it('lastNDates returns last N dates', () => {
    // This test needs to work with a fixed date baseline
    // Just verify the count and ordering
    const dates = lastNDates(5);
    expect(dates.length).toBe(5);
    // Verify they're in ascending order (oldest first)
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      expect(curr.getTime()).toBeGreaterThan(prev.getTime());
    }
  });
});
