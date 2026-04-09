// @huggingface/transformers is loaded via dynamic import so that the module
// remains importable on Vercel Lambdas where the 535MB package cannot fit
// in the 250MB deployment bundle. When unavailable, embedQuery returns null
// and search falls back to BM25-only mode.

let extractor: any = null;
let unavailable = false;

async function getExtractor(): Promise<any | null> {
  if (unavailable) return null;
  if (extractor) return extractor;
  try {
    const { pipeline, env: transformersEnv } = await import('@huggingface/transformers');
    // Write model cache to /tmp so it works in serverless read-only environments
    (transformersEnv as any).cacheDir = '/tmp/.transformers-cache';
    extractor = await pipeline('feature-extraction', 'nomic-ai/nomic-embed-text-v1.5', {
      dtype: 'q8',
    });
    return extractor;
  } catch {
    console.warn('[embeddings] @huggingface/transformers unavailable — using text-only search');
    unavailable = true;
    return null;
  }
}

const BATCH_SIZE = 32;

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const ext = await getExtractor();
  if (!ext) return null;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const output = await ext(batch, { pooling: 'mean', normalize: true });
    results.push(...(output.tolist() as number[][]));
  }
  return results;
}

export async function embedQuery(query: string): Promise<number[] | null> {
  const prefixed = `search_query: ${query}`;
  const result = await embedTexts([prefixed]);
  return result ? result[0] : null;
}

export async function embedDocuments(docs: string[]): Promise<number[][] | null> {
  const prefixed = docs.map((d) => `search_document: ${d}`);
  return embedTexts(prefixed);
}
