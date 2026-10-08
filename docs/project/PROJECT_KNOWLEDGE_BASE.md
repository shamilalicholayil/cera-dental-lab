# Cera Dental Lab — Project Knowledge Base

## Purpose

This is a retrieval-oriented Q&A layer for new chatbot sessions. It is designed to behave like a small RAG knowledge base: each entry is an atomic question with a canonical answer, status, search keywords, and source-document pointers.

Detailed project documents remain authoritative. This file exists so a new chat can retrieve a direct answer instead of asking the user the same question again.

## Retrieval Policy

Before asking the user a project question:

1. Search this knowledge base.
2. Search the source document named in the matching entry.
3. Check `docs/decisions/OPEN_QUESTIONS.md`.
4. Check `docs/progress/SESSION_HANDOFF.md` for current-module changes.
5. Ask the user only when the answer is still genuinely unknown **and blocks the current work**.

Status meanings:

- **CONFIRMED** — answer exists; do not ask again unless a conflict is found.
- **REPOSITORY-DERIVED** — current code/config is authoritative; inspect it or request the smallest relevant file/output.
- **OPEN** — undecided; ask only when the current module depends on it.
- **DEFERRED** — belongs to a later module; do not ask early.

Question-minimization rule: do not ask generic setup questions at the beginning of every chat, do not ask confirmed questions, do not ask deferred future-module questions, and group related blocking open questions.

---

## KB-001 — What is Cera Dental Lab building?

Status: **CONFIRMED**

**Canonical answer:** A public website plus an authenticated operational portal for Doctors, Clinic/Hospital Staff, Cera Admin, Cera Staff, and Scanning Staff. The central operational record is the Digital Lab Slip.

**Keywords:** project purpose, portal, public website

**Source docs:** PROJECT_OVERVIEW.md; REQUIREMENTS.md

---

## KB-002 — What is the main product principle?

Status: **CONFIRMED**

**Canonical answer:** Minimum doctor effort, without reducing the quality of information Cera receives. Doctor-facing workflows should remain simple, familiar, fast, and low-friction rather than ERP-like.

**Keywords:** doctor effort, UX principle, ERP

**Source docs:** PROJECT_OVERVIEW.md; UI_UX_DESIGN.md

---

## KB-003 — What is the high-level business flow?

Status: **CONFIRMED**

**Canonical answer:** Doctor/Clinic Staff → Digital Lab Slip → optional Scan Booking → Cera review/scheduling → Scanning Staff assignment → scan completion → Lab Production → case completion → Correction/Issue if required. Cera Staff can also digitize cases received by phone, WhatsApp, or paper.

**Keywords:** business flow, case flow, workflow

**Source docs:** BUSINESS_FLOWS.md

---

## KB-004 — Are payments, billing, or ecommerce part of the system?

Status: **CONFIRMED**

**Canonical answer:** No. Do not add online payments, payment gateway, invoicing/accounting, billing ERP, inventory ERP, or ecommerce/cart behavior. Doctors continue using Cera's offline payment arrangements.

**Keywords:** payment, billing, invoice, ecommerce

**Source docs:** PROJECT_OVERVIEW.md; ARCHITECTURE_DECISIONS.md

---

## KB-005 — Is direct intraoral scanner integration part of the project?

Status: **CONFIRMED**

**Canonical answer:** No. Do not build scanner SDK, hardware communication, automatic scanner transfer, or direct scanner integration.

**Keywords:** scanner integration, intraoral scanner, SDK

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-006 — Should the website store large raw scan files?

Status: **CONFIRMED**

**Canonical answer:** No. Large raw intraoral scan files are handled separately and are outside the normal application attachment workflow.

**Keywords:** raw scan, large upload, scan file

**Source docs:** PROJECT_OVERVIEW.md; ARCHITECTURE_DECISIONS.md

---

## KB-007 — What supporting attachment types are planned?

Status: **CONFIRMED**

**Canonical answer:** Private supporting attachments are planned for JPEG, PNG, WEBP, and PDF. Ownership, permissions, deletion, limits, and storage provider remain deferred to Module 4E.

**Keywords:** attachments, JPEG, PNG, WEBP, PDF

**Source docs:** REQUIREMENTS.md; OPEN_QUESTIONS.md

---

## KB-008 — Is the user using a coding agent?

Status: **CONFIRMED**

**Canonical answer:** No. Development is through a normal chatbot. The user manually runs commands, opens files, copies code into VS Code, runs tests/lint/build, and returns outputs.

**Keywords:** coding agent, manual, copy paste, VS Code

**Source docs:** DEVELOPMENT_RULES.md; CHAT_CONTEXT.md

---

## KB-009 — Can the chatbot assume it can inspect or edit the local repository?

Status: **CONFIRMED**

**Canonical answer:** No. Do not claim local repository inspection/editing/testing unless the user supplied the relevant content/output or a connected project source actually provides it. Obtain the current important file before modifying it.

**Keywords:** inspect repo, edit file, repository access

**Source docs:** DEVELOPMENT_RULES.md

---

## KB-010 — How should code changes be delivered?

Status: **CONFIRMED**

**Canonical answer:** Always provide the exact file path. Use a targeted edit for a small isolated change and a full-file replacement when multiple coordinated regions/imports/state/JSX must change. The user manually pastes the code.

**Keywords:** full replacement, targeted edit, file path

**Source docs:** DEVELOPMENT_RULES.md

---

## KB-011 — Should a new chat ask the user to repeat the whole project?

Status: **CONFIRMED**

**Canonical answer:** No. Retrieve PROJECT_KNOWLEDGE_BASE, CHAT_CONTEXT, SESSION_HANDOFF, MODULE_STATUS, and relevant detailed docs. Ask only for genuinely missing business decisions or current source files required for implementation.

**Keywords:** new chat, repeat, context, RAG

**Source docs:** CHAT_CONTEXT.md; SESSION_HANDOFF.md

---

## KB-012 — Should a new chat ask all open questions immediately?

Status: **CONFIRMED**

**Canonical answer:** No. Ask only open questions that block the current module/checkpoint. Group related questions. Do not ask deferred future-module questions early.

**Keywords:** too many questions, blocking questions

**Source docs:** ASSUMPTION_POLICY.md; OPEN_QUESTIONS.md

---

## KB-013 — What happens when the user says 'all passed' or 'all clear'?

Status: **CONFIRMED**

**Canonical answer:** Treat the requested verification checkpoint as successful and continue. Do not require all passing output unless a specific detail is needed.

**Keywords:** all passed, all clear, test result

**Source docs:** DEVELOPMENT_RULES.md

---

## KB-014 — When is a module considered complete?

Status: **CONFIRMED**

**Canonical answer:** Only after scope/business rules, backend/frontend, authorization, validation, normal/failure/permission/edge tests, UI states, regression, lint, build, manual QA, Git review, commit, push, clean working tree, and progress/handoff documentation are complete.

**Keywords:** definition of done, module complete, gates

**Source docs:** DEVELOPMENT_RULES.md; PROJECT_PLAN.md

---

## KB-015 — Should frontend and backend be built separately?

Status: **CONFIRMED**

**Canonical answer:** No. Build vertical slices: business rules → shared/backend → backend tests → frontend API/UI → frontend tests → manual QA → regression.

**Keywords:** vertical slice, frontend, backend

**Source docs:** PROJECT_PLAN.md; ARCHITECTURE_DECISIONS.md

---

## KB-016 — Can the next module start before the current module is pushed?

Status: **CONFIRMED**

**Canonical answer:** No. Verify, commit, push, confirm clean working tree, update handoff, then start the next module.

**Keywords:** commit, push, next module

**Source docs:** DEVELOPMENT_RULES.md

---

## KB-017 — What is the source-of-truth priority?

Status: **CONFIRMED**

**Canonical answer:** Current repository/code → confirmed requirements → project/design docs → architecture decisions → module status/session handoff → Git history → chat context/memory. If code and confirmed docs conflict, stop and resolve the conflict.

**Keywords:** source of truth, conflict, code vs docs

**Source docs:** PROJECT_OVERVIEW.md; ASSUMPTION_POLICY.md

---

## KB-018 — What may the chatbot safely decide without asking?

Status: **CONFIRMED**

**Canonical answer:** Only small implementation details that do not alter business behavior, weaken security, add a dependency, create a new architectural pattern, or unexpectedly change public API behavior.

**Keywords:** safe assumption, implementation detail

**Source docs:** ASSUMPTION_POLICY.md

---

## KB-019 — What must the chatbot never invent?

Status: **CONFIRMED**

**Canonical answer:** Do not invent roles, permissions, statuses, transitions, business-required fields, automatic actions, visibility rules, integrations, catalogue data, production/correction rules, notification events, official branding, architecture layers, or dependencies.

**Keywords:** assumption, invent, business rule

**Source docs:** ASSUMPTION_POLICY.md

---

## KB-020 — What should happen if an answer is missing?

Status: **CONFIRMED**

**Canonical answer:** Classify it as CONFIRMED, IMPLEMENTATION DETAIL, or UNKNOWN BUSINESS/DESIGN DECISION. Ask the user only if it is a true unknown that blocks current work.

**Keywords:** unknown, ask user, decision needed

**Source docs:** ASSUMPTION_POLICY.md

---

## KB-021 — What frontend stack is locked?

Status: **CONFIRMED**

**Canonical answer:** React + Vite + JavaScript. Do not migrate to Next.js or TypeScript during normal feature development.

**Keywords:** React, Vite, JavaScript, Next.js, TypeScript

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-022 — What backend stack is locked?

Status: **CONFIRMED**

**Canonical answer:** Node.js + Express + JavaScript ES modules.

**Keywords:** Node, Express, ESM

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-023 — What database stack is locked?

Status: **CONFIRMED**

**Canonical answer:** MongoDB + Mongoose. Current documented local database URI is mongodb://127.0.0.1:27017/cera_dev.

**Keywords:** MongoDB, Mongoose, cera_dev

**Source docs:** DATABASE_DESIGN.md; CHAT_CONTEXT.md

---

## KB-024 — What architecture style is used?

Status: **CONFIRMED**

**Canonical answer:** Modular monolith. Do not split into microservices without a concrete confirmed need.

**Keywords:** modular monolith, microservices

**Source docs:** SYSTEM_DESIGN.md; ARCHITECTURE_DECISIONS.md

---

## KB-025 — What is the API style and base path?

Status: **CONFIRMED**

**Canonical answer:** REST-style API under /api/v1.

**Keywords:** REST, API, /api/v1

**Source docs:** API_DESIGN.md

---

## KB-026 — What is the API success envelope?

Status: **CONFIRMED**

**Canonical answer:** {"success": true, "data": {}}

**Keywords:** success response, API envelope

**Source docs:** API_DESIGN.md

---

## KB-027 — What is the API error envelope?

Status: **CONFIRMED**

**Canonical answer:** {"success": false, "error": {"code": "ERROR_CODE", "message": "Human-readable message", "requestId": "optional"}}

**Keywords:** error response, requestId

**Source docs:** API_DESIGN.md

---

## KB-028 — Where should shared business enums live?

Status: **CONFIRMED**

**Canonical answer:** In packages/shared. Do not duplicate the same business enums independently in frontend and backend.

**Keywords:** shared constants, enum, packages/shared

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-029 — What is the backend module pattern?

Status: **CONFIRMED**

**Canonical answer:** Typical files: <module>.model.js, .schemas.js, .serializer.js, .service.js, .controller.js, .routes.js, .test.js. Model=persistence, schemas=input validation, service=business/resource/state logic, controller=HTTP adaptation, routes=wiring/coarse auth, serializer=public response.

**Keywords:** backend structure, service, controller, model

**Source docs:** FOLDER_STRUCTURE.md; SYSTEM_DESIGN.md

---

## KB-030 — Can a new folder or architecture layer be introduced automatically?

Status: **CONFIRMED**

**Canonical answer:** No. Inspect the existing repository and a similar completed module first. Do not casually add repository/domain/use-case/event-bus layers or new top-level folders.

**Keywords:** new folder, repository pattern, architecture

**Source docs:** FOLDER_STRUCTURE.md; DEVELOPMENT_RULES.md

---

## KB-031 — Can a new dependency be installed automatically?

Status: **CONFIRMED**

**Canonical answer:** No significant dependency should be added without checking whether the current stack already solves the problem and whether the dependency is justified.

**Keywords:** npm package, dependency, install

**Source docs:** DEVELOPMENT_RULES.md

---

## KB-032 — Where do frontend route definitions belong?

Status: **CONFIRMED**

**Canonical answer:** In the dedicated routes module, not App.jsx.

**Keywords:** routes, App.jsx, React Router

**Source docs:** ARCHITECTURE_DECISIONS.md; FOLDER_STRUCTURE.md

---

## KB-033 — How should Redux Toolkit be used?

Status: **CONFIRMED**

**Canonical answer:** Use it for suitable application-wide state such as authentication. Keep form/modal/transient UI state local. Do not put every server response or form field in Redux.

**Keywords:** Redux, state, local state

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-034 — Where do frontend API functions live?

Status: **CONFIRMED**

**Canonical answer:** Under apps/web/src/api/, using the shared API client.

**Keywords:** frontend API, src/api

**Source docs:** FOLDER_STRUCTURE.md

---

## KB-035 — Is frontend role hiding enough for security?

Status: **CONFIRMED**

**Canonical answer:** No. Frontend checks are UX only. Backend must enforce authentication, role, resource access, current state, and transition permission.

**Keywords:** frontend security, authorization

**Source docs:** SECURITY_DESIGN.md

---

## KB-036 — How do operational users log in?

Status: **CONFIRMED**

**Canonical answer:** Phone + password or email + password. Phone is required. Email is optional. V1 supports Indian mobile numbers only.

**Keywords:** login, phone, email, India

**Source docs:** REQUIREMENTS.md

---

## KB-037 — Is public operational signup allowed?

Status: **CONFIRMED**

**Canonical answer:** No. Operational registration is invitation-based and controlled by Cera Admin.

**Keywords:** signup, registration, invitation

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-038 — What authentication/session design is used?

Status: **CONFIRMED**

**Canonical answer:** 15-minute access JWT + 10-day opaque rotating refresh token + HttpOnly cookies + server-side refresh-token hashing + replay handling. Logout revokes the current refresh session.

**Keywords:** JWT, refresh token, cookie, session

**Source docs:** SECURITY_DESIGN.md

---

## KB-039 — How are passwords stored?

Status: **CONFIRMED**

**Canonical answer:** Argon2id. Documented parameters: memoryCost 19456, timeCost 2, parallelism 1. Minimum password length is 8 characters.

**Keywords:** Argon2id, password, hash

**Source docs:** SECURITY_DESIGN.md

---

## KB-040 — Can auth tokens be stored in localStorage/sessionStorage?

Status: **CONFIRMED**

**Canonical answer:** No. Authentication tokens use HttpOnly cookies.

**Keywords:** localStorage, sessionStorage, cookie

**Source docs:** SECURITY_DESIGN.md

---

## KB-041 — What roles exist?

Status: **CONFIRMED**

**Canonical answer:** Visitor, Doctor, Clinic/Hospital Staff, Cera Admin, Cera Staff, Scanning Staff.

**Keywords:** roles, permissions

**Source docs:** REQUIREMENTS.md

---

## KB-042 — Are Cera Staff and Cera Admin identical?

Status: **CONFIRMED**

**Canonical answer:** No. Cera Admin has administrative responsibilities; Cera Staff have broad operational access but must not automatically receive every Admin permission.

**Keywords:** Cera Staff, Admin, permission

**Source docs:** BUSINESS_FLOWS.md; SECURITY_DESIGN.md

---

## KB-043 — Can a Doctor belong to multiple clinics?

Status: **CONFIRMED**

**Canonical answer:** Yes. Access uses active ClinicMembership relationships.

**Keywords:** Doctor, clinic, membership, many-to-many

**Source docs:** REQUIREMENTS.md

---

## KB-044 — What can Clinic Staff access?

Status: **CONFIRMED**

**Canonical answer:** Only work within active clinic membership and permitted Doctor relationships. No unrelated clinic or unrelated Doctor work.

**Keywords:** Clinic Staff, clinic access

**Source docs:** BUSINESS_FLOWS.md; SECURITY_DESIGN.md

---

## KB-045 — What can Scanning Staff access?

Status: **CONFIRMED**

**Canonical answer:** Assigned scan visits only and the minimum information needed to perform them. No broad Lab Slip/catalogue/admin access or unnecessary manufacturing details.

**Keywords:** Scanning Staff, assigned visits, least privilege

**Source docs:** SECURITY_DESIGN.md

---

## KB-046 — What is the central operational record called?

Status: **CONFIRMED**

**Canonical answer:** Digital Lab Slip (LabSlip in code). Do not rename it to Order, Job, Ticket, or WorkItem unless a distinct approved concept is introduced.

**Keywords:** Lab Slip, LabSlip, case, order

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-047 — What are the Lab Slip source values?

Status: **CONFIRMED**

**Canonical answer:** PORTAL, PHONE, WHATSAPP, PAPER.

**Keywords:** Lab Slip source, portal, WhatsApp

**Source docs:** REQUIREMENTS.md

---

## KB-048 — What is the current Lab Slip status?

Status: **CONFIRMED**

**Canonical answer:** SUBMITTED. A production lifecycle has not yet been approved.

**Keywords:** Lab Slip status, SUBMITTED

**Source docs:** DATABASE_DESIGN.md

---

## KB-049 — What patient information does a Lab Slip store?

Status: **CONFIRMED**

**Canonical answer:** Patient name and optional patient reference. Do not add unnecessary patient/medical fields without confirmed business need.

**Keywords:** patient fields, privacy

**Source docs:** REQUIREMENTS.md; DATABASE_DESIGN.md

---

## KB-050 — What Lab Slip content is currently editable?

Status: **CONFIRMED**

**Canonical answer:** Urgency, patient name/reference, items/products, teeth, shade, pontic/design information, design notes, and general notes.

**Keywords:** edit Lab Slip, editable

**Source docs:** REQUIREMENTS.md

---

## KB-051 — What Lab Slip fields are immutable?

Status: **CONFIRMED**

**Canonical answer:** Reference, clinic, doctor, source, creator, and creation timestamp. scanRequired is managed through Scan Booking behavior rather than normal Lab Slip editing.

**Keywords:** immutable, Lab Slip identity

**Source docs:** REQUIREMENTS.md

---

## KB-052 — What happens when a catalogue item is later disabled?

Status: **CONFIRMED**

**Canonical answer:** Historical Lab Slip snapshots remain valid. New/replaced selections must use an active product whose category is also active.

**Keywords:** disabled product, snapshot, catalogue

**Source docs:** DATABASE_DESIGN.md; ARCHITECTURE_DECISIONS.md

---

## KB-053 — Should the chatbot invent products, shade lists, pontic types, or product-specific fields?

Status: **CONFIRMED**

**Canonical answer:** No. Use authoritative Cera data. If unavailable, keep behavior generic/configurable or treat it as an open requirement.

**Keywords:** catalogue, shade, pontic, products

**Source docs:** REQUIREMENTS.md; UI_UX_DESIGN.md

---

## KB-054 — What tooth numbering should the UI use?

Status: **CONFIRMED**

**Canonical answer:** Paper-style 8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8 for upper and lower rows. Backend stores UR1–UR8, UL1–UL8, LR1–LR8, LL1–LL8. Do not switch to FDI unless explicitly requested.

**Keywords:** tooth numbering, FDI, UR1

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-055 — What are the Lab Slip urgency values?

Status: **CONFIRMED**

**Canonical answer:** Standard and Urgent. Urgent is a priority request, not a software-enforced SLA unless separately approved.

**Keywords:** urgent, standard, SLA

**Source docs:** REQUIREMENTS.md

---

## KB-056 — Should the approximate 1-day/2-day turnaround become an automatic deadline?

Status: **CONFIRMED**

**Canonical answer:** No. It is business context, not an enforceable SLA. Do not add countdowns, deadlines, or late flags without approval.

**Keywords:** turnaround, deadline, SLA

**Source docs:** ASSUMPTION_POLICY.md

---

## KB-057 — What are the Scan Booking main statuses?

Status: **CONFIRMED**

**Canonical answer:** PENDING_REVIEW, AWAITING_CONFIRMATION, CONFIRMED, ASSIGNED, COMPLETED, REJECTED, CANCELLED.

**Keywords:** scan status, lifecycle

**Source docs:** REQUIREMENTS.md

---

## KB-058 — Can a scan be requested later if the Lab Slip originally said no scan?

Status: **CONFIRMED**

**Canonical answer:** Yes. A later Scan Booking is allowed and LabSlip.scanRequired becomes true.

**Keywords:** late scan, scanRequired

**Source docs:** BUSINESS_FLOWS.md

---

## KB-059 — Can a Lab Slip have multiple active Scan Bookings?

Status: **CONFIRMED**

**Canonical answer:** No. Only one active/non-terminal Scan Booking per Lab Slip. REJECTED/CANCELLED may allow a later new request. COMPLETED does not automatically authorize a rescan.

**Keywords:** duplicate scan, multiple bookings, rescan

**Source docs:** REQUIREMENTS.md

---

## KB-060 — Who can be assigned as Scanning Staff?

Status: **CONFIRMED**

**Canonical answer:** Only an active user with the Scanning Staff role.

**Keywords:** assign scanner, active scanner

**Source docs:** SECURITY_DESIGN.md

---

## KB-061 — Who can complete an assigned scan visit?

Status: **CONFIRMED**

**Canonical answer:** The assigned Scanning Staff member; Cera operational users may also complete where the current Scan Booking rules allow.

**Keywords:** complete scan, assigned scanner

**Source docs:** REQUIREMENTS.md

---

## KB-062 — What are the current scan cancellation rules?

Status: **CONFIRMED**

**Canonical answer:** Doctor/Clinic Staff may cancel before Scanning Staff assignment. After ASSIGNED, Doctor/Clinic Staff cannot directly cancel; Cera handles operational cancellation.

**Keywords:** cancel scan, ASSIGNED

**Source docs:** BUSINESS_FLOWS.md

---

## KB-063 — Which Scan Bookings can be rescheduled?

Status: **CONFIRMED**

**Canonical answer:** Only CONFIRMED or ASSIGNED bookings.

**Keywords:** reschedule, CONFIRMED, ASSIGNED

**Source docs:** REQUIREMENTS.md

---

## KB-064 — Who can request a reschedule?

Status: **CONFIRMED**

**Canonical answer:** Doctor, Clinic Staff, Cera Staff, and Cera Admin. Scanning Staff cannot manage rescheduling.

**Keywords:** request reschedule, permission

**Source docs:** REQUIREMENTS.md

---

## KB-065 — Does rescheduling change the main booking status?

Status: **CONFIRMED**

**Canonical answer:** No. Reschedule negotiation is separate. Active reschedule states are REQUESTED and AWAITING_CONFIRMATION.

**Keywords:** reschedule status, REQUESTED

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-066 — What happens to the old confirmed time during rescheduling?

Status: **CONFIRMED**

**Canonical answer:** It remains the operational appointment until the replacement time is accepted/finalized.

**Keywords:** old confirmed time, reschedule

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-067 — What happens to an assigned scanner during rescheduling?

Status: **CONFIRMED**

**Canonical answer:** The assigned scanner remains assigned unless Cera explicitly changes assignment.

**Keywords:** assigned scanner, reschedule

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-068 — Can Cera newly assign a scanner while a reschedule is unresolved?

Status: **CONFIRMED**

**Canonical answer:** No. New assignment is blocked until the pending reschedule is resolved.

**Keywords:** assignment blocked, reschedule pending

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-069 — Is reschedule history preserved?

Status: **CONFIRMED**

**Canonical answer:** Yes. Finalized reschedules are retained and not overwritten by later reschedules.

**Keywords:** reschedule history, audit

**Source docs:** DATABASE_DESIGN.md

---

## KB-070 — Does Lab Slip urgency synchronize to Scan Bookings?

Status: **CONFIRMED**

**Canonical answer:** Yes for PENDING_REVIEW, AWAITING_CONFIRMATION, CONFIRMED, and ASSIGNED. Do not rewrite terminal COMPLETED, REJECTED, or CANCELLED history.

**Keywords:** urgency sync, terminal history

**Source docs:** BUSINESS_FLOWS.md

---

## KB-071 — What are the human reference formats?

Status: **CONFIRMED**

**Canonical answer:** Lab Slip: CDL-YYYY-000001. Scan Booking: SCAN-YYYY-000001. References use atomic sequence/counter generation.

**Keywords:** reference, CDL, SCAN, counter

**Source docs:** DATABASE_DESIGN.md

---

## KB-072 — Why are catalogue values snapshotted into Lab Slips?

Status: **CONFIRMED**

**Canonical answer:** To preserve historical case meaning if catalogue records are later renamed or disabled.

**Keywords:** snapshot, historical integrity

**Source docs:** DATABASE_DESIGN.md

---

## KB-073 — Should important operational records be hard deleted by default?

Status: **CONFIRMED**

**Canonical answer:** No. Prefer disabling, cancellation, inactivity, or historical retention where business history matters.

**Keywords:** delete, soft delete, history

**Source docs:** DATABASE_DESIGN.md

---

## KB-074 — What is the authorization model?

Status: **CONFIRMED**

**Canonical answer:** Two layers: route/coarse role authorization plus resource-level authorization in backend business logic. Role alone is insufficient.

**Keywords:** authorization, role, resource access

**Source docs:** SECURITY_DESIGN.md

---

## KB-075 — What input validation library is used?

Status: **CONFIRMED**

**Canonical answer:** Zod. Request validation does not replace service-level business/resource/state validation.

**Keywords:** Zod, validation

**Source docs:** API_DESIGN.md

---

## KB-076 — Can req.body be spread directly into database updates?

Status: **CONFIRMED**

**Canonical answer:** No. Use explicit validated/allowlisted fields to prevent mass assignment and immutable/security-field changes.

**Keywords:** mass assignment, req.body, allowlist

**Source docs:** SECURITY_DESIGN.md

---

## KB-077 — What must not be logged?

Status: **CONFIRMED**

**Canonical answer:** Passwords, raw access/refresh tokens, invitation secrets, patient notes, attachment content, and unnecessary patient information.

**Keywords:** logging, sensitive data, tokens

**Source docs:** SECURITY_DESIGN.md

---

## KB-078 — Are CSRF protection and Admin MFA complete?

Status: **CONFIRMED**

**Canonical answer:** V1 browser CSRF protection is implemented using exact trusted-Origin validation for unsafe methods. Cera Admin MFA is intentionally deferred until required and does not block Module 7 completion.

**Keywords:** CSRF, Origin, MFA, security hardening

**Source docs:** SECURITY_DESIGN.md; ARCHITECTURE_DECISIONS.md; OPEN_QUESTIONS.md

## KB-079 — What is the Doctor UI priority?

Status: **CONFIRMED**

**Canonical answer:** Mobile-first, fast, familiar, low-friction, minimal typing, and simple Lab Slip workflows.

**Keywords:** Doctor UI, mobile, UX

**Source docs:** UI_UX_DESIGN.md

---

## KB-080 — What is the Cera Staff/Admin UI priority?

Status: **CONFIRMED**

**Canonical answer:** Desktop-oriented operational efficiency with higher information density, clear statuses/actions, and fast case handling.

**Keywords:** Cera UI, desktop, operations

**Source docs:** UI_UX_DESIGN.md

---

## KB-081 — What is the Scanning Staff UI priority?

Status: **CONFIRMED**

**Canonical answer:** Mobile-first, assigned visits only, minimal necessary information, simple completion flow.

**Keywords:** Scanning Staff UI, mobile

**Source docs:** UI_UX_DESIGN.md

---

## KB-082 — Are the current interface colors official Cera brand colors?

Status: **CONFIRMED**

**Canonical answer:** No. They are working UI tokens. Do not claim official brand colors/logo/typeface without authoritative client assets.

**Keywords:** brand, colors, logo

**Source docs:** UI_UX_DESIGN.md

---

## KB-083 — Must modules include loading/error/empty/responsive/accessibility states?

Status: **CONFIRMED**

**Canonical answer:** Yes where relevant. UI/UX is developed continuously with each module, not postponed until the end.

**Keywords:** loading, error, empty, responsive, accessibility

**Source docs:** UI_UX_DESIGN.md

---

## KB-084 — What is the preferred external notification channel?

Status: **CONFIRMED**

**Canonical answer:** Priority direction: WhatsApp, then in-app, then email where useful. Planned provider direction is WhatsApp Business Cloud API. This does not mean every event sends WhatsApp.

**Keywords:** WhatsApp, notification, email

**Source docs:** PROJECT_OVERVIEW.md

---

## KB-085 — Should feature modules automatically add notification events?

Status: **CONFIRMED**

**Canonical answer:** No. Event, recipient, channel, content, timing, retry, and failure behavior must be designed in the notification module.

**Keywords:** notification event, recipient

**Source docs:** ASSUMPTION_POLICY.md

---

## KB-086 — What test framework is used?

Status: **CONFIRMED**

**Canonical answer:** Vitest for backend and frontend tests; frontend tests also follow Testing Library patterns.

**Keywords:** Vitest, Testing Library

**Source docs:** MODULE_PLAN.md; SYSTEM_DESIGN.md

---

## KB-087 — What are the required regression-gate categories?

Status: **CONFIRMED**

**Canonical answer:** Relevant frontend tests, backend tests, lint:web, lint:api, and build:web using the exact current scripts from package.json.

**Keywords:** test commands, lint:web, lint:api, build:web

**Source docs:** DEVELOPMENT_RULES.md

---

## KB-088 — What is the known frontend focused-test command pattern?

Status: **REPOSITORY-DERIVED**

**Canonical answer:** Previously used: npm run test --workspace=@cera/web -- <test-file> [more-test-files]. Current package.json remains authoritative.

**Keywords:** frontend test command, workspace, @cera/web

**Source docs:** current package.json

---

## KB-089 — What API port is currently documented?

Status: **CONFIRMED**

**Canonical answer:** 4000.

**Keywords:** API port, 4000

**Source docs:** MODULE_STATUS.md

---

## KB-090 — Should a new chat assume the current Git branch/clean state/commit?

Status: **REPOSITORY-DERIVED**

**Canonical answer:** No. Git state is dynamic. Verify with `git status` and `git log -1 --oneline`. The last documentation commit was on master, but current repository output is authoritative.

**Keywords:** git status, branch, commit, master

**Source docs:** ASSUMPTION_POLICY.md; SESSION_HANDOFF.md

---

## KB-091 — What modules are complete?

Status: **CONFIRMED**

**Canonical answer:** Implementation is complete through Module 7 — Security & Cross-Module Hardening. Module 8 is next after Module 7 documentation is committed/pushed and the working tree is verified clean.

**Keywords:** completed modules, current status, Module 7

**Source docs:** MODULE_STATUS.md; SESSION_HANDOFF.md

## KB-092 — What is the next planned module?

Status: **CONFIRMED**

**Canonical answer:** Module 8 — End-to-End Regression Testing. It should validate integrated role journeys and edge cases rather than introduce new business workflows.

**Keywords:** next module, Module 8, regression

**Source docs:** MODULE_PLAN.md; MODULE_STATUS.md; SESSION_HANDOFF.md

## KB-093 — What comes after Module 4D?

Status: **CONFIRMED**

**Canonical answer:** 4E Private Attachments; 4F Corrections/Issues; 5A In-App Notifications; 5B WhatsApp Notifications; 6A Doctor Dashboard; 6B Cera Operations Dashboard; 6C Scanning Staff refinement; 7 Security hardening; 8 E2E regression; 9 Deployment; 10 Final docs/monitoring.

**Keywords:** roadmap, after 4D

**Source docs:** MODULE_PLAN.md

---

## KB-094 — Is the Module 4D production state machine defined?

Status: **OPEN**

**Canonical answer:** No. Do not invent states such as IN_PRODUCTION, QUALITY_CHECK, or READY. Resolve from Cera's real workflow.

**Keywords:** 4D, production statuses, state machine

**Source docs:** OPEN_QUESTIONS.md

---

## KB-095 — Is production readiness defined?

Status: **OPEN**

**Canonical answer:** No. Module 4D must decide readiness for scan-required and non-scan cases, whether completed scan is mandatory, and whether Cera can override.

**Keywords:** production ready, scan completed

**Source docs:** OPEN_QUESTIONS.md

---

## KB-096 — Who may start/change production status?

Status: **OPEN**

**Canonical answer:** Not yet confirmed. Do not assume Cera Staff/Admin have identical production-transition rights and do not invent a technician role.

**Keywords:** production permission, Cera Staff, Admin

**Source docs:** OPEN_QUESTIONS.md

---

## KB-097 — When does Lab Slip editing lock?

Status: **OPEN**

**Canonical answer:** Not yet confirmed. Current pre-production edits are allowed. Module 4D must define the lock point and any controlled exception.

**Keywords:** edit lock, production start

**Source docs:** OPEN_QUESTIONS.md

---

## KB-098 — Should production history be retained?

Status: **OPEN**

**Canonical answer:** Not yet confirmed. Module 4D must decide whether transitions retain old/new state, actor, timestamp, and reason.

**Keywords:** production history, audit

**Source docs:** OPEN_QUESTIONS.md

---

## KB-099 — What production status should Doctor/Clinic users see?

Status: **OPEN**

**Canonical answer:** Not yet confirmed. Do not automatically expose every internal lab state. Module 4D must define external visibility.

**Keywords:** Doctor production status, Clinic visibility

**Source docs:** OPEN_QUESTIONS.md

---

## KB-100 — What does production 'completed' mean?

Status: **OPEN**

**Canonical answer:** Not yet confirmed. It could mean fabrication complete, quality check complete, ready for pickup/dispatch, or another Cera milestone. Do not tie it to logistics without approval.

**Keywords:** completed, fabrication, quality check

**Source docs:** OPEN_QUESTIONS.md

---

## KB-101 — Is a production assignee required?

Status: **OPEN**

**Canonical answer:** Not yet confirmed. Do not add technician/user/team assignment until the real workflow confirms ownership.

**Keywords:** production assignee, technician

**Source docs:** OPEN_QUESTIONS.md

---

## KB-102 — Should production live on LabSlip or a separate model?

Status: **OPEN**

**Canonical answer:** Not yet decided. Make this architecture choice only after the production lifecycle is understood. Do not create a production module/model prematurely.

**Keywords:** Production model, LabSlip, database

**Source docs:** OPEN_QUESTIONS.md; FOLDER_STRUCTURE.md

---

## KB-103 — Can completed production reopen?

Status: **OPEN**

**Canonical answer:** Not yet confirmed. Align this later with historical integrity and the correction workflow.

**Keywords:** reopen, completed production

**Source docs:** OPEN_QUESTIONS.md

---

## KB-104 — Are production transition notes/reasons required?

Status: **OPEN**

**Canonical answer:** Not yet confirmed. Do not require notes for every transition unless Cera's workflow needs them.

**Keywords:** production reason, transition note

**Source docs:** OPEN_QUESTIONS.md

---

## KB-105 — What are the current private-attachment security rules?

Status: **CONFIRMED**

**Canonical answer:** Supporting attachments are private JPEG/PNG/WEBP/PDF files with size/type/signature validation, resource/state authorization, short-lived signed access, object-key hiding, and uploader-only deletion where applicable. Maximum attachment count is enforced under concurrency with internal database capacity slots. Large raw intraoral scan files remain excluded.

**Keywords:** attachments, private upload, R2, capacity slot, signed URL

**Source docs:** SECURITY_DESIGN.md; DATABASE_DESIGN.md; ARCHITECTURE_DECISIONS.md

## KB-106 — Are correction statuses/rescan/reproduction rules decided?

Status: **DEFERRED**

**Canonical answer:** No. They belong to Module 4F. Confirmed principle only: the original completed case remains historically intact.

**Keywords:** 4F, correction, rescan, reproduction

**Source docs:** OPEN_QUESTIONS.md

---

## KB-107 — Are notification event/recipient/template rules decided?

Status: **DEFERRED**

**Canonical answer:** No. They belong to Module 5. Do not ask during Module 4D unless scope changes.

**Keywords:** Module 5, notifications, WhatsApp

**Source docs:** OPEN_QUESTIONS.md

---

## KB-108 — Is the production hosting provider decided?

Status: **DEFERRED**

**Canonical answer:** No. Do not assume AWS, Oracle, or another provider. Deployment topology belongs to Module 9.

**Keywords:** hosting, AWS, Oracle, deployment

**Source docs:** OPEN_QUESTIONS.md

---

## KB-109 — Where should the chatbot look for project purpose and requirements?

Status: **CONFIRMED**

**Canonical answer:** `docs/project/PROJECT_OVERVIEW.md` and `docs/project/REQUIREMENTS.md`.

**Keywords:** requirements, purpose, scope

**Source docs:** PROJECT_OVERVIEW.md; REQUIREMENTS.md

---

## KB-110 — Where should the chatbot look for business workflow questions?

Status: **CONFIRMED**

**Canonical answer:** `docs/project/BUSINESS_FLOWS.md`.

**Keywords:** workflow, who does what

**Source docs:** BUSINESS_FLOWS.md

---

## KB-111 — Where should the chatbot look for module scope and dependencies?

Status: **CONFIRMED**

**Canonical answer:** `docs/project/MODULE_PLAN.md` and `docs/progress/MODULE_STATUS.md`.

**Keywords:** module, dependency, scope

**Source docs:** MODULE_PLAN.md; MODULE_STATUS.md

---

## KB-112 — Where should the chatbot look for technical design?

Status: **CONFIRMED**

**Canonical answer:** `docs/design/SYSTEM_DESIGN.md`, `FOLDER_STRUCTURE.md`, `DATABASE_DESIGN.md`, `API_DESIGN.md`, `UI_UX_DESIGN.md`, and `SECURITY_DESIGN.md`.

**Keywords:** system, folder, database, API, UI, security

**Source docs:** docs/design/

---

## KB-113 — Where should the chatbot look for locked decisions?

Status: **CONFIRMED**

**Canonical answer:** `docs/decisions/ARCHITECTURE_DECISIONS.md`. Do not reopen accepted ADRs without a concrete problem or changed requirement.

**Keywords:** ADR, locked decision

**Source docs:** ARCHITECTURE_DECISIONS.md

---

## KB-114 — Where should the chatbot look for unresolved decisions?

Status: **CONFIRMED**

**Canonical answer:** `docs/decisions/OPEN_QUESTIONS.md`. Ask only when an open question blocks the current module/checkpoint.

**Keywords:** open questions, unknown

**Source docs:** OPEN_QUESTIONS.md

---

## KB-115 — Where should the chatbot look for current progress and last-session details?

Status: **CONFIRMED**

**Canonical answer:** `docs/progress/MODULE_STATUS.md` and `docs/progress/SESSION_HANDOFF.md`.

**Keywords:** progress, handoff, current module

**Source docs:** MODULE_STATUS.md; SESSION_HANDOFF.md

---

## KB-116 — What should a new chatbot session ask before starting work?

Status: **CONFIRMED**

**Canonical answer:** Do not ask generic project questions. Retrieve this knowledge base, SESSION_HANDOFF, MODULE_STATUS, the current MODULE_PLAN section, and only current-module OPEN_QUESTIONS. Verify dynamic Git state. Ask only unresolved current-module business questions. After approval, request only the source files required for the first implementation checkpoint.

**Keywords:** new chat, RAG, startup, question minimization

**Source docs:** PROJECT_KNOWLEDGE_BASE.md; CHAT_CONTEXT.md

---

## KB-117 — What happens to sessions when a user is disabled?

Status: **CONFIRMED**

**Canonical answer:** Disabling an operational user increments `authVersion` and revokes refresh-session records. Existing access tokens with the old version stop authenticating; re-enabling the user does not restore those old tokens.

**Keywords:** disable user, authVersion, revoke sessions

**Source docs:** SECURITY_DESIGN.md; ARCHITECTURE_DECISIONS.md

---

## KB-118 — Which secret hashes invitation tokens?

Status: **CONFIRMED**

**Canonical answer:** `INVITATION_TOKEN_SECRET`, which must differ from `REFRESH_TOKEN_SECRET`. A temporary legacy hash fallback may remain only for the migration window and should be removed after at least the maximum old invitation lifetime (168 hours / 7 days) after rollout.

**Keywords:** invitation secret, token hash, migration

**Source docs:** SECURITY_DESIGN.md; ARCHITECTURE_DECISIONS.md

---

## KB-119 — How is the attachment count race prevented?

Status: **CONFIRMED**

**Canonical answer:** New attachments reserve an internal `capacitySlot`, and MongoDB enforces a partial unique compound index on parent ID + slot. Concurrent losers recalculate/fail at the configured limit, and any losing uploaded object is cleaned up. Legacy slotless records remain valid and consume capacity.

**Keywords:** attachment race, capacitySlot, concurrency, unique index

**Source docs:** DATABASE_DESIGN.md; ARCHITECTURE_DECISIONS.md

---

# Retrieval Routing Summary

Use this routing order in a new session:

```text
Question arrives
↓
PROJECT_KNOWLEDGE_BASE.md
↓
matching detailed source document
↓
SESSION_HANDOFF.md for latest module delta
↓
OPEN_QUESTIONS.md
↓
current repository/code when implementation-specific
↓
ask user only if still unknown and blocking
```

The goal is **not** to eliminate legitimate business questions. The goal is to eliminate repeated questions whose answers are already documented.
