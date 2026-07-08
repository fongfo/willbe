# WB-26: Website Information Architecture and Design

> Jira: [WB-26](https://growth-more.atlassian.net/browse/WB-26)
> Epic: [WB-6](https://growth-more.atlassian.net/browse/WB-6)
> Scope: Phase 2 marketing website IA and design specification for the WB-27 Next.js build.

## 1. Objective

Pusaka's website should convert cautious Southeast Asian families from "this is uncomfortable to think about" into "I can start a practical family handover plan safely." The site is a marketing and education surface only; it must not collect or display user plan data.

Primary outcomes:

- Explain Pusaka as a family resilience planning product, not a legal, financial, insurance, or crypto product.
- Establish trust for Malaysia-first families through local examples, clear data boundaries, and compliance-aware language.
- Move visitors to one of three actions: join waitlist, start app onboarding, or ask AI support.
- Provide a content structure that can expand into English, Simplified Chinese, Malay, and Traditional Chinese.

Non-goals:

- No authenticated dashboard.
- No user asset intake on the website.
- No legal, financial, insurance, or investment recommendation content.
- No blockchain-first positioning or token language.

## 2. Audience And Conversion Paths

| Audience | User question | Primary path | CTA |
|---|---|---|---|
| Adult child organizing family information | "How do I make sure my family knows who to call and where to look?" | Home -> How it works -> Start planning | Start your family plan |
| Parent / planner | "Can I document practical handover details without exposing secrets?" | Home -> Security & privacy -> Start planning | Start safely |
| Trusted contact | "What would I see in an emergency?" | Home -> Emergency handover -> Learn more | Preview emergency handover |
| Compliance-conscious visitor | "Is this legal / secure / AI-safe?" | Home -> Trust center -> FAQ | Read trust center |
| Curious visitor with questions | "Can someone explain this in plain language?" | Any page -> AI support | Ask Pusaka AI |

## 3. Site Map

Initial WB-27 routes:

```text
/
/how-it-works
/security
/ai-support
/faq
/zh
/zh/how-it-works
/zh/security
/zh/ai-support
/zh/faq
```

Future routes:

```text
/ms
/ms/how-it-works
/ms/security
/ms/ai-support
/ms/faq
/zh-hant
/zh-hant/how-it-works
/zh-hant/security
/zh-hant/ai-support
/zh-hant/faq
/trust-center
/emergency-handover
/pricing
```

Navigation:

- Header left: Pusaka wordmark.
- Header links: How it works, Security, AI support, FAQ.
- Header utility: language switcher, Start planning.
- Mobile: compact top bar with menu button, language selector in menu, CTA pinned after nav links.
- Footer: product links, trust links, language links, company/legal placeholders.

## 4. Page Structure

### 4.1 Home

Purpose: Position Pusaka and move visitors toward the planning flow.

Sections:

1. Hero
   - H1: "Pusaka helps your family know who to call and where to look."
   - Supporting copy: "A practical family resilience plan for trusted contacts, asset references, readiness gaps, and emergency handover."
   - Primary CTA: "Start your family plan"
   - Secondary CTA: "See how it works"
   - Visual: real or generated Malaysia-first family planning scene: documents on a table, phone handover checklist, warm daylight. Avoid abstract gradients, crypto motifs, dark stock imagery, or legal-office intimidation.
2. Trust strip
   - "No passwords or private keys"
   - "Malaysia-first compliance review"
   - "AI guidance with advice boundaries"
   - "Emergency handover preview"
3. Problem framing
   - Three short panels: family contacts, asset references, plan freshness.
4. Product flow
   - Six-step flow mirrored from the app: family members, trusted contacts, asset references, check-in, readiness, emergency handover.
5. Gap analysis preview
   - Show a sample readiness score and three example gaps. Use illustrative metadata only, no real asset values.
6. AI support preview
   - Explain that AI answers product questions and does not provide legal, financial, or insurance advice.
7. Security and privacy summary
   - Plain language: references not secrets, hash-only future anchoring, data deletion/process transparency.
8. Final CTA
   - "Start with one trusted contact."

### 4.2 How It Works

Purpose: Make the product concrete and reduce setup anxiety.

Sections:

- Step-by-step timeline with the app's six-step flow.
- What to add / what not to add table.
- Example plan card using local examples such as Maybank, AIA, Kuala Lumpur, iCloud Drive.
- Emergency handover preview explanation.
- CTA: "Create the first draft."

### 4.3 Security

Purpose: Build trust without overclaiming.

Sections:

- Data boundary: "Pusaka stores references, not secrets."
- Sensitive data rules:
  - Do not store passwords.
  - Do not store private keys.
  - Do not store bank account numbers.
  - Do not store balances.
- AI boundary: product guidance only, no regulated advice.
- Blockchain boundary: future proof-of-plan stores hashes only; original plan data is off-chain.
- PDPA note: Malaysia-first compliance review, cross-border processing disclosed before production launch.
- CTA: "Read FAQ" and "Start safely."

### 4.4 AI Support

Purpose: Introduce the AI support channel for website visitors and prepare WB-28.

Sections:

- "Ask setup questions in plain language."
- Examples:
  - "Why do I need two trusted contacts?"
  - "What should I write for an asset reference?"
  - "What does readiness score mean?"
- Boundaries:
  - Not legal advice.
  - Not financial advice.
  - Not insurance advice.
  - Cannot draft legal documents or recommend investments, policies, wallets, or providers.
- Embedded widget placement spec:
  - Desktop: lower-right floating launcher after user scrolls past hero.
  - Mobile: inline card above footer plus optional bottom launcher if it does not obscure CTA.
- CTA: "Ask Pusaka AI."

### 4.5 FAQ

Purpose: Answer common objections.

Initial FAQ groups:

- Getting started
  - What is Pusaka?
  - Who is it for?
  - How long does setup take?
- Data safety
  - Should I add passwords?
  - What counts as an asset reference?
  - Can I delete information later?
- Family and contacts
  - Why two trusted contacts?
  - What will my trusted contact see?
- AI and compliance
  - Can AI give legal or financial advice?
  - What does AI use to answer questions?
- Blockchain
  - Why use proof-of-plan?
  - Is my family data on-chain?

## 5. Content Model

Recommended content files for WB-27:

```text
web/content/en/common.json
web/content/en/home.json
web/content/en/how-it-works.json
web/content/en/security.json
web/content/en/ai-support.json
web/content/en/faq.json
web/content/zh/*.json
```

Content keys should be stable across locales:

```json
{
  "seo": {
    "title": "Pusaka | Family resilience planning",
    "description": "A practical handover plan for trusted contacts, asset references, readiness gaps, and emergency previews."
  },
  "hero": {
    "title": "Pusaka helps your family know who to call and where to look.",
    "body": "...",
    "primaryCta": "Start your family plan",
    "secondaryCta": "See how it works"
  }
}
```

Localization rules:

- English is the source locale for WB-27.
- Simplified Chinese ships with WB-27.
- Malay and Traditional Chinese can use the same route/content shape later.
- Do not concatenate sentence fragments in code; translators need complete strings.
- Reserve layout space for Chinese text expansion and Malay line length.

## 6. Visual Direction

Use the project brand system from [BRAND_GUIDELINES.md](../brand/BRAND_GUIDELINES.md), not a generic fintech palette.

Core tokens:

| Role | Value | Usage |
|---|---|---|
| Primary | `#0f766e` | CTAs, active states, links |
| Accent | `#bf8714` | Readiness highlight, small trust marks |
| Background | `#f4f8fa` | Page canvas |
| Surface | `#ffffff` | Cards and panels |
| Text | `#163247` | Body and headings |
| Muted | `#647789` | Secondary text |
| Line | `#d4e2e8` | Borders and dividers |
| Danger | `#b54708` | Emergency or serious gap warnings only |

Typography:

- Body/UI: Inter with system fallback.
- Chinese fallback: PingFang SC, Noto Sans SC, Microsoft YaHei.
- Emphasis headings: Georgia/Cambria only for selective formal moments; do not overuse on marketing paragraphs.

Image direction:

- Hero must use a concrete visual: family planning table, emergency checklist, trusted contact handover, or warm household scene.
- Avoid blockchain cubes, neon gradients, generic legal gavels, hospital imagery, or fear-based emergency photos.
- Images must have stable aspect ratios and descriptive alt text.

Component style:

- Radius: 18px for cards, smaller 10-12px for inputs/buttons if needed.
- Shadows: soft and subtle, no heavy floating card stacks.
- Icons: use a single line icon family such as Lucide for web implementation.
- Cards: use for repeated items or framed previews only; avoid nesting cards inside cards.

## 7. Responsive Layout

Breakpoints:

- Mobile: 375px baseline.
- Tablet: 768px.
- Desktop: 1024px.
- Wide desktop: 1440px max content width.

Rules:

- Mobile first.
- No horizontal scroll at 375px.
- Header CTA remains reachable without covering content.
- Hero should show the product promise and a hint of the next section on mobile and desktop.
- Keep body text at 16px minimum on web.
- Respect reduced motion.
- Reserve image dimensions to avoid CLS.

## 8. Accessibility And SEO

Accessibility:

- One H1 per page.
- Heading order must be sequential.
- All interactive elements keyboard reachable.
- Visible focus ring on links, buttons, language switcher, menu.
- Color cannot be the only status signal.
- Normal text contrast must meet WCAG AA 4.5:1.
- AI widget must have accessible launcher label and close button.

SEO:

- Each locale has localized title and description.
- Add Open Graph metadata per locale.
- Use canonical URLs and hreflang links for supported languages.
- FAQ page should be structured so FAQ schema can be added later.
- Avoid indexing any preview route that looks like app data.

## 9. Compliance Copy Boundaries

Required site-wide statement near AI or gap analysis content:

> Pusaka provides product guidance and family planning prompts. It does not provide financial, legal, or insurance advice.

Do:

- Say "asset references" instead of "asset management."
- Say "readiness gaps" instead of "estate advice."
- Say "proof-of-plan hash" instead of "your data on-chain."
- Say "trusted contacts" instead of "legal beneficiaries."

Do not:

- Recommend insurance products, investment choices, wallets, exchanges, law firms, or legal documents.
- Claim PDPA certification or regulatory approval.
- Claim blockchain makes a plan legally valid.
- Ask website visitors to enter passwords, account numbers, private keys, balances, or full identity documents.

## 10. Analytics Events

Suggested events for WB-27:

| Event | Trigger | Properties |
|---|---|---|
| `website_cta_clicked` | Primary/secondary CTA click | `page`, `cta_id`, `locale` |
| `website_language_changed` | Language switch | `from_locale`, `to_locale`, `page` |
| `website_faq_opened` | FAQ item expanded | `faq_id`, `locale` |
| `website_ai_launcher_opened` | AI support widget opened | `page`, `locale` |
| `website_security_section_viewed` | Security section enters viewport | `page`, `locale` |

Privacy:

- Do not send free-form AI prompts to product analytics.
- Do not send any asset reference content to analytics.
- Prefer aggregated section/CTA events.

## 11. WB-27 Implementation Notes

Recommended structure:

```text
web/
|-- app/
|   |-- [locale]/
|   |   |-- page.tsx
|   |   |-- how-it-works/page.tsx
|   |   |-- security/page.tsx
|   |   |-- ai-support/page.tsx
|   |   `-- faq/page.tsx
|   `-- layout.tsx
|-- components/
|   |-- Header.tsx
|   |-- Footer.tsx
|   |-- LocaleSwitcher.tsx
|   |-- Hero.tsx
|   |-- TrustStrip.tsx
|   `-- Section.tsx
|-- content/
|   |-- en/
|   `-- zh/
`-- lib/
    |-- locales.ts
    `-- analytics.ts
```

Testing expectations:

- Unit tests for locale routing/content loading.
- Rendering tests for home, security, FAQ.
- Accessibility checks for heading order and nav labels.
- Snapshot or DOM assertions that regulated-advice disclaimer appears on AI/support pages.

## 12. Acceptance Criteria

WB-26 is complete when:

- Site map and route plan are defined for WB-27.
- Home, How it works, Security, AI Support, and FAQ page sections are specified.
- Brand color, typography, image, responsive, accessibility, and SEO guidelines are documented.
- Compliance copy boundaries are explicit.
- Analytics events avoid sensitive user data.
- WB-27 implementation structure and testing expectations are clear.
