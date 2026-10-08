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

Current implementation is complete through Module 7.

The next module is:

```text
Module 8 — End-to-End Regression Testing
```

There are no known Module 8 business-design questions that should block regression testing. Do not reopen already implemented workflow decisions merely because older planning sections remain in this document.

Security questions Q-7-002 through Q-7-004 were resolved during Module 7. Q-7-001 (Admin MFA) remains intentionally deferred.

# 4. Module 4D — Lab Production Workflow

## Q-4D-001 — What production statuses should exist?

Status: **OPEN**

### Known

The Lab Slip currently stops at:

```text
SUBMITTED
```

Cera must eventually manufacture the case and mark it completed.

### Unknown

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

### Decision needed

Define the minimum real-world statuses Cera actually uses.

Do not create statuses just because they are common in other lab systems.

---

## Q-4D-002 — What makes a case ready for production?

Status: **OPEN**

### Known

Some cases require Cera scanning and some do not.

### Unknown

What conditions must be true before production can begin.

Questions include:

- Can a non-scan case begin production immediately after submission?
- For a scan-required case, must the Scan Booking be `COMPLETED` first?
- Can Cera manually override readiness?
- Is any additional approval/check required?

### Why it matters

This determines when the production-start action becomes valid.

### Decision needed

Define production readiness separately for:

- scan-required cases
- non-scan cases

---

## Q-4D-003 — Who can start production?

Status: **OPEN**

### Possible actors to decide between

- Cera Admin
- Cera Staff
- another future production-specific role

### Why it matters

This is a backend authorization rule and affects operational UI.

### Decision needed

Confirm exactly which roles may start production.

---

## Q-4D-004 — Who can update production status?

Status: **OPEN**

### Unknown

Whether:

- Cera Admin and Cera Staff have identical production permissions
- some transitions are Admin-only
- a future technician/production role is required

### Why it matters

State transition authorization must be explicit.

### Decision needed

Map each production transition to the permitted role(s).

---

## Q-4D-005 — Are backward production transitions allowed?

Status: **OPEN**

### Example

If a case moves forward and an issue is found, can it move back to an earlier state?

### Why it matters

This affects:

- state-machine design
- history
- auditability
- UI controls
- error handling

### Decision needed

For each production state, define allowed next states.

Do not assume a simple linear workflow.

---

## Q-4D-006 — When should Lab Slip editing become locked?

Status: **OPEN**

### Known

Lab Slips are currently editable after submission.

### Unknown

The exact point when manufacturing instructions should become immutable.

### Why it matters

Allowing edits after Cera begins fabrication could cause production mistakes.

### Recommended direction for discussion

Lock manufacturing-relevant fields when production officially starts.

### Decision needed

Confirm:

- exact lock point
- whether all fields lock
- whether Cera Staff/Admin get any controlled override
- whether notes can still be appended

No rule is approved yet.

---

## Q-4D-007 — Should production history be retained?

Status: **OPEN**

### Unknown

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

### Decision needed

Confirm whether production transitions need append-only history.

---

## Q-4D-008 — What production status should Doctors see?

Status: **OPEN**

### Unknown

Whether Doctors should see:

- every internal production state
- a simplified external status
- only broad phases such as received / in progress / completed

### Why it matters

Internal operational terminology may not be useful or appropriate for Doctors.

### Decision needed

Define Doctor-visible production information.

---

## Q-4D-009 — What production status should Clinic Staff see?

Status: **OPEN**

### Unknown

Whether Clinic Staff should see the same external status as Doctors.

### Why it matters

Clinic Staff permissions and UI may differ from Doctor access.

### Decision needed

Confirm Clinic Staff visibility.

---

## Q-4D-010 — What does “completed” mean?

Status: **OPEN**

### Unknown

Whether completion means:

- fabrication completed
- quality check completed
- ready for dispatch/pickup
- handed over/delivered

### Why it matters

The project currently does not include a defined delivery/logistics module.

### Decision needed

Define the exact business meaning of case completion.

---

## Q-4D-011 — Does the system need a production assignee?

Status: **OPEN**

### Unknown

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

### Decision needed

Confirm whether production ownership/assignment exists in Cera's real workflow.

---

## Q-4D-012 — Should production be stored directly on LabSlip or as a separate entity?

Status: **OPEN**

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

### Decision needed

Choose architecture only after Q-4D-001 through Q-4D-011 are resolved.

---

## Q-4D-013 — Can a completed production case be reopened?

Status: **OPEN**

### Unknown

Whether production may move out of completed state.

### Why it matters

This affects:

- terminal state rules
- historical integrity
- correction workflow
- accidental changes

### Decision needed

Confirm whether completion is terminal.

If post-completion issues must be handled only through Corrections, that should be stated explicitly.

---

## Q-4D-014 — Is a production note/reason required for status changes?

Status: **OPEN**

### Unknown

Whether any transition needs an operational note.

### Why it matters

Requiring notes for every transition may create unnecessary work, but some exceptions may need explanation.

### Decision needed

Identify whether notes/reasons are required for:

- starting
- pausing
- moving backward
- completing
- exceptional transitions

---

# 5. Module 4E — Attachments

These questions are intentionally deferred until the attachment module.

---

## Q-4E-001 — Which records can have attachments?

Status: **DEFERRED**

Possible targets must be confirmed, for example:

- Lab Slip
- correction
- other future records

Do not implement generic attachment ownership yet.

---

## Q-4E-002 — Who can upload attachments?

Status: **DEFERRED**

Need role/resource rules.

---

## Q-4E-003 — Who can view attachments?

Status: **DEFERRED**

Must follow least-privilege access.

---

## Q-4E-004 — Who can delete attachments, and until when?

Status: **DEFERRED**

Deletion/retention rules are not yet confirmed.

---

## Q-4E-005 — What is the maximum file size?

Status: **DEFERRED**

Planned file types:

- JPEG
- PNG
- WEBP
- PDF

Large raw intraoral scan files remain out of scope.

---

## Q-4E-006 — Which private object-storage provider will be used?

Status: **DEFERRED**

Provider has not been selected.

---

# 6. Module 4F — Corrections / Issues

These questions are deferred until the correction module.

---

## Q-4F-001 — Who can create a correction?

Status: **DEFERRED**

Need exact Doctor/Clinic/Cera rules.

---

## Q-4F-002 — What correction statuses should exist?

Status: **DEFERRED**

Do not invent a support-ticket lifecycle.

---

## Q-4F-003 — Who reviews/accepts/rejects a correction?

Status: **DEFERRED**

Need explicit Cera role rules.

---

## Q-4F-004 — Can a correction require a rescan?

Status: **DEFERRED**

If yes, relationship to Scan Booking must be designed.

---

## Q-4F-005 — Does a correction create a new production cycle?

Status: **DEFERRED**

This may affect whether production should be a separate entity.

---

## Q-4F-006 — Does a correction create a new Lab Slip?

Status: **DEFERRED**

Current confirmed principle:

The original completed case must remain historically intact.

Exact implementation is unresolved.

---

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

Decision:

Admin MFA is not required for the current V1 hardening checkpoint. Re-evaluate when deployment/risk requirements justify it.

This deferral does not block Module 7 completion.

---

## Q-7-002 — What CSRF protection mechanism should production use?

Status: **RESOLVED**

Decision:

For V1, the authenticated operational browser client is the Cera React frontend only. Unsafe browser methods require an `Origin` whose normalized origin exactly matches configured `CLIENT_URL`.

Future provider/webhook routes must use provider-specific signature/authentication and explicit bypass only where appropriate.

Resolved on: 2026-10-09

Recorded in: `SECURITY_DESIGN.md`, `ARCHITECTURE_DECISIONS.md`

---

## Q-7-003 — Should disabling a user immediately revoke all refresh sessions?

Status: **RESOLVED**

Decision:

Yes. Disabling an operational user increments `authVersion` and revokes refresh-session records so existing access behavior is invalidated and refresh cannot restore the session.

Resolved on: 2026-10-09

Recorded in: `SECURITY_DESIGN.md`, `ARCHITECTURE_DECISIONS.md`

---

## Q-7-004 — Should invitation-token hashing use a dedicated secret?

Status: **RESOLVED**

Decision:

Yes. Invitation hashing uses `INVITATION_TOKEN_SECRET`, which must be distinct from `REFRESH_TOKEN_SECRET`.

A temporary legacy verification fallback may remain only for the migration window. Remove it after at least the maximum legacy invitation lifetime (168 hours / 7 days) has elapsed after rollout.

Resolved on: 2026-10-09

Recorded in: `SECURITY_DESIGN.md`, `ARCHITECTURE_DECISIONS.md`

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
✓ CSRF strategy for V1 browser client resolved
✓ disabled-user proactive session invalidation implemented
✓ dedicated invitation-token secret implemented
✓ Module 7 dependency/secrets/logging/private-upload hardening completed
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

There are currently no known business/design questions that block Module 8 regression testing.

Still deferred for later modules:

```text
Q-7-001  Admin MFA evaluation
Q-9-001  Production hosting/topology
Q-9-002  Production MongoDB placement
Q-9-003  Production Redis topology
Q-9-004  Production object-storage topology
Q-9-005  Monitoring/error-tracking stack
```

Module 8 should test existing confirmed behavior rather than reopen earlier resolved implementation decisions.
