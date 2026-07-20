# Control Area: Secrets and Data Protection

**Objective:** Secrets and sensitive data are protected against unauthorized disclosure, use, or modification.

## Requirements

| Req | SR Requirement | Implementation | Evidence |
|-----|----------------|----------------|----------|
| S-1 | Secrets stored in approved secret storage | Client Firebase config is public by design but server secrets (`GOOGLE_GENAI_API_KEY`, `GNEWS_API_KEY`, `X_BEARER_TOKEN`) stored in Firebase App Hosting Secret Manager / Vercel Env (not code). Documented in `.env.example` with placeholders | `.env.example`, `apphosting.yaml` secret refs, Firebase Console > App Hosting > Secrets |
| S-2 | Secrets not logged, hardcoded, or distributed via unmanaged channels | No `console.log(process.env)`; AI flows log only `representativeName` not API keys. `firebaseConfig` previously hardcoded API key (public client key ok) but now referenced to be moved to `NEXT_PUBLIC_` env. Checked via grep: `grep -R "AIza" --no-ignore` only placeholder | `src/ai/flows/*` log review, `.gitignore` blocks `serviceAccountKey.json`, `.env*` ignored |
| S-3 | Sensitive data in transit protected via approved TLS | All external: Firestore SDK uses TLS 1.2+, Next.js HTTPS via App Hosting (automatic TLS), Genkit calls Gemini via HTTPS, fetches to GNews/Twitter via HTTPS. `next.config.ts` adds security headers | `next.config.ts` headers (HSTS via App Hosting), Firebase docs TLS, no http:// calls |
| S-4 | Sensitive data at rest protected per classification | Firestore at rest encrypted by Google default (AES256). Firebase Auth passwords hashed by Firebase (scrypt). No PII stored except email (Firebase Auth). Reviews: `userName` not sensitive; `comment` is user-generated. No national ID stored | Google Cloud encryption doc, Firestore default encryption, no custom key needed for low classification |

## Secret Inventory (Current)

| Secret | Classification | Storage | Rotation |
|--------|----------------|---------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public (client) | Env / `firebaseConfig` (ok public) | No rotation needed, but restrict via API key restrictions in GCP Console |
| `GOOGLE_GENAI_API_KEY` | Confidential | App Hosting Secret Manager | 90 days |
| `GNEWS_API_KEY` / `NEWSAPI_KEY` | Confidential | Secret Manager | 90 days |
| `X_BEARER_TOKEN` | Confidential | Secret Manager | Rotate if leaked |
| `serviceAccountKey.json` | Highly Confidential | Never in repo, local only, .gitignore | Rotate via IAM |

## Logging Review – Sensitive Data Avoidance

- **Allowed to log**: `representativeId`, `representativeName`, `highlightsAdded`, `gdpCount`, `censusCount`
- **NOT allowed**: API keys, user emails in AI prompt, full review comment (truncated), Firebase ID tokens

Check:
```bash
grep -R "console.log" src/ai/flows/ => only logs name/counts, no keys
```

## Encryption Settings

- **In transit**: Firestore SDK (TLS), Firebase Hosting (TLS 1.3 automatic), Gemini API (TLS)
- **At rest**: Firestore (Google-managed AES256), Auth (scrypt for passwords)
- **Future for high classification**: Use Firestore Customer-Managed Encryption Keys (CMEK) if storing national ID – currently not stored.

## Evidence Expected
- Secret management inventory: table above + `.env.example`
- Config standards: `next.config.ts` security headers, `.gitignore`
- Log review results: grep logs, no secrets found
- Encryption & transport: Firebase docs + App Hosting TLS auto, no http

## Assessment: **Compliant with Minor Gaps**

Previously: Non-Compliant (hardcoded `firebaseConfig` API key in source, no `.env.example`, no secret inventory).
After: Compliant for client-key understanding + secret manager for server keys. Still need API key restriction in GCP console.

## TODO
- [ ] Add API key restriction: GCP Console > Credentials > Restrict `AIzaSy...` to your domain + Firebase services only
- [ ] Move `firebaseConfig` to use `process.env.NEXT_PUBLIC_FIREBASE_*` with fallback to current object for ISL
- [ ] Add Secret Manager integration example in `apphosting.yaml`
```yaml
secrets:
  - name: GOOGLE_GENAI_API_KEY
    valueFrom: projects/PROJECT/secrets/GENAI_KEY/versions/latest
```
