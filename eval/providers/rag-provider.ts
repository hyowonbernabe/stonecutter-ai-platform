import 'dotenv/config';
import { searchKnowledgeBaseTool } from '../../src/lib/tools/search-knowledge-base.ts';

interface ProviderOptions {
  id?: string;
  config?: Record<string, unknown>;
}

interface ProviderResponse {
  output?: string;
  error?: string;
}

export default class RagProvider {
  private providerId: string;

  constructor(options: ProviderOptions) {
    this.providerId = options.id || 'rag-tool';
  }

  id(): string {
    return this.providerId;
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    try {
      const result = await searchKnowledgeBaseTool(prompt);
      return { output: JSON.stringify(result) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: message };
    }
  }
}
