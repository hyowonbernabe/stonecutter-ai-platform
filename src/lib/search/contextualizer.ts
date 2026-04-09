import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { env } from '../config/env';

// ---------------------------------------------------------------------------
// Singleton OpenRouter provider (created lazily on first call)
// ---------------------------------------------------------------------------

let provider: ReturnType<typeof createOpenRouter> | null = null;

function getProvider() {
  if (!provider) {
    provider = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
  }
  return provider;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(documentText: string, chunkContent: string): string {
  return `<document>
${documentText}
</document>

<chunk>
${chunkContent}
</chunk>

Given the above document and chunk, write a short context (50-100 words) that situates this chunk within the document. The context should help a search engine understand what this chunk is about. Return ONLY the context text, nothing else.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a contextual prefix for a chunk using the LLM.
 * Returns the chunk content with the context prepended.
 *
 * If the LLM call fails, the original chunk content is returned unchanged.
 */
export async function contextualizeChunk(
  documentText: string,
  chunkContent: string,
): Promise<string> {
  try {
    const openrouter = getProvider();

    const { text } = await generateText({
      model: openrouter.chat(env.OPENROUTER_MODEL),
      prompt: buildPrompt(documentText, chunkContent),
    });

    const context = text.trim();
    if (!context) {
      return chunkContent;
    }

    return `${context}\n${chunkContent}`;
  } catch (error) {
    console.warn(
      '[contextualizer] LLM call failed, returning original chunk:',
      error instanceof Error ? error.message : error,
    );
    return chunkContent;
  }
}

/**
 * Contextualize all chunks for a document.
 * Calls the LLM once per chunk (sequentially to avoid rate limits).
 */
export async function contextualizeDocument(
  documentText: string,
  chunks: { content: string }[],
): Promise<string[]> {
  const results: string[] = [];

  for (const chunk of chunks) {
    const contextualized = await contextualizeChunk(documentText, chunk.content);
    results.push(contextualized);
  }

  return results;
}
