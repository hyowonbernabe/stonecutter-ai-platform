import { tool } from 'ai';
import { z } from 'zod';
import { queryDatabaseTool } from '../tools/query-database';
import { searchKnowledgeBaseTool } from '../tools/search-knowledge-base';
import { checkComplianceTool } from '../tools/check-compliance';

export const aiTools = {
  query_database: tool({
    description:
      'Query the SQLite database to answer questions about sales, advertising, subscriptions, and customer metrics. Use this for any question involving numbers, trends, comparisons, or data lookups.',
    inputSchema: z.object({
      question: z.string().describe('The natural language question to answer with data'),
    }),
    execute: async ({ question }) => queryDatabaseTool(question),
  }),

  search_knowledge_base: tool({
    description:
      'Search the knowledge base documents (SOPs, compliance guides, brand voice guides, competitive analysis) to answer questions about procedures, policies, brand guidelines, or industry context.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    execute: async ({ query }) => searchKnowledgeBaseTool(query),
  }),

  check_compliance: tool({
    description:
      'Check product listing copy for compliance violations against Amazon\'s restricted language policy. Use this when a user submits listing text for review or asks about compliance.',
    inputSchema: z.object({
      text: z.string().describe('The listing copy to check for compliance'),
    }),
    execute: async ({ text }) => checkComplianceTool(text),
  }),
};
