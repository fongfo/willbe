# Pusaka App Preview Build

This note tracks the first tester-facing app package for WB-44.

## Staging API

- Health check: `https://willbe-staging.up.railway.app/health`
- App API base URL: `https://willbe-staging.up.railway.app/api`
- EAS preview profile variable: `EXPO_PUBLIC_API_URL=https://willbe-staging.up.railway.app/api`

The staging backend health check was verified on 2026-07-11.

## First Android QA Scope

Include these flows in the first Android preview build:

- App launch and tab navigation
- Family members CRUD
- Trusted contacts CRUD
- Asset references CRUD
- Readiness score based on local/backend data
- Emergency handover preview
- Email/wallet account flow only if Privy staging values are configured before build time

Exclude these flows until their services are deployed:

- AI assistant chat
- AI gap explanations
- iOS TestFlight distribution

## Build Prerequisites

Set these values before creating the preview build:

- `EXPO_PUBLIC_API_URL=https://willbe-staging.up.railway.app/api`
- `EXPO_PUBLIC_PRIVY_APP_ID` if testing account/wallet login
- `EXPO_PUBLIC_PRIVY_CLIENT_ID` if testing account/wallet login
- `EXPO_PUBLIC_AI_API_URL` only after the AI service has a staging URL

The app identity for the preview build is:

- Display name: `Pusaka`
- Slug: `pusaka`
- Android package: `com.willbe.pusaka`
- iOS bundle identifier: `com.willbe.pusaka`
- App version: `1.0.0`
- Android version code: `1`
- iOS build number: `1`

## Local Gate Before Sharing

Run these commands from `app/` before starting an EAS build:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Android Preview Build

Run from `app/`:

```bash
npx eas-cli build --platform android --profile preview
```

The `preview` profile uses internal distribution and produces an Android APK.

## Tester Handoff Template

Share this with testers:

- Build link:
- Version:
- Git commit:
- Backend environment: `https://willbe-staging.up.railway.app`
- Test accounts:
- Included scope:
- Known exclusions:
- Feedback format: device model, OS version, screen/flow, expected result, actual result, screenshot or screen recording.
