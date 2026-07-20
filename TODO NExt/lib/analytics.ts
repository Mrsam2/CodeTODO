import { Todo, Category, ShiftLog } from '@/types';
import { lastNDates, todayISO } from './dates';

export interface DayStats {
  date: string;
  done: number;
  shifted: number;
  skipped: number;
  needsReview: number;
  total: number;
  completionPct: number;
}

export interface CategoryReport {
  categoryId: string;
  categoryName: string;
  totalTodos: number;
  doneTodos: number;
  shiftedOrSkipped: number;
  weaknessScore: number;
  avgShiftsPerTodo: number;
}

export function dayStats(todos: Todo[], date: string): DayStats {
  const dayTodos = todos.filter((t) => t.dueDate === date);
  const done = dayTodos.filter((t) => t.status === 'done').length;
  const shifted = dayTodos.filter((t) => t.status === 'shifted').length;
  const skipped = dayTodos.filter((t) => t.status === 'skipped').length;
  const needsReview = dayTodos.filter((t) => t.status === 'needs_review').length;
  const total = dayTodos.length;

  return {
    date,
    done,
    shifted,
    skipped,
    needsReview,
    total,
    completionPct: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function trend(todos: Todo[], days: number, anchorDate?: string): DayStats[] {
  const dates = lastNDates(days, anchorDate);
  return dates.map((date) => dayStats(todos, date));
}

export function heatmap(todos: Todo[], year: number): { date: string; value: number }[] {
  const start = new Date(year, 0, 1);
  const end   = new Date(year, 11, 31);
  const result: { date: string; value: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    const done = todos.filter((t) => t.dueDate === iso && t.status === 'done').length;
    result.push({ date: iso, value: done });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function streak(
  todos: Todo[],
  streakTargetPct: number,
  days: number = 30,
  anchorDate?: string
): number {
  const today = anchorDate || todayISO();
  
  // Dynamically calculate lookback window based on the oldest todo dueDate
  let lookbackDays = days;
  if (todos.length > 0) {
    const dueDates = todos
      .map((t) => t.dueDate)
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (dueDates.length > 0) {
      dueDates.sort();
      const oldestDate = dueDates[0];
      const [y1, m1, d1] = oldestDate.split('-').map(Number);
      const [y2, m2, d2] = today.split('-').map(Number);
      const date1 = new Date(y1, m1 - 1, d1);
      const date2 = new Date(y2, m2 - 1, d2);
      const diffTime = Math.abs(date2.getTime() - date1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      lookbackDays = Math.max(days, diffDays + 1);
    }
  }

  const dates = lastNDates(lookbackDays, today);
  let count = 0;

  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i];
    const stats = dayStats(todos, date);
    const isToday = date === today;

    if (stats.total === 0) {
      // Neutral day: no tasks scheduled.
      // Do not increment the streak, and do not break the streak.
      continue;
    }

    if (stats.completionPct >= streakTargetPct) {
      // Success day: increment streak.
      count++;
    } else {
      // Fail day: less than target % complete.
      if (isToday) {
        // Today is still in progress, so do not break the streak.
        continue;
      } else {
        // Yesterday or earlier was a fail day, so the streak breaks here.
        break;
      }
    }
  }

  return count;
}

export function categoryReports(
  todos: Todo[],
  categories: Category[],
  shiftLogs: ShiftLog[]
): CategoryReport[] {
  return categories.map((cat) => {
    const catTodos = todos.filter((t) => t.categoryId === cat.id);
    const doneTodos = catTodos.filter((t) => t.status === 'done').length;
    const shiftedOrSkipped = catTodos.filter(
      (t) => t.status === 'shifted' || t.status === 'skipped'
    ).length;
    const totalTodos = catTodos.length;

    const totalShifts = shiftLogs
      .filter((log) => {
        const todo = catTodos.find((t) => t.id === log.todoId);
        return !!todo;
      })
      .reduce((sum, log) => sum + log.shiftNumber, 0);

    const avgShiftsPerTodo = totalTodos === 0 ? 0 : totalShifts / totalTodos;
    const weaknessScore =
      totalTodos === 0 ? 0 : Math.round(((shiftedOrSkipped + totalShifts) / totalTodos) * 100);

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalTodos,
      doneTodos,
      shiftedOrSkipped,
      weaknessScore,
      avgShiftsPerTodo,
    };
  });
}

export function weaknesses(
  todos: Todo[],
  categories: Category[],
  shiftLogs: ShiftLog[]
): CategoryReport[] {
  return categoryReports(todos, categories, shiftLogs)
    .filter((r) => r.totalTodos > 0 && (r.shiftedOrSkipped > 0 || r.weaknessScore > 0))
    .sort((a, b) => b.weaknessScore - a.weaknessScore);
}
