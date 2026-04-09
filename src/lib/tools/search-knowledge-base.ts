import { initializeSearchIndex, searchKnowledgeBase } from '../search';

export interface SearchKnowledgeBaseResult {
  chunks: { content: string; source: string; section: string }[];
  scores: number[];
}

/**
 * Search the knowledge base for information about SOPs, compliance,
 * brand guidelines, or competitive analysis.
 */
export async function searchKnowledgeBaseTool(
  query: string,
): Promise<SearchKnowledgeBaseResult> {
  await initializeSearchIndex();
  return searchKnowledgeBase(query, 5);
}
