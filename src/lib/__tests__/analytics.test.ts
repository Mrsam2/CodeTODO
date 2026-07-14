import { dayStats, streak, categoryReports, weaknesses, trend } from '../analytics';
import { Todo, Category, ShiftLog } from '@/types';

describe('analytics', () => {
  const today = '2020-01-10';

  it('dayStats computes completion percentage', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: today,
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'todo2',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Pending',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: today,
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const stats = dayStats(todos, today);
    expect(stats.completionPct).toBe(50);
    expect(stats.done).toBe(1);
    expect(stats.total).toBe(2);
  });

  it('streak counts consecutive days above target', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: '2020-01-08',
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'todo2',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: '2020-01-09',
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'todo3',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: '2020-01-10',
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const s = streak(todos, 100, 7, today);
    expect(s).toBeGreaterThan(0);
  });

  it('categoryReports computes per-category stats', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: today,
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'todo2',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Shifted',
        description: '',
        status: 'shifted',
        priority: 'medium',
        dueDate: today,
        timeSlotId: null,
        shiftCount: 1,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const categories: Category[] = [
      {
        id: 'cat1',
        name: 'DSA',
        description: '',
        color: '#2563EB',
        icon: '📘',
        targetPacePerDayMins: 60,
        createdAt: 0,
      },
    ];

    const reports = categoryReports(todos, categories, []);
    expect(reports.length).toBe(1);
    expect(reports[0].doneTodos).toBe(1);
    expect(reports[0].shiftedOrSkipped).toBe(1);
  });

  it('weaknesses filters to problematic categories', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Shifted',
        description: '',
        status: 'shifted',
        priority: 'medium',
        dueDate: today,
        timeSlotId: null,
        shiftCount: 1,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'todo2',
        categoryId: 'cat2',
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: today,
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const categories: Category[] = [
      {
        id: 'cat1',
        name: 'DSA',
        description: '',
        color: '#2563EB',
        icon: '📘',
        targetPacePerDayMins: 60,
        createdAt: 0,
      },
      {
        id: 'cat2',
        name: 'English',
        description: '',
        color: '#DC2626',
        icon: '💬',
        targetPacePerDayMins: 30,
        createdAt: 0,
      },
    ];

    const weak = weaknesses(todos, categories, []);
    expect(weak.length).toBe(1);
    expect(weak[0].categoryName).toBe('DSA');
  });

  it('trend generates daily stats over N days', () => {
    const todos: Todo[] = [
      {
        id: 'todo1',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: '2020-01-08',
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: 'todo2',
        categoryId: 'cat1',
        roadmapNodeId: null,
        title: 'Done',
        description: '',
        status: 'done',
        priority: 'medium',
        dueDate: '2020-01-09',
        timeSlotId: null,
        shiftCount: 0,
        checklist: [],
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const t = trend(todos, 7, today);
    expect(t.length).toBe(7);
  });
});
