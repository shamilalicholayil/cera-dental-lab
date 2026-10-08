# Cera Dental Lab — API Design

## 1. Purpose of This Document

This document defines the API design conventions for the Cera Dental Lab platform.

It explains:

- API base path
- request/response conventions
- authentication behavior
- authorization expectations
- validation
- resource naming
- endpoint structure
- list/detail/action patterns
- error format
- serialization
- pagination/filtering direction
- versioning
- module API ownership

This document is not a full endpoint catalogue.

The current repository remains the technical source of truth for implemented routes.

If an endpoint or workflow is not yet implemented or confirmed, it must not be invented here.

---

# 2. API Style

The backend exposes a REST-style HTTP API.

Base path:

```text
/api/v1
```

The API is consumed primarily by:

```text
apps/web
```

The backend remains the source of truth for:

- authentication
- authorization
- resource access
- state transitions
- validation
- business rules

The frontend must not be trusted to enforce security-sensitive behavior.

---

# 3. API Versioning

Current API version:

```text
v1
```

All operational endpoints should remain under:

```text
/api/v1
```

Example:

```text
/api/v1/auth/login
/api/v1/lab-slips
/api/v1/scan-bookings
```

Do not introduce a new API version without a real compatibility need.

---

# 4. Success Response Format

Successful API responses follow this structure:

```json
{
  "success": true,
  "data": {}
}
```

Examples:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "..."
    }
  }
}
```

or:

```json
{
  "success": true,
  "data": {
    "items": []
  }
}
```

The exact contents of `data` depend on the endpoint.

---

# 5. Error Response Format

Errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "requestId": "optional-request-id"
  }
}
```

The `requestId` may be included to support debugging/log correlation.

Errors should not expose:

- stack traces
- database internals
- secrets
- raw tokens
- unnecessary patient information

in production responses.

---

# 6. HTTP Status Codes

Use status codes according to the request outcome.

Typical usage:

```text
200 OK
→ successful read/update/action

201 Created
→ resource successfully created

204 No Content
→ successful action with no response body where appropriate

400 Bad Request
→ malformed or invalid request input

401 Unauthorized
→ authentication required or invalid

403 Forbidden
→ authenticated user lacks permission

404 Not Found
→ resource not found or intentionally concealed from unauthorized access

409 Conflict
→ business-state conflict or duplicate-condition conflict

422 Unprocessable Entity
→ validation/business-input failure where existing project conventions use it

429 Too Many Requests
→ rate limit exceeded

500 Internal Server Error
→ unexpected server failure
```

Use the existing project convention if a specific module already standardizes a status code differently.

Do not casually change existing API semantics.

---

# 7. Request Content Type

Normal JSON API requests use:

```text
Content-Type: application/json
```

The API should reject malformed JSON consistently.

Future attachment uploads may require multipart handling, but that belongs to the attachment module and must be designed separately.

---

# 8. Authentication Transport

Authentication uses HttpOnly cookies.

The frontend sends authenticated requests with credentials enabled.

The browser must not store access/refresh tokens in:

- localStorage
- sessionStorage

Current authentication design:

```text
access token
→ short-lived JWT
→ HttpOnly cookie

refresh token
→ rotating opaque token
→ HttpOnly cookie
```

---

# 9. Authentication Endpoints

Current authentication API includes concepts such as:

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

Exact current paths should be confirmed against the repository before modification.

---

# 10. Authentication Behavior

Typical flow:

```text
POST login
↓
credentials validated
↓
access cookie issued
↓
refresh cookie issued
↓
safe user returned
```

When access token expires:

```text
API request fails authentication
↓
frontend calls refresh endpoint
↓
refresh token validated/rotated
↓
new access token issued
↓
frontend retries original request
```

Logout:

```text
POST logout
↓
current refresh session revoked
↓
auth cookies cleared
```

---

# 11. Authorization Model

Authorization is layered.

### Route-level role authorization

Used for coarse access.

Example:

```text
only Cera Admin may access user administration endpoint
```

### Resource-level authorization

Used for record-specific access.

Examples:

```text
Doctor may access own permitted Lab Slip

Clinic Staff may access records in active clinic membership

Scanning Staff may access assigned Scan Booking only
```

Resource authorization must be enforced in backend business logic.

---

# 12. Validation

Request validation happens at API boundaries.

Current validation approach:

- Zod

Validation may cover:

- request body
- route params
- query params
- enum values
- date-time syntax
- required fields
- field length
- strict unknown-field rejection where important

Validation does not replace:

- resource authorization
- state checks
- cross-record relationship checks

---

# 13. Resource Naming

Resource paths should use clear plural nouns.

Examples:

```text
/users
/clinics
/categories
/products
/lab-slips
/scan-bookings
```

Use established project/domain names.

Do not rename:

```text
lab-slips
```

to generic alternatives such as:

```text
orders
jobs
work-items
```

without an approved domain change.

---

# 14. Standard CRUD Pattern

Where appropriate, resources may use conventional REST operations:

```text
GET    /resource
GET    /resource/:id
POST   /resource
PATCH  /resource/:id
```

Deletion should not be introduced by default.

For important operational/configuration entities, the project often prefers:

```text
disable / deactivate
```

rather than destructive deletion.

---

# 15. Business Action Endpoints

Workflow transitions should use explicit action endpoints when a plain CRUD update would hide business meaning.

Examples:

```text
POST /scan-bookings/:bookingId/reschedule-request
POST /scan-bookings/:bookingId/reschedule-confirm
POST /scan-bookings/:bookingId/reschedule-propose
POST /scan-bookings/:bookingId/reschedule-accept
```

This style is appropriate when:

- transition rules matter
- roles differ by action
- auditing/history matters
- the action has business meaning beyond field replacement

Do not reduce stateful workflow actions to arbitrary unrestricted PATCH operations.

---

# 16. ID Usage

Internal API routes currently use MongoDB resource IDs where implemented.

Human-readable references such as:

```text
CDL-YYYY-000001
SCAN-YYYY-000001
```

are primarily for:

- display
- search
- operational communication

Do not replace internal identifiers casually.

---

# 17. List Endpoints

List endpoints should support only confirmed operational needs.

Potential query capabilities may include:

- search
- status
- clinic
- doctor
- related resource
- assignment
- date range
- urgency

Do not add filters merely because they might be useful later.

Each filter should be tied to an actual workflow or UI need.

---

# 18. Search Behavior

Current examples include searching Lab Slips by:

- reference
- patient information

Search must respect authorization scope.

Example:

```text
Doctor searches "CDL-..."
↓
query is still restricted to Doctor-accessible records
```

Search must never bypass resource authorization.

---

# 19. Pagination

Pagination should be added where list size requires it.

If pagination is introduced, use one consistent pattern across the API.

Possible response shape:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

This is not a confirmed current global API contract unless already implemented.

Before introducing pagination, inspect existing list endpoints and choose a project-consistent approach.

---

# 20. Sorting

Sort behavior should be explicit.

Examples:

```text
newest Lab Slips first
upcoming Scan Bookings first
catalogue sortOrder ascending
```

Sorting should reflect the actual operational screen.

Do not introduce a generic arbitrary-sort API unless there is a confirmed need.

---

# 21. Date/Time Format

API date-time values should use ISO 8601 strings.

Example:

```text
2026-10-06T12:30:00.000Z
```

The backend persists normalized date values.

The frontend is responsible for displaying dates/times appropriately for the user.

Timezone-sensitive business behavior must be designed carefully rather than inferred from browser locale alone.

---

# 22. User API

User administration API is owned by the users/invitation modules.

Current capability areas include:

- invitation creation
- invitation preview
- invitation acceptance
- invitation revocation
- invitation regeneration
- user listing
- user disable/reactivate

Cera Admin authorization is required for administrative operations.

Exact route paths must follow the current implementation.

---

# 23. Clinic API

Clinic API supports business capabilities such as:

- create clinic
- edit clinic
- disable/reactivate clinic
- list accessible clinics
- manage memberships
- list accessible doctors where required

Cera Admin manages clinic configuration.

Doctor/Clinic Staff access must be scoped by active memberships.

---

# 24. Catalogue API

Catalogue API supports:

- categories
- products
- active catalogue access
- admin management

Admin operations may include:

- create
- edit
- activate/deactivate

Doctor/Clinic Staff/Cera Staff read access should return only catalogue data they are permitted to use.

Scanning Staff should not receive unnecessary catalogue access.

---

# 25. Lab Slip API

Base resource:

```text
/api/v1/lab-slips
```

Current capabilities include:

```text
POST   /lab-slips
GET    /lab-slips
GET    /lab-slips/:labSlipId
PATCH  /lab-slips/:labSlipId
```

Exact implemented routes should be confirmed against the repository.

---

# 26. Create Lab Slip

Create behavior depends on role.

### Doctor

Backend determines/enforces:

- creator
- doctor identity
- permitted clinic membership
- source = portal

### Clinic Staff

Backend enforces:

- permitted clinic
- selected Doctor is valid for that clinic
- source = portal

### Cera Staff / Admin

Backend may allow:

- permitted operational clinic selection
- doctor selection
- offline source such as phone/WhatsApp/paper

The backend must not trust role-sensitive identity fields supplied by the frontend without authorization checks.

---

# 27. Lab Slip Serialization

Lab Slip response should expose only approved fields.

Typical conceptual output may include:

```text
id
reference
source
status
urgency
clinic
doctor
patient
items
notes
scanRequired
createdBy
createdAt
updatedAt
```

Exact response shape belongs to the current serializer.

Do not expose raw Mongoose internals.

---

# 28. Lab Slip Update

Update endpoint:

```text
PATCH /lab-slips/:labSlipId
```

Current editable areas include:

- urgency
- patient
- items
- teeth
- shade
- pontic/design details
- notes

Immutable top-level identity fields must be rejected rather than silently ignored.

Strict validation is preferred for security and predictability.

Future production edit-lock rules must be enforced here once Module 4D is designed.

---

# 29. Scan Booking API

Base resource:

```text
/api/v1/scan-bookings
```

Current API supports capabilities including:

- create scan request
- list accessible bookings
- view booking
- confirm requested time
- propose alternate time
- accept alternate
- reject
- assign scanner
- complete
- cancel
- request reschedule
- confirm reschedule
- propose reschedule
- accept reschedule

Exact route names must be taken from the current repository.

---

# 30. Scan Booking Creation

Creation must validate:

- accessible Lab Slip
- role permission
- duplicate active booking prevention
- requested time format
- business relationship to clinic/doctor

Late scan request may update:

```text
LabSlip.scanRequired = true
```

This behavior is confirmed.

---

# 31. Scan Booking State Actions

Main workflow actions are explicit business transitions.

Conceptually:

```text
PENDING_REVIEW
→ confirm
→ CONFIRMED

PENDING_REVIEW / AWAITING_CONFIRMATION
→ propose
→ AWAITING_CONFIRMATION

AWAITING_CONFIRMATION
→ accept
→ CONFIRMED

PENDING_REVIEW / AWAITING_CONFIRMATION
→ reject
→ REJECTED

CONFIRMED
→ assign
→ ASSIGNED

ASSIGNED
→ complete
→ COMPLETED
```

Cancellation depends on current role/state rules.

The backend must reject invalid transitions even if the frontend does not show the corresponding control.

---

# 32. Reschedule API

Current explicit action endpoints include:

```text
POST /scan-bookings/:bookingId/reschedule-request
POST /scan-bookings/:bookingId/reschedule-confirm
POST /scan-bookings/:bookingId/reschedule-propose
POST /scan-bookings/:bookingId/reschedule-accept
```

Confirmed role behavior:

### Request

Allowed:

- Doctor
- Clinic Staff
- Cera Staff
- Cera Admin

Not allowed:

- Scanning Staff

### Confirm requested reschedule

Allowed:

- Cera Staff
- Cera Admin

### Propose reschedule

Allowed:

- Cera Staff
- Cera Admin

### Accept proposal

Allowed:

- Doctor
- Clinic Staff

Resource authorization still applies.

---

# 33. Scanning Staff Endpoints

Scanning Staff should receive narrow API access.

They may need endpoints/capabilities for:

- list assigned bookings
- view assigned booking
- complete assigned booking

They should not receive general-purpose list/search access to unrelated bookings.

Route ordering must avoid collisions such as:

```text
/:bookingId
```

capturing a special collection endpoint path.

Place specific routes before generic parameter routes where required by Express routing.

---

# 34. Response Serialization by Role

The same resource may expose different information depending on role.

Example:

Scanning Staff Scan Booking response may intentionally omit:

- unnecessary product details
- broader patient/case details
- internal Cera information

Role-specific minimal response design is allowed where required for least privilege.

Do not rely only on frontend hiding.

---

# 35. Error Codes

Business failures should use stable application error codes.

Examples of patterns already used/expected:

```text
AUTH_REQUIRED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
INVALID_STATE
SCAN_RESCHEDULE_PENDING
```

Exact current codes should be taken from the implementation.

When adding a new code:

- use a stable uppercase identifier
- make it business-meaningful
- avoid embedding dynamic data in the code
- provide a human-readable message separately

---

# 36. Not Found vs Forbidden

For sensitive resources, the API may intentionally return a generic not-found-style response instead of revealing that a resource exists but is unauthorized.

This decision should follow existing project behavior.

Do not leak resource existence unnecessarily.

---

# 37. Idempotency / Duplicate Actions

State-changing endpoints should reject repeated invalid actions.

Examples:

```text
Completing an already completed scan
→ reject

Accepting a reschedule that no longer exists
→ reject

Creating a second active Scan Booking
→ reject
```

Where network retry could safely repeat an action, idempotency may be considered later.

Do not introduce general idempotency infrastructure without need.

---

# 38. Concurrency

API services must consider competing state transitions.

Example risk:

```text
two Cera Staff members assign same booking simultaneously
```

or:

```text
reschedule and completion happen nearly together
```

When a module has meaningful concurrency risk, use database/service logic that protects state integrity.

Do not assume the frontend prevents concurrent actions.

---

# 39. Sensitive Fields

API responses must not expose:

- passwordHash
- raw refresh tokens
- token hashes
- invitation token hashes
- internal secrets
- unnecessary patient information

Serializers should explicitly control output.

---

# 40. Logging and API Requests

API request logging should not record sensitive request bodies indiscriminately.

Avoid logging:

- passwords
- auth tokens
- patient notes
- attachment content
- invitation secrets

Request IDs should be used for traceability instead.

---

# 41. API and Frontend Coupling

Frontend pages should consume the API contract rather than backend database documents.

Do not make frontend code depend on:

- MongoDB internals
- Mongoose-specific properties
- hidden backend fields

Serializers create the stable boundary.

---

# 42. Module Ownership

Endpoints belong to the business module that owns the capability.

Examples:

```text
Lab Slip CRUD/editing
→ labSlips module

Scan scheduling/rescheduling
→ scanBookings module

User invitations
→ users/auth invitation module

Catalogue
→ catalogue module
```

Do not create arbitrary generic endpoints if ownership is clear.

---

# 43. Future Production API

Module 4D is not yet designed.

Possible production APIs must not be invented before business rules are approved.

Open decisions include:

- whether production is part of `/lab-slips`
- whether a separate `/production` resource exists
- whether transitions use action endpoints
- whether there is an assignee
- what Doctor/Clinic can see
- what history is returned

Only after Module 4D design should route structure be finalized.

---

# 44. Future Attachment API

Attachment API is not yet designed.

Before implementation, decide:

- owning resource
- upload endpoint
- download/view access
- delete permission
- metadata response
- signed URL behavior
- size/type limits

Do not assume direct public file URLs.

---

# 45. Future Correction API

Correction API is not yet designed.

Do not invent:

```text
/corrections
```

routes until the correction business model is approved.

Required business decisions include:

- creation
- review
- status lifecycle
- rescan/reproduction behavior
- visibility
- historical relationship to the original Lab Slip

---

# 46. Future Notification API

Notification API may eventually support:

- list user notifications
- mark read
- mark all read
- navigate to related resource

However, event and persistence design must be confirmed first.

WhatsApp delivery should not be mixed directly into unrelated request handlers if an asynchronous notification architecture is later needed.

---

# 47. API Documentation Rule

When a new module is completed, its important API behavior should be reflected in this document or dedicated module documentation if needed.

Do not let endpoint behavior exist only in chat history.

At minimum record:

- route purpose
- allowed roles
- important state requirements
- request shape
- response shape
- important error conditions

---

# 48. Manual Development Rule

Because development is chatbot-only and manual copy/paste:

Before modifying routes or API behavior:

1. ask the user for the current relevant route/controller/service/schema files
2. inspect actual code
3. preserve existing endpoint conventions
4. provide exact file paths
5. provide full replacement where scattered edits are risky
6. have the user run backend tests/lint
7. fix failures before proceeding

Do not reconstruct API files from memory if they have not been shown.

---

# 49. API Design Source of Truth

Use this priority:

1. current API implementation
2. confirmed business requirements
3. this API design document
4. system/database/security design
5. architecture decisions
6. module/session context

If current code conflicts with a confirmed requirement, identify the conflict before modifying dependent behavior.

---

# 50. Current API Boundary

Implemented API capability currently reaches through:

```text
Authentication
↓
User invitations/management
↓
Clinics/memberships
↓
Catalogue
↓
Digital Lab Slips
↓
Lab Slip editing
↓
Scan Booking
↓
Scan confirmation/proposal
↓
Scanner assignment
↓
Scan completion
↓
Scan cancellation/rejection
↓
Scan rescheduling
```

The next major API area is:

**Module 4D — Lab Production Workflow**

Its endpoint design must follow approved business rules rather than assumptions.

---

# 31. Module 7 Browser/API Hardening

## Credentialed browser origin

The V1 authenticated browser client is the Cera React frontend. Credentialed CORS is restricted to configured `CLIENT_URL`.

## CSRF

For unsafe methods, the API validates the request `Origin` and requires its normalized origin to exactly match the trusted client origin.

Safe methods:

```text
GET
HEAD
OPTIONS
```

do not require the unsafe-method Origin check.

Rejected unsafe requests use the structured application error code:

```text
CSRF_ORIGIN_REJECTED
```

Future webhook/provider routes must use provider-specific signatures/authentication and explicit narrowly scoped CSRF bypasses.

## Rate limiting

Current targeted abuse protection includes:

- login rate limiting
- invitation preview rate limiting
- invitation accept rate limiting

Do not add a harsh global limiter that could interfere with normal operational use without a concrete requirement.

## Upload preflight

Attachment routes should perform resource/state/count authorization before multipart buffering where the route architecture allows it. File bytes are still validated after parsing before private persistence metadata is accepted.
