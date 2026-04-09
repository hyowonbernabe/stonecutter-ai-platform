import fs from 'fs';
import path from 'path';
import { create, insertMultiple, search, getByID } from '@orama/orama';
import type { AnyOrama } from '@orama/orama';
import { persistToFile, restoreFromFile } from '@orama/plugin-data-persistence/server';
import { chunkDocuments, type Chunk } from './chunker';
import { contextualizeChunk } from './contextualizer';
import { embedDocuments, embedQuery } from '../embeddings';

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const ORAMA_SCHEMA = {
  chunk: 'string' as const,
  embedding: 'vector[768]' as const,
  source: 'string' as const,
  headers: 'string' as const,
  chunkIndex: 'number' as const,
  parentChunkId: 'string' as const,
  isParent: 'boolean' as const,
};

export interface SearchResult {
  chunks: { content: string; source: string; section: string }[];
  scores: number[];
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

const PERSISTENCE_DIR = path.join(process.cwd(), 'data', 'orama');
const PERSISTENCE_PATH = path.join(PERSISTENCE_DIR, 'index.msp');
const KNOWLEDGE_DIR = path.join(process.cwd(), 'data', 'knowledge');

let db: AnyOrama | null = null;

/**
 * Map of chunk IDs to their full chunk data.
 * Populated during ingestion so we can resolve parent chunks at search time
 * without relying on Orama's getByID (which returns the indexed document,
 * not the original content when contextual prefixes are added).
 */
let chunkMap: Map<string, Chunk> = new Map();

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the Orama search index.
 *
 * - If a persisted index exists on disk, it is loaded directly.
 * - Otherwise, the full ingestion pipeline runs: chunk, contextualize,
 *   embed, index, and persist to disk.
 *
 * The DB instance is cached in a module-level variable for reuse.
 */
export async function initializeSearchIndex(): Promise<void> {
  if (db) return; // Already initialized

  if (fs.existsSync(PERSISTENCE_PATH)) {
    console.log('[search] Loading persisted index from disk...');
    db = await restoreFromFile<AnyOrama>('binary', PERSISTENCE_PATH);
    await rebuildChunkMap();
    console.log('[search] Index loaded.');
    return;
  }

  console.log('[search] No persisted index found. Running full ingestion...');

  // Step 1: Chunk documents
  console.log('[search] Chunking documents...');
  const chunks = chunkDocuments(KNOWLEDGE_DIR);
  console.log(`[search] Created ${chunks.length} chunks.`);

  // Build the chunk map for parent resolution
  for (const chunk of chunks) {
    chunkMap.set(chunk.id, chunk);
  }

  // Step 2: Read full document texts for contextualization
  console.log('[search] Reading source documents...');
  const sourceTexts = new Map<string, string>();
  const sourceFiles = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  for (const file of sourceFiles) {
    const text = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
    sourceTexts.set(file, text);
  }

  // Step 3: Contextualize each chunk
  console.log('[search] Generating contextual prefixes...');
  const contextualizedTexts: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const docText = sourceTexts.get(chunk.source) ?? '';
    const contextualized = await contextualizeChunk(docText, chunk.content);
    contextualizedTexts.push(contextualized);

    if ((i + 1) % 10 === 0) {
      console.log(`[search] Contextualized ${i + 1}/${chunks.length} chunks.`);
    }
  }
  console.log(`[search] Contextualized all ${chunks.length} chunks.`);

  // Step 4: Embed all contextualized chunks
  console.log('[search] Generating embeddings...');
  const embeddings = await embedDocuments(contextualizedTexts);
  console.log(`[search] Generated ${embeddings.length} embeddings.`);

  // Step 5: Create Orama DB and insert documents
  console.log('[search] Indexing...');
  db = create({ schema: ORAMA_SCHEMA });

  const docs = chunks.map((chunk, i) => ({
    chunk: contextualizedTexts[i],
    embedding: embeddings[i],
    source: chunk.source,
    headers: chunk.headers,
    chunkIndex: chunk.chunkIndex,
    parentChunkId: chunk.parentChunkId ?? '',
    isParent: chunk.isParent,
  }));

  insertMultiple(db, docs);

  // Step 6: Persist to disk
  console.log('[search] Persisting index to disk...');
  fs.mkdirSync(PERSISTENCE_DIR, { recursive: true });
  await persistToFile(db, 'binary', PERSISTENCE_PATH);
  console.log('[search] Index persisted. Ingestion complete.');
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search the knowledge base using Orama hybrid search (BM25 + vector).
 *
 * If a child chunk is retrieved, its parent chunk is returned instead
 * (parent resolution) to provide more complete context.
 */
export async function searchKnowledgeBase(
  query: string,
  topK = 5,
): Promise<SearchResult> {
  await initializeSearchIndex();

  if (!db) {
    throw new Error('[search] Index not initialized.');
  }

  // Embed the query
  const queryEmbedding = await embedQuery(query);

  // Run hybrid search
  const results = search(db, {
    mode: 'hybrid',
    term: query,
    vector: {
      value: queryEmbedding,
      property: 'embedding',
    },
    similarity: 0.5,
    limit: topK,
  });

  // Normalize: search() may return sync or Promise
  const resolved = results instanceof Promise ? await results : results;

  // Resolve parent chunks: if a child is retrieved, return its parent's content
  const chunks: { content: string; source: string; section: string }[] = [];
  const scores: number[] = [];
  const seen = new Set<string>(); // Deduplicate parents

  for (const hit of resolved.hits) {
    const doc = hit.document as Record<string, unknown>;
    const isParent = doc.isParent as boolean;
    const parentChunkId = doc.parentChunkId as string;

    let content = doc.chunk as string;
    let source = doc.source as string;
    let section = doc.headers as string;

    // If it's a child chunk, resolve to the parent
    if (!isParent && parentChunkId) {
      // Try the in-memory chunk map first (has original un-contextualized content)
      const parentFromMap = chunkMap.get(parentChunkId);
      if (parentFromMap) {
        // Deduplicate: skip if we already included this parent
        if (seen.has(parentChunkId)) continue;
        seen.add(parentChunkId);

        content = parentFromMap.content;
        source = parentFromMap.source;
        section = parentFromMap.headers;
      } else {
        // Fallback: look up in the Orama DB
        const parentDoc = getByID(db, parentChunkId) as Record<string, unknown> | undefined;
        if (parentDoc) {
          const parentKey = parentChunkId;
          if (seen.has(parentKey)) continue;
          seen.add(parentKey);

          content = parentDoc.chunk as string;
          source = parentDoc.source as string;
          section = parentDoc.headers as string;
        }
      }
    } else if (isParent) {
      // Deduplicate parents that appear directly
      const hitId = hit.id;
      if (seen.has(hitId)) continue;
      seen.add(hitId);

      // Use original content from chunk map if available
      const originalChunk = findChunkBySourceAndIndex(source, doc.chunkIndex as number, true);
      if (originalChunk) {
        content = originalChunk.content;
      }
    }

    chunks.push({ content, source, section });
    scores.push(hit.score);
  }

  return { chunks, scores };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Rebuild the chunk map from the knowledge directory.
 * Used when loading a persisted index (the chunk map isn't persisted).
 */
async function rebuildChunkMap(): Promise<void> {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return;

  const chunks = chunkDocuments(KNOWLEDGE_DIR);
  chunkMap = new Map();
  for (const chunk of chunks) {
    chunkMap.set(chunk.id, chunk);
  }
}

/**
 * Find a chunk in the map by source file, chunk index, and parent flag.
 */
function findChunkBySourceAndIndex(
  source: string,
  chunkIndex: number,
  isParent: boolean,
): Chunk | undefined {
  for (const chunk of chunkMap.values()) {
    if (chunk.source === source && chunk.chunkIndex === chunkIndex && chunk.isParent === isParent) {
      return chunk;
    }
  }
  return undefined;
}
