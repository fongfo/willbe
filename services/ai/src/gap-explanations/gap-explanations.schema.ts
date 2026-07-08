import { z } from 'zod';

const actionRouteSchema = z.enum([
  '/family-members',
  '/trusted-contacts',
  '/asset-references'
]);

const gapCategorySchema = z.enum(['family', 'trusted_contacts', 'asset_references']);
const gapSeveritySchema = z.enum(['high', 'medium']);

const actionSchema = z.object({
  label: z.string().trim().min(1).max(80),
  route: actionRouteSchema
}).strict();

const evidenceSchema = z.object({
  current: z.number().int().min(0).max(1000),
  required: z.number().int().min(1).max(1000),
  unit: z.string().trim().min(1).max(60)
}).strict();

export const gapInputSchema = z.object({
  id: z.string().trim().min(1).max(80),
  category: gapCategorySchema,
  title: z.string().trim().min(1).max(120),
  detail: z.string().trim().min(1).max(240),
  severity: gapSeveritySchema,
  priority: z.number().int().min(1).max(1000),
  action: actionSchema,
  evidence: evidenceSchema
}).strict();

export const explainGapsSchema = z.object({
  locale: z.enum(['en', 'zh', 'ms']).optional(),
  score: z.number().int().min(0).max(100),
  level: z.enum(['needs-work', 'building', 'ready']),
  gaps: z.array(gapInputSchema).max(10)
}).strict();

export const llmGapRecommendationSchema = z.object({
  gapId: z.string().trim().min(1).max(80),
  urgency: z.enum(['do_first', 'do_next', 'do_later']),
  explanation: z.string().trim().min(1).max(320),
  nextActionLabel: z.string().trim().min(1).max(80)
}).strict();

export const llmGapExplanationSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  recommendations: z.array(llmGapRecommendationSchema).max(10)
}).strict();
