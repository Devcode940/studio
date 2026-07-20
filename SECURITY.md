# Security Policy - KenyaWatch Hardened Version

## Fixes Applied (2026-07-20)

### Critical
1. **next.config.ts**: Removed `ignoreBuildErrors` and `ignoreDuringBuilds`. Added security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy). Added image remotePatterns for Firebase Storage.

2. **firestore.rules v2**:
   - Principle of least privilege: default `allow read: true, write: false`
   - `isAdmin()` via custom claim `admin` or `role=admin`
   - `county_gdp`, `census_data`, `leaderboard_entries`, `performance_metrics`, `integrity_reports`, `highlights` -> admin-only writes
   - Reviews: strict validation (`userName` length, comment 10-1000 chars, rating 1-5, `createdAt == request.time`, owner check)
   - Added `ai_usage` collection for rate limiting
   - Prevent highlight spam with schema validation

3. **CI/CD**: Replaced broken `webpack.yml` (ran `npx webpack`) with `ci.yml` that runs `npm ci`, `typecheck`, `lint`, `build`, `npm audit`

4. **AI Safety**:
   - Env flag `USE_MOCK_AI_DATA` - only allowed in dev. In prod, flows throw if real APIs not configured
   - Highlights go to `highlights_pending_review` in prod, require admin review
   - Rate limiting 5 generations/hour per user
   - Fact-check prompt now includes defamation guard, neutral language, disclaimer required
   - Integrity reports require source URLs in prod

5. **Code Quality**:
   - Fixed Next.js 15 breaking change: `params` is now Promise in `[slug]/page.tsx` - using `use(params)`
   - Fixed `next/image` legacy `layout="fill"` -> `fill` + style
   - Migrated fonts from `<link>` to `next/font/google` for Poppins + PT Sans (perf + no CLS)
   - Fixed missing `React` import and wrong `useAuth` hook in AddPerformanceMetric
   - Fixed `user.name` -> `user.displayName` in Dashboard
   - Added debounced search + server-side filtering + pagination hint to representatives page
   - Renamed package from `nextn` to `kenyawatch`

## Remaining TODO for Production
- [ ] Implement real KNBS API for economic data
- [ ] Implement GNews/NewsAPI for fact-checking with source URL preservation
- [ ] Implement X API v2 for social highlights
- [ ] Create Cloud Function to compute leaderboard scores (overall, performance, integrity) on schedule
- [ ] Add Firebase Admin script: `admin.auth().setCustomUserClaims(uid, {admin:true})`
- [ ] Enable App Check for Firestore
- [ ] Add Content Security Policy header
- [ ] Add unit tests for rules (firebase emulator) and AI flows

## Deploy Checklist
- `npm run typecheck` must pass (now does)
- `npm run build` must pass (now does)
- Set `USE_MOCK_AI_DATA=false` in prod
- Set Gemini API key via Secret Manager, not env file
- Enable Firestore backups

## Reporting Vulnerabilities
Contact: devcode940 - Please create private issue.

## Legal Note
Under Kenya Data Protection Act 2019, AI-generated integrity reports about identifiable persons must:
1. Have verifiable reputable sources
2. Include disclaimer
3. Allow data subject to contest
This hardened version enforces source URLs and admin review queue to comply.
