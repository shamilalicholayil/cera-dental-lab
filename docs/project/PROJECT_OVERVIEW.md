# Cera Dental Lab — Project Overview

## 1. Project Purpose

Cera Dental Lab is building a public website and operational portal to digitize and simplify the workflow between doctors, clinics/hospitals, Cera Dental Lab staff, and scanning staff.

The system is intended to reduce dependence on phone calls, paper slips, and fragmented operational communication while preserving the information Cera needs to manufacture dental products correctly.

The central operational record is the **Digital Lab Slip**.

## 2. Core Product Principle

> Minimum doctor effort, without reducing the quality of information Cera receives.

The doctor-facing workflow should remain familiar, fast, and close to the existing physical lab-slip experience rather than becoming a complex ERP-style form.

## 3. Current Manual Workflow

The current operational flow is broadly:

1. A doctor contacts Cera and provides product/case details.
2. If scanning is required, the doctor requests a scan.
3. Cera scanning staff travel to the clinic or hospital with an intraoral scanner.
4. The patient is scanned.
5. Scan details are sent to Cera separately.
6. Cera begins fabrication.
7. Normal turnaround is approximately 2 days.
8. Urgent work may be completed in approximately 1 day.
9. If a finished product requires correction, the doctor needs a way to raise the issue.

## 4. Main Users

### Visitor

An unauthenticated visitor who can access the public-facing website.

### Doctor

A doctor who can work with one or more clinics/hospitals and create/manage permitted lab cases.

### Clinic / Hospital Staff

Operational staff associated with a clinic or hospital. Their access is limited to permitted clinic-related work.

### Cera Admin

Administrative user with broad system access, including user and configuration management.

### Cera Staff

Internal operational user responsible for handling lab work, case operations, scan scheduling, and related workflows.

### Scanning Staff

Cera personnel who travel to clinics/hospitals for patient scanning. Their access is intentionally limited to assigned scan visits and the minimum information required to perform the visit.

## 5. Core Business Flow

The target operational flow is:

Doctor / Clinic Staff
→ Digital Lab Slip
→ Optional Scan Booking
→ Scan Review / Scheduling
→ Scanning Staff Assignment
→ Scan Completion
→ Lab Production
→ Case Completion
→ Correction / Issue if required

Cera Staff may also create a Digital Lab Slip when a case originates through an offline channel such as phone, WhatsApp, or paper.

## 6. Digital Lab Slip

The Digital Lab Slip is the central case/prescription record.

It is intended to capture the information Cera needs for fabrication while keeping doctor input simple.

Current supported concepts include:

- Clinic
- Doctor
- Patient name
- Optional patient reference
- Product selection
- Product/category snapshots
- Tooth selection
- Shade
- Pontic/design information
- Product-specific notes
- General notes
- Urgency
- Whether Cera scanning is required
- Case source

The system uses the Cera-style tooth-chart experience in the UI while storing stable quadrant-based tooth codes in the backend.

## 7. Tooth Representation

The UI follows the familiar lab-slip layout:

Upper:
`8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8`

Lower:
`8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8`

The backend stores quadrant-based values such as:

- `UR1`–`UR8`
- `UL1`–`UL8`
- `LR1`–`LR8`
- `LL1`–`LL8`

## 8. Scan Booking

A Scan Booking represents a Cera scanning visit associated with a Lab Slip.

The current booking lifecycle supports:

- `PENDING_REVIEW`
- `AWAITING_CONFIRMATION`
- `CONFIRMED`
- `ASSIGNED`
- `COMPLETED`
- `REJECTED`
- `CANCELLED`

The workflow supports:

- Doctor/Clinic scan requests
- Cera review
- Requested-time confirmation
- Alternate-time proposals
- Doctor/Clinic acceptance
- Scanning staff assignment
- Scan completion
- Cancellation/rejection
- Rescheduling of confirmed/assigned visits
- Reschedule history

A reschedule does not replace the current confirmed appointment until the new time is accepted.

If a booking is already assigned, the scanning staff member remains assigned during rescheduling unless Cera explicitly changes that assignment.

## 9. Authentication and Access

Operational accounts use:

- Phone number or email + password for login
- Phone number required for operational accounts
- Email optional
- Indian mobile numbers only in V1

Current authentication architecture:

- Short-lived access JWT
- Access token lifetime: 15 minutes
- Rotating opaque refresh token
- Refresh token lifetime: 10 days
- HttpOnly cookies
- Argon2id password hashing

Authorization is enforced by the backend. Frontend role-based visibility is treated as UX, not as the security boundary.

## 10. Technology Stack

### Frontend

- React
- Vite
- JavaScript
- Redux Toolkit for application-wide client/auth state
- Local component state for local UI/form state

### Backend

- Node.js
- Express
- JavaScript using ES modules
- Modular monolith architecture
- REST API under `/api/v1`

### Data

- MongoDB
- Mongoose
- Redis planned/used where required for session-related infrastructure

### Shared Code

`packages/shared` contains constants and contracts that must remain consistent between frontend and backend.

## 11. Repository Layout

The project is an npm-workspaces monorepo.

Main areas:

- `apps/web` — React frontend
- `apps/api` — Express backend
- `packages/shared` — shared constants/contracts
- `docs` — project, design, decision, and progress documentation

Detailed placement rules are documented separately in `docs/design/FOLDER_STRUCTURE.md`.

## 12. Scope Boundaries

The project intentionally does **not** include:

- Online payments
- Payment gateway integration
- Billing/accounting ERP
- Inventory ERP
- Direct intraoral scanner integration
- Large scan-file storage through the website
- Ecommerce/cart behavior

Doctors continue to pay Cera through existing offline arrangements.

## 13. File / Attachment Direction

Attachments are intended for normal supporting documents/images rather than raw intraoral scan files.

Planned supported private attachment types include:

- JPEG
- PNG
- WEBP
- PDF

Large scan files are handled separately.

## 14. Notifications

Operational notification preference is:

1. WhatsApp
2. In-app notifications
3. Email only where useful or required later

WhatsApp Business Cloud API is the planned primary operational messaging channel.

## 15. UX Direction

### Doctor

- Mobile-first
- Fast
- Familiar
- Minimal typing
- Simple Digital Lab Slip
- Clear status information

### Clinic Staff

- Similar operational experience to Doctor
- Restricted to permitted clinics/doctors

### Cera Operations

- Desktop-oriented
- Higher information density
- Clear operational actions
- Fast case handling

### Scanning Staff

- Mobile-first
- Minimal visit information
- Assigned visits only
- Clear completion actions

## 16. Development Strategy

The project is built module-by-module as vertical slices.

Each module may include:

- business rules
- database/model changes
- backend authorization
- validation
- API endpoints
- frontend UI
- responsive states
- automated tests
- manual tests
- security checks
- refactoring
- error handling
- logging
- build/lint verification

A module is completed, tested, committed, and pushed to GitHub before the next module begins.

## 17. Current Development Status

Completed implementation modules:

- Module 0 — Foundation
- Module 1A — User + Password
- Module 1B — Login
- Module 1C — Persistent Authentication
- Module 1D — Logout
- Module 2A — Role Authorization
- Module 2B — Invitations / User Management
- Module 3A — Clinics / Memberships
- Module 3B — Product Catalogue
- Module 4A — Digital Lab Slip
- Module 4B — Scan Booking + Lab Slip Editing
- Module 4C — Scan Rescheduling
- Module 4D — Lab Production Workflow
- Module 4E — Private Attachments
- Module 4F — Corrections / Issues
- Module 5A — In-App Notifications
- Module 5B — WhatsApp Notifications
- Module 6A — Doctor Dashboard Refinement
- Module 6B — Cera Operations Dashboard
- Module 6C — Scanning Staff Mobile Refinement
- Module 7 — Security & Cross-Module Hardening

Next planned module:

- Module 8 — End-to-End Regression Testing

Module 7 has passed the full test/lint/build/dependency-audit checkpoint. Detailed status is maintained in `docs/progress/MODULE_STATUS.md`.

## 18. Important Terminology

### Digital Lab Slip

The central digital prescription/case record used by Cera to understand and manufacture the requested work.

### Scan Booking

A request/appointment for Cera scanning staff to visit a clinic or hospital and perform an intraoral scan.

### Product

A Cera catalogue item that can be selected on a Digital Lab Slip.

### Correction

A future issue/change request relating to a finished product that requires Cera attention.

### Case

A general business term that may refer to the work represented by a Digital Lab Slip. In code and APIs, established domain names such as `LabSlip` should remain authoritative.

## 19. Source of Truth

For implementation decisions, use this priority:

1. Current repository/code
2. Confirmed project requirements and design documents
3. Architecture decisions
4. Module status and session handoff
5. Git history
6. Chat context/memory

If a business rule is not clearly established, it must be treated as an open question rather than assumed.
