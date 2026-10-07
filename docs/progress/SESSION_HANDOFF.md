# Cera Dental Lab — Session Handoff

## 1. Purpose of This Document

This document captures the current handoff state between chatbot development sessions.

It should answer:

- What was completed most recently?
- What business rules are currently locked?
- What was tested?
- What is the Git boundary?
- What is the next module?
- What must the next session decide before coding?
- Which files/areas are likely relevant next?

This file should be updated at the end of every completed module session.

It is not a substitute for the full project documentation.

---

# 2. Current Handoff Summary

Last completed module:

```text
Module 4F — Corrections / Issues
```

Current next module:

```text
Module 5A — In-App Notifications
```

Current development mode:

```text
Normal chatbot only
Manual copy/paste into VS Code
No coding agent
```

The next module should begin with notification business/design rules before notification code is written.

---

# 3. Last Completed Functional Boundary

The implemented operational flow currently reaches:

```text
Authentication
↓
User / role authorization
↓
Clinic memberships
↓
Product catalogue
↓
Digital Lab Slip
↓
Optional Scan Booking
↓
Cera scan review
↓
Requested-time confirmation or alternate proposal
↓
Doctor / Clinic acceptance
↓
Scanning Staff assignment
↓
Rescheduling when needed
↓
Scan completion
↓
Lab Production
↓
Case completion
↓
Correction / Issue when required
```

The next missing core operational area is:

```text
Lab Production
```

---

# 4. Module 4C — What Was Added

Module 4C introduced Scan Booking rescheduling.

Confirmed business rules:

- Doctor may request reschedule.
- Clinic Staff may request reschedule for permitted clinic work.
- Cera Staff may manage rescheduling.
- Cera Admin may manage rescheduling.
- Scanning Staff cannot manage rescheduling.
- Rescheduling is allowed only when booking status is:
  - `CONFIRMED`
  - `ASSIGNED`
- Reschedule negotiation does not replace the main booking status.
- The old confirmed appointment remains operational until a replacement is accepted.
- If the booking is already assigned, the same scanner remains assigned.
- A confirmed booking with unresolved rescheduling cannot be newly assigned.
- Finalized reschedules are retained in history.
- Terminal bookings cannot be rescheduled.

---

# 5. Module 4C — Reschedule States

Shared reschedule states:

```text
REQUESTED
AWAITING_CONFIRMATION
```

These are separate from the main Scan Booking states.

Example:

```text
booking.status = ASSIGNED
booking.rescheduleStatus = REQUESTED
```

This means the visit remains assigned while a schedule change is negotiated.

---

# 6. Module 4C — Supported Flows

## Doctor / Clinic Requests Reschedule

```text
CONFIRMED / ASSIGNED
↓
Doctor or Clinic Staff requests a new time
↓
Reschedule status = REQUESTED
↓
Cera reviews
```

Cera may:

```text
Confirm requested time
```

or:

```text
Propose another time
↓
Reschedule status = AWAITING_CONFIRMATION
↓
Doctor / Clinic accepts
```

---

## Cera Initiates Reschedule

```text
CONFIRMED / ASSIGNED
↓
Cera proposes new time
↓
AWAITING_CONFIRMATION
↓
Doctor / Clinic accepts
```

---

## Finalization

When a reschedule is finalized:

```text
old confirmed time
↓
preserved in reschedule history

new accepted time
↓
becomes confirmedStartAt

active reschedule fields
↓
cleared
```

---

# 7. Module 4C — Backend Implementation Summary

Shared package now includes:

```text
SCAN_RESCHEDULE_STATUS
```

Current values:

```text
REQUESTED
AWAITING_CONFIRMATION
```

Scan Booking persistence includes active reschedule fields and:

```text
rescheduleHistory[]
```

History conceptually records:

- previous confirmed time
- requested time
- proposed time
- final confirmed time
- requester
- reviewer
- reason
- requested timestamp
- confirmed timestamp

Backend actions implemented:

```text
POST /:bookingId/reschedule-request
POST /:bookingId/reschedule-confirm
POST /:bookingId/reschedule-propose
POST /:bookingId/reschedule-accept
```

Backend service includes reschedule eligibility, finalization, cleanup, authorization, and assignment protection.

---

# 8. Module 4C — Important Regression Fix

During Module 4C implementation, a temporary mistake affected Scan Booking terminal-state logic.

The correct rule is:

```text
REJECTED
CANCELLED
```

are the terminal states used for allowing a later new Scan Booking request.

Do **not** treat:

```text
CONFIRMED
ASSIGNED
```

as terminal for duplicate-booking logic.

This was fixed and covered by regression tests.

---

# 9. Module 4C — Frontend Implementation Summary

Frontend Scan Booking API support includes:

- request reschedule
- confirm requested reschedule
- propose reschedule
- accept proposed reschedule

The Scan Booking detail screen now includes, in this priority order:

```text
1. Booking summary
2. Action error / important feedback
3. Active reschedule notice
4. Main booking workflow actions
5. Reschedule actions
6. Cancel booking
7. Reschedule history
```

Important UX rule:

The primary booking workflow remains more important than rescheduling.

---

# 10. Module 4C — Scanning Staff UX

Scanning Staff:

- can see current confirmed time
- can see relevant pending reschedule information
- can see history where appropriate
- can still complete assigned visits
- cannot request/confirm/propose/accept reschedules

Their access remains read-only for rescheduling.

---

# 11. Module 4C — Verification Completed

The last completed module was reported as fully passing.

Known successful checks included:

- backend Scan Booking regression tests
- frontend Scan Booking detail tests
- frontend test suite
- backend tests relevant to the module
- `lint:web`
- `lint:api`
- `build:web`
- manual reschedule flows
- permission checks
- scanner-assignment preservation
- terminal-state behavior

The user reported the module was committed and pushed to GitHub.

A new session should still verify the current Git state instead of assuming nothing changed afterward.

---

# 12. Current Git Boundary

Current state reported in this session:

```text
Module 4F implementation and verification are complete.
The working tree still contains the Module 4F changes until the final commit/push.
```

Before starting Module 5A:

```bash
git status
git diff --check
git log -1 --oneline
```

Expected goal after the Module 4F commit/push:

```text
working tree clean
```

---

# 13. Important Locked Project Decisions

The next session must preserve these decisions unless there is a concrete reason to change them:

```text
✓ modular monolith
✓ npm workspaces
✓ React + Vite + JavaScript frontend
✓ Node.js + Express + JavaScript ES modules backend
✓ MongoDB + Mongoose
✓ REST API under /api/v1
✓ shared business constants in packages/shared
✓ backend is authorization source of truth
✓ 15-minute access JWT
✓ 10-day rotating opaque refresh token
✓ HttpOnly cookies
✓ Argon2id passwords
✓ invitation-based operational accounts
✓ phone required, email optional
✓ Indian mobile numbers only in V1
✓ Digital Lab Slip is the central case/prescription record
✓ Doctor may belong to multiple clinics
✓ product/category snapshots preserved on Lab Slips
✓ no online payment/billing
✓ no direct scanner integration
✓ large raw scan files are outside normal website uploads
✓ Scan Booking is separate from Lab Slip
✓ Scan Booking state machine is explicit
✓ rescheduling is separate from main booking state
✓ current confirmed time remains valid until replacement accepted
✓ assigned scanner remains assigned during rescheduling
✓ reschedule history retained
✓ Production is a separate entity linked to Lab Slip
✓ production statuses are SUBMITTED / IN_PRODUCTION / COMPLETED
✓ Cera Staff/Admin move production forward; Admin alone moves backward
✓ private supporting attachments use R2/S3-compatible storage with signed access
✓ Corrections preserve the original Lab Slip/Production and enforce one unresolved Correction per Lab Slip
✓ routes stay outside App.jsx
✓ Redux Toolkit is for app-wide state, not every local state
✓ one module per chat where practical
✓ user manually copy/pastes code
✓ no-assumption policy
✓ module must be committed and pushed before next module
```

---

# 14. Current Lab Slip Behavior

The Lab Slip currently acts as the central case record.

Current status:

```text
SUBMITTED
```

Current editable content includes:

- urgency
- patient name/reference
- products/items
- teeth
- shade
- pontic/design information
- design notes
- general notes

Current immutable identity fields include:

- reference
- clinic
- doctor
- source
- creator
- created timestamp

Doctor/Clinic manufacturing edits are locked after Production leaves `SUBMITTED`; Cera Admin retains controlled edit access.

---

# 15. Current Scan Booking Behavior

Main states:

```text
PENDING_REVIEW
AWAITING_CONFIRMATION
CONFIRMED
ASSIGNED
COMPLETED
REJECTED
CANCELLED
```

Important current rules:

- late scan request is allowed
- only one active/non-terminal Scan Booking per Lab Slip
- rejected/cancelled history may allow a later new booking
- completed booking does not automatically allow a rescan
- scanning staff must be active and have Scanning Staff role
- scanning staff see only assigned bookings
- Doctor/Clinic cancellation is restricted after assignment
- Cera can operationally handle assigned-booking cancellation

---

# 16. Current Product / Catalogue Rule

When creating or newly selecting Lab Slip products:

```text
Product must be ACTIVE
Category must be ACTIVE
```

Existing historical Lab Slip items remain valid even if the product/category later becomes disabled.

Do not rewrite historical snapshots.

Do not invent official Cera catalogue products if real catalogue data is unavailable.

---

# 17. Current UX Rules

Doctor:

```text
mobile-first
simple
fast
low-friction
familiar
```

Cera Staff/Admin:

```text
desktop-oriented
operational
higher information density
clear status/action priority
```

Scanning Staff:

```text
mobile-first
assigned visits only
minimal necessary information
```

Doctor navigation direction:

```text
Dashboard
New Lab Slip
My Slips
Scans
Corrections
Profile
```

`Corrections` is implemented in Module 4F.

---

# 18. Current Scope Exclusions

Do not add:

- online payments
- payment gateway
- billing/accounting
- inventory ERP
- ecommerce/cart
- direct scanner integration
- large scan-file upload/storage
- arbitrary public operational signup

These are not part of the current Cera system scope.

---

# 19. Current Notification Direction

Preferred external operational channel:

```text
WhatsApp
```

Planned provider direction:

```text
WhatsApp Business Cloud API
```

In-app notifications are also planned.

However, notification events, recipients, templates, and retry behavior are not yet defined.

Module 5A covers in-app notifications. Do not add automatic WhatsApp behavior until Module 5B rules are explicitly decided.

---

# 20. Current Attachment Direction

Module 4E is **COMPLETE**.

Implemented:

```text
JPEG/JPG
PNG
WEBP
PDF
max 10 MB per file
max 5 attachments
private Cloudflare R2 / S3-compatible storage
signed temporary access URLs
```

Large raw scanner files remain excluded. Correction evidence reuses this private attachment infrastructure.

---

# 21. Next Module — Module 5A

Module:

```text
In-App Notifications
```

Status:

```text
NEXT
```

Before coding, define which events are genuinely actionable, who receives them, read/unread behavior, retention, deep links, and deduplication.

---

# 22. Modules 4D–4F Completion Summary

## Module 4D — Lab Production Workflow

Status: **COMPLETE**

- `SUBMITTED → IN_PRODUCTION → COMPLETED` forward lifecycle
- Cera Staff/Admin forward actions
- Admin-only backward moves with required reason
- scan-required production waits for completed scan
- production history retained
- Doctor/Clinic simplified production status
- Lab Slip edit lock after production starts

## Module 4E — Private Attachments

Status: **COMPLETE**

- private JPEG/JPG, PNG, WEBP, PDF
- 10 MB/file, maximum 5
- private R2/S3-compatible storage with signed access
- large raw scan files excluded

## Module 4F — Corrections / Issues

Status: **COMPLETE**

- completed-production-only creation
- Doctor/Clinic/Cera creation subject to resource authorization
- one unresolved Correction per Lab Slip
- historical Corrections retained
- strict review/clarification/resolve/reject state machine
- required terminal resolution outcome for resolved Corrections
- private evidence attachments
- terminal evidence read-only
- no automatic rescan/reproduction record creation
- original Lab Slip and Production remain intact

---

# 23. Module 4F Verification Boundary

Completed checks:

- focused Correction backend tests
- focused Lab Slip → Correction frontend tests
- full API test suite
- full web test suite
- `lint:api`
- `lint:web`
- web build
- manual lifecycle/role/evidence QA
- route placement verified so both Correction routes remain inside the authenticated portal wrapper

The user reported all requested tests/checks passed.

---

# 24. Locked Correction Rules

```text
OPEN → UNDER_REVIEW
UNDER_REVIEW → AWAITING_CLARIFICATION
AWAITING_CLARIFICATION → UNDER_REVIEW
UNDER_REVIEW → RESOLVED
UNDER_REVIEW → REJECTED
```

Invalid transitions are rejected. `RESOLVED` and `REJECTED` are terminal.

Clarification request and response notes are required. Start-review, resolution, and rejection notes are optional.

Resolution outcome is required and must be one of:

```text
HANDLED
RESCAN_REQUIRED
REPRODUCTION_REQUIRED
```

These outcomes are descriptive in Module 4F; they do not automatically create a new Scan Booking, Production cycle, or Lab Slip.

---

# 25. Suggested Module 5A Session Start

Start by resolving only notification decisions that block Module 5A:

```text
1. Which events create in-app notifications?
2. Who receives each event?
3. What notification content is safe/useful?
4. Read/unread behavior?
5. Retention?
6. Deep links?
7. Deduplication?
8. Which events must NOT create notifications?
```

Do not automatically add WhatsApp behavior during 5A. WhatsApp remains Module 5B.

---

# 26. Manual Development Protocol

The user is manually copying code into VS Code. Continue checkpoint-by-checkpoint:

1. inspect current relevant file before modifying it
2. give exact path and targeted/full replacement instruction
3. run the smallest relevant test
4. fix failures before continuing
5. run full regression/lint/build before module completion
6. perform manual browser QA
7. review Git diff/status
8. commit and push before beginning the next module

---

# 27. Handoff State

```text
MODULE 4F FUNCTIONALLY COMPLETE AND VERIFIED
NEXT: MODULE 5A — IN-APP NOTIFICATIONS
```

Current source-control step: review the final Module 4F diff, then commit and push.
