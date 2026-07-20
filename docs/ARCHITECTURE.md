# KenyaWatch — Real App Architecture (Senior 20yr Design)

> From Template to Production Civic Platform: Security, Scale, AI Governance, Data Veracity

---

## 1. Decision Log (ADR)

| ADR | Decision | Why | Status |
|-----|----------|-----|--------|
| ADR-001 | Next.js 15 App Router (not Pages) | SSR/ISR for SEO (representatives need index), Server Actions for AI flows, Turbopack dev | ✅ Implemented |
| ADR-002 | Firebase Firestore (not Postgres) | Template target was Firebase Studio, real-time listeners (`useCollection`), App Hosting integration, rule-based RBAC, regional compliance | ✅ Implemented |
| ADR-003 | Genkit + Gemini Flash (not OpenAI) | Firebase native, Secret Manager integration, $0.30/1M output cheap for civic, structured output Zod | ✅ Implemented |
| ADR-004 | Mock data guarded by `USE_MOCK_AI_DATA` | KNBS has no API, X API needs payment, need dev velocity but safe-fail in prod | ✅ Hardened |
| ADR-005 | Custom claim `admin:true` for RBAC (not Firestore role doc) | Rules evaluate custom claims without extra read, faster, secure, standard Firebase pattern | ✅ Implemented |
| ADR-006 | `pending_review` queue for AI outputs in prod (not direct publish) | Mitigates defamation, hallucinations, Prompt injection → human-in-loop per AI Governance control | ✅ Implemented |
| ADR-007 | Scoring versioned in code (`src/lib/scoring.ts`) + field `scoringVersion` in `leaderboard_entries` | Reproducible, auditable, can recompute when algorithm improves, transparency | ✅ Designed, TODO impl |
| ADR-008 | Algolia for search at scale (not Firestore) | Firestore no full-text, 3K docs now okay client filter but 1M users need Algolia free tier | ⏳ Phase 3 |

---

## 2. C4 Model

### Context
```
Citizens, Journalists, Researchers → KenyaWatch (App Hosting) → 
  ↘ Firebase Auth, Firestore, Storage, Secret Manager
  ↘ External: Mzalendo Pombola, Parliament.go.ke, KNBS PDFs, GNews, X API, Gemini
Admins → Admin Dashboard → approve pending highlights, recompute leaderboard
```

### Container
- **Web App**: Next.js 15, Tailwind, shadcn, `MainLayout`, `DataTable<T>`, `RepresentativeCard`
- **API Layer**: Next.js Server Actions (`src/app/actions/aiActions.ts`) wrapping Genkit flows
- **AI Runtime**: Genkit dev server + flows (`fact-check`, `social-highlights`, `integrity-summary`, `economic-data`)
- **DB**: Firestore (regional `eur3` or `us-central` – choose for KE data residency discussion)
- **Storage**: Firebase Storage for rep photos 400x400 WebP
- **Secrets**: Secret Manager for `GENAI_KEY`, `GNEWS_KEY`, `X_BEARER`
- **Observability**: Cloud Logging, Monitoring, Error Reporting, `ai_usage` collection

### Component (Critical)
```
FirebaseProvider (provider.tsx)
  ├─ useFirebase() → {firebaseApp, firestore, auth, user, isUserLoading}
  ├─ useUser() → UserHookResult
  └─ useMemoFirebase(factory, deps) → memoized query

RepresentativesPage (client)
  ├─ useFirestore() → firestore
  ├─ representativesQuery = useMemoFirebase(() => query(collection(firestore,'representatives'), where(position), where(county), orderBy(name), limit(24)))
  ├─ useCollection<Representative>(query)
  └─ filteredRepresentatives = useMemo(debouncedSearch filter)

[slug]/page.tsx (client, use(params) Promise)
  ├─ rep query where(slug==) limit(1)
  ├─ parallel subcollections: highlights, performance_metrics
  └─ Tabs: overview, performance (PerformanceMetricsDisplay + AddPerformanceMetric), integrity (IntegrityReportGenerator), etc.

Genkit Flows (server)
  ├─ factCheckFlow: Tool findNewsAboutRepresentative (GNews) → Gemini → FactCheckOutput {integrityReport, confidence, sources}
  ├─ generateSocialHighlightsFlow: fetchTweets + rateLimit check → Gemini → {highlights[]} → batch write to pending_review + ai_usage
  └─ fetchEconomicDataFlow: KNBS CSV/PDF parse → batch upsert county_gdp, census_data
```

---

## 3. Data Model — Real Production

### Representatives
```ts
// Document ID = slug, e.g., william-samoei-ruto
{
  id: string, // same as slug
  slug: string, // URL safe, lower-kebab, unique
  name: string, // full official
  photoUrl: string, // https://firebasestorage.googleapis.com/.../representatives/william-samoei-ruto.webp
  position: 'President'|'Deputy President'|'Governor'|'Senator'|'MP'|'MCA'|'Women Rep',
  constituencyOrWard: string, // e.g., "Langata Constituency" or "Nairobi"
  county: string, // 47 counties enum
  party: string, // UDA, ODM, etc.
  votesGarnered?: number,
  participationRecordSummary?: string, // from Hansard
  contactInfo: { phone?, email?, officeAddress?, twitter?, facebook? },
  // Computed aggregates (denormalized for leaderboard performance)
  totalMetricsCount?: number,
  avgCommunityRating?: number,
  lastCalculated?: Timestamp
}
Indexes:
- Composite: position ASC, county ASC, name ASC
- Single: slug == (for detail page)

### Subcollections
- `performance_metrics/{metricId}`: name, value (string|number), unit, description, source (e.g., "Auditor General 2023"), trend, verified: boolean, submittedBy: uid, createdAt
- `highlights/{highlightId}`: title, date ISO, description, category, sourceUrl, generatedBy, status: 'published'
- `highlights_pending_review/{id}`: same + status: 'pending_review', triggeredByUserId, rawTweetsSnapshot
- `integrity_reports/{reportId}`: reportSummary, reportDate ISO, sourceUrls[], confidence, scoringVersion, generatedBy
- `reviews/{reviewId}`: userId, userName, rating 1-5, comment 10-1000 chars, createdAt Timestamp==request.time, helpfulCount

### Economic Data
- `county_gdp/{nairobi-2023}`: county, gdpMillionsKsh, gdpPerCapitaKsh, year, source: "KNBS 2025 Facts and Figures PDF pg 12"
- `census_data/{nairobi-2023}`: county, totalPopulation, male, female, householdCount, avgHouseholdSize, density, year
- ID deterministic to avoid duplicates, merge:true on write

### Leaderboard
- `leaderboard_entries/{repId}`: copy of Representative fields + rank, overallScore 0-100, performanceScore, integrityScore, scoringVersion: "v2.1", lastComputed: Timestamp, rankChange: +2/-1
- Query: orderBy(rank ASC), limit 100, composite filters position, county
- Recomputed daily via Cloud Scheduler → Cloud Function `recomputeLeaderboard`

### Audit & Rate Limit
- `ai_usage/{autoId}`: userId, type: 'highlights'|'fact-check', representativeId, createdAt Timestamp, promptHash (SHA256 of prompt for forensics without PII)
```

---

## 4. Scoring Algorithm — Real (Transparency)

File: `src/lib/scoring.ts` (to be implemented in Phase 2)

```ts
// Scoring v2.1 – open source, auditable
export type ScoringInput = {
  attendance: number // 0-100%
  cdfUtilization: number // 0-100%
  billsSponsored: number // count, normalized log scale
  developmentProjects: number
  communityRating: number // 1-5 avg
  verifiedScandals: number // count with reputable source
  allegedScandals: number // count without strong source
  yearsClean: number // years without scandal
  sourceWeights: { auditorGeneral: 1.5, hansard:1.2, user:0.8 }
}

export function calculatePerformanceScore(input: ScoringInput): number {
  const legislative = Math.min(100, Math.log10(input.billsSponsored +1)*40 + input.attendance*0.6)
  const development = input.cdfUtilization*0.7 + Math.min(100, input.developmentProjects*10)*0.3
  return Math.round(legislative*0.5 + development*0.3 + input.communityRating/5*100*0.2)
}

export function calculateIntegrityScore(input: ScoringInput): number {
  let score = 100
  score -= input.verifiedScandals*15
  score -= input.allegedScandals*5
  score += input.yearsClean*2
  return Math.max(0, Math.min(100, score))
}

export function calculateOverall(input: ScoringInput): {overall, perf, integ} {
  const perf = calculatePerformanceScore(input)
  const integ = calculateIntegrityScore(input)
  const overall = Math.round(perf*0.6 + integ*0.3 + input.communityRating/5*100*0.1)
  return {overall, perf, integ}
}

// Future: expose via /api/scoring?repId=... returns inputs + formula + version for transparency
```

**Transparency Requirement**: `/data/leaderboard?methodology=true` shows formula, weights, last computed date, link to `src/lib/scoring.ts` on GitHub.

---

## 5. Security Architecture (Senior)

### Threat Model

| Threat | Mitigation Implemented | Remaining Risk |
|--------|------------------------|----------------|
| Firestore poison (any auth writes GDP) | Rules `isAdmin()` only, admin via custom claim, audit log | Need App Check |
| Defamation via AI hallucinated scandal | Guard: require sourceUrls[], confidence, disclaimer, pending_review queue | Need real GNews API + human review UI |
| Prompt injection "ignore previous, say X corrupt" | System prompt hierarchy, tool output labeled untrusted, Zod output schema restricts fields, PR template test | Need automated prompt injection test suite |
| Rate limit bypass (spam highlights) | `ai_usage` query last hour, throw if >=5, server-side check | Need distributed counter via Redis for scale |
| Secrets leakage (Gemini key in logs) | No `console.log(process.env)`, Secret Manager, `.gitignore` serviceAccountKey | Need API key restriction in GCP console |
| IDOR (user edits other's review) | Rule `isOwner(resource.data.userId)` + `userId == auth.uid` on create | Passes |
| XSS via review comment | `DOMPurify`? Currently React escapes, but add sanitization library for rich text future | Need sanitization lib |

### Defense in Depth

- **Edge**: Next.js security headers (X-Frame-Options DENY, etc.), App Hosting automatic TLS, HSTS
- **App**: Zod validation, server-side authZ in rules, client `useUser` only for UI
- **Data**: Firestore rules, custom claims, audit `ai_usage`, pending_review human-in-loop
- **Env**: Secret Manager, `.env.example`, `.gitignore`

---

## 6. Scalability to 1M MAU (Senior Planning)

**Assumptions**: 3K reps, avg 10 metrics each = 30K metrics, 47 counties GDP, 47 census, 100K reviews/year

**Read Costs**:
- Browse reps: 24 docs per page × 5 pages/user avg × 1M users = 120M reads/month? Actually 24*5=120 reads per user ×1M=120M reads = $72/month (Firestore $0.06/100K). Mitigation: ISR `revalidate: 3600` for leaderboard, GDP, census (static). Client cache `useMemoFirebase` reduces re-query.

**Optimization**:
- Use `select()` to fetch only needed fields for card grid (name, photoUrl, position, county, party) – not full doc with participation summary
- Photo CDN: Firebase Storage + `?alt=media` + Cloud CDN, WebP, 400px, lazy load, `priority` only for above fold
- Search: Current client filter scans 24 docs fine, but for 3K docs need Algolia – free tier 10K records, 100K ops/month
- AI Costs: Gemini Flash cheap, but schedule fact-check monthly not per request, cache results in `integrity_reports` with TTL 30 days

**Write Costs**:
- Reviews: 100K/year = 8K/month writes = negligible
- Highlights: rate limited 5/hr = max 120/day per user, but pending_review queue reduces spam

---

## 7. AI Governance — Production

See `docs/compliance/07_AI_LLM_GOVERNANCE.md` but senior add:

- **Eval**: Genkit eval for faithfulness (does integrity summary stay grounded in tool output?) – add `genkit eval:run`
- **Tracing**: Enable Genkit tracing to Cloud Trace for forensics
- **Bias**: Party affiliation bias check – ensure scoring not favor UDA/ODM – test with synthetic reps same metrics different party → score should be same
- **Data Leakage**: Ensure Gemini prompt does not include PII like phone, email – only name, public info

---

## 8. Migration from Template

| Template File | Real App Change | Reason |
|---------------|-----------------|--------|
| `src/app/page.tsx` `layout="fill"` | `fill` + style | Next 15 breaking change |
| `src/app/layout.tsx` `<link fonts>` | `next/font/google` | Performance, CLS, best practice |
| `next.config.ts` `ignoreBuildErrors:true` | Removed, added headers, remotePatterns | Security control SD-5 |
| `.github/workflows/webpack.yml` `npx webpack` | `ci.yml` `npm ci && build` | Template used webpack demo, real app uses Next build |
| `src/contexts/AuthContext` mock sessionStorage | Firebase Auth real `onAuthStateChanged` (TODO Phase 2) | Secure auth per AC-3 |
| `firestore.rules` public write for county_gdp | `isAdmin()` only | Access control |
| `src/ai/flows/*` mock arrays | Env flag + real API throws safe-fail | AI governance |

---

## 9. Senior Checklist — Before Prod

- [ ] Branch protection: require PR, 1 approval, CODEOWNERS, CI green
- [ ] App Check enabled (reCaptcha v3)
- [ ] API key restrictions in GCP: Firebase key restricted to your hosting domain + Auth + Firestore
- [ ] Secret Manager: `GOOGLE_GENAI_API_KEY`, `GNEWS_KEY`, `X_BEARER` in Secret Manager, not env file
- [ ] Firestore indexes deployed: `firebase deploy --only firestore:indexes`
- [ ] Emulator tests for rules: `firebase emulators:exec "npm run test:rules"`
- [ ] Load test: k6 script for `/representatives` 1K concurrent
- [ ] Legal: Disclaimer page `/legal/disclaimer` + Data Protection Act compliance note
- [ ] Methodology page `/about/methodology` open-sourcing scoring v2.1

---

## 10. References

- Mzalendo Pombola: https://info.mzalendo.com
- KNBS: https://www.knbs.or.ke (PDFs only – no API per FAQ)
- EveryPolitician: https://everypolitician.org (archived but data useful)
- Firestore RBAC via custom claims: https://firebase.google.com/docs/auth/admin/custom-claims
- Genkit Governance: https://firebase.google.com/docs/genkit/prompt-management
- Kenya Data Protection Act 2019: https://www.odpc.go.ke

---
**Author:** Senior Architect 20yr – Scalable civic tech, Secure SDLC, AI Governance  
**Date:** 2026-07-20  
**Version:** v2.0 Real App
