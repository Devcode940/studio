# Fixes Applied - Detailed Changelog

This document lists every file changed from the original Devcode940/studio master.

## Build & Config
- **next.config.ts**: Complete rewrite. Removed dangerous ignore flags. Added security headers. Extended image domains.
- **.github/workflows/webpack.yml** -> **.github/workflows/ci.yml**: Fixed to run Next.js build correctly with caching, typecheck, lint, audit.
- **package.json**: Renamed `nextn` -> `kenyawatch`, added description, author, license.
- **.gitignore**: Added `.modified`, `.idx`, `.vscode`, env files, pem.
- **.env.example**: New file documenting required env vars.
- **README.md**: Full rewrite with setup, security fixes, architecture, safety notes.
- **SECURITY.md**: New file.

## Security
- **firestore.rules**: Complete hardening v2 with admin claims, strict review validation, admin-only writes for sensitive collections, rate limit collection.

## UI/UX & Performance
- **src/app/layout.tsx**: Migrated from Google Fonts <link> to `next/font/google` with variables `--font-poppins`, `--font-pt-sans`. Added metadata (OG, keywords, template).
- **src/app/globals.css**: Updated to use CSS variables for fonts, kept Kenyan flag animation.
- **src/app/page.tsx**: Fixed deprecated `layout="fill"` to `fill` + style, added priority, sizes, better alt.
- **src/app/representatives/page.tsx**: Major refactor:
  - Debounced search (300ms)
  - Server-side where filters for position/county
  - limit(PAGE_SIZE=24) to avoid cost explosion
  - Error handling for useCollection
  - Reset filters button
  - Pagination hint for next iteration
- **src/app/representatives/[slug]/page.tsx**: Fixed Next 15 async params (`use(params)`), cleaned imports, fixed types.
- **src/app/dashboard/page.tsx**: Fixed `user.name` -> `displayName`.
- **src/components/representatives/AddPerformanceMetric.tsx**: Fixed missing React import, wrong useAuth import (was from firebase, now hooks), added useState import fix.
- **src/components/shared/DataTable.tsx**: Fixed TS2536 sort key null handling.

## AI Flows (Safety Critical)
- **src/ai/flows/fact-check-representative.ts**: 
  - Added USE_MOCK flag gated to dev only
  - Added real vs mock branching with explicit error if prod and no API
  - Added confidence + sources in output schema
  - Hardened prompt to prevent hallucination, add disclaimer, neutral language
  - Fixed `llmResponse.output` accessor (Genkit v1 property not method)
- **src/ai/flows/generate-social-highlights.ts**:
  - Added rate limiting via ai_usage collection
  - USE_MOCK guard
  - Writes to `highlights_pending_review` in prod vs `highlights` in mock
  - Added audit fields `generatedBy`, `status`
  - Fixed `initializeFirebase()` usage (previously getSdks() with no args would fail typecheck)
  - Fixed output accessor
- **src/ai/flows/summarize-integrity-report.ts**:
  - Added sourceUrls param, confidence
  - Added prod validation requiring sources
  - Hardened prompt with safety rules, neutral language, disclaimer, 150 words limit
  - Fixed type error with `as const`
- **src/ai/flows/fetch-economic-data.ts**:
  - Added USE_MOCK guard, real KNBS TODO
  - Added validation schemas improvements
  - Fixed getSdks -> initializeFirebase
  - Fixed batch doc creation

## Build Verification
```
npx tsc --noEmit  # PASS (was failing 12+ errors)
npm run build     # PASS (was failing due to ignoreBuildErrors + params type)
```

## Before vs After
- Before: 0 stars, failure CI, ignoreBuildErrors true, mocked AI writing directly to prod collections, any auth user could poison county_gdp, build would fail if checks enabled
- After: type-safe, secure rules, CI green, AI flows gated behind admin review + rate limit + env flag, pagination prevents Firestore cost bomb, Next 15 compatible, security headers
