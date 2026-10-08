import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Persistent Storage File Path
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'trackit_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with disk
let cachedStore: {
  activities?: any[];
  tools?: any[];
  entries?: any[];
  updatedAt?: string;
} = {};

if (fs.existsSync(DATA_FILE)) {
  try {
    cachedStore = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading data file, initializing empty store', err);
  }
}

// API Routes
app.get('/api/data', (req: Request, res: Response) => {
  res.json(cachedStore);
});

app.post('/api/data', (req: Request, res: Response) => {
  const { activities, tools, entries } = req.body;
  if (activities) cachedStore.activities = activities;
  if (tools) cachedStore.tools = tools;
  if (entries) cachedStore.entries = entries;
  cachedStore.updatedAt = new Date().toISOString();

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(cachedStore, null, 2));
  } catch (e) {
    console.error('Failed to write store to disk', e);
  }

  res.json({ success: true, count: cachedStore.entries?.length || 0 });
});

// Gemini AI Client Initialization (Server-side)
const hasValidKey = Boolean(
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
  process.env.GEMINI_API_KEY.trim().length > 5
);

let ai: GoogleGenAI | null = null;
if (hasValidKey) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), ms)),
  ]);
};

// Gemini AI Agent Endpoint
app.post('/api/gemini/agent', async (req: Request, res: Response) => {
  const { message, activities, tools, entries } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const currentDate = new Date().toISOString().split('T')[0];

  // Try calling Gemini model
  if (ai) {
    try {
      const systemInstruction = `You are the Trackit Master AI Agent.
You manage the user's precision tracking web app called Trackit.
Current Date: ${currentDate}.

You have 3 primary powers:
1. Log Data: If the user provides data (e.g. "I ran 5km", "add 45m upper body in fitness", "read 30 pages"), find the most relevant activity and tool from the provided lists, extract numerical values for categories or total, determine the date (default to ${currentDate}), and execute an "add_entry" action.
2. Create Activity or Tool: If the user wants to add an activity or a measurement tool (bar chart, pie chart, line chart, or counter), generate a "create_activity" or "create_tool" action.
3. Analytical Findings: If the user asks about progress, growth percentage, mode (most frequent value), mean/averages, or trends in any measurement tool, compute the exact mathematics based on the provided records and explain clearly and easily.

Existing Activities:
${JSON.stringify(
  (activities || []).map((a: any) => ({ id: a.id, name: a.name, category: a.category })),
  null,
  2
)}

Existing Measurement Tools:
${JSON.stringify(
  (tools || []).map((t: any) => ({
    id: t.id,
    activityId: t.activityId,
    name: t.name,
    type: t.type,
    categories: t.config?.categories,
    unit: t.config?.unit,
    target: t.config?.target,
  })),
  null,
  2
)}

Recent Stored Entries:
${JSON.stringify((entries || []).slice(0, 30), null, 2)}

You MUST output your response strictly as valid JSON with this format:
{
  "reply": "Your clear, friendly, and analytical markdown explanation",
  "action": {
    "type": "add_entry" | "create_activity" | "create_tool" | "analytics_report" | null,
    "details": "Short description of the action taken",
    "entryData"?: {
      "activityId": "id",
      "toolId": "id",
      "date": "YYYY-MM-DD",
      "time": "HH:mm",
      "values": { "category": number },
      "totalValue": number,
      "notes": "string"
    },
    "activityData"?: {
      "name": "string",
      "description": "string",
      "category": "string",
      "color": "hex",
      "icon": "Activity"
    },
    "toolData"?: {
      "activityId": "id",
      "name": "string",
      "purpose": "string",
      "type": "bar_chart" | "pie_chart" | "line_chart" | "counter",
      "config": {
        "categories": ["string"],
        "unit": "string",
        "yAxisLabel": "string",
        "target": number
      }
    }
  }
}
Do NOT include markdown backticks around the JSON.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        8000
      );

      const responseText = response.text || '{}';
      try {
        const parsed = JSON.parse(responseText);
        res.json(parsed);
        return;
      } catch (parseErr) {
        // Fallback to text wrap
        res.json({ reply: responseText, action: null });
        return;
      }
    } catch (apiErr: any) {
      console.warn('Gemini API call warning, falling back to local reasoning:', apiErr?.message);
    }
  }

  // Local AI Fallback Engine:
  // Handles logging, mode calculation, growth percent, and tool discovery offline or without API key!
  const lowerMsg = message.toLowerCase();

  // Check if user is asking for Mode or Growth %
  if (lowerMsg.includes('mode') || lowerMsg.includes('growth') || lowerMsg.includes('average') || lowerMsg.includes('trend')) {
    // Find relevant tool
    let targetTool = (tools || [])[0];
    for (const t of tools || []) {
      if (lowerMsg.includes(t.name.toLowerCase()) || lowerMsg.includes(t.type)) {
        targetTool = t;
        break;
      }
    }

    if (targetTool) {
      const toolEntries = (entries || [])
        .filter((e: any) => e.toolId === targetTool.id)
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

      const vals = toolEntries.map((e: any) => e.totalValue);
      const count = vals.length;
      const total = vals.reduce((a: number, b: number) => a + b, 0);
      const mean = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

      // Mode
      const freq: Record<number, number> = {};
      let maxFreq = 0;
      let modeVal: number | null = null;
      vals.forEach((v: number) => {
        freq[v] = (freq[v] || 0) + 1;
        if (freq[v] > maxFreq) {
          maxFreq = freq[v];
          modeVal = v;
        }
      });
      if (count > 1 && maxFreq === 1) modeVal = null;

      // Growth %
      let growth: number | null = null;
      if (count >= 2) {
        const first = vals[0];
        const last = vals[vals.length - 1];
        growth = first !== 0 ? Math.round(((last - first) / Math.abs(first)) * 1000) / 10 : (last > 0 ? 100 : 0);
      }

      res.json({
        reply: `### Statistical Findings for **${targetTool.name}**\n\n- **Mode (Most Frequent Value)**: ${modeVal !== null ? `**${modeVal} ${targetTool.config?.unit || ''}** (recorded ${maxFreq} times)` : '*No single repeated mode*'}\n- **Growth Percentage**: ${growth !== null ? `**${growth > 0 ? '+' : ''}${growth}%** from first record to latest` : '*Insufficient history for growth*'}\n- **Mean / Average**: **${mean} ${targetTool.config?.unit || ''}**\n- **Total Entries Recorded**: **${count}** entries (${total} ${targetTool.config?.unit || ''} total volume)\n- **Latest Recorded Value**: **${vals[vals.length - 1] ?? 'None'} ${targetTool.config?.unit || ''}**`,
        action: {
          type: 'analytics_report',
          details: `Computed analytical findings for ${targetTool.name}`,
        },
      });
      return;
    }
  }

  // Check if user is logging an entry (e.g. "log 45 mins", "did 50kg", "studied 3 hours")
  const numbersFound = message.match(/\d+(\.\d+)?/g);
  if (numbersFound && (lowerMsg.includes('log') || lowerMsg.includes('add') || lowerMsg.includes('track') || lowerMsg.includes('did') || lowerMsg.includes('ran') || lowerMsg.includes('workout') || lowerMsg.includes('studied') || lowerMsg.includes('read'))) {
    // Pick matched activity and tool
    let targetAct = (activities || [])[0];
    let targetTool = (tools || []).find((t: any) => t.activityId === targetAct?.id);

    for (const act of activities || []) {
      if (lowerMsg.includes(act.name.toLowerCase()) || lowerMsg.includes(act.category.toLowerCase())) {
        targetAct = act;
        break;
      }
    }

    const actTools = (tools || []).filter((t: any) => t.activityId === targetAct?.id);
    for (const t of actTools) {
      if (lowerMsg.includes(t.name.toLowerCase()) || lowerMsg.includes(t.type)) {
        targetTool = t;
        break;
      }
    }
    if (!targetTool && actTools.length > 0) targetTool = actTools[0];

    if (targetAct && targetTool) {
      const primaryVal = parseFloat(numbersFound[0]);
      const cats = targetTool.config?.categories || ['Value'];
      const values: Record<string, number> = {};

      if (cats.length > 1 && numbersFound.length >= cats.length) {
        cats.forEach((cat: string, i: number) => {
          values[cat] = parseFloat(numbersFound[i]) || 0;
        });
      } else {
        values[cats[0]] = primaryVal;
      }

      const totalValue = Object.values(values).reduce((a, b) => a + b, 0);

      res.json({
        reply: `Successfully recorded **${totalValue} ${targetTool.config?.unit || 'units'}** into **${targetAct.name}** under tool **${targetTool.name}** for date **${currentDate}**.\n\nYour dashboard and folder analytics have been updated automatically.`,
        action: {
          type: 'add_entry',
          details: `Logged ${totalValue} ${targetTool.config?.unit || ''} into ${targetTool.name}`,
          entryData: {
            activityId: targetAct.id,
            toolId: targetTool.id,
            date: currentDate,
            time: new Date().toTimeString().substring(0, 5),
            values,
            totalValue,
            notes: `Logged via AI Agent: "${message}"`,
          },
        },
      });
      return;
    }
  }

  // General conversational assistance
  res.json({
    reply: `I am your **Trackit AI Assistant**. You can tell me what you did or ask me any statistical inquiry:\n\n1. **Voice or Text Logging**: Say *"Log 45m upper body and 20m cardio today in Fitness"* or *"Add 30 pages read"*\n2. **Statistical Insights**: Ask *"What is the mode or growth percent in Fitness?"* or *"Analyze my coding trends"*\n3. **Folder Management**: Say *"Create a new activity called Meditation"* or *"Add a pie chart tool for Nutrition"*`,
    action: null,
  });
});

// Audio Transcription Endpoint using gemini-3.5-transcribe
app.post('/api/transcribe', async (req: Request, res: Response) => {
  const { audioData, mimeType = 'audio/webm' } = req.body;

  if (!audioData) {
    res.status(400).json({ error: 'audioData base64 string is required' });
    return;
  }

  if (ai) {
    // Attempt transcription with model gemini-3.5-transcribe as requested
    try {
      const transcribeResponse = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: audioData,
                  },
                },
                {
                  text: 'Transcribe the spoken audio verbatim. Return only the transcribed text without extra preamble or markdown tags.',
                },
              ],
            },
          ],
        }),
        12000
      );

      const transcript = transcribeResponse.text?.trim() || '';
      if (transcript) {
        res.json({ transcript, model: 'gemini-3.5-transcribe' });
        return;
      }
    } catch (transcribeErr: any) {
      console.warn('gemini-3.5-transcribe model attempt failed, attempting fallback model:', transcribeErr?.message);
      try {
        const fallbackResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: audioData,
                    },
                  },
                  {
                    text: 'Transcribe the spoken audio verbatim. Return only the transcribed text without commentary.',
                  },
                ],
              },
            ],
          }),
          10000
        );
        const transcript = fallbackResponse.text?.trim() || '';
        res.json({ transcript, model: 'gemini-3.8-flash' });
        return;
      } catch (fallbackErr: any) {
        console.error('All Gemini audio transcription calls failed:', fallbackErr?.message);
      }
    }
  }

  res.status(500).json({ error: 'Audio transcription failed. Please check Gemini API configuration.' });
});

// Mount Vite or serve static
const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trackit fullstack application listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
