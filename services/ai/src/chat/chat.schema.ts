import { z } from 'zod';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(1000)
}).strict();

export const chatReplySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  locale: z.enum(['en', 'zh', 'ms']).optional(),
  history: z.array(chatMessageSchema).max(8).optional()
}).strict();
