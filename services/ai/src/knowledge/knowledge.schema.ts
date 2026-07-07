import { z } from 'zod';

export const knowledgeCategorySchema = z.enum(['PRODUCT_DOC', 'FAQ', 'REGULATORY_SUMMARY']);
export const knowledgeLocaleSchema = z.enum(['en', 'zh', 'ms']);

export const listKnowledgeQuerySchema = z.object({
  category: knowledgeCategorySchema.optional(),
  locale: knowledgeLocaleSchema.optional()
}).strict();

export const searchKnowledgeSchema = z.object({
  query: z.string().trim().min(2).max(200),
  limit: z.number().int().min(1).max(10).optional(),
  category: knowledgeCategorySchema.optional(),
  locale: knowledgeLocaleSchema.optional()
}).strict();
