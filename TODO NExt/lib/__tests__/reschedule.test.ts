import { runReschedule } from '../reschedule';
import { Todo, DayPlan } from '@/types';
import { todayISO, addDays } from '../dates';

describe('reschedule engine', () => {
  const catId = 'cat-1';
  const today = todayISO();

  it('does not shift todo before grace period expires', () => {
    const now = Date.now();
    const futureDate = new Date(now + 1000).toISOString().split('T')[0];

    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Test',
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
          startTime: '22:00',
          endTime: '23:00',
          isLocked: false,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const result = runReschedule(todos, [dayPlan], 30);
    expect(result.todos[0].status).toBe('pending');
  });

  it('shifts todo after grace period expires', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Test',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '2020-01-01',
        timeSlotId: 'slot1',
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const dayPlan: DayPlan = {
      id: 'dp1',
      date: '2020-01-01',
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '22:00',
          endTime: '23:00',
          isLocked: false,
          type: 'study',
        },
        {
          id: 'slot2',
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

    const result = runReschedule(todos, [dayPlan], 0);
    expect(result.todos[0].status).toBe('shifted');
    expect(result.shiftLogs.length).toBeGreaterThan(0);
  });

  it('caps shifts at MAX_SHIFTS and sets needs_review', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Test',
        description: '',
        status: 'shifted',
        priority: 'medium',
        dueDate: '2020-01-01',
        timeSlotId: 'slot1',
        shiftCount: 3,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const dayPlan: DayPlan = {
      id: 'dp1',
      date: '2020-01-01',
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '22:00',
          endTime: '23:00',
          isLocked: false,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const result = runReschedule(todos, [dayPlan], 0);
    expect(result.todos[0].status).toBe('needs_review');
  });

  it('shifts to tomorrow if no same-day slots available', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Test',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '2020-01-01',
        timeSlotId: 'slot1',
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const today = '2020-01-01';
    const tomorrow = '2020-01-02';

    const dayPlanToday: DayPlan = {
      id: 'dp1',
      date: today,
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '22:00',
          endTime: '23:00',
          isLocked: false,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const dayPlanTomorrow: DayPlan = {
      id: 'dp2',
      date: tomorrow,
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot2',
          dayPlanId: 'dp2',
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

    const result = runReschedule(todos, [dayPlanToday, dayPlanTomorrow], 0);
    expect(result.todos[0].dueDate).toBe(tomorrow);
    expect(result.todos[0].status).toBe('shifted');
  });

  it('ignores done and skipped todos', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: '2020-01-01',
        timeSlotId: 'slot1',
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'todo2',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Skipped',
        description: '',
        status: 'skipped',
        priority: 'medium',
        dueDate: '2020-01-01',
        timeSlotId: 'slot1',
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const dayPlan: DayPlan = {
      id: 'dp1',
      date: '2020-01-01',
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '22:00',
          endTime: '23:00',
          isLocked: false,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const result = runReschedule(todos, [dayPlan], 0);
    expect(result.todos[0].status).toBe('done');
    expect(result.todos[1].status).toBe('skipped');
    expect(result.shiftLogs.length).toBe(0);
  });

  it('does not shift into locked slots', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Test',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '2020-01-01',
        timeSlotId: 'slot1',
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const dayPlan: DayPlan = {
      id: 'dp1',
      date: '2020-01-01',
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '22:00',
          endTime: '23:00',
          isLocked: false,
          type: 'study',
        },
        {
          id: 'slot2',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '09:00',
          endTime: '10:00',
          isLocked: true,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const result = runReschedule(todos, [dayPlan], 0);
    expect(result.todos[0].status).not.toBe('shifted');
  });

  it('does not duplicate todos in occupied slots', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Test1',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '2020-01-01',
        timeSlotId: 'slot1',
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'todo2',
        categoryId: catId,
        roadmapNodeId: null,
        title: 'Test2',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '2020-01-01',
        timeSlotId: 'slot2',
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const dayPlan: DayPlan = {
      id: 'dp1',
      date: '2020-01-01',
      dayStartTimeHHMM: '06:00',
      dayEndTimeHHMM: '23:00',
      timeSlots: [
        {
          id: 'slot1',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '22:00',
          endTime: '23:00',
          isLocked: false,
          type: 'study',
        },
        {
          id: 'slot2',
          dayPlanId: 'dp1',
          categoryId: catId,
          startTime: '21:00',
          endTime: '22:00',
          isLocked: false,
          type: 'study',
        },
      ],
      recurringRules: [],
      updatedAt: 0,
    };

    const result = runReschedule(todos, [dayPlan], 0);
    expect(result.todos.length).toBe(2);
  });
});
