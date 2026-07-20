import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, required: true },
  icon: { type: String, default: '' },
  targetPacePerDayMins: { type: Number, default: 60 },
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now },
  isDeleted: { type: Boolean, default: false },
}, { _id: false });

const RoadmapNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  categoryId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedDurationMins: { type: Number, default: 60 },
  status: { type: String, enum: ['locked', 'pending', 'in_progress', 'done'], default: 'pending' },
  parentId: { type: String, default: null },
  order: { type: Number, default: 0 },
  startDate: { type: String, default: null },
  completeDate: { type: String, default: null },
  createdAt: { type: Number, default: Date.now },
}, { _id: false });

const ChecklistItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { _id: false });

const TodoSchema = new mongoose.Schema({
  id: { type: String, required: true },
  categoryId: { type: String, required: true },
  roadmapNodeId: { type: String, default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: String, required: true },
  timeSlotId: { type: String, default: null },
  shiftCount: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  completedAt: { type: Number, default: null },
  checklist: [ChecklistItemSchema],
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now },
}, { _id: false });

const TimeSlotSchema = new mongoose.Schema({
  id: { type: String, required: true },
  dayPlanId: { type: String, required: true },
  categoryId: { type: String, default: '' },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isLocked: { type: Boolean, default: false },
  type: { type: String, enum: ['study', 'break', 'other'], default: 'study' },
  label: { type: String, default: '' },
  slotTemplateId: { type: String, default: '' },
}, { _id: false });

const RecurringRuleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  dayPlanId: { type: String, required: true },
  daysOfWeek: [{ type: String }],
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  categoryId: { type: String, required: true },
  type: { type: String, enum: ['study', 'break', 'other'], default: 'study' },
}, { _id: false });

const DayPlanSchema = new mongoose.Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  dayStartTimeHHMM: { type: String, default: '06:00' },
  dayEndTimeHHMM: { type: String, default: '23:00' },
  timeSlots: [TimeSlotSchema],
  recurringRules: [RecurringRuleSchema],
}, { _id: false });

const NoteSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  tags: [{ type: String }],
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now },
}, { _id: false });

const SavedLinkSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  categoryId: { type: String, default: null },
  notes: { type: String, default: '' },
  createdAt: { type: Number, default: Date.now },
}, { _id: false });

const FutureIdeaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdAt: { type: Number, default: Date.now },
}, { _id: false });

const ShiftLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  todoId: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  reason: { type: String, enum: ['missed_grace_period', 'no_open_slots'], required: true },
  shiftNumber: { type: Number, required: true },
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  slotGranularityMins: { type: Number, default: 30 },
  gracePeriodMins: { type: Number, default: 30 },
  streakTargetPct: { type: Number, default: 80 },
  dayStartTime: { type: String, default: '06:00' },
  dayEndTime: { type: String, default: '23:00' },
  aiBackendUrl: { type: String, default: '' },
  notificationsEnabled: { type: Boolean, default: false },
  onboardingComplete: { type: Boolean, default: false },
  themeMode: { type: String, default: 'system' },
  motivationImageUrl: { type: String, default: '' },
  motivationSubtext: { type: String, default: "Let's make progress today!" },
  countdownTarget: { type: String, default: '' },
  countdownLabel: { type: String, default: '' },
}, { _id: false });

const SlotTemplateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  studyPlanId: { type: String, required: true },
  label: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  durationMins: { type: Number, required: true },
  slotType: { type: String, enum: ['big', 'medium', 'revision', 'break', 'other'], default: 'big' },
  categoryIds: [{ type: String }],
  daysOfWeek: [{ type: String }],
}, { _id: false });

const StudyPlanSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  durationMonths: { type: Number, default: 3 },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  slotTemplates: [SlotTemplateSchema],
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now },
}, { _id: false });

const AISuggestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  studyPlanId: { type: String, required: true },
  suggestions: [{ type: String }],
  overallMessage: { type: String, default: '' },
  generatedAt: { type: Number, default: Date.now },
}, { _id: false });

const MarkdownFileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now },
}, { _id: false });

const UserDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  categories: { type: [CategorySchema], default: [] },
  roadmapNodes: { type: [RoadmapNodeSchema], default: [] },
  todos: { type: [TodoSchema], default: [] },
  dayPlans: { type: [DayPlanSchema], default: [] },
  notes: { type: [NoteSchema], default: [] },
  savedLinks: { type: [SavedLinkSchema], default: [] },
  futureIdeas: { type: [FutureIdeaSchema], default: [] },
  shiftLogs: { type: [ShiftLogSchema], default: [] },
  studyPlans: { type: [StudyPlanSchema], default: [] },
  aiSuggestions: { type: [AISuggestionSchema], default: [] },
  markdownFiles: { type: [MarkdownFileSchema], default: [] },
  settings: { type: SettingsSchema, default: () => ({}) },
  lastSyncAt: { type: Number, default: Date.now },
}, { versionKey: false });

if (mongoose.models.UserData && !mongoose.models.UserData.schema.paths['categories.isDeleted']) {
  delete mongoose.models.UserData;
}

export const UserData = mongoose.models.UserData || mongoose.model('UserData', UserDataSchema);
