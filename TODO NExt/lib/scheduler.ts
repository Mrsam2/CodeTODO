import { Todo, RoadmapNode, DayPlan, Category, ChecklistItem } from '@/types';
import { findFirstUnlockedIncompleteNode, childrenOf } from './roadmap';
import { todayISO, slotDurationMins, timeToMins } from './dates';

export interface GenerateTodosResult {
  todos: Todo[];
  completedCategories: string[];
}

export function generateDailyTodos(
  nodes: RoadmapNode[],
  dayPlan: DayPlan,
  categories: Category[],
  existingTodos: Todo[]
): GenerateTodosResult {
  const today = todayISO();
  if (dayPlan.date !== today) {
    return { todos: existingTodos, completedCategories: [] };
  }

  const newTodos: Todo[] = [];
  const completedCategories: string[] = [];

  for (const category of categories) {
    const study = dayPlan.timeSlots.find(
      (s) => s.categoryId === category.id && s.type === 'study' && !s.isLocked
    );
    if (!study) continue;

    const alreadyHasTodo = existingTodos.some(
      (t) => t.categoryId === category.id && t.dueDate === today && t.status !== 'done'
    );
    if (alreadyHasTodo) continue;

    const node = findFirstUnlockedIncompleteNode(nodes, category.id);
    if (!node) {
      completedCategories.push(category.id);
      continue;
    }

    const slotDuration = slotDurationMins(study.startTime, study.endTime);
    const checklist = buildChecklist(node, slotDuration);

    const todoId = `todo-${Date.now()}-${Math.random()}`;
    const todo: Todo = {
      id: todoId,
      categoryId: category.id,
      roadmapNodeId: node.id,
      title: node.title,
      description: node.description,
      status: 'pending',
      priority: 'medium',
      dueDate: today,
      timeSlotId: study.id,
      shiftCount: 0,
      checklist,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    newTodos.push(todo);
  }

  return {
    todos: [...existingTodos, ...newTodos],
    completedCategories,
  };
}

export function buildChecklist(node: RoadmapNode, slotDurationMins: number): ChecklistItem[] {
  if (node.estimatedDurationMins <= slotDurationMins) {
    return [
      {
        id: `item-${Date.now()}`,
        text: node.title,
        done: false,
      },
    ];
  }

  const numItems = Math.min(
    6,
    Math.max(2, Math.ceil(node.estimatedDurationMins / (slotDurationMins * 0.7)))
  );
  const items: ChecklistItem[] = [];
  for (let i = 0; i < numItems; i++) {
    items.push({
      id: `item-${Date.now()}-${i}`,
      text: `Part ${i + 1} of ${numItems}`,
      done: false,
    });
  }
  return items;
}

export function firstStudySlotForCategory(
  dayPlan: DayPlan,
  categoryId: string
): { date: string; slotId: string; startTime: string; endTime: string } | null {
  const slot = dayPlan.timeSlots.find((s) => s.categoryId === categoryId && s.type === 'study');
  if (!slot) return null;
  return {
    date: dayPlan.date,
    slotId: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
  };
}
