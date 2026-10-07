# Cera Dental Lab — System Design

## 1. Purpose of This Document

This document defines the current technical system design for the Cera Dental Lab platform.

It explains:

- overall architecture
- major runtime components
- module boundaries
- responsibility boundaries
- data flow
- authentication flow
- authorization model
- shared-code strategy
- error handling
- logging
- testing boundaries
- future infrastructure direction

This document describes the intended system structure.

If implementation differs from this document, the discrepancy must be reviewed rather than silently ignored.

---

## 2. Architecture Style

The project uses a **modular monolith**.

The application is split into business modules inside a single backend application rather than separate microservices.

High-level architecture:

```text
Browser
   │
   ▼
React + Vite
apps/web
   │
   │ HTTPS / REST
   ▼
Express API
apps/api
   │
   ├── Auth
   ├── Users
   ├── Clinics
   ├── Catalogue
   ├── Lab Slips
   ├── Scan Bookings
   └── Future modules
   │
   ├────────► MongoDB
   │
   └────────► Redis / external services where required

packages/shared
   ▲
   │
used by both frontend and backend
```

The modular monolith is intentional.

The project should not be split into microservices without a confirmed need.

---

## 3. Repository-Level Architecture

The monorepo contains three main runtime/code areas:

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
```

### `apps/web`

React frontend responsible for:

- pages
- role-aware UI
- forms
- navigation
- loading/error/empty states
- API calls
- client-side auth state
- local UI state

### `apps/api`

Express backend responsible for:

- authentication
- authorization
- validation
- business rules
- state transitions
- database access
- API responses
- logging
- security enforcement

### `packages/shared`

Shared constants/contracts used by both frontend and backend.

Examples:

- user roles
- user statuses
- Lab Slip statuses
- urgency values
- Scan Booking statuses
- reschedule statuses
- tooth codes

Shared business enums should not be duplicated separately in frontend/backend.

---

## 4. Runtime Request Flow

Typical authenticated request:

```text
User action in browser
↓
React page/component
↓
Frontend API helper
↓
HTTP request to /api/v1/...
↓
Express route
↓
Authentication middleware
↓
Role middleware
↓
Validation middleware
↓
Controller
↓
Service
↓
Mongoose model / database
↓
Serializer
↓
HTTP response
↓
Frontend state/UI update
```

Resource authorization may happen inside services because it often depends on database relationships such as:

- Doctor ownership
- ClinicMembership
- assigned scanning staff
- Lab Slip relationship

---

## 5. Backend Layer Responsibilities

The backend follows a module-oriented pattern.

Typical module:

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

Not every module must use every file, but existing patterns should be followed before introducing alternatives.

---

## 6. Model Layer

Responsibilities:

- define Mongoose schema
- persistence structure
- indexes
- defaults
- enum constraints
- relationships/reference fields
- timestamps

Models should not become the primary location for complex business workflows.

Business transitions generally belong in services.

Examples:

```text
User
Clinic
ClinicMembership
Category
Product
LabSlip
ScanBooking
RefreshToken
```

---

## 7. Validation Schema Layer

Responsibilities:

- validate request body/query input
- reject malformed input
- reject unknown fields where strict behavior is important
- normalize expected types where appropriate

Current validation approach uses Zod.

Examples:

```text
createScanBookingSchema
updateLabSlipSchema
listScanBookingsQuerySchema
```

Validation should happen before business-service execution.

Validation is not a replacement for business-rule checks.

---

## 8. Service Layer

The service layer is the main location for business logic.

Responsibilities include:

- resource authorization
- state transitions
- business invariants
- relationship checks
- data creation/update
- historical integrity
- orchestration across models
- operational errors

Examples:

```text
createLabSlip()
updateLabSlip()
createScanBooking()
assignScanBooking()
requestScanReschedule()
confirmRequestedReschedule()
```

Services should not rely on frontend visibility for permission enforcement.

---

## 9. Controller Layer

Controllers adapt HTTP requests into service calls.

Responsibilities:

- read `req.user`
- read validated params/body/query
- call service
- serialize result
- send status code/response
- pass errors to error middleware

Controllers should remain thin.

Complex business decisions should not be implemented directly in controllers.

---

## 10. Routes Layer

Routes define:

- path
- HTTP method
- authentication requirement
- coarse role authorization
- body/query validation
- controller mapping

Example flow:

```text
POST /api/v1/scan-bookings/:bookingId/reschedule-request
↓
authenticate
↓
authorizeRoles(...)
↓
validateBody(...)
↓
controller
```

Route-level role authorization is coarse-grained.

Resource-level authorization still belongs in services.

---

## 11. Serializer Layer

Serializers define the public API response shape.

Responsibilities:

- expose only intended fields
- normalize related records
- hide internal database fields
- reduce accidental information disclosure
- keep response shape stable

Examples:

- safe user representation
- Scan Booking response
- Lab Slip response

The API should not blindly return entire Mongoose documents.

---

## 12. Middleware Layer

Cross-cutting backend behavior belongs in middleware.

Existing/planned responsibilities include:

- authentication
- role authorization
- request validation
- request ID
- CORS
- Helmet/security headers
- error handling
- rate limiting where appropriate

Middleware should remain generic and reusable.

Business-specific rules should not be hidden inside generic middleware.

---

## 13. Authentication Design

Current authentication architecture:

```text
Login
↓
Verify password
↓
Issue short-lived access JWT
+
Issue rotating opaque refresh token
↓
Store tokens in HttpOnly cookies
```

Current lifetimes:

- access token: 15 minutes
- refresh token: 10 days

Password hashing:

- Argon2id

The browser does not store auth tokens in localStorage/sessionStorage.

---

## 14. Access Token Flow

Access token is short-lived.

Typical request:

```text
Browser request
↓
Access cookie sent
↓
Backend verifies JWT
↓
req.user established
↓
request continues
```

If access token expires:

```text
Frontend API request gets auth failure
↓
single refresh flow begins
↓
refresh token rotated
↓
new access token issued
↓
original request retried
```

Frontend uses a shared/single refresh promise to avoid multiple simultaneous refresh requests.

---

## 15. Refresh Token Design

Refresh tokens are:

- opaque
- rotating
- stored securely
- hashed server-side
- revocable

Replay detection/revocation behavior exists.

Refresh handling must verify that the associated user remains active.

Logout revokes the current refresh session.

---

## 16. Authorization Design

Authorization uses two layers.

### Layer 1 — Role Authorization

Examples:

```text
CERA_ADMIN
CERA_STAFF
DOCTOR
CLINIC_STAFF
SCANNING_STAFF
```

Routes may restrict which roles may attempt an operation.

### Layer 2 — Resource Authorization

The backend checks whether the user may access the specific resource.

Examples:

Doctor:

```text
booking.doctorId === user._id
```

Clinic Staff:

```text
active ClinicMembership exists
```

Scanning Staff:

```text
booking.assignedScanningStaffId === user._id
```

Cera operational roles:

```text
broad operational access according to module rules
```

Resource access failures should avoid exposing unrelated resource details.

---

## 17. Clinic Membership Design

Doctor and Clinic Staff access is scoped using `ClinicMembership`.

Relationships:

```text
User
  │
  └── ClinicMembership
          │
          ▼
        Clinic
```

Doctor may belong to multiple clinics.

Clinic Staff access is restricted to active memberships.

Membership rules are reused in downstream modules such as:

- Lab Slips
- Scan Bookings
- future production workflow

---

## 18. Catalogue Design

Catalogue is separate from historical Lab Slip data.

Current entities:

```text
Category
Product
```

New Lab Slip item selection requires active catalogue data.

Historical integrity is preserved by snapshotting product/category information into Lab Slip items.

This prevents future catalogue edits from rewriting historical case meaning.

---

## 19. Digital Lab Slip Design

The Digital Lab Slip is the central operational case/prescription record.

Conceptual relationships:

```text
LabSlip
├── clinicId
├── doctorId
├── createdByUserId
├── source
├── urgency
├── patient
├── items[]
│   ├── product/category snapshot
│   ├── teeth
│   ├── shade
│   ├── design fields
│   └── notes
└── scanRequired
```

The Lab Slip continues to use its own case status:

```text
SUBMITTED
```

Manufacturing lifecycle is modeled separately through the linked Production entity using `SUBMITTED`, `IN_PRODUCTION`, and `COMPLETED`.

---

## 20. Human Reference Generation

Operational records use human-readable references.

Examples:

```text
CDL-YYYY-000001
SCAN-YYYY-000001
```

Counters are generated atomically to reduce duplicate-reference risk.

Human references are used for operational communication and search.

MongoDB `_id` remains the internal record identity.

---

## 21. Scan Booking Design

Conceptual relationship:

```text
LabSlip
   │
   └── ScanBooking
         ├── clinicId
         ├── doctorId
         ├── requestedStartAt
         ├── proposedStartAt
         ├── confirmedStartAt
         ├── assignedScanningStaffId
         ├── status
         └── rescheduleHistory[]
```

Current booking main states:

- `PENDING_REVIEW`
- `AWAITING_CONFIRMATION`
- `CONFIRMED`
- `ASSIGNED`
- `COMPLETED`
- `REJECTED`
- `CANCELLED`

The backend enforces allowed transitions.

---

## 22. Scan Reschedule Design

Rescheduling is deliberately separate from the main Scan Booking state.

Example:

```text
booking.status = ASSIGNED

booking.rescheduleStatus = REQUESTED
```

This means operational assignment/status remains intact while a new time is negotiated.

Current reschedule states:

- `REQUESTED`
- `AWAITING_CONFIRMATION`

The old `confirmedStartAt` remains active until the reschedule is accepted.

On finalization:

```text
old confirmed time
↓
stored in rescheduleHistory

accepted time
↓
becomes confirmedStartAt

active reschedule fields
↓
cleared
```

Existing scanner assignment remains attached.

---

## 23. Historical Integrity Design

Historical business meaning must not be silently rewritten.

Current examples:

### Lab Slip catalogue snapshots

Historical products/categories remain as originally submitted.

### Terminal Scan Booking urgency

A later Lab Slip urgency change does not rewrite terminal booking history.

### Reschedule history

Accepted schedule changes are retained.

Future production and correction modules must explicitly determine what history needs to be retained.

---

## 24. Frontend Architecture

Frontend responsibilities are organized around:

- pages
- API helpers
- reusable components
- auth state
- local form/UI state
- route definitions
- constants/display helpers

General pattern:

```text
Route
↓
Page
↓
Component(s)
↓
API helper
↓
Backend
```

---

## 25. Frontend Routing

Route definitions live in a dedicated routes module.

They must not be moved into `App.jsx`.

Protected routes use authentication guards.

Role-aware areas use role guards for UX.

Backend remains the real permission authority.

---

## 26. Frontend State Management

Redux Toolkit is used for application-wide state where appropriate, especially authentication/user state.

Local component state is used for:

- forms
- temporary inputs
- modal state
- page-specific UI

Do not put every server response or form field into Redux by default.

RTK Query may be considered later if a real need appears, but should not be introduced without discussion.

---

## 27. Frontend API Client

Frontend API requests are centralized through shared request helpers.

Expected behavior includes:

- base API URL
- credentials/cookies
- consistent JSON handling
- structured error conversion
- access-token refresh/retry

Business-specific endpoint functions live under frontend API modules.

Example:

```text
src/api/scanBookings.js
src/api/labSlips.js
```

---

## 28. Error Handling

Backend errors use structured application errors.

Response pattern:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable message",
    "requestId": "optional"
  }
}
```

Frontend converts API failures into user-facing messages.

Unexpected internal errors should not expose stack traces or sensitive implementation details in production responses.

---

## 29. Success Response Design

Success responses follow:

```json
{
  "success": true,
  "data": {}
}
```

Resource-specific serializers shape the `data` object.

This convention should remain stable across new modules.

---

## 30. Logging Design

Structured logging is used on the backend.

Logging should include useful operational context such as:

- request ID
- route
- method
- status
- application error code
- system failure information

Logging must avoid unnecessary sensitive content.

Do not log:

- passwords
- raw auth tokens
- patient notes
- private attachment content
- unnecessary patient-identifying information

---

## 31. Request IDs

Requests receive a request ID.

Purpose:

- correlate logs
- trace failures
- improve support/debugging

Where relevant, request ID may be returned in error responses.

---

## 32. CORS / Browser Security

The API uses credentialed browser requests.

CORS must be restricted to approved origins.

Production must use HTTPS.

Security headers are provided through Helmet.

Future cross-site request protections such as CSRF must be reviewed as the application evolves.

---

## 33. Input Size / Upload Boundaries

Normal API JSON payloads have constrained size.

Attachments are a separate future module.

Large scan files must not be treated as ordinary website uploads.

Private attachment design must later cover:

- size limits
- type validation
- storage
- access control
- signed URLs
- deletion/retention
- security scanning where needed

---

## 34. Database

Primary database:

- MongoDB

ODM:

- Mongoose

Current local development uses local MongoDB.

The database design should support:

- resource authorization queries
- operational filtering
- human references
- state transitions
- historical integrity

Database details are documented separately in:

`docs/design/DATABASE_DESIGN.md`

---

## 35. Redis

Redis is part of the planned/runtime infrastructure where required by session or future operational features.

Local development should use the project's confirmed local-development setup rather than introducing container requirements unnecessarily.

Exact future Redis use must remain documented and intentional.

---

## 36. External Services

Planned external integrations include:

### WhatsApp Business Cloud API

Preferred external operational notification channel.

### Private object storage

For future supporting attachments.

These are not to be introduced into unrelated modules prematurely.

---

## 37. No Scanner Integration

The intraoral scanner is explicitly **not integrated directly** with the website/application.

Scan data may be handled separately or manually where required.

Typical large scanner output must not be uploaded as ordinary application attachment data.

---

## 38. Testing Architecture

Backend module tests use Vitest.

Frontend tests use Vitest and Testing Library.

Testing strategy includes:

- normal flow
- resource authorization
- role restrictions
- validation
- invalid transitions
- failure cases
- edge cases
- regression checks

Testing is part of every module rather than deferred until final integration.

---

## 39. Security Boundary

The backend is the security boundary.

The frontend may hide actions based on:

- role
- status
- resource state

but this is for UX only.

Every protected action must still be validated by the backend.

Example:

```text
Frontend hides "Assign scanner"
↓
useful UX

Backend checks role + booking state
↓
actual security
```

---

## 40. Module Dependency Direction

Business modules should depend on lower-level established capabilities.

Conceptually:

```text
Foundation
↓
Authentication
↓
Authorization
↓
Users / Clinics / Catalogue
↓
Lab Slips
↓
Scan Bookings
↓
Rescheduling
↓
Production
↓
Corrections / Notifications
```

Avoid circular module dependencies.

If a new dependency is needed, review it explicitly.

---

## 41. Production Module Integration

Module 4D is implemented as a dedicated production capability linked one-to-one with each Lab Slip.

System relationship:

```text
LabSlip
  │
  └── Production
        ├── status
        ├── startedAt
        ├── completedAt
        └── history[]
```

Every newly created Lab Slip atomically creates one Production record in `SUBMITTED`.

Production readiness rules:

- no-scan case: may start after submission
- scan-required case: related Scan Booking must be `COMPLETED`
- scan completion does not automatically start Production

Production transitions are owned by the production module/service.

Forward transitions are available to Cera Admin and Cera Staff. Backward transitions are Admin-only and require a reason.

Lab Slip editing remains a Lab Slip concern, but its service checks linked Production state and locks normal editing once Production reaches `IN_PRODUCTION`. Admin override requires an audited reason.

Doctor/Clinic visibility is intentionally simplified while Cera operational users retain internal wording.

Production does not introduce delivery/logistics, correction, attachment, notification, billing, inventory, or scanner-integration behavior.

---

## 42. Future Correction Module Integration

Correction design must preserve original completed-case history.

Potential approaches include:

- correction entity linked to LabSlip
- separate production cycle
- explicit rescan relationship

No implementation approach should be chosen until business behavior is confirmed.

---

## 43. Deployment Direction

Final deployment design is not yet locked.

Expected production components may include:

```text
Browser
↓
HTTPS
↓
Nginx / reverse proxy
↓
Web frontend
+
API
↓
MongoDB
+
Redis where required
+
private object storage
+
WhatsApp API
```

Infrastructure details belong to the deployment phase.

Do not assume provider, topology, or container layout without confirmation.

---

## 44. Scalability Approach

Current architecture prioritizes simplicity and maintainability.

Scaling should be addressed based on real need.

Likely scale path:

1. optimize queries/indexes
2. add caching where justified
3. move heavy asynchronous work to jobs/queues if needed
4. scale application instances
5. reconsider service boundaries only if operational pressure justifies it

Do not prematurely introduce distributed architecture.

---

## 45. Design Change Rule

Any proposed system-design change must answer:

- What problem does it solve?
- Why does the current design not handle it?
- Which modules are affected?
- Does it change business behavior?
- Does it require migration?
- Does it introduce new dependencies?
- Does it create security implications?
- Does it conflict with an existing architecture decision?

Structural changes must not be made casually during feature implementation.

---

## 46. Current Implemented Boundary

The implemented architecture currently supports:

```text
Authentication
↓
Role authorization
↓
Invitations/users
↓
Clinics/memberships
↓
Catalogue
↓
Digital Lab Slip
↓
Scan Booking
↓
Scan scheduling / assignment / rescheduling / completion
↓
Production queue + lifecycle
↓
Production history
↓
Production-aware Lab Slip edit lock
↓
Doctor/Clinic production visibility
```

Module 4D has been implemented and verified. The current project checkpoint is documentation/Git finalization before beginning Module 4E — Private Attachments.
