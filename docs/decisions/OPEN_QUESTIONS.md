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
Module 4D — Lab Production Workflow
```

The questions in Section 4 must be resolved before implementation begins.

---

# 4. Module 4D — Lab Production Workflow

All Module 4D blocking questions are resolved.

## Q-4D-001 — What production statuses should exist?

Status: **RESOLVED**

Decision:

```text
SUBMITTED
IN_PRODUCTION
COMPLETED
```

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-002 — What makes a case ready for production?

Status: **RESOLVED**

Decision:

- non-scan case: may start after submission
- scan-required case: related Scan Booking must be `COMPLETED`
- scan completion does not auto-start production
- no readiness override in V1

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-003 — Who can start production?

Status: **RESOLVED**

Decision:

```text
Cera Admin
Cera Staff
```

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-004 — Who can update production status?

Status: **RESOLVED**

Decision:

Forward transitions:

```text
Cera Admin
Cera Staff
```

Backward transitions:

```text
Cera Admin only
```

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-005 — Are backward production transitions allowed?

Status: **RESOLVED**

Decision:

```text
COMPLETED → IN_PRODUCTION
IN_PRODUCTION → SUBMITTED
```

Admin only. Reason required.

Direct `COMPLETED → SUBMITTED` is not allowed.

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-006 — When should Lab Slip editing become locked?

Status: **RESOLVED**

Decision:

Normal editing locks at `IN_PRODUCTION` and remains locked at `COMPLETED`.

Cera Admin may override with a mandatory audited reason.

Cera Staff, Doctor, and Clinic Staff cannot override.

Resolved on: 2026-10-07

Recorded in: ADR-032 and ADR-050

---

## Q-4D-007 — Should production history be retained?

Status: **RESOLVED**

Decision:

Yes. Append-only transition history stores previous status, new status, actor, timestamp, and optional note/reason.

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-008 — What production status should Doctors see?

Status: **RESOLVED**

Decision:

```text
SUBMITTED      → Submitted
IN_PRODUCTION  → In Progress
COMPLETED      → Completed
```

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-009 — What production status should Clinic Staff see?

Status: **RESOLVED**

Decision:

Clinic Staff use the same simplified Production wording as Doctors.

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-010 — What does “completed” mean?

Status: **RESOLVED**

Decision:

`COMPLETED` means fabrication and final internal check are complete.

It does not mean delivery, dispatch, or handover.

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-011 — Does the system need a production assignee?

Status: **RESOLVED**

Decision:

No Production assignee in V1.

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-012 — Should production be stored directly on LabSlip or as a separate entity?

Status: **RESOLVED**

Decision:

Production is a separate entity with a one-to-one relationship to Lab Slip.

Every new Lab Slip creates exactly one Production record.

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-013 — Can a completed production case be reopened?

Status: **RESOLVED**

Decision:

Yes, but only Cera Admin may move:

```text
COMPLETED → IN_PRODUCTION
```

with a mandatory reason.

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

---

## Q-4D-014 — Is a production note/reason required for status changes?

Status: **RESOLVED**

Decision:

Forward transition note:

```text
optional
```

Backward transition reason:

```text
required
```

Admin Lab Slip production-lock override reason:

```text
required
```

Resolved on: 2026-10-07

Recorded in: `ARCHITECTURE_DECISIONS.md` ADR-050

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

Module 4D has no remaining blocking questions.

The next module is Module 4E — Private Attachments.

Its deferred questions should be resolved only when Module 4E design begins.
