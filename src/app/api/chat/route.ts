import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '@/prompts/system';
import { aiTools } from '@/lib/llm/tools';
import { env, validateEnv } from '@/lib/config/env';

export async function POST(req: Request) {
  try {
    validateEnv();
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Sliding window: keep last 20 messages (system prompt is separate)
    const recentMessages = messages.slice(-20);

    const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });

    const result = streamText({
      model: openrouter.chat(env.OPENROUTER_MODEL),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(recentMessages),
      tools: aiTools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
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
