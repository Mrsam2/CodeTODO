import { Todo, DayPlan, TimeSlot, ShiftLog, MAX_SHIFTS } from '@/types';
import { todayISO, addDays, dateTimeMs, slotDurationMins } from './dates';

export interface RescheduleResult {
  todos: Todo[];
  shiftLogs: ShiftLog[];
  newDayPlans: DayPlan[];
}

export function runReschedule(
  todos: Todo[],
  dayPlans: DayPlan[],
  gracePeriodMins: number
): RescheduleResult {
  const now = Date.now();
  const today = todayISO();
  const shiftLogs: ShiftLog[] = [];
  const newDayPlans: DayPlan[] = [];
  let updatedTodos = [...todos];

  for (const todo of updatedTodos) {
    if (todo.status === 'done' || todo.status === 'skipped' || todo.status === 'needs_review') {
      continue;
    }

    if (!todo.timeSlotId || !todo.dueDate) continue;

    const dayPlan = dayPlans.find((dp) => dp.date === todo.dueDate);
    if (!dayPlan) continue;

    const slot = dayPlan.timeSlots.find((s) => s.id === todo.timeSlotId);
    if (!slot || slot.isLocked) continue;

    const slotEndMs = dateTimeMs(todo.dueDate, slot.endTime);
    const gracePeriodMs = gracePeriodMins * 60 * 1000;
    const deadline = slotEndMs + gracePeriodMs;

    if (now <= deadline) continue;

    if (todo.shiftCount >= MAX_SHIFTS) {
      const idx = updatedTodos.findIndex((t) => t.id === todo.id);
      if (idx >= 0) {
        updatedTodos[idx] = { ...todo, status: 'needs_review' };
      }
      continue;
    }

    const nextSlot = findNextOpenSlot(updatedTodos, dayPlans, todo.categoryId, todo.dueDate);

    if (nextSlot) {
      const idx = updatedTodos.findIndex((t) => t.id === todo.id);
      if (idx >= 0) {
        updatedTodos[idx] = {
          ...todo,
          timeSlotId: nextSlot.slotId,
          dueDate: nextSlot.date,
          status: 'shifted',
          shiftCount: todo.shiftCount + 1,
          updatedAt: Date.now(),
        };
        shiftLogs.push({
          id: `log-${Date.now()}`,
          todoId: todo.id,
          fromDate: todo.dueDate,
          toDate: nextSlot.date,
          reason: 'missed_grace_period',
          shiftNumber: todo.shiftCount + 1,
        });
      }
    } else {
      const tomorrowDate = addDays(todo.dueDate, 1);
      const tomorrowPlan = dayPlans.find((dp) => dp.date === tomorrowDate);

      if (tomorrowPlan) {
        const sameSlot = tomorrowPlan.timeSlots.find(
          (s) => s.categoryId === todo.categoryId && s.type === 'study' && !s.isLocked
        );
        if (sameSlot) {
          const idx = updatedTodos.findIndex((t) => t.id === todo.id);
          if (idx >= 0) {
            updatedTodos[idx] = {
              ...todo,
              timeSlotId: sameSlot.id,
              dueDate: tomorrowDate,
              status: 'shifted',
              shiftCount: todo.shiftCount + 1,
              updatedAt: Date.now(),
            };
            shiftLogs.push({
              id: `log-${Date.now()}-tomorrow`,
              todoId: todo.id,
              fromDate: todo.dueDate,
              toDate: tomorrowDate,
              reason: 'no_open_slots',
              shiftNumber: todo.shiftCount + 1,
            });
          }
        }
      }
    }
  }

  return {
    todos: updatedTodos,
    shiftLogs,
    newDayPlans,
  };
}

function findNextOpenSlot(
  todos: Todo[],
  dayPlans: DayPlan[],
  categoryId: string,
  fromDate: string
): { date: string; slotId: string } | null {
  const dayPlan = dayPlans.find((dp) => dp.date === fromDate);
  if (!dayPlan) return null;

  const studySlots = dayPlan.timeSlots.filter(
    (s) => s.categoryId === categoryId && s.type === 'study' && !s.isLocked
  );

  for (const slot of studySlots) {
    const isOccupied = todos.some(
      (t) =>
        t.timeSlotId === slot.id &&
        t.dueDate === fromDate &&
        t.status !== 'done' &&
        t.status !== 'skipped'
    );
    if (!isOccupied) {
      return { date: fromDate, slotId: slot.id };
    }
  }

  return null;
}
