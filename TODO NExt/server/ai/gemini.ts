const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

async function callGemini(prompt: string, generationConfig?: Record<string, unknown>) {
  const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      ...(generationConfig ? { generationConfig } : {}),
    }),
  });
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function generateRoadmap(body: {
  categoryName: string;
  description: string;
  userLevel?: string;
  targetPacePerDayMins?: number;
}) {
  const { categoryName, description, userLevel = 'beginner', targetPacePerDayMins = 60 } = body;

  const prompt = `Create a structured chronological learning roadmap for "${categoryName}".
Description: ${description}
User Level: ${userLevel}
Target Study Pace: ${targetPacePerDayMins} minutes per day

Design the roadmap with:
1. Main topics representing major milestones or phases (e.g., "Month 1: Build the Foundation", "Month 2: Start Speaking Daily").
2. Subtopics representing specific actionable goals and daily/weekly tasks under that milestone (e.g., "Goal: Learn basic grammar and 500 words", "Read simple stories for 15 mins daily").

For example, a roadmap for "English Speaking" should look like:
- Main topic: "Month 1: Build the Foundation" (duration e.g., 1800 mins)
  - Subtopic: "Goal: Learn basic grammar and 500 common words" (duration 300 mins)
  - Subtopic: "Learn 15-20 new words every day" (duration 300 mins)
  - Subtopic: "Read simple English stories for 15 mins daily" (duration 300 mins)

Return ONLY a valid JSON array of topics with this structure:
[
  {
    "title": "Main Milestone Title (e.g. Month 1: ...)",
    "description": "General description of this phase",
    "estimatedDurationMins": 1800,
    "subtopics": [
      {
        "title": "Actionable task or Goal under this milestone",
        "description": "Brief explanation of how to practice it",
        "estimatedDurationMins": 300
      }
    ]
  }
]

No markdown, no code fences, just valid JSON.`;

  try {
    const text = await callGemini(prompt);
    let roadmap;
    try {
      roadmap = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    } catch {
      roadmap = [];
    }
    return { roadmap };
  } catch (error) {
    console.error('Gemini API error:', error);
    return { roadmap: [] };
  }
}

export async function generateDailyTodos(body: {
  title: string;
  description: string;
  slotDurationMins?: number;
}) {
  const { title, description, slotDurationMins = 30 } = body;

  const prompt = `Write a 2-sentence motivational and actionable blurb for a ${slotDurationMins}-minute learning session on "${title}".
Context: ${description}

Be specific, encouraging, and mention the time limit. No markdown, plain text only.`;

  try {
    const text = await callGemini(prompt);
    return { text };
  } catch (error) {
    console.error('Gemini API error:', error);
    return { text: '' };
  }
}

export async function generateTimetableSlots(body: {
  userPrompt?: string;
  planName?: string;
  durationMonths?: number;
  categories?: { name: string }[];
}) {
  const { userPrompt = '', planName = 'My Study Plan', durationMonths = 3, categories = [] } = body;

  const categoryText =
    categories.length > 0
      ? `Available Categories (you must match study slots to these names if applicable):\n${categories.map((c) => `- ${c.name}`).join('\n')}`
      : 'No specific categories available.';

  const prompt = `You are an expert study schedule designer. A student wants to create a smart daily timetable.

Plan: "${planName}" (${durationMonths} months)

${categoryText}

Student's request:
"${userPrompt}"

Based on this request, design or extract the full timetable slots.

CRITICAL INSTRUCTIONS:
1. If the student lists specific activities with exact times (e.g. freshen up, meditation, bath, study session, break, office hours, sleep, etc.), you MUST extract EVERY single one of them. Do not merge, skip, or omit any activity they explicitly list.
2. If the student's request is vague or general, design a balanced full-day schedule with 5-12 slots.
3. Translate all times (especially AM/PM formats) accurately to 24-hour format (HH:MM):
   - "6:00 AM" -> "06:00"
   - "6:15 AM" -> "06:15"
   - "6:20 AM" -> "06:20"
   - "7:00 AM" -> "07:00"
   - "7:30 AM" -> "07:30"
   - "7:45 AM" -> "07:45"
   - "9:15 AM" -> "09:15"
   - "9:30 AM" -> "09:30"
   - "11:00 AM" -> "11:00"
   - "11:30 AM" -> "11:30"
   - "10:00 PM" -> "22:00"
   - "10:30 PM" -> "22:30"
   - "11:30 PM" -> "23:30"
   - "12:15 AM" -> "00:15"
4. Assign correct slot types:
   - "big": Study blocks >= 2.5 hours
   - "medium": Study blocks 1.5 - 2.5 hours
   - "revision": Study blocks <= 1.5 hours meant for review/planning/reflecting
   - "break": Breaks, lunch, bath, meals, relaxation
   - "other": Morning routines, freshen up, meditation, office work, sleep, wind-down

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "slots": [
    {
      "label": "Freshen Up",
      "startTime": "06:15",
      "endTime": "06:20",
      "slotType": "other",
      "daysOfWeek": [],
      "categoryNames": []
    }
  ],
  "planSummary": "One sentence describing this schedule's philosophy"
}

Rules:
- Times must be in HH:MM 24-hour format
- Each slot must have label, startTime, endTime, slotType, daysOfWeek, categoryNames
- daysOfWeek should be [] (all days) unless specified otherwise
- categoryNames must contain exact category name strings from the "Available Categories" list above if they match the slot's study topic.
- Slots should not overlap.
- Ensure the start times are chronologically sorted.`;

  try {
    const text = await callGemini(prompt, { temperature: 0.7, maxOutputTokens: 2048 });
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return {
        slots: [
          { label: 'Morning Routine', startTime: '07:00', endTime: '08:30', slotType: 'other', daysOfWeek: [], categoryNames: [] },
          { label: 'Deep Study Block 1', startTime: '09:00', endTime: '12:00', slotType: 'big', daysOfWeek: [], categoryNames: categories.map((c) => c.name) },
          { label: 'Lunch & Rest', startTime: '12:00', endTime: '13:00', slotType: 'break', daysOfWeek: [], categoryNames: [] },
          { label: 'Practice & Exercises', startTime: '15:00', endTime: '17:00', slotType: 'medium', daysOfWeek: [], categoryNames: categories.map((c) => c.name) },
          { label: 'Evening Revision', startTime: '19:00', endTime: '21:00', slotType: 'revision', daysOfWeek: [], categoryNames: categories.map((c) => c.name) },
          { label: 'Wind Down', startTime: '21:30', endTime: '22:30', slotType: 'break', daysOfWeek: [], categoryNames: [] },
        ],
        planSummary: 'Balanced daily schedule with deep focus morning sessions and evening revision.',
      };
    }
  } catch (error) {
    console.error('Generate timetable slots error:', error);
    throw error;
  }
}

export async function generateAISuggestions(body: {
  planName?: string;
  durationMonths?: number;
  overallProgress?: number;
  categories?: { name: string; progress: number; totalTopics: number }[];
  todaySlots?: { label: string; time: string; durationMins: number; slotType: string }[];
}) {
  const {
    planName = 'Study Plan',
    durationMonths = 3,
    overallProgress = 0,
    categories = [],
    todaySlots = [],
  } = body;

  const categoryText = categories.map((c) => `  - ${c.name}: ${c.progress}% complete (${c.totalTopics} topics)`).join('\n');
  const slotsText = todaySlots.map((s) => `  - ${s.label} (${s.time}, ${s.durationMins} mins, type: ${s.slotType})`).join('\n');

  const prompt = `You are a smart study coach. A student has this study plan:

Plan: "${planName}"
Duration: ${durationMonths} months
Overall Progress: ${overallProgress}%

Categories and Progress:
${categoryText || '  - No categories assigned yet'}

Today's Schedule:
${slotsText || '  - No slots configured'}

Generate exactly 5 practical, personalized study tips for this student.
Each tip must be 1-2 sentences, specific to their progress and schedule.
Also write one short motivational message (max 20 words) for their overall journey.

Return ONLY valid JSON in this format:
{
  "suggestions": [
    "Tip 1 text here",
    "Tip 2 text here",
    "Tip 3 text here",
    "Tip 4 text here",
    "Tip 5 text here"
  ],
  "overallMessage": "Short motivational message here"
}

No markdown, no code fences, just valid JSON.`;

  try {
    const text = await callGemini(prompt);
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return {
        suggestions: [
          'Keep consistent with your daily study schedule.',
          'Review completed topics before moving to new ones.',
          'Take short breaks between study sessions.',
          'Focus on your weakest areas first each day.',
          'Track your progress regularly to stay motivated.',
        ],
        overallMessage: 'Every step forward brings you closer to your goal!',
      };
    }
  } catch (error) {
    console.error('AI Suggestions error:', error);
    throw error;
  }
}
