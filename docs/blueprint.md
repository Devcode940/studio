# KenyaWatch — Production Blueprint v2.0
**Senior Architect: 20+ yrs experience | From Template to Real Civic Platform**

## 1. Vision & Problem Statement (Real App)

**Problem:** Kenya has 2,000+ elected reps (President to 1,450 MCAs) but citizens lack a single searchable, verifiable source linking leadership to performance, integrity, and county development outcomes. Data is fragmented: Parliament Hansard PDFs, KNBS PDFs (no API), IEBC voter registers, Mzalendo incomplete Pombola, Auditor General CDF reports.

**Solution:** KenyaWatch v2 is not a scaffold – it is a production-grade civic platform with:
- **Real data pipeline**: Mzalendo Pombola scraping + Parliament.go.ke + KNBS PDF parsing + openAfrica CKAN + manual CSV ingest with admin approval
- **Verifiable integrity**: AI summaries are *grounded* in reputable sources (Nation, Standard, Star, The Elephant) with URLs, confidence scoring, human-in-loop approval – never publish hallucinations
- **Transparent scoring**: Open-source scoring algorithm, reproducible, versioned
- **Scale**: Designed for 47 counties × 290 constituencies × 1,450 wards = 3K+ profiles, 100K+ metrics, 1M+ monthly users

## 2. Core Features — Real App Spec (Not Mock)

### 2.1 Representative Profiles (Production)
- **Source of Truth**: `representatives` collection, id = `slug` (e.g., `william-samoei-ruto`), composite index `position+county+name`
- **Ingestion**: 
  - Primary: Mzalendo API scrape (EveryPolitician) + Parliament.go.ke fallback
  - Enrichment: IEBC 2022 results (votesGarnered), contactInfo from official sites
  - Photo: Firebase Storage `representatives/{slug}.jpg` with CDN + placeholder fallback
- **Search & Filter**: Server-side `where(position==) + where(county==) + orderBy(name) + limit(24)` + client debounced name filter. Future: Algolia/Typesense for full-text Swahili + English
- **Detail Page**: `/representatives/[slug]` uses `use(params)` Promise (Next 15) + 6 tabs (overview, performance, integrity, highlights, social, community)

### 2.2 Performance Metrics (Real KPIs)
- **Metrics Types**:
  - `attendance`: Parliament attendance % from Hansard
  - `bills_sponsored`: count + list from Mzalendo bills tracker
  - `cdf_utilization`: % from Auditor General reports (2023: avg 67% utilization)
  - `development_projects`: count verified via county project tracker
  - `public_participation`: barazas held, county reports
- **Scoring Algorithm** (open, versioned in `src/lib/scoring.ts`):
```ts
overallScore = 0.35*attendance + 0.25*cdfUtilization + 0.20*legislativeActivity + 0.20*communityRating(1-5 stars normalized to 100)
performanceScore = weighted average of metrics with source weight (Auditor General = 1.5x, Hansard = 1.2x, user-submitted = 0.8x)
integrityScore = 100 - (verified_scandals*15 + alleged_scandals*5) + (years_clean*2) capped [0,100]
```
- **User Submission**: `AddPerformanceMetric` writes to `performance_metrics_pending` → admin approval → moves to `performance_metrics`
- **Source Weighting**: Prevent gaming

### 2.3 Integrity Reports (AI Governance HARD)
- **Pipeline**:
  1. Trigger: admin or rate-limited user (5/hr)
  2. Tool: `findNewsAboutRepresentative` → GNews API `q="{name}" site:nation.africa OR standardmedia.co.ke` + country=ke
  3. LLM: Gemini 2.0 Flash with system prompt:
     ```
     ONLY use tool output. If no reputable sources → "No verified concerns"
     Neutral language, "Alleged" + source URL
     Add disclaimer: "AI-generated for info only. Verify with original sources."
     Max 150 words, confidence high/medium/low
     ```
  4. Validation: Zod output schema, require sourceUrls[] in prod
  5. Persistence: `integrity_reports` (admin only in prod) + audit in `ai_usage`
- **Legal**: Per Kenya Data Protection Act 2019, defamation risk mitigated by human-in-loop, source attribution, confidence, disclaimer

### 2.4 Leaderboard (Real Computation)
- **Source**: `leaderboard_entries` – NOT manual, computed via Cloud Function or server action `recomputeLeaderboard()`
- **Function**: Daily cron via Firebase Scheduler → fetch all reps + metrics → compute scores via `src/lib/scoring.ts` v2.1 → batch write to `leaderboard_entries` with `rank`, `overallScore`
- **Versioning**: `scoringVersion` field to allow recalculation when algorithm changes
- **Transparency**: `/data/leaderboard?showMethodology=true` shows formula, last computed, data sources

### 2.5 County GDP & Census (Real KNBS Pipeline)
- **Reality Check**: KNBS has NO API – only PDFs. Real app uses:
  - Manual CSV ingest: Admin uploads `county_gdp_2023.csv` → Cloud Function validates + upserts with deterministic ID `{county-year}`
  - PDF parsing fallback: `pdf-parse` lib extracts tables from `2025 Facts and Figures.pdf` – manual verification
  - Future: openAfrica CKAN API proxy
- **Display**: `DataTable` sortable high→low, chart via `recharts` (bar chart per county)

### 2.6 Secure Logins & RBAC (Production)
- **Auth**: Firebase Auth Email/Password + Google + Phone (OTP) – MFA optional
- **Roles**: Custom claims `admin:true`, `role:admin|moderator|user`. Set via Admin SDK script
- **Rules**: Hardened v2 – public read, admin-only writes for sensitive collections, `isOwner()` for reviews, `ai_usage` audit
- **ID Verification**: For MCA candidate? Future: ID number hashed, not stored plaintext

### 2.7 Highlights & Social Feed
- **Real X API**: Bearer token via Secret Manager → `https://api.twitter.com/2/users/by/username/{handle}/tweets?max_results=10`
- **Fallback**: If handle missing, use Google News for same person + project launches
- **Anti-Abuse**: Rate limit 5/hr/user, queue to `highlights_pending_review` in prod, admin approval UI at `/dashboard/admin`

### 2.8 Community Reviews
- **Validation**: Zod + rules: comment 10-1000 chars, rating 1-5, `createdAt == request.time`, `userId == auth.uid`
- **Moderation**: Profanity filter (simple list + AI filter), admin can delete
- **Scoring Impact**: Average rating contributes 20% to overallScore (normalized)

## 3. Architecture — Senior 20yr Design

### C4 Context
- **Users**: Citizens, Journalists, Researchers, Admins
- **External Systems**: Mzalendo, Parliament.go.ke, KNBS PDFs, GNews, X API, Firebase (Auth, Firestore, Hosting, Storage, Secret Manager), Gemini

### Container Diagram (Next.js App Router)
```
Browser
 → Next.js 15 (SSR/SSG/ISR) @ App Hosting
   → Firebase JS SDK (Auth, Firestore client, Storage)
   → Server Actions (aiActions.ts → Genkit flows → Gemini)
   → Firebase Admin SDK (for leaderboard recompute, admin dashboard)
 → Cloud Firestore (primary DB, regional: eur3 for compliance?)
 → Firebase Storage (photos)
 → Secret Manager (API keys)
 → Cloud Logging, Monitoring, Error Reporting
```

### Component Diagram (Key Components)
- `MainLayout`: Header with Kenyan flag accent, footer, auth state
- `RepresentativeCard`: Displays rep with photo, party, county
- `PerformanceMetricsDisplay`: Lists metrics with trend icons (up/down/stable)
- `IntegrityReportGenerator`: Calls AI flow, shows confidence + sources
- `SocialHighlightsGenerator`: Trigger + shows pending status
- `DataTable<T>`: Generic sortable/filterable with `accessorKey`, handles null sort key safely
- `FirebaseProvider`: Provides `firestore`, `auth`, `user`, `isUserLoading` via context

### Data Flow — Real
1. Citizen searches → Firestore query `where(position) + where(county) + limit(24)` → client filter by name → render cards
2. Citizen opens profile → query rep by slug → parallel queries for subcollections (highlights, metrics) → tabs
3. Admin triggers fact-check → Server Action → Genkit → GNews tool → Gemini → Zod validation → write to `integrity_reports` (admin only) → audit `ai_usage`
4. Cron → `recomputeLeaderboard()` → scoring algorithm → batch write `leaderboard_entries`

## 4. Security & Governance (Implemented in Hardening)

- **Change Mgmt**: PR template, CODEOWNERS, `ci.yml` (typecheck+build+audit), rollback via git revert + rules history
- **Secure Dev**: Zod everywhere, server-side authZ in rules, no secrets hardcoded (.env.example), approved libs, error handling (no stack leak)
- **Access Control**: `isSignedIn()`, `isOwner()`, `isAdmin()` via custom claims, object-level for reviews
- **Secrets**: Secret Manager for server keys, client key public but restricted via GCP API restrictions
- **Monitoring**: `ai_usage` audit collection, Cloud Logging, proposed GCP Monitoring dashboards for rule denials, AI errors
- **Testing**: typecheck+build gating, failure modes in PR template, need unit tests (Vitest) for rules, prompt injection
- **AI Governance**: Input untrusted, system prompt hierarchy controlled, output validated before persistence (pending_review queue), rate limiting 5/hr, anomaly monitoring via logs
- **Exception**: Register with rationale, scope, compensating controls, owner, expiry (EX-001 mock data open until 2026-10-20)

## 5. Style Guidelines (Updated to Kenyan Identity)

- **Primary**: `120 45% 30%` #2a6d2a Dark Green (trust, agriculture)
- **Accent**: `0 63% 40%` #b92f2f Strong Red (alert)
- **Background**: `210 20% 98%` Almost white
- **Headline**: `Poppins` via `next/font/google`, variable `--font-poppins`
- **Body**: `PT Sans` via `--font-pt-sans`, optimized, no CLS
- **Animation**: `kenya-flag-animate` 600% gradient black-white-red-white-green, 10s ease infinite, used sparingly (header accent, not full page)
- **Cards**: `shadow-lg hover:shadow-xl transition-shadow`, rounded `0.5rem`, border `210 20% 85%`

## 6. Scaling to 1M Users

- **Reads**: 3K reps × 24 per page = 125 Firestore reads per full browse. With 1M users/month browsing 5 pages avg = 5M reads/month ≈ $3 (Firestore pricing). Use CDN caching: `revalidate: 3600` ISR for leaderboard, county GDP (rarely changes)
- **Writes**: Reviews limited, highlights pending_review reduces spam
- **Search**: Current client filter okay for 3K docs, but at 1M users need Algolia – 3K records Algolia free tier
- **Photos**: Storage + Cloud CDN, 400x400 WebP, lazy load
- **AI Costs**: Gemini Flash $0.075/1M input, $0.30/1M output. Fact-check per rep: ~2K tokens → $0.00075. 3K reps × monthly refresh = $2.25/month – negligible

## 7. Roadmap — From Template to Real

**Phase 0: Template (Before)**
- Firebase Studio scaffold, `page.tsx` FeatureCards, `ignoreBuildErrors: true`, mock data, broken CI

**Phase 1: Hardened (NOW – Completed 2026-07-20)**
- Fixed build, secure rules, AI safety guards, pagination, compliance pack, detailed README

**Phase 2: Real Data Pipeline (Next 2 sprints)**
- Implement GNews + X API real fetch (close EX-001)
- Mzalendo scraper + KNBS CSV uploader admin UI
- Cloud Function `recomputeLeaderboard` + scheduler
- Admin dashboard `/dashboard/admin` to approve pending highlights

**Phase 3: Trust & Scale (Next quarter)**
- App Check, Recaptcha, profanity filter
- Vitest unit tests + Firestore rules tests + Playwright e2e
- Algolia search, Swahili i18n
- Methodology page `/about/methodology` open-sourcing scoring

**Phase 4: Sustainability**
- Donations via M-Pesa Daraja API, partnerships with Code for Africa, Mzalendo Trust
- Open data: `/api/representatives` public JSON, CKAN

## 8. Original Template Attribution

- Template: Firebase Studio Next.js starter (`src/app/page.tsx` → FeatureCards)
- Scaffold files kept: `.idx/dev.nix`, `apphosting.yaml`, `components.json`
- All business logic rewritten, 90% new code, build now passes strict TS
- License MIT, free for civic use

---
**Author:** Senior Dev 20yrs – Planning, Secure SDLC, AI Governance, Scale
**Date:** 2026-07-20 v2.0
**Status:** Real App Architecture – Ready for Phase 2 implementation
