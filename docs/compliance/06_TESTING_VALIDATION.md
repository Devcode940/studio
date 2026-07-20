# Control Area: Testing and Validation

**Objective:** Software changes are validated prior to release to reduce defects, regressions, and insecure behavior.

## Requirements

| Req | Requirement | Implementation | Evidence |
|-----|-------------|----------------|----------|
| T-1 | Core business logic covered by unit tests or equivalent | **Equivalent validation currently**: `npm run typecheck` strict, `npm run build` compiles. Core logic (DataTable filtering, representative filtering) validated via useMemo. No Jest yet. Need unit tests for `getSimulatedTweets` vs real, `isAdmin()` rules, `factCheckFlow` prompt injection | `ci.yml` runs typecheck + build as gating, `npm run typecheck` PASS log |
| T-2 | Integration points & critical workflows tested proportion to risk | Firestore integration: `useCollection` + `useDoc` hooks use Firebase emulator in local? Not yet. Critical flows: `social highlights generation` – rate limit checked via `getDocs` query, manual test via Genkit dev UI. `representatives` list – filtered query tested via UI | Genkit dev UI test results (screenshot), manual QA checklist in PR template |
| T-3 | Significant changes evaluated for failure modes & compatibility | PR template section "Failure modes evaluated" + "Compatibility review". Example: Firestore rules change evaluated for breaking existing review create (createdAt == request.time) – fixed. Next 15 params Promise breaking change evaluated + fixed `use(params)` | PR template checkboxes, `FIXES_APPLIED.md` documents breaking changes handled |
| T-4 | Production readiness reviewed before high-impact changes | PR template "Production readiness checklist" for high-risk. Checklist includes: typecheck green, build green, env `USE_MOCK_AI_DATA=false`, secrets in Secret Manager, rules tested in emulator, rollback plan, AI output validation, no PII logging | PR template + `CHANGE_MANAGEMENT.md` deployment steps |

## CI Records (Current After Fix)

```yaml
# .github/workflows/ci.yml
- Install: npm ci (deterministic)
- Type check: npm run typecheck (TS strict)
- Lint: npm run lint
- Build: npm run build (Next build, now passes – previously ignored errors)
- Security audit: npm audit --audit-level=high
```

**CI Evidence Link:** `https://github.com/Devcode940/studio/actions/workflows/ci.yml`

**Local Validation Before Push (Recommended):**
```bash
npm run typecheck
npm run build
firebase emulators:start --only firestore
# In another terminal, run tests against emulator
```

**Firestore Rules Testing (TODO):**
```js
// tests/firestore.rules.test.js with @firebase/rules-unit-testing
- anon can read representatives
- anon cannot write county_gdp
- auth user can create own review but not others
- auth user cannot write highlights (admin only)
```

## Compatibility Review Notes

- **Next 15 breaking**: `params` now Promise in `[slug]/page.tsx` – fixed with `use(params)` + `Promise<{slug}>`
- **Image**: `layout="fill"` removed in Next 15 – fixed to `fill`
- **Firebase SDK**: `getSdks()` required arg – fixed to `initializeFirebase()`
- **Genkit**: `llmResponse.output` is getter not method – fixed

## Release Checklist (High-Impact)

From `SECURITY.md` + PR template:

- [ ] `typecheck` + `build` green
- [ ] `firestore.rules` tested via emulator (`firebase emulators:exec "npm run test:rules"`)
- [ ] `USE_MOCK_AI_DATA=false` in prod env
- [ ] Secrets in Secret Manager, not `.env`
- [ ] Rate limiting enabled (`ai_usage` check)
- [ ] AI outputs go to `pending_review` queue
- [ ] Rollback plan documented
- [ ] Release notes in `CHANGELOG.md`

## Evidence Expected

- Test results: `npm run typecheck` log, `npm run build` log (now PASS, previously FAIL ignored), future Jest results
- CI records: `ci.yml` runs
- Compatibility review notes: `FIXES_APPLIED.md` + this doc
- Release checklists: PR template section

## Assessment: **Partially Compliant → Improving to Compliant**

Before: Non-Compliant (no tests, ignored build errors, no failure mode review)
After: Partially Compliant – typecheck + build gating enforced, but no unit tests yet.

## TODO

- [ ] Add Vitest + first unit test for `isValidReviewCreate` logic, `rate limiting`, `fact-check` prompt injection
  ```bash
  npm i -D vitest
  # add test: "vitest run"
  ```
- [ ] Add Firestore rules unit tests with emulator
- [ ] Add Playwright e2e for critical workflow: search representatives → open profile → generate highlight (mock)
- [ ] Add `CHANGELOG.md`
