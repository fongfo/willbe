import { z } from 'zod';

const chatCitationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  source: z.object({
    document: z.string().min(1),
    section: z.string().min(1)
  }),
  score: z.number()
});

export const chatReplyResponseSchema = z.object({
  message: z.string().trim().min(1),
  citations: z.array(chatCitationSchema),
  disclaimerRequired: z.boolean(),
  answerPolicy: z.object({
    responseMode: z.literal('grounded_rag_context_only'),
    disclaimerRequired: z.boolean(),
    prohibitedAdvice: z.tuple([
      z.literal('financial'),
      z.literal('legal'),
      z.literal('insurance')
    ])
  }),
  provider: z.object({
    name: z.enum(['anthropic', 'deepseek']),
    model: z.string().min(1),
    stopReason: z.string().optional(),
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional()
  })
});
