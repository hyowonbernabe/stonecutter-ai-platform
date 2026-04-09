import { pipeline, type FeatureExtractionPipeline, env as transformersEnv } from '@huggingface/transformers';

// Write model files to /tmp so they work in read-only serverless environments (Vercel)
transformersEnv.cacheDir = '/tmp/.transformers-cache';

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'nomic-ai/nomic-embed-text-v1.5', {
      dtype: 'q8',
    });
  }
  return extractor;
}

const BATCH_SIZE = 32;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const ext = await getExtractor();
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const output = await ext(batch, { pooling: 'mean', normalize: true });
    results.push(...(output.tolist() as number[][]));
  }
  return results;
}

export async function embedQuery(query: string): Promise<number[]> {
  const prefixed = `search_query: ${query}`;
  const [embedding] = await embedTexts([prefixed]);
  return embedding;
}

export async function embedDocuments(docs: string[]): Promise<number[][]> {
  const prefixed = docs.map((d) => `search_document: ${d}`);
  return embedTexts(prefixed);
}
