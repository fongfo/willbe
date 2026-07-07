import { KnowledgeEntry } from './knowledge.types';

export const seedKnowledgeEntries: readonly KnowledgeEntry[] = [
  {
    id: 'product-six-step-flow',
    title: 'Pusaka six step planning flow',
    category: 'PRODUCT_DOC',
    locale: 'en',
    content:
      'Pusaka guides a family through family members, trusted contacts, asset references, check frequency and cloud drive locations, readiness gaps, and emergency handoff preview.',
    tags: ['onboarding', 'planning', 'readiness', 'emergency handoff'],
    source: { document: 'project/PRD.md', section: '2. Core modules' },
    disclaimerRequired: false,
    updatedAt: '2026-06-22'
  },
  {
    id: 'product-asset-reference-boundary',
    title: 'Asset references store locations, not secrets',
    category: 'PRODUCT_DOC',
    locale: 'en',
    content:
      'Asset references should only describe where family members can find bank, insurance, property, investment, crypto or other documents. Pusaka must not store passwords, balances, seed phrases, account numbers, private keys or recovery secrets.',
    tags: ['assets', 'privacy', 'passwords', 'private keys', 'crypto'],
    source: { document: 'project/PRD.md', section: '2. Core modules' },
    disclaimerRequired: false,
    updatedAt: '2026-06-22'
  },
  {
    id: 'faq-trusted-contacts-why-two',
    title: 'Why Pusaka recommends two trusted contacts',
    category: 'FAQ',
    locale: 'en',
    content:
      'Two trusted contacts give the emergency handoff flow a primary and a backup person. If one contact is unavailable, family members still have a trusted route to locate the plan and supporting documents.',
    tags: ['trusted contacts', 'backup contact', 'emergency handoff'],
    source: { document: 'project/PRD.md', section: '4. AI customer support' },
    disclaimerRequired: false,
    updatedAt: '2026-06-22'
  },
  {
    id: 'faq-emergency-handoff-preview',
    title: 'What the emergency handoff preview contains',
    category: 'FAQ',
    locale: 'en',
    content:
      'The emergency handoff preview summarizes who to contact, where important documents are referenced, and which readiness gaps still need attention. It is a planning aid, not a legal document.',
    tags: ['emergency handoff', 'readiness', 'contacts'],
    source: { document: 'project/PRD.md', section: '2. Core modules' },
    disclaimerRequired: true,
    updatedAt: '2026-06-22'
  },
  {
    id: 'faq-ai-support-boundary',
    title: 'AI support boundary',
    category: 'FAQ',
    locale: 'en',
    content:
      'The AI assistant may explain product flows, answer Pusaka usage questions, and point to readiness gaps. It must not provide financial, legal or insurance advice.',
    tags: ['ai', 'support', 'disclaimer', 'advice boundary'],
    source: { document: 'project/PRD.md', section: '4. AI features' },
    disclaimerRequired: true,
    updatedAt: '2026-06-22'
  },
  {
    id: 'regulatory-pdpa-cross-border-transfer',
    title: 'Malaysia PDPA cross-border transfer summary',
    category: 'REGULATORY_SUMMARY',
    locale: 'en',
    content:
      'For Malaysia users, Claude API, wallet providers, overseas RPC nodes or cloud regions may create cross-border personal data transfer. Product flows should disclose overseas processing and capture explicit consent or rely on a documented transfer impact assessment.',
    tags: ['PDPA', 'Malaysia', 'cross-border transfer', 'Claude API', 'consent'],
    source: { document: 'project/compliance/PDPA_REVIEW.md', section: '1.1 Cross-border data transfer' },
    disclaimerRequired: true,
    updatedAt: '2026-06-22'
  },
  {
    id: 'regulatory-ai-advice-boundary',
    title: 'AI must not give regulated advice',
    category: 'REGULATORY_SUMMARY',
    locale: 'en',
    content:
      'AI generated content for Pusaka must stay within product guidance and information completeness. It must not cross into legal advice, financial advice, insurance advice, investment recommendations or document drafting that should be handled by licensed professionals.',
    tags: ['AI', 'legal advice', 'financial advice', 'insurance advice', 'compliance'],
    source: { document: 'project/PRD.md', section: '4. AI features' },
    disclaimerRequired: true,
    updatedAt: '2026-06-22'
  }
];
