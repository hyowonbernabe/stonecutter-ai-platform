import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'nomic-ai/nomic-embed-text-v1.5', {
      dtype: 'fp32',
    });
  }
  return extractor;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const ext = await getExtractor();
  const output = await ext(texts, { pooling: 'mean', normalize: true });
  return output.tolist() as number[][];
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
