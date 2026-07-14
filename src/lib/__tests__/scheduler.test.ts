import { generateDailyTodos, buildChecklist } from '../scheduler';
import { RoadmapNode, DayPlan, Category, Todo } from '@/types';
import { todayISO } from '../dates';

describe('scheduler', () => {
  const catId = 'cat-1';
  const today = todayISO();

  it('generateDailyTodos creates one todo per category', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Learn DSA',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
    ];

    const dayPlan: DayPlan = {
      id: 'dp1',
      date: today,
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '09:00',
          endTime: '10:00',
          isLocked: false,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const categories: Category[] = [
      {
        id: catId,
        name: 'DSA',
        description: '',
        color: '#2563EB',
        icon: '📘',
        targetPacePerDayMins: 60,
        createdAt: 0,
      },
    ];

    const result = generateDailyTodos(nodes, dayPlan, categories, []);
    expect(result.todos.length).toBe(1);
    expect(result.todos[0].title).toBe('Learn DSA');
    expect(result.todos[0].timeSlotId).toBe('slot1');
  });

  it('buildChecklist splits large nodes into multiple items', () => {
    const node: RoadmapNode = {
      id: 'n1',
      categoryId: catId,
      title: 'Large Topic',
      description: '',
      estimatedDurationMins: 120,
      status: 'pending',
      parentId: null,
      order: 0,
      createdAt: 0,
    };

    const checklist = buildChecklist(node, 30);
    expect(checklist.length).toBeGreaterThan(1);
  });

  it('buildChecklist fits small nodes into single item', () => {
    const node: RoadmapNode = {
      id: 'n1',
      categoryId: catId,
      title: 'Small Topic',
      description: '',
      estimatedDurationMins: 15,
      status: 'pending',
      parentId: null,
      order: 0,
      createdAt: 0,
    };

    const checklist = buildChecklist(node, 30);
    expect(checklist.length).toBe(1);
    expect(checklist[0].text).toBe('Small Topic');
  });

  it('does not duplicate todos on repeated generation', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Learn DSA',
        description: '',
        estimatedDurationMins: 60,
        status: 'pending',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
    ];

    const dayPlan: DayPlan = {
      id: 'dp1',
      date: today,
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '09:00',
          endTime: '10:00',
          isLocked: false,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const categories: Category[] = [
      {
        id: catId,
        name: 'DSA',
        description: '',
        color: '#2563EB',
        icon: '📘',
        targetPacePerDayMins: 60,
        createdAt: 0,
      },
    ];

    const existing: Todo[] = [
      {
        id: 'todo1',
        categoryId: catId,
        roadmapNodeId: 'n1',
        title: 'Learn DSA',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: today,
        timeSlotId: 'slot1',
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const result = generateDailyTodos(nodes, dayPlan, categories, existing);
    expect(result.todos.length).toBe(1);
  });

  it('signals completed categories when no unlocked node exists', () => {
    const nodes: RoadmapNode[] = [
      {
        id: 'n1',
        categoryId: catId,
        title: 'Learn DSA',
        description: '',
        estimatedDurationMins: 60,
        status: 'done',
        parentId: null,
        order: 0,
        createdAt: 0,
      },
    ];

    const dayPlan: DayPlan = {
      id: 'dp1',
      date: today,
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '09:00',
          endTime: '10:00',
          isLocked: false,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const categories: Category[] = [
      {
        id: catId,
        name: 'DSA',
        description: '',
        color: '#2563EB',
        icon: '📘',
        targetPacePerDayMins: 60,
        createdAt: 0,
      },
    ];

    const result = generateDailyTodos(nodes, dayPlan, categories, []);
    expect(result.completedCategories).toContain(catId);
  });
});
