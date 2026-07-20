export type TodoStatus = 'pending' | 'in_progress' | 'done' | 'skipped' | 'shifted' | 'needs_review';
export type NodeStatus = 'locked' | 'pending' | 'in_progress' | 'done';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  targetPacePerDayMins: number;
  createdAt: number;
  updatedAt?: number;
  isDeleted?: boolean;
}

export interface RoadmapNode {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  estimatedDurationMins: number;
  status: NodeStatus;
  parentId: string | null;
  order: number;
  startDate?: string | null;
  completeDate?: string | null;
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Todo {
  id: string;
  categoryId: string;
  roadmapNodeId: string | null;
  title: string;
  description: string;
  status: TodoStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate: string; // YYYY-MM-DD
  timeSlotId: string | null;
  shiftCount: number;
  order?: number;
  completedAt?: number | null;
  checklist: ChecklistItem[];
  createdAt: number;
  updatedAt: number;
}

export interface TimeSlot {
  id: string;
  dayPlanId: string;
  categoryId: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isLocked: boolean;
  type: 'study' | 'break' | 'other';
  label?: string;          // Display label from slot template
  slotTemplateId?: string; // Reference to origin SlotTemplate (for idempotent re-allocation)
}

export interface RecurringRule {
  id: string;
  dayPlanId: string;
  daysOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  categoryId: string;
  type: 'study' | 'break' | 'other';
}

export interface DayPlan {
  id: string;
  date: string; // YYYY-MM-DD
  dayStartTimeHHMM: string; // default "06:00"
  dayEndTimeHHMM: string; // default "23:00"
  timeSlots: TimeSlot[];
  recurringRules: RecurringRule[];
  updatedAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SavedLink {
  id: string;
  title: string;
  url: string;
  categoryId: string | null;
  notes: string;
  createdAt: number;
}

export interface FutureIdea {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface ShiftLog {
  id: string;
  todoId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason: 'missed_grace_period' | 'no_open_slots';
  shiftNumber: number;
}

export interface Settings {
  slotGranularityMins: number; // 15, 30, 60
  gracePeriodMins: number;
  streakTargetPct: number; // 0-100
  dayStartTime: string; // HH:MM
  dayEndTime: string; // HH:MM
  aiBackendUrl: string;
  notificationsEnabled: boolean;
  themeMode?: 'system' | 'light' | 'dark';
  onboardingComplete: boolean;
  motivationImageUrl?: string;
  motivationSubtext?: string;
  countdownTarget?: string;
  countdownLabel?: string;
}

export interface NestedRoadmapNode {
  title: string;
  description: string;
  estimatedDurationMins: number;
  subtopics?: NestedRoadmapNode[];
}

export const MAX_ROADMAP_DEPTH = 4;
export const MAX_SHIFTS = 3;

// --- Smart Timetable Types ---

export type SlotType = 'big' | 'medium' | 'revision' | 'break' | 'other';

export interface SlotTemplate {
  id: string;
  studyPlanId: string;
  label: string;
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  durationMins: number;
  slotType: SlotType;
  categoryIds: string[];
  daysOfWeek: DayOfWeek[];
}

export interface StudyPlan {
  id: string;
  name: string;
  durationMonths: number;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  slotTemplates: SlotTemplate[];
  createdAt: number;
  updatedAt?: number;
}

export interface AISuggestion {
  id: string;
  studyPlanId: string;
  suggestions: string[];
  overallMessage: string;
  generatedAt: number;
}

export interface MarkdownFile {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
