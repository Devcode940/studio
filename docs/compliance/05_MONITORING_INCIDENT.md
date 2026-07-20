# Control Area: Monitoring and Incident Support

**Objective:** Systems generate sufficient operational and security telemetry to detect, investigate, and respond to incidents.

## Requirements Mapping

| Req | Requirement | KenyaWatch Implementation | Evidence |
|-----|-------------|---------------------------|----------|
| M-1 | Prod services generate logs appropriate to risk/function | Next.js logs via App Hosting Cloud Logging (automatic). Firestore rules violations logged. AI flows log `console.warn` for mock vs prod, `generateSocialHighlights` logs hijacked? Actually logs count + triggeredByUserId. `fetchEconomicData` logs source. Auth state errors logged in `FirebaseProvider` | Cloud Logging console, `ai_usage` collection, `console.warn` in flows |
| M-2 | Logging avoids sensitive data | No PII in AI logs, only rep name/id. No API keys. Reviews comment not logged full. Check `console.log` review | `grep` result + code review of flows |
| M-3 | Monitoring includes health, errors, dependency failures | App Hosting health checks (automatic), Firestore uptime via GCP Monitoring, Genkit flow failure throws error which surfaces in Cloud Error Reporting. Client `useCollection` error state shows UI + logs | GCP Monitoring dashboard, `src/app/representatives/page.tsx` error banner |
| M-4 | Alerting assigned to accountable owners | TODO: Need defined owner – currently Devcode940. Should configure Firebase Alerts: email for Firestore errors, App Hosting build failures. Documented in `ci.yml` failure notification? | Alert definitions, ownership doc |

## Logging Configuration (Current)

**App Logs (Next.js):**
- Automatic via Firebase App Hosting → Cloud Logging
- `FirebaseProvider` logs `onAuthStateChanged error` via console.error
- AI flows: `console.warn("[MOCK]...")` to highlight non-prod data

**Firestore Audit Logs:**
- Admin SDK `setCustomUserClaims` → Cloud Audit Logs
- `ai_usage` manual audit trail:
```js
{ userId, type: 'highlights', representativeId, createdAt: Timestamp }
```

**Avoid Sensitive:**
- No `user.email` in AI logs, only UID if provided
- No full review text

## Monitoring Dashboards (Recommended Setup)

Create in GCP Console > Monitoring:

1. **App Health**: `firebaseapphosting.googleapis.com/build_count` + `error_count`
2. **Firestore**: `firestore.googleapis.com/document/read_count`, `write_count`, `rule_evaluation_count` + `rule_evaluation_errors`
3. **Genkit AI**: Custom metric `genkit_flow_error` – log error rate >5% → alert
4. **Rate Limit Abuse**: Query `ai_usage` size per hour, alert if >100

## Alert Definitions (Proposed)

| Alert | Condition | Owner | Channel |
|-------|-----------|-------|---------|
| High Firestore rule denials | `rule_evaluation_errors >10 in 5m` | @security-team | Email + Slack |
| AI flow failure | `genkit_flow_error >5 in 10m` | @ai-governance-team | PagerDuty |
| App Hosting down | `uptime_check <95%` | @Devcode940 | Email |
| Mock data in prod | Log contains `[MOCK]` in prod env | @security-team | Block deploy |

## Incident Response

**Current**: Ad-hoc via GitHub Issues label `incident`.

**Recommended IR Process:**
1. Detect via monitoring
2. Create Issue `INCIDENT: <title>` with `incident` label, assign owner
3. Mitigate: rollback via `git revert` + `firebase deploy --only firestore:rules`
4. Post-mortem: add to `docs/compliance/05_MONITORING_INCIDENT.md` + release notes

## Evidence Expected
- Logging config: Cloud Logging config (default), `ai_usage` collection, flow console logs
- Monitoring dashboards: GCP Monitoring screenshots (to be created)
- Alert definitions: table above + future Terraform / YAML
- Incident response records: GitHub Issues with `incident` label

## Assessment: **Partially Compliant**

Before: Non-Compliant – no `ai_usage` audit, mocked logs, no alert owner.
After: Partially – logs exist, audit collection added, error handling added, but dashboards/alerts not yet provisioned.

## TODO
- [ ] Create GCP Monitoring dashboard and export JSON
- [ ] Configure Firebase Alerts for Firestore + App Hosting
- [ ] Document incident response owner (Devcode940)
- [ ] Add structured logger (not console.log) using `genkit` tracing
