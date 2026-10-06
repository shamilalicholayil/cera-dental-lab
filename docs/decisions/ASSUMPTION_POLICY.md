# Cera Dental Lab — Assumption Policy

## 1. Purpose of This Document

This document defines how uncertainty must be handled during development of the Cera Dental Lab project.

Its purpose is to prevent a chatbot session from silently inventing:

- business rules
- permissions
- workflows
- statuses
- fields
- integrations
- architecture
- UI behavior
- security behavior
- data relationships

The project is developed through a normal chatbot with manual copy/paste into VS Code.

Because each new session may not know every earlier decision, this policy is mandatory.

---

# 2. Core Rule

> Do not assume missing business rules.

If a requirement, permission, workflow transition, field, UI behavior, security rule, integration, or architecture decision is not clearly established, the chatbot must identify the uncertainty and ask before implementing it.

Do not silently choose a business rule just because one option seems common or convenient.

---

# 3. Source-of-Truth Order

Before asking the user, check available project sources in this order:

```text
1. Current repository/code
2. Confirmed requirements
3. Project/module plan
4. Business flows
5. System/database/API/UI/security design
6. Architecture decisions
7. Open questions
8. Module status / session handoff
9. Chat context
10. Chat memory
```

If the current code and confirmed documentation conflict, do not silently choose one.

Identify the conflict.

---

# 4. Three Decision Categories

Every uncertain implementation decision should be classified as one of these:

## A. CONFIRMED

The behavior is explicitly defined by:

- current implementation
- requirements
- business flow
- architecture decision
- approved module design
- an explicit user decision

Implementation may proceed.

---

## B. IMPLEMENTATION DETAIL

A small technical choice that does not alter business behavior.

Examples:

- local variable name
- private helper name
- formatting
- internal function ordering
- use of an existing project utility
- following current module file conventions
- choosing between equivalent local implementation techniques

The chatbot may choose a reasonable option that matches existing project patterns.

---

## C. UNKNOWN BUSINESS / DESIGN DECISION

A choice that changes what the product does or what users are allowed to do.

Examples:

- who can perform an action
- when an action becomes available
- whether something is required
- whether a status exists
- whether a state may move backward
- whether a record can be edited after a point
- whether history must be preserved
- whether a user can see a field
- whether an action is automatic
- whether an integration exists
- whether a new entity is needed

The chatbot must not implement this without confirmation.

---

# 5. Mandatory Response Format for Unknown Decisions

When a business/design decision is unclear, use this structure:

```text
Known:
...

Unknown:
...

Why it matters:
...

Recommended option:
...

Alternative:
...

Decision needed:
...
```

The recommendation is optional when there is no meaningful basis for preferring one option.

The user makes the final business decision.

---

# 6. Business Rules That Must Never Be Invented

The chatbot must not invent:

- role responsibilities
- permissions
- who owns a case
- who may edit
- who may cancel
- who may approve
- who may reject
- who may assign staff
- who may complete work
- status names
- transition order
- terminal states
- reopening behavior
- deletion rules
- retention rules
- urgent-case guarantees
- turnaround commitments
- automatic escalation
- notification recipients
- correction behavior
- rescan behavior
- production behavior

---

# 7. Data Fields That Must Not Be Invented

Do not add fields merely because they are common in similar systems.

Examples that require confirmed need:

- patient date of birth
- patient phone
- patient email
- diagnosis
- medical history
- gender
- billing details
- address beyond what is operationally needed
- doctor license details
- delivery details
- invoice fields
- production technician fields
- estimated completion date
- payment status

A field must exist because a confirmed workflow needs it.

---

# 8. Required vs Optional Fields

Do not decide that a field is required simply because it is useful.

If the requirement does not specify required/optional behavior:

```text
STOP
↓
identify the field
↓
ask
```

This applies especially to:

- patient information
- design details
- notes
- attachments
- scan times
- correction reason
- production metadata

---

# 9. Role Permission Assumptions

Never infer permission from job title alone.

Examples:

Do not assume:

```text
Cera Staff == Cera Admin
```

Do not assume:

```text
Clinic Staff can access every Doctor in the system
```

Do not assume:

```text
Scanning Staff can reschedule a visit
```

Do not assume:

```text
Doctor can edit after production begins
```

Permissions must come from confirmed project rules.

---

# 10. State Machine Assumptions

Stateful workflows require explicit design.

Do not invent:

- status names
- status sequence
- branching transitions
- backward transitions
- terminal states
- automatic state changes

Before implementing a state machine, confirm:

```text
states
allowed transitions
actors per transition
validation rules
terminal states
history behavior
```

---

# 11. Automatic Behavior Assumptions

Do not silently add automation.

Examples:

- automatically start production after scan completion
- automatically assign a scanner
- automatically cancel old bookings
- automatically notify every role
- automatically close corrections
- automatically set urgent cases to next day
- automatically choose a clinic
- automatically choose a Doctor
- automatically create rescan bookings

Automation must be confirmed.

---

# 12. Notification Assumptions

Do not assume that every system event generates:

- WhatsApp message
- in-app notification
- email

For each notification, confirm:

```text
event
recipient
channel
message purpose
timing
retry/failure behavior
```

WhatsApp being the preferred channel does not mean every event should produce a WhatsApp message.

---

# 13. Integration Assumptions

Do not add integrations without explicit approval.

Examples:

- scanner SDK
- payment gateway
- accounting software
- inventory system
- courier system
- SMS provider
- email provider
- cloud storage provider
- analytics provider
- maps/geolocation
- calendar integration

The project intentionally excludes some of these.

---

# 14. Architecture Assumptions

Do not introduce architecture just because it is considered “best practice” elsewhere.

Do not automatically add:

- microservices
- repository pattern
- domain layer
- use-case layer
- CQRS
- event sourcing
- Kafka
- queues
- background workers
- GraphQL
- WebSockets
- generic event bus
- service mesh
- Kubernetes

Architecture must solve a real project problem.

---

# 15. Folder Structure Assumptions

Before creating a new folder:

1. inspect existing structure
2. check `FOLDER_STRUCTURE.md`
3. inspect a similar completed module
4. reuse current pattern if possible
5. ask before introducing a new structural convention

Do not assume a folder belongs simply because another project uses it.

---

# 16. Dependency Assumptions

Do not install a package simply because it makes one task easier.

Before proposing a dependency, determine:

```text
Does the project already have a solution?
Is the dependency necessary?
Is it maintained?
Does it alter architecture?
Does it introduce security/maintenance cost?
```

Meaningful new dependencies should be discussed first.

---

# 17. UI Assumptions

Do not invent screens, controls, fields, or navigation entries that imply unconfirmed behavior.

Examples:

Do not add:

- “Start Production” before production permissions are defined
- “Approve Correction” before correction workflow is designed
- “Payment Status” when payments are out of scope
- “Delivery Tracking” without delivery requirements
- “Technician Assignment” without a production-assignment requirement

UI must reflect confirmed business behavior.

---

# 18. UX Preference vs Business Rule

A UX improvement may be reasonable without being a business decision.

Example:

```text
Use a loading spinner while submitting
```

This is an implementation/UX detail.

But:

```text
Automatically submit after selecting a product
```

changes behavior and must be confirmed.

When uncertain, classify the decision first.

---

# 19. Security Assumptions

Never reduce security based on convenience.

Do not assume:

- frontend checks are sufficient
- a role should access a record
- public URLs are acceptable for attachments
- tokens can be stored in localStorage
- all Cera Staff can perform admin actions
- a new endpoint does not need authorization
- a new public endpoint does not need abuse protection

Security-sensitive uncertainty must be resolved explicitly.

---

# 20. Database Assumptions

Do not add:

- collections
- embedded documents
- indexes
- denormalized copies
- audit history
- automatic deletion
- TTL behavior

without a confirmed reason.

Small technical indexes supporting an already-confirmed query may be proposed, but their purpose should be clear.

New business entities require business justification.

---

# 21. Historical Data Assumptions

Do not assume whether old records may be changed.

For any workflow involving history, explicitly determine:

- what becomes immutable
- what remains editable
- what gets snapshotted
- what gets appended to history
- what may be deleted

Historical behavior is especially important for:

- Lab Slips
- scan bookings
- reschedules
- production
- corrections
- attachments

---

# 22. Deletion Assumptions

Do not add hard deletion to operational records without confirmation.

Ask:

```text
Should it be deleted?
Disabled?
Cancelled?
Archived?
Kept historically?
```

The project currently favors preserving operational history.

---

# 23. Time and Date Assumptions

Do not guess business-time behavior.

Examples requiring confirmation:

- timezone
- working hours
- weekends
- holidays
- urgent-case deadline
- same-day booking cutoff
- scan scheduling window
- automatic expiration time

Store technical date/times consistently, but business scheduling rules must be confirmed.

---

# 24. Turnaround-Time Assumptions

Known business context includes approximately:

- normal: around 2 days
- urgent: around 1 day

These are operational observations, not automatically enforceable software guarantees.

Do not implement:

- deadlines
- SLA timers
- countdowns
- automatic late flags

unless explicitly approved.

---

# 25. Catalogue Assumptions

Do not invent official Cera catalogue data.

Do not invent:

- product names
- categories
- pricing
- shade options
- pontic choices
- production times
- product-specific fields

Use authoritative client catalogue data when available.

If data is missing, ask or leave the functionality configurable.

---

# 26. Brand Assumptions

Do not claim design tokens are official Cera brand values unless confirmed.

Do not invent:

- official logo
- official icon
- official typography
- official color palette
- slogans

Use client-provided brand assets when available.

---

# 27. Current Code Assumptions

Do not assume a file still looks like a previous version from chat memory.

Before modifying an important existing file:

```text
ask user for current file
↓
review actual content
↓
modify
```

This is especially important when previous sessions may have changed the file.

---

# 28. Test Assumptions

Do not assume a test passed because the code looks correct.

The user must run the command.

The chatbot may proceed when the user reports:

```text
all passed
```

or:

```text
all clear
```

for the requested checkpoint.

---

# 29. Git Assumptions

Do not assume:

- working tree is clean
- commit succeeded
- push succeeded
- branch is current

Ask the user to run commands when Git state matters.

Examples:

```bash
git status
git log -1 --oneline
```

---

# 30. Safe Assumptions

The chatbot may generally make low-risk implementation choices if all of these are true:

```text
✓ does not change business behavior
✓ matches existing code conventions
✓ does not weaken security
✓ does not change public API behavior unexpectedly
✓ does not introduce a dependency
✓ does not create a new architecture pattern
✓ is easy to change later
```

Examples:

- local helper variable name
- using `const` for immutable local binding
- function ordering
- extracting repeated display formatting into an existing helper pattern
- following existing Tailwind utility conventions

---

# 31. Unsafe Assumptions

Treat a choice as unsafe if it affects:

```text
WHO
can do something

WHAT
data exists

WHEN
an action is allowed

HOW
a workflow moves

WHAT
history is retained

WHAT
another role can see

WHETHER
an integration exists

WHETHER
an action happens automatically

WHETHER
a record is editable/deletable

HOW
security is enforced
```

Unsafe assumptions require confirmation.

---

# 32. Assumption Escalation Procedure

When uncertainty is discovered during implementation:

```text
STOP current change
↓
check docs
↓
check current related code
↓
check ADRs/open questions
↓
classify uncertainty
↓
ask user
↓
record decision if important
↓
continue
```

Do not work around the uncertainty with temporary guessed behavior unless the user explicitly approves a temporary rule.

---

# 33. Recording New Decisions

If the user resolves an important question:

### If it affects permanent architecture/business behavior

Update:

```text
ARCHITECTURE_DECISIONS.md
```

### If it affects module requirements

Update:

```text
REQUIREMENTS.md
MODULE_PLAN.md
BUSINESS_FLOWS.md
```

as appropriate.

### If it is still unresolved

Keep it in:

```text
OPEN_QUESTIONS.md
```

Important decisions must not remain only in chat history.

---

# 34. Open Question Lifecycle

Use:

```text
OPEN
↓
discussion
↓
RESOLVED
↓
decision documented
```

An open question should not disappear simply because implementation moved forward.

Either resolve it or deliberately defer the affected feature.

---

# 35. Conflict Handling

If two sources disagree, respond like this:

```text
Conflict found:

Current code:
...

Documentation:
...

Why this matters:
...

Options:
1. Treat code as outdated and align it with documentation.
2. Treat documentation as outdated and update the docs.

Decision needed:
Which is authoritative here?
```

Do not silently reconcile contradictions.

---

# 36. Example — Production Workflow

Incorrect:

```text
Let's use:
SUBMITTED → IN_PRODUCTION → QUALITY_CHECK → COMPLETED
```

Why incorrect:

Those production statuses have not been approved.

Correct:

```text
Known:
Production begins after Cera has sufficient case information.

Unknown:
The exact production states and who can transition them.

Why it matters:
This affects database design, permissions, Lab Slip editing, API routes,
UI, history, and completion behavior.

Decision needed:
Define the production lifecycle before implementation.
```

---

# 37. Example — Lab Slip Edit Lock

Incorrect:

```text
We'll lock editing when status becomes IN_PRODUCTION.
```

Correct:

```text
Known:
Lab Slips are currently editable after submission.

Unknown:
The exact point at which production should make them non-editable.

Why it matters:
Doctors and Clinic Staff may otherwise change manufacturing instructions
after Cera has already started work.

Recommended option:
Lock manufacturing-relevant fields when production officially starts.

Decision needed:
Confirm the lock point and whether Cera Staff have any override.
```

---

# 38. Example — Scanner Permission

Incorrect:

```text
Scanning Staff should probably be able to request a reschedule.
```

Correct:

```text
Confirmed:
Scanning Staff cannot manage reschedules.

Implementation:
Show read-only reschedule information only.
```

No new decision is needed because this rule is already established.

---

# 39. Example — New Dependency

Incorrect:

```text
Install BullMQ so production updates can run in jobs.
```

Correct:

```text
There is currently no confirmed need for background job processing in this module.
Use the existing synchronous module architecture unless an actual asynchronous
requirement appears.
```

---

# 40. Example — Product Field

Incorrect:

```text
Add materialType because dental products usually need it.
```

Correct:

```text
The current requirements do not confirm a materialType field.

Do not add it until Cera's actual catalogue/prescription requirements establish
that it is needed.
```

---

# 41. Example — Notification

Incorrect:

```text
Send WhatsApp automatically when production completes.
```

Correct:

```text
Known:
WhatsApp is the preferred external notification channel.

Unknown:
Whether production completion should trigger a WhatsApp message, and who receives it.

Decision needed:
Define the event and recipients in the notification module.
```

---

# 42. Example — Attachment Deletion

Incorrect:

```text
Allow the uploader to delete attachments anytime.
```

Correct:

```text
Unknown:
Whether attachments remain deletable after submission/production.

Why it matters:
Deletion may remove evidence or manufacturing instructions.

Decision needed:
Define deletion and retention rules before implementing attachments.
```

---

# 43. Example — Cera Staff vs Admin

Incorrect:

```text
Cera Staff and Admin can both edit all settings.
```

Correct:

```text
Confirmed:
Cera Staff have broad operational access.
Cera Admin has administrative access.

Unknown:
A new administrative action is not automatically available to Cera Staff.

Decision needed:
Confirm role access for the specific action.
```

---

# 44. Example — Production Entity

Incorrect:

```text
Create a Production model.
```

Correct:

```text
Known:
Module 4D requires a production workflow.

Unknown:
Whether production is represented directly on LabSlip or as a separate entity.

Why it matters:
This determines persistence, API ownership, history, and future correction design.

Decision needed:
Resolve production business requirements first, then choose the data model.
```

---

# 45. Manual Development Implication

Because the user manually copy/pastes code, assumptions are especially risky.

A guessed decision can cause the user to modify:

- schema
- service
- controller
- routes
- frontend
- tests

before discovering the business rule was wrong.

Therefore:

> Resolve uncertainty before code whenever possible.

---

# 46. Session Startup Reminder

At the start of a new module session, the chatbot should explicitly state:

```text
I will not assume missing business rules.
If something important is not defined in the project context or current code,
I will identify it as an open question before implementation.
```

Then proceed with module analysis.

---

# 47. Session-End Review

Before closing a module session, ask:

```text
Did we make any new permanent business/design decisions?
```

If yes:

- record them
- remove/resolve related open questions
- update chat context if future sessions need them

This prevents decisions from being trapped in one chat.

---

# 48. Current High-Priority Open Assumption Area

The next planned module is:

```text
Module 4D — Lab Production Workflow
```

The following must remain **unknown until explicitly decided**:

- production statuses
- readiness condition
- who starts production
- who changes production states
- whether backward transitions are allowed
- whether a production assignee exists
- Lab Slip edit-lock point
- Doctor visibility
- Clinic Staff visibility
- production history
- completion semantics
- relationship between scan completion and production readiness
- whether production lives on LabSlip or in a separate model

No chatbot session should implement these by guessing.
