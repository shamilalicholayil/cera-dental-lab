# Cera Dental Lab

Cera Dental Lab is a full-stack web application that digitizes the workflow between dental doctors, clinics/hospitals, Cera Dental Lab staff, and scanning staff.

The system replaces much of the existing phone-call, paper-slip, and manually coordinated workflow with a structured operational portal centered around the **Digital Lab Slip**.

## What the App Does

The application supports the day-to-day workflow required to receive, process, scan, manufacture, and correct dental-lab cases.

The main flow is:

```text
Doctor / Clinic Staff
        ↓
Digital Lab Slip
        ↓
Optional Scan Booking
        ↓
Cera Review / Scheduling
        ↓
Scanning Staff Assignment
        ↓
Scan Completion
        ↓
Lab Production
        ↓
Case Completion
        ↓
Correction / Issue if required
```

Cera staff can also create a Digital Lab Slip when a case starts through an offline channel such as phone, WhatsApp, or paper.

### Main user roles

- **Visitor** — can access the public-facing website.
- **Doctor** — creates and manages permitted lab cases for associated clinics/hospitals.
- **Clinic / Hospital Staff** — works with clinic-related cases within assigned permissions.
- **Cera Admin** — manages users, invitations, clinics, configuration, and broader system administration.
- **Cera Staff** — handles operational lab work, cases, scan scheduling, and production workflows.
- **Scanning Staff** — sees assigned scan visits and the minimum information required to complete them.

### Main implemented features

- Secure authentication with phone/email and password
- Invitation-based operational account creation
- Role-based and resource-level authorization
- Clinic and membership management
- Product catalogue management
- Digital Lab Slip creation and management
- Cera-style tooth selection
- Product/category snapshots on Lab Slips
- Urgency and case-source handling
- Scan booking and scheduling
- Scan rescheduling with history
- Scanning staff assignment
- Lab production workflow
- Private supporting attachments
- Correction / issue workflow
- Production security hardening
- Automated production deployment

### Digital Lab Slip

The Digital Lab Slip is the central case record.

It can capture information such as:

- clinic
- doctor
- patient name
- optional patient reference
- selected products
- product/category snapshots
- tooth selection
- shade
- pontic/design details
- product-specific notes
- general notes
- urgency
- whether Cera scanning is required
- case source

The frontend presents a familiar tooth chart while the backend stores stable quadrant-based tooth codes such as:

```text
UR1-UR8
UL1-UL8
LR1-LR8
LL1-LL8
```

### Scan Booking

A Scan Booking represents a Cera scanning visit linked to a Lab Slip.

The current booking lifecycle includes:

```text
PENDING_REVIEW
AWAITING_CONFIRMATION
CONFIRMED
ASSIGNED
COMPLETED
REJECTED
CANCELLED
```

The flow supports requested appointments, alternate-time proposals, acceptance, assignment, completion, cancellation, rejection, and rescheduling while preserving reschedule history.

### Attachments

Private supporting attachments are stored in Cloudflare R2.

Supported normal attachment types include:

- JPEG
- PNG
- WEBP
- PDF

The normal attachment limit is **10 MiB**.

Raw intraoral scan files are intentionally kept outside normal website attachment storage.

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Redux Toolkit
- React Router
- Vitest

### Backend

- Node.js
- Express
- JavaScript with ES modules
- Mongoose
- Zod
- Argon2id
- REST API under `/api/v1`

### Data and storage

- MongoDB
- MongoDB Atlas in production
- Cloudflare R2 for private attachments

### Infrastructure

- npm workspaces monorepo
- Docker
- Docker Compose
- Nginx
- GitHub Actions
- GitHub Container Registry (GHCR)
- AWS EC2
- HTTPS with Certbot / Let's Encrypt

The application is built as a **modular monolith** rather than a microservice system.

---

## Architecture

### Application architecture

```text
Browser
   ↓
React + Vite
apps/web
   ↓
REST /api/v1
   ↓
Express API
apps/api
   ↓
Mongoose
   ↓
MongoDB
```

Shared business constants and contracts are kept in:

```text
packages/shared
```

This prevents important enums and business values from being duplicated independently in the frontend and backend.

### Production architecture

```text
Internet
   ↓ HTTPS
Host Nginx on AWS EC2
   ↓
127.0.0.1:8080
   ↓
Docker Web / Nginx
   ↓ /api/*
Docker API :4000
   ↓
MongoDB Atlas
Cloudflare R2
```

The API port is not publicly exposed.

---

## Folder Structure

The repository is an npm-workspaces monorepo.

```text
cera-dental-lab/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── api/
│   │       ├── components/
│   │       ├── constants/
│   │       ├── features/
│   │       ├── lib/
│   │       ├── pages/
│   │       └── routes/
│   │
│   └── api/
│       └── src/
│           ├── middleware/
│           ├── modules/
│           └── utils/
│
├── packages/
│   └── shared/
│       └── src/
│
├── docs/
│   ├── project/
│   ├── design/
│   ├── decisions/
│   └── progress/
│
├── docker/
├── .github/
├── compose.production.yml
├── Dockerfile.api
├── Dockerfile.web
├── package.json
└── package-lock.json
```

### `apps/web`

Contains the React frontend.

Important areas include:

- `api/` — frontend API request functions
- `components/` — reusable UI components
- `pages/` — route-level screens
- `routes/` — application route definitions
- `features/` — app-wide feature state such as authentication
- `lib/` — shared frontend infrastructure such as the API client
- `constants/` — frontend-only display/configuration constants

Route definitions are intentionally kept outside `App.jsx`.

### `apps/api`

Contains the Express backend.

The backend is organized primarily by business module.

A typical module follows this shape:

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

Business rules and state transitions primarily belong in the service layer.

### `packages/shared`

Contains business constants and contracts that must stay identical between the frontend and backend, such as:

- user roles
- user statuses
- Lab Slip statuses
- urgency values
- tooth codes
- Scan Booking statuses
- reschedule statuses

### `docs`

Project documentation is split into:

```text
docs/
├── project/     # requirements, overview, plans, business flows
├── design/      # system, database, API, UI/UX, security design
├── decisions/   # architecture decisions and development rules
└── progress/    # module status and session handoff
```

---

## Running the Project Locally

### Prerequisites

Install:

- Node.js 26
- npm
- MongoDB

Cloudflare R2 credentials are also required when testing attachment workflows.

### 1. Clone the repository

```bash
git clone <repository-url>
cd cera-dental-lab
```

### 2. Install dependencies

From the repository root:

```bash
npm install
```

Because the project uses npm workspaces, this installs dependencies for the root, frontend, backend, and shared package.

### 3. Configure the API environment

Create the API environment file from the project's environment template and configure values similar to:

```env
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/cera_dev

JWT_ACCESS_SECRET=replace-with-a-long-random-secret
REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-secret
INVITATION_TOKEN_SECRET=replace-with-another-long-random-secret

JWT_ISSUER=cera-api
JWT_AUDIENCE=cera-web
INVITATION_TTL_HOURS=72

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

Use strong secrets and never commit real environment files.

### 4. Configure the frontend environment

Set the frontend API URL for local development:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

### 5. Start MongoDB

Make sure the local MongoDB server is running and available at:

```text
mongodb://127.0.0.1:27017/cera_dev
```

or update `MONGODB_URI` to match your own development database.

### 6. Start the frontend and backend

From the repository root:

```bash
npm run dev
```

The development services use:

```text
Frontend: http://localhost:5173
API:      http://localhost:4000
```

The API health endpoint is:

```text
http://localhost:4000/api/v1/health
```

### 7. Create an admin account

The project includes an admin creation command:

```bash
npm run create:admin
```

Follow the CLI prompts and use a strong password.

Do not store admin credentials in Git or documentation.

---

## Tests and Quality Checks

Run the API tests:

```bash
npm run test:api
```

Run the frontend tests:

```bash
npm run test:web
```

Run all lint checks:

```bash
npm run lint
```

Or individually:

```bash
npm run lint:web
npm run lint:api
```

Build the production frontend:

```bash
npm run build:web
```

Before the production deployment, the project passed the API tests, frontend tests, lint checks, production web build, Docker image checks, and production Compose integration checks.

---

## Authentication and Security

The production authentication model uses:

- phone number or email + password
- phone number required for operational accounts
- Indian mobile numbers in V1
- 15-minute access JWT
- rotating opaque refresh token
- 10-day refresh-token lifetime
- HttpOnly cookies
- Secure cookies in production
- SameSite=Lax
- Argon2id password hashing

The backend is the authorization source of truth.

Frontend role-based controls improve the user experience, but they are not treated as the security boundary.

The production API is only accessible through the controlled reverse-proxy path and is not directly exposed on port `4000`.

---

## Deployment

Production releases follow this pipeline:

```text
Push to master
   ↓
Production Compose Check
   ↓
Build API + Web images
   ↓
Publish SHA-tagged images to GHCR
   ↓
GitHub Actions SSH deployment to EC2
   ↓
Docker Compose update
   ↓
Health verification
   ↓
Success or rollback
```

Production deployments use exact commit-SHA image tags for traceability.

If a new release fails its deployment health checks, the deployment workflow restores the previous image references and brings the previous release back up.

---

## Current Scope Boundaries

The project intentionally does not include:

- online payments
- payment gateway integration
- billing/accounting ERP
- inventory ERP
- direct intraoral scanner integration
- large raw scan-file storage through the website

Payments continue through Cera's existing offline arrangements.

---

## What I Would Improve With More Time

The core operational application is live, but there are several areas I would improve further.

### 1. Monitoring and error visibility

Add dedicated production monitoring for:

- uptime
- API failures
- application exceptions
- resource usage
- failed background/integration operations

This would make production incidents easier to detect before users report them.

### 2. Backup and recovery documentation

Formally verify and document:

- MongoDB Atlas backup behavior for the selected production tier
- restore procedures
- recovery testing
- Cloudflare R2 retention and recovery expectations

The goal would be to have a tested recovery procedure rather than only relying on provider defaults.

### 3. Centralized log retention

The application already has structured logging and request IDs.

With more time, I would add centralized log storage/search and define a retention policy so production issues can be investigated more easily across deployments.

### 4. Final production domain

The application is currently live through an HTTPS-enabled public IP.

I would move it to the final Cera Dental Lab domain, update `CLIENT_URL`, and make the domain the canonical public origin.

### 5. Stronger administrative security

Future hardening could include:

- admin MFA
- stronger invitation endpoint abuse protection
- proactive refresh-session revocation when a user is disabled
- continued CSRF/security review as the application evolves

### 6. Notification system

The project direction includes:

- in-app notifications
- WhatsApp Business Cloud API notifications

WhatsApp is the preferred external operational notification channel, but the notification modules are still planned rather than part of the current completed feature set.

### 7. Dashboard and workflow refinement

Additional time could be used to improve:

- doctor dashboard visibility
- Cera operations dashboard density and prioritization
- scanning-staff mobile workflow
- status visibility and action guidance
- operational usability based on real production feedback

### 8. Production runbooks and operational QA

I would expand the operational documentation with:

- common troubleshooting steps
- manual rollback procedures
- certificate renewal checks
- production QA checklists
- incident-response steps
- domain migration instructions
