# Cera Dental Lab — Module Plan

## 1. Purpose of This Document

This document defines the module structure, sequencing, dependencies, responsibilities, and planned scope for the Cera Dental Lab project.

It answers:

- What modules exist?
- What has already been completed?
- What comes next?
- How do modules depend on one another?
- What belongs inside each module?
- What must remain out of scope until a later module?

Development is intentionally performed **one module per chatbot session whenever practical**.

A module is a coherent business capability, not an arbitrary group of files.

---

## 2. Module Planning Principles

Every module should:

- have a clear business purpose
- have explicit actors
- have explicit dependencies
- have defined in-scope behavior
- identify out-of-scope behavior
- define acceptance criteria before implementation
- include backend and frontend work where relevant
- include authorization and validation
- include tests
- include manual QA
- be committed and pushed before the next module begins

A module should not silently absorb unrelated future work.

If a module becomes too large, split it into submodules.

---

# 3. Module Overview

## Module 0 — Foundation

Status: **COMPLETE**

Purpose:

Establish the monorepo, frontend, backend, shared package, development tooling, database connection, validation, logging, security middleware, testing, and health checks.

Main areas:

- npm workspaces
- `apps/web`
- `apps/api`
- `packages/shared`
- React + Vite
- Express
- MongoDB / Mongoose
- environment loading
- CORS
- Helmet
- request IDs
- structured errors
- Winston logging
- health endpoint
- Vitest
- lint/build setup

Output:

A stable technical base on which all business modules depend.

---

# 4. Module 1 — Authentication

## Module 1A — User + Password Foundation

Status: **COMPLETE**

Purpose:

Create the operational user model and secure password handling.

Main capabilities:

- User model
- role
- user status
- name
- phone
- optional email
- password hash
- Argon2id
- admin creation utility/CLI

Dependencies:

- Module 0

---

## Module 1B — Login

Status: **COMPLETE**

Purpose:

Allow operational users to authenticate securely.

Main capabilities:

- login with phone/email + password
- access JWT
- rotating opaque refresh-token model foundation
- HttpOnly cookies
- login rate limiting
- safe user serialization
- last-login tracking

Dependencies:

- Module 1A

---

## Module 1C — Persistent Authentication

Status: **COMPLETE**

Purpose:

Maintain authenticated sessions safely across browser reloads and short-lived access-token expiry.

Main capabilities:

- `/auth/me`
- access-token verification
- refresh-token rotation
- replay handling
- refresh-session revocation behavior
- frontend auth initialization
- shared refresh promise
- authenticated API retry
- Redux auth state
- protected routes
- role guards

Dependencies:

- Module 1B

---

## Module 1D — Logout

Status: **COMPLETE**

Purpose:

Allow users to explicitly end their current authenticated session.

Main capabilities:

- current refresh-token revocation
- cookie clearing
- logout without requiring a valid access token
- frontend logout flow
- account menu integration

Dependencies:

- Module 1C

---

# 5. Module 2 — Authorization & User Administration

## Module 2A — Role Authorization

Status: **COMPLETE**

Purpose:

Create reusable coarse role authorization for protected backend/frontend areas.

Main capabilities:

- backend `authorizeRoles`
- frontend role guards
- reusable role checks
- tests

Important rule:

Role checks do not replace resource-level authorization.

Dependencies:

- Module 1

---

## Module 2B — Invitations & User Management

Status: **COMPLETE**

Purpose:

Allow Cera Admin to manage operational users without public operational signup.

Main capabilities:

- invite users
- invitation preview
- invitation acceptance
- invitation revocation
- invitation regeneration
- user listing
- disable/reactivate users
- invitation expiry
- single-use invitation behavior

Dependencies:

- Module 2A

Future hardening may include:

- dedicated invitation secret
- additional public invitation rate limits
- CSRF review
- stronger admin security/MFA

---

# 6. Module 3 — Core Business Configuration

## Module 3A — Clinics & Memberships

Status: **COMPLETE**

Purpose:

Represent clinics/hospitals and define which Doctors/Clinic Staff belong to them.

Main capabilities:

- clinic creation
- clinic editing
- disable/reactivate
- user membership assignment
- active membership removal
- Doctor many-to-many clinic support
- Clinic Staff clinic restrictions
- accessible clinic lookup
- reusable membership authorization helper

Dependencies:

- Module 2

---

## Module 3B — Product Catalogue

Status: **COMPLETE**

Purpose:

Provide the catalogue used by Doctors and Cera when creating Digital Lab Slips.

Main capabilities:

- product categories
- products
- active/inactive state
- sort order
- stable slugs
- category/product administration
- active catalogue visibility
- role restrictions

Important rule:

Do not invent official Cera catalogue products if authoritative catalogue data is unavailable.

Dependencies:

- Module 2
- Module 3A indirectly through operational workflows

---

# 7. Module 4 — Lab Case Operations

Module 4 contains the core operational workflow around the Digital Lab Slip.

---

## Module 4A — Digital Lab Slip Core

Status: **COMPLETE**

Purpose:

Digitize the central Cera lab prescription/case record.

Main capabilities:

- Lab Slip reference generation
- Doctor creation
- Clinic Staff creation
- Cera creation
- source tracking
- patient name/reference
- product selection
- product/category snapshotting
- tooth selection
- shade
- pontic/design information
- design notes
- general notes
- urgency
- scan-required flag
- list/search/detail
- role/resource authorization
- Doctor mobile-oriented creation flow
- paper-like tooth selector

Dependencies:

- Authentication
- Authorization
- Clinics
- Product Catalogue

---

## Module 4B — Scan Booking Core + Lab Slip Editing

Status: **COMPLETE**

Purpose:

Allow scanning to be requested and scheduled, and allow permitted Lab Slip edits before production begins.

Main capabilities:

### Scan Booking

- request scan
- later scan request even if original Lab Slip did not require scanning
- requested date/time
- Cera confirm requested time
- Cera propose alternate time
- Doctor/Clinic accept alternate
- reject request
- assign active Scanning Staff
- complete scan visit
- cancellation rules
- role-specific listing/access
- Scanning Staff assigned-visits view
- duplicate active-booking prevention

### Lab Slip Editing

Editable:

- urgency
- patient information
- products/items
- teeth
- shade
- pontic/design information
- design notes
- general notes

Immutable:

- reference
- clinic
- doctor
- source
- creator
- creation time

Additional behavior:

- newly added products must be active
- historical product snapshots remain usable
- active Scan Booking urgency synchronizes when Lab Slip urgency changes
- terminal Scan Booking urgency history remains unchanged

Dependencies:

- Module 4A
- Module 3A
- Module 3B

---

## Module 4C — Scan Rescheduling

Status: **COMPLETE**

Purpose:

Allow confirmed or assigned scan appointments to be safely rescheduled without losing the existing operational appointment until the new time is accepted.

Main capabilities:

- Doctor reschedule request
- Clinic Staff reschedule request
- Cera reschedule request
- Cera confirm requested reschedule
- Cera propose alternate reschedule
- Cera direct reschedule proposal
- Doctor/Clinic accept proposed reschedule
- reschedule history
- current confirmed appointment preserved during negotiation
- assigned scanning staff preserved
- assignment blocked while reschedule is unresolved
- Scanning Staff read-only reschedule visibility

Reschedulable main statuses:

- `CONFIRMED`
- `ASSIGNED`

Reschedule negotiation state is separate from main Scan Booking status.

Dependencies:

- Module 4B

---

## Module 4D — Lab Production Workflow

Status: **COMPLETE**

Implemented scope:

- separate Production record linked to Lab Slip
- `SUBMITTED`, `IN_PRODUCTION`, `COMPLETED` lifecycle
- Cera Staff/Admin forward transitions
- Admin-only backward transitions with required reason
- production readiness tied to completed scanning when `scanRequired=true`
- production history and timestamps
- Doctor/Clinic simplified production visibility
- Lab Slip edit locking after production starts, with controlled Admin access

Completed Production may be moved back independently by Admin. Corrections do not reopen or overwrite Production.

---

## Module 4E — Private Attachments

Status: **COMPLETE**

Implemented scope:

- private JPEG/JPG, PNG, WEBP, and PDF supporting files
- 10 MB maximum per file
- maximum 5 attachments
- private Cloudflare R2 / S3-compatible storage
- signed temporary access URLs
- resource-based authorization
- state-aware upload/delete controls
- no direct scanner integration or large raw intraoral scan storage

This infrastructure is reused for Correction evidence in Module 4F.

---

## Module 4F — Corrections / Issues

Status: **COMPLETE**

Implemented scope:

- create Correction only for completed Production
- Doctor, permitted Clinic Staff, Cera Staff, and Cera Admin creation
- one unresolved Correction per Lab Slip, while retaining historical Corrections
- required description, optional affected Lab Slip items, optional evidence
- `OPEN`, `UNDER_REVIEW`, `AWAITING_CLARIFICATION`, `RESOLVED`, `REJECTED`
- strict transition rules and clarification round-trip
- Cera review/resolve/reject actions
- Doctor/Clinic clarification responses
- required resolution outcome: `HANDLED`, `RESCAN_REQUIRED`, or `REPRODUCTION_REQUIRED`
- terminal evidence is read-only
- original Lab Slip and Production remain intact
- no automatic rescan or reproduction workflow is created from an outcome

Dependencies completed: Modules 4D and 4E.

---

# 8. Module 5 — Communication

## Module 5A — In-App Notifications

Status: **NEXT**

Purpose:

Provide operational notifications within the portal.

Potential events may include:

- scan request reviewed
- alternate scan time proposed
- scan assigned
- scan rescheduled
- production status changes
- case completed
- correction updates

Exact notification events must be confirmed before implementation.

Required design decisions:

- recipient rules
- read/unread behavior
- notification retention
- deep links
- deduplication
- which events should not create notifications

Dependencies:

- stable operational workflows

---

## Module 5B — WhatsApp Notifications

Status: **PLANNED**

Purpose:

Use WhatsApp as the preferred external operational notification channel.

Planned direction:

- WhatsApp Business Cloud API

Required decisions:

- approved message events
- templates
- recipient phone selection
- opt-in/compliance requirements
- retry/failure behavior
- message logging
- fallback behavior
- whether every in-app notification should also create WhatsApp communication

Dependencies:

- Module 5A or shared notification-event design
- stable production/scan/correction workflows

---

# 9. Module 6 — Operational Experience Refinement

These modules refine the overall experience after the major workflows are stable.

---

## Module 6A — Doctor Dashboard

Status: **PLANNED**

Purpose:

Improve Doctor visibility into active cases and important actions.

Potential content:

- recent Lab Slips
- scans needing confirmation
- upcoming scans
- production status
- completed cases
- corrections requiring attention

Exact metrics/cards must be confirmed from real usage needs.

---

## Module 6B — Cera Operations Dashboard

Status: **PLANNED**

Purpose:

Give Cera Staff/Admin an efficient operational view across active work.

Potential areas:

- pending scan reviews
- confirmed scans
- unassigned scans
- today's scan visits
- production workload
- urgent cases
- completed cases
- correction queue

Do not turn this into a full ERP unless explicitly required.

---

## Module 6C — Scanning Staff Mobile Workflow Refinement

Status: **PLANNED**

Purpose:

Polish the mobile workflow for personnel visiting clinics/hospitals.

Potential improvements:

- today's assigned visits
- visit order
- minimal clinic/contact information
- clear current confirmed time
- reschedule notice
- completion action
- empty/offline/failure states

No direct scanner hardware integration.

---

# 10. Module 7 — Security & Cross-Module Hardening

Status: **PLANNED**

Purpose:

Perform a system-wide security and authorization review after major feature development.

Potential areas:

- cross-module resource authorization
- CSRF protection review
- CORS hardening
- rate-limit coverage
- admin MFA
- refresh-session revocation rules
- invitation/reset hardening
- private upload security
- content-type validation
- security headers
- logging review
- patient-data exposure review
- dependency audit
- secrets/environment review

Important:

Security is already handled continuously in every module.

This module is an additional cross-system hardening pass, not the first time security is considered.

---

# 11. Module 8 — End-to-End Regression & Edge-Case Testing

Status: **PLANNED**

Purpose:

Validate the complete integrated product before production deployment.

Coverage should include:

- Doctor journeys
- Clinic Staff journeys
- Cera Admin journeys
- Cera Staff journeys
- Scanning Staff journeys
- role isolation
- invalid state transitions
- disabled users
- disabled clinics
- disabled catalogue products
- stale sessions
- token refresh/replay cases
- scan scheduling/rescheduling
- production
- corrections
- attachments
- notifications
- responsive behavior
- failure states
- concurrency-sensitive workflows where relevant

---

# 12. Module 9 — Production Deployment

Status: **PLANNED**

Purpose:

Prepare and deploy the application to the production environment.

Likely areas:

- production environment variables
- domain
- HTTPS
- reverse proxy
- application containers
- database configuration
- Redis if required
- private object storage
- CI/CD
- health checks
- backup strategy
- log collection
- deployment rollback procedure

Exact infrastructure must be confirmed before implementation.

---

# 13. Module 10 — Final Documentation & Monitoring

Status: **PLANNED**

Purpose:

Complete operational readiness after deployment.

Documentation may include:

- deployment guide
- environment setup
- backup/recovery guide
- administrator guide
- Cera Staff guide
- Doctor guide
- Scanning Staff guide
- API reference where useful
- troubleshooting guide
- production runbook

Monitoring may include:

- uptime/health monitoring
- error monitoring
- structured application logs
- infrastructure metrics
- database health
- notification delivery failures
- storage failures
- security/event visibility

Exact monitoring stack must be explicitly selected later.

---

# 14. Dependency Overview

High-level dependency flow:

```text
Module 0 Foundation
        ↓
Module 1 Authentication
        ↓
Module 2 Authorization / Users
        ↓
Module 3 Clinics / Catalogue
        ↓
Module 4A Digital Lab Slip
        ↓
Module 4B Scan Booking + Editing
        ↓
Module 4C Scan Rescheduling
        ↓
Module 4D Production
        ↓
Module 4F Corrections
```

Supporting modules:

```text
Attachments
     ↘
      Operational workflows
     ↗

Notifications
     ↘
      Scan / Production / Corrections
```

Refinement follows stable workflows:

```text
Core workflows
↓
Dashboards / UX refinement
↓
Security hardening
↓
End-to-end testing
↓
Deployment
↓
Monitoring
```

---

# 15. Session Rule

Every new module session must first establish:

1. where the module fits in this plan
2. which completed modules it depends on
3. which existing files/modules it affects
4. its confirmed business rules
5. its unresolved questions
6. its acceptance criteria
7. its explicit out-of-scope items

Only then should implementation begin.

---

# 16. Current Position

Current completed boundary:

**Module 4F — Corrections / Issues**

Current next module:

**Module 5A — In-App Notifications**

Before Module 5A implementation, notification events, recipients, read/unread behavior, retention, and deep-link behavior must be confirmed. Do not assume every workflow event needs a notification.
