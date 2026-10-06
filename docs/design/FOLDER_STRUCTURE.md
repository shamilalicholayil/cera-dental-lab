# Cera Dental Lab — Folder Structure

## 1. Purpose of This Document

This document defines the repository layout, folder responsibilities, file-placement rules, and structural conventions for the Cera Dental Lab project.

Its purpose is to keep code organization consistent across multiple chatbot sessions.

The chatbot must inspect the existing repository before suggesting new folders, layers, abstractions, or dependencies.

If the current repository differs from this document, the current repository must be checked before making structural changes.

---

# 2. Repository Root

The project is an npm-workspaces monorepo.

Current high-level structure:

```text
cera-dental-lab/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   └── shared/
│
├── docs/
│   ├── project/
│   ├── design/
│   ├── decisions/
│   └── progress/
│
├── package.json
└── ...
```

Main responsibilities:

```text
apps/web
→ React frontend

apps/api
→ Express backend

packages/shared
→ constants/contracts shared by frontend and backend

docs
→ project knowledge, design, decisions, and progress
```

---

# 3. Root-Level Rules

Do not add new top-level folders without a concrete reason.

Before adding a new root-level folder:

1. inspect the current repository
2. check whether an existing area already fits the requirement
3. explain why the new location is needed
4. confirm the structural change before implementation

Do not introduce top-level folders such as:

```text
services/
domain/
core/
infrastructure/
repositories/
packages/common/
shared-utils/
```

unless there is a confirmed project need.

---

# 4. Frontend Root

Frontend application:

```text
apps/web/
```

The frontend uses:

- React
- Vite
- JavaScript

Source code lives under:

```text
apps/web/src/
```

Expected conceptual structure:

```text
apps/web/src/
├── api/
├── components/
├── constants/
├── features/
├── lib/
├── pages/
├── routes/
└── ...
```

The chatbot must inspect the real directory before creating additional folders.

---

# 5. Frontend `api/`

Path:

```text
apps/web/src/api/
```

Purpose:

Store frontend functions that call backend API endpoints.

Examples:

```text
auth.js
clinics.js
labSlips.js
scanBookings.js
```

Responsibilities:

- construct endpoint paths
- choose HTTP method
- build query parameters
- send request bodies
- call the shared API client

Business logic should not be duplicated here.

Example:

```js
export function getScanBooking(bookingId) {
  return apiRequest(`/scan-bookings/${bookingId}`);
}
```

Do not put page rendering or authorization logic in API files.

---

# 6. Frontend `components/`

Path:

```text
apps/web/src/components/
```

Purpose:

Reusable UI components.

Existing/project-style grouping may include:

```text
components/
├── portal/
├── labSlips/
├── scanBookings/
└── ...
```

Use business-specific subfolders when components belong clearly to a module.

Examples:

```text
components/labSlips/ToothSelector.jsx
components/scanBookings/ScanRequestPanel.jsx
components/portal/PortalHeader.jsx
```

Do not create a new component folder merely for one tiny component unless it improves consistency.

---

# 7. Frontend `pages/`

Path:

```text
apps/web/src/pages/
```

Purpose:

Route-level screens.

Examples:

```text
NewLabSlipPage.jsx
LabSlipsPage.jsx
LabSlipDetailPage.jsx
EditLabSlipPage.jsx
ScanBookingsPage.jsx
ScanBookingDetailPage.jsx
```

A page may:

- load route-level data
- coordinate page state
- render reusable components
- invoke frontend API functions
- show role/status-aware controls

A page must not be treated as the security boundary.

Backend authorization remains mandatory.

---

# 8. Frontend `routes/`

Path:

```text
apps/web/src/routes/
```

Purpose:

Dedicated application route definitions.

Important project rule:

> Route definitions must remain outside `App.jsx`.

Do not move route declarations into `App.jsx`.

Route-level concerns may include:

- protected routes
- role guards
- nested portal routes
- route-to-page mapping

---

# 9. Frontend `features/`

Path:

```text
apps/web/src/features/
```

Purpose:

Application-wide feature state, especially Redux Toolkit state.

Current important use:

```text
features/auth/
```

Redux Toolkit should be used for state that is truly application-wide.

Do not move every form or server response into Redux.

---

# 10. Frontend Local State Rule

Use component-local state for:

- form input
- temporary selections
- modals
- page-specific toggles
- transient UI state
- action-busy flags
- local validation feedback

Example:

```js
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

Do not create Redux slices for local-only UI state without a clear cross-application need.

---

# 11. Frontend `lib/`

Path:

```text
apps/web/src/lib/
```

Purpose:

Shared frontend infrastructure.

Example:

```text
apiClient.js
```

This area may contain generic client-side utilities used across modules.

Business-specific API functions should remain under `src/api/`.

---

# 12. Frontend `constants/`

Path:

```text
apps/web/src/constants/
```

Purpose:

Frontend-only display/configuration constants.

Examples:

- status labels
- UI labels
- display mappings

Business enums shared with the backend should not be duplicated here.

Shared business constants belong in:

```text
packages/shared/
```

---

# 13. Frontend Test Placement

Frontend tests should generally live next to the page/component they test.

Examples:

```text
pages/ScanBookingDetailPage.test.jsx
components/scanBookings/ScanRequestPanel.test.jsx
```

Use the existing test style before introducing a new testing directory.

Do not create a separate global test hierarchy unless there is a demonstrated need.

---

# 14. Backend Root

Backend application:

```text
apps/api/
```

Source:

```text
apps/api/src/
```

Conceptual structure:

```text
apps/api/src/
├── middleware/
├── modules/
├── utils/
└── ...
```

The backend is organized primarily by business module.

---

# 15. Backend `modules/`

Path:

```text
apps/api/src/modules/
```

Purpose:

Business modules.

Current/known examples include:

```text
auth/
users/
clinics/
catalog/
labSlips/
scanBookings/
```

Future modules should follow the same business-oriented approach.

Do not create a separate cross-project architecture layer without a real need.

---

# 16. Standard Backend Module Pattern

Typical module shape:

```text
modules/<module>/
├── <module>.model.js
├── <module>.schemas.js
├── <module>.serializer.js
├── <module>.service.js
├── <module>.controller.js
├── <module>.routes.js
└── <module>.test.js
```

Some modules may also contain supporting files such as:

```text
<module>Counter.model.js
<module>Reference.js
<supporting>.service.js
```

Example from Scan Bookings:

```text
scanBookings/
├── scanBooking.controller.js
├── scanBooking.model.js
├── scanBooking.routes.js
├── scanBooking.schemas.js
├── scanBooking.serializer.js
├── scanBooking.service.js
├── scanBooking.test.js
├── scanBookingCounter.model.js
├── scanBookingReference.js
└── scanningStaff.service.js
```

A new module should follow nearby patterns unless there is a concrete reason not to.

---

# 17. Backend `.model.js`

Purpose:

Persistence/schema definition.

Responsibilities:

- Mongoose schema
- field types
- defaults
- enum restrictions
- references
- indexes
- timestamps
- embedded subdocuments where appropriate

Do not place full HTTP workflows in models.

---

# 18. Backend `.schemas.js`

Purpose:

Input validation.

Current validation approach:

- Zod

Responsibilities:

- request body validation
- query validation
- enum validation
- string limits
- date format checks
- rejecting unknown fields where needed

Validation schemas do not replace business checks in services.

---

# 19. Backend `.service.js`

Purpose:

Main business logic.

Responsibilities may include:

- resource authorization
- state transition checks
- relationship validation
- business invariants
- create/update operations
- orchestration between models
- historical integrity
- application errors

Examples:

```text
createLabSlip
updateLabSlip
createScanBooking
requestScanReschedule
assignScanBooking
```

Important:

The service layer is usually the correct place for business rules.

---

# 20. Backend `.controller.js`

Purpose:

HTTP request/response adaptation.

Responsibilities:

- obtain `req.user`
- obtain params/body/query
- call service
- serialize returned data
- send HTTP status/response
- forward errors

Controllers should remain thin.

Do not duplicate business rules in controllers when the service already owns them.

---

# 21. Backend `.routes.js`

Purpose:

Endpoint wiring.

Responsibilities:

- route path
- HTTP method
- authentication middleware
- coarse role authorization
- validation middleware
- controller mapping

Example structure:

```text
authenticate
↓
authorizeRoles(...)
↓
validateBody(...)
↓
controller
```

Resource-level checks still belong in business services.

---

# 22. Backend `.serializer.js`

Purpose:

Control API response shape.

Responsibilities:

- expose approved fields
- normalize relationships
- hide internal persistence details
- reduce accidental data leakage

Do not send entire Mongoose documents directly when a serializer exists.

---

# 23. Backend `.test.js`

Purpose:

Test the module's behavior.

Coverage should include where applicable:

- normal flow
- role authorization
- resource authorization
- validation
- invalid transitions
- failure cases
- edge cases
- historical integrity

Tests should remain close to the module they cover.

---

# 24. Backend `middleware/`

Path:

```text
apps/api/src/middleware/
```

Purpose:

Generic request-pipeline behavior.

Examples:

- authentication
- role authorization
- request body validation
- query validation
- request IDs
- error handling

Business-specific logic should not be hidden inside generic middleware.

---

# 25. Backend `utils/`

Path:

```text
apps/api/src/utils/
```

Purpose:

Generic reusable backend utilities.

Example:

```text
AppError.js
```

A helper should only go here if it is truly generic.

Module-specific helpers should usually remain inside their module.

---

# 26. Shared Package

Path:

```text
packages/shared/
```

Source:

```text
packages/shared/src/
```

Purpose:

Business constants/contracts that must be identical between frontend and backend.

Current examples:

- user roles
- user statuses
- clinic types/status
- catalogue status
- Lab Slip source
- Lab Slip status
- urgency
- tooth values
- Scan Booking status
- Scan Reschedule status

Typical exports are aggregated through:

```text
packages/shared/src/index.js
```

---

# 27. Shared Package Rule

Put a value in `packages/shared` when both frontend and backend need the same business definition.

Example:

```js
SCAN_BOOKING_STATUS
```

Do not duplicate this separately in:

```text
apps/web
apps/api
```

Frontend-only display labels can stay in frontend constants.

Backend-only persistence helpers should stay in the backend module.

---

# 28. Documentation Structure

Documentation lives under:

```text
docs/
```

Structure:

```text
docs/
├── project/
│   ├── PROJECT_OVERVIEW.md
│   ├── REQUIREMENTS.md
│   ├── PROJECT_PLAN.md
│   ├── MODULE_PLAN.md
│   ├── BUSINESS_FLOWS.md
│   └── PROJECT_KNOWLEDGE_BASE.md
│
├── design/
│   ├── SYSTEM_DESIGN.md
│   ├── FOLDER_STRUCTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DESIGN.md
│   ├── UI_UX_DESIGN.md
│   └── SECURITY_DESIGN.md
│
├── decisions/
│   ├── ARCHITECTURE_DECISIONS.md
│   ├── DEVELOPMENT_RULES.md
│   ├── ASSUMPTION_POLICY.md
│   └── OPEN_QUESTIONS.md
│
└── progress/
    ├── MODULE_STATUS.md
    ├── SESSION_HANDOFF.md
    └── CHAT_CONTEXT.md
```

---

# 29. `docs/project/`

Purpose:

Project/business knowledge.

Contains:

- project purpose
- requirements
- development plan
- module plan
- business workflows
- retrieval-oriented project Q&A knowledge base

These documents answer:

> What are we building?

and:

> How is the project organized?

`PROJECT_KNOWLEDGE_BASE.md` is optimized for semantic retrieval in new chatbot sessions. It contains atomic Q&A chunks, search keywords, status labels, and pointers to the detailed authoritative documents.

It must not become a substitute for the detailed requirements/design/decision files.


---

# 30. `docs/design/`

Purpose:

Technical/design knowledge.

Contains:

- system architecture
- repository/folder structure
- database design
- API conventions
- UI/UX design
- security design

These documents answer:

> How is the system designed?

---

# 31. `docs/decisions/`

Purpose:

Control project decisions and prevent drift.

Contains:

### `ARCHITECTURE_DECISIONS.md`

Permanent/important decisions and their reasons.

### `DEVELOPMENT_RULES.md`

How development sessions must operate.

### `ASSUMPTION_POLICY.md`

What the chatbot may and may not infer.

### `OPEN_QUESTIONS.md`

Unresolved business/design decisions.

---

# 32. `docs/progress/`

Purpose:

Track current development state.

Contains:

### `MODULE_STATUS.md`

Which modules are complete/planned/next.

### `SESSION_HANDOFF.md`

What the previous module session completed and what the next session needs.

### `CHAT_CONTEXT.md`

Compact project summary that can be pasted into a new chatbot conversation.

---

# 33. Manual Chatbot Workflow Rule

The user is not using a coding agent.

Therefore the chatbot cannot assume it can inspect the repository directly.

Before changing an existing file:

1. ask the user for the current file or relevant section
2. review what the user pasted
3. provide the exact replacement or insertion
4. give the exact file path
5. let the user manually paste it
6. ask the user to run the relevant command
7. review the result before continuing

Do not claim that code was edited automatically.

---

# 34. Full Replacement vs Targeted Edit

Because code is manually copied into VS Code:

Use a **full-file replacement** when:

- many scattered changes are needed
- import/state/JSX order is easy to break
- multiple regions depend on each other
- copy/paste risk is high

Use a **targeted edit** when:

- one small block changes
- insertion location is unambiguous
- preserving the rest of the file is safer

The chatbot should explicitly state which method is being used.

---

# 35. Before Creating a New Folder

Mandatory process:

```text
Need new code
↓
Inspect existing structure
↓
Does an existing folder already fit?
├── Yes → use it
└── No
    ↓
Explain why new folder is necessary
    ↓
Confirm structural decision
    ↓
Create folder
```

Do not create folders preemptively.

---

# 36. Before Creating a New Abstraction

Do not introduce abstractions such as:

- repository pattern
- domain layer
- use-case layer
- command bus
- event bus
- generic service framework
- custom form framework
- global state wrapper
- queue layer

unless the current project has a concrete need.

The project favors simple, explicit module structure.

---

# 37. Before Adding a Dependency

Mandatory questions:

- Does the current stack already solve this?
- Is this dependency necessary?
- Is it maintained?
- Does it materially simplify the module?
- Does it add runtime/security/maintenance cost?
- Is there an existing project convention instead?

Discuss new significant dependencies before adding them.

---

# 38. Naming Rule

Follow existing domain terminology.

Use:

- `LabSlip`
- `ScanBooking`
- `ClinicMembership`
- `Product`
- `Category`
- `Correction` when that entity is designed

Do not rename established concepts to generic alternatives like:

- Order
- Job
- WorkItem
- Ticket

unless a distinct new domain entity is intentionally approved.

---

# 39. Module Placement Rule

When adding a capability, ask:

> Which business module owns this behavior?

Examples:

Scan rescheduling:

```text
apps/api/src/modules/scanBookings/
```

Lab Slip editing:

```text
apps/api/src/modules/labSlips/
```

Shared status enum:

```text
packages/shared/src/
```

Frontend Scan Booking request helper:

```text
apps/web/src/api/scanBookings.js
```

Avoid dumping unrelated code into generic utility folders.

---

# 40. Cross-Module Imports

Cross-module backend imports may be used where necessary, but should remain intentional.

Example:

Scan Booking needs Lab Slip authorization/data.

Lab Slip urgency synchronization may update active Scan Bookings.

Avoid circular dependencies where possible.

If a new cross-module dependency appears complex, review the design before implementing it.

---

# 41. Production Module Placement

Module 4D must not create a folder structure until its design is approved.

Possible choices might include:

```text
labSlips/
```

if production lifecycle is part of the Lab Slip,

or:

```text
production/
```

if production becomes a distinct business entity/module.

This is currently an open design decision.

Do not assume either structure before Module 4D analysis.

---

# 42. Correction Module Placement

The future correction workflow should likely be a distinct domain concept, but its exact structure is not yet approved.

Do not create:

```text
corrections/
```

until the correction business model is confirmed.

---

# 43. Attachments Placement

The future attachment implementation must first establish ownership.

Possible attachment targets may include:

- Lab Slip
- correction
- other approved records

Do not create a global attachment architecture until:

- ownership
- permissions
- file types
- access rules
- storage strategy

are confirmed.

---

# 44. Public Website vs Portal

The frontend may contain both:

- public website screens
- authenticated operational portal screens

Keep the distinction clear in routing and page organization.

Do not expose operational components/routes publicly without authorization.

---

# 45. File Movement Rule

Do not move existing files simply to achieve theoretical architecture cleanliness.

A file move should have a concrete benefit such as:

- reducing duplication
- clarifying ownership
- fixing an actual structural problem

If moving files changes import paths across modules, review the impact before doing it.

---

# 46. Structural Refactoring Rule

Refactoring is continuous, but structural refactoring must remain controlled.

Before a structural refactor:

1. identify the problem
2. identify affected files
3. preserve existing behavior
4. run existing tests
5. make the refactor
6. rerun tests
7. keep feature changes separate where practical

Avoid combining large architecture restructuring with an unrelated feature module.

---

# 47. Source of Truth for Structure

Use this priority:

1. actual repository structure
2. this folder-structure document
3. system design
4. architecture decisions
5. module plan
6. chat context/memory

If this document is outdated compared with the repository, update the documentation after confirming the repository structure is intentional.

---

# 48. New Session Structural Checklist

Before implementation in a fresh chatbot session:

```text
1. Read CHAT_CONTEXT.md
2. Read SESSION_HANDOFF.md
3. Identify current module
4. Review FOLDER_STRUCTURE.md
5. Ask user for relevant existing files
6. Inspect nearby module conventions
7. Reuse existing structure
8. Ask before introducing new structure
```

This rule is mandatory for consistency across sessions.
