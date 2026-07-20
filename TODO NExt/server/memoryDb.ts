export interface MemoryPasskey {
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string;
}

export interface MemoryUser {
  _id: string;
  email: string;
  password?: string;
  name?: string;
  resetOtp?: string | null;
  resetOtpExpiresAt?: Date | null;
  passkeys?: MemoryPasskey[];
}

export interface MemoryUserData {
  userId: string;
  categories: unknown[];
  roadmapNodes: unknown[];
  todos: unknown[];
  dayPlans: unknown[];
  notes: unknown[];
  savedLinks: unknown[];
  futureIdeas: unknown[];
  shiftLogs: unknown[];
  studyPlans: unknown[];
  aiSuggestions: unknown[];
  markdownFiles?: unknown[];
  settings: Record<string, unknown>;
  lastSyncAt: number;
}

interface MemoryDb {
  users: MemoryUser[];
  userData: Record<string, MemoryUserData>;
}

declare global {
  var _memoryDb: MemoryDb | undefined;
}

export const memoryDb: MemoryDb = global._memoryDb ?? { users: [], userData: {} };
global._memoryDb = memoryDb;
