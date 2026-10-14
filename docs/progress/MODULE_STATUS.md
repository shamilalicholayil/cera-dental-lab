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

Current completed boundary:

```text
Module 9 — Production Deployment
```

Current active module:

```text
Module 10 — Final Documentation & Monitoring
```

Production is live at:

`https://16.16.51.55`

The final production domain remains deferred; the current IP-based HTTPS launch is intentional.

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
| 5A | In-App Notifications | PLANNED / VERIFY CURRENT REPO BEFORE CHANGING |
| 5B | WhatsApp Notifications | PLANNED |
| 6A | Doctor Dashboard Refinement | PLANNED / VERIFY CURRENT REPO BEFORE CHANGING |
| 6B | Cera Operations Dashboard | PLANNED / VERIFY CURRENT REPO BEFORE CHANGING |
| 6C | Scanning Staff Mobile Refinement | PLANNED / VERIFY CURRENT REPO BEFORE CHANGING |
| 7 | Security & Cross-Module Hardening | COMPLETE |
| 8 | End-to-End Regression Testing | COMPLETE |
| 9 | Production Deployment | COMPLETE / LIVE |
| 10 | Final Documentation & Monitoring | IN PROGRESS |

Where a module is marked `VERIFY CURRENT REPO`, this documentation does not claim implementation details that were not re-audited during the deployment documentation pass.

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

Status: **COMPLETE — REPOSITORY-DERIVED**

The production workflow is implemented in the current repository.

Important documentation rule:

- do not use the historical pre-Module-4D open questions as current behavior
- inspect the current production module, shared constants, validators, serializers, and tests for the exact state machine, permissions, readiness, edit-lock, visibility, history, and completion semantics
- changes to production behavior require current-code inspection and a new business decision where behavior would change

# 18. Module 4E — Private Attachments

Status: **COMPLETE**

Current implementation facts:

- private supporting attachments are implemented
- Cloudflare R2 is the production object store
- storage is accessed through the S3-compatible API
- normal attachment limit is 10 MiB
- supported normal attachment direction remains JPEG, PNG, WEBP, and PDF
- access is authorization-controlled
- raw intraoral scan files remain outside ordinary website attachment storage

# 19. Module 4F — Corrections / Issues

Status: **COMPLETE — REPOSITORY-DERIVED**

Corrections/issues are implemented in the current repository.

For exact correction statuses, permissions, rescan/reproduction behavior, attachment behavior, and lifecycle transitions, inspect the current correction module/shared constants/tests rather than relying on historical pre-implementation questions.

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

The completed hardening boundary includes the production-oriented authentication/authorization, browser-origin/CSRF, proxy, validation, error/logging, and cross-module review required before the regression/deployment gate.

The last known security-hardening commit before Module 8 was reported as:

`568ecc5 security: complete module 7 hardening`

Future security work may still occur during monitoring/operations, but Module 7 itself is complete.

# 26. Module 8 — End-to-End Regression Testing

Status: **COMPLETE**

Verified before deployment:

- `npm run test:api`
- `npm run test:web`
- `npm run lint:web`
- `npm run lint:api`
- `npm run build:web`
- `npm run test:e2e`
- production API image CI check
- production web image CI check
- production Compose integration check

The user reported the full regression gate passing before Module 9 continued.

# 27. Module 9 — Production Deployment

Status: **COMPLETE — LIVE**

Current public address:

`https://16.16.51.55`

Verified production state:

- AWS EC2 hosts the production runtime.
- Host Nginx terminates public HTTP/HTTPS and proxies to the Docker web listener.
- Docker web is bound to `127.0.0.1:8080` only.
- Docker API exposes port `4000` only to the internal Docker network; it is not published on the EC2 host.
- MongoDB Atlas is the production database.
- Cloudflare R2 is the private supporting-attachment store.
- Redis is not used by the current production application.
- GitHub Actions publishes API/web images to GHCR.
- Production releases use exact commit-SHA image tags.
- GitHub Actions automatically deploys to EC2 over SSH after the production gate succeeds.
- EC2 SSH host identity is pinned in the workflow.
- Deployment waits for container health and checks `/api/v1/health` through the web/Nginx path.
- Failed releases restore the previous image references and bring the previous Compose deployment back up.
- HTTPS is live on the public IP and HTTP redirects to HTTPS.
- Production `CLIENT_URL` uses the public HTTPS origin.
- Admin seeding uses the existing `create:admin` script inside the production API container.

Deferred deployment item:

- replace the temporary IP URL with the final Cera domain when the domain is selected.

# 28. Module 10 — Final Documentation & Monitoring

Status: **IN PROGRESS**

Current work:

- reconcile project documentation with the live production architecture
- produce/maintain production runbook information
- confirm backup/recovery behavior
- select and configure monitoring/error visibility
- record troubleshooting and rollback procedures
- document later domain cutover

Monitoring vendor/tooling is not yet locked.

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
✓ AWS EC2 production host
✓ Docker Compose production runtime
✓ MongoDB Atlas production database
✓ Cloudflare R2 private attachments
✓ no Redis in current production runtime
✓ GHCR production images
✓ GitHub Actions automatic SSH deployment
✓ commit-SHA production releases
✓ health-checked rollback-capable deploys
✓ API port 4000 not publicly published
✓ Docker web bound to 127.0.0.1:8080 behind host Nginx
✓ HTTPS required for public production access
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

Current project boundary:

```text
Module 9 — Production Deployment complete and verified live
```

The production deployment pipeline now publishes and deploys exact commit-SHA container images.

A fresh session should still verify repository state before code changes:

```bash
git status
git log -1 --oneline
```

Do not assume a specific current SHA from this document; the deployment pipeline advances it on successful releases.

# 32. Next Session Goal

The next project session should focus on:

```text
Module 10 — Final Documentation & Monitoring
```

Primary goals:

```text
Finalize documentation
↓
Confirm backup/recovery
↓
Select/implement monitoring and error visibility
↓
Run final production QA
↓
Document later domain cutover
```

Do not reopen completed deployment decisions unless a production requirement changes.

