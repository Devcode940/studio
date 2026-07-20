# Control Area: Access Control

**Objective:** Access to systems, code, secrets, and production operations is restricted based on business need and approved authorization.

## Requirements

| Req | Requirement | KenyaWatch Implementation | Evidence |
|-----|-------------|---------------------------|----------|
| AC-1 | Access to repos, pipelines, secrets, prod envs role-based | GitHub repo private/public? Currently public fork, but CODEOWNERS restricts. Pipelines: GitHub Actions `GITHUB_TOKEN` scoped. Secrets: Firebase App Hosting secrets (Secret Manager). Prod: Firebase IAM roles | GitHub Settings > Collaborators, Firebase IAM `gcloud projects get-iam-policy`, App Hosting secret config |
| AC-2 | Privileged actions auditable | Firestore rules log via `ai_usage` collection for AI generation privileged action. Firebase Auth audit logs in Firebase Console. Admin claim setting via Admin SDK logged manually | `firestore.rules` `ai_usage` + Firebase Audit Logs |
| AC-3 | AuthZ checks enforced server-side | All sensitive writes: `isAdmin()` in rules (server-side). Client `useAuth` only UI, not security. Cloud Firestore rules are server-side enforcement | `firestore.rules:10-25` |
| AC-4 | Tenant/object-level access controls where applicable | Reviews: `isOwner(userId)` – users can only update/delete own reviews. `isValidReviewCreate` ensures `userId == auth.uid`. Representatives: read public, write admin only. County-level filtering is not tenant isolation but county is attribute | `firestore.rules:56-68` reviews logic |

## Role Model

| Role | Firebase Custom Claim | Permissions |
|------|------------------------|-------------|
| Public (anonymous) | none | Read representatives, county_gdp, census, leaderboard, reviews |
| Authenticated User | `auth != null` | Create reviews (own), trigger highlight generation (rate limited, goes to pending_review) |
| Admin | `admin:true` or `role:admin` | Write representatives, performance_metrics, integrity_reports, highlights, county_gdp, census, leaderboard_entries, delete any review |

**Implementation of Admin:**
```ts
// set via script
auth.setCustomUserClaims(uid, {admin: true})
```
Check in rules:
```js
function isAdmin() { return isSignedIn() && (request.auth.token.admin == true || request.auth.token.role == 'admin'); }
```

## Audit Logs

- **Repo access**: GitHub Audit Log (if org) – who pushed, who approved
- **Firestore**: Firebase Console > Firestore > Usage, plus `ai_usage` collection manual audit
- **App Hosting**: Build logs + deploy history

## Gap Analysis

| Gap Before | Fix After |
|------------|-----------|
| Any auth user could write `county_gdp` | `isAdmin()` only |
| Client-side only `if(user)` check in `AddPerformanceMetric` imported wrong `useAuth` from firebase instead of hooks | Fixed import to `hooks/useAuth` + server-side rules still protect |
| No audit for AI privileged action | Added `ai_usage` collection |

## Evidence Expected
- Access control configs: `firestore.rules`, Firebase IAM, GitHub CODEOWNERS, branch protection
- Audit logs: `ai_usage` docs + Firebase Audit Logs export
- Role assignment: Script `scripts/makeAdmin.js` + Firestore `isAdmin()` logic
- AuthZ design: `SECURITY.md` + `docs/compliance/03_ACCESS_CONTROL.md`

## Assessment: **Compliant (After Fix)**
Previously: Non-Compliant (over-permissive rules). Now meets role-based + object-level.

## TODO
- [ ] Enable Firebase App Check to prevent anonymous abuse
- [ ] Add branch protection rule: require PR for master
- [ ] Rotate GitHub PAT if any leaked
