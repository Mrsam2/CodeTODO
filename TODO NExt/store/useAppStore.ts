import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Category,
  RoadmapNode,
  Todo,
  DayPlan,
  TimeSlot,
  Note,
  SavedLink,
  FutureIdea,
  ShiftLog,
  Settings,
  NestedRoadmapNode,
  StudyPlan,
  SlotTemplate,
  AISuggestion,
} from '@/types';
import {
  recomputeStatuses,
  flattenNestedTree,
  childrenOf,
  subtreeIds,
} from '@/lib/roadmap';
import { generateDailyTodos } from '@/lib/scheduler';
import { runReschedule } from '@/lib/reschedule';
import { categoryReports, dayStats, streak, weaknesses, CategoryReport } from '@/lib/analytics';
import { todayISO, addDays, slotDurationMins } from '@/lib/dates';
import { generateId } from '@/lib/id';
import { buildSuggestionsPromptPayload, pickNodeForSlot, todaySlots, timeToMins } from '@/lib/timetable';

interface AppState {
  categories: Category[];
  roadmapNodes: RoadmapNode[];
  todos: Todo[];
  dayPlans: DayPlan[];
  notes: Note[];
  savedLinks: SavedLink[];
  futureIdeas: FutureIdea[];
  shiftLogs: ShiftLog[];
  studyPlans: StudyPlan[];
  aiSuggestions: AISuggestion[];
  settings: Settings;

  token: string | null;
  user: { id: string; email: string; name?: string } | null;
  isSyncing: boolean;
  lastSyncAt: number;
  deletedIds: string[];
  syncPending: boolean;

  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string) => Promise<string | null>;
  googleLogin: (credential: string, isMock?: boolean, email?: string, name?: string) => Promise<string | null>;
  registerPasskey: (deviceName?: string) => Promise<string | null>;
  loginWithPasskey: (email: string) => Promise<string | null>;
  logout: () => void;
  syncWithCloud: () => Promise<void>;
  requestPasswordResetOtp: (email: string) => Promise<string | null>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<string | null>;

  addCategory: (cat: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addRoadmapNode: (node: Omit<RoadmapNode, 'id' | 'createdAt'>) => void;
  updateRoadmapNode: (id: string, updates: Partial<RoadmapNode>) => void;
  deleteRoadmapSubtree: (nodeId: string) => void;
  moveRoadmapNode: (nodeId: string, newParentId: string | null, newOrder: number) => void;
  setNodeCompleted: (nodeId: string, completed: boolean) => void;
  importGeneratedRoadmap: (categoryId: string, nested: NestedRoadmapNode[]) => void;
  generateAndImportRoadmap: (categoryId: string) => Promise<boolean>;

  ensureDayPlan: (date: string) => void;
  addTimeSlot: (dayPlanId: string, slot: Omit<Omit<TimeSlot, 'id'>, 'dayPlanId'>) => void;
  updateTimeSlot: (dayPlanId: string, slotId: string, updates: Partial<TimeSlot>) => void;
  deleteTimeSlot: (dayPlanId: string, slotId: string) => void;

  addManualTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  reorderTodos: (date: string, orderedIds: string[]) => void;
  setTodoStatus: (id: string, status: Todo['status']) => void;
  toggleChecklistItem: (todoId: string, itemId: string) => void;
  deleteTodo: (id: string) => void;
  autoArrangeTodosByTime: (date: string) => void;
  topicFitsSlot: (todoId: string) => boolean;
  resolveTodoCompletion: (id: string, fullyDone: boolean) => void;

  generateToday: () => void;
  runRescheduleNow: () => void;

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addLink: (link: Omit<SavedLink, 'id' | 'createdAt'>) => void;
  deleteLink: (id: string) => void;
  addFutureIdea: (idea: Omit<FutureIdea, 'id' | 'createdAt'>) => void;
  updateFutureIdea: (id: string, updates: Partial<FutureIdea>) => void;
  deleteFutureIdea: (id: string) => void;

  updateSettings: (updates: Partial<Settings>) => void;

  createStudyPlan: (plan: Omit<StudyPlan, 'id' | 'createdAt'>) => string;
  updateStudyPlan: (id: string, updates: Partial<Omit<StudyPlan, 'id' | 'createdAt'>>) => void;
  deleteStudyPlan: (id: string) => void;
  addSlotTemplate: (template: Omit<SlotTemplate, 'id'>) => string;
  updateSlotTemplate: (planId: string, slotId: string, updates: Partial<SlotTemplate>) => void;
  deleteSlotTemplate: (planId: string, slotId: string) => void;
  generateAISuggestions: (studyPlanId: string) => Promise<void>;
  allocateTodosFromPlan: (studyPlanId: string, date: string) => void;

  getTodayStats: () => ReturnType<typeof dayStats>;
  getCategoryReports: () => CategoryReport[];
  getWeaknesses: () => ReturnType<typeof weaknesses>;
  getStreak: () => number;
}

const defaultSettings: Settings = {
  slotGranularityMins: 30,
  gracePeriodMins: 30,
  streakTargetPct: 80,
  dayStartTime: '06:00',
  dayEndTime: '23:00',
  aiBackendUrl: process.env.NEXT_PUBLIC_AI_BACKEND_URL || '',
  notificationsEnabled: false,
  onboardingComplete: false,
};

function todoSortValue(todo: Todo) {
  return todo.order ?? todo.updatedAt ?? todo.createdAt ?? 0;
}

function sortTodosByOrder(todos: Todo[]) {
  return [...todos].sort((left, right) => {
    const diff = todoSortValue(left) - todoSortValue(right);
    return diff !== 0 ? diff : left.createdAt - right.createdAt;
  });
}

function nextTodoOrder(todos: Todo[], dueDate: string) {
  const relevant = todos.filter((todo) => todo.dueDate === dueDate);
  const highest = relevant.reduce((max, todo) => Math.max(max, todoSortValue(todo)), -1);
  return highest + 1;
}

function parseTimeString(timeStr: string): string | null {
  const regex = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i;
  const match = timeStr.match(regex);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm) {
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}`;
}

function cleanDuplicates(
  todos: Todo[],
  currentDeletedIds: string[]
): { cleanedTodos: Todo[]; newDeletedIds: string[] } {
  const seenKeys = new Set<string>();
  const cleanedTodos: Todo[] = [];
  const deletedIds = [...currentDeletedIds];

  const sortedTodos = [...todos].sort((a, b) => b.updatedAt - a.updatedAt);

  for (const todo of sortedTodos) {
    let key = '';
    if (todo.timeSlotId) {
      key = `${todo.dueDate}_slot_${todo.timeSlotId}`;
    } else {
      key = `${todo.dueDate}_manual_${todo.title.toLowerCase().trim()}_${(todo.description ?? '').toLowerCase().trim()}`;
    }

    if (seenKeys.has(key)) {
      deletedIds.push(todo.id);
    } else {
      seenKeys.add(key);
      cleanedTodos.push(todo);
    }
  }

  cleanedTodos.sort((a, b) => a.createdAt - b.createdAt);

  return { cleanedTodos, newDeletedIds: deletedIds };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      categories: [],
      roadmapNodes: [],
      todos: [],
      dayPlans: [],
      notes: [],
      savedLinks: [],
      futureIdeas: [],
      shiftLogs: [],
      studyPlans: [],
      aiSuggestions: [],
      settings: defaultSettings,

      token: null,
      user: null,
      isSyncing: false,
      lastSyncAt: 0,
      deletedIds: [],
      syncPending: false,

      login: async (email, password) => {
        try {
          const response = await fetch(`${get().settings.aiBackendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }
          set({ token: data.token, user: data.user, deletedIds: [] });
          await get().syncWithCloud();
          return null;
        } catch (error) {
          console.error(error);
          return (error as Error).message || 'Login failed';
        }
      },

      googleLogin: async (credential, isMock = false, email = '', name = '') => {
        try {
          const response = await fetch(`${get().settings.aiBackendUrl}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential, isMock, email, name }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Google login failed');
          }
          set({ token: data.token, user: data.user, deletedIds: [] });
          await get().syncWithCloud();
          return null;
        } catch (error) {
          console.error(error);
          return (error as Error).message || 'Google login failed';
        }
      },

      registerPasskey: async (deviceName = 'My Device') => {
        try {
          const token = get().token;
          if (!token) throw new Error('Not logged in');

          const optionsRes = await fetch(`${get().settings.aiBackendUrl}/api/auth/passkey/register-challenge`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const options = await optionsRes.json();
          if (!optionsRes.ok) throw new Error(options.error || 'Failed to get passkey challenge');

          const challengeBuffer = Uint8Array.from(atob(options.challenge), (c: string) => c.charCodeAt(0));
          const userIdBuffer = Uint8Array.from(options.user.id, (c: string) => c.charCodeAt(0));

          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: challengeBuffer,
              rp: options.rp,
              user: {
                id: userIdBuffer,
                name: options.user.name,
                displayName: options.user.displayName,
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }],
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
              },
              timeout: 60000,
            }
          }) as PublicKeyCredential;

          if (!credential) throw new Error('Failed to create credential on device');

          const registerRes = await fetch(`${get().settings.aiBackendUrl}/api/auth/passkey/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              credentialId: credential.id,
              publicKey: 'device-public-key',
              deviceName
            })
          });

          const registerData = await registerRes.json();
          if (!registerRes.ok) throw new Error(registerData.error || 'Failed to save passkey');

          return null;
        } catch (error) {
          console.error(error);
          return (error as Error).message || 'Passkey registration failed';
        }
      },

      loginWithPasskey: async (email) => {
        try {
          const challengeRes = await fetch(`${get().settings.aiBackendUrl}/api/auth/passkey/login-challenge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const options = await challengeRes.json();
          if (!challengeRes.ok) throw new Error(options.error || 'Failed to get passkey options');

          const allowCredentials = options.allowCredentials.map((cred: any) => {
            const idBuffer = Uint8Array.from(cred.id, (c: string) => c.charCodeAt(0));
            return {
              id: idBuffer,
              type: cred.type
            };
          });

          const challengeBuffer = Uint8Array.from(atob(options.challenge), (c: string) => c.charCodeAt(0));

          const credential = await navigator.credentials.get({
            publicKey: {
              challenge: challengeBuffer,
              rpId: options.rpId,
              allowCredentials,
              userVerification: "required",
              timeout: 60000,
            }
          }) as PublicKeyCredential;

          if (!credential) throw new Error('Passkey verification failed on device');

          const loginRes = await fetch(`${get().settings.aiBackendUrl}/api/auth/passkey/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              credentialId: credential.id
            })
          });

          const loginData = await loginRes.json();
          if (!loginRes.ok) throw new Error(loginData.error || 'Failed to login with passkey');

          set({ token: loginData.token, user: loginData.user, deletedIds: [] });
          await get().syncWithCloud();
          return null;
        } catch (error) {
          console.error(error);
          return (error as Error).message || 'Passkey login failed';
        }
      },

      signup: async (email, password) => {
        try {
          const response = await fetch(`${get().settings.aiBackendUrl}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
          }
          set({ token: data.token, user: data.user, deletedIds: [] });
          await get().syncWithCloud();
          return null;
        } catch (error) {
          console.error(error);
          return (error as Error).message || 'Signup failed';
        }
      },

      requestPasswordResetOtp: async (email) => {
        try {
          const response = await fetch(`${get().settings.aiBackendUrl}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to request password reset');
          }
          return null;
        } catch (error) {
          console.error(error);
          return (error as Error).message || 'Failed to request password reset';
        }
      },

      resetPassword: async (email, otp, newPassword) => {
        try {
          const response = await fetch(`${get().settings.aiBackendUrl}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to reset password');
          }
          return null;
        } catch (error) {
          console.error(error);
          return (error as Error).message || 'Failed to reset password';
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          categories: [],
          roadmapNodes: [],
          todos: [],
          dayPlans: [],
          notes: [],
          savedLinks: [],
          futureIdeas: [],
          shiftLogs: [],
          deletedIds: [],
        });
      },

      syncWithCloud: async () => {
        const state = get();
        if (!state.token) return;
        if (state.isSyncing) {
          set({ syncPending: true });
          return;
        }

        const { cleanedTodos, newDeletedIds } = cleanDuplicates(state.todos, state.deletedIds);
        if (cleanedTodos.length !== state.todos.length) {
          set({ todos: cleanedTodos, deletedIds: newDeletedIds });
        }

        set({ isSyncing: true, syncPending: false });
        try {
          const currentState = get();
          const response = await fetch(`${currentState.settings.aiBackendUrl}/api/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentState.token}`,
            },
            body: JSON.stringify({
              categories: currentState.categories,
              roadmapNodes: currentState.roadmapNodes,
              todos: currentState.todos,
              dayPlans: currentState.dayPlans,
              notes: currentState.notes,
              savedLinks: currentState.savedLinks,
              futureIdeas: currentState.futureIdeas,
              shiftLogs: currentState.shiftLogs,
              studyPlans: currentState.studyPlans,
              aiSuggestions: currentState.aiSuggestions,
              settings: currentState.settings,
              deletedIds: currentState.deletedIds,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (!get().syncPending) {
              const { cleanedTodos: serverCleanedTodos } = cleanDuplicates(data.todos, []);
              set({
                categories: data.categories,
                roadmapNodes: data.roadmapNodes,
                todos: serverCleanedTodos,
                dayPlans: data.dayPlans,
                notes: data.notes,
                savedLinks: data.savedLinks,
                futureIdeas: data.futureIdeas,
                shiftLogs: data.shiftLogs,
                studyPlans: data.studyPlans ?? get().studyPlans,
                aiSuggestions: data.aiSuggestions ?? get().aiSuggestions,
                settings: data.settings,
                lastSyncAt: data.lastSyncAt,
              });
            }
            set({ deletedIds: [] });
          }
        } catch (error) {
          console.warn('Data Sync failed:', error);
        } finally {
          set({ isSyncing: false });
          if (get().syncPending) {
            get().syncWithCloud();
          }
        }
      },

      generateAndImportRoadmap: async (categoryId) => {
        const state = get();
        const category = state.categories.find((c) => c.id === categoryId);
        if (!category) return false;

        try {
          const response = await fetch(`${state.settings.aiBackendUrl}/api/ai/generate-roadmap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryName: category.name,
              description: category.description || 'General learning',
              userLevel: 'beginner',
              targetPacePerDayMins: category.targetPacePerDayMins || 60,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }

          const data = await response.json();
          if (data.roadmap && data.roadmap.length > 0) {
            get().importGeneratedRoadmap(categoryId, data.roadmap);
            return true;
          }
          return false;
        } catch (error) {
          console.warn('Failed to generate roadmap:', error);
          return false;
        }
      },

      addCategory: (cat) => {
        const newCat: Category = { ...cat, id: generateId('cat'), createdAt: Date.now() };
        set((state) => ({ categories: [...state.categories, newCat] }));
        get().syncWithCloud();
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        get().syncWithCloud();
      },

      deleteCategory: (id) => {
        set((state) => {
          const subnodes = state.roadmapNodes.filter((n) => n.categoryId === id);
          const subtodos = state.todos.filter((t) => t.categoryId === id);
          const toDelete = [id, ...subnodes.map((n) => n.id), ...subtodos.map((t) => t.id)];
          return {
            categories: state.categories.filter((c) => c.id !== id),
            roadmapNodes: state.roadmapNodes.filter((n) => n.categoryId !== id),
            todos: state.todos.filter((t) => t.categoryId !== id),
            deletedIds: [...state.deletedIds, ...toDelete],
          };
        });
        get().syncWithCloud();
      },

      addRoadmapNode: (node) => {
        const newNode: RoadmapNode = { ...node, id: generateId('node'), createdAt: Date.now() };
        set((state) => {
          let nodes = [...state.roadmapNodes, newNode];
          nodes = recomputeStatuses(nodes, node.categoryId);
          return { roadmapNodes: nodes };
        });
        get().syncWithCloud();
      },

      updateRoadmapNode: (id, updates) => {
        set((state) => {
          const nodes = state.roadmapNodes.map((n) => (n.id === id ? { ...n, ...updates } : n));
          const node = nodes.find((n) => n.id === id);
          if (!node) return { roadmapNodes: nodes };
          return { roadmapNodes: recomputeStatuses(nodes, node.categoryId) };
        });
        get().syncWithCloud();
      },

      deleteRoadmapSubtree: (nodeId) => {
        set((state) => {
          const node = state.roadmapNodes.find((n) => n.id === nodeId);
          if (!node) return {};
          const toDelete = subtreeIds(state.roadmapNodes, nodeId);
          const subtodos = state.todos.filter((t) => toDelete.includes(t.roadmapNodeId || ''));
          const idsDeleted = [...toDelete, ...subtodos.map((t) => t.id)];
          let nodes = state.roadmapNodes.filter((n) => !toDelete.includes(n.id));
          nodes = recomputeStatuses(nodes, node.categoryId);
          return {
            roadmapNodes: nodes,
            todos: state.todos.filter((t) => !toDelete.includes(t.roadmapNodeId || '')),
            deletedIds: [...state.deletedIds, ...idsDeleted],
          };
        });
        get().syncWithCloud();
      },

      moveRoadmapNode: (nodeId, newParentId, newOrder) => {
        set((state) => {
          const node = state.roadmapNodes.find((n) => n.id === nodeId);
          if (!node) return {};
          const siblings = childrenOf(state.roadmapNodes, newParentId);
          const nodes = state.roadmapNodes.map((n) => {
            if (n.id === nodeId) {
              return { ...n, parentId: newParentId, order: newOrder };
            }
            if (siblings.some((s) => s.id === n.id) && n.order >= newOrder && n.id !== nodeId) {
              return { ...n, order: n.order + 1 };
            }
            return n;
          });
          return { roadmapNodes: recomputeStatuses(nodes, node.categoryId) };
        });
        get().syncWithCloud();
      },

      setNodeCompleted: (nodeId, completed) => {
        set((state) => {
          const node = state.roadmapNodes.find((n) => n.id === nodeId);
          if (!node) return {};
          const nodes = state.roadmapNodes.map((n) =>
            n.id === nodeId ? { ...n, status: completed ? ('done' as const) : ('pending' as const) } : n
          );
          return { roadmapNodes: recomputeStatuses(nodes, node.categoryId) };
        });
        get().syncWithCloud();
      },

      importGeneratedRoadmap: (categoryId, nested) => {
        set((state) => {
          const newNodes = flattenNestedTree(nested, categoryId);
          const nodes = [...state.roadmapNodes, ...newNodes];
          return { roadmapNodes: recomputeStatuses(nodes, categoryId) };
        });
        get().syncWithCloud();
      },

      ensureDayPlan: (date) => {
        set((state) => {
          if (state.dayPlans.some((dp) => dp.date === date)) return {};
          const newPlan: DayPlan = {
            id: generateId('dp'),
            date,
            dayStartTimeHHMM: state.settings.dayStartTime,
            dayEndTimeHHMM: state.settings.dayEndTime,
            timeSlots: [],
            recurringRules: [],
            updatedAt: Date.now(),
          };
          return { dayPlans: [...state.dayPlans, newPlan] };
        });
        get().syncWithCloud();
      },

      addTimeSlot: (dayPlanId, slot) => {
        set((state) => ({
          dayPlans: state.dayPlans.map((dp) =>
            dp.id === dayPlanId
              ? { ...dp, timeSlots: [...dp.timeSlots, { ...slot, id: generateId('slot'), dayPlanId }], updatedAt: Date.now() }
              : dp
          ),
        }));
        get().syncWithCloud();
      },

      updateTimeSlot: (dayPlanId, slotId, updates) => {
        set((state) => ({
          dayPlans: state.dayPlans.map((dp) =>
            dp.id === dayPlanId
              ? { ...dp, timeSlots: dp.timeSlots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)), updatedAt: Date.now() }
              : dp
          ),
        }));
        get().syncWithCloud();
      },

      deleteTimeSlot: (dayPlanId, slotId) => {
        set((state) => {
          const subtodos = state.todos.filter((t) => t.timeSlotId === slotId);
          const idsDeleted = [slotId, ...subtodos.map((t) => t.id)];
          return {
            dayPlans: state.dayPlans.map((dp) =>
              dp.id === dayPlanId
                ? { ...dp, timeSlots: dp.timeSlots.filter((s) => s.id !== slotId), updatedAt: Date.now() }
                : dp
            ),
            todos: state.todos.filter((t) => t.timeSlotId !== slotId),
            deletedIds: [...state.deletedIds, ...idsDeleted],
          };
        });
        get().syncWithCloud();
      },

      addManualTodo: (todo) => {
        const timeRangeRegex = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i;
        const match = todo.title.match(timeRangeRegex);

        let cleanedTitle = todo.title.trim();
        let description = todo.description || '';
        let timeSlotId = todo.timeSlotId || null;

        if (match) {
          const startStr = parseTimeString(match[1]);
          const endStr = parseTimeString(match[2]);

          if (startStr && endStr) {
            const dayPlan = get().dayPlans.find((dp) => dp.date === todo.dueDate);
            const matchingSlot = dayPlan?.timeSlots.find((slot) => slot.startTime === startStr && slot.endTime === endStr);

            if (matchingSlot) {
              timeSlotId = matchingSlot.id;
            }

            cleanedTitle = todo.title.replace(match[0], '').replace(/\s+/g, ' ').trim();
            description = `${match[1]} - ${match[2]}`;
          }
        }

        const isDuplicate = get().todos.some(
          (t) => t.title.toLowerCase().trim() === cleanedTitle.toLowerCase().trim() && t.dueDate === todo.dueDate
        );
        if (isDuplicate) {
          if (typeof window !== 'undefined') {
            window.alert('A todo with this name already exists on this day.');
          }
          return;
        }

        const newTodo: Todo = {
          ...todo,
          title: cleanedTitle,
          description,
          timeSlotId,
          id: generateId('todo'),
          order: nextTodoOrder(get().todos, todo.dueDate),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ todos: [...state.todos, newTodo] }));
        get().syncWithCloud();
      },

      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? (() => {
                  const nextStatus = updates.status ?? t.status;
                  return {
                    ...t,
                    ...updates,
                    completedAt:
                      nextStatus === 'done'
                        ? (updates.completedAt ?? t.completedAt ?? Date.now())
                        : updates.status
                          ? null
                          : (updates.completedAt ?? t.completedAt),
                    updatedAt: Date.now(),
                  };
                })()
              : t
          ),
        }));
        get().syncWithCloud();
      },

      reorderTodos: (date, orderedIds) => {
        set((state) => {
          const dateTodos = sortTodosByOrder(state.todos.filter((todo) => todo.dueDate === date));
          const visibleIds = new Set(orderedIds);
          const draggedTodos = orderedIds
            .map((id) => dateTodos.find((todo) => todo.id === id))
            .filter((todo): todo is Todo => Boolean(todo));

          let draggedIndex = 0;
          const reorderedDateTodos = dateTodos.map((todo) => (visibleIds.has(todo.id) ? draggedTodos[draggedIndex++] : todo));

          const orderById = new Map(reorderedDateTodos.map((todo, index) => [todo.id, index]));

          return {
            todos: state.todos.map((todo) =>
              todo.dueDate === date
                ? { ...todo, order: orderById.get(todo.id) ?? todoSortValue(todo), updatedAt: Date.now() }
                : todo
            ),
          };
        });
        get().syncWithCloud();
      },

      setTodoStatus: (id, status) => {
        set((state) => {
          const todo = state.todos.find((t) => t.id === id);
          if (!todo) return {};

          const updatedTodos = state.todos.map((t) =>
            t.id === id ? { ...t, status, completedAt: status === 'done' ? Date.now() : null, updatedAt: Date.now() } : t
          );

          if (todo.roadmapNodeId) {
            const node = state.roadmapNodes.find((n) => n.id === todo.roadmapNodeId);
            if (node) {
              const newNodeStatus = status === 'done' ? ('done' as const) : ('pending' as const);
              const updatedNodes = state.roadmapNodes.map((n) =>
                n.id === todo.roadmapNodeId ? { ...n, status: newNodeStatus } : n
              );
              return { todos: updatedTodos, roadmapNodes: recomputeStatuses(updatedNodes, node.categoryId) };
            }
          }

          return { todos: updatedTodos };
        });
        get().syncWithCloud();
      },

      topicFitsSlot: (todoId) => {
        const state = get();
        const todo = state.todos.find((t) => t.id === todoId);
        if (!todo || !todo.roadmapNodeId || !todo.timeSlotId) return true;
        const node = state.roadmapNodes.find((n) => n.id === todo.roadmapNodeId);
        if (!node) return true;
        const slot = state.dayPlans.find((dp) => dp.date === todo.dueDate)?.timeSlots.find((s) => s.id === todo.timeSlotId);
        if (!slot) return true;
        const duration = slotDurationMins(slot.startTime, slot.endTime);
        return node.estimatedDurationMins <= duration;
      },

      resolveTodoCompletion: (id, fullyDone) => {
        const state = get();
        const todo = state.todos.find((t) => t.id === id);
        if (!todo) return;

        if (fullyDone || !todo.roadmapNodeId) {
          get().setTodoStatus(id, 'done');
          return;
        }

        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, status: 'done' as const, completedAt: Date.now(), updatedAt: Date.now() } : t)),
        }));

        const node = state.roadmapNodes.find((n) => n.id === todo.roadmapNodeId);
        if (node && node.status !== 'done') {
          get().updateRoadmapNode(node.id, { status: 'in_progress' });
        }

        const tomorrow = addDays(todo.dueDate, 1);
        get().ensureDayPlan(tomorrow);

        set((state) => {
          const todayPlan = state.dayPlans.find((dp) => dp.date === todo.dueDate);
          const currentSlot = todayPlan?.timeSlots.find((s) => s.id === todo.timeSlotId);
          const tomorrowPlan = state.dayPlans.find((dp) => dp.date === tomorrow);
          if (!tomorrowPlan) return {};

          let targetSlot = tomorrowPlan.timeSlots.find((s) => s.categoryId === todo.categoryId && s.type === 'study');
          let dayPlans = state.dayPlans;

          if (!targetSlot && currentSlot) {
            targetSlot = { ...currentSlot, id: generateId('slot'), dayPlanId: tomorrowPlan.id };
            const capturedSlot = targetSlot;
            dayPlans = dayPlans.map((dp) =>
              dp.id === tomorrowPlan.id ? { ...dp, timeSlots: [...dp.timeSlots, capturedSlot], updatedAt: Date.now() } : dp
            );
          }

          const continuationTodo: Todo = {
            id: generateId('todo'),
            categoryId: todo.categoryId,
            roadmapNodeId: todo.roadmapNodeId,
            title: todo.title,
            description: todo.description,
            status: 'pending',
            priority: todo.priority,
            dueDate: tomorrow,
            timeSlotId: targetSlot ? targetSlot.id : null,
            shiftCount: 0,
            order: nextTodoOrder(state.todos, tomorrow),
            checklist: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          return { dayPlans, todos: [...state.todos, continuationTodo] };
        });

        get().syncWithCloud();
      },

      toggleChecklistItem: (todoId, itemId) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? { ...t, checklist: t.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)), updatedAt: Date.now() }
              : t
          ),
        }));
        get().syncWithCloud();
      },

      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
          deletedIds: [...state.deletedIds, id],
        }));
        get().syncWithCloud();
      },

      autoArrangeTodosByTime: (date) => {
        set((state) => {
          const dateTodos = state.todos.filter((t) => t.dueDate === date);

          const getTodoMinutes = (todo: Todo) => {
            if (todo.timeSlotId) {
              const dayPlan = state.dayPlans.find((dp) => dp.date === date);
              const slot = dayPlan?.timeSlots.find((s) => s.id === todo.timeSlotId);
              if (slot) return timeToMins(slot.startTime);
            }
            if (todo.description) {
              const match = todo.description.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
              if (match) {
                const parsed = parseTimeString(match[1]);
                if (parsed) return timeToMins(parsed);
              }
            }
            return 24 * 60;
          };

          const sorted = [...dateTodos].sort((a, b) => getTodoMinutes(a) - getTodoMinutes(b));

          const updatedTodos = state.todos.map((t) => {
            if (t.dueDate === date) {
              const idx = sorted.findIndex((st) => st.id === t.id);
              return { ...t, order: idx };
            }
            return t;
          });

          return { todos: updatedTodos };
        });
        get().syncWithCloud();
      },

      generateToday: () => {
        const state = get();
        const today = todayISO();
        state.ensureDayPlan(today);
        const dayPlan = state.dayPlans.find((dp) => dp.date === today);
        if (dayPlan) {
          const result = generateDailyTodos(state.roadmapNodes, dayPlan, state.categories, state.todos);
          set({ todos: result.todos });
          get().syncWithCloud();
        }
      },

      runRescheduleNow: () => {
        const state = get();
        const result = runReschedule(state.todos, state.dayPlans, state.settings.gracePeriodMins);
        set({
          todos: result.todos,
          shiftLogs: [...state.shiftLogs, ...result.shiftLogs],
          dayPlans: [...state.dayPlans, ...result.newDayPlans],
        });
        get().syncWithCloud();
      },

      addNote: (note) => {
        const newNote: Note = { ...note, id: generateId('note'), createdAt: Date.now(), updatedAt: Date.now() };
        set((state) => ({ notes: [...state.notes, newNote] }));
        get().syncWithCloud();
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)),
        }));
        get().syncWithCloud();
      },

      deleteNote: (id) => {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id), deletedIds: [...state.deletedIds, id] }));
        get().syncWithCloud();
      },

      addLink: (link) => {
        const newLink: SavedLink = { ...link, id: generateId('link'), createdAt: Date.now() };
        set((state) => ({ savedLinks: [...state.savedLinks, newLink] }));
        get().syncWithCloud();
      },

      deleteLink: (id) => {
        set((state) => ({ savedLinks: state.savedLinks.filter((l) => l.id !== id), deletedIds: [...state.deletedIds, id] }));
        get().syncWithCloud();
      },

      addFutureIdea: (idea) => {
        const newIdea: FutureIdea = { ...idea, id: generateId('idea'), createdAt: Date.now() };
        set((state) => ({ futureIdeas: [...state.futureIdeas, newIdea] }));
        get().syncWithCloud();
      },

      deleteFutureIdea: (id) => {
        set((state) => ({ futureIdeas: state.futureIdeas.filter((i) => i.id !== id), deletedIds: [...state.deletedIds, id] }));
        get().syncWithCloud();
      },

      updateFutureIdea: (id, updates) => {
        set((state) => ({
          futureIdeas: state.futureIdeas.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
        get().syncWithCloud();
      },

      updateSettings: (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
        get().syncWithCloud();
      },

      getTodayStats: () => {
        const state = get();
        return dayStats(state.todos, todayISO());
      },

      getCategoryReports: () => {
        const state = get();
        return categoryReports(state.todos, state.categories, state.shiftLogs);
      },

      getWeaknesses: () => {
        const state = get();
        return weaknesses(state.todos, state.categories, state.shiftLogs);
      },

      getStreak: () => {
        const state = get();
        return streak(state.todos, state.settings.streakTargetPct, 30);
      },

      createStudyPlan: (planData) => {
        const id = generateId('plan');
        const newPlan: StudyPlan = {
          id,
          ...planData,
          slotTemplates: planData.slotTemplates ?? [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ studyPlans: [...state.studyPlans, newPlan] }));
        get().syncWithCloud();
        return id;
      },

      updateStudyPlan: (id, updates) => {
        set((state) => ({
          studyPlans: state.studyPlans.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p)),
        }));
        get().syncWithCloud();
      },

      deleteStudyPlan: (id) => {
        set((state) => ({
          studyPlans: state.studyPlans.filter((p) => p.id !== id),
          aiSuggestions: state.aiSuggestions.filter((s) => s.studyPlanId !== id),
          deletedIds: [...state.deletedIds, id],
        }));
        get().syncWithCloud();
      },

      addSlotTemplate: (template) => {
        const id = generateId('slot');
        const newSlot: SlotTemplate = { id, ...template };
        set((state) => ({
          studyPlans: state.studyPlans.map((p) =>
            p.id === template.studyPlanId ? { ...p, slotTemplates: [...p.slotTemplates, newSlot], updatedAt: Date.now() } : p
          ),
        }));
        get().syncWithCloud();
        return id;
      },

      updateSlotTemplate: (planId, slotId, updates) => {
        set((state) => ({
          studyPlans: state.studyPlans.map((p) =>
            p.id === planId
              ? { ...p, slotTemplates: p.slotTemplates.map((s) => (s.id === slotId ? { ...s, ...updates } : s)), updatedAt: Date.now() }
              : p
          ),
        }));
        get().syncWithCloud();
      },

      deleteSlotTemplate: (planId, slotId) => {
        set((state) => ({
          studyPlans: state.studyPlans.map((p) =>
            p.id === planId ? { ...p, slotTemplates: p.slotTemplates.filter((s) => s.id !== slotId), updatedAt: Date.now() } : p
          ),
        }));
        get().syncWithCloud();
      },

      generateAISuggestions: async (studyPlanId) => {
        const state = get();
        const plan = state.studyPlans.find((p) => p.id === studyPlanId);
        if (!plan) return;

        const payload = buildSuggestionsPromptPayload(plan, state.roadmapNodes, state.categories);

        try {
          const response = await fetch(`${state.settings.aiBackendUrl}/api/ai/ai-suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          const data = await response.json();

          const newSuggestion: AISuggestion = {
            id: generateId('sug'),
            studyPlanId,
            suggestions: data.suggestions ?? [],
            overallMessage: data.overallMessage ?? '',
            generatedAt: Date.now(),
          };

          set((state) => ({
            aiSuggestions: [...state.aiSuggestions.filter((s) => s.studyPlanId !== studyPlanId), newSuggestion],
          }));
          get().syncWithCloud();
        } catch (err) {
          console.warn('Failed to generate AI suggestions:', err);
        }
      },

      allocateTodosFromPlan: (studyPlanId, date) => {
        get().ensureDayPlan(date);

        const state = get();
        const plan = state.studyPlans.find((p) => p.id === studyPlanId);
        if (!plan) return;

        const templates = todaySlots(plan);

        const PREFIX = `tsp-${plan.id}-`;

        const dayPlan = get().dayPlans.find((dp) => dp.date === date);
        if (!dayPlan) return;

        const removedSlotIds = dayPlan.timeSlots.filter((ts) => (ts.slotTemplateId ?? '').startsWith(PREFIX)).map((ts) => ts.id);
        const removedTodoIds = state.todos
          .filter((t) => t.dueDate === date && (t.timeSlotId ?? '').startsWith(PREFIX))
          .map((t) => t.id);
        const idsDeleted = [...removedSlotIds, ...removedTodoIds];

        const retainedSlots = dayPlan.timeSlots.filter((ts) => !removedSlotIds.includes(ts.id));
        const retainedTodos = state.todos.filter((t) => !removedTodoIds.includes(t.id));

        const newTimeSlots: TimeSlot[] = [];
        const newTodos: Todo[] = [];
        const now = Date.now();

        for (const tmpl of templates) {
          const slotId = `${PREFIX}${tmpl.id}`;

          const tsType: TimeSlot['type'] = tmpl.slotType === 'break' ? 'break' : tmpl.slotType === 'other' ? 'other' : 'study';

          const timeSlot: TimeSlot = {
            id: slotId,
            dayPlanId: dayPlan.id,
            categoryId: tmpl.categoryIds[0] ?? '',
            startTime: tmpl.startTime,
            endTime: tmpl.endTime,
            isLocked: false,
            type: tsType,
            label: tmpl.label,
            slotTemplateId: slotId,
          };
          newTimeSlots.push(timeSlot);

          if (tmpl.slotType === 'break') continue;

          let todoTitle: string;
          let todoCategoryId: string;
          let todoRoadmapNodeId: string | null = null;
          let todoPriority: Todo['priority'] = 'medium';

          if (tmpl.categoryIds.length === 0 || tmpl.slotType === 'other') {
            todoTitle = tmpl.label;
            todoCategoryId = tmpl.categoryIds[0] ?? '';
            todoPriority = 'medium';
          } else {
            const node = pickNodeForSlot(tmpl, state.roadmapNodes, tmpl.categoryIds);
            if (node) {
              todoTitle = `${node.title}`;
              todoCategoryId = node.categoryId;
              todoRoadmapNodeId = node.id;
            } else {
              const cat = state.categories.find((c) => tmpl.categoryIds.includes(c.id));
              todoTitle = `Review ${cat ? cat.name : 'Subject'}`;
              todoCategoryId = tmpl.categoryIds[0] ?? '';
            }
            todoPriority = tmpl.slotType === 'big' ? 'high' : tmpl.slotType === 'medium' ? 'medium' : 'low';
          }

          const todo: Todo = {
            id: generateId('todo'),
            categoryId: todoCategoryId,
            roadmapNodeId: todoRoadmapNodeId,
            title: todoTitle,
            description: `${tmpl.label} · ${tmpl.startTime}–${tmpl.endTime} (${tmpl.durationMins} min)`,
            status: 'pending',
            priority: todoPriority,
            dueDate: date,
            timeSlotId: slotId,
            shiftCount: 0,
            checklist: [],
            createdAt: now,
            updatedAt: now,
          };
          newTodos.push(todo);
        }

        const allSlots = [...retainedSlots, ...newTimeSlots].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

        set((state) => ({
          dayPlans: state.dayPlans.map((dp) => (dp.date === date ? { ...dp, timeSlots: allSlots, updatedAt: Date.now() } : dp)),
          todos: [...retainedTodos, ...newTodos],
          deletedIds: [...state.deletedIds, ...idsDeleted],
        }));

        get().syncWithCloud();
      },
    }),
    {
      name: 'my-day-store-v1',
      skipHydration: true,
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null;
          const item = window.localStorage.getItem(key);
          if (!item) return null;
          try {
            const parsed = JSON.parse(item);
            if (parsed && parsed.state && Array.isArray(parsed.state.todos)) {
              const { cleanedTodos, newDeletedIds } = cleanDuplicates(parsed.state.todos, parsed.state.deletedIds || []);
              parsed.state.todos = cleanedTodos;
              parsed.state.deletedIds = newDeletedIds;
            }
            return parsed;
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return;
          window.localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return;
          window.localStorage.removeItem(key);
        },
      },
    }
  )
);
