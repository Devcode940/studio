# Pull Request — KenyaWatch

## Change Management Control
**Work Item / Issue:** Closes #___
**Change Type:** [ ] Feature [ ] Bugfix [ ] Security [ ] Hotfix [ ] Infra [ ] AI Prompt/Model [ ] Docs
**Risk Level:** [ ] Low [ ] Medium [ ] High (requires enhanced review)
**Production Impact:** [ ] Yes [ ] No

### Description
> What changed and why? Link to spec or ticket.

### Testing & Validation
- [ ] Unit tests added / updated (`npm run test` or `npm run typecheck`)
- [ ] Integration tested (Firestore emulator / Genkit dev)
- [ ] Compatibility reviewed (no breaking API changes, or documented)
- [ ] Failure modes evaluated (what happens if Firestore down, AI timeout, etc.)
- [ ] Production readiness checklist reviewed (if high-impact)

### Secure Development Controls
- [ ] Input validation added for external inputs (Zod schemas)
- [ ] AuthZ enforced server-side (firestore.rules + server actions)
- [ ] No secrets hardcoded (checked `.env.example`, secret scan)
- [ ] Approved libraries only (no new crypto, random dep)
- [ ] Error handling: no stack traces leaked to client, no sensitive data in logs
- [ ] Code quality: readable, no complex untested logic >15 cyclomatic

### Access Control
- [ ] Repository access: only team members
- [ ] No privileged actions without audit (admin custom claim check)
- [ ] Server-side authZ for sensitive ops (firestore.rules `isAdmin()`)

### Secrets & Data Protection
- [ ] Secrets in Secret Manager / env, not code
- [ ] No secrets logged
- [ ] TLS for all external calls, encryption at rest via Firestore default
- [ ] PII handling per Data Protection Act

### Monitoring & Incident Support
- [ ] Logs added (structured, no PII)
- [ ] Health/error metrics considered
- [ ] Alert owner assigned (who gets paged if this fails?)

### AI & LLM Governance (if AI prompt/flow changed)
- [ ] Input treated as untrusted (user/external news → sanitized)
- [ ] System prompt hierarchy controlled (no user override of system)
- [ ] Output validation before persistence/execution (Zod output schema, `highlights_pending_review`)
- [ ] Rate limiting / quotas enforced (ai_usage collection, 5/hr check)
- [ ] Abuse prevention (no auto-publish, admin review queue)
- [ ] Prompt injection tests added (try "ignore previous instructions" in newsSummary)
- [ ] Model risk reviewed (defamation, bias, source attribution)

### Deployment & Rollback
- [ ] Deployment steps documented (firebase deploy / vercel)
- [ ] Rollback plan: `git revert <sha>` + `firebase deploy --only firestore:rules` or previous hosting version
- [ ] Release notes updated

### Checklist for Reviewer
- [ ] Peer reviewed (at least 1 approver, 2 for high-risk)
- [ ] CI green: `typecheck`, `build`, `audit`
- [ ] Firestore rules tested in emulator if changed
- [ ] No exception needed OR exception filed in `docs/compliance/EXCEPTION_REGISTER.md`

### Screenshots / Evidence
> Add logs, screenshots, CI links

---
**Reviewer Approval:** @___
**Security Approval (if High Risk):** @___
