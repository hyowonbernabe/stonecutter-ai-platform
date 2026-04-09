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

      // Handle empty/whitespace input gracefully
      if (!prompt.trim()) {
        return { output: 'It looks like your message was empty. How can I help you? I can assist with sales data, knowledge base lookups, and compliance reviews for PureVita, GlowHaven, and TailWag.' };
      }

      const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });

      const result = await generateText({
        model: openrouter.chat(env.OPENROUTER_MODEL),
        system: SYSTEM_PROMPT,
        prompt,
        tools: aiTools,
        stopWhen: stepCountIs(5),
      });

      // Primary: use the final synthesized text
      if (result.text.trim()) {
        return { output: result.text };
      }

      // Fallback: collect all text fragments and tool results from steps
      const parts: string[] = [];
      for (const step of result.steps) {
        if (step.text?.trim()) parts.push(step.text);
        if (step.toolResults) {
          for (const tr of step.toolResults) {
            parts.push(JSON.stringify(tr.result));
          }
        }
      }

      return { output: parts.join('\n') || '(No response generated)' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: message };
    }
  }
}
