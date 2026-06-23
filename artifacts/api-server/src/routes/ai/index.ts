import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AnalyzeRiskBody,
  AnalyzeRiskResponse,
  GenerateBreakdownBody,
  GenerateBreakdownResponse,
  GenerateRescuePlanBody,
  GenerateRescuePlanResponse,
  PrioritizeTasksBody,
  PrioritizeTasksResponse,
  AiChatBody,
  AiChatResponse,
} from "@workspace/api-zod";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

const MODEL = "gemini-2.5-flash-lite";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateJSON<T>(prompt: string, retries = 3): Promise<T> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as T;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if ((status === 503 || status === 429) && attempt < retries - 1) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

router.post("/analyze-risk", async (req, res): Promise<void> => {
  const parsed = AnalyzeRiskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, deadline, estimatedHours, priority, existingTaskCount } = parsed.data;

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const hoursUntilDeadline = Math.max(0, (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  const prompt = `You are a productivity AI analyzing deadline risk for a task.

Task: "${title}"
Description: "${description ?? "N/A"}"
Deadline: ${deadline} (${hoursUntilDeadline.toFixed(1)} hours from now)
Estimated effort: ${estimatedHours} hours
Priority: ${priority}
Other active tasks: ${existingTaskCount ?? 0}

Analyze the risk of missing this deadline and respond with JSON in this exact format:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskScore": <integer 0-100>,
  "reason": "<concise explanation of why this risk level was assigned, 1-2 sentences>",
  "suggestedAction": "<specific actionable advice for the user, 1-2 sentences>"
}

Risk guidelines:
- low: >3x estimated hours remaining, low priority
- medium: 1.5-3x estimated hours remaining, or medium priority with tight deadline  
- high: 1-1.5x estimated hours remaining, or high priority with less than 2 days
- critical: less than estimated hours remaining, or deadline within 12 hours`;

  try {
    const data = await generateJSON<{ riskLevel: string; riskScore: number; reason: string; suggestedAction: string }>(prompt);
    res.json(AnalyzeRiskResponse.parse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to analyze risk");
    res.status(500).json({ error: "Failed to analyze risk" });
  }
});

router.post("/breakdown", async (req, res): Promise<void> => {
  const parsed = GenerateBreakdownBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, estimatedHours } = parsed.data;

  const prompt = `You are a productivity AI that breaks tasks into actionable subtasks.

Task: "${title}"
Description: "${description ?? "N/A"}"
Total estimated time: ${estimatedHours ? `${estimatedHours} hours` : "unknown"}

Break this task into 4-8 concrete, actionable subtasks. Respond with JSON in this exact format:
{
  "subtasks": [
    {
      "title": "<concise subtask name>",
      "description": "<optional brief description or null>",
      "estimatedMinutes": <integer>,
      "order": <integer starting from 1>
    }
  ],
  "totalEstimatedMinutes": <integer sum of all subtask minutes>,
  "tips": "<one helpful productivity tip for completing this task, or null>"
}`;

  try {
    const data = await generateJSON<{ subtasks: unknown[]; totalEstimatedMinutes: number; tips: string | null }>(prompt);
    res.json(GenerateBreakdownResponse.parse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to generate breakdown");
    res.status(500).json({ error: "Failed to generate breakdown" });
  }
});

router.post("/rescue-plan", async (req, res): Promise<void> => {
  const parsed = GenerateRescuePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, deadline, estimatedHours } = parsed.data;

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const hoursUntilDeadline = Math.max(0, (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const currentHour = now.getHours();

  const prompt = `You are a productivity AI creating an emergency rescue plan for a critical deadline.

Task: "${title}"
Description: "${description ?? "N/A"}"
Deadline: ${deadline} (${hoursUntilDeadline.toFixed(1)} hours from now)
Estimated work required: ${estimatedHours} hours
Current time: ${now.toLocaleTimeString()} (hour ${currentHour})

Create a realistic hour-by-hour schedule starting from now to complete this task before the deadline.
Include short breaks. Be specific about what to do each hour.

Respond with JSON in this exact format:
{
  "sessions": [
    {
      "time": "<e.g. '6:00 PM', '7:00 PM'>",
      "activity": "<specific activity for this time slot>",
      "durationMinutes": <integer, typically 50-60>,
      "notes": "<optional helpful note or null>"
    }
  ],
  "estimatedCompletionTime": "<e.g. '11:30 PM tonight'>",
  "urgencyMessage": "<motivating but realistic message about the situation, 1-2 sentences>",
  "focusTips": "<2-3 focus tips for crunch time, or null>"
}

Generate ${Math.ceil(estimatedHours)} sessions plus a 5-min break every 2 hours.`;

  try {
    const data = await generateJSON<{ sessions: unknown[]; estimatedCompletionTime: string; urgencyMessage: string; focusTips: string | null }>(prompt);
    res.json(GenerateRescuePlanResponse.parse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to generate rescue plan");
    res.status(500).json({ error: "Failed to generate rescue plan" });
  }
});

router.post("/prioritize", async (req, res): Promise<void> => {
  const parsed = PrioritizeTasksBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tasks } = parsed.data;

  if (tasks.length === 0) {
    res.json(PrioritizeTasksResponse.parse({ tasks: [], overallStrategy: "No tasks to prioritize." }));
    return;
  }

  const taskList = tasks.map((t, i) => `${i + 1}. "${t.title}" — deadline: ${t.deadline}, effort: ${t.estimatedHours}h, priority: ${t.priority}, status: ${t.status ?? "pending"}`).join("\n");

  const prompt = `You are a productivity AI prioritizing tasks for maximum effectiveness.

Current tasks:
${taskList}

Today is ${new Date().toISOString().split("T")[0]}.

Prioritize these tasks and respond with JSON in this exact format:
{
  "tasks": [
    {
      "title": "<exact task title>",
      "rank": <integer starting from 1, 1 = highest priority>,
      "reasoning": "<1 sentence explaining why this rank>",
      "urgency": "<'immediate' | 'today' | 'this week' | 'flexible'>"
    }
  ],
  "overallStrategy": "<2-3 sentences with an overall productivity strategy for managing all these tasks>"
}`;

  try {
    const data = await generateJSON<{ tasks: unknown[]; overallStrategy: string }>(prompt);
    res.json(PrioritizeTasksResponse.parse(data));
  } catch (err) {
    req.log.error({ err }, "Failed to prioritize tasks");
    res.status(500).json({ error: "Failed to prioritize tasks" });
  }
});

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { messages, taskContext } = parsed.data;

  const systemPrompt = `You are an AI productivity coach called "Life Saver AI". You help users manage deadlines, prioritize tasks, and overcome procrastination. You are encouraging, practical, and specific. Keep responses concise (2-4 sentences usually) unless a detailed plan is requested.${taskContext ? `\n\nUser's current task context:\n${taskContext}` : ""}`;

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user" as const,
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { maxOutputTokens: 8192 },
      systemInstruction: systemPrompt,
    });
    let text: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage.content);
        text = result.response.text();
        break;
      } catch (err) {
        const status = (err as { status?: number }).status;
        if ((status === 503 || status === 429) && attempt < 2) {
          await sleep(2000 * (attempt + 1));
          continue;
        }
        throw err;
      }
    }
    res.json(AiChatResponse.parse({ message: text ?? "" }));
  } catch (err) {
    req.log.error({ err }, "Failed to generate chat response");
    res.status(500).json({ error: "Failed to generate chat response" });
  }
});

export default router;
