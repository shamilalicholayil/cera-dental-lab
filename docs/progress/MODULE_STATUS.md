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

Current committed/pushed completed boundary:

```text
Module 4D — Lab Production Workflow
```

Module 4D final state:

```text
COMPLETE
AUTOMATED TESTS PASSED
FRONTEND / BACKEND LINT PASSED
FRONTEND BUILD PASSED
MANUAL QA PASSED
DOCUMENTATION UPDATED
COMMITTED + PUSHED
CLEAN WORKING TREE CONFIRMED
```

Final Module 4D commit:

```text
b392224 feat: add lab production workflow
```

Next planned module:

```text
Module 4E — Private Attachments
```

---

# 4. Module Summary

| Module | Name                                 | Status   |
| ------ | ------------------------------------ | -------- |
| 0      | Foundation                           | COMPLETE |
| 1A     | User + Password Foundation           | COMPLETE |
| 1B     | Login                                | COMPLETE |
| 1C     | Persistent Authentication            | COMPLETE |
| 1D     | Logout                               | COMPLETE |
| 2A     | Role Authorization                   | COMPLETE |
| 2B     | Invitations & User Management        | COMPLETE |
| 3A     | Clinics & Memberships                | COMPLETE |
| 3B     | Product Catalogue                    | COMPLETE |
| 4A     | Digital Lab Slip Core                | COMPLETE |
| 4B     | Scan Booking Core + Lab Slip Editing | COMPLETE |
| 4C     | Scan Rescheduling                    | COMPLETE |
| 4D     | Lab Production Workflow              | COMPLETE |
| 4E     | Private Attachments                  | COMPLETE |
| 4F     | Corrections / Issues                 | NEXT     |
| 5A     | In-App Notifications                 | PLANNED  |
| 5B     | WhatsApp Notifications               | PLANNED  |
| 6A     | Doctor Dashboard Refinement          | PLANNED  |
| 6B     | Cera Operations Dashboard            | PLANNED  |
| 6C     | Scanning Staff Mobile Refinement     | PLANNED  |
| 7      | Security & Cross-Module Hardening    | PLANNED  |
| 8      | End-to-End Regression Testing        | PLANNED  |
| 9      | Production Deployment                | PLANNED  |
| 10     | Final Documentation & Monitoring     | PLANNED  |

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

Confirmed/implemented lifecycle:

```text
SUBMITTED
→ IN_PRODUCTION
→ COMPLETED
```

Readiness:

- non-scan cases may start after submission
- scan-required cases require related Scan Booking `COMPLETED`
- scan completion does not auto-start Production

Permissions:

- Cera Admin + Cera Staff: forward transitions
- Cera Admin only: backward transitions with mandatory reason
- Doctor / Clinic Staff / Scanning Staff: no Production mutation

Backward transitions:

```text
COMPLETED → IN_PRODUCTION
IN_PRODUCTION → SUBMITTED
```

No direct `COMPLETED → SUBMITTED`.

Implemented backend:

- shared Production status constants
- one-to-one Production model
- atomic Lab Slip + Production creation transaction
- production service/schema/controller/routes/serializer
- queue pagination/filtering
- readiness enforcement
- transition history and timestamps
- Production detail endpoint
- production-aware Lab Slip edit lock
- Admin-only audited Lab Slip edit override

Implemented frontend:

- Production queue
- Production detail/action/history UI
- role-specific forward/backward controls
- Lab Slip edit-lock UX
- Admin override reason UX
- Doctor/Clinic simplified status (`Submitted`, `In Progress`, `Completed`)
- Cera internal status wording (`Submitted`, `In Production`, `Completed`)

Completion means fabrication + final internal check complete, not delivery.

V1 has no Production assignee.

Verification completed:

- focused backend Production/Lab Slip tests passed
- full API tests passed
- API lint passed
- focused frontend Production/Edit/Lab Slip tests passed
- full frontend tests passed
- frontend lint passed
- frontend build passed
- manual role/state/responsive QA passed

Git finalization:

- final commit: `b392224 feat: add lab production workflow`
- pushed to `origin/master`
- clean working tree confirmed

---

# 18. Module 4E — Private Attachments

Status: **COMPLETE**

Implemented:

- attachments belong to Lab Slips only in V1
- supporting files only; raw intraoral scan files are excluded
- JPEG, PNG, WEBP, and PDF
- maximum 10 MB per attachment
- maximum 5 attachments per Lab Slip
- Cloudflare R2 private object storage
- S3-compatible R2 integration
- private objects; no permanent public URLs
- 5-minute presigned GET URLs created only after backend authorization
- attachment metadata stored separately from binary contents
- extension validation
- declared MIME validation
- magic-byte/file-signature validation
- mismatched or unsupported files rejected
- Doctor, Clinic Staff, Cera Staff, and Cera Admin access follows Lab Slip authorization
- Scanning Staff receive narrow read-only attachment access only when assigned to the related Scan Booking
- Scanning Staff remain denied general Lab Slip browsing/detail access
- upload and deletion allowed only while production status is `SUBMITTED`
- only the original uploader may delete an attachment
- Cera Admin has no attachment mutation override after production begins
- existing attachments remain readable after production starts
- Lab Slip creation supports optional attachments
- Lab Slip is created before selected attachments are uploaded
- partial attachment upload failure does not delete or duplicate the Lab Slip
- failed attachment uploads can be retried
- Lab Slip detail supports attachment listing, viewing, adding, and permitted deletion
- assigned Scanning Staff can view attachments from Scan Booking detail without gaining general Lab Slip access
- loading, error, empty, validation, and read-only UI states implemented
- backend tests pass
- frontend tests pass
- API/frontend lint passes
- frontend build passes
- manual Scanning Staff authorization QA passed
- real Cloudflare R2 upload/view/delete smoke test passed

Known hardening item:

- the maximum-five count check is not fully atomic across simultaneous concurrent uploads; future hardening may make this concurrency-safe if required.

Explicitly out of scope:

- direct intraoral scanner integration
- raw intraoral scan-file storage
- generic attachment ownership across arbitrary entities
- correction attachments until Module 4F defines that relationship
- malware/antivirus scanning in V1

---

# 19. Module 4F — Corrections / Issues

Status: **NEXT**

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

Status: **PLANNED**

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

Last confirmed committed/pushed module:

```text
Module 4D — Lab Production Workflow
```

Final commit:

```text
b392224 feat: add lab production workflow
```

`origin/master` and local `master` were confirmed at the same commit, and the working tree was clean.

---

# 32. Next Session Goal

Current next goal:

```text
Module 4F — Corrections / Issues
```

Module 4D is complete and must not be reopened unless a concrete defect or changed requirement requires it.
