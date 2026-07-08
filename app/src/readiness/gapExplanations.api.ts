import { getAiApiBaseUrl, request } from '../api';
import { gapExplanationResponseSchema } from './gapExplanations.schema';
import type {
  GapExplanationRequest,
  GapExplanationResponse
} from './gapExplanations.types';

const RESOURCE = '/gap-explanations';

export async function explainGaps(
  input: GapExplanationRequest,
  signal?: AbortSignal
): Promise<GapExplanationResponse> {
  const data = await request<unknown>(RESOURCE, {
    method: 'POST',
    body: input,
    signal,
    baseUrl: getAiApiBaseUrl()
  });
  const parsed = gapExplanationResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Gap explanation was not recognised');
  }

  return parsed.data;
}
