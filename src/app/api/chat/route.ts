import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '@/prompts/system';
import { aiTools } from '@/lib/llm/tools';
import { env, validateEnv } from '@/lib/config/env';

// ---------------------------------------------------------------------------
// Rate limiter — in-memory, IP-based, 20 requests per 60-second window
// ---------------------------------------------------------------------------

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Periodic cleanup — prevent memory leak from stale entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(ip);
  }
}, RATE_WINDOW_MS);

// ---------------------------------------------------------------------------
// Input validation constants
// ---------------------------------------------------------------------------

const MAX_MESSAGE_LENGTH = 4_000;

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------

/** Strip HTML tags from user input to prevent injection via rendered output */
function sanitizeInput(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    // --- Rate limiting ---
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

    if (!checkRateLimit(ip)) {
      return Response.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 },
      );
    }

    validateEnv();

    const body = await req.json();
    const messages: UIMessage[] = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Invalid request: messages array is required.' },
        { status: 400 },
      );
    }

    // --- Validate latest user message ---
    const lastMessage = messages[messages.length - 1];
    const lastMessageText = Array.isArray(lastMessage.parts)
      ? lastMessage.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text ?? '')
          .join('')
      : '';

    if (!lastMessageText.trim()) {
      return Response.json(
        { error: 'Message cannot be empty.' },
        { status: 400 },
      );
    }

    if (lastMessageText.length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 },
      );
    }

    // --- Sanitize user messages (strip HTML tags) ---
    const sanitizedMessages = messages.map((msg: any) => {
      if (msg.role !== 'user') return msg;
      return {
        ...msg,
        parts: Array.isArray(msg.parts)
          ? msg.parts.map((p: any) =>
              p.type === 'text' ? { ...p, text: sanitizeInput(p.text ?? '') } : p,
            )
          : msg.parts,
      };
    });

    // Sliding window: keep last 20 messages (system prompt is separate)
    const recentMessages = sanitizedMessages.slice(-20);

    const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });

    const result = streamText({
      model: openrouter.chat(env.OPENROUTER_MODEL),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(recentMessages),
      tools: aiTools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        if (error instanceof Error) return error.message;
        return 'An unexpected error occurred.';
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('401') || message.includes('invalid') || message.includes('API key')) {
      return Response.json(
        { error: 'The API key is invalid or missing. Check your OPENROUTER_API_KEY in .env.' },
        { status: 401 },
      );
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return Response.json(
        { error: 'Rate limit reached. Please wait a moment and try again.' },
        { status: 429 },
      );
    }

    return Response.json(
      { error: "I couldn't reach the AI model right now. Please try again in a moment." },
      { status: 500 },
    );
  }
}
