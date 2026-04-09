import 'dotenv/config';
import { generateText, stepCountIs } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '../../src/prompts/system.ts';
import { aiTools } from '../../src/lib/llm/tools.ts';
import { env, validateEnv } from '../../src/lib/config/env.ts';

interface ProviderOptions {
  id?: string;
  config?: Record<string, unknown>;
}

interface ProviderResponse {
  output?: string;
  error?: string;
}

export default class ChatProvider {
  private providerId: string;

  constructor(options: ProviderOptions) {
    this.providerId = options.id || 'stonecutter-chat';
  }

  id(): string {
    return this.providerId;
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    try {
      validateEnv();

      const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });

      const { text, steps } = await generateText({
        model: openrouter.chat(env.OPENROUTER_MODEL),
        system: SYSTEM_PROMPT,
        prompt,
        tools: aiTools,
        stopWhen: stepCountIs(10),
      });

      // If text is empty/whitespace but tools were called, extract tool results as fallback
      if (!text.trim() && steps.length > 0) {
        const toolResults = steps
          .flatMap(s => s.toolResults ?? [])
          .map(r => JSON.stringify(r.result))
          .join('\n');
        return { output: toolResults || '(No response generated)' };
      }

      return { output: text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: message };
    }
  }
}
