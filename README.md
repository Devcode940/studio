# 🇰🇪 KenyaWatch

### *Transparency • Accountability • Progress*

> **Yes, this started as a Firebase Studio template.**  
> Original scaffold: `Firebase Studio Next.js starter (src/app/page.tsx)` – we have since evolved it into a full civic-tech platform for monitoring Kenyan elected leaders from President to MCA.

[![Next.js 15.3](https://img.shields.io/badge/Next.js-15.3.8-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange)](https://firebase.google.com/)
[![Genkit AI](https://img.shields.io/badge/Genkit-Gemini%202.0%20Flash-blue)](https://firebase.google.com/docs/genkit)
[![Security](https://img.shields.io/badge/Security-Hardened-green)](./SECURITY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Live Demo:** *(add your App Hosting URL)* | **Docs:** `./docs/blueprint.md` | **Architecture v2:** `./docs/ARCHITECTURE.md` | **Production Build:** `./docs/PRODUCTION_APP.md` | **Compliance:** `./COMPLIANCE.md` | **Security:** `./SECURITY.md`

---

### 📖 Table of Contents
1. [Problem & Vision](#-problem--vision)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture & Data Model](#-architecture--data-model)
5. [Project Structure](#-project-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [Firebase Setup](#-firebase-setup)
9. [AI Flows - How Integrity Reports Work](#-ai-flows---how-integrity-reports-work)
10. [Security](#-security)
11. [Scripts](#-scripts)
12. [Seeding Data](#-seeding-data)
13. [Deployment](#-deployment)
14. [Roadmap](#-roadmap)
15. [Contributing](#-contributing)
16. [FAQ](#-faq)
17. [Legal & AI Safety](#-legal--ai-safety)
18. [Credits & Template Attribution](#-credits--template-attribution)

---

### 🎯 Problem & Vision

Kenyans struggle to find **centralized, verifiable, searchable** information on their elected representatives. Performance data is scattered across Parliament Hansard, KNBS, Auditor General, county assembly sites.

**KenyaWatch solves this by:**
- Consolidating profiles for President, Deputy President, Governors, Senators, MPs, Women Reps, MCAs
- Making performance KPIs (attendance, bills, CDF utilization) comparable
- Providing AI-assisted but **source-grounded** integrity summaries (with disclaimer & admin review, never publish hallucinations)
- Ranking leaders via transparent leaderboard algorithm
- Presenting county GDP & census context so citizens link leadership to development outcomes

> This is not a campaign tool. It is a citizen oversight tool.

---

### ✨ Features

#### 1. Representative Profiles `/representatives`
- Card grid with photo, position, party, county, constituency/ward
- **Search**: debounced (300ms) by name
- **Filters**: Position (7 types) + County (auto-extracted, dynamic)
- **Pagination**: `limit(24)` server query to avoid Firestore read bomb. Ready for infinite scroll with `startAfter()`
- Detail page `/representatives/[slug]` with tabs

#### 2. Representative Detail Tabs
- **Overview**: participation summary, votes garnered
- **Performance**: metrics from `performance_metrics` subcollection (e.g., attendance %, CDF absorption). Users can propose metrics via `AddPerformanceMetric` (goes to review queue per `firestore.rules`)
- **Integrity**: `IntegrityReportGenerator` uses Genkit flow `factCheckRepresentative` + `summarize-integrity-report` – now with confidence level, source URLs, disclaimer
- **Highlights**: AI-extracted achievements/votes/project launches
- **Social Feed**: `SocialHighlightsGenerator` calls `generateSocialHighlights` – in prod writes to `highlights_pending_review`, rate limited 5/hr/user
- **Community**: Reviews & ratings (1-5 stars), validated in security rules (`comment 10-1000 chars`, `createdAt == request.time`)

#### 3. Leaderboard `/data/leaderboard`
- `DataTable` with sortable columns: rank, name, county, party, overall, performance, integrity scores
- Crown icon for #1, badges for #2/#3
- Filters by position/county
- Data source: `leaderboard_entries` (computed by backend – TODO Cloud Function)

#### 4. County GDP `/data/county-gdp` & Census `/data/census`
- Sortable tables for economic context
- Mock data for Nairobi/Mombasa/Kiambu/Nakuru, designed to be replaced with KNBS API ingest via `fetchEconomicData` flow

#### 5. Auth & Dashboard `/auth/login`, `/dashboard`
- Firebase Auth via `FirebaseClientProvider` + `AuthProvider`
- Mock `AuthContext` for now (sessionStorage) – replace with Firebase SDK sign-in in prod
- Protected dashboard with logout

#### 6. Kenyan Identity
- Theme: Deep green `#2a6d2a` (primary), red `#b92f2f` (accent), black/white for flag
- `kenya-flag-animate` gradient animation utility (600% size, 10s infinite)
- Fonts: `Poppins` for headlines, `PT Sans` for body – migrated to `next/font/google` for zero CLS

---

### 🧰 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 15.3.8 | App Router, SSR/SSG |
| Language | TypeScript | 5.x | Strict mode now enforced |
| UI | Tailwind CSS 3.4, Radix UI, shadcn/ui, lucide-react | - | Accessible components |
| Backend | Firebase Auth, Firestore, App Hosting, Storage | 11.9.1 | Auth + DB + Hosting |
| AI | Genkit 1.8, @genkit-ai/googleai, Gemini 2.0 Flash | 1.8.0 | Integrity & highlights |
| Forms | react-hook-form + zod + @hookform/resolvers | 7.54 + 3.24 | Validation |
| Charts | recharts 2.15 | - | County GDP viz (future) |
| Date | date-fns 3.6 | - | ISO formatting |
| Dev | Genkit CLI, TSX | - | `genkit:dev` |

---

### 🏗️ Architecture & Data Model

#### High-Level Flow
```
User (Browser)
  ↓
Next.js App Router (src/app)
  ├─> MainLayout (header/footer, Kenyan theming)
  ├─> Firebase Hooks (useCollection, useFirestore, useUser)
  └─> Genkit Flows (server actions in src/app/actions/aiActions.ts)
        ↓
      Gemini 2.0 Flash (fact-check, summarize)
        ↓
      Firestore Subcollections (highlights_pending_review)
        ↓
      Admin Review → Publish
```

#### Firestore Structure
```
representatives/{repId}
  ├─ fields: id, slug, name, photoUrl, position, constituencyOrWard, county, party, contactInfo {}, votesGarnered, participationRecordSummary
  ├─ performance_metrics/{metricId}: name, value, unit, description, source, trend (up/down/stable)
  ├─ highlights/{highlightId}: title, date (ISO), description, category, sourceUrl, generatedBy, status
  ├─ highlights_pending_review/{...} [PROD queue]
  ├─ integrity_reports/{reportId}: reportSummary, reportDate, sourceUrls[]
  └─ reviews/{reviewId}: userId, userName, rating 1-5, comment, createdAt Timestamp

county_gdp/{county-year}: county, gdpMillionsKsh, gdpPerCapitaKsh, year
census_data/{county-year}: county, totalPopulation, malePopulation, femalePopulation, householdCount, etc.
leaderboard_entries/{repId}: copy of Representative + rank, overallScore, performanceScore, integrityScore
ai_usage/{autoId}: userId, type=highlights|fact-check, representativeId, createdAt Timestamp (for rate limiting)
```

#### AI Flows (src/ai/flows)
- `fact-check-representative.ts`: Tool `findNewsAboutRepresentative` → Gemini summarizes with confidence + sources. Mock guarded by `USE_MOCK_AI_DATA`
- `summarize-integrity-report.ts`: Takes newsSummary + sourceUrls → returns neutral summary with disclaimer + confidence. Rejects if no sources in prod.
- `generate-social-highlights.ts`: Fetches tweets (mock or X API) → extracts up to 5 highlights via structured output → writes batch + usage log, admin queue in prod
- `fetch-economic-data.ts`: KNBS ingest (mock now) → upserts with deterministic docId `${county-year}`

---

### 📂 Project Structure

```
studio/
├── .github/workflows/ci.yml        # Fixed: Next build, not webpack
├── .idx/dev.nix                    # Firebase Studio IDX env
├── apphosting.yaml                 # App Hosting config
├── components.json                 # shadcn config
├── firestore.rules                 # HARDENED v2 (admin-gated)
├── next.config.ts                  # HARDENED (no ignoreBuildErrors)
├── docs/
│   ├── blueprint.md                # Original spec (KenyaWatch)
│   └── backend.json
├── src/
│   ├── ai/
│   │   ├── genkit.ts               # Genkit init
│   │   ├── dev.ts                  # Genkit dev server
│   │   └── flows/                  # 4 flows (fact-check, highlights, integrity, economic)
│   ├── app/
│   │   ├── layout.tsx              # Root layout + next/font + metadata
│   │   ├── globals.css             # Tailwind + Kenyan flag animate
│   │   ├── page.tsx                # Landing + FeatureCards
│   │   ├── actions/aiActions.ts    # Server actions wrapping flows
│   │   ├── auth/login/
│   │   ├── dashboard/
│   │   ├── data/{census,county-gdp,leaderboard}/
│   │   └── representatives/{page.tsx, [slug]/page.tsx}
│   ├── components/
│   │   ├── layout/MainLayout.tsx
│   │   ├── representatives/* (Card, IntegrityReportGenerator, SocialHighlightsGenerator, etc.)
│   │   ├── shared/DataTable.tsx    # Generic sortable/filterable table
│   │   └── ui/* (shadcn)
│   ├── contexts/AuthContext.tsx    # Mock auth (replace with Firebase)
│   ├── firebase/
│   │   ├── config.ts               # Firebase client config (move to env for multi-env)
│   │   ├── provider.tsx            # FirebaseProvider with useFirebase, useUser, etc.
│   │   ├── client-provider.tsx
│   │   └── firestore/use-collection.ts
│   ├── hooks/useAuth.ts            # Wraps AuthContext
│   ├── lib/utils.ts
│   └── types/index.ts              # Domain types
├── .env.example
├── SECURITY.md
├── FIXES_APPLIED.md
└── README.md (this file)
```

---

### 🚀 Getting Started

#### Prerequisites
- Node 20+ (`node -v`)
- npm 10+
- Firebase CLI `npm i -g firebase-tools`
- Gemini API key from Google AI Studio

#### 1. Clone & Install
```bash
git clone https://github.com/Devcode940/studio.git kenyawatch
cd kenyawatch
npm ci
```

#### 2. Env Setup
```bash
cp .env.example .env.local
```
Fill in:
```ini
NEXT_PUBLIC_FIREBASE_API_KEY=...
GOOGLE_GENAI_API_KEY=your_gemini_key
USE_MOCK_AI_DATA=true  # for local dev without real APIs
GNEWS_API_KEY=  # optional for real fact-check
X_BEARER_TOKEN= # optional for real tweets
```

#### 3. Run Dev
```bash
# App (Turbopack on 9002 as per package.json)
npm run dev

# In second terminal: Genkit AI dev UI
npm run genkit:dev
# Then open http://localhost:4000 (Genkit) + http://localhost:9002 (App)
```

#### 4. Typecheck & Build (must pass now)
```bash
npm run typecheck
npm run build
```

---

### 🔐 Firebase Setup

#### Create Project
```bash
firebase login
firebase projects:create kenya-watch-prod
firebase use kenya-watch-prod
```

#### Firestore & Rules
```bash
firebase init firestore --project kenya-watch-prod
# Deploy hardened rules
firebase deploy --only firestore:rules
```

**Firestore Indexes Needed** (add via console if you see errors):
- `representatives` composite: `position ASC` + `county ASC` + `name ASC`
- `representatives` single: `slug ==`
- `leaderboard_entries` : `rank ASC`

#### Auth
- Enable Email/Password in Firebase Console → Authentication
- For Google sign-in: enable Google provider

#### Admin Claim
First user → make admin via Firebase Admin SDK:
```js
// scripts/makeAdmin.js (create with serviceAccountKey.json)
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
admin.auth().setCustomUserClaims('UID_FROM_CONSOLE', { admin: true, role: 'admin' })
  .then(()=> console.log('Admin set'))
```

Or use Firebase CLI extension.

#### Storage (for rep photos)
```bash
firebase init storage
# Add rule: allow read all, write admin only
```

---

### 🤖 AI Flows - How Integrity Reports Work

We **do NOT** publish raw LLM output about real people. Flow:

1. **Trigger**: Admin or rate-limited user calls `factCheckRepresentative({name})`
2. **Tool Call**: `findNewsAboutRepresentative` → in prod calls GNews/NewsAPI filtered to reputable Kenyan outlets (Nation, Standard, Star, The Elephant)
3. **LLM**: Gemini 2.0 Flash with system prompt:
   ```
   CRITICAL: ONLY use tool output. If no reputable sources → "No verified concerns found"
   Neutral language, prefix allegations with "Alleged" + source URL
   Add disclaimer: "AI-generated summary for informational purposes. Verify with original sources."
   150 words max
   ```
4. **Output**: `{integrityReport, confidence: high|medium|low, sources: string[]}`
5. **Review**: Saved to `integrity_reports` subcollection only if admin. For highlights, queue to `highlights_pending_review`

**To test with mocks** (dev only):
```bash
USE_MOCK_AI_DATA=true npm run genkit:dev
# Call flow in Genkit UI
```

**To implement real APIs**:
- Edit `findNewsArticlesReal()` in `fact-check-representative.ts` → fetch GNews: `https://gnews.io/api/v4/search?q="${name}"&lang=en&country=ke&in=title`
- Edit `getRealTweets()` in `generate-social-highlights.ts` → `https://api.twitter.com/2/tweets/search/recent?query=from:${handle}` with Bearer
- Edit `getLatestEconomicDataFromAPI()` in `fetch-economic-data.ts` → parse KNBS CSV

---

### 🛡️ Security

See `SECURITY.md` for full audit, but summary:

| Issue Before | Fix After |
|--------------|-----------|
| `ignoreBuildErrors: true` hid 12 TS errors | Removed, build now passes strict |
| `firestore.rules` allowed any auth user to write `county_gdp`, `highlights` | Admin-only via `request.auth.token.admin == true` |
| Mock AI wrote directly to prod collections | `USE_MOCK` flag + `highlights_pending_review` queue |
| No rate limiting | `ai_usage` collection + 5/hr check |
| `npx webpack` CI that always failed | `ci.yml` with `npm ci && build` |

**Also added**: security headers (X-Frame-Options DENY, etc.), image domains allowlist, Zod validation on all writes.

---

### 📜 Scripts

- `dev` – Next dev with Turbopack on 9002
- `genkit:dev` – Genkit dev UI + flows
- `genkit:watch` – watch flows
- `build` – production build (now passes!)
- `typecheck` – `tsc --noEmit`
- `lint` – `next lint`

---

### 🌱 Seeding Data

Example script to seed 1 rep (create `scripts/seed.js`):

```js
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { firebaseConfig } = require('../src/firebase/config.ts'); // copy values
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  await setDoc(doc(db, 'representatives', 'william-ruto'), {
    id: 'william-ruto',
    slug: 'william-ruto',
    name: 'William Samoei Ruto',
    photoUrl: 'https://placehold.co/400x400.png',
    position: 'President',
    constituencyOrWard: 'National',
    county: 'Nairobi',
    party: 'UDA',
    votesGarnered: 7176270,
    participationRecordSummary: 'President since 2022',
    contactInfo: { twitter: '@WilliamsRuto', email: 'president@president.go.ke' }
  });
  console.log('seeded');
}
seed();
```

Better: import CSV of all 47 governors, 47 senators, 290 MPs, 1450 MCAs from IEBC.

---

### ☁️ Deployment

#### Firebase App Hosting (Recommended – original template target)
```bash
firebase init apphosting
# Edit apphosting.yaml already present
firebase deploy --only apphosting
# Set secrets: firebase apphosting:secrets:set GOOGLE_GENAI_API_KEY
```

#### Vercel Alternative
```bash
vercel --prod
# Add env vars in dashboard
```

**Prod env must**:
```
USE_MOCK_AI_DATA=false
GOOGLE_GENAI_API_KEY=...
```

---

### 🗺️ Roadmap

- [ ] **Phase 1 – Data Integrity** (Current hardened branch)
  - [x] Secure rules, fixed build, AI safety guards
  - [ ] Real KNBS API ingest + CRON
  - [ ] Mzalendo API for attendance/bills
  - [ ] Admin dashboard `/dashboard/data-management` to approve pending highlights

- [ ] **Phase 2 – Scoring**
  - [ ] Cloud Function: compute `overallScore = 0.4*performance + 0.4*attendance + 0.2*communityRating`
  - [ ] Leaderboard scheduled daily

- [ ] **Phase 3 – Community**
  - [ ] Firebase App Check
  - [ ] Recaptcha on reviews
  - [ ] Follow reps, notifications

- [ ] **Phase 4 – Scale**
  - [ ] Search with Algolia/Typesense for 2000+ reps
  - [ ] Image optimization via Firebase Storage + CDN
  - [ ] Swahili localization

---

### 🤝 Contributing

PRs welcome! Please:
1. Run `npm run typecheck` – must pass
2. Follow Kenyan flag color tokens in `globals.css`
3. Never commit `.env.local` or `serviceAccountKey.json`
4. Add source URLs for any integrity-related change
5. Write neutral, non-partisan copy

---

### ❓ FAQ

**Q: Is this really a Firebase Studio template?**
A: Yes. Initial commit was `initial scaffold` from Firebase Studio. The README was just "This is a NextJS starter in Firebase Studio." We've kept IDX config in `.idx/dev.nix` for attribution, but rewrote 90% of app logic.

**Q: Why mock data in AI flows?**
A: Template used mocks to demo Genkit without API costs. We now guard mocks behind `USE_MOCK_AI_DATA=true` and require real APIs in prod – see `SECURITY.md`.

**Q: Build was failing before?**
A: Yes, original `webpack.yml` failed and `next.config.ts` silenced type errors. We fixed all 12 TS errors and Next 15 breaking change.

**Q: Can I deploy mock data?**
A: Legally risky. Mock integrity reports about real leaders could be defamation. Only deploy with `USE_MOCK=false` + real sources + admin review.

---

### ⚖️ Legal & AI Safety

Per **Kenya Data Protection Act 2019** Section 26-30 and **Defamation Act Cap 36**:

- Integrity reports are **AI-generated summaries**, not factual accusations
- Must include disclaimer + confidence + source URLs
- Admin must review before publishing (enforced by rules: `highlights_pending_review`)
- Users can contest via review system
- Never publish unverified scandals

> KenyaWatch team is not liable for AI hallucinations. Always verify with original reputable sources: Daily Nation, The Standard, The Star, The Elephant, Mzalendo.

---

### 🙏 Credits & Template Attribution

- **Original Template**: Firebase Studio (Google) – Next.js + Firebase + Genkit starter
- **Fork Source**: `wangarijonn-hue/studio` → `Devcode940/studio`
- **Hardened By**: Current security & build fix – July 2026 audit
- **Inspiration**: Mzalendo.com, Oxygene, Code for Africa

---

### 📄 License

MIT – Free for civic use. If you use for profit, please donate 10% to Code for Africa or Mzalendo Trust.

---

**Made with ❤️ for Kenyan Citizens – Transparency • Accountability • Progress**

*Harambee!*

