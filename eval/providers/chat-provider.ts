import 'dotenv/config';
import { generateText, isStepCount } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { SYSTEM_PROMPT } from '../../src/prompts/system';
import { aiTools } from '../../src/lib/llm/tools';
import { env, validateEnv } from '../../src/lib/config/env';

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

      const { text } = await generateText({
        model: openrouter.chat(env.OPENROUTER_MODEL),
        system: SYSTEM_PROMPT,
        prompt,
        tools: aiTools,
        stopWhen: isStepCount(5),
      });

      return { output: text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: message };
    }
  }
}
