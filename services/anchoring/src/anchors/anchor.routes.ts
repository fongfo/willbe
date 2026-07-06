import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { ZodError } from 'zod';
import { HttpError } from '../shared/http-error';
import { AnchorService } from './anchor.service';
import { InMemoryAnchorRepository } from './anchor.repository';
import { MockProofOfPlanGateway } from './proof-gateway';
import { anchorPlanSchema, ownerRefParamSchema } from './anchor.schema';

function firstIssueMessage(error: ZodError): string {
  const [issue] = error.issues;
  return issue ? issue.message : 'Invalid request';
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

export function buildAnchorRouter(service: AnchorService): Router {
  const router = Router();

  router.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  router.post('/', async (req: Request, res: Response) => {
    const parsed = anchorPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
      return;
    }

    try {
      const record = await service.anchorPlan(parsed.data);
      res.status(201).json({ success: true, data: record });
    } catch (error: unknown) {
      handleError(error, res);
    }
  });

  router.get('/:ownerRef', async (req: Request, res: Response) => {
    const parsed = ownerRefParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: firstIssueMessage(parsed.error) });
      return;
    }

    try {
      const record = await service.findLatestByOwner(parsed.data.ownerRef);
      if (!record) {
        res.status(404).json({ success: false, error: 'Anchor not found' });
        return;
      }
      res.status(200).json({ success: true, data: record });
    } catch (error: unknown) {
      handleError(error, res);
    }
  });

  return router;
}

export const anchorRouter = buildAnchorRouter(
  new AnchorService(
    new InMemoryAnchorRepository(),
    new MockProofOfPlanGateway({
      contractAddress: process.env.PROOF_CONTRACT_ADDRESS,
      network: process.env.PROOF_NETWORK
    })
  )
);
