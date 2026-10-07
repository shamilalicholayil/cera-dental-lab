# Cera Dental Lab — Open Questions

## 1. Purpose of This Document

This document records unresolved business, workflow, design, security, and architecture questions that must not be silently assumed during development.

If a question affects implementation, the chatbot must stop and resolve it before coding dependent behavior.

When a question is resolved:

1. record the final decision here
2. mark it `RESOLVED`
3. update the relevant requirements/design documents
4. add an Architecture Decision Record if the decision will affect future modules

---

# 2. Status Values

Use:

```text
OPEN
→ unresolved and may block implementation

DEFERRED
→ intentionally postponed to a future module

RESOLVED
→ decision confirmed and documented
```

---

# 3. Current Priority

The next planned module is:

```text
Module 5A — In-App Notifications
```

Modules 4D, 4E, and 4F are resolved and implemented. Current blocking questions are in the notification section.

---

# 4. Module 4D — Lab Production Workflow

All Module 4D blocking decisions are now **RESOLVED** and implemented. The original question context is retained below for history.

## Q-4D-001 — What production statuses should exist?

Status: **RESOLVED**

### Decision

`SUBMITTED`, `IN_PRODUCTION`, `COMPLETED`.

### Known

The Lab Slip currently stops at:

```text
SUBMITTED
```

Cera must eventually manufacture the case and mark it completed.

### Historical uncertainty before resolution

The exact production lifecycle.

### Why it matters

This affects:

- database design
- API transitions
- role permissions
- UI status display
- edit locking
- history
- completion behavior
- correction workflow later

### Historical decision needed

Define the minimum real-world statuses Cera actually uses.

Do not create statuses just because they are common in other lab systems.

---

## Q-4D-002 — What makes a case ready for production?

Status: **RESOLVED**

### Decision

Non-scan cases may start production immediately; scan-required cases require a `COMPLETED` Scan Booking first.

### Known

Some cases require Cera scanning and some do not.

### Historical uncertainty before resolution

What conditions must be true before production can begin.

Questions include:

- Can a non-scan case begin production immediately after submission?
- For a scan-required case, must the Scan Booking be `COMPLETED` first?
- Can Cera manually override readiness?
- Is any additional approval/check required?

### Why it matters

This determines when the production-start action becomes valid.

### Historical decision needed

Define production readiness separately for:

- scan-required cases
- non-scan cases

---

## Q-4D-003 — Who can start production?

Status: **RESOLVED**

### Decision

Cera Staff and Cera Admin may start production.

### Possible actors to decide between

- Cera Admin
- Cera Staff
- another future production-specific role

### Why it matters

This is a backend authorization rule and affects operational UI.

### Historical decision needed

Confirm exactly which roles may start production.

---

## Q-4D-004 — Who can update production status?

Status: **RESOLVED**

### Decision

Cera Staff/Admin may move production forward; approved backward transitions are Cera Admin-only.

### Historical uncertainty before resolution

Whether:

- Cera Admin and Cera Staff have identical production permissions
- some transitions are Admin-only
- a future technician/production role is required

### Why it matters

State transition authorization must be explicit.

### Historical decision needed

Map each production transition to the permitted role(s).

---

## Q-4D-005 — Are backward production transitions allowed?

Status: **RESOLVED**

### Decision

Backward transitions are allowed only for Cera Admin: `COMPLETED → IN_PRODUCTION` and `IN_PRODUCTION → SUBMITTED`; a reason is required.

### Example

If a case moves forward and an issue is found, can it move back to an earlier state?

### Why it matters

This affects:

- state-machine design
- history
- auditability
- UI controls
- error handling

### Historical decision needed

For each production state, define allowed next states.

Do not assume a simple linear workflow.

---

## Q-4D-006 — When should Lab Slip editing become locked?

Status: **RESOLVED**

### Decision

Doctor/Clinic manufacturing edits lock after Production leaves `SUBMITTED`; Cera Admin retains controlled edit access.

### Known

Lab Slips are currently editable after submission.

### Historical uncertainty before resolution

The exact point when manufacturing instructions should become immutable.

### Why it matters

Allowing edits after Cera begins fabrication could cause production mistakes.

### Recommended direction for discussion

Lock manufacturing-relevant fields when production officially starts.

### Historical decision needed

Confirm:

- exact lock point
- whether all fields lock
- whether Cera Staff/Admin get any controlled override
- whether notes can still be appended

No rule is approved yet.

---

## Q-4D-007 — Should production history be retained?

Status: **RESOLVED**

### Decision

Production history is retained with previous/new status, actor, timestamp, and note/reason.

### Historical uncertainty before resolution

Whether the system must record:

- previous production status
- new production status
- actor
- timestamp
- optional note/reason

### Why it matters

History may be needed for:

- accountability
- operational troubleshooting
- future corrections
- customer communication

### Historical decision needed

Confirm whether production transitions need append-only history.

---

## Q-4D-008 — What production status should Doctors see?

Status: **RESOLVED**

### Decision

Doctor sees simplified production labels: Submitted, In Progress, Completed.

### Historical uncertainty before resolution

Whether Doctors should see:

- every internal production state
- a simplified external status
- only broad phases such as received / in progress / completed

### Why it matters

Internal operational terminology may not be useful or appropriate for Doctors.

### Historical decision needed

Define Doctor-visible production information.

---

## Q-4D-009 — What production status should Clinic Staff see?

Status: **RESOLVED**

### Decision

Clinic Staff sees the same simplified external production labels as Doctor.

### Historical uncertainty before resolution

Whether Clinic Staff should see the same external status as Doctors.

### Why it matters

Clinic Staff permissions and UI may differ from Doctor access.

### Historical decision needed

Confirm Clinic Staff visibility.

---

## Q-4D-010 — What does “completed” mean?

Status: **RESOLVED**

### Decision

`COMPLETED` means lab production is complete in this workflow; it does not imply a delivery/logistics state.

### Historical uncertainty before resolution

Whether completion means:

- fabrication completed
- quality check completed
- ready for dispatch/pickup
- handed over/delivered

### Why it matters

The project currently does not include a defined delivery/logistics module.

### Historical decision needed

Define the exact business meaning of case completion.

---

## Q-4D-011 — Does the system need a production assignee?

Status: **RESOLVED**

### Decision

No production assignee is introduced in V1.

### Historical uncertainty before resolution

Whether a case is assigned to:

- an individual Cera Staff member
- a production technician
- a department/team
- nobody; status is enough

### Why it matters

This changes:

- database structure
- permissions
- workload views
- dashboard design

### Historical decision needed

Confirm whether production ownership/assignment exists in Cera's real workflow.

---

## Q-4D-012 — Should production be stored directly on LabSlip or as a separate entity?

Status: **RESOLVED**

### Decision

Production is stored as a separate entity linked to the Lab Slip.

### Option A

Production fields/history live on `LabSlip`.

### Option B

A separate production record links to `LabSlip`.

### Important

This decision must come **after** the real production lifecycle is understood.

### Why it matters

It affects:

- database design
- folder/module ownership
- API structure
- corrections later
- history
- future repeat production cycles

### Historical decision needed

Choose architecture only after Q-4D-001 through Q-4D-011 are resolved.

---

## Q-4D-013 — Can a completed production case be reopened?

Status: **RESOLVED**

### Decision

Cera Admin may move `COMPLETED → IN_PRODUCTION` with a required reason; this remains independent of Corrections.

### Historical uncertainty before resolution

Whether production may move out of completed state.

### Why it matters

This affects:

- terminal state rules
- historical integrity
- correction workflow
- accidental changes

### Historical decision needed

Confirm whether completion is terminal.

If post-completion issues must be handled only through Corrections, that should be stated explicitly.

---

## Q-4D-014 — Is a production note/reason required for status changes?

Status: **RESOLVED**

### Decision

Forward transition notes are optional; backward movement requires a reason.

### Historical uncertainty before resolution

Whether any transition needs an operational note.

### Why it matters

Requiring notes for every transition may create unnecessary work, but some exceptions may need explanation.

### Historical decision needed

Identify whether notes/reasons are required for:

- starting
- pausing
- moving backward
- completing
- exceptional transitions

---

# 5. Module 4E — Attachments

These questions were resolved during Module 4E. The original context is retained below for decision history.

---

## Q-4E-001 — Which records can have attachments?

Status: **RESOLVED**

### Decision

Private supporting attachments are implemented for Lab Slip workflows and reused for Correction evidence.

Possible targets must be confirmed, for example:

- Lab Slip
- correction
- other future records

Do not implement generic attachment ownership yet.

---

## Q-4E-002 — Who can upload attachments?

Status: **RESOLVED**

### Decision

Upload is limited to authenticated users authorized for the owning operational resource and allowed by its current workflow state.

Need role/resource rules.

---

## Q-4E-003 — Who can view attachments?

Status: **RESOLVED**

### Decision

Viewing follows authorization to the owning record; objects remain private and are accessed with signed temporary URLs.

Must follow least-privilege access.

---

## Q-4E-004 — Who can delete attachments, and until when?

Status: **RESOLVED**

### Decision

Deletion is authorization/state controlled; terminal Correction evidence is immutable.

Deletion/retention rules are not yet confirmed.

---

## Q-4E-005 — What is the maximum file size?

Status: **RESOLVED**

### Decision

JPEG/JPG, PNG, WEBP, and PDF; maximum 10 MB per file and 5 attachments per supported record. Large raw scan files remain excluded.

Planned file types:

- JPEG
- PNG
- WEBP
- PDF

Large raw intraoral scan files remain out of scope.

---

## Q-4E-006 — Which private object-storage provider will be used?

Status: **RESOLVED**

### Decision

Cloudflare R2 through the S3-compatible SDK, with signed temporary access.

Provider has not been selected.

---

# 6. Module 4F — Corrections / Issues

These questions were resolved during Module 4F. The original context is retained below for decision history.

---

## Q-4F-001 — Who can create a correction?

Status: **RESOLVED**

### Decision

Doctor, permitted Clinic Staff, Cera Staff, and Cera Admin may create a Correction for a Lab Slip whose Production is `COMPLETED`; Scanning Staff is excluded.

Need exact Doctor/Clinic/Cera rules.

---

## Q-4F-002 — What correction statuses should exist?

Status: **RESOLVED**

### Decision

`OPEN`, `UNDER_REVIEW`, `AWAITING_CLARIFICATION`, `RESOLVED`, `REJECTED`, with strict transitions.

Do not invent a support-ticket lifecycle.

---

## Q-4F-003 — Who reviews/accepts/rejects a correction?

Status: **RESOLVED**

### Decision

Cera Staff/Admin review, request clarification, resolve, or reject; Doctor/Clinic may respond to clarification.

Need explicit Cera role rules.

---

## Q-4F-004 — Can a correction require a rescan?

Status: **RESOLVED**

### Decision

Yes via `RESCAN_REQUIRED` resolution outcome; Module 4F does not automatically create a Scan Booking.

If yes, relationship to Scan Booking must be designed.

---

## Q-4F-005 — Does a correction create a new production cycle?

Status: **RESOLVED**

### Decision

No automatic production cycle is created. `REPRODUCTION_REQUIRED` is recorded as an outcome only.

This may affect whether production should be a separate entity.

---

## Q-4F-006 — Does a correction create a new Lab Slip?

Status: **RESOLVED**

### Decision

No. Correction links to the original Lab Slip/Production; the original completed case remains historically intact.

Current confirmed principle:

The original completed case must remain historically intact.

Exact implementation is unresolved.

---

### Additional locked Module 4F rules

- multiple historical Corrections per Lab Slip are allowed
- only one unresolved Correction per Lab Slip may exist at once
- description is required; affected Lab Slip item IDs and evidence are optional
- clarification request and response notes are required
- terminal Correction evidence is read-only
- resolution requires `HANDLED`, `RESCAN_REQUIRED`, or `REPRODUCTION_REQUIRED`

# 7. Module 5 — Notifications

---

## Q-5-001 — Which events create in-app notifications?

Status: **DEFERRED**

Potential events must be chosen based on real user action/attention needs.

---

## Q-5-002 — Which events create WhatsApp messages?

Status: **DEFERRED**

WhatsApp is the preferred external channel, but not every event should automatically generate a message.

---

## Q-5-003 — Who receives each notification?

Status: **DEFERRED**

Need recipient rules for:

- Doctor
- Clinic Staff
- Cera Staff
- Scanning Staff

---

## Q-5-004 — What happens if WhatsApp delivery fails?

Status: **DEFERRED**

Need retry/fallback/logging behavior.

---

## Q-5-005 — What message content is safe to send externally?

Status: **DEFERRED**

Patient/case privacy must be considered.

---

# 8. Module 6 — Dashboards / Operational Refinement

---

## Q-6-001 — Which Doctor dashboard cards are actually useful?

Status: **DEFERRED**

Do not invent vanity metrics.

---

## Q-6-002 — Which Cera operational queues should appear on the dashboard?

Status: **DEFERRED**

Must reflect real day-to-day Cera workflow.

---

## Q-6-003 — Does Scanning Staff need visit ordering/navigation support?

Status: **DEFERRED**

No maps/geolocation integration should be assumed.

---

# 9. Security Hardening

---

## Q-7-001 — Should Cera Admin use MFA?

Status: **DEFERRED**

MFA is planned for evaluation but not implemented.

---

## Q-7-002 — What CSRF protection mechanism should production use?

Status: **DEFERRED**

Decision depends on final deployment origins/cookie topology.

---

## Q-7-003 — Should disabling a user immediately revoke all refresh sessions?

Status: **DEFERRED**

Current refresh flow checks user active status.

Proactive revocation may be added during hardening.

---

## Q-7-004 — Should invitation-token hashing use a dedicated secret?

Status: **DEFERRED**

Future hardening decision.

---

# 10. Deployment Questions

---

## Q-9-001 — What production hosting provider/topology will be used?

Status: **DEFERRED**

Do not assume AWS, Oracle, or another provider.

---

## Q-9-002 — Where will production MongoDB run?

Status: **DEFERRED**

Options must be evaluated later based on deployment requirements.

---

## Q-9-003 — How will Redis be deployed in production?

Status: **DEFERRED**

No provider/topology is locked yet.

---

## Q-9-004 — What private object-storage provider will be used?

Status: **DEFERRED**

Needed before attachments deployment.

---

## Q-9-005 — What monitoring/error-tracking stack will be used?

Status: **DEFERRED**

No monitoring vendor/tool is currently locked.

---

# 11. Questions That Are Already Resolved

The following are **not** open questions and should not be reopened casually:

```text
✓ React + Vite + JavaScript frontend
✓ Node.js + Express + JavaScript ES modules backend
✓ MongoDB + Mongoose
✓ modular monolith
✓ REST /api/v1
✓ access JWT: 15 minutes
✓ opaque rotating refresh token: 10 days
✓ HttpOnly cookies
✓ Argon2id passwords
✓ invitation-based operational accounts
✓ phone required, email optional
✓ Indian mobile numbers only in V1
✓ Digital Lab Slip is the central record
✓ no online payments
✓ no direct scanner integration
✓ large raw scan files are outside normal website uploads
✓ product/category snapshots are preserved
✓ Scan Booking is separate from Lab Slip
✓ Scan Booking lifecycle through completion
✓ rescheduling is separate from main booking status
✓ old confirmed scan time stays active until replacement accepted
✓ assigned scanner remains assigned during rescheduling
✓ reschedule history is preserved
✓ Scanning Staff cannot manage rescheduling
✓ backend is authorization source of truth
✓ routes stay outside App.jsx
✓ Redux Toolkit is not used for every local state value
✓ one module per chat session where practical
✓ manual chatbot copy/paste workflow
✓ no-assumption policy
✓ commit and push before moving to next module
```

If one of these needs to change, treat it as a deliberate architecture/business change and update the relevant ADR.

---

# 12. Adding a New Open Question

Use this format:

```md
## Q-<MODULE>-<NUMBER> — Question

Status: **OPEN**

### Known

...

### Unknown

...

### Why it matters

...

### Recommended direction

... (optional)

### Decision needed

...
```

Do not record trivial coding choices here.

Open questions should represent decisions that materially affect:

- business behavior
- permissions
- workflow
- data design
- security
- architecture
- user experience

---

# 13. Resolving a Question

When resolved, update the item like this:

```text
Status: RESOLVED

Decision:
...

Resolved on:
YYYY-MM-DD

Recorded in:
REQUIREMENTS.md / ARCHITECTURE_DECISIONS.md / other relevant document
```

Then ensure implementation follows the confirmed decision.

---

# 14. Current Blocking Questions

Modules 4D, 4E, and 4F are resolved.

Current priority: **Module 5A — In-App Notifications**.

Before Module 5A coding begins, resolve at minimum:

```text
Q-5-001 Which events create in-app notifications?
Q-5-003 Who receives each notification?
Q-5-005 What notification content is safe/useful?
Read/unread behavior
Retention
Deep-link behavior
Deduplication
Which workflow events should not notify
```

WhatsApp-specific delivery, templates, retry/failure behavior, and provider details remain Module 5B unless explicitly pulled forward.
