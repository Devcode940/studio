# KenyaWatch — More Features (Principle: NEVER TRUST EXECUTIVE)

> **NB: Always don't trust executive** — Senior architect principle. Executive (President, DP, Cabinet, Governors, County Executive) controls information flow. Real civic tech must verify executive claims via independent institutions: OAG, Judiciary, Parliament, Controller of Budget, public.

---

## Core Principle Applied to Architecture

**Current Risk:** If you trust executive press releases (State House, KBC, county comms), you publish propaganda as performance.

**Senior Fix:**

| Executive Claim | Don't Trust — Verify Via Independent | Weight |
|-----------------|--------------------------------------|--------|
| "We built 10 dispensaries" | OAG audit + County Assembly oversight minutes + citizen photo verification | OAG 1.5x primary, citizen photo 1.0x, executive press 0.4x (lowest) |
| "CDF 100% utilized" | OAG NG-CDF audit opinion + Auditor General unsupported expenditure | OAG 1.5x, executive 0.4x |
| "No corruption" | Judiciary cases where executive lost + EACC reports + media investigations | Judiciary 1.5x, EACC 1.4x, executive denial 0.2x |

**New Trust Tier — Executive (Lowest):**

Add to `REPUTABLE_KENYAN_SOURCES`:
```ts
// Executive – Lowest trust 0.4x – must be cross-checked
'president.go.ke' -> 0.4x
'statehouse.go.ke' -> 0.4x
'county.go.ke' (any county executive site) -> 0.5x
```

Executive data never directly increases score — only independent verification does.

---

## 15 New Features — Built for Distrust

### 1. Executive Promises vs Delivery Tracker (Flagship)
**Why:** Presidents/Governors make 100+ promises, 20% delivered. Track every promise.

**How:**
- Collection `executive_promises/{promiseId}`: `who: "William Ruto" | "Governor Sakaja"`, `promise: "Build 5 markets in Nairobi"`, `datePromised: 2022-08`, `sourceUrl: president.go.ke speech PDF`, `deadline: 2027`, `status: Not Started|In Progress|Completed|Broken`, `evidence: [photoUrl, OAG report, citizen verification]`, `verifiedBy: independent source`
- UI: `/promises` — filter by who, status, county. Progress bar: 5 promised, 1 completed = 20%. RAG rating.
- Scoring: Completed promise with OAG verification = +5 performance, Broken = -10 integrity
- Source: State House speeches (executive 0.4x) + OAG verification (1.5x) + citizen photo (1.0x)

**Implementation:** `src/lib/executive-promises.ts` + admin page `/dashboard/admin/promises` to add/edit promises

---

### 2. Cabinet Secretary Scorecard (Don't Trust Executive Self-Assessment)
**Why:** CSs report to President, self-assess 90% — need independent score.

**How:**
- Collection `cabinet_secretaries/{csId}`: name, ministry, appointmentDate, promises, OAG audit of ministry (e.g., Health ministry pending bills), Parliament committee summons count, court cases lost
- Metrics: `ministryBudgetAbsorption`, `pendingBills`, `parliamentSummons`, `courtCasesLost`, `projectsCompletedVerified`
- Source: OAG national govt audits (ministry), Parliament committee Hansard, Judiciary Kenya Law cases where ministry lost
- UI: `/cabinet` — cards with integrity red flags, not just executive press release

---

### 3. State House Expenditure vs Controller of Budget (CoB)
**Why:** Executive says "We spent prudently" — CoB says different. CoB is independent under Article 228, reports actual exchequer releases vs budget.

**How:**
- Source: Controller of Budget quarterly reports `https://cob.go.ke/reports/` — PDFs with county & national spending
- Parse: Budget vs Actual, Pending Bills, Travel, State House expenditure
- Collection `cob_reports/{county-year-quarter}`: `budget, actual, variance, pendingBills, stateHouseSpend`
- UI: Chart in county page: Budget (Executive claim) vs Actual (CoB independent) — gap = distrust visual
- Scoring: High variance (>20%) = -5 integrity for Governor, high pending bills = -10

---

### 4. Executive Orders & Directives Tracker + Judiciary Check
**Why:** President issues executive orders that may be unconstitutional — Judiciary strikes down. Track.

**How:**
- Collection `executive_orders/{orderId}`: `title: "Executive Order No. 1 of 2024 on Cabinet reorganization"`, `dateIssued`, `sourceUrl: president.go.ke`, `challengedInCourt: boolean`, `courtDecision: "Upheld" | "Struck down" | "Pending"`, `judiciarySource: kenyalaw.org case URL`
- When court strikes down executive order → +2 verified scandals for President (AG primary 1.5x, Judiciary primary 1.5x)
- UI: `/executive-orders` — list, filter by challenged, show judiciary check

---

### 5. County Executive vs County Assembly Clash Detector
**Why:** Governors (executive) vs MCAs (legislature) fight — e.g., Governor impeached, budget rejected. Shows executive not trusted by own legislature.

**How:**
- Source: County Assembly Hansard, Mzalendo county, media (Star covers MCA level well — 0.8x but useful for clash)
- Collection `county_clashes/{clashId}`: `county, date, type: "Budget Rejected" | "Impeachment Motion" | "Oversight Summons Ignored"`, `executive: Governor X`, `assembly: County Assembly`, `sourceUrl`, `outcome`
- Scoring: Each clash where executive ignored assembly summons = -5 integrity for Governor
- UI: County page tab "Executive vs Assembly"

---

### 6. Procurement Red Flags — PPRA + OAG + AG Cross-Check (Don't Trust Executive Procurement)
**Why:** Executive procurement is #1 corruption — OAG finds irregular procurement, PPRA (Public Procurement Regulatory Authority) publishes tenders.

**How:**
- Source: PPRA portal `https://tenders.go.ke/` — tenders by county/ministry, AG contract review
- Cross-check: OAG `irregularProcurement` KSh + PPRA tender value + AG advisory
- Collection `procurement_flags/{flagId}`: `entity: "Nairobi County Executive"`, `tender: "Supply of hospital beds"`, `value: 500M`, `oagFinding: "Irregular procurement KSh 50M"`, `ppraUrl`, `oagUrl`, `riskLevel: High`
- UI: Rep profile → Integrity tab shows "Procurement Red Flags: 3 (Source: OAG 2023 + PPRA)"
- Scoring: High risk flag = -10 integrity

---

### 7. Whistleblower Anonymous Reporting (Encrypted, Executive Can't Trace)
**Why:** Citizens fear executive retaliation. Need secure channel not controlled by executive.

**How:**
- **Tech:** Use `tweetnacl` or `libsodium` – encrypt report client-side with public key, private key only held by independent admin (not executive-controlled). Store encrypted blob in Firestore `whistleblower_reports/{id}`: `encryptedData, iv, timestamp, county, repId` – no IP logging, no PII
- **Flow:** Citizen → `/report` → Form (rep, issue type, description, optional photo) → encrypted → admin dashboard decrypts offline with private key
- **Verification:** Admin must verify via OAG/AG before publishing as integrity report – never auto-publish whistleblower raw
- **Compliance:** Data Protection Act + Whistleblower Protection Bill – no executive access, audit log who decrypted
- **UI:** `/report` anonymous, Tor-friendly, no login required, disclaimer: "Your identity is NOT stored. Reports are encrypted. Executive cannot access."

---

### 8. FOI Request Tracker (Access to Information Act 2016) – Force Executive to Disclose
**Why:** Executive hides info – ATI Act gives citizens right to request. Track requests + executive compliance.

**How:**
- Collection `foi_requests/{requestId}`: `requester: anonymous`, `ministryOrCounty: "Ministry of Health"`, `informationRequested: "COVID funds expenditure breakdown"`, `dateRequested`, `dateDue (21 days per law)`, `status: Pending|Complied|Denied|Delayed`, `responseUrl`, `executiveComplied: boolean`
- UI: `/foi-tracker` — list requests, filter by complied/denied, shows executive compliance rate per ministry/county (e.g., "Ministry of Health compliance 30% – fails ATI")
- Scoring: County with <50% FOI compliance = -10 integrity for Governor (executive hiding)
- Source: Community submits FOI request evidence (email screenshot), admin verifies

---

### 9. Judiciary Checks on Executive – Cases Where Executive Lost
**Why:** Best proof executive not trustworthy = Judiciary strikes down executive action. Kenya Law has all cases.

**How:**
- Source: Kenya Law `kenyalaw.org/caselaw` – search "County Government vs ..." or "Republic vs Governor"
- Collection `judiciary_checks/{caseId}`: `caseTitle: "Petition 12 of 2024 – Omtatah vs Governor Sakaja"`, `court: High Court`, `executive: Governor Sakaja`, `decision: "Executive action declared unconstitutional"`, `dateDecided`, `kenyaLawUrl`, `impact: +1 verified scandal`
- Scoring: Each case where executive lost = +1 verified scandal, +2 if unconstitutional
- UI: Rep profile Integrity tab → "Judiciary Checks: Lost 3 cases (Source: Kenya Law)"
- Trust: Judiciary 1.5x primary (higher than executive 0.4x)

---

### 10. Parastatal Performance – Executive Appoints Boards, They Fail
**Why:** President/Governor appoint parastatal boards – they often fail, OAG audits parastatals.

**How:**
- Source: OAG parastatal audit reports + State Corporations Advisory Committee
- Collection `parastatals/{parastatalId}`: `name: "Kenya Power"`, `parentMinistry: "Energy"`, `boardAppointedBy: "President"`, `oagOpinion: Adverse`, `loss: KSh 2B`, `sourceUrl`
- Link to appointer (President/Governor) → integrity penalty if parastatal under his appointment fails
- UI: Executive profile (President/Governor) tab "Parastatals Appointed – Performance"

---

### 11. Executive Travel & Per Diem Tracker (Controller of Budget + Media)
**Why:** Executive travel is opaque, huge cost – CoB reports + media investigative (Nation) track.

**How:**
- Source: CoB quarterly reports – travel expenditure per county/national, plus NTV/Citizen reports "Governor spent KSh 50M on trip to US"
- Collection `executive_travel/{travelId}`: `who: "Governor Mandago"`, `destination: "US"`, `cost: 50000000`, `purpose: "Benchmarking"`, `cobSource: cob.go.ke Q1 2024`, `mediaSource: Nation 2024-02-15`, `isJustified: boolean`
- UI: County page chart – travel vs development projects spending
- Scoring: Travel >10% of development budget = -5 integrity

---

### 12. Dual Power Verification – Citizen Photo Verification of Executive Claims
**Why:** Executive says "We built market" – citizen photo says empty field. Don't trust, verify via crowd.

**How:**
- Feature: On rep profile highlights, button "Verify this project – Upload photo"
- Citizen uploads geotagged photo of claimed project (market, dispensary, road)
- Collection `project_verifications/{verificationId}`: `highlightId, photoUrl (Storage), lat, lng, verified: true|false, byUserId, timestamp`
- Admin compares claimed location vs photo geotag, approves verification
- Scoring: Verified completed = +5 performance, Failed verification (no project) = -10 integrity for rep + flag as potential fake project
- Tech: Firebase Storage for photos, exif geotag check, map view with markers

---

### 13. Budget vs Actual – Controller of Budget as Independent Truth
**Why:** Executive budget is promise, CoB actual is truth. Gap shows distrust.

**How:**
- Source: CoB `https://cob.go.ke/reports/` – County Budget Implementation Review Reports – table: approved budget, exchequer releases, actual expenditure
- Parse: per county per quarter
- UI: County page – BarChart: Approved Budget (Executive claim) vs Actual Expenditure (CoB independent) – variance % highlighted red if >15%
- Scoring: High variance + pending bills = executive not trustworthy

---

### 14. Executive Influence on Legislature – How Many Times MP Voted With Executive vs Against
**Why:** If MP always votes with executive (State House), not independent legislator – distrust executive capture of legislature.

**How:**
- Source: Mzalendo voting records + Parliament Hansard
- Collection `legislative_votes/{voteId}`: `bill: "Finance Bill 2024"`, `mp: "John Doe"`, `vote: "Yes/No/Absent"`, `executivePosition: "Yes (State House supports)"`, `isWithExecutive: boolean`
- Metric: `executiveAlignmentScore: % votes with executive` – 100% = captured, 50% = independent
- UI: MP profile – "Votes with Executive: 95% (High alignment – potential capture)" – not necessarily bad, but transparency
- No scoring penalty, just transparency – citizen decides

---

### 15. Immutable Audit Log – Blockchain-Style for Executive Actions (Tech Fix for Distrust)
**Why:** Executive could pressure admin to delete negative integrity report. Need immutable log.

**How:**
- **Tech:** Firestore collection `immutable_audit` where each doc has `prevHash, hash, data, timestamp` – hash = SHA256(prevHash + data + timestamp). Even if admin deletes doc, hash chain breaks – detectable
- Or use OpenTimestamps to anchor hash to Bitcoin blockchain – cheap, provable not tampered
- UI: Admin dashboard shows "Audit integrity: ✅ Chain valid" or "❌ Tampered"
- **Policy:** No one, not even super admin, can delete from `immutable_audit` – rules `allow delete: if false`, only create
- This proves to citizens: executive cannot erase history

---

## Implementation Priority (Don't Trust Executive Lens)

**P0 (Next Sprint) – Core Distrust:**
1. Executive Promises vs Delivery Tracker (`executive_promises`)
2. OAG primary already done – now make it 70% weight in scoring (done in scoring.ts update) + show OAG vs Citizen comparison on profile
3. Judiciary Checks – fetch Kenya Law cases where executive lost, +1 verified scandal

**P1 (Next Month):**
4. CoB Budget vs Actual chart per county
5. Whistleblower encrypted reporting `/report`
6. Citizen photo verification of projects

**P2 (Quarter):**
7. FOI Request Tracker compliance rate per county
8. Procurement Red Flags PPRA + OAG cross-check
9. Immutable audit log with hash chain

---

## Updated Trust Weights Reflecting "Don't Trust Executive"

```ts
// src/lib/news.ts – Updated for distrust principle
const TRUST_WEIGHTS = {
  // Primary Independent – Highest – Don't trust executive, trust independent
  'oagkenya.go.ke': 1.5,        // Auditor General – independent Article 229
  'kenyalaw.org': 1.5,          // Judiciary – independent Article 160
  'statelaw.go.ke': 1.5,        // AG (but AG is executive appointee – weight 1.3? Actually AG advises executive, but bills are still primary)
  'cob.go.ke': 1.5,             // Controller of Budget – independent Article 228
  'parliament.go.ke': 1.4,      // Legislature – checks executive, but can be captured
  'knbs.or.ke': 1.5,            // KNBS – semi-independent

  // Secondary Independent – High
  'mzalendo.com': 1.2,
  'theelephant.info': 1.2,

  // Secondary Media – Good but commercial, may be influenced by executive ads
  'citizen.digital': 0.8,
  'ntvkenya.co.ke': 0.8,
  'standardmedia.co.ke': 0.8,
  'the-star.co.ke': 0.8,

  // Executive – Lowest – Always distrust, require independent verification
  'president.go.ke': 0.4,
  'statehouse.go.ke': 0.4,
  'county.go.ke': 0.5, // any county executive site
  // Executive press release alone never increases score – only when verified by OAG/CoB/photo
}
```

**Rule in scoring:** If only source is executive (0.4x) with no independent verification (OAG, photo, CoB), score = 0. Executive claim alone = no points.

---

## UI/UX for Distrust Principle

- **Badges:** Show source trust: `OAG Primary 1.5x` (green), `Citizen 0.8x Secondary` (yellow), `Executive 0.4x Unverified` (red + warning icon)
- **Warning on executive-only claims:** "⚠️ This project claimed by executive but not yet verified by OAG or citizen photo – treat as unverified"
- **Comparison view:** Show Executive Claim vs Independent Truth side-by-side bar chart (Budget Approved vs Actual from CoB)

---

## Next Code to Build (If You Say Go)

I can now code:
1. `src/lib/executive-promises.ts` + `src/app/dashboard/admin/promises/` – promises tracker
2. `src/lib/controller-of-budget.ts` – CoB parser + `cob_reports` collection
3. `src/lib/judiciary.ts` – Kenya Law scraper for cases where executive lost
4. `src/app/sources/page.tsx` – update to show new trust weights including executive 0.4x + explanation "Don't trust executive"
5. `src/components/VerificationBadge.tsx` – shows trust weight + verification status

Want me to start with Executive Promises vs Delivery Tracker + OAG weight enforcement + update /sources page with distrust principle?
