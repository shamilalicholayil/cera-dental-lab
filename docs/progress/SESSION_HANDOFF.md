# Cera Dental Lab — Session Handoff

## 1. Purpose

This file captures the current cross-session handoff state. Current repository/code remains the highest implementation source of truth.

---

# 2. Current Handoff Summary

Last completed implementation module:

```text
Module 7 — Security & Cross-Module Hardening
```

Next module after source-control closeout:

```text
Module 8 — End-to-End Regression Testing
```

Development mode remains:

```text
Normal chatbot
Manual VS Code copy/paste workflow
User runs commands/tests locally
```

Do not start Module 8 until Module 7 documentation is committed/pushed and the working tree is verified clean/synced.

---

# 3. Functional Boundary

The integrated product now includes the implemented workflow through:

```text
Authentication / invitations / user administration
↓
Clinics and memberships
↓
Catalogue
↓
Digital Lab Slip
↓
Scan Booking and rescheduling
↓
Lab Production
↓
Private supporting attachments
↓
Corrections / issues
↓
Notifications and operational UI refinements
↓
Module 7 cross-system security hardening
```

Module 8 is an integrated regression/edge-case pass, not a new business workflow.

---

# 4. Module 7 — Completed Hardening

Module 7 completed these verified areas:

- disabled-user access/session invalidation via `authVersion`
- refresh-session revocation on disable
- dedicated invitation-token secret
- temporary legacy invitation-hash migration fallback
- invitation preview/accept rate limiting
- resource-authorization/data-exposure review across Clinics, Catalogue, Lab Slips, Scan Bookings, Production, Corrections, and attachments
- Scanning Staff stale-access removal
- atomic Production and Correction transitions
- private-upload preflight authorization and state checks before buffering
- attachment type/signature validation, private storage, short-lived signed access, uploader-only deletion where applicable
- concurrent max-attachment enforcement via database capacity slots
- exact credentialed CORS
- Origin-based CSRF protection for unsafe browser requests
- security-header/input-size review
- production-safe logging/error/lifecycle metadata
- query-string/patient-data privacy logging hardening
- dependency audit and removal of vulnerable dev-only nodemon dependency chain
- centralized R2/environment validation
- secrets/tracked-file audit
- Clinic/Catalogue authorization regression tests

---

# 5. Module 7 — Security Decisions

## Disabled users

Disabling an operational user must invalidate existing access behavior immediately and revoke refresh sessions. Access tokens carry `authVersion`; authentication compares the token version to the current user record.

## Invitations

Invitation token hashing uses `INVITATION_TOKEN_SECRET`, distinct from `REFRESH_TOKEN_SECRET`.

A temporary legacy verification fallback may accept hashes derived from the old refresh secret during migration. Remove that compatibility only after at least the maximum old invitation lifetime has elapsed after rollout (current maximum: 168 hours / 7 days).

## Browser CSRF

V1 authenticated operational browser traffic comes only from the Cera React frontend. Unsafe methods require the request `Origin` to exactly match the configured `CLIENT_URL` origin.

Future provider/webhook routes must use provider-specific signature/authentication and explicit CSRF bypass only where appropriate.

## Attachments

Attachment count limits are enforced under concurrency with database capacity slots and unique compound indexes. Legacy slotless attachment records remain valid and still consume capacity.

## Production deployment

Do not blindly configure Express `trust proxy`. Final HTTPS, reverse-proxy topology, `Secure` cookie behavior, and SameSite review belong to Module 9.

---

# 6. Intentional Deferrals

```text
Cera Admin MFA
→ deferred until required

Final HTTPS / reverse proxy trust / cookie topology
→ Module 9
```

These are not Module 7 completion blockers.

---

# 7. Verification Completed

At the final Module 7 checkpoint the user reported:

```text
npm run test                PASS
npm run lint                PASS
npm run build:web           PASS
npm audit --workspaces      PASS / 0 vulnerabilities
```

Final review also reported:

```text
git diff --check            clean
tracked secret scan         no matches
added console.log/debugger  no matches
```

Do not claim these commands were run by the assistant; they were run and reported by the user.

---

# 8. Current Source-Control Boundary

Module 7 implementation changes and documentation updates must be committed together before moving to Module 8.

After commit/push verify:

```bash
git status
git log -1 --oneline
git status -sb
```

Expected handoff condition:

```text
working tree clean
branch synchronized with remote
```

---

# 9. Module 8 — Next Scope

Module 8 is **End-to-End Regression & Edge-Case Testing**.

It should validate complete journeys for:

- Doctor
- Clinic Staff
- Cera Admin
- Cera Staff
- Scanning Staff

Coverage should include:

- authentication/session behavior
- role isolation/resource authorization
- disabled users/resources
- Clinics/memberships
- Catalogue selection visibility
- Lab Slip creation/editing/search/detail
- Scan Booking lifecycle/rescheduling/assignment/completion
- Production transitions and visibility
- private attachments
- Corrections
- notifications
- responsive, loading, empty, failure, and edge-case behavior

Module 8 should find integration regressions; do not invent new business workflows merely to expand test coverage.

---

# 10. Handoff State

```text
MODULE 7 IMPLEMENTATION + VERIFICATION COMPLETE
DOCUMENTATION/SOURCE-CONTROL CLOSEOUT IN PROGRESS
NEXT: MODULE 8 AFTER CLEAN PUSH
```
