import { z } from 'zod';

const routeSchema = z.enum([
  '/family-members',
  '/trusted-contacts',
  '/asset-references'
]);

const recommendationSchema = z.object({
  gapId: z.string().min(1),
  category: z.enum(['family', 'trusted_contacts', 'asset_references']),
  priority: z.number().int(),
  urgency: z.enum(['do_first', 'do_next', 'do_later']),
  title: z.string().min(1),
  explanation: z.string().min(1),
  nextAction: z.object({
    label: z.string().min(1),
    route: routeSchema
  }).strict()
}).strict();

export const gapExplanationResponseSchema = z.object({
  summary: z.string().trim().min(1),
  recommendations: z.array(recommendationSchema),
  disclaimerRequired: z.boolean(),
  answerPolicy: z.object({
    responseMode: z.literal('structured_gap_explanation_only'),
    prohibitedAdvice: z.tuple([
      z.literal('financial'),
      z.literal('legal'),
      z.literal('insurance')
    ])
  }),
  provider: z.object({
    name: z.enum(['anthropic', 'deepseek', 'fallback']),
    model: z.string().min(1),
    stopReason: z.string().optional(),
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional()
  }).strict()
}).strict();
