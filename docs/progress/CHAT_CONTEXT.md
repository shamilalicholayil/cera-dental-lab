# Cera Dental Lab — Chat Context

## 1. Purpose

This file is the compact context pack for starting a fresh chatbot session.

Paste this into a new chat before beginning a new module.

It is intentionally shorter than the full project documentation.

For detailed information, refer to:

```text
docs/project/
docs/design/
docs/decisions/
docs/progress/
```

---

# 1A. Retrieval-First / RAG Rule

Before asking the user a project/setup/business question, first retrieve the answer from:

```text
docs/project/PROJECT_KNOWLEDGE_BASE.md
```

Then follow the source-document pointers in the matching knowledge-base entry when more detail is needed.

Mandatory behavior:

```text
Question
↓
PROJECT_KNOWLEDGE_BASE.md
↓
matching detailed project/design/decision document
↓
SESSION_HANDOFF.md for latest module changes
↓
OPEN_QUESTIONS.md
↓
current repository/code for implementation-specific truth
↓
ask user only if still unknown and blocking
```

Do not ask the user a question marked `CONFIRMED` in the knowledge base.

Do not ask a `DEFERRED` question before its module unless current scope changes.

Ask an `OPEN` question only when it blocks the current module/checkpoint.

The knowledge base is a retrieval index, not a higher authority than the current repository or detailed confirmed documentation.

---


# 2. Development Mode

The user is **not using a coding agent**.

Development is done through a normal chatbot.

The user manually:

- runs terminal commands
- opens files
- copies code from chat
- pastes code into VS Code
- runs tests/lint/build
- sends outputs back

Therefore:

- do not claim to inspect files that have not been shown
- ask for relevant current files before modifying them
- give exact file paths
- clearly say whether a change is a targeted edit or full-file replacement
- work in small checkpoints
- wait for test results before continuing
- do not assume Git state

---

# 3. Project

Cera Dental Lab is a public website and operational portal for digitizing the workflow between:

- Doctors
- Clinic / Hospital Staff
- Cera Admin
- Cera Staff
- Scanning Staff

The central operational record is the:

```text
Digital Lab Slip
```

Core product principle:

> Minimum doctor effort, without reducing the quality of information Cera receives.

The Doctor-facing workflow should remain simple, familiar, fast, and mobile-friendly rather than becoming a large ERP-style process.

---

# 4. Main Business Flow

Current intended flow:

```text
Doctor / Clinic Staff
↓
Digital Lab Slip
↓
Optional Scan Booking
↓
Cera review / scheduling
↓
Scanning Staff assignment
↓
Scan completion
↓
Lab Production
↓
Case completion
↓
Correction / Issue if required
```

Cera Staff can also digitize cases received through offline channels such as:

- phone
- WhatsApp
- paper

---

# 5. Current Manual Cera Flow

Known business context:

1. Doctor contacts Cera with product/case details.
2. If scanning is required, Doctor requests a scan.
3. Cera staff travel to the clinic/hospital with an intraoral scanner.
4. Patient is scanned.
5. Scan details are sent to Cera separately.
6. Cera fabricates the case.
7. Normal turnaround is approximately 2 days.
8. Urgent work may be approximately 1 day.
9. Finished products may later require corrections.

Do not convert these approximate turnaround observations into software guarantees, SLAs, deadlines, or automatic timers unless explicitly approved.

---

# 6. Roles

## Visitor

Public website only.

## Doctor

Creates/manages permitted Lab Slips and scan requests.

A Doctor may belong to multiple clinics.

## Clinic / Hospital Staff

Works within assigned clinic scope and permitted Doctor relationships.

## Cera Admin

Administrative access plus broad operational access.

## Cera Staff

Broad operational access, but not automatically equivalent to Admin for every action.

## Scanning Staff

Assigned scan visits only, with minimal required visit information.

---

# 7. Tech Stack

## Frontend

```text
React
Vite
JavaScript
Redux Toolkit for appropriate application-wide state
```

Local form/UI state should remain local where practical.

## Backend

```text
Node.js
Express
JavaScript ES modules
```

Architecture:

```text
Modular monolith
REST API under /api/v1
```

## Database

```text
MongoDB
Mongoose
```

Current local development MongoDB:

```text
mongodb://127.0.0.1:27017/cera_dev
```

## Shared

```text
packages/shared
```

Used for business constants/enums needed by both frontend and backend.

---

# 8. Repository

High-level structure:

```text
cera-dental-lab/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   └── shared/
│
└── docs/
    ├── project/
    ├── design/
    ├── decisions/
    └── progress/
```

Do not create new top-level folders or architecture layers without inspecting the existing repository and confirming the need.

---

# 9. Backend Module Convention

Typical backend module pattern:

```text
apps/api/src/modules/<module>/
├── <module>.model.js
├── <module>.schemas.js
├── <module>.serializer.js
├── <module>.service.js
├── <module>.controller.js
├── <module>.routes.js
└── <module>.test.js
```

Responsibilities:

```text
model
→ persistence

schemas
→ input validation

service
→ business rules, resource authorization, state transitions

controller
→ HTTP request/response adaptation

routes
→ endpoint wiring, authentication, coarse role checks

serializer
→ public API response shape

test
→ module behavior/regression
```

Follow nearby existing modules before introducing a different structure.

---

# 10. Frontend Conventions

Important rules:

- routes stay in the dedicated routes module
- do not move route definitions into `App.jsx`
- frontend API functions live under `apps/web/src/api/`
- Redux Toolkit is for suitable app-wide state
- local forms/modals/transient state stay local
- frontend role/status checks are UX only
- backend is the real security boundary
- UI/UX is implemented continuously with each module

---

# 11. Authentication

Current authentication architecture:

```text
Access JWT
→ 15 minutes

Opaque rotating refresh token
→ 10 days

Transport
→ HttpOnly cookies

Password hashing
→ Argon2id
```

Current Argon2id settings include:

```text
memoryCost: 19456
timeCost: 2
parallelism: 1
```

Minimum password length:

```text
8 characters
```

Operational login supports:

- phone + password
- email + password

Every operational account must have a phone number.

Email is optional.

V1 supports Indian mobile numbers only.

Operational registration is invitation-based.

No unrestricted public operational signup.

---

# 12. Authorization

Backend is the authorization source of truth.

Use both:

```text
role authorization
+
resource authorization
```

Examples:

Doctor:
```text
own / permitted clinic resources
```

Clinic Staff:
```text
active clinic membership
```

Scanning Staff:
```text
assigned Scan Booking only
```

Cera Staff/Admin:
```text
according to confirmed operational/admin rules
```

Do not assume Cera Staff has every Cera Admin permission.

---

# 13. API Conventions

Base:

```text
/api/v1
```

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

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

Use explicit business action endpoints for important state transitions rather than arbitrary status PATCH operations.

---

# 14. Digital Lab Slip

The Digital Lab Slip is the central case/prescription record.

Current concepts include:

- reference
- source
- status
- urgency
- clinic
- doctor
- patient name
- optional patient reference
- items/products
- product/category snapshots
- teeth
- shade
- pontic/design information
- design notes
- general notes
- scan-required flag
- creator
- timestamps

Current Lab Slip status:

```text
SUBMITTED
```

Production lifecycle has not yet been defined.

---

# 15. Lab Slip Sources

Confirmed:

```text
PORTAL
PHONE
WHATSAPP
PAPER
```

Doctor / Clinic Staff portal submissions use `PORTAL`.

Cera operational users may create cases from offline sources.

---

# 16. Tooth Representation

UI follows Cera's familiar paper-style layout:

```text
Upper:
8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8

Lower:
8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8
```

Backend stores unambiguous quadrant values:

```text
UR1–UR8
UL1–UL8
LR1–LR8
LL1–LL8
```

Do not switch to FDI numbering unless explicitly requested.

---

# 17. Catalogue

Catalogue includes categories and products.

New Lab Slip selections require:

```text
Product ACTIVE
+
Category ACTIVE
```

Historical Lab Slip items preserve product/category snapshots.

If a product/category is later disabled:

```text
existing historical item remains valid
```

but a newly added/replaced selection must use active catalogue data.

Do not invent official Cera products, shade lists, pontic types, pricing, or product-specific requirements without authoritative client data.

---

# 18. Lab Slip Editing

Current editable content includes:

- urgency
- patient name/reference
- items
- teeth
- shade
- pontic/design information
- design notes
- general notes

Current immutable identity fields:

- reference
- clinic
- doctor
- source
- creator
- created timestamp

`scanRequired` is handled through scan-booking behavior rather than normal Lab Slip editing.

The production edit-lock point is not yet defined.

---

# 19. Scan Booking

Scan Booking is a separate operational record linked to a Lab Slip.

Current states:

```text
PENDING_REVIEW
AWAITING_CONFIRMATION
CONFIRMED
ASSIGNED
COMPLETED
REJECTED
CANCELLED
```

Human reference pattern:

```text
SCAN-YYYY-000001
```

Current flow includes:

- request scan
- confirm requested time
- propose alternate time
- Doctor/Clinic accept alternate
- reject
- assign active Scanning Staff
- complete
- cancel according to role/state rules
- reschedule confirmed/assigned visits

A later scan request is allowed even if the Lab Slip originally had `scanRequired=false`.

Only one active/non-terminal Scan Booking is allowed per Lab Slip.

Rejected/cancelled history may allow a later new request.

Completed booking does **not** automatically allow a rescan.

Rescan behavior belongs to future correction/rescan design.

---

# 20. Scan Rescheduling

Rescheduling is separate from the main Scan Booking status.

Allowed main booking states:

```text
CONFIRMED
ASSIGNED
```

Reschedule states:

```text
REQUESTED
AWAITING_CONFIRMATION
```

Who may request:

- Doctor
- Clinic Staff
- Cera Staff
- Cera Admin

Scanning Staff cannot manage rescheduling.

Cera Staff/Admin may:

- confirm requested time
- propose another time
- initiate a direct proposal

Doctor/Clinic Staff may accept a Cera proposal.

Important rules:

- current confirmed appointment remains active until replacement is accepted
- main booking status stays `CONFIRMED` or `ASSIGNED`
- existing assigned scanner remains assigned
- a new scanner assignment is blocked while unresolved rescheduling exists
- finalized reschedules are retained in history
- terminal bookings cannot be rescheduled

---

# 21. Urgency Synchronization

When Lab Slip urgency changes, active Scan Bookings in:

```text
PENDING_REVIEW
AWAITING_CONFIRMATION
CONFIRMED
ASSIGNED
```

synchronize urgency.

Terminal Scan Bookings:

```text
COMPLETED
REJECTED
CANCELLED
```

retain their historical urgency.

---

# 22. Human References

Current patterns:

```text
Lab Slip:
CDL-YYYY-000001

Scan Booking:
SCAN-YYYY-000001
```

Generation uses atomic counters/sequences.

Do not replace these user-facing references with MongoDB IDs.

---

# 23. Scope Exclusions

Do not add:

- online payments
- payment gateway
- invoices/accounting
- inventory ERP
- ecommerce/cart
- direct intraoral scanner integration
- large raw scan-file website storage
- unrestricted operational signup

Doctors continue using existing offline payment arrangements.

---

# 24. Attachments

Attachments are planned but not yet implemented.

Current direction:

- private supporting files
- JPEG
- PNG
- WEBP
- PDF
- external private object storage later
- no large raw scan files

Open:

- ownership
- permissions
- deletion
- retention
- size limit
- provider
- signed URL strategy

Do not implement attachment behavior until Module 4E design.

---

# 25. Notifications

Preferred operational communication direction:

```text
1. WhatsApp
2. In-app
3. Email where useful later
```

Planned WhatsApp direction:

```text
WhatsApp Business Cloud API
```

Do not assume every event creates a WhatsApp message.

Notification events, recipients, templates, retry behavior, and safe message content remain future decisions.

---

# 26. UI/UX Priorities

## Doctor

```text
mobile-first
fast
simple
familiar
minimal typing
```

Current Doctor navigation direction:

```text
Dashboard
New Lab Slip
My Slips
Scans
Corrections
Profile
```

`Corrections` is future functionality.

## Clinic Staff

Similar to Doctor but restricted to permitted clinic/Doctor context.

## Cera Staff/Admin

```text
desktop-oriented
operational
higher information density
clear action/status hierarchy
```

## Scanning Staff

```text
mobile-first
assigned visits only
minimal necessary information
```

---

# 27. Working Design Tokens

Current working UI tokens include:

```text
navy-950  #071827
navy-900  #0b2238
navy-800  #12324f

blue-600  #1378b8
blue-500  #2498d4
cyan-400  #4bc5df

background #f5f8fa
surface    #ffffff
border     #dce5eb
text       #14212b
muted      #62717d

danger     #b42318
danger-bg  #fff1f0

success    #19734a
success-bg #ecfdf3
```

These are working interface colors.

Do not claim they are official Cera brand colors without client confirmation.

Do not invent logo/typeface/branding.

---

# 27A. Module 7 Security Hardening Snapshot

Current security baseline includes:

- short-lived access JWT + rotating opaque refresh token cookies
- `authVersion` invalidation for disabled users
- refresh-session revocation on user disable
- dedicated invitation token secret + migration fallback
- invitation preview/accept rate limits
- exact credentialed CORS
- Origin-based CSRF checks for unsafe V1 browser requests
- Helmet and disabled `x-powered-by`
- resource-level authorization as backend source of truth
- private signed attachment access with type/signature validation
- database-enforced concurrent attachment capacity
- atomic Production/Correction transitions
- production-safe logging and reduced patient/query exposure
- centralized environment/R2 validation
- clean dependency audit at the Module 7 checkpoint

Admin MFA remains deferred. Final proxy/HTTPS/cookie topology review belongs to Module 9.

---

# 28. Completed Modules

Current implemented/verified module boundary:

```text
Module 0   Foundation                         COMPLETE
Module 1A  User + Password                    COMPLETE
Module 1B  Login                              COMPLETE
Module 1C  Persistent Authentication          COMPLETE
Module 1D  Logout                             COMPLETE
Module 2A  Role Authorization                 COMPLETE
Module 2B  Invitations & User Management      COMPLETE
Module 3A  Clinics & Memberships              COMPLETE
Module 3B  Product Catalogue                  COMPLETE
Module 4A  Digital Lab Slip Core              COMPLETE
Module 4B  Scan Booking + Lab Slip Editing    COMPLETE
Module 4C  Scan Rescheduling                  COMPLETE
Module 4D  Lab Production Workflow            COMPLETE
Module 4E  Private Attachments                COMPLETE
Module 4F  Corrections / Issues               COMPLETE
Module 5A  In-App Notifications               COMPLETE
Module 5B  WhatsApp Notifications             COMPLETE
Module 6A  Doctor Dashboard Refinement        COMPLETE
Module 6B  Cera Operations Dashboard          COMPLETE
Module 6C  Scanning Staff Mobile Refinement   COMPLETE
Module 7   Security & Cross-Module Hardening  COMPLETE
```

Module 7 has passed the full test/lint/build/audit checkpoint. Its documentation/source-control closeout must be completed before Module 8 starts.

# 29. Next Module

```text
Module 8 — End-to-End Regression Testing
```

Status:

```text
NEXT (after Module 7 commit/push/clean-tree verification)
```

Purpose:

- validate complete cross-role journeys
- catch integration regressions and edge cases
- verify role/resource isolation across modules
- verify responsive/error/empty states before deployment

Do not begin Module 9 deployment before Module 8 closes.

# 30. Historical Decision Sections

Older Module 4D planning questions in previous snapshots are no longer the current handoff boundary because Modules 4D through 7 have since been implemented.

For current behavior:

1. inspect the repository/code,
2. use `MODULE_STATUS.md` and `SESSION_HANDOFF.md`,
3. consult detailed project/design/decision docs,
4. treat only still-open entries in `OPEN_QUESTIONS.md` as unresolved.

Do not use an older `OPEN` label from a stale planning snapshot to override implemented repository behavior.

# 31. No-Assumption Protocol

Mandatory rule:

> Do not assume missing business rules.

Classify uncertainty as:

```text
CONFIRMED
IMPLEMENTATION DETAIL
UNKNOWN BUSINESS / DESIGN DECISION
```

If unknown, respond with:

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

Then wait for user confirmation before implementing dependent behavior.

---

# 32. Things the Chatbot Must Not Invent

Do not invent:

- roles
- permissions
- statuses
- transitions
- required fields
- automatic actions
- visibility rules
- product data
- shade lists
- pontic types
- production rules
- correction rules
- notification events
- integrations
- payment functionality
- architecture layers
- folders
- dependencies
- official branding

Small implementation details may follow existing project conventions if they do not change business behavior.

---

# 33. Code Modification Protocol

Before modifying an existing file:

```text
1. Ask user for current file.
2. Review actual file contents.
3. Preserve existing behavior unless intentionally changing it.
4. Decide:
   - targeted edit
   - full-file replacement
5. Give exact path.
6. User manually pastes code.
7. Run smallest relevant test.
8. Fix failures before continuing.
```

Use full-file replacement when scattered manual edits are risky.

Do not reconstruct important files from memory.

---

# 34. Module Development Workflow

For every module:

```text
1. Understand project context
2. Verify Git state
3. Understand previous module
4. Define current module scope
5. Resolve business/design questions
6. Define acceptance criteria
7. Inspect relevant current files
8. Implement backend/shared changes
9. Run backend tests
10. Implement frontend changes
11. Run frontend tests
12. Manual workflow QA
13. Full regression
14. Security/authorization review
15. Cleanup/refactor
16. git status/diff
17. Commit
18. Push
19. Update MODULE_STATUS
20. Update SESSION_HANDOFF
21. Update CHAT_CONTEXT if needed
22. Close session
```

Do not start the next module before the current one is committed/pushed and working tree is clean.

---

# 35. Verification Expectations

Each module should test where relevant:

- normal flow
- authentication
- wrong role
- wrong resource
- validation
- invalid state transition
- duplicate action
- edge cases
- failure behavior
- historical behavior
- responsive UI
- loading/error/empty states

Before commit, run actual repository scripts for:

- backend tests
- frontend tests
- lint
- build

Do not invent script names if uncertain.

Ask for `package.json` if needed.

If the user says:

```text
all passed
```

or:

```text
all clear
```

for the requested checkpoint, treat that checkpoint as successful.

---

# 36. Source of Truth

Use this priority:

```text
1. Current repository/code
2. Confirmed requirements
3. Project/design documentation
4. Architecture decisions
5. Module status/session handoff
6. Git history
7. This chat context
8. Chat memory
```

If code and confirmed documentation disagree:

```text
STOP
↓
identify the conflict
↓
ask which is authoritative
↓
resolve before continuing
```

---

# 37. Documentation Files

Detailed project context is stored in:

```text
docs/project/
├── PROJECT_OVERVIEW.md
├── REQUIREMENTS.md
├── PROJECT_PLAN.md
├── MODULE_PLAN.md
├── BUSINESS_FLOWS.md
└── PROJECT_KNOWLEDGE_BASE.md
```

Design:

```text
docs/design/
├── SYSTEM_DESIGN.md
├── FOLDER_STRUCTURE.md
├── DATABASE_DESIGN.md
├── API_DESIGN.md
├── UI_UX_DESIGN.md
└── SECURITY_DESIGN.md
```

Decision control:

```text
docs/decisions/
├── ARCHITECTURE_DECISIONS.md
├── DEVELOPMENT_RULES.md
├── ASSUMPTION_POLICY.md
└── OPEN_QUESTIONS.md
```

Progress:

```text
docs/progress/
├── MODULE_STATUS.md
├── SESSION_HANDOFF.md
└── CHAT_CONTEXT.md
```

---

# 38. Recommended New Module Chat Prompt

```text
We are continuing the Cera Dental Lab project.

Module 7 — Security & Cross-Module Hardening is implemented and verified.
This session is for Module 8 — End-to-End Regression Testing.

First retrieve PROJECT_KNOWLEDGE_BASE.md, MODULE_STATUS.md,
SESSION_HANDOFF.md, and current repository state.

Do not invent new business workflows just to create tests.
Use current code and confirmed documentation as the source of truth.

I manually run commands and copy/paste code into VS Code.
Before modifying an existing file, inspect its current contents.
Work through role journeys and edge cases systematically.
```

# 39. Current Handoff State

```text
MODULE 7 IMPLEMENTATION + VERIFICATION COMPLETE
MODULE 7 DOCUMENTATION/SOURCE-CONTROL CLOSEOUT IN PROGRESS
NEXT MODULE: 8 — END-TO-END REGRESSION TESTING
```

Before Module 8 work begins, verify Module 7 has been committed/pushed and the working tree is clean.
