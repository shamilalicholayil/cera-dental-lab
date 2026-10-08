# Cera Dental Lab — Project Plan

## 1. Purpose of This Document

This document defines how the Cera Dental Lab project is planned, organized, developed, verified, and progressed from one phase to the next.

It is intended to keep development consistent across multiple chatbot sessions and prevent the project from drifting as new modules are added.

This document explains **how the project is being built**.

Module-specific scope and sequencing are documented separately in:

`docs/project/MODULE_PLAN.md`

---

## 2. Project Objective

Build a production-ready public website and operational portal for Cera Dental Lab that digitizes the workflow between:

- Doctors
- Clinics / Hospitals
- Cera Admin
- Cera Staff
- Scanning Staff

The platform should reduce manual dependence on:

- phone calls
- paper lab slips
- fragmented WhatsApp communication
- manually coordinated scan visits

while preserving the information required for accurate dental-lab production.

The central operational record is the **Digital Lab Slip**.

---

## 3. Core Product Principle

The project must continuously follow this principle:

> Minimum doctor effort, without reducing the quality of information Cera receives.

This principle should influence:

- form design
- workflow design
- screen complexity
- required fields
- defaults
- navigation
- role permissions
- operational automation

The system should not become unnecessarily ERP-like or force doctors through avoidable administrative steps.

---

## 4. Overall Project Lifecycle

The project follows this lifecycle:

1. Idea
2. Requirement Analysis
3. Project Planning
4. User Roles
5. User / Business Flows
6. System Design
7. Database Design
8. API Design
9. Module Documentation
10. Security Design
11. UI/UX Design
12. Technical Setup
13. Development
14. Testing
15. Deployment
16. Documentation
17. Monitoring

The project has already completed the planning/design/setup foundation and is currently in active module-by-module development.

---

## 5. Current Project Phase

Current phase:

**Development — in progress**

Development is performed as vertical business modules rather than by completing all backend work first and all frontend work later.

Testing, security, UI/UX, cleanup, and documentation are treated as continuous activities throughout development.

---

## 6. Development Strategy

The project uses a **vertical-slice module strategy**.

Each module should include the relevant parts of:

- business rules
- shared constants/contracts
- database/model changes
- backend services
- backend authorization
- request validation
- API endpoints
- serialization
- frontend API integration
- frontend pages/components
- loading/error/empty states
- responsive behavior
- accessibility
- automated backend tests
- automated frontend tests
- manual QA
- regression checks
- security review
- cleanup/refactoring
- logging/error handling
- lint/build verification

The goal is that every completed module is usable and verified end-to-end.

---

## 7. One Module Per Chat Session

Development is intentionally split across multiple chatbot sessions.

Each major module should normally have its own conversation/session.

The purpose is to:

- keep context manageable
- reduce accidental scope creep
- make testing easier
- improve code review quality
- make failures easier to isolate
- keep Git history meaningful

A session should not casually continue into the next module after completing the current one.

The current module should first be:

- verified
- committed
- pushed
- documented
- handed off

before a new module session begins.

---

## 8. Chatbot-Only Development Workflow

The user is not using a coding agent.

The workflow is manual:

1. The chatbot asks for relevant existing files or command output.
2. The user runs commands manually.
3. The user pastes file contents/output into the chat.
4. The chatbot reviews the actual current code.
5. The chatbot provides code or exact edits.
6. The user manually copies the code into VS Code.
7. The user runs tests/lint/build commands.
8. The user sends results back.
9. Failures are fixed before continuing.

The chatbot must not claim that files were inspected, created, edited, or tested unless the user supplied the relevant content or executed the command.

---

## 9. Module Session Lifecycle

Each module session should follow this sequence.

### Phase 1 — Project Understanding

Review:

- project overview
- requirements
- project plan
- module plan
- business flows

Goal:

Understand what the project is and where the module fits.

---

### Phase 2 — Technical Understanding

Review:

- system design
- folder structure
- database design
- API design
- UI/UX design
- security design
- architecture decisions

Goal:

Understand how the system is structured and how the new module must integrate with existing architecture.

---

### Phase 3 — Development Constraints

Review:

- development rules
- assumption policy
- open questions

Goal:

Avoid unsupported decisions and architectural drift.

---

### Phase 4 — Current State

Review:

- module status
- previous session handoff
- current Git state
- relevant existing files

Goal:

Understand exactly what has already been completed and what is currently in the repository.

---

### Phase 5 — Module Analysis

Before coding:

- define the module purpose
- identify dependencies
- identify actors
- define business flow
- define scope
- define out-of-scope behavior
- identify unresolved business questions
- define acceptance criteria

No implementation should begin while important business behavior is unresolved.

---

### Phase 6 — Implementation

Implementation should proceed in small checkpoints.

Recommended order:

1. shared constants/contracts
2. model/database changes
3. validation schemas
4. services/business rules
5. controller/routes/serializer
6. backend tests
7. frontend API integration
8. frontend UI
9. frontend tests

The exact order may vary if the existing module structure requires it.

---

### Phase 7 — Verification

Before the module is considered complete:

- module backend tests pass
- module frontend tests pass
- relevant regression tests pass
- lint passes
- build passes
- manual QA passes
- authorization is reviewed
- edge cases are checked
- errors/failure states are checked

---

### Phase 8 — Source Control

Before starting another module:

1. review `git status`
2. review changed files
3. verify there are no accidental changes
4. commit the completed module
5. push to GitHub
6. confirm working tree is clean

---

### Phase 9 — Documentation/Handoff

Update:

- `MODULE_STATUS.md`
- `SESSION_HANDOFF.md`
- `ARCHITECTURE_DECISIONS.md` if permanent decisions changed
- `OPEN_QUESTIONS.md` if new unresolved questions exist
- `CHAT_CONTEXT.md` if future sessions need new important context

Then close the session.

---

## 10. Module Completion Criteria

A module is only considered complete when all relevant criteria are satisfied.

### Business

- agreed scope implemented
- business rules confirmed
- no unresolved critical assumptions hidden in code

### Backend

- validation implemented
- authorization implemented
- state transitions enforced
- errors handled consistently
- API shape follows project conventions

### Frontend

- workflow is usable
- role-specific controls are correct
- loading/error/empty states handled
- responsive behavior considered
- accessibility basics included

### Testing

- normal flow tested
- permissions tested
- validation tested
- failure cases tested
- edge cases tested
- regression checks pass

### Quality

- lint passes
- build passes
- no obvious duplicated logic introduced
- naming follows existing conventions
- no unnecessary new dependency added

### Source Control

- changes reviewed
- committed
- pushed
- working tree clean

### Documentation

- module status updated
- handoff updated
- new permanent decisions recorded

---

## 11. Acceptance Criteria Before Coding

Every module should define acceptance criteria before implementation.

Example format:

```text
Module X acceptance criteria

Doctor
✓ can ...
✗ cannot ...

Clinic Staff
✓ can ...
✗ cannot ...

Cera Staff
✓ can ...
✗ cannot ...

Scanning Staff
✓ can ...
✗ cannot ...

System
✓ validates ...
✓ rejects invalid transition ...
✓ preserves history ...
✓ enforces resource authorization ...
```

Acceptance criteria should be based only on confirmed requirements.

If a criterion depends on an unresolved business decision, resolve that decision first.

---

## 12. Scope Control

Each module should have:

- In Scope
- Out of Scope
- Dependencies
- Future Work

This prevents unfinished future features from leaking into the current module.

Example:

```text
Module 4D — Lab Production Workflow

In Scope:
- production lifecycle
- authorized production transitions
- doctor-visible production status
- Lab Slip edit lock

Out of Scope:
- corrections
- attachments
- WhatsApp notifications
- billing
```

Actual 4D scope must be confirmed before implementation.

---

## 13. No-Assumption Planning Rule

Planning must not silently invent:

- roles
- permissions
- statuses
- state transitions
- required fields
- automatic behavior
- deletion behavior
- visibility rules
- integrations
- notification events
- security exceptions
- production behavior

When information is missing:

1. identify what is known
2. identify what is unknown
3. explain why the decision matters
4. provide a recommended option if useful
5. ask for confirmation

The detailed protocol is maintained in:

`docs/decisions/ASSUMPTION_POLICY.md`

---

## 14. Repository-First Implementation Rule

The existing repository is the technical source of truth.

Before modifying an existing area:

- inspect the current file
- inspect nearby module patterns
- follow existing naming
- follow existing folder conventions
- preserve existing functionality unless intentionally changing it

Do not reconstruct an existing file from memory when the current file has not been shown.

Do not introduce new architectural layers merely because they are common in other projects.

---

## 15. Folder Structure Control

Before creating:

- a new folder
- a new abstraction
- a new architectural layer
- a new package
- a new dependency

first verify whether the existing structure already supports the requirement.

Follow:

`docs/design/FOLDER_STRUCTURE.md`

Structural changes should be discussed before implementation.

---

## 16. Backend Development Principles

Backend rules include:

- backend is the authorization source of truth
- resource authorization must be explicit
- validation must occur at API boundaries
- business transitions belong in services
- serializers control response shapes
- routes handle authentication/coarse role access
- controllers adapt HTTP requests/responses
- models define persistence
- patient/sensitive information must not be unnecessarily logged

Existing conventions should be followed unless an agreed architecture decision changes them.

---

## 17. Frontend Development Principles

Frontend rules include:

- React + Vite + JavaScript
- route definitions remain in the dedicated routes module
- API request functions live under frontend API modules
- Redux Toolkit is used for appropriate app-wide state
- local UI/form state remains local
- UI permission hiding improves UX but does not replace backend authorization
- each module should include responsive/loading/error/empty/accessibility considerations
- do not redesign established patterns without a reason

---

## 18. Database Development Principles

Database changes should:

- preserve historical business meaning
- avoid unnecessary duplication
- use references where relationships need live identity
- use snapshots where historical data must remain stable
- support authorization queries
- support operational listing/filtering
- avoid introducing schema fields without confirmed business purpose

Migration/backfill needs must be considered whenever existing persisted records are affected.

---

## 19. API Development Principles

API design should remain consistent with the existing REST conventions.

Base path:

`/api/v1`

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "requestId": "optional"
  }
}
```

API endpoints should reflect business resources and transitions rather than frontend screen layout.

---

## 20. Security Is Continuous

Security must not be left until the final project phase.

Every module should review:

- authentication requirements
- role authorization
- resource authorization
- input validation
- sensitive data exposure
- state transition abuse
- file access if applicable
- rate limits if applicable
- logging safety
- error-message leakage

A later security-hardening module may improve cross-cutting controls, but individual modules must already be safe by design.

---

## 21. UI/UX Is Continuous

UI/UX is implemented with each vertical slice.

Do not build backend-complete modules with temporary unusable frontend screens and plan to “fix UX later.”

Each module should consider:

- mobile/desktop role needs
- hierarchy
- action priority
- loading state
- error state
- empty state
- validation feedback
- responsive layout
- accessibility
- consistency with existing design tokens

---

## 22. Testing Strategy

Testing occurs at multiple levels.

### Module Tests

Test the newly implemented business capability.

### Regression Tests

Ensure previous modules continue to work.

### Authorization Tests

Verify users cannot access unrelated or forbidden resources.

### Validation Tests

Verify invalid input fails correctly.

### Transition Tests

Verify invalid workflow/state transitions are rejected.

### Manual QA

Verify real user flow and UX behavior in the browser.

The user runs tests manually and reports results back to the chatbot.

---

## 23. Git Strategy

Current development strategy:

- work directly on the existing project branch/workflow
- complete one module
- run all gates
- commit
- push
- start the next module only after a clean working tree

Commit messages should describe the completed business capability.

Example:

`feat: add scan booking rescheduling workflow`

If team size or deployment workflow later requires feature branches/PRs, that change should be an explicit project decision.

---

## 24. Documentation Strategy

Documentation is split into four groups.

### Project Knowledge

`docs/project/`

Explains:
- what is being built
- requirements
- planning
- modules
- business flows
- retrieval-oriented canonical Q&A for repeated chatbot questions

### Retrieval Layer

`docs/project/PROJECT_KNOWLEDGE_BASE.md`

Purpose:

- provide atomic question-and-answer chunks for ChatGPT Project retrieval
- prevent repeated questions whose answers are already confirmed
- route each answer back to the detailed authoritative source document
- distinguish `CONFIRMED`, `REPOSITORY-DERIVED`, `OPEN`, and `DEFERRED` information

The retrieval layer does not change the source-of-truth priority.

### Design Knowledge

`docs/design/`

Explains:
- technical architecture
- folder placement
- database design
- API conventions
- UI/UX design
- security design

### Decision Control

`docs/decisions/`

Explains:
- permanent architecture decisions
- development rules
- assumption policy
- unresolved questions

### Progress Control

`docs/progress/`

Explains:
- completed/planned modules
- previous session handoff
- compact chat context

---

## 25. Source-of-Truth Priority

When information conflicts, use this priority:

1. current repository/code
2. explicitly confirmed requirements
3. current design documents
4. architecture decisions
5. module status/session handoff
6. Git history
7. chat context/memory

If there is a real conflict between code and confirmed requirements/design, do not silently choose one.

Identify the conflict and resolve it before implementing dependent behavior.

---

## 26. Planned Remaining Development Direction

Current completed work reaches through:

- Module 4F — Corrections / Issues

The next planned area is:

- Module 6A — Doctor Dashboard Refinement

Current execution sequence:

```text
6A Doctor Dashboard Refinement
→ 6B Cera Operations Dashboard
→ 6C Scanning Staff Mobile Refinement
→ 7 Security & Cross-Module Hardening
→ 8 End-to-End Regression Testing
→ 9 Production Deployment
→ 5A In-App Notifications
→ 5B WhatsApp Notifications
→ 10 Final Documentation & Monitoring
```

Modules 5A and 5B are intentionally deferred until after the initial production deployment. Notification-specific regression/security checks must run when those modules are implemented because the main Module 8 regression pass occurs before them.

Exact module scope and sequencing are maintained in:

`docs/project/MODULE_PLAN.md`

---

## 27. Project Completion

The project is not considered production-complete merely because all feature modules exist.

Final readiness must include:

- full regression testing
- security hardening
- production environment configuration
- deployment
- operational documentation
- backup/recovery considerations
- monitoring/logging
- error visibility
- environment/secrets review
- production QA

Deployment, documentation, and monitoring remain explicit project phases rather than afterthoughts.
