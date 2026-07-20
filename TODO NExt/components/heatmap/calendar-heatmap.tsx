'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
} from 'react';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
export interface HeatmapActivity {
  date: string;  // YYYY-MM-DD
  value: number;
}

interface HeatmapContextValue {
  data: HeatmapActivity[];
  weeks: (HeatmapActivity | null)[][];
  maxValue: number;
  year: number;
}

// ───────────────────────────────────────────────────────────────────────────────
// Context
// ───────────────────────────────────────────────────────────────────────────────
const HeatmapContext = createContext<HeatmapContextValue | null>(null);

function useHeatmap() {
  const ctx = useContext(HeatmapContext);
  if (!ctx) throw new Error('Must be inside <CalendarHeatmap>');
  return ctx;
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function buildWeeks(data: HeatmapActivity[], year: number): (HeatmapActivity | null)[][] {
  const map = new Map(data.map((d) => [d.date, d]));
  const start = new Date(year, 0, 1);
  const end   = new Date(year, 11, 31);

  // pad to Sunday
  const firstSunday = new Date(start);
  firstSunday.setDate(start.getDate() - start.getDay());

  const weeks: (HeatmapActivity | null)[][] = [];
  let week: (HeatmapActivity | null)[] = [];

  const cursor = new Date(firstSunday);
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    const inYear = cursor.getFullYear() === year;
    week.push(inYear ? (map.get(iso) ?? { date: iso, value: 0 }) : null);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function intensity(value: number, max: number): number {
  if (max === 0 || value === 0) return 0;
  return Math.ceil((value / max) * 4);
}

function blockColor(level: number, isDark = false): string {
  if (isDark) {
    const DARK = ['#1e2430','#0e4429','#006d32','#26a641','#39d353'];
    return DARK[level] ?? DARK[0];
  }
  const LIGHT = ['#ebedf0','#9be9a8','#40c463','#30a14e','#216e39'];
  return LIGHT[level] ?? LIGHT[0];
}

// ───────────────────────────────────────────────────────────────────────────────
// Root – CalendarHeatmap
// ───────────────────────────────────────────────────────────────────────────────
interface CalendarHeatmapProps {
  data: HeatmapActivity[];
  year?: number;
  children?: React.ReactNode;
}

export function CalendarHeatmap({ data, year, children }: CalendarHeatmapProps) {
  const resolvedYear = year ?? new Date().getFullYear();
  const weeks = useMemo(() => buildWeeks(data, resolvedYear), [data, resolvedYear]);
  const maxValue = useMemo(() => Math.max(0, ...data.map((d) => d.value)), [data]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const todayIso = new Date().toISOString().slice(0, 10);
      let currentWeekIndex = -1;
      for (let wi = 0; wi < weeks.length; wi++) {
        if (weeks[wi].some((day) => day && day.date === todayIso)) {
          currentWeekIndex = wi;
          break;
        }
      }

      if (currentWeekIndex !== -1) {
        const CELL = 13;
        const GAP = 2;
        const STEP = CELL + GAP; // 15
        const containerWidth = containerRef.current.clientWidth;
        const targetScrollLeft = currentWeekIndex * STEP - containerWidth / 2 + STEP / 2;
        containerRef.current.scrollLeft = Math.max(0, targetScrollLeft);
      }
    }
  }, [weeks]);

  return (
    <HeatmapContext.Provider value={{ data, weeks, maxValue, year: resolvedYear }}>
      <div
        style={{ width: '100%', overflowX: 'auto' }}
        ref={containerRef}
        className="heatmap-scroll-container"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .heatmap-scroll-container::-webkit-scrollbar {
            display: none;
          }
          .heatmap-scroll-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
        {/* Year label */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          {resolvedYear}
        </div>
        {children}
      </div>
    </HeatmapContext.Provider>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Body
// ───────────────────────────────────────────────────────────────────────────────
interface CalendarHeatmapBodyProps {
  children: (args: {
    activity: HeatmapActivity;
    dayIndex: number;
    weekIndex: number;
  }) => React.ReactNode;
}

export function CalendarHeatmapBody({ children }: CalendarHeatmapBodyProps) {
  const { weeks } = useHeatmap();

  // compute month label positions from weeks
  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstValid = week.find((d) => d !== null);
    if (firstValid) {
      const m = new Date(firstValid.date).getMonth();
      if (m !== lastMonth) {
        monthPositions.push({ label: MONTH_LABELS[m], col: wi });
        lastMonth = m;
      }
    }
  });

  const CELL = 13;
  const GAP  = 2;
  const STEP  = CELL + GAP;

  const gridWidth  = weeks.length * STEP;
  const gridHeight = 7 * STEP;

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {/* Day labels column */}
      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 22, gap: GAP }}>
        {DAY_LABELS.map((label, i) => (
          <div
            key={label}
            style={{
              height: CELL,
              lineHeight: `${CELL}px`,
              fontSize: 9,
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              display: i % 2 === 1 ? 'block' : 'none', // show Mon/Wed/Fri only
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ position: 'relative' }}>
        {/* Month labels */}
        <div style={{ position: 'relative', height: 20, width: gridWidth }}>
          {monthPositions.map(({ label, col }) => (
            <span
              key={`${label}-${col}`}
              style={{
                position: 'absolute',
                left: col * STEP,
                fontSize: 10,
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Blocks grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${weeks.length}, ${CELL}px)`,
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gap: GAP,
            width: gridWidth,
            height: gridHeight,
          }}
        >
          {weeks.map((week, wi) =>
            week.map((activity, di) => {
              if (!activity) {
                return (
                  <div
                    key={`empty-${wi}-${di}`}
                    style={{
                      gridColumn: wi + 1,
                      gridRow: di + 1,
                      width: CELL,
                      height: CELL,
                    }}
                  />
                );
              }
              return (
                <div key={`cell-${wi}-${di}`} style={{ gridColumn: wi + 1, gridRow: di + 1 }}>
                  {children({ activity, dayIndex: di, weekIndex: wi })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Block
// ───────────────────────────────────────────────────────────────────────────────


export function CalendarHeatmapBlock({
  activity,
  style,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dayIndex: _d,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  weekIndex: _w,
  ...rest
}: {
  activity: HeatmapActivity;
  dayIndex?: number;
  weekIndex?: number;
  style?: React.CSSProperties;
  [key: string]: unknown;
}) {
  const { maxValue } = useHeatmap();
  const level = intensity(activity.value, maxValue);
  // detect dark mode from document
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark';
  const color = blockColor(level, isDark);

  return (
    <div
      {...rest}
      style={{
        width: 13,
        height: 13,
        borderRadius: 2,
        backgroundColor: color,
        cursor: activity.value > 0 ? 'pointer' : 'default',
        transition: 'transform 0.1s ease',
        ...style,
      }}
    />
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Footer
// ───────────────────────────────────────────────────────────────────────────────
export function CalendarHeatmapFooter({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
      }}
    >
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Stat
// ───────────────────────────────────────────────────────────────────────────────
export function CalendarHeatmapStat() {
  const { data, year } = useHeatmap();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
      {total.toLocaleString()} contributions in {year}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Legend
// ───────────────────────────────────────────────────────────────────────────────
export function CalendarHeatmapLegend() {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginRight: 2 }}>Less</span>
      {[0, 1, 2, 3, 4].map((lvl) => (
        <div
          key={lvl}
          style={{
            width: 11,
            height: 11,
            borderRadius: 2,
            backgroundColor: blockColor(lvl, isDark),
          }}
        />
      ))}
      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 2 }}>More</span>
    </div>
  );
}
