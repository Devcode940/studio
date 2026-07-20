# Control Area: Change Management

**Objective:** Changes to software, infrastructure, and AI-integrated systems are authorized, tested, reviewed, and deployed in a controlled manner that reduces operational and security risk.

## Requirements Traceability

| Req # | Requirement | Implementation in KenyaWatch | Evidence |
|-------|-------------|------------------------------|----------|
| CM-1 | All prod-impacting changes documented and traceable to approved work item | GitHub Issues + PR template requires `Closes #` | PR history, `git log --grep` |
| CM-2 | Code changes peer reviewed prior to deployment | `CODEOWNERS` + PR template + branch protection (require 1 approver, 2 for high-risk) | Reviewer approvals in GitHub |
| CM-3 | Higher-risk changes require enhanced review based on criticality/sensitivity | Risk level checkbox in PR template, CODEOWNERS for `/firestore.rules`, `/src/ai/flows/` | Approval records for security-team |
| CM-4 | Deployment procedures support rollback | `apphosting.yaml` + Firebase Hosting versioning + `git revert` procedure | Deployment records, rollback procedure in PR template + below |

## Deployment & Rollback Procedure (Current)

**Deploy:**
```bash
npm run typecheck && npm run build # CI must pass
firebase deploy --only firestore:rules # if rules changed
firebase deploy --only apphosting # or vercel --prod
```

**Rollback:**
```bash
# 1. Revert code
git revert <commit-sha>
git push origin master # triggers CI

# 2. Rollback Firestore rules to previous version
firebase firestore:rules --history # list
firebase deploy --only firestore:rules:rollback  # or deploy previous file from git history

# 3. Rollback Hosting
firebase hosting:clone SOURCE_SITE:VERSION_ID --project kenya-watch-prod
# or App Hosting: promote previous build in console

# 4. Release notes entry in CHANGELOG.md
```

**Expected Evidence – Mapping:**
- Pull request history: `https://github.com/Devcode940/studio/pulls` + `git log --oneline --graph`
- Reviewer approvals: GitHub PR approvals, CODEOWNERS
- Deployment records: Firebase Hosting releases `firebase hosting:releases:list`, App Hosting builds list
- Change tickets: GitHub Issues with labels `high-risk`, `security`, `ai-governance`
- Rollback procedures: Documented above + `docs/compliance/01_CHANGE_MANAGEMENT.md`

## Maturity After Hardening: **Compliant (Partial → Compliant)**
Before: 5 commits ahead with messages like "Everywhere I want Kenyan flag colours", no PRs, `ignoreBuildErrors` bypassed control.
After: PR template enforces traceability, CI requires typecheck, CODEOWNERS enforces enhanced review.

## Gaps & Remediation
- [ ] Enable branch protection in GitHub Settings: Require PR, Require 1 approval, Require CI (ci.yml) status checks, Require CODEOWNERS approval for `firestore.rules`
- [ ] Create CHANGELOG.md for release notes
