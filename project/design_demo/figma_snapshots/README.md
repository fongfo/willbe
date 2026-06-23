# Pusaka — Figma Import Snapshots

15 static, self-contained HTML files — one per screen state of the Pusaka clickable prototype. Each is a fixed 392×844 "screen" div (status bar + content + bottom nav where relevant), with template values resolved to the demo's default data (Aisyah Rahman, readiness score 69, 4 open gaps). No JS, no custom tags — plain HTML/CSS so any HTML-to-design importer can parse it cleanly.

| File | Screen |
|---|---|
| 01-welcome.html | Welcome / landing |
| 02-onboarding-step1-email.html | Onboarding 1/5 — email |
| 03-onboarding-step2-categories.html | Onboarding 2/5 — categories |
| 04-onboarding-step3-institutions.html | Onboarding 3/5 — institutions |
| 05-onboarding-step4-contacts.html | Onboarding 4/5 — trusted contacts |
| 06-onboarding-step5-documents.html | Onboarding 5/5 — documents & cadence |
| 07-home.html | Home (readiness hero, quick stats, next action) |
| 08-plan.html | Plan (family directory: people, contacts, assets) |
| 09-readiness.html | Readiness (score, coverage breakdown, gaps, strengths) |
| 10-account.html | Account (profile, ZK privacy card, check-in rhythm) |
| 11-emergency-step1-activated.html | Emergency 1/5 — activated |
| 12-emergency-step2-verify.html | Emergency 2/5 — verification |
| 13-emergency-step3-message.html | Emergency 3/5 — message + access scope |
| 14-emergency-step4-contacts.html | Emergency 4/5 — contacts & first actions |
| 15-emergency-step5-locations.html | Emergency 5/5 — where everything is |

## How to import into Figma with html.to.design

1. Install the **html.to.design** plugin in Figma (Community plugins → search "html.to.design").
2. Serve this folder locally so the plugin's browser companion can capture it (file:// URLs are blocked by some browsers):
   ```
   cd "D:/Willbe/project/design_demo/figma_snapshots"
   npx serve -l 5500
   ```
3. Open each screen at `http://localhost:5500/01-welcome.html` (etc.) in Chrome.
4. In Figma, open the html.to.design plugin → "Import from active browser tab" (or paste the localhost URL if the plugin supports remote fetch).
5. Repeat for all 15 files. Name each resulting Figma frame after the screen (e.g. "Welcome", "Onboarding 1 — Email") so they line up with the table above.
6. Once imported, group the onboarding steps and emergency steps into their own Figma sections/flows, and wire up Figma prototype links between frames (Welcome → Onboarding 1 → … → Home → Plan/Readiness/Account, Home → Emergency 1 → … → Account) to recreate the click-through flow.

## Design tokens (for consistency when designing new screens)

- **Primary teal:** `#0f766e` (buttons, active states, progress) — darker variants `#0b5d56`, `#0a4f49`
- **Deep green/ink:** `#13352e`, `#0c2521`, `#0a1f1b` (headings, dark surfaces, emergency mode)
- **Backgrounds:** `#f3f6f4` (app surface), `#eceae3` (outer canvas)
- **Gold accent:** `#bf9b3a` / `#e7c163` (trust-ladder dot, emergency mode, primary CTA on dark)
- **Warning/brick:** `#b4541f` (unresolved gap states)
- **Success green:** `#1f8a5b`
- **Fonts:** Newsreader (serif, headings/quotes), Hanken Grotesk (sans, body/UI)
- **Radius:** 13–22px on cards/buttons, 28–38px on screen/sheet corners
- **Card style:** white fill, 1px border `#e7eeeb`, soft shadow `0 4px 14px rgba(16,48,42,.04)`
