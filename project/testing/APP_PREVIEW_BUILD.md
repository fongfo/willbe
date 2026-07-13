# Pusaka App Preview Build

This note tracks the first tester-facing app package for WB-44.

## Staging API

- Health check: `https://willbe-staging.up.railway.app/health`
- App API base URL: `https://willbe-staging.up.railway.app/api`
- EAS preview profile variable: `EXPO_PUBLIC_API_URL=https://willbe-staging.up.railway.app/api`
- AI health check: `https://ai-staging-5843.up.railway.app/health`
- AI API base URL: `https://ai-staging-5843.up.railway.app/api`
- EAS preview profile variable: `EXPO_PUBLIC_AI_API_URL=https://ai-staging-5843.up.railway.app/api`

The staging backend health check was verified on 2026-07-11.
The staging AI health check and `/api/chat` endpoint were verified on 2026-07-13.

## First Android QA Scope

Include these flows in the first Android preview build:

- App launch and tab navigation
- Family members CRUD
- Trusted contacts CRUD
- Asset references CRUD
- Readiness score based on local/backend data
- Emergency handover preview
- AI assistant chat
- AI gap explanations
- Email account registration/login through Privy
- Account profile/session display after backend session creation

Exclude these flows until their services are configured:

- iOS TestFlight distribution

## Build Prerequisites

Set these values before creating the preview build:

- `EXPO_PUBLIC_API_URL=https://willbe-staging.up.railway.app/api`
- `EXPO_PUBLIC_AI_API_URL=https://ai-staging-5843.up.railway.app/api`
- `EXPO_PUBLIC_PRIVY_APP_ID=cmqriwky5001t0dlb4153zpfh`
- `EXPO_PUBLIC_PRIVY_CLIENT_ID=client-WY6aTvQCE95RSj6gGMpWj7gY5Ve1iBgiKiB6eS42xaqTS`

The backend Railway service must also have Privy server-side variables configured:

- `PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `PRIVY_JWT_VERIFICATION_KEY` when provided by Privy

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

## WB-44 Build 1

- EAS project: `@fongfo/pusaka`
- EAS project ID: `f6714268-b2de-444d-871c-4a4e006972dc`
- Build ID: `162b078a-1d1c-4b7e-a512-3b4ff5e83fd7`
- Build profile: `preview`
- Platform: Android
- Distribution: internal
- Git commit: `58c98c35ee45b87430b9ddd9ff0418384db7e3a2`
- APK: `https://expo.dev/artifacts/eas/-N1rEY1bcy7LRPsH5h7uYwE2PcUcV-P27ifNapNcXtM.apk`
- Completed at: `2026-07-12T09:52:13.935Z`
- Expires at: `2026-07-26T09:40:12.309Z`

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
