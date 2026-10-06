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
Module 4C — Scan Rescheduling
```

Current next module:

```text
Module 4D — Lab Production Workflow
```

Current development mode:

```text
Normal chatbot only
Manual copy/paste into VS Code
No coding agent
```

The next session must **not** begin with production code.

It must first resolve the production business lifecycle and permissions.

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

# 12. Last Known Git Boundary

Last known state:

```text
Module 4C committed
Module 4C pushed to GitHub
```

Recommended commit message used:

```text
feat: add scan booking rescheduling workflow
```

At the start of the next development session, run:

```bash
git status
git log -1 --oneline
```

Expected goal:

```text
working tree clean
```

If not clean, inspect changes before starting Module 4D.

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

The future production edit-lock point is **not yet decided**.

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

`Corrections` remains future functionality.

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

Do not add automatic WhatsApp behavior inside Module 4D unless explicitly decided.

---

# 20. Current Attachment Direction

Attachments are planned but not yet implemented.

Planned supported types:

```text
JPEG
PNG
WEBP
PDF
```

Attachments must be private.

Large raw scanner files remain excluded.

Object-storage provider and permissions are not yet locked.

---

# 21. Next Module — Module 4D

Module:

```text
Lab Production Workflow
```

Status:

```text
NEXT
```

Implementation has not begun.

The next session should focus first on understanding Cera's real production workflow.

---

# 22. Module 4D — Decisions Required Before Coding

The next session must resolve:

```text
1. Production statuses
2. Production readiness condition
3. Who can start production
4. Who can update production status
5. Allowed transitions
6. Whether backward transitions are allowed
7. Lab Slip edit-lock point
8. Whether production history is retained
9. What Doctor can see
10. What Clinic Staff can see
11. What “completed” means
12. Whether production has an assignee
13. Whether production lives on LabSlip or a separate entity
14. Whether completed production can reopen
15. Whether transitions need notes/reasons
```

These questions are already listed in:

```text
docs/decisions/OPEN_QUESTIONS.md
```

---

# 23. Module 4D — Do Not Assume

Do **not** start by inventing a state machine such as:

```text
SUBMITTED
→ IN_PRODUCTION
→ QUALITY_CHECK
→ COMPLETED
```

unless Cera's actual business workflow confirms those statuses.

Do not assume:

- quality-check state exists
- technician assignment exists
- delivery status exists
- scan completion always automatically starts production
- urgent cases automatically receive a deadline
- Doctors see every internal state
- completed cases can be reopened
- Cera Staff and Admin have identical production permissions

---

# 24. Suggested Module 4D Session Start

Use a new chat and paste:

```text
docs/progress/CHAT_CONTEXT.md
```

Then state:

```text
This session is only for Module 4D — Lab Production Workflow.

Do not write code yet.

First understand:
1. where this module fits,
2. dependencies,
3. current Lab Slip/Scan behavior,
4. production business flow,
5. unresolved decisions,
6. acceptance criteria.

Do not assume missing business rules.

I am not using a coding agent.
I manually run commands and copy/paste code into VS Code.
Ask me for current files before modifying them.
```

---

# 25. Module 4D — Likely Existing Areas to Inspect Later

Only after business rules are approved, the next session will probably need current versions of relevant files such as:

```text
packages/shared/src/labSlip.js
packages/shared/src/index.js

apps/api/src/modules/labSlips/labSlip.model.js
apps/api/src/modules/labSlips/labSlip.schemas.js
apps/api/src/modules/labSlips/labSlip.serializer.js
apps/api/src/modules/labSlips/labSlip.service.js
apps/api/src/modules/labSlips/labSlip.controller.js
apps/api/src/modules/labSlips/labSlip.routes.js
apps/api/src/modules/labSlips/labSlip.test.js
```

Scan Booking files may also be relevant if production readiness depends on completed scanning.

Do not request all files at once unless necessary.

---

# 26. Manual Development Protocol for the Next Session

The next chatbot session must remember:

```text
User is manually copying code.
```

Therefore:

1. Ask for only the relevant current file(s).
2. Review actual contents.
3. Give exact file path.
4. State whether change is:
   - targeted edit, or
   - full-file replacement.
5. User pastes it.
6. Ask user to run the smallest relevant test.
7. Fix failures before continuing.
8. Move checkpoint by checkpoint.

---

# 27. Recommended Module 4D Checkpoints

After business design is approved:

```text
Checkpoint 1
Production business rules + state machine

Checkpoint 2
Acceptance criteria

Checkpoint 3
Shared constants/contracts

Checkpoint 4
Persistence/model changes

Checkpoint 5
Backend business service

Checkpoint 6
Validation/controller/routes/serializer

Checkpoint 7
Backend tests

Checkpoint 8
Frontend API

Checkpoint 9
Frontend production UI

Checkpoint 10
Frontend tests

Checkpoint 11
Manual role/state QA

Checkpoint 12
Full regression / lint / build

Checkpoint 13
Git review

Checkpoint 14
Commit + push

Checkpoint 15
Update docs + handoff
```

The actual technical structure must be chosen only after production design is confirmed.

---

# 28. End-of-Next-Session Requirement

When Module 4D is eventually complete, update:

```text
docs/progress/MODULE_STATUS.md
docs/progress/SESSION_HANDOFF.md
docs/progress/CHAT_CONTEXT.md
```

Also update:

```text
docs/decisions/ARCHITECTURE_DECISIONS.md
docs/decisions/OPEN_QUESTIONS.md
```

for all production decisions made.

If production rules change requirements/business flows, update the corresponding project/design docs too.

---

# 29. Handoff State

Current handoff status:

```text
READY FOR MODULE 4D BUSINESS DESIGN
```

Not yet ready for:

```text
MODULE 4D CODING
```

The next step is to understand and approve Cera's actual lab-production workflow.
