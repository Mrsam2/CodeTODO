import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist } from "zustand/middleware";
import {
  Category,
  RoadmapNode,
  Todo,
  DayPlan,
  TimeSlot,
  RecurringRule,
  Note,
  SavedLink,
  FutureIdea,
  ShiftLog,
  Settings,
  NestedRoadmapNode,
  StudyPlan,
  SlotTemplate,
  AISuggestion,
} from "@/types";
import {
  traversalOrder,
  recomputeStatuses,
  flattenNestedTree,
  findFirstUnlockedIncompleteNode,
  childrenOf,
  subtreeIds,
  categoryCompletionPct,
} from "@/lib/roadmap";
import { generateDailyTodos } from "@/lib/scheduler";
import { runReschedule } from "@/lib/reschedule";
import {
  categoryReports,
  dayStats,
  streak,
  weaknesses,
  CategoryReport,
} from "@/lib/analytics";
import { todayISO, addDays, slotDurationMins } from "@/lib/dates";
import { generateId } from "@/lib/id";
import {
  buildSuggestionsPromptPayload,
  pickNodeForSlot,
  todaySlots,
  timeToMins,
} from "@/lib/timetable";

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

  // Auth & Sync State
  token: string | null;
  user: { id: string; email: string } | null;
  isSyncing: boolean;
  lastSyncAt: number;
  deletedIds: string[];
  syncPending: boolean;

  // Auth & Sync Actions
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  syncWithCloud: () => Promise<void>;
  requestPasswordResetOtp: (email: string) => Promise<string | null>;
  resetPassword: (
    email: string,
    otp: string,
    newPassword: string,
  ) => Promise<string | null>;

  // Category actions
  addCategory: (cat: Omit<Category, "id" | "createdAt">) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Roadmap actions
  addRoadmapNode: (node: Omit<RoadmapNode, "id" | "createdAt">) => void;
  updateRoadmapNode: (id: string, updates: Partial<RoadmapNode>) => void;
  deleteRoadmapSubtree: (nodeId: string) => void;
  moveRoadmapNode: (
    nodeId: string,
    newParentId: string | null,
    newOrder: number,
  ) => void;
  setNodeCompleted: (nodeId: string, completed: boolean) => void;
  importGeneratedRoadmap: (
    categoryId: string,
    nested: NestedRoadmapNode[],
  ) => void;
  generateAndImportRoadmap: (categoryId: string) => Promise<boolean>;

  // Day plan actions
  ensureDayPlan: (date: string) => void;
  addTimeSlot: (
    dayPlanId: string,
    slot: Omit<Omit<TimeSlot, "id">, "dayPlanId">,
  ) => void;
  updateTimeSlot: (
    dayPlanId: string,
    slotId: string,
    updates: Partial<TimeSlot>,
  ) => void;
  deleteTimeSlot: (dayPlanId: string, slotId: string) => void;

  // Todo actions
  addManualTodo: (todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  reorderTodos: (date: string, orderedIds: string[]) => void;
  setTodoStatus: (id: string, status: Todo["status"]) => void;
  toggleChecklistItem: (todoId: string, itemId: string) => void;
  deleteTodo: (id: string) => void;
  /** Does this todo's roadmap topic fit inside its assigned slot? */
  topicFitsSlot: (todoId: string) => boolean;
  /**
   * Complete a todo. `fullyDone` only matters when the linked roadmap topic
   * doesn't fit the slot: false keeps the topic in_progress and rolls a
   * continuation todo for the same topic onto tomorrow's matching slot.
   */
  resolveTodoCompletion: (id: string, fullyDone: boolean) => void;

  // Engine actions
  generateToday: () => void;
  runRescheduleNow: () => void;

  // Vault actions
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addLink: (link: Omit<SavedLink, "id" | "createdAt">) => void;
  deleteLink: (id: string) => void;
  addFutureIdea: (idea: Omit<FutureIdea, "id" | "createdAt">) => void;
  deleteFutureIdea: (id: string) => void;

  // Settings
  updateSettings: (updates: Partial<Settings>) => void;

  // Timetable actions
  createStudyPlan: (plan: Omit<StudyPlan, "id" | "createdAt">) => string;
  updateStudyPlan: (
    id: string,
    updates: Partial<Omit<StudyPlan, "id" | "createdAt">>,
  ) => void;
  deleteStudyPlan: (id: string) => void;
  addSlotTemplate: (template: Omit<SlotTemplate, "id">) => string;
  updateSlotTemplate: (
    planId: string,
    slotId: string,
    updates: Partial<SlotTemplate>,
  ) => void;
  deleteSlotTemplate: (planId: string, slotId: string) => void;
  generateAISuggestions: (studyPlanId: string) => Promise<void>;
  allocateTodosFromPlan: (studyPlanId: string, date: string) => void;

  // Analytics
  getTodayStats: () => any;
  getCategoryReports: () => CategoryReport[];
  getWeaknesses: () => any[];
  getStreak: () => number;
}

const defaultSettings: Settings = {
  slotGranularityMins: 30,
  gracePeriodMins: 30,
  streakTargetPct: 80,
  dayStartTime: "06:00",
  dayEndTime: "23:00",
  aiBackendUrl:
    process.env.EXPO_PUBLIC_AI_BACKEND_URL ||
    "https://code-todo-gq2y.vercel.app",
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
  const highest = relevant.reduce(
    (max, todo) => Math.max(max, todoSortValue(todo)),
    -1,
  );
  return highest + 1;
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

      // Auth & Sync Initial State
      token: null,
      user: null,
      isSyncing: false,
      lastSyncAt: 0,
      deletedIds: [],
      syncPending: false,

      // Auth Actions
      login: async (email, password) => {
        try {
          const response = await fetch(
            `${get().settings.aiBackendUrl}/api/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            },
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Login failed");
          }
          set({ token: data.token, user: data.user, deletedIds: [] });
          // Fetch initial data after login
          await get().syncWithCloud();
          return null;
        } catch (error: any) {
          console.error(error);
          return error.message || "Login failed";
        }
      },

      signup: async (email, password) => {
        try {
          const response = await fetch(
            `${get().settings.aiBackendUrl}/api/auth/signup`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            },
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Signup failed");
          }
          set({ token: data.token, user: data.user, deletedIds: [] });
          // Sync fresh state (which uploads any local offline onboarding details!)
          await get().syncWithCloud();
          return null;
        } catch (error: any) {
          console.error(error);
          return error.message || "Signup failed";
        }
      },

      requestPasswordResetOtp: async (email) => {
        try {
          const response = await fetch(
            `${get().settings.aiBackendUrl}/api/auth/forgot-password`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            },
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to request password reset");
          }
          return null;
        } catch (error: any) {
          console.error(error);
          return error.message || "Failed to request password reset";
        }
      },

      resetPassword: async (email, otp, newPassword) => {
        try {
          const response = await fetch(
            `${get().settings.aiBackendUrl}/api/auth/reset-password`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, otp, newPassword }),
            },
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to reset password");
          }
          return null;
        } catch (error: any) {
          console.error(error);
          return error.message || "Failed to reset password";
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

      // Sync Action
      syncWithCloud: async () => {
        const state = get();
        if (!state.token) return;
        if (state.isSyncing) {
          set({ syncPending: true });
          return;
        }

        set({ isSyncing: true, syncPending: false });
        try {
          const response = await fetch(
            `${state.settings.aiBackendUrl}/api/sync`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${state.token}`,
              },
              body: JSON.stringify({
                categories: state.categories,
                roadmapNodes: state.roadmapNodes,
                todos: state.todos,
                dayPlans: state.dayPlans,
                notes: state.notes,
                savedLinks: state.savedLinks,
                futureIdeas: state.futureIdeas,
                shiftLogs: state.shiftLogs,
                studyPlans: state.studyPlans,
                aiSuggestions: state.aiSuggestions,
                settings: state.settings,
                deletedIds: state.deletedIds,
              }),
            },
          );

          if (response.ok) {
            const data = await response.json();
            // Only apply server state if no local mutations occurred during the request
            if (!get().syncPending) {
              set({
                categories: data.categories,
                roadmapNodes: data.roadmapNodes,
                todos: data.todos,
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
            set({ deletedIds: [] }); // Clear deletedIds after successful sync
          }
        } catch (error) {
          console.warn("Data Sync failed:", error);
        } finally {
          set({ isSyncing: false });
          if (get().syncPending) {
            get().syncWithCloud();
          }
        }
      },

      // AI Roadmap Generator Trigger
      generateAndImportRoadmap: async (categoryId) => {
        const state = get();
        const category = state.categories.find((c) => c.id === categoryId);
        if (!category) return false;

        try {
          const response = await fetch(
            `${state.settings.aiBackendUrl}/generate-roadmap`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                categoryName: category.name,
                description: category.description || "General learning",
                userLevel: "beginner",
                targetPacePerDayMins: category.targetPacePerDayMins || 60,
              }),
            },
          );

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
          console.warn("Failed to generate roadmap:", error);
          return false;
        }
      },

      // Categories
      addCategory: (cat) => {
        const newCat: Category = {
          ...cat,
          id: generateId("cat"),
          createdAt: Date.now(),
        };
        set((state) => ({
          categories: [...state.categories, newCat],
        }));
        get().syncWithCloud();
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
        get().syncWithCloud();
      },

      deleteCategory: (id) => {
        set((state) => {
          const subnodes = state.roadmapNodes.filter(
            (n) => n.categoryId === id,
          );
          const subtodos = state.todos.filter((t) => t.categoryId === id);
          const toDelete = [
            id,
            ...subnodes.map((n) => n.id),
            ...subtodos.map((t) => t.id),
          ];
          return {
            categories: state.categories.filter((c) => c.id !== id),
            roadmapNodes: state.roadmapNodes.filter((n) => n.categoryId !== id),
            todos: state.todos.filter((t) => t.categoryId !== id),
            deletedIds: [...state.deletedIds, ...toDelete],
          };
        });
        get().syncWithCloud();
      },

      // Roadmap
      addRoadmapNode: (node) => {
        const newNode: RoadmapNode = {
          ...node,
          id: generateId("node"),
          createdAt: Date.now(),
        };
        set((state) => {
          let nodes = [...state.roadmapNodes, newNode];
          nodes = recomputeStatuses(nodes, node.categoryId);
          return { roadmapNodes: nodes };
        });
        get().syncWithCloud();
      },

      updateRoadmapNode: (id, updates) => {
        set((state) => {
          const nodes = state.roadmapNodes.map((n) =>
            n.id === id ? { ...n, ...updates } : n,
          );
          const node = nodes.find((n) => n.id === id);
          if (!node) return { roadmapNodes: nodes };
          return {
            roadmapNodes: recomputeStatuses(nodes, node.categoryId),
          };
        });
        get().syncWithCloud();
      },

      deleteRoadmapSubtree: (nodeId) => {
        set((state) => {
          const node = state.roadmapNodes.find((n) => n.id === nodeId);
          if (!node) return {};
          const toDelete = subtreeIds(state.roadmapNodes, nodeId);
          const subtodos = state.todos.filter((t) =>
            toDelete.includes(t.roadmapNodeId || ""),
          );
          const idsDeleted = [...toDelete, ...subtodos.map((t) => t.id)];
          let nodes = state.roadmapNodes.filter(
            (n) => !toDelete.includes(n.id),
          );
          nodes = recomputeStatuses(nodes, node.categoryId);
          return {
            roadmapNodes: nodes,
            todos: state.todos.filter(
              (t) => !toDelete.includes(t.roadmapNodeId || ""),
            ),
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
            if (
              siblings.some((s) => s.id === n.id) &&
              n.order >= newOrder &&
              n.id !== nodeId
            ) {
              return { ...n, order: n.order + 1 };
            }
            return n;
          });
          return {
            roadmapNodes: recomputeStatuses(nodes, node.categoryId),
          };
        });
        get().syncWithCloud();
      },

      setNodeCompleted: (nodeId, completed) => {
        set((state) => {
          const node = state.roadmapNodes.find((n) => n.id === nodeId);
          if (!node) return {};
          const nodes = state.roadmapNodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  status: completed ? ("done" as const) : ("pending" as const),
                }
              : n,
          );
          return {
            roadmapNodes: recomputeStatuses(nodes, node.categoryId),
          };
        });
        get().syncWithCloud();
      },

      importGeneratedRoadmap: (categoryId, nested) => {
        set((state) => {
          const newNodes = flattenNestedTree(nested, categoryId);
          const nodes = [...state.roadmapNodes, ...newNodes];
          return {
            roadmapNodes: recomputeStatuses(nodes, categoryId),
          };
        });
        get().syncWithCloud();
      },

      // Day Plans
      ensureDayPlan: (date) => {
        set((state) => {
          if (state.dayPlans.some((dp) => dp.date === date)) return {};
          const newPlan: DayPlan = {
            id: generateId("dp"),
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
              ? {
                  ...dp,
                  timeSlots: [
                    ...dp.timeSlots,
                    { ...slot, id: generateId("slot"), dayPlanId },
                  ],
                  updatedAt: Date.now(),
                }
              : dp,
          ),
        }));
        get().syncWithCloud();
      },

      updateTimeSlot: (dayPlanId, slotId, updates) => {
        set((state) => ({
          dayPlans: state.dayPlans.map((dp) =>
            dp.id === dayPlanId
              ? {
                  ...dp,
                  timeSlots: dp.timeSlots.map((s) =>
                    s.id === slotId ? { ...s, ...updates } : s,
                  ),
                  updatedAt: Date.now(),
                }
              : dp,
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
                ? {
                    ...dp,
                    timeSlots: dp.timeSlots.filter((s) => s.id !== slotId),
                    updatedAt: Date.now(),
                  }
                : dp,
            ),
            todos: state.todos.filter((t) => t.timeSlotId !== slotId),
            deletedIds: [...state.deletedIds, ...idsDeleted],
          };
        });
        get().syncWithCloud();
      },

      // Todos
      addManualTodo: (todo) => {
        const newTodo: Todo = {
          ...todo,
          id: generateId("todo"),
          order: nextTodoOrder(get().todos, todo.dueDate),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          todos: [...state.todos, newTodo],
        }));
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
                      nextStatus === "done"
                        ? (updates.completedAt ?? t.completedAt ?? Date.now())
                        : updates.status
                          ? null
                          : (updates.completedAt ?? t.completedAt),
                    updatedAt: Date.now(),
                  };
                })()
              : t,
          ),
        }));
        get().syncWithCloud();
      },

      reorderTodos: (date, orderedIds) => {
        set((state) => {
          const dateTodos = sortTodosByOrder(
            state.todos.filter((todo) => todo.dueDate === date),
          );
          const visibleIds = new Set(orderedIds);
          const draggedTodos = orderedIds
            .map((id) => dateTodos.find((todo) => todo.id === id))
            .filter((todo): todo is Todo => Boolean(todo));

          let draggedIndex = 0;
          const reorderedDateTodos = dateTodos.map((todo) =>
            visibleIds.has(todo.id) ? draggedTodos[draggedIndex++] : todo,
          );

          const orderById = new Map(
            reorderedDateTodos.map((todo, index) => [todo.id, index]),
          );

          return {
            todos: state.todos.map((todo) =>
              todo.dueDate === date
                ? {
                    ...todo,
                    order: orderById.get(todo.id) ?? todoSortValue(todo),
                    updatedAt: Date.now(),
                  }
                : todo,
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
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === "done" ? Date.now() : null,
                  updatedAt: Date.now(),
                }
              : t,
          );

          // Auto-sync roadmap node when a category task is completed / un-completed
          if (todo.roadmapNodeId) {
            const node = state.roadmapNodes.find(
              (n) => n.id === todo.roadmapNodeId,
            );
            if (node) {
              const newNodeStatus =
                status === "done" ? ("done" as const) : ("pending" as const);
              const updatedNodes = state.roadmapNodes.map((n) =>
                n.id === todo.roadmapNodeId
                  ? { ...n, status: newNodeStatus }
                  : n,
              );
              return {
                todos: updatedTodos,
                roadmapNodes: recomputeStatuses(updatedNodes, node.categoryId),
              };
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
        const node = state.roadmapNodes.find(
          (n) => n.id === todo.roadmapNodeId,
        );
        if (!node) return true;
        const slot = state.dayPlans
          .find((dp) => dp.date === todo.dueDate)
          ?.timeSlots.find((s) => s.id === todo.timeSlotId);
        if (!slot) return true;
        const duration = slotDurationMins(slot.startTime, slot.endTime);
        return node.estimatedDurationMins <= duration;
      },

      resolveTodoCompletion: (id, fullyDone) => {
        const state = get();
        const todo = state.todos.find((t) => t.id === id);
        if (!todo) return;

        // Nothing to negotiate: either genuinely finished, or not tied to a
        // roadmap topic at all (manual todo) — complete normally.
        if (fullyDone || !todo.roadmapNodeId) {
          get().setTodoStatus(id, "done");
          return;
        }

        // Topic wasn't fully covered in this slot: mark today's session done,
        // keep the roadmap topic in_progress, and roll a continuation todo
        // for the same topic onto tomorrow's matching category slot.
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: "done" as const,
                  completedAt: Date.now(),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));

        const node = state.roadmapNodes.find(
          (n) => n.id === todo.roadmapNodeId,
        );
        if (node && node.status !== "done") {
          get().updateRoadmapNode(node.id, { status: "in_progress" });
        }

        const tomorrow = addDays(todo.dueDate, 1);
        get().ensureDayPlan(tomorrow);

        set((state) => {
          const todayPlan = state.dayPlans.find(
            (dp) => dp.date === todo.dueDate,
          );
          const currentSlot = todayPlan?.timeSlots.find(
            (s) => s.id === todo.timeSlotId,
          );
          const tomorrowPlan = state.dayPlans.find(
            (dp) => dp.date === tomorrow,
          );
          if (!tomorrowPlan) return {};

          let targetSlot = tomorrowPlan.timeSlots.find(
            (s) => s.categoryId === todo.categoryId && s.type === "study",
          );
          let dayPlans = state.dayPlans;

          if (!targetSlot && currentSlot) {
            targetSlot = {
              ...currentSlot,
              id: generateId("slot"),
              dayPlanId: tomorrowPlan.id,
            };
            const capturedSlot = targetSlot;
            dayPlans = dayPlans.map((dp) =>
              dp.id === tomorrowPlan.id
                ? {
                    ...dp,
                    timeSlots: [...dp.timeSlots, capturedSlot],
                    updatedAt: Date.now(),
                  }
                : dp,
            );
          }

          const continuationTodo: Todo = {
            id: generateId("todo"),
            categoryId: todo.categoryId,
            roadmapNodeId: todo.roadmapNodeId,
            title: todo.title,
            description: todo.description,
            status: "pending",
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
              ? {
                  ...t,
                  checklist: t.checklist.map((item) =>
                    item.id === itemId ? { ...item, done: !item.done } : item,
                  ),
                  updatedAt: Date.now(),
                }
              : t,
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

      // Engines
      generateToday: () => {
        const state = get();
        const today = todayISO();
        state.ensureDayPlan(today);
        const dayPlan = state.dayPlans.find((dp) => dp.date === today);
        if (dayPlan) {
          const result = generateDailyTodos(
            state.roadmapNodes,
            dayPlan,
            state.categories,
            state.todos,
          );
          set({ todos: result.todos });
          get().syncWithCloud();
        }
      },

      runRescheduleNow: () => {
        const state = get();
        const result = runReschedule(
          state.todos,
          state.dayPlans,
          state.settings.gracePeriodMins,
        );
        set({
          todos: result.todos,
          shiftLogs: [...state.shiftLogs, ...result.shiftLogs],
          dayPlans: [...state.dayPlans, ...result.newDayPlans],
        });
        get().syncWithCloud();
      },

      // Vault
      addNote: (note) => {
        const newNote: Note = {
          ...note,
          id: generateId("note"),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          notes: [...state.notes, newNote],
        }));
        get().syncWithCloud();
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
          ),
        }));
        get().syncWithCloud();
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          deletedIds: [...state.deletedIds, id],
        }));
        get().syncWithCloud();
      },

      addLink: (link) => {
        const newLink: SavedLink = {
          ...link,
          id: generateId("link"),
          createdAt: Date.now(),
        };
        set((state) => ({
          savedLinks: [...state.savedLinks, newLink],
        }));
        get().syncWithCloud();
      },

      deleteLink: (id) => {
        set((state) => ({
          savedLinks: state.savedLinks.filter((l) => l.id !== id),
          deletedIds: [...state.deletedIds, id],
        }));
        get().syncWithCloud();
      },

      addFutureIdea: (idea) => {
        const newIdea: FutureIdea = {
          ...idea,
          id: generateId("idea"),
          createdAt: Date.now(),
        };
        set((state) => ({
          futureIdeas: [...state.futureIdeas, newIdea],
        }));
        get().syncWithCloud();
      },

      deleteFutureIdea: (id) => {
        set((state) => ({
          futureIdeas: state.futureIdeas.filter((i) => i.id !== id),
          deletedIds: [...state.deletedIds, id],
        }));
        get().syncWithCloud();
      },

      // Settings
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
        get().syncWithCloud();
      },

      // Analytics
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

      // --- Timetable Actions ---

      createStudyPlan: (planData) => {
        const id = generateId("plan");
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
          studyPlans: state.studyPlans.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p,
          ),
        }));
        get().syncWithCloud();
      },

      deleteStudyPlan: (id) => {
        set((state) => ({
          studyPlans: state.studyPlans.filter((p) => p.id !== id),
          aiSuggestions: state.aiSuggestions.filter(
            (s) => s.studyPlanId !== id,
          ),
          deletedIds: [...state.deletedIds, id],
        }));
        get().syncWithCloud();
      },

      addSlotTemplate: (template) => {
        const id = generateId("slot");
        const newSlot: SlotTemplate = { id, ...template };
        set((state) => ({
          studyPlans: state.studyPlans.map((p) =>
            p.id === template.studyPlanId
              ? {
                  ...p,
                  slotTemplates: [...p.slotTemplates, newSlot],
                  updatedAt: Date.now(),
                }
              : p,
          ),
        }));
        get().syncWithCloud();
        return id;
      },

      updateSlotTemplate: (planId, slotId, updates) => {
        set((state) => ({
          studyPlans: state.studyPlans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  slotTemplates: p.slotTemplates.map((s) =>
                    s.id === slotId ? { ...s, ...updates } : s,
                  ),
                  updatedAt: Date.now(),
                }
              : p,
          ),
        }));
        get().syncWithCloud();
      },

      deleteSlotTemplate: (planId, slotId) => {
        set((state) => ({
          studyPlans: state.studyPlans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  slotTemplates: p.slotTemplates.filter((s) => s.id !== slotId),
                  updatedAt: Date.now(),
                }
              : p,
          ),
        }));
        get().syncWithCloud();
      },

      generateAISuggestions: async (studyPlanId) => {
        const state = get();
        const plan = state.studyPlans.find((p) => p.id === studyPlanId);
        if (!plan) return;

        const payload = buildSuggestionsPromptPayload(
          plan,
          state.roadmapNodes,
          state.categories,
        );

        try {
          const response = await fetch(
            `${state.settings.aiBackendUrl}/ai-suggestions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          const data = await response.json();

          const newSuggestion: AISuggestion = {
            id: generateId("sug"),
            studyPlanId,
            suggestions: data.suggestions ?? [],
            overallMessage: data.overallMessage ?? "",
            generatedAt: Date.now(),
          };

          set((state) => ({
            aiSuggestions: [
              ...state.aiSuggestions.filter(
                (s) => s.studyPlanId !== studyPlanId,
              ),
              newSuggestion,
            ],
          }));
          get().syncWithCloud();
        } catch (err) {
          console.warn("Failed to generate AI suggestions:", err);
        }
      },

      allocateTodosFromPlan: (studyPlanId, date) => {
        // Ensure day plan exists first
        get().ensureDayPlan(date);

        const state = get();
        const plan = state.studyPlans.find((p) => p.id === studyPlanId);
        if (!plan) return;

        const templates = todaySlots(plan); // all slots for today, sorted by time

        // Prefix used to identify plan-generated slots/todos for idempotent re-allocation
        const PREFIX = `tsp-${plan.id}-`;

        // Find or look up today's day plan
        const dayPlan = get().dayPlans.find((dp) => dp.date === date);
        if (!dayPlan) return;

        // Remove previously generated slots & todos from this plan so re-clicking is safe
        const retainedSlots = dayPlan.timeSlots.filter(
          (ts) => !(ts.slotTemplateId ?? "").startsWith(PREFIX),
        );
        const retainedTodos = state.todos.filter(
          (t) =>
            !(t.dueDate === date && (t.timeSlotId ?? "").startsWith(PREFIX)),
        );

        const newTimeSlots: TimeSlot[] = [];
        const newTodos: Todo[] = [];
        const now = Date.now();

        for (const tmpl of templates) {
          const slotId = `${PREFIX}${tmpl.id}`;

          // Map slot type to TimeSlot type
          const tsType: TimeSlot["type"] =
            tmpl.slotType === "break"
              ? "break"
              : tmpl.slotType === "other"
                ? "other"
                : "study";

          const timeSlot: TimeSlot = {
            id: slotId,
            dayPlanId: dayPlan.id,
            categoryId: tmpl.categoryIds[0] ?? "",
            startTime: tmpl.startTime,
            endTime: tmpl.endTime,
            isLocked: false,
            type: tsType,
            label: tmpl.label,
            slotTemplateId: slotId, // mark as plan-generated
          };
          newTimeSlots.push(timeSlot);

          // Breaks get a schedule entry but no todo
          if (tmpl.slotType === "break") continue;

          let todoTitle: string;
          let todoCategoryId: string;
          let todoRoadmapNodeId: string | null = null;
          let todoPriority: Todo["priority"] = "medium";

          if (tmpl.categoryIds.length === 0 || tmpl.slotType === "other") {
            // Routine / daily habit slot (Exercise, Meditation, Wake Up, etc.)
            todoTitle = tmpl.label;
            todoCategoryId = tmpl.categoryIds[0] ?? "";
            todoPriority = "medium";
          } else {
            // Study slot — pick next roadmap node for the assigned categories
            const node = pickNodeForSlot(
              tmpl,
              state.roadmapNodes,
              tmpl.categoryIds,
            );
            if (node) {
              todoTitle = `${node.title}`;
              todoCategoryId = node.categoryId;
              todoRoadmapNodeId = node.id;
            } else {
              // Roadmap complete / no pending node — show a general review task
              const cat = state.categories.find((c) =>
                tmpl.categoryIds.includes(c.id),
              );
              todoTitle = `Review ${cat ? cat.name : "Subject"}`;
              todoCategoryId = tmpl.categoryIds[0] ?? "";
            }
            todoPriority =
              tmpl.slotType === "big"
                ? "high"
                : tmpl.slotType === "medium"
                  ? "medium"
                  : "low";
          }

          const todo: Todo = {
            id: generateId("todo"),
            categoryId: todoCategoryId,
            roadmapNodeId: todoRoadmapNodeId,
            title: todoTitle,
            description: `${tmpl.label} · ${tmpl.startTime}–${tmpl.endTime} (${tmpl.durationMins} min)`,
            status: "pending",
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

        // Sort new slots chronologically
        const allSlots = [...retainedSlots, ...newTimeSlots].sort(
          (a, b) => timeToMins(a.startTime) - timeToMins(b.startTime),
        );

        set((state) => ({
          dayPlans: state.dayPlans.map((dp) =>
            dp.date === date
              ? { ...dp, timeSlots: allSlots, updatedAt: Date.now() }
              : dp,
          ),
          todos: [...retainedTodos, ...newTodos],
        }));

        get().syncWithCloud();
      },
    }),
    {
      name: "my-day-store-v1",
      storage: {
        getItem: async (key) => {
          const item = await AsyncStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        },
      },
    },
  ),
);
