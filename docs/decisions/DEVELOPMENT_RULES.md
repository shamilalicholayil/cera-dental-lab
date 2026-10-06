# Cera Dental Lab — Development Rules

## 1. Purpose of This Document

This document defines the mandatory development workflow for the Cera Dental Lab project.

Its purpose is to keep implementation consistent across separate chatbot sessions while the user manually copies code into VS Code.

These rules apply to every module unless an explicit project decision overrides them.

---

# 2. Development Mode

The project is being developed using a normal chatbot.

The user is **not** using a coding agent.

The user manually:

- runs terminal commands
- opens files
- copies code from chat
- pastes code into VS Code
- runs tests
- sends outputs back to the chatbot

Therefore, the chatbot must behave as a guided development partner, not as if it has autonomous repository access.

---

# 3. Core Rule — Never Pretend to Inspect the Repository

The chatbot must not claim that it:

- opened a file
- inspected the repository
- changed code
- created a file
- ran a command
- ran tests
- verified Git state

unless the user actually supplied the relevant content/output or explicitly asked for and received a generated downloadable file.

When current repository content matters, ask the user to show it.

---

# 4. One Module Per Chat Session

Use one focused chatbot session per major module whenever practical.

A session should have one clear target such as:

```text
Module 4D — Lab Production Workflow
```

Do not casually continue into unrelated future modules.

Benefits:

- smaller context
- fewer conflicting assumptions
- easier testing
- safer manual copy/paste
- cleaner handoff
- clearer Git history

---

# 5. New Session Startup Procedure

## Retrieval before questions

Before asking the user generic project, architecture, workflow, role, or setup questions, search:

```text
docs/project/PROJECT_KNOWLEDGE_BASE.md
```

Use the matching entry's source-document pointers for deeper context.

The chatbot must not ask the user to reconfirm information already marked `CONFIRMED`.

`DEFERRED` questions must remain deferred until their module.

`OPEN` questions should be asked only when they block the current module/checkpoint, and related questions should be grouped to minimize interruption.

The knowledge base is an index for retrieval. The authority order defined by the project remains unchanged.

Before implementing a module, the new chat should understand the project in this order:

```text
PROJECT UNDERSTANDING
↓
PLANNING UNDERSTANDING
↓
SYSTEM / DESIGN UNDERSTANDING
↓
MODULE UNDERSTANDING
↓
CURRENT IMPLEMENTATION STATE
↓
IMPLEMENTATION
```

At minimum review:

```text
docs/project/PROJECT_KNOWLEDGE_BASE.md
docs/progress/CHAT_CONTEXT.md
docs/progress/SESSION_HANDOFF.md
docs/progress/MODULE_STATUS.md
```

For deeper module work, refer to:

```text
docs/project/
docs/design/
docs/decisions/
```

as needed.

---

# 6. Before Coding a Module

Do not begin implementation immediately.

First establish:

1. Module purpose
2. Where it fits in the overall workflow
3. Dependencies
4. Actors
5. In-scope behavior
6. Out-of-scope behavior
7. Business rules
8. Permissions
9. State transitions if applicable
10. Data changes
11. UI expectations
12. Acceptance criteria
13. Open questions

If any important business rule is unresolved, stop and resolve it before coding.

---

# 7. No-Assumption Rule

The chatbot must not invent:

- business rules
- roles
- permissions
- statuses
- state transitions
- required fields
- optional fields
- automatic actions
- visibility rules
- integrations
- notification behavior
- production rules
- correction rules
- deletion rules
- security exceptions
- new architecture

Detailed behavior is defined in:

```text
docs/decisions/ASSUMPTION_POLICY.md
```

---

# 8. Small Implementation Decisions

The chatbot may make small implementation choices when they:

- do not alter business behavior
- follow existing code conventions
- do not introduce new architecture
- do not weaken security
- do not require new dependencies

Examples:

- local variable names
- helper function names
- ordering of private helper functions
- formatting
- reuse of an existing utility
- following the established test style

---

# 9. Ask for Existing Files Before Editing Them

Before changing an existing file, obtain the current file or relevant section from the user.

Do not reconstruct a current file from memory.

Typical workflow:

```text
Chatbot:
Please send:
apps/api/src/modules/scanBookings/scanBooking.service.js

User:
pastes current file

Chatbot:
reviews current implementation

Chatbot:
provides exact replacement/edit
```

This is mandatory when the file contains important existing logic.

---

# 10. Inspect Related Files, Not the Whole Repository

Ask only for files needed for the current checkpoint.

Do not ask the user to paste the entire repository.

For example:

```text
Checkpoint: Production model design

Request:
- Lab Slip model
- Lab Slip serializer
- relevant shared constants
```

Then continue after reviewing them.

This keeps the session manageable.

---

# 11. Exact File Paths Are Required

Whenever giving code, state the exact destination path.

Example:

```text
Replace:

apps/api/src/modules/labSlips/labSlip.service.js
```

or:

```text
Create:

apps/api/src/modules/production/production.model.js
```

Do not give floating code blocks without telling the user where they belong.

---

# 12. Full Replacement vs Targeted Edit

Use a **full-file replacement** when:

- several parts of the file must change
- imports/state/functions/JSX are interconnected
- manual patching would be risky
- a previous partial edit caused confusion
- ordering matters

Use a **targeted edit** when:

- one small section changes
- insertion point is obvious
- preserving the rest of the file is safer

Always state which method is being used.

---

# 13. Do Not Create New Structure Without Inspecting Existing Structure

Before creating:

- a folder
- an abstraction
- a service layer variant
- a repository layer
- a new package
- a new dependency
- a new naming convention

first inspect the existing repository pattern.

Follow:

```text
docs/design/FOLDER_STRUCTURE.md
```

Do not introduce architecture merely because it is common elsewhere.

---

# 14. Reuse Existing Module Patterns

When creating a new backend module, inspect a nearby completed module first.

Typical backend pattern:

```text
<module>.model.js
<module>.schemas.js
<module>.serializer.js
<module>.service.js
<module>.controller.js
<module>.routes.js
<module>.test.js
```

Use the existing project pattern unless there is a confirmed reason not to.

---

# 15. Backend + Frontend Together

Modules are vertical slices.

Do not complete all backend work for multiple modules and postpone frontend work.

Typical module order:

```text
business rules
↓
shared constants
↓
backend
↓
backend tests
↓
frontend API
↓
frontend UI
↓
frontend tests
↓
manual QA
↓
regression
```

---

# 16. Build in Small Checkpoints

Do not implement a large module in one massive response.

Recommended checkpoint style:

```text
Checkpoint 1
Business rules

Checkpoint 2
Shared constants

Checkpoint 3
Model/schema

Checkpoint 4
Service/business logic

Checkpoint 5
Controller/routes/serializer

Checkpoint 6
Backend tests

Checkpoint 7
Frontend API

Checkpoint 8
Frontend UI

Checkpoint 9
Frontend tests

Checkpoint 10
Manual QA

Checkpoint 11
Regression/lint/build

Checkpoint 12
Commit/push/handoff
```

Actual checkpoints may change depending on the module.

---

# 17. Test After Meaningful Changes

After each meaningful checkpoint, run the smallest relevant verification command.

Examples:

```text
backend unit/integration test
frontend component test
lint for affected workspace
build if structural/frontend changes require it
```

Do not accumulate many unverified changes before testing.

---

# 18. Fix Failures Before Continuing

If a test, lint, or build command fails:

```text
STOP
↓
understand failure
↓
fix failure
↓
rerun
↓
continue only after passing
```

Do not keep stacking new feature code on top of a known failing state.

---

# 19. Preserve Existing Working Behavior

When modifying a completed module:

- preserve existing normal flows
- preserve permissions
- preserve validation
- preserve error handling
- preserve tests
- preserve UI actions

unless the current module intentionally changes them.

Regression tests should confirm this.

---

# 20. Never Remove Tests Just to Make a Suite Pass

Do not delete or weaken an existing test merely because new code causes it to fail.

First determine:

- Did the new behavior intentionally change the rule?
- Is the old test outdated?
- Is the implementation wrong?

Only update a test when the business behavior itself was intentionally changed.

---

# 21. Backend Layer Rules

Use the established responsibilities:

```text
model
→ persistence

schemas
→ input validation

service
→ business rules/resource authorization/state transitions

controller
→ HTTP adaptation

routes
→ endpoint wiring/auth/coarse roles

serializer
→ public response shape

test
→ module behavior
```

Avoid moving business logic into controllers or frontend code.

---

# 22. Backend Is the Security Boundary

Every state-changing backend operation must validate:

- authentication
- role
- resource access
- current state
- input
- relevant business relationships

Frontend-hidden controls are not security.

---

# 23. Resource Authorization Is Mandatory

Role access is not enough.

Examples:

```text
Doctor
→ must own/be associated with the resource

Clinic Staff
→ must belong to the clinic

Scanning Staff
→ must be assigned to the booking
```

Test both allowed and denied resource access.

---

# 24. Validation Rules

Validate external input.

Use the project's established validation approach.

Do not:

- blindly spread `req.body`
- accept arbitrary fields
- silently accept immutable field changes

Use strict allowlists where appropriate.

---

# 25. State Transition Rules

Workflow transitions must be explicit.

Example:

```text
CONFIRMED
→ ASSIGNED
```

Do not allow arbitrary status updates such as:

```text
PATCH { status: "COMPLETED" }
```

unless the business design specifically calls for such behavior.

Use explicit actions/services when transitions have business meaning.

---

# 26. Historical Integrity Rule

Do not overwrite important historical meaning.

Existing examples:

- product/category snapshots
- terminal Scan Booking urgency
- reschedule history
- human references

New workflows should explicitly decide what history must be preserved.

---

# 27. Frontend Route Rule

Route definitions stay in the dedicated routes module.

Do not move routing into:

```text
App.jsx
```

---

# 28. Frontend State Rule

Use Redux Toolkit for suitable application-wide state.

Keep local state local.

Do not create Redux state for:

- every form field
- every modal
- every one-page response

unless there is a real shared-state need.

---

# 29. Frontend Permission Rule

The frontend should hide or disable invalid actions for UX.

But backend authorization must still enforce them.

When testing a role-based action, verify both:

```text
UI behavior
+
backend rejection
```

---

# 30. UI/UX Must Be Implemented During Each Module

Do not postpone all UI quality to the end.

Each module should handle where relevant:

- responsive design
- loading
- error
- empty state
- validation
- disabled state
- accessibility
- consistent action hierarchy
- mobile/desktop role priorities

---

# 31. Doctor UX Rule

Doctor workflow should remain:

- simple
- fast
- mobile-first
- familiar
- low-friction

Do not make a Doctor complete unnecessary operational/admin fields.

---

# 32. Scanning Staff UX Rule

Scanning Staff workflow should remain:

- mobile-first
- minimal
- assigned-work focused
- easy to complete on-site

Do not expose unrelated internal data.

---

# 33. Cera Operations UX Rule

Cera Staff/Admin screens may be denser.

Prioritize:

- status visibility
- fast operational actions
- filtering
- work queues
- clear exceptions

Do not turn every screen into a dashboard or spreadsheet.

---

# 34. New Dependency Rule

Before adding a new dependency, ask:

1. Does the current stack already solve this?
2. Is the dependency really needed?
3. Is it maintained?
4. Does it add security or maintenance cost?
5. Will it be used enough to justify adoption?

Discuss meaningful new dependencies before installation.

---

# 35. Environment Rule

Do not hard-code environment-specific values.

Use environment variables for:

- API URLs
- secrets
- database URLs
- external provider credentials

Remember:

```text
VITE_* variables are exposed to the browser
```

Never place backend secrets in frontend environment variables.

---

# 36. Logging Rule

Do not log:

- passwords
- raw access tokens
- raw refresh tokens
- invitation secrets
- patient notes
- attachment content
- unnecessary patient information

Use:

- request ID
- resource ID/reference
- action name
- safe error code

for debugging.

---

# 37. Error Handling Rule

Known business failures should return structured application errors.

Unexpected errors should:

- be logged safely
- return sanitized production responses

Do not expose:

- stack traces
- connection strings
- secrets
- file paths

to users.

---

# 38. Database Change Rule

Before changing an existing persisted model, consider:

- old documents
- defaults
- migrations/backfills
- serialization compatibility
- indexes
- test fixtures
- production data implications

Do not assume all stored documents will automatically have new fields.

---

# 39. Transaction Rule

Do not add transactions everywhere by default.

Use them when:

- multiple writes must succeed atomically
- partial state would create a meaningful business problem
- the current MongoDB deployment supports the required transaction behavior

If non-transactional behavior is accepted temporarily, document the risk.

---

# 40. Performance Rule

Optimize only where justified by real query/workflow needs.

Prefer:

- correct indexes
- bounded queries
- lean responses where appropriate
- avoiding duplicate fetches

before adding complex caching or distributed systems.

---

# 41. Security Review Is Continuous

Before a module is complete, review:

```text
Authentication
Roles
Resource access
Validation
State transitions
Sensitive data exposure
Logging
Rate limiting where relevant
Abuse/replay
History/immutability
```

A later hardening module is additional review, not an excuse to leave current modules insecure.

---

# 42. Automated Test Coverage Expectations

Each module should test where relevant:

- success flow
- unauthorized access
- wrong role
- wrong resource
- invalid input
- invalid state
- duplicate action
- edge case
- historical behavior

Do not test only the happy path.

---

# 43. Manual QA Expectations

Manual QA should cover real role flows.

Example:

```text
Doctor
✓ can perform own action
✗ cannot access unrelated resource

Clinic Staff
✓ own clinic
✗ unrelated clinic

Cera Staff
✓ operational action
✗ admin-only action

Scanning Staff
✓ assigned visit
✗ unrelated visit
```

Also check:

- loading state
- errors
- mobile layout
- stale/invalid state
- action visibility

---

# 44. Full Regression Gates

Before commit/push, run the project's relevant full gates.

Typical categories:

```text
frontend tests
backend tests
lint:web
lint:api
build:web
```

Use the actual scripts defined in the repository.

Do not invent script names if uncertain.

If needed, ask the user to show:

```bash
cat package.json
cat apps/web/package.json
cat apps/api/package.json
```

---

# 45. Git Review Before Commit

Before committing:

```bash
git status
```

Review all changed files.

If needed:

```bash
git diff --stat
git diff
```

Confirm:

- only intended files changed
- no accidental debug code
- no secrets
- no temporary files
- no unrelated changes

---

# 46. Commit Rule

Commit only after:

- module scope is complete
- tests pass
- lint passes
- build passes
- manual QA passes
- changed files reviewed

Use a clear module-sized commit message.

Example:

```text
feat: add scan booking rescheduling workflow
```

---

# 47. Push Rule

Push the completed module before beginning the next module.

After push, verify:

```bash
git status
```

Expected:

```text
working tree clean
```

If the working tree is not clean, resolve it before starting the next module.

---

# 48. Documentation Update Rule

At the end of every module, update:

```text
docs/progress/MODULE_STATUS.md
docs/progress/SESSION_HANDOFF.md
```

Also update when applicable:

```text
docs/decisions/ARCHITECTURE_DECISIONS.md
docs/decisions/OPEN_QUESTIONS.md
docs/progress/CHAT_CONTEXT.md
```

Permanent decisions must not remain only in chat history.

---

# 49. Session Handoff Rule

At the end of a session, `SESSION_HANDOFF.md` should record:

- module completed
- important business rules
- implementation summary
- changed areas
- tests run
- manual checks run
- known limitations
- Git status
- last commit
- next module
- open decisions

This file is intended to be replaced/updated as development progresses.

---

# 50. Chat Context Rule

`CHAT_CONTEXT.md` should remain compact enough to paste into a fresh chatbot session.

It should contain:

- project purpose
- main roles
- stack
- core architecture
- important locked decisions
- completed modules
- current module
- critical workflow rules
- manual development rules
- no-assumption rule

Do not turn it into a duplicate of every detailed document.

---

# 51. Open Questions Rule

Any unresolved business/design decision that could affect implementation belongs in:

```text
docs/decisions/OPEN_QUESTIONS.md
```

A question should include:

- ID
- module
- question
- why it matters
- status
- final decision once resolved

Do not leave important uncertainty only in chat messages.

---

# 52. Architecture Decision Rule

When a decision is likely to affect multiple future modules, record it in:

```text
ARCHITECTURE_DECISIONS.md
```

Examples:

- auth architecture
- no scanner integration
- snapshot strategy
- reschedule semantics
- module/session workflow

Do not create ADRs for trivial variable-level decisions.

---

# 53. Do Not Reopen Locked Decisions Without Cause

If an existing ADR already settles a topic:

```text
Do not redesign it merely because another pattern is possible.
```

A locked decision may be reconsidered only when:

- it causes a concrete problem
- requirements changed
- security issue is discovered
- implementation evidence shows it is unsuitable

If changed, document why.

---

# 54. No Scope Creep

While building a module, do not automatically add:

- future dashboard features
- notifications
- uploads
- reporting
- analytics
- payments
- delivery
- inventory
- unrelated refactors

unless they are part of approved scope.

Record future ideas instead of implementing them.

---

# 55. No Premature Production Features

Do not implement:

- monitoring stack
- queues
- background workers
- object storage
- notification provider
- deployment automation

inside an unrelated feature module unless that module truly depends on them.

Keep sequencing intentional.

---

# 56. Do Not Invent Official Cera Data

Do not invent:

- catalogue products
- clinic records
- official brand colors
- official logos
- shade lists
- pontic categories
- internal staff rules

If authoritative client data is missing, keep the area configurable or ask for the real data.

---

# 57. Avoid Large Irreversible Refactors During Feature Work

If a feature exposes a structural problem, prefer the smallest safe refactor.

Large architectural cleanup should be:

- justified
- scoped
- tested separately where practical

Do not combine broad refactoring with a new module unless necessary.

---

# 58. User Can Say “All Passed” / “All Clear”

If the user reports:

```text
all passed
```

or:

```text
all clear
```

for the requested verification step, treat that checkpoint as successful and continue.

Do not unnecessarily ask them to repeat all command outputs unless a specific result is required for diagnosis.

---

# 59. If the User Says a File Is Broken or Mixed Up

Prefer a complete replacement if:

- multiple partial edits were applied
- imports are inconsistent
- JSX/function order is uncertain
- the user requests the whole file

The goal is to reduce manual repair mistakes.

---

# 60. If There Is a Conflict Between Docs and Code

Do not assume which is correct.

Use:

```text
Known:
Current code does X.

Document:
Requirement/design says Y.

Impact:
...

Decision needed:
Should implementation be corrected to Y, or is the document outdated?
```

Resolve the conflict before building further behavior on top of it.

---

# 61. Definition of Done

A module is DONE only when relevant conditions are satisfied:

```text
✓ business rules approved
✓ implementation complete
✓ authorization implemented
✓ validation implemented
✓ normal flow tested
✓ failure cases tested
✓ edge cases tested
✓ frontend UX complete
✓ relevant automated tests pass
✓ regression tests pass
✓ lint passes
✓ build passes
✓ manual QA passes
✓ git diff/status reviewed
✓ committed
✓ pushed
✓ working tree clean
✓ module status updated
✓ session handoff updated
```

Do not mark a module complete merely because the happy path works.

---

# 62. Current Development Boundary

Completed through:

```text
Module 4C — Scan Rescheduling
```

Next planned module:

```text
Module 4D — Lab Production Workflow
```

Before Module 4D coding begins:

- production business lifecycle must be discussed
- permissions must be confirmed
- edit-lock behavior must be confirmed
- persistence approach must not be assumed
- acceptance criteria must be approved
