import http from 'http';
import url from 'url';

const PORT = process.env.PORT || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

function enableCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function generateRoadmap(body) {
  const { categoryName, description, userLevel = 'beginner', targetPacePerDayMins = 60 } = body;

  const prompt = `Create a structured learning roadmap for "${categoryName}".
Description: ${description}
User Level: ${userLevel}
Target: ${targetPacePerDayMins} minutes per day

Return ONLY a valid JSON array of topics with this structure:
[
  {
    "title": "Topic title",
    "description": "Brief description",
    "estimatedDurationMins": 60,
    "subtopics": [
      {
        "title": "Subtopic",
        "description": "Brief description",
        "estimatedDurationMins": 30
      }
    ]
  }
]

No markdown, no code fences, just valid JSON.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

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

async function generateDailyTodos(body) {
  const { title, description, slotDurationMins = 30 } = body;

  const prompt = `Write a 2-sentence motivational and actionable blurb for a ${slotDurationMins}-minute learning session on "${title}".
Context: ${description}

Be specific, encouraging, and mention the time limit. No markdown, plain text only.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return { text };
  } catch (error) {
    console.error('Gemini API error:', error);
    return { text: '' };
  }
}

async function handleRequest(req, res) {
  enableCORS(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const pathname = url.parse(req.url).pathname;

  if (pathname === '/generate-roadmap' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const result = await generateRoadmap(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (pathname === '/generate-daily-todos' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const result = await generateDailyTodos(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`My Day AI proxy listening on port ${PORT}`);
  if (!GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY not set. AI features will not work.');
  }
});
