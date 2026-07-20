# Control Area: Exception Handling and Governance

**Objective:** Exceptions to established controls are formally reviewed, approved, documented, and remediated.

## Requirements

| Req | Requirement | Implementation | Evidence |
|-----|-------------|----------------|----------|
| EX-1 | Exceptions include rationale, scope, compensating controls, owner, expiration | `EXCEPTION_REGISTER.md` template below enforces fields | This doc + register |
| EX-2 | Exceptions approved by engineering + security authorities | Approval via CODEOWNERS + security-team reviewer in PR | PR approvals |
| EX-3 | Open exceptions periodically reviewed | Monthly review scheduled (first Monday) – owner must re-justify or close | Review log in register |

## Exception Register (Current)

### EX-001: Mock AI Data in Development (Open – Approved)
- **Rationale**: Allows local dev without paying for GNews/X API, unblocks UI development
- **Scope**: `src/ai/flows/*` with `USE_MOCK_AI_DATA=true`, dev.nix environment only
- **Compensating Controls**:
  - Env flag gated to `NODE_ENV !== 'production'` + explicit check throws in prod
  - `[MOCK]` warning logs
  - In prod, highlights go to `pending_review` queue, not public
  - CI check: grep for `[MOCK]` in prod build logs → alert
- **Owner**: @Devcode940
- **Approved By**: @Devcode940 (engineering), @security-team (security)
- **Approval Date**: 2026-07-20
- **Expiration Date**: 2026-10-20 (3 months) – must implement real APIs before expiry
- **Status**: Open
- **Remediation Plan**: Implement GNews + X API real integration by 2026-10-20, then set `USE_MOCK=false` everywhere and close exception

### EX-002: Public Firebase Config API Key in Source (Open – Accepted Risk)
- **Rationale**: Firebase client API key (`AIzaSy...`) is designed to be public (not secret), but must be restricted via API key restrictions. Original template hardcoded it.
- **Scope**: `src/firebase/config.ts`
- **Compensating Controls**:
  - API key restricted in GCP Console to only Firebase Auth, Firestore, Storage + domain app hosting
  - No sensitive data accessible with just key (rules protect)
  - Moved to `NEXT_PUBLIC_` env with fallback in hardened version
- **Owner**: @Devcode940
- **Approved By**: @security-team
- **Expiration**: N/A – Accepted risk, but revisit yearly
- **Status**: Open (Accepted Risk)

### EX-003: Previous Bypass of Typecheck via `ignoreBuildErrors` (Closed)
- **Rationale**: (Historical) Bypassed TypeScript errors to deploy quickly
- **Scope**: `next.config.ts` `typescript.ignoreBuildErrors: true`
- **Compensating Controls**: None – Non-compliant
- **Owner**: @Devcode940
- **Approval**: NOT APPROVED – violation
- **Remediation**: FIXED 2026-07-20 – Removed flag, fixed all 12+ TS errors, build now passes
- **Status**: Closed – Verified via `npm run typecheck` PASS + `npm run build` PASS

### EX-004: Missing Unit Tests for Core Business Logic (Open – Temporary)
- **Rationale**: MVP speed, no test harness yet
- **Scope**: All `src/` – no Jest/Vitest tests yet
- **Compensating Controls**:
  - `npm run typecheck` + `npm run build` gating in CI
  - Manual QA via Genkit dev UI + manual UI tests
  - PR template requires failure mode evaluation
- **Owner**: @Devcode940
- **Approved By**: @Devcode940
- **Expiration**: 2026-09-20 – Must add first unit tests (firestore rules + prompt injection)
- **Status**: Open

## Exception Lifecycle

1. **Request**: Developer files Issue with label `exception` using template:
   ```
   **Rationale**:
   **Scope**:
   **Compensating Controls**:
   **Owner**:
   **Expiration**:
   ```
2. **Review**: Requires engineering owner + security-team approver (CODEOWNERS for `docs/compliance/EXCEPTION_REGISTER.md`)
3. **Documentation**: Added to this register with all fields
4. **Approval**: PR merges register change
5. **Periodic Review**: First Monday monthly, review all Open exceptions, extend or close
6. **Remediation**: On expiration, must be fixed or re-approved with new justification

## Evidence Expected

- Exception register: This file `docs/compliance/08_EXCEPTION_GOVERNANCE.md`
- Approval records: PR approvals for register changes
- Remediation tracking: Status field Closed/Open + remediation plan, linked to GitHub Issues

## Assessment: **Partially Compliant → Compliant with Process**

Before: No exception process, bypasses not documented (e.g., ignoreBuildErrors was silent exception).
After: Process defined, historical bypass documented as EX-003 closed, current exceptions documented with compensating controls and expiration.

## TODO

- [ ] Create GitHub Issue template for exceptions
- [ ] Schedule monthly review calendar invite
- [ ] Close EX-001 by implementing real APIs
