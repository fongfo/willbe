import { request } from '../src/api';
import { explainGaps } from '../src/readiness/gapExplanations.api';
import type {
  GapExplanationRequest,
  GapExplanationResponse
} from '../src/readiness/gapExplanations.types';

jest.mock('../src/api', () => ({
  getAiApiBaseUrl: () => 'http://localhost:4200/api',
  request: jest.fn()
}));

const mockedRequest = request as jest.Mock;

const payload: GapExplanationRequest = {
  locale: 'en',
  score: 40,
  level: 'needs-work',
  gaps: [
    {
      id: 'trusted-contacts-count',
      category: 'trusted_contacts',
      title: 'Add two trusted contacts',
      detail: 'Two contacts avoids a single point of failure during an emergency.',
      severity: 'high',
      priority: 20,
      action: { label: 'Add trusted contact', route: '/trusted-contacts' },
      evidence: { current: 1, required: 2, unit: 'trusted contacts' }
    }
  ]
};

const response: GapExplanationResponse = {
  summary: 'Add the missing trusted contact first.',
  recommendations: [
    {
      gapId: 'trusted-contacts-count',
      category: 'trusted_contacts',
      priority: 20,
      urgency: 'do_first',
      title: 'Add two trusted contacts',
      explanation: 'A backup person gives your family a second contact path.',
      nextAction: { label: 'Add trusted contact', route: '/trusted-contacts' }
    }
  ],
  disclaimerRequired: true,
  answerPolicy: {
    responseMode: 'structured_gap_explanation_only',
    prohibitedAdvice: ['financial', 'legal', 'insurance']
  },
  provider: {
    name: 'fallback',
    model: 'deterministic-gap-explainer'
  }
};

afterEach(() => jest.clearAllMocks());

describe('explainGaps', () => {
  it('posts structured gap metadata to the AI service and validates the response', async () => {
    mockedRequest.mockResolvedValue(response);

    await expect(explainGaps(payload)).resolves.toEqual(response);
    expect(mockedRequest).toHaveBeenCalledWith(
      '/gap-explanations',
      expect.objectContaining({
        method: 'POST',
        body: payload,
        baseUrl: 'http://localhost:4200/api'
      })
    );
    expect(JSON.stringify(mockedRequest.mock.calls[0])).not.toContain('locationHint');
  });

  it('throws when the response shape is not recognised', async () => {
    mockedRequest.mockResolvedValue({ summary: '' });

    await expect(explainGaps(payload)).rejects.toThrow('not recognised');
  });
});
