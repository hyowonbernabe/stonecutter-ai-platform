import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Chunk {
  id: string;
  content: string;
  source: string;
  headers: string;
  chunkIndex: number;
  parentChunkId: string | null;
  isParent: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple word-count token estimation (good enough for English). */
function countTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Derive a URL-friendly slug from a filename (without extension). */
function slugify(filename: string): string {
  return filename
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// Layer 2: Recursive sub-chunking
// ---------------------------------------------------------------------------

const SEPARATOR_HIERARCHY = ['\n\n', '\n', '. ', ' '];

/**
 * Recursively split `text` so every piece is at most `maxTokens` tokens.
 * Uses a separator hierarchy to find the best split point.
 */
function recursiveSplit(
  text: string,
  maxTokens: number,
  separatorIndex = 0,
): string[] {
  if (countTokens(text) <= maxTokens) return [text];
  if (separatorIndex >= SEPARATOR_HIERARCHY.length) return [text]; // can't split further

  const sep = SEPARATOR_HIERARCHY[separatorIndex];
  const parts = text.split(sep);

  if (parts.length <= 1) {
    // This separator doesn't appear — try the next one
    return recursiveSplit(text, maxTokens, separatorIndex + 1);
  }

  // Greedily merge parts until we hit the token limit
  const merged: string[] = [];
  let current = parts[0];

  for (let i = 1; i < parts.length; i++) {
    const candidate = current + sep + parts[i];
    if (countTokens(candidate) <= maxTokens) {
      current = candidate;
    } else {
      merged.push(current);
      current = parts[i];
    }
  }
  merged.push(current);

  // Any piece still over budget? Recurse with the next separator
  const result: string[] = [];
  for (const piece of merged) {
    if (countTokens(piece) > maxTokens) {
      result.push(...recursiveSplit(piece, maxTokens, separatorIndex + 1));
    } else {
      result.push(piece);
    }
  }
  return result;
}

/**
 * Split text into child-sized pieces with overlap.
 * Target: 128-256 tokens, ~50 token overlap.
 */
function splitIntoChildren(text: string): string[] {
  const pieces = recursiveSplit(text, 256);

  if (pieces.length <= 1) return pieces;

  // Add overlap: prepend the tail of the previous piece to each subsequent piece
  const withOverlap: string[] = [pieces[0]];
  for (let i = 1; i < pieces.length; i++) {
    const prevWords = pieces[i - 1].split(/\s+/).filter(Boolean);
    const overlapWords = prevWords.slice(-50).join(' ');
    withOverlap.push(overlapWords + '\n' + pieces[i]);
  }
  return withOverlap;
}

// ---------------------------------------------------------------------------
// Layer 1: Markdown structure-aware splitting
// ---------------------------------------------------------------------------

interface Section {
  headers: string; // breadcrumb path
  content: string; // raw section text (without the header line itself)
}

/**
 * Parse a markdown document into sections split on `##` headers.
 * Each section gets a full breadcrumb path from the `#` title + any `##`/`###` ancestry.
 */
function parseMarkdown(text: string): { title: string; sections: Section[] } {
  const lines = text.split('\n');

  // Extract the # title (first h1)
  let title = '';
  let titleLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^# /.test(lines[i])) {
      title = lines[i].replace(/^# /, '').trim();
      titleLineIndex = i;
      break;
    }
  }

  // Everything between the title and the first ## is the preamble
  const sections: Section[] = [];
  let currentH2 = '';
  let currentH3 = '';
  let currentContent: string[] = [];

  function flushSection() {
    const content = currentContent.join('\n').trim();
    if (!content) return;

    const parts = [title];
    if (currentH2) parts.push(currentH2);
    if (currentH3) parts.push(currentH3);
    const headers = parts.join(' > ');

    sections.push({ headers, content });
  }

  for (let i = titleLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    if (/^## /.test(line)) {
      flushSection();
      currentH2 = line.replace(/^## /, '').trim();
      currentH3 = '';
      currentContent = [];
    } else if (/^### /.test(line)) {
      flushSection();
      currentH3 = line.replace(/^### /, '').trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  flushSection();

  return { title, sections };
}

/**
 * Merge small sections (< 100 tokens) with the next sibling.
 */
function mergeSmallSections(sections: Section[]): Section[] {
  if (sections.length === 0) return [];

  const merged: Section[] = [];
  let pending: Section | null = null;

  for (const section of sections) {
    if (pending) {
      // Merge pending into this section
      merged.push({
        headers: pending.headers,
        content: pending.content + '\n\n' + section.content,
      });
      pending = null;
    } else if (countTokens(section.content) < 100) {
      pending = section;
    } else {
      merged.push(section);
    }
  }

  // If the last section was small and still pending, just add it
  if (pending) {
    if (merged.length > 0) {
      const last = merged[merged.length - 1];
      merged[merged.length - 1] = {
        headers: last.headers,
        content: last.content + '\n\n' + pending.content,
      };
    } else {
      merged.push(pending);
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Layer 3: Parent-child indexing + main export
// ---------------------------------------------------------------------------

/**
 * Process all `.md` files in `docsDir` and return parent + child chunks.
 */
export function chunkDocuments(docsDir: string): Chunk[] {
  const resolvedDir = path.resolve(docsDir);
  const files = fs.readdirSync(resolvedDir).filter((f) => f.endsWith('.md')).sort();
  const allChunks: Chunk[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(resolvedDir, file), 'utf-8');
    const slug = slugify(file);
    const { sections } = parseMarkdown(raw);
    const merged = mergeSmallSections(sections);

    let chunkIndex = 0;

    for (const section of merged) {
      const parentId = `${slug}_${chunkIndex}_parent`;

      // Parent chunk: the full section, trimmed to ~512 tokens via recursive split.
      // If the section is already <= 512 tokens, use it as-is.
      // If larger, the parent is the first ~512-token chunk of the section.
      const parentContent =
        countTokens(section.content) <= 512
          ? section.content
          : recursiveSplit(section.content, 512)[0];

      allChunks.push({
        id: parentId,
        content: parentContent,
        source: file,
        headers: section.headers,
        chunkIndex,
        parentChunkId: null,
        isParent: true,
      });

      // Child chunks: split the section into 128-256 token pieces
      const children = splitIntoChildren(section.content);

      // Only create children if there's more than one piece
      // (if the section is small enough to be a single child, the parent suffices)
      if (children.length > 1) {
        for (let n = 0; n < children.length; n++) {
          allChunks.push({
            id: `${slug}_${chunkIndex}_child_${n}`,
            content: children[n],
            source: file,
            headers: section.headers,
            chunkIndex,
            parentChunkId: parentId,
            isParent: false,
          });
        }
      } else if (children.length === 1 && countTokens(children[0]) > 0) {
        // Single child — still create it for search purposes
        allChunks.push({
          id: `${slug}_${chunkIndex}_child_0`,
          content: children[0],
          source: file,
          headers: section.headers,
          chunkIndex,
          parentChunkId: parentId,
          isParent: false,
        });
      }

      chunkIndex++;
    }
  }

  return allChunks;
}
