# Cera Dental Lab — Architecture Decisions

## 1. Purpose of This Document

This document records important architectural and product-technical decisions that have already been made for the Cera Dental Lab project.

Its purpose is to prevent future chatbot sessions from:

- reopening settled decisions unnecessarily
- replacing established architecture without cause
- introducing conflicting patterns
- forgetting why a technical choice was made
- silently changing business behavior

This file is a decision log.

It should contain only decisions that are confirmed.

Unresolved items belong in:

`docs/decisions/OPEN_QUESTIONS.md`

---

# 2. Decision Status Labels

Use these labels:

```text
ACCEPTED
→ confirmed and currently authoritative

SUPERSEDED
→ replaced by a later accepted decision

DEPRECATED
→ still present temporarily but should no longer be extended

PROPOSED
→ not yet approved; should normally live in OPEN_QUESTIONS instead
```

For this project, new entries added here should normally be `ACCEPTED`.

---

# ADR-001 — Use a Modular Monolith

Status: **ACCEPTED**

## Decision

The backend uses a modular monolith rather than microservices.

Business capabilities are separated into modules inside one Express application.

## Reason

The project does not currently need distributed-service complexity.

A modular monolith provides:

- simpler development
- simpler deployment
- easier debugging
- straightforward transactions/data access
- clear module ownership
- lower operational overhead

## Consequence

Do not introduce microservices unless a future operational requirement clearly justifies them.

---

# ADR-002 — Use an npm Workspaces Monorepo

Status: **ACCEPTED**

## Decision

The project uses a monorepo with npm workspaces.

Primary areas:

```text
apps/web
apps/api
packages/shared
```

## Reason

Frontend, backend, and shared business constants are developed together and must remain synchronized.

## Consequence

Do not split frontend/backend into separate repositories without an explicit project decision.

---

# ADR-003 — Frontend Uses React + Vite + JavaScript

Status: **ACCEPTED**

## Decision

Frontend stack:

- React
- Vite
- JavaScript

## Reason

This is the chosen implementation stack for the project.

## Consequence

Do not migrate to Next.js or TypeScript during normal feature development unless explicitly approved.

---

# ADR-004 — Backend Uses Node.js + Express + JavaScript ES Modules

Status: **ACCEPTED**

## Decision

Backend stack:

- Node.js
- Express
- JavaScript
- ES modules

## Consequence

New backend modules should follow existing Express/ESM conventions.

Do not introduce another backend framework without a confirmed architectural change.

---

# ADR-005 — MongoDB + Mongoose Are the Primary Data Layer

Status: **ACCEPTED**

## Decision

Primary persistence:

- MongoDB
- Mongoose

Local development currently uses a local MongoDB instance.

## Consequence

Do not introduce another primary database or ORM during normal module development.

---

# ADR-006 — REST API Under `/api/v1`

Status: **ACCEPTED**

## Decision

The operational backend exposes a REST-style API under:

```text
/api/v1
```

## Consequence

New operational endpoints should follow the same versioned base path.

Do not introduce GraphQL or a parallel API style without a confirmed need.

---

# ADR-007 — Backend Is the Security Source of Truth

Status: **ACCEPTED**

## Decision

All real authorization is enforced by the backend.

Frontend role/status checks exist for UX only.

## Reason

Frontend code can be bypassed or manipulated.

## Consequence

Every protected action must independently verify:

- authentication
- role
- resource relationship
- current state
- transition permission

on the backend.

---

# ADR-008 — Authentication Uses Short-Lived Access JWT + Rotating Opaque Refresh Token

Status: **ACCEPTED**

## Decision

Authentication uses:

- access JWT
- access lifetime: 15 minutes
- opaque refresh token
- refresh lifetime: 10 days
- refresh rotation
- server-side refresh-token hashing
- HttpOnly cookies

## Consequence

Do not store auth tokens in browser localStorage/sessionStorage.

Do not replace this architecture with simple long-lived JWT-only authentication without explicit approval.

---

# ADR-009 — Password Hashing Uses Argon2id

Status: **ACCEPTED**

## Decision

Passwords use Argon2id.

Current configured parameters include:

```text
memoryCost: 19456
timeCost: 2
parallelism: 1
```

Minimum password length:

```text
8 characters
```

## Consequence

Do not replace password hashing with weaker/legacy schemes during unrelated work.

---

# ADR-010 — Operational Registration Is Invitation-Based

Status: **ACCEPTED**

## Decision

Operational accounts are not created through unrestricted public signup.

Cera Admin invites users.

## Reason

The system is for known Doctors, clinic staff, Cera personnel, and scanning staff.

## Consequence

Public signup must not be introduced casually.

---

# ADR-011 — Phone Number Is Required for Operational Accounts

Status: **ACCEPTED**

## Decision

Every operational account requires a phone number.

Email is optional.

V1 supports Indian mobile numbers only.

## Consequence

Future user forms and invitations must preserve this rule unless product requirements change.

---

# ADR-012 — Digital Lab Slip Is the Central Operational Record

Status: **ACCEPTED**

## Decision

The central case/prescription record is called:

```text
Lab Slip
```

Implementation/domain name:

```text
LabSlip
```

## Reason

This matches Cera's business workflow and physical prescription process.

## Consequence

Do not replace the domain term with generic names such as:

- Order
- Job
- Ticket
- WorkItem

unless a separate concept is intentionally introduced.

---

# ADR-013 — Doctor UX Must Minimize Effort

Status: **ACCEPTED**

## Decision

Core UX principle:

> Minimum doctor effort, without reducing the quality of information Cera receives.

## Consequence

Doctor forms should remain:

- compact
- familiar
- mobile-first
- low-friction

Do not transform the Lab Slip into a complex ERP-style workflow without a real business requirement.

---

# ADR-014 — Tooth UI Follows Cera's Familiar 1–8 Layout

Status: **ACCEPTED**

## Decision

The UI follows the familiar Cera lab-slip layout:

```text
Upper:
8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8

Lower:
8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8
```

Backend values remain unambiguous quadrant codes:

```text
UR1–UR8
UL1–UL8
LR1–LR8
LL1–LL8
```

## Consequence

Do not switch UI numbering to FDI or another notation unless explicitly requested.

---

# ADR-015 — Catalogue Values Are Snapshotted Into Lab Slips

Status: **ACCEPTED**

## Decision

Lab Slip items preserve product/category snapshot information at submission/edit time.

## Reason

Catalogue records may later:

- be renamed
- be disabled
- change descriptions

Historical case meaning must remain stable.

## Consequence

Historical Lab Slips must not depend only on the current catalogue record for display/meaning.

---

# ADR-016 — Existing Historical Product Items Survive Catalogue Disable

Status: **ACCEPTED**

## Decision

When editing an existing Lab Slip:

- existing stored item snapshots may remain even if the related product/category later becomes inactive
- newly added/replaced selections must use active product + active category

## Reason

Preserve historical integrity while preventing invalid new selections.

---

# ADR-017 — No Direct Intraoral Scanner Integration

Status: **ACCEPTED**

## Decision

The website/application does not directly integrate with the intraoral scanner.

## Consequence

Do not build:

- hardware communication
- scanner SDK integration
- automatic scan-file transfer

unless the project scope explicitly changes.

---

# ADR-018 — Large Scan Files Are Not Stored as Normal Website Attachments

Status: **ACCEPTED**

## Decision

Typical raw scanner files are handled separately.

The future website attachment feature is intended only for normal supporting files.

Planned attachment types include:

- JPEG
- PNG
- WEBP
- PDF

## Consequence

Do not design general application uploads around large scanner-file storage.

---

# ADR-019 — No Payment/Billing Functionality

Status: **ACCEPTED**

## Decision

The Cera platform does not include:

- online payments
- payment gateway
- invoicing/accounting
- billing ERP

Doctors continue using Cera's existing offline payment arrangements.

## Consequence

Do not add payment-oriented entities, screens, APIs, or navigation unless project scope changes explicitly.

---

# ADR-020 — Clinic Access Uses Membership Relationships

Status: **ACCEPTED**

## Decision

Doctor and Clinic Staff access to clinics is represented through active clinic memberships.

Doctor may belong to multiple clinics.

Clinic Staff are limited to their permitted clinic context.

## Consequence

Downstream resources such as Lab Slips and Scan Bookings must use membership-aware authorization.

---

# ADR-021 — Scanning Staff Access Is Intentionally Narrow

Status: **ACCEPTED**

## Decision

Scanning Staff should see:

- assigned scan visits
- minimum information required to perform those visits

They should not receive broad operational access.

## Consequence

Scanning Staff must not gain general access to:

- all Lab Slips
- catalogue administration
- user management
- unrelated scan bookings
- unnecessary manufacturing details

---

# ADR-022 — Scan Booking Is a Separate Operational Record

Status: **ACCEPTED**

## Decision

Scan scheduling is represented as a separate `ScanBooking` linked to a `LabSlip`.

## Reason

Scanning has its own:

- lifecycle
- scheduling
- assignment
- cancellation
- rescheduling
- completion history

## Consequence

Do not collapse scan scheduling into a few Lab Slip fields.

---

# ADR-023 — Scan Booking Main Lifecycle Is Explicit

Status: **ACCEPTED**

## Decision

Current main Scan Booking statuses:

```text
PENDING_REVIEW
AWAITING_CONFIRMATION
CONFIRMED
ASSIGNED
COMPLETED
REJECTED
CANCELLED
```

Transitions are enforced in the service layer.

## Consequence

Do not allow arbitrary status PATCH updates.

Use explicit business actions/transitions.

---

# ADR-024 — A Late Scan Request Is Allowed

Status: **ACCEPTED**

## Decision

A Lab Slip originally created with:

```text
scanRequired = false
```

may later receive a Scan Booking request.

When this occurs, the Lab Slip is updated to reflect scanning requirement.

## Consequence

The initial Lab Slip submission does not permanently prevent later scanning.

---

# ADR-025 — Only One Active Scan Booking Per Lab Slip

Status: **ACCEPTED**

## Decision

A Lab Slip must not have multiple simultaneous active/non-terminal Scan Bookings.

Rejected/cancelled bookings may allow a later new request.

Completed-booking rescan behavior is not automatically allowed.

## Consequence

Rescan behavior must be designed later as part of correction/rescan rules.

---

# ADR-026 — Scan Rescheduling Is Separate From Main Booking Status

Status: **ACCEPTED**

## Decision

A reschedule negotiation does not replace or mutate the main Scan Booking lifecycle state.

Example:

```text
booking.status = ASSIGNED
booking.rescheduleStatus = REQUESTED
```

## Reason

The existing operational booking remains valid while a new time is negotiated.

---

# ADR-027 — Current Confirmed Appointment Remains Active During Rescheduling

Status: **ACCEPTED**

## Decision

The old `confirmedStartAt` remains the operational appointment until the replacement time is finalized.

## Consequence

The UI must clearly communicate that a pending reschedule has not yet replaced the current appointment.

---

# ADR-028 — Assigned Scanner Remains Assigned During Rescheduling

Status: **ACCEPTED**

## Decision

If a Scan Booking is already `ASSIGNED`, the assigned Scanning Staff member remains assigned while rescheduling occurs.

Cera may change assignment separately if needed.

## Consequence

Rescheduling alone must not automatically unassign the scanner.

---

# ADR-029 — New Assignment Is Blocked While Reschedule Is Pending

Status: **ACCEPTED**

## Decision

If a booking is `CONFIRMED` and has unresolved rescheduling, Cera cannot newly assign a scanner until that reschedule is resolved.

## Reason

Avoid assigning staff to a time that is actively being renegotiated.

---

# ADR-030 — Reschedule History Is Preserved

Status: **ACCEPTED**

## Decision

Finalized reschedules are appended to history.

Historical entries must not be overwritten by later reschedules.

## Consequence

Future display/audit behavior may rely on this retained history.

---

# ADR-031 — Lab Slip Identity Fields Are Immutable After Submission

Status: **ACCEPTED**

## Decision

Current immutable Lab Slip identity fields include:

- reference
- clinic
- doctor
- source
- creator
- creation timestamp

## Consequence

Normal Lab Slip edit APIs must reject attempts to change these fields.

---

# ADR-032 — Selected Lab Slip Content Is Editable Before Production Lock

Status: **ACCEPTED**

## Decision

Current Lab Slip edit support includes:

- urgency
- patient information
- items
- teeth
- shade
- pontic/design information
- design notes
- general notes

## Important Limitation

The future point at which production locks these edits has **not yet been decided**.

That decision belongs to Module 4D and must not be inferred from this ADR.

---

# ADR-033 — Active Scan Booking Urgency Tracks Lab Slip Urgency

Status: **ACCEPTED**

## Decision

When Lab Slip urgency changes, active Scan Bookings in:

```text
PENDING_REVIEW
AWAITING_CONFIRMATION
CONFIRMED
ASSIGNED
```

are synchronized.

Terminal historical bookings:

```text
COMPLETED
REJECTED
CANCELLED
```

retain their historical urgency.

---

# ADR-034 — Human-Readable Operational References Use Atomic Counters

Status: **ACCEPTED**

## Decision

Operational records such as Lab Slips and Scan Bookings use references like:

```text
CDL-YYYY-000001
SCAN-YYYY-000001
```

Generation uses an atomic counter/sequence strategy.

## Consequence

Do not replace these references with MongoDB IDs in user-facing workflows.

---

# ADR-035 — Shared Business Enums Live in `packages/shared`

Status: **ACCEPTED**

## Decision

Constants needed by both frontend and backend belong in:

```text
packages/shared
```

Examples:

- roles
- statuses
- urgency
- tooth values
- Scan Booking status
- reschedule status

## Consequence

Do not maintain separate copies of the same business enums in frontend and backend.

---

# ADR-036 — Frontend Routes Stay Outside `App.jsx`

Status: **ACCEPTED**

## Decision

Route definitions live in a dedicated routes module.

## Consequence

Do not move route configuration into `App.jsx`.

---

# ADR-037 — Redux Toolkit Is for Application-Wide State, Not Every State Value

Status: **ACCEPTED**

## Decision

Redux Toolkit is used for appropriate application-wide state, especially authentication.

Local UI/form state remains local to components where practical.

## Consequence

Do not create Redux slices for every page form, modal, or server response by default.

---

# ADR-038 — WhatsApp Is the Preferred External Operational Notification Channel

Status: **ACCEPTED**

## Decision

Notification priority direction:

1. WhatsApp
2. In-app notifications
3. Email where useful later

Planned external integration:

```text
WhatsApp Business Cloud API
```

## Limitation

Specific notification events, templates, retry rules, and recipient behavior are not yet confirmed.

Those belong to Module 5 design.

---

# ADR-039 — Private Supporting Attachments Will Use Controlled Access

Status: **ACCEPTED**

## Decision

Future supporting attachments must be private.

Expected direction:

- external object storage
- access authorization
- signed/time-limited access where appropriate

## Consequence

Do not design patient/case attachments as public permanent URLs.

Exact storage provider is not yet selected.

---

# ADR-040 — UI/UX Is Developed With Each Module

Status: **ACCEPTED**

## Decision

UI/UX is not deferred until the end of backend development.

Each vertical slice should include:

- responsive behavior
- loading
- errors
- empty states
- accessibility basics
- design consistency

## Consequence

Do not treat frontend work as a temporary placeholder to be redesigned later by default.

---

# ADR-041 — Security Is Continuous

Status: **ACCEPTED**

## Decision

Security is addressed in every module.

A later hardening module provides a second system-wide review, not the first security pass.

## Consequence

Every module must consider:

- auth
- resource authorization
- validation
- state abuse
- data exposure
- logging safety

---

# ADR-042 — Development Is Module-by-Module Vertical Slices

Status: **ACCEPTED**

## Decision

Frontend and backend are developed together per business module.

Typical lifecycle:

```text
business rules
↓
backend
↓
tests
↓
frontend
↓
tests
↓
manual QA
↓
regression
↓
commit/push
```

## Consequence

Do not finish all backend modules first and postpone frontend integration.

---

# ADR-043 — One Module Per Chat Session Where Practical

Status: **ACCEPTED**

## Decision

Because the user is developing through a normal chatbot and manually copying code, each major module should normally use a fresh focused chat session.

## Reason

This reduces:

- context overload
- accidental scope creep
- inconsistent edits
- large risky code dumps

## Consequence

Project documentation and handoff files are required for continuity.

---

# ADR-044 — Development Is Manual Copy/Paste, Not Coding-Agent Driven

Status: **ACCEPTED**

## Decision

The user is not using a coding agent.

The user manually:

- runs commands
- opens files
- copies code from chat
- pastes code into VS Code
- runs tests
- returns outputs

## Consequence

The chatbot must:

- ask for current file contents before modifying existing files
- never claim repository inspection that did not happen
- give exact paths
- use small checkpoints
- prefer full-file replacement when scattered edits would be risky
- wait for test results before continuing

---

# ADR-045 — Existing Repository Structure Must Be Followed

Status: **ACCEPTED**

## Decision

Do not introduce new folders, architecture layers, abstractions, or dependencies before inspecting the existing structure.

## Consequence

Avoid casually introducing patterns such as:

- repositories
- domain/use-case layers
- command bus
- event bus
- microservices
- generic service frameworks

unless there is a concrete project need and explicit approval.

---

# ADR-046 — Business Uncertainty Must Stop Implementation

Status: **ACCEPTED**

## Decision

Missing business behavior must not be filled in through assumption.

For unclear items, the chatbot must state:

```text
Known
Unknown
Why it matters
Recommended option
Decision needed
```

before implementation.

## Consequence

The chatbot may make small implementation choices that do not alter business behavior, but must not invent:

- permissions
- statuses
- transitions
- required fields
- automatic actions
- visibility rules
- integrations

---

# ADR-047 — Current Repository/Code Has Highest Technical Priority

Status: **ACCEPTED**

## Decision

For implementation, source-of-truth priority is:

1. current repository/code
2. confirmed requirements
3. design documentation
4. architecture decisions
5. module/session status
6. Git history
7. chat context/memory

## Consequence

If current code conflicts with a confirmed requirement, do not silently follow either one.

Identify and resolve the conflict first.

---

# ADR-048 — Commit and Push Before Starting the Next Module

Status: **ACCEPTED**

## Decision

A completed module must be:

- tested
- linted
- built
- manually verified
- committed
- pushed

before the next module begins.

Working tree should be clean.

## Consequence

Do not accumulate multiple completed modules as uncommitted work.

---

# ADR-049 — Current Branch Workflow Is Simple Module-Sized Commits

Status: **ACCEPTED**

## Decision

For the current solo development workflow, module-sized commits on the existing branch are acceptable.

## Consequence

Feature branches/PR workflow may be introduced later if team size or deployment needs justify it.

Do not introduce branch-process complexity without a reason.

---

# ADR-050 — Production Workflow Is Not Yet Architecturally Decided

Status: **ACCEPTED**

## Decision

Module 4D production architecture is intentionally **not decided yet**.

Open questions include:

- production statuses
- production permissions
- Lab Slip edit lock
- readiness conditions
- history
- whether production lives directly on LabSlip or as a separate entity
- what Doctor/Clinic can see
- completion semantics

## Consequence

No chatbot session may invent a production state machine or production persistence structure before these decisions are approved.

---

# ADR-051 — Use a Retrieval-First Project Knowledge Base for New Chat Sessions

Status: **ACCEPTED**

## Context

Development is split across multiple normal chatbot sessions, and the user manually copies code into VS Code.

The detailed documentation contains the required information, but a new chatbot may still ask repeated questions because the answer is spread across large documents.

## Decision

Maintain:

```text
docs/project/PROJECT_KNOWLEDGE_BASE.md
```

as a retrieval-oriented Q&A index.

Each entry should be small and independently retrievable and should include:

- a probable question
- a canonical answer
- a status (`CONFIRMED`, `REPOSITORY-DERIVED`, `OPEN`, or `DEFERRED`)
- retrieval keywords
- pointers to the detailed source documents

New chatbot sessions must retrieve this knowledge base before asking generic project/setup/business questions.

## Reason

This gives the ChatGPT Project a RAG-like knowledge layer:

```text
user/current task
↓
retrieve matching Q&A
↓
retrieve detailed source document if needed
↓
retrieve current handoff/code
↓
ask only genuinely unresolved blocking questions
```

It reduces repeated questioning without weakening the project's no-assumption rule.

## Consequence

- A `CONFIRMED` knowledge-base answer should not be asked again unless a conflict is found.
- A `DEFERRED` question should not be asked before its module.
- An `OPEN` question is asked only when it blocks current work.
- `REPOSITORY-DERIVED` information must still be checked against current code/config.
- The knowledge base is a retrieval index and does **not** outrank the repository, requirements, detailed design docs, or ADRs.
- When a permanent project decision changes, update both its authoritative document and the relevant knowledge-base entry.

---

# ADR-052 — Disabled Users Invalidate Existing Sessions Immediately

Status: **ACCEPTED**

## Context

Checking user status only during refresh allows a previously issued access token to remain usable until it expires after an account is disabled.

## Decision

Operational users carry an `authVersion`. Access tokens include the version, and authentication compares it to the current user record.

Disabling a user increments `authVersion` and revokes that user's refresh-session records.

## Reason

Disabling an operational account is a security action and should take effect immediately rather than waiting for access-token expiry.

## Consequence

- old access tokens stop authenticating after the account version changes
- refresh sessions are revoked on disable
- re-enabling a user does not make old tokens valid again

---

# ADR-053 — Invitation Tokens Use a Dedicated Secret

Status: **ACCEPTED**

## Context

Invitation token hashing previously depended on refresh-token secret material, coupling two separate security domains.

## Decision

Invitation hashing uses `INVITATION_TOKEN_SECRET`, which must be configured separately and must differ from `REFRESH_TOKEN_SECRET`.

A temporary legacy verification fallback is permitted only for already-issued invitations during migration.

## Reason

Separating secrets reduces cross-feature coupling and limits the blast radius of secret rotation or exposure.

## Consequence

- production configuration must provide a dedicated invitation secret
- environment validation rejects reuse of the refresh-token secret
- legacy compatibility must be removed after the maximum old invitation lifetime has elapsed after rollout

---

# ADR-054 — V1 Browser CSRF Protection Uses Exact Trusted Origin Validation

Status: **ACCEPTED**

## Context

The operational browser API uses credentialed HttpOnly cookies, so unsafe cross-origin browser requests require CSRF protection.

The V1 authenticated browser client is the Cera React frontend only.

## Decision

For unsafe HTTP methods, require a valid `Origin` header whose normalized origin exactly matches the configured `CLIENT_URL` origin.

Safe methods (`GET`, `HEAD`, `OPTIONS`) pass without this check.

Future webhook/provider routes must use provider-specific authentication/signatures and an explicit scoped bypass where necessary.

## Reason

The single trusted browser-origin model provides a simple, explicit CSRF boundary without introducing a second token protocol for V1.

## Consequence

- missing, malformed, `null`, lookalike, or untrusted origins are rejected on unsafe browser requests
- CORS remains an exact credentialed allowlist
- deployment must keep `CLIENT_URL` accurate
- future non-browser integrations must not silently inherit this browser assumption

---

# ADR-055 — Attachment Capacity Is Enforced Atomically in MongoDB

Status: **ACCEPTED**

## Context

A simple `count -> upload -> insert` flow can exceed the maximum attachment count when simultaneous uploads observe the same pre-insert count.

## Decision

New attachment records reserve an internal `capacitySlot`. A partial unique compound index on the parent resource ID plus `capacitySlot` makes MongoDB the final concurrency arbiter.

Existing legacy attachment records without a slot remain valid and still consume capacity.

## Reason

This prevents count-limit races without requiring a distributed lock or a MongoDB transaction around external object-storage operations.

## Consequence

- concurrent requests cannot persist more than the configured attachment maximum
- a losing request recalculates capacity and fails with the existing attachment-limit error when full
- any already-uploaded object from the losing request is cleaned up
- `capacitySlot` remains internal and is not part of the public API contract

---

# 3. Adding a New ADR

When a new permanent decision is made, add an entry using this structure:

```md
# ADR-XXX — Decision Title

Status: **ACCEPTED**

## Context

What problem/decision was being addressed?

## Decision

What was chosen?

## Reason

Why was it chosen?

## Consequence

What must future work now follow?
```

Do not add trivial implementation details as ADRs.

Use ADRs for decisions that future modules might otherwise reopen or contradict.

---

# 4. Superseding a Decision

Do not delete old ADRs when an important decision changes.

Instead:

1. mark the previous ADR `SUPERSEDED`
2. reference the newer ADR
3. add the replacement decision
4. explain why the change occurred

This preserves project history.

---

# 5. Current Decision Boundary

The implemented architecture/decision boundary now extends through:

```text
Foundation
Authentication
Authorization
Users
Clinics
Catalogue
Digital Lab Slip
Scan Booking / Rescheduling
Lab Production
Private Attachments
Corrections
Notifications / operational refinements
Module 7 Security & Cross-Module Hardening
```

The next project phase is:

**Module 8 — End-to-End Regression Testing**

Module 8 should validate the integrated system without inventing new business architecture. Production topology decisions remain deferred to Module 9.
