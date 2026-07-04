# Willbe (Pusaka)

Family resilience planning platform for Southeast Asian families (Malaysia first). See [`project/PRD.md`](project/PRD.md) for product scope and [`project/DEV_WORKFLOW.md`](project/DEV_WORKFLOW.md) for the branching/testing/review process.

## Repo layout

| Path | What |
|---|---|
| `app/` | React Native (Expo) mobile app |
| `backend/` | Node.js + Express API (TypeScript) |
| `project/` | Product docs, compliance review, brand guidelines, design prototypes |
| `project/design_demo/app_prototype/` | Clickable HTML prototype of the full app (open `index.html`) |

Blockchain anchoring and AI service codebases land as their own top-level folders (`services/anchoring`, `services/ai`) once WB-3/4/5 start — not scaffolded yet to avoid unused structure.

## Getting started

```bash
# Backend
cd backend && npm install && npm run dev   # http://localhost:4000/health

# App
cd app && npm install && npm start         # Expo dev server
```

For phone preview, Expo Go compatibility, and development build steps, see [`project/APP_LOCAL_PREVIEW.md`](project/APP_LOCAL_PREVIEW.md).

## Branching

Per `DEV_WORKFLOW.md`: `main` is protected, `develop` is the integration branch, work happens on `feature/<jira-key>-<short-desc>`.
