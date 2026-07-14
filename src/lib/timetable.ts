import { StudyPlan, SlotTemplate, RoadmapNode, Category, SlotType } from '@/types';
import { traversalOrder } from '@/lib/roadmap';

/** Parse "HH:MM" to minutes since midnight */
export function timeToMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Format minutes since midnight to "HH:MM" */
export function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Compute slot duration in minutes from start/end time strings */
export function slotDuration(startTime: string, endTime: string): number {
  return timeToMins(endTime) - timeToMins(startTime);
}

/** Infer slot type from duration if not explicitly set */
export function inferSlotType(durationMins: number): SlotType {
  if (durationMins >= 150) return 'big';
  if (durationMins >= 90) return 'medium';
  return 'revision';
}

/** Return today day-of-week key */
export function todayDow(): string {
  const d = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return d[new Date().getDay()];
}

/** Filter slot templates active today */
export function todaySlots(plan: StudyPlan): SlotTemplate[] {
  const dow = todayDow();
  return plan.slotTemplates.filter((s) => {
    if (s.daysOfWeek.length === 0) return true;
    return s.daysOfWeek.includes(dow as any);
  }).sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
}

/** Pick best unstarted roadmap node for a slot */
export function pickNodeForSlot(
  slot: SlotTemplate,
  nodes: RoadmapNode[],
  categoryIds: string[]
): RoadmapNode | null {
  const effectiveType = slot.slotType === 'other' || slot.slotType === 'break'
    ? null : slot.slotType;

  const candidates = categoryIds.flatMap((catId) => {
    const catNodes = nodes.filter(
      (n) => n.categoryId === catId && (n.status === 'pending' || n.status === 'in_progress')
    );
    return traversalOrder(catNodes, catId).filter(
      (n) => n.status === 'pending' || n.status === 'in_progress'
    );
  });

  if (candidates.length === 0) return null;

  if (effectiveType === 'revision') {
    const done = categoryIds.flatMap((catId) =>
      nodes.filter((n) => n.categoryId === catId && n.status === 'done')
    );
    return done.length > 0 ? done[done.length - 1] : candidates[0];
  }

  if (effectiveType === 'big') {
    const big = candidates.filter((n) => n.parentId === null || n.estimatedDurationMins >= 90);
    return big[0] ?? candidates[0];
  }

  if (effectiveType === 'medium') {
    const medium = candidates.filter((n) => n.parentId !== null && n.estimatedDurationMins < 90);
    return medium[0] ?? candidates[0];
  }

  return candidates[0];
}

/** Compute overall progress percentage for given categoryIds */
export function overallProgress(nodes: RoadmapNode[], categoryIds: string[]): number {
  const relevant = nodes.filter((n) => categoryIds.includes(n.categoryId));
  if (relevant.length === 0) return 0;
  const done = relevant.filter((n) => n.status === 'done').length;
  return Math.round((done / relevant.length) * 100);
}

/** Build AI suggestions prompt payload */
export function buildSuggestionsPromptPayload(
  plan: StudyPlan,
  nodes: RoadmapNode[],
  categories: Category[]
): object {
  const allCatIds = [...new Set(plan.slotTemplates.flatMap((s) => s.categoryIds))];
  const progressPct = overallProgress(nodes, allCatIds);

  const categoryBreakdown = allCatIds.map((catId) => {
    const cat = categories.find((c) => c.id === catId);
    const catNodes = nodes.filter((n) => n.categoryId === catId);
    const done = catNodes.filter((n) => n.status === 'done').length;
    const pct = catNodes.length > 0 ? Math.round((done / catNodes.length) * 100) : 0;
    return { name: cat?.name ?? catId, progress: pct, totalTopics: catNodes.length };
  });

  const todayStudySlots = todaySlots(plan).filter(
    (s) => s.slotType !== 'break' && s.slotType !== 'other'
  );

  return {
    planName: plan.name,
    durationMonths: plan.durationMonths,
    startDate: plan.startDate,
    endDate: plan.endDate,
    overallProgress: progressPct,
    categories: categoryBreakdown,
    todaySlots: todayStudySlots.map((s) => ({
      label: s.label,
      time: `${s.startTime}-${s.endTime}`,
      durationMins: s.durationMins,
      slotType: s.slotType,
    })),
  };
}

/** Parse human inputs like "6:00", "6:15 AM", "6 PM", "18:00" to "HH:MM" */
export function parseTimeToHHMM(input: string): string | null {
  let cleaned = input.trim().toLowerCase();
  if (!cleaned) return null;

  // Check for AM/PM indicators
  const isPM = cleaned.includes('pm');
  const isAM = cleaned.includes('am');

  // Strip non-digit and non-colon characters
  cleaned = cleaned.replace(/[^0-9:]/g, '');

  let hours = 0;
  let minutes = 0;

  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10) || 0;
  } else {
    // Single number like "6" or "18"
    hours = parseInt(cleaned, 10);
    minutes = 0;
  }

  if (isNaN(hours) || isNaN(minutes)) return null;

  // Handle 12-hour clock AM/PM adjustment
  if (isPM || isAM) {
    if (hours < 1 || hours > 12) return null;
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  return `${hStr}:${mStr}`;
}

/** Parses pasted timetable text (markdown table, CSV, etc.) into start/end times and activity labels */
export function parsePastedTimetable(text: string): { label: string; startTime: string; endTime: string }[] {
  const lines = text.split('\n');
  const results: { label: string; startTime: string; endTime: string }[] = [];

  for (let line of lines) {
    line = line.trim();
    // Skip empty lines, separators or table headers
    if (!line || line.startsWith('| ---') || line.toLowerCase().includes('time') && line.toLowerCase().includes('activity')) {
      continue;
    }

    // Replace markdown pipes with spaces
    let cleaned = line.replace(/\|/g, ' ').trim();

    // Match patterns like "6:15 AM - 6:20 AM" or "6:15 to 6:20" or "6:15 – 6:20 AM"
    const rangeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
    const singleRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;

    let startTime = "";
    let endTime = "";
    let activityText = "";

    const rangeMatch = cleaned.match(rangeRegex);
    if (rangeMatch) {
      startTime = rangeMatch[1].trim();
      endTime = rangeMatch[2].trim();
      activityText = cleaned.replace(rangeMatch[0], ' ').trim();
    } else {
      const singleMatch = cleaned.match(singleRegex);
      if (singleMatch) {
        startTime = singleMatch[1].trim();
        // Since there is only one time, default end time to start + 15 mins
        const parsedStart = parseTimeToHHMM(startTime);
        if (parsedStart) {
          const mins = timeToMins(parsedStart);
          endTime = minsToTime(mins + 15);
        } else {
          endTime = startTime;
        }
        activityText = cleaned.replace(singleMatch[0], ' ').trim();
      } else {
        continue;
      }
    }

    // Strip leading/trailing delimiters from the activity label
    activityText = activityText.replace(/^[:\-\s,]+|[:\-\s,]+$/g, '').trim();

    // Parse to normalized 24h formats
    const stdStart = parseTimeToHHMM(startTime);
    const stdEnd = parseTimeToHHMM(endTime);

    if (stdStart && stdEnd && activityText) {
      results.push({
        label: activityText,
        startTime: stdStart,
        endTime: stdEnd,
      });
    }
  }

  return results;
}
