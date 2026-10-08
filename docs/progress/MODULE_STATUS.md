# Cera Dental Lab — Module Status

## 1. Purpose of This Document

This document tracks the current implementation status of each project module.

It is a quick progress reference for new chatbot sessions.

This file should answer:

- What is complete?
- What is currently next?
- What is planned later?
- Which modules are blocked by unresolved decisions?
- What was the last known implementation boundary?

Detailed business and technical design belongs in the other project documents.

---

# 2. Status Labels

Use:

```text
COMPLETE
→ implemented, tested, committed, and pushed

IN PROGRESS
→ currently being implemented

NEXT
→ next planned module

PLANNED
→ approved direction, not yet started

BLOCKED
→ cannot start until specific decisions/dependencies are resolved

DEFERRED
→ intentionally postponed
```

---

# 3. Current Project Position

Current completed implementation boundary:

```text
Module 7 — Security & Cross-Module Hardening
```

Next planned module:

```text
Module 8 — End-to-End Regression Testing
```

Module 7 implementation and repository-wide verification are complete. Documentation/source-control closeout is the final checkpoint before Module 8 begins.

# 4. Module Summary

| Module | Name | Status |
|---|---|---|
| 0 | Foundation | COMPLETE |
| 1A | User + Password Foundation | COMPLETE |
| 1B | Login | COMPLETE |
| 1C | Persistent Authentication | COMPLETE |
| 1D | Logout | COMPLETE |
| 2A | Role Authorization | COMPLETE |
| 2B | Invitations & User Management | COMPLETE |
| 3A | Clinics & Memberships | COMPLETE |
| 3B | Product Catalogue | COMPLETE |
| 4A | Digital Lab Slip Core | COMPLETE |
| 4B | Scan Booking Core + Lab Slip Editing | COMPLETE |
| 4C | Scan Rescheduling | COMPLETE |
| 4D | Lab Production Workflow | COMPLETE |
| 4E | Private Attachments | COMPLETE |
| 4F | Corrections / Issues | COMPLETE |
| 5A | In-App Notifications | COMPLETE |
| 5B | WhatsApp Notifications | COMPLETE |
| 6A | Doctor Dashboard Refinement | COMPLETE |
| 6B | Cera Operations Dashboard | COMPLETE |
| 6C | Scanning Staff Mobile Refinement | COMPLETE |
| 7 | Security & Cross-Module Hardening | COMPLETE |
| 8 | End-to-End Regression Testing | NEXT |
| 9 | Production Deployment | PLANNED |
| 10 | Final Documentation & Monitoring | PLANNED |

---

# 5. Module 0 — Foundation

Status: **COMPLETE**

Implemented:

- npm workspaces monorepo
- `apps/web`
- `apps/api`
- `packages/shared`
- React + Vite frontend
- Express backend
- MongoDB / Mongoose connection
- environment loading
- CORS
- Helmet
- Zod validation foundation
- Winston logging
- request IDs
- structured 404/error handling
- health endpoint
- Vitest
- lint/build setup
- API port 4000
- frontend API configuration

Important established conventions:

- modular monolith
- REST under `/api/v1`
- shared constants package
- frontend/backend developed together by module

---

# 6. Module 1A — User + Password Foundation

Status: **COMPLETE**

Implemented:

- User model
- name
- phone
- optional email
- password hash
- role
- user status
- Argon2id password hashing
- admin creation CLI/foundation

Confirmed user states:

```text
INVITED
ACTIVE
DISABLED
```

---

# 7. Module 1B — Login

Status: **COMPLETE**

Implemented:

- login with phone/email + password
- short-lived access JWT
- opaque refresh-token persistence
- HttpOnly cookies
- login rate limiting
- safe user serializer
- `lastLoginAt`

Confirmed token lifetimes:

```text
Access token: 15 minutes
Refresh token: 10 days
```

---

# 8. Module 1C — Persistent Authentication

Status: **COMPLETE**

Implemented:

- authentication middleware
- `/auth/me`
- refresh-token rotation
- refresh replay handling
- inactive-user checks during refresh
- frontend auth bootstrap
- singleton/shared refresh promise
- failed-request retry after refresh
- Redux auth state
- protected routes
- role guards

Important fix completed:

Access token expiry uses:

```text
current time + ACCESS_TOKEN_TTL_SECONDS
```

rather than an incorrect relative calculation.

---

# 9. Module 1D — Logout

Status: **COMPLETE**

Implemented:

- current refresh-session revocation
- authentication cookie clearing
- logout without requiring valid access JWT
- frontend logout flow
- account-menu integration

---

# 10. Module 2A — Role Authorization

Status: **COMPLETE**

Implemented:

- backend `authorizeRoles`
- role authorization tests
- frontend `RoleGuard`

Important rule:

Role authorization is only coarse access.

Resource authorization remains module-specific.

---

# 11. Module 2B — Invitations & User Management

Status: **COMPLETE**

Implemented:

- Cera Admin invitation creation
- invitation preview
- invitation acceptance
- invitation list
- revoke invitation
- regenerate invitation
- invite expiry
- single-use token behavior
- user listing
- disable/reactivate users
- responsive Admin Users UI

Current invitation expiry direction:

```text
72 hours
```

Known future hardening items:

- proactive refresh-session revoke when disabling users
- dedicated invitation secret
- stronger public invite endpoint rate limits
- CSRF review

---

# 12. Module 3A — Clinics & Memberships

Status: **COMPLETE**

Implemented:

- clinic creation
- edit clinic
- disable clinic
- reactivate clinic
- Doctor membership assignment
- Clinic Staff membership assignment
- soft/active membership removal
- Doctor many-to-many clinic support
- role-scoped clinic access
- reusable `hasActiveClinicMembership()`
- Admin Clinics member-management UI

Confirmed access:

```text
Cera Admin
→ manage clinics/memberships

Cera Staff
→ read active operational clinic information

Doctor
→ assigned clinics

Clinic Staff
→ assigned clinics

Scanning Staff
→ no general clinic directory
```

---

# 13. Module 3B — Product Catalogue

Status: **COMPLETE**

Implemented:

- categories
- products
- active/inactive status
- sort order
- stable slug behavior
- Admin category/product management
- active catalogue visibility
- role-based catalogue access

Confirmed behavior:

- Doctor / Clinic Staff / Cera Staff use active catalogue data
- Scanning Staff do not need full catalogue access
- disabling a category hides active child products from new selection
- textual product edits can still occur while its category is disabled if category relationship is unchanged

Important:

Official Cera catalogue data must not be invented.

---

# 14. Module 4A — Digital Lab Slip Core

Status: **COMPLETE**

Implemented backend:

- `LAB_SLIP_SOURCE`
- `LAB_SLIP_STATUS`
- `LAB_SLIP_URGENCY`
- quadrant/tooth constants
- human references:
  - `CDL-YYYY-000001`
- Lab Slip model
- validation schemas
- serializer
- service
- controller
- routes
- tests
- list/search/detail
- role/resource authorization

Implemented Lab Slip data includes:

- reference
- source
- status
- urgency
- clinic
- doctor
- patient name/reference
- item snapshots
- teeth
- shade
- pontic/design information
- design notes
- general notes
- scan-required flag
- creator
- timestamps

Confirmed role behavior:

### Doctor

- creates for self
- must use accessible active clinic
- source = portal
- lists own accessible work

### Clinic Staff

- must use accessible clinic
- selects Doctor associated with that clinic
- source = portal
- lists permitted clinic work

### Cera Staff / Admin

- broader operational creation
- may select Doctor
- may use offline source

### Scanning Staff

- denied Lab Slip directory access

Implemented frontend:

- accessible-clinic Doctor lookup
- Lab Slip API client
- paper-style tooth selector
- New Lab Slip page
- Lab Slip list
- Lab Slip detail
- role-protected routes

Module completed and pushed.

---

# 15. Module 4B — Scan Booking Core + Lab Slip Editing

Status: **COMPLETE**

## Scan Booking

Implemented statuses:

```text
PENDING_REVIEW
AWAITING_CONFIRMATION
CONFIRMED
ASSIGNED
COMPLETED
REJECTED
CANCELLED
```

Implemented references:

```text
SCAN-YYYY-000001
```

Implemented workflow:

- request scan
- late scan request
- Cera confirm requested time
- Cera propose alternate time
- Doctor/Clinic accept alternate
- Cera reject pending request
- assign active Scanning Staff
- assigned Scanning Staff completion
- Cera completion where allowed
- cancellation rules
- role-specific list/detail access
- minimal scanning-staff view
- duplicate active-booking prevention

Late scan behavior:

```text
Lab Slip originally scanRequired=false
↓
new Scan Booking created
↓
Lab Slip scanRequired becomes true
```

Confirmed duplicate behavior:

- rejected/cancelled booking may allow a later new request
- completed booking does not automatically allow a rescan

## Lab Slip Editing

Implemented:

```text
PATCH /api/v1/lab-slips/:labSlipId
```

Editable:

- urgency
- patient
- items
- teeth
- shade
- pontic/design information
- design notes
- notes

Immutable:

- reference
- clinic
- doctor
- source
- creator
- created time
- scanRequired through normal edit path

Catalogue behavior:

- existing snapshots remain valid if catalogue later disabled
- new selections must use active product + active category

Urgency synchronization:

Lab Slip urgency changes update active Scan Bookings in:

```text
PENDING_REVIEW
AWAITING_CONFIRMATION
CONFIRMED
ASSIGNED
```

Terminal booking history remains unchanged.

Module completed and pushed.

---

# 16. Module 4C — Scan Rescheduling

Status: **COMPLETE**

Confirmed reschedule rules:

Allowed booking statuses:

```text
CONFIRMED
ASSIGNED
```

May request:

- Doctor
- Clinic Staff
- Cera Staff
- Cera Admin

May not manage reschedules:

- Scanning Staff

Reschedule negotiation state:

```text
REQUESTED
AWAITING_CONFIRMATION
```

Important semantics:

- rescheduling does not replace main booking status
- current confirmed appointment remains active until replacement accepted
- assigned scanner remains assigned
- new assignment is blocked while an unresolved reschedule exists
- reschedule history is retained
- terminal bookings cannot be rescheduled

Implemented actions:

```text
POST /:bookingId/reschedule-request
POST /:bookingId/reschedule-confirm
POST /:bookingId/reschedule-propose
POST /:bookingId/reschedule-accept
```

Backend additions include:

- active reschedule fields
- `rescheduleHistory[]`
- serializer support
- service transitions
- role/resource checks
- assignment protection
- terminal cleanup
- tests

Frontend additions include:

- reschedule request
- Cera confirm/propose
- Doctor/Clinic accept
- active reschedule notice
- reschedule history
- scanner read-only visibility
- assignment protection in UI

Verification completed:

- backend Scan Booking regression suite passed
- frontend Scan Booking detail tests passed
- lint passed
- build passed
- manual state-machine checks passed
- committed
- pushed to GitHub

---

# 17. Module 4D — Lab Production Workflow

Status: **NEXT**

Implementation has **not started**.

This module is blocked from coding until production business rules are resolved.

Required decisions include:

- production statuses
- production readiness
- who starts production
- who changes status
- allowed transitions
- backward transitions
- edit-lock point
- production history
- Doctor visibility
- Clinic Staff visibility
- meaning of completion
- whether a production assignee exists
- whether production belongs directly on LabSlip or a separate entity
- whether completed production can reopen
- whether transitions need notes/reasons

See:

```text
docs/decisions/OPEN_QUESTIONS.md
```

No production state machine should be invented before those decisions are approved.

---

# 18. Module 4E — Private Attachments

Status: **PLANNED**

Confirmed direction:

- supporting files only
- private access
- JPEG
- PNG
- WEBP
- PDF
- large raw intraoral scan files excluded

Open:

- ownership
- permissions
- deletion/retention
- max size
- object-storage provider
- signed access
- security validation

---

# 19. Module 4F — Corrections / Issues

Status: **PLANNED**

Confirmed principle:

The original completed case must remain historically intact.

Still open:

- correction statuses
- who creates/reviews
- rescan behavior
- reproduction behavior
- relationship to Lab Slip
- relationship to production
- attachment needs

---

# 20. Module 5A — In-App Notifications

Status: **PLANNED**

Needs:

- event definitions
- recipient rules
- read/unread behavior
- retention
- related-resource navigation
- deduplication

---

# 21. Module 5B — WhatsApp Notifications

Status: **PLANNED**

Confirmed direction:

```text
WhatsApp Business Cloud API
```

WhatsApp is the preferred external operational notification channel.

Still open:

- events
- templates
- recipients
- retry behavior
- delivery logging
- safe message content

---

# 22. Module 6A — Doctor Dashboard Refinement

Status: **PLANNED**

Potential purpose:

- surface active work
- scans requiring attention
- upcoming scans
- case progress
- completed cases
- corrections

Actual cards/metrics must be based on real workflow needs.

---

# 23. Module 6B — Cera Operations Dashboard

Status: **PLANNED**

Potential operational views:

- pending scan reviews
- upcoming confirmed scans
- unassigned scans
- urgent work
- production workload
- correction queue

Do not turn this into a generic ERP dashboard.

---

# 24. Module 6C — Scanning Staff Mobile Refinement

Status: **PLANNED**

Potential improvements:

- today's visits
- assigned visits
- clearer visit detail
- reschedule notice
- completion flow
- mobile usability

No direct scanner integration.

---

# 25. Module 7 — Security & Cross-Module Hardening

Status: **COMPLETE**

Implemented and verified:

- immediate disabled-user access/session invalidation through `authVersion`
- refresh-session revocation when an operational user is disabled
- dedicated invitation-token secret, distinct from the refresh-token secret
- temporary legacy invitation-hash compatibility for migration
- invitation preview/accept rate limiting
- cross-module role/resource authorization regression hardening
- Scanning Staff access limited to currently assigned scan work; stale sensitive access removed
- atomic Production state transitions with stale-state conflict handling
- atomic Correction state transitions with stale-state conflict handling
- private attachment authorization/state preflight before multipart buffering
- JPEG/PNG/WEBP/PDF signature/type validation and private signed access
- attachment uploader-only deletion rules and terminal-state locking where applicable
- attachment maximum-count enforcement under concurrent uploads using database capacity slots
- exact credentialed CORS allowlist behavior for the React client
- Origin-based CSRF protection for unsafe browser requests
- Helmet / `x-powered-by` / JSON payload-size review
- production-safe request, error, and lifecycle logging
- query-string/patient-data logging exposure reduction
- dependency audit; vulnerable dev-only `nodemon -> chokidar -> braces` chain removed
- API development now uses Node's built-in `--watch`
- centralized secrets/environment validation, including R2 configuration
- tracked-secret and debug-output review
- Clinic and Catalogue authorization regression coverage

Verification completed at the Module 7 checkpoint:

- full API tests pass
- full web tests pass
- API/web lint pass
- web production build passes
- `npm audit --workspaces` passes with zero vulnerabilities
- `git diff --check` clean
- tracked-secret pattern scan clean
- added debug-output scan clean

Intentional deferrals:

- Cera Admin MFA remains deferred until required
- final HTTPS, reverse-proxy trust, secure-cookie/SameSite topology review belongs to Module 9

Security remains continuous after this module; Module 7 is the system-wide hardening checkpoint.

# 26. Module 8 — End-to-End Regression Testing

Status: **NEXT**

Will verify:

- complete Doctor journeys
- complete Clinic Staff journeys
- Cera Admin journeys
- Cera Staff journeys
- Scanning Staff journeys
- role isolation
- state transitions
- disabled resources
- auth/session behavior
- scan flows
- production
- corrections
- attachments
- notifications
- responsive/error/edge cases

---

# 27. Module 9 — Production Deployment

Status: **PLANNED**

Deployment architecture/provider is not yet locked.

Future areas:

- production environment
- HTTPS
- reverse proxy
- database
- Redis
- object storage
- CI/CD
- health checks
- backups
- rollback
- secrets
- production QA

Do not assume provider/topology yet.

---

# 28. Module 10 — Final Documentation & Monitoring

Status: **PLANNED**

Future documentation:

- deployment guide
- environment setup
- user/admin guides
- operations guide
- troubleshooting
- recovery/runbook

Future monitoring:

- uptime
- application errors
- logs
- database health
- infrastructure
- notification failures
- storage failures

Monitoring stack is not yet chosen.

---

# 29. Current Architectural Locks

Do not casually reopen these:

```text
✓ modular monolith
✓ npm workspaces
✓ React + Vite + JavaScript
✓ Node.js + Express + JavaScript ES modules
✓ MongoDB + Mongoose
✓ REST /api/v1
✓ backend authorization source of truth
✓ 15-minute access JWT
✓ rotating opaque refresh token, 10 days
✓ HttpOnly cookies
✓ Argon2id
✓ invitation-based operational accounts
✓ phone required, email optional
✓ India-only mobile numbers in V1
✓ Digital Lab Slip central record
✓ catalogue snapshots on Lab Slips
✓ no payments
✓ no direct scanner integration
✓ no large raw scan-file website storage
✓ Scan Booking separate from Lab Slip
✓ explicit Scan Booking state machine
✓ rescheduling separate from main booking status
✓ existing confirmed time remains active during rescheduling
✓ assigned scanner preserved during rescheduling
✓ reschedule history preserved
✓ shared enums in packages/shared
✓ routes outside App.jsx
✓ Redux Toolkit only for suitable app-wide state
✓ one module per chat where practical
✓ manual copy/paste development
✓ no-assumption policy
✓ commit/push before next module
```

---

# 30. Current Known Technical Debt / Future Hardening

Remaining future considerations after Module 7:

- Cera Admin MFA, intentionally deferred until required
- final production HTTPS/reverse-proxy trust/cookie topology review in Module 9
- final production database/network security in Module 9
- production monitoring/error tracking in Module 10

Resolved during Module 7 and no longer future debt:

- invitation endpoint abuse protection
- dedicated invitation secret
- proactive disabled-user session invalidation
- CSRF strategy for the V1 browser client
- private upload security review
- dependency audit
- secrets/environment audit
- logging/privacy hardening

Do not reintroduce resolved hardening items as open work unless a new requirement or deployment topology changes the threat model.

# 31. Current Repository/Git Boundary

Current implementation boundary:

```text
Module 7 — Security & Cross-Module Hardening
```

At the final Module 7 checkpoint, the user reported the full test/lint/build/audit gates passing and the final diff/secret/debug scans clean.

Module 7 source changes are not considered fully closed until the documentation changes are committed and pushed.

A fresh session must still verify dynamic repository state with:

```bash
git status
git log -1 --oneline
```

Do not assume the working tree or remote sync state after this handoff.

# 32. Next Session Goal

After Module 7 documentation is committed and pushed, the next development module is:

```text
Module 8 — End-to-End Regression Testing
```

Primary purpose:

```text
validate complete cross-role journeys and edge cases across the integrated product before production deployment
```

Module 8 should verify Doctor, Clinic Staff, Cera Admin, Cera Staff, and Scanning Staff journeys, role isolation, state transitions, disabled resources, auth/session behavior, scans, production, corrections, attachments, notifications, and responsive/error/edge-case behavior.

Do not begin Module 9 deployment work until Module 8 is closed.
