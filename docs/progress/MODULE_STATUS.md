# Cera Dental Lab — Module Status

> **Current implementation baseline — 2026-10-08**  
> The repository has progressed beyond some historical planning text in this document. Implemented and completed modules now include **4D Lab Production**, **4E Private Attachments**, **4F Corrections / Issues**, **6A Doctor Dashboard**, **6B Cera Operations Dashboard**, and **6C Scanning Staff Mobile Workflow Refinement**. **Modules 5A/5B Notifications remain planned**, and **Module 7 Security & Cross-Module Hardening is NEXT**. Where older text says Modules 4D/4E/4F/6A/6B/6C are future, open, or not implemented, treat that wording as historical and superseded by the current repository and the refreshed progress/knowledge documents.

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

Current completed feature boundary:

```text
Module 6C — Scanning Staff Mobile Workflow Refinement
```

Modules still planned and not yet implemented:

```text
Module 5A — In-App Notifications
Module 5B — WhatsApp Notifications
```

Next planned module:

```text
Module 7 — Security & Cross-Module Hardening
```

Module 6C was fully tested, committed, and pushed. Last reported Git commit:

```text
253178a feat: refine scanning staff mobile workflow
```

---

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
| 5A | In-App Notifications | PLANNED |
| 5B | WhatsApp Notifications | PLANNED |
| 6A | Doctor Dashboard Refinement | COMPLETE |
| 6B | Cera Operations Dashboard | COMPLETE |
| 6C | Scanning Staff Mobile Refinement | COMPLETE |
| 7 | Security & Cross-Module Hardening | NEXT |
| 8 | End-to-End Regression Testing | PLANNED |
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

Status: **COMPLETE**

Implemented production lifecycle:

```text
SUBMITTED
→ IN_PRODUCTION
→ COMPLETED
```

Implemented rules include:

- production is a separate record linked to a Lab Slip
- Cera Staff/Admin can start and complete production
- scan-required cases cannot start production until an associated scan is completed
- production transition history is retained
- Cera Admin may move production backward through the supported transitions with a required reason
- Lab Slip editing is locked after production starts, with the implemented Admin override behavior
- Doctor/Clinic-facing production visibility is read-only and simplified
- active production queue defaults to `SUBMITTED` + `IN_PRODUCTION`

---

# 18. Module 4E — Private Attachments

Status: **COMPLETE**

Implemented direction:

- private supporting attachments
- JPEG, PNG, WEBP, PDF validation
- large raw intraoral scan files remain excluded
- Lab Slip attachment listing/upload/access flows
- private access is mediated by backend authorization/storage abstraction rather than exposing raw storage URLs
- upload availability follows the implemented production/editability rules
- attachment behavior is also reused by the correction workflow where permitted

---

# 19. Module 4F — Corrections / Issues

Status: **COMPLETE**

Implemented correction lifecycle includes:

```text
OPEN
UNDER_REVIEW
AWAITING_CLARIFICATION
RESOLVED
REJECTED
```

Implemented capabilities include:

- corrections can be raised only for completed production cases
- Doctor, Clinic Staff, Cera Staff, and Cera Admin may create/read within resource scope
- Cera Staff/Admin review corrections
- Cera may request clarification; Doctor/Clinic Staff may respond
- resolution outcomes include handled, rescan required, and reproduction required
- resolved/rejected corrections are terminal
- a later new correction may be opened after a previous terminal correction
- correction history and supporting attachments are retained
- the original completed case remains historically intact

---

# 20. Module 5A — In-App Notifications

Status: **PLANNED**

Still requires explicit event, recipient, read/unread, retention, deep-link, and deduplication decisions.

---

# 21. Module 5B — WhatsApp Notifications

Status: **PLANNED**

Confirmed direction remains WhatsApp Business Cloud API as the preferred external operational channel. Event/template/recipient/compliance/retry/logging behavior is still to be designed.

---

# 22. Module 6A — Doctor Dashboard Refinement

Status: **COMPLETE**

Implemented Doctor dashboard includes:

- needs-attention queue for scan confirmations and correction clarifications
- upcoming confirmed/assigned scans
- recent Lab Slips
- quick actions
- responsive loading/error/empty states
- no unnecessary production-management controls

---

# 23. Module 6B — Cera Operations Dashboard

Status: **COMPLETE**

Implemented operational queues include:

- pending scan reviews
- unassigned confirmed scans
- today's scan visits
- active production workload
- urgent cases
- open corrections

Supporting API refinements include confirmed-time date filters, chronological date-filtered scan ordering, production urgency filtering, and active correction filtering.

---

# 24. Module 6C — Scanning Staff Mobile Refinement

Status: **COMPLETE**

Implemented and verified:

- role-aware Scan Booking serialization minimizes Scanner data exposure
- `/portal` scanner dashboard shows today's assigned visits in chronological order
- mobile-first `My Visits` list with scanner-relevant status filters
- prominent confirmed visit time, patient, clinic/address, urgency and read-only reschedule notice
- scanner cannot manage rescheduling
- read-only attachment access remains resource-authorized
- assigned Scanner can mark the visit completed
- completed state removes the completion action
- loading, empty, offline/failure and retry states
- frontend/backend tests, lint and frontend build passed
- committed and pushed as `253178a feat: refine scanning staff mobile workflow`

# 25. Module 7 — Security & Cross-Module Hardening

Status: **NEXT**

Potential scope:

- full resource-authorization review
- CSRF review
- admin MFA
- invitation hardening
- session revocation improvements
- upload security
- rate-limit coverage
- dependency audit
- logging/privacy audit
- production secrets review

Security continues to be handled in every module before this pass.

---

# 26. Module 8 — End-to-End Regression Testing

Status: **PLANNED**

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

These are known future considerations, not blockers for already completed modules:

- stronger invitation endpoint abuse protection
- dedicated invitation secret
- proactive session revocation on user disable
- CSRF strategy review
- admin MFA
- transaction review for cross-model operations
- final production database/network security
- private upload security
- final monitoring/error tracking

Do not implement these opportunistically inside unrelated modules without discussion.

---

# 31. Current Repository/Git Boundary

Last completed module:

```text
Module 6C — Scanning Staff Mobile Workflow Refinement
```

Last Git state reported by the user:

```text
working tree clean
master == origin/master
253178a feat: refine scanning staff mobile workflow
```

A fresh session must still verify dynamic Git state before changing code.

---

# 32. Next Session Goal

The next development chat should focus on:

```text
Module 7 — Security & Cross-Module Hardening
```

Start source-first with a repository security inventory before changing code.

Priority review areas:

- cross-module authentication/resource authorization
- patient-data and role-specific serialization exposure
- CSRF strategy for cookie-based authentication
- CORS and browser security
- invitation/reset/session revocation hardening
- upload validation/private file access
- rate-limit coverage
- logging/privacy
- dependency audit
- environment/secrets handling

Do not introduce unrelated business features while performing the hardening pass.
