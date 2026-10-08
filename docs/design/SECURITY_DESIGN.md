# Cera Dental Lab — Security Design

## 1. Purpose of This Document

This document defines the security design principles and confirmed security behavior for the Cera Dental Lab platform.

It covers:

- authentication
- session handling
- password security
- authorization
- resource access
- input validation
- browser security
- token handling
- invitation security
- logging/privacy
- upload security
- rate limiting
- future hardening
- security review requirements for each module

Security is treated as a continuous development responsibility, not something postponed until deployment.

If a security behavior is not yet confirmed, it must not be silently invented.

---

# 2. Security Principles

The project follows these core principles:

1. Backend is the security boundary.
2. Least privilege.
3. Resource-level authorization.
4. Secure defaults.
5. Do not expose more data than needed.
6. Do not trust browser state.
7. Validate all external input.
8. Preserve historical integrity.
9. Never store raw secrets where hashes can be used.
10. Do not log sensitive data unnecessarily.
11. Treat security as part of every module.
12. Ask before weakening an existing control.

---

# 3. Authentication Model

Current authentication architecture:

```text
User submits phone/email + password
↓
Backend verifies credentials
↓
Short-lived access JWT issued
+
Opaque refresh token issued
↓
Both stored in HttpOnly cookies
```

Current lifetimes:

```text
Access token:  15 minutes
Refresh token: 10 days
```

The browser must not store authentication tokens in:

- `localStorage`
- `sessionStorage`
- readable JavaScript cookies

---

# 4. Password Security

Passwords are hashed using:

```text
Argon2id
```

Current project parameters include:

```text
memoryCost: 19456
timeCost: 2
parallelism: 1
```

Password rules currently include:

```text
minimum length: 8 characters
```

Important rules:

- never store plaintext passwords
- never log passwords
- never return password hashes through the API
- never include password hashes in frontend state
- password verification must happen server-side

Any future password-policy changes must be deliberate and documented.

---

# 5. Login Identifiers

Operational users may log in using:

- phone number
- email

Phone number is required for operational accounts.

Email is optional.

V1 is limited to Indian mobile numbers.

The authentication flow should normalize identifiers consistently and avoid revealing unnecessary account-existence information.

---

# 6. Login Failure Behavior

Login failures should not reveal whether:

- the account exists
- the password alone was incorrect

Use generic authentication failure messaging where practical.

This helps reduce account-enumeration risk.

---

# 7. Login Rate Limiting

Login endpoints must be rate-limited.

Purpose:

- reduce brute-force attempts
- reduce credential-stuffing attempts
- reduce abuse

Rate-limit values should remain aligned with the current implementation.

Do not weaken rate limits without a concrete operational reason.

---

# 8. Access Token

The access token is:

- a JWT
- short-lived
- carried via HttpOnly cookie

Current lifetime:

```text
15 minutes
```

The backend verifies:

- signature
- expiry
- expected token claims

Expired/invalid tokens must not authorize access.

---

# 9. Refresh Token

Refresh tokens are:

- opaque
- long-lived relative to access tokens
- rotated
- hashed server-side
- revocable

Current lifetime:

```text
10 days
```

The raw refresh token must never be stored in the database.

Only a secure hash/derived representation should be persisted.

---

# 10. Refresh Token Rotation

Refresh flow:

```text
Valid refresh token
↓
Server verifies stored hash/session
↓
Old refresh token becomes unusable
↓
New refresh token issued
↓
New access token issued
```

This limits the useful lifetime of a stolen refresh token.

---

# 11. Refresh Replay Detection

If an already-rotated/revoked refresh token is replayed, the system must treat it as a security event according to the existing implementation.

Current project behavior includes revoking affected active sessions for the user when replay is detected.

This behavior should not be weakened casually.

---

# 12. User Status During Refresh

A valid refresh token must not restore access for a user who is no longer permitted to use the system.

During refresh, the backend must verify that the user remains active.

Disabled/inactive users must not regain authenticated access through an old refresh session.

---

# 13. Logout Security

Logout must:

- revoke the current refresh session where possible
- clear authentication cookies

Logout should not depend on a still-valid access token if the refresh session can be identified securely.

After logout, the browser should no longer have usable authentication cookies for that session.

---

# 14. Cookie Security

Authentication cookies must be:

```text
HttpOnly
```

Production cookies must use:

```text
Secure
```

Current same-site direction:

```text
SameSite=Lax
```

Current cookie path separation includes:

```text
access cookie
→ /api/v1

refresh cookie
→ /api/v1/auth
```

Cookie settings must be reviewed when production domain/topology is finalized.

---

# 15. HTTPS

Production traffic must use HTTPS.

Do not deploy operational authentication over plain HTTP.

HTTPS protects:

- credentials
- session cookies
- patient/case data
- API responses
- future private attachment access

Local development may use HTTP on localhost.

---

# 16. Authorization Layers

Authorization has two layers.

## 16.1 Role Authorization

Coarse access based on role.

Examples:

```text
Cera Admin
Cera Staff
Doctor
Clinic Staff
Scanning Staff
```

Example:

```text
Only Cera Admin
→ user administration
```

## 16.2 Resource Authorization

Checks whether the authenticated user may access the specific record.

Examples:

```text
Doctor
→ own/permitted Lab Slips

Clinic Staff
→ records in active clinic membership

Scanning Staff
→ assigned Scan Bookings only
```

Role checks alone are not sufficient.

---

# 17. Backend Is the Authorization Source of Truth

Frontend role/status checks are only for UX.

Example:

```text
Frontend hides "Assign scanner"
```

This is useful, but not security.

The backend must independently verify:

- authenticated user
- role
- resource relationship
- current state
- transition permission

Every protected action must remain secure if an attacker calls the API directly.

---

# 18. Resource-Level Authorization

Resource-level access is mandatory for operational records.

Examples:

## Doctor

Doctor access is limited to permitted Doctor-owned/associated records.

## Clinic Staff

Clinic Staff access requires active membership in the relevant clinic.

## Scanning Staff

Scanning Staff access is restricted to bookings assigned to them.

## Cera Staff / Admin

Cera operational access is broader, but remains limited by the responsibilities defined for the role.

Do not assume Cera Staff and Cera Admin are interchangeable for every action.

---

# 19. Least Privilege

Each role should receive only the access necessary for its work.

Examples:

Scanning Staff should not receive:

- user administration
- full catalogue administration
- unrelated Lab Slips
- unrelated scan bookings
- unnecessary manufacturing information

Clinic Staff should not receive:

- unrelated clinic data
- unrelated Doctor work

Doctors should not receive:

- other Doctors' unrelated cases
- internal Cera administration

---

# 20. Resource Existence Leakage

For sensitive resources, avoid revealing that an unauthorized record exists.

Where appropriate, use not-found-style behavior instead of detailed forbidden messages.

Example:

```text
Unauthorized user requests unrelated Lab Slip ID
↓
Do not disclose patient/case details
```

The exact response should follow existing project conventions.

---

# 21. Input Validation

All external input must be validated.

Validation includes:

- body
- route params
- query params
- enums
- string length
- date-time format
- allowed object keys
- IDs

Current validation approach:

```text
Zod
```

Strict schemas should be used where accepting unknown fields could cause ambiguity or privilege problems.

---

# 22. Business Validation

Input validation is not enough.

Services must also validate business rules such as:

- active clinic membership
- product/category active state
- valid booking state transition
- scanner role/status
- duplicate booking restrictions
- Lab Slip ownership
- reschedule eligibility

A syntactically valid request may still be invalid business behavior.

---

# 23. Mass Assignment Prevention

The API must not allow clients to update arbitrary document fields through unrestricted request spreading.

Example risk:

```js
Model.findByIdAndUpdate(id, req.body)
```

without an allowlist.

This can expose fields such as:

- role
- creator
- doctorId
- status
- internal security metadata

Use explicit validated/allowed fields.

---

# 24. Immutable Fields

Important identity/history fields must be protected from normal edits.

Current Lab Slip examples:

- reference
- clinic
- doctor
- source
- creator
- createdAt

Unknown or immutable fields should be rejected where appropriate rather than silently accepted.

---

# 25. State Transition Security

Workflow states must be changed only through permitted transitions.

Example:

```text
PENDING_REVIEW
cannot jump directly to COMPLETED
```

unless explicitly defined.

Transition checks must exist in the backend service.

Frontend button availability does not enforce workflow integrity.

---

# 26. Scan Booking Security

Security-sensitive Scan Booking rules include:

- only authorized roles may request scans
- user must have access to the related Lab Slip
- duplicate active bookings are prevented
- only Cera operational roles may assign scanner
- assigned user must be active Scanning Staff
- Scanning Staff may only complete assigned booking
- invalid state transitions are rejected

---

# 27. Reschedule Security

Current reschedule authorization:

## Request reschedule

Allowed:

- Doctor
- Clinic Staff
- Cera Staff
- Cera Admin

Not allowed:

- Scanning Staff

## Confirm requested reschedule

Allowed:

- Cera Staff
- Cera Admin

## Propose reschedule

Allowed:

- Cera Staff
- Cera Admin

## Accept proposed reschedule

Allowed:

- Doctor
- Clinic Staff

All actions must also pass resource-level authorization and state validation.

---

# 28. Assignment During Reschedule

A new scanner assignment must be blocked while a confirmed booking has an unresolved reschedule.

Purpose:

Avoid assigning a visit whose final timing is still under negotiation.

If a scanner is already assigned, that assignment remains unless Cera changes it explicitly.

---

# 29. Historical Integrity

Security includes protection against unauthorized rewriting of history.

Current examples:

- Lab Slip product/category snapshots
- human references
- terminal Scan Booking history
- reschedule history

Historical records should not be mutated merely to reflect later configuration changes.

Future production/correction modules must explicitly define which fields become immutable.

---

# 30. Invitation Security

Operational account registration is invitation-based.

Invitation security must include:

- random unpredictable token
- server-side hashed token
- expiry
- single use
- revocation
- regeneration behavior

Do not expose stored invitation hashes.

---

# 31. Invitation Enumeration / Abuse

Public invitation preview/accept endpoints should avoid unnecessary information leakage.

Potential future hardening includes:

- rate limiting
- generic failure responses
- dedicated invitation-token hashing secret

These improvements must be evaluated without breaking the existing flow.

---

# 32. User Disable Security

Disabled users must lose operational access.

Security review should cover:

- access token expiry window
- refresh blocking
- refresh-session revocation strategy
- active browser sessions

Current refresh flow checks active status.

A future hardening decision may proactively revoke all refresh sessions immediately when a user is disabled.

---

# 33. Admin Security

Cera Admin has high-impact privileges.

Future hardening should consider:

- MFA
- stronger session controls
- audit events
- sensitive-action confirmation

MFA is not currently implemented.

Do not state that admin MFA exists until it is actually implemented.

---

# 34. CORS

The API uses credentialed browser requests.

CORS must use an explicit approved-origin allowlist.

Do not use unrestricted:

```text
Access-Control-Allow-Origin: *
```

with credentialed operational requests.

Production origins must be configured intentionally.

---

# 35. CSRF

Because authentication uses cookies, CSRF must be considered.

Current same-site cookie behavior reduces some cross-site request risk, but a dedicated CSRF review is still required as production topology and sensitive actions evolve.

Do not assume `SameSite=Lax` alone solves every CSRF case.

A final CSRF mechanism should be selected based on:

- frontend/backend origin relationship
- cookie policy
- deployment domains
- mutating endpoints

---

# 36. Security Headers

The backend uses:

```text
Helmet
```

Security headers should remain enabled unless a specific header conflicts with a confirmed application need.

Any relaxed header should be documented and narrowly scoped.

---

# 37. JSON Body Limits

Request-body size should be constrained.

The project currently uses a limited JSON body size.

Purpose:

- reduce accidental oversized payloads
- reduce abuse
- avoid treating the normal API as file transport

Future file uploads must use dedicated upload rules.

---

# 38. Attachments Security — Future

Private attachments are planned.

Allowed direction:

- JPEG
- PNG
- WEBP
- PDF

Security requirements must include:

- explicit size limit
- MIME/type validation
- extension validation
- private storage
- authorization before access
- unpredictable object keys
- signed/time-limited access where appropriate
- safe download headers
- upload ownership
- delete permission
- retention rules

Raw intraoral scan files are out of scope.

Do not expose public permanent URLs by default.

---

# 39. File Content Safety

Future upload handling should not trust:

- file extension alone
- browser-provided MIME alone

Where needed, inspect file signatures and reject unsupported content.

High-risk file types such as executable/script formats must not be accepted as normal case attachments.

---

# 40. Object Storage Security — Future

Future object storage must be private by default.

Access should be mediated by application authorization and/or signed URLs.

Do not configure a public bucket/container for patient/case attachments merely for convenience.

Exact provider is not yet decided.

---

# 41. Logging Security

Structured logging is required, but logs must avoid sensitive content.

Do not log:

- passwords
- raw access tokens
- raw refresh tokens
- token hashes
- invitation tokens
- patient notes
- attachment contents
- unnecessary patient identifiers

Use identifiers such as:

- requestId
- record ID/reference
- action name
- error code

where appropriate.

---

# 42. Error Handling Security

Unexpected errors should be logged internally.

Production API responses should not expose:

- stack traces
- source paths
- database connection strings
- secrets
- full exception internals

Return a structured safe error instead.

---

# 43. Request IDs

Each request receives a request ID.

Security/operational benefit:

- trace suspicious/failing requests
- correlate frontend reports with backend logs
- investigate production incidents

Request IDs should not themselves contain sensitive data.

---

# 44. Sensitive Data Minimization

Only collect/store/display data necessary for the confirmed workflow.

Current patient data is intentionally limited.

Do not add fields such as:

- diagnosis
- medical history
- government ID
- unrelated contact details

without explicit business need and privacy review.

---

# 45. Frontend Data Exposure

Do not send sensitive fields to the frontend and rely on CSS/hidden elements to protect them.

If a role should not see a field:

```text
backend serializer / endpoint
↓
must avoid exposing it
```

This is particularly important for Scanning Staff.

---

# 46. Browser Storage

Do not store sensitive application/session data in browser persistent storage unless explicitly reviewed.

In particular:

- no auth token in localStorage
- no auth token in sessionStorage

Temporary UI state may use memory/local component state.

Any future persistence of patient/case data in browser storage requires explicit security review.

---

# 47. XSS Prevention

React escapes normal rendered string content by default.

Do not use unsafe raw HTML rendering such as:

```js
dangerouslySetInnerHTML
```

for user-controlled content unless there is a strict sanitization requirement and approved implementation.

Notes and patient-entered text should render as plain text by default.

---

# 48. MongoDB Query Safety

Do not pass untrusted request objects directly into MongoDB queries.

Use:

- validated values
- explicit filters
- allowlisted fields

This reduces query/operator injection risk.

Any query sanitization middleware should complement, not replace, explicit validation.

---

# 49. Object ID Validation

Route/resource IDs should be validated before database use.

Malformed IDs should return a controlled client error/not-found response rather than producing unexpected server failures.

Follow the current project convention consistently.

---

# 50. Rate Limiting

Rate limiting should be applied where abuse risk is meaningful.

High-priority endpoints include:

- login
- invitation preview/accept
- password reset when added
- notification-triggering endpoints if abuse becomes possible

Do not apply extremely restrictive global rate limits that break normal operations.

Rate limiting should be risk-based.

---

# 51. Brute Force / Enumeration

Authentication and public token endpoints should avoid helping attackers discover:

- valid phone numbers
- valid emails
- invitation existence
- internal user state

Use:

- generic failures
- rate limits
- safe status responses

where appropriate.

---

# 52. API Secrets

Secrets must come from environment configuration.

Examples:

- database credentials where applicable
- JWT/signing secrets
- token-hash secrets
- WhatsApp credentials
- object-storage credentials

Do not:

- hard-code secrets
- commit secrets
- expose secrets through frontend Vite variables

Remember:

Any `VITE_*` value is accessible to browser code.

---

# 53. Environment Separation

Use separate environment configuration for:

- local development
- staging if introduced
- production

Production credentials/data must not be reused casually in local development.

Environment-sensitive security settings include:

- cookie `Secure`
- CORS origins
- API URLs
- logging verbosity
- external provider credentials

---

# 54. Dependency Security

Before adding a dependency:

- confirm it is necessary
- check maintenance status
- check whether existing stack already solves the need
- avoid large dependencies for tiny tasks

Dependencies should be kept up to date intentionally.

Security audits should be part of later hardening/deployment review.

---

# 55. Database Access Security — Production

Production database deployment must include proper access controls.

Do not expose MongoDB publicly without need.

Production considerations include:

- authentication
- network restriction
- backups
- least-privileged access
- encrypted transport where supported/required

Exact production topology is not yet locked.

---

# 56. Redis Security — Production

If Redis is used in production:

- do not expose it publicly
- use authentication where appropriate
- restrict network access
- avoid storing sensitive raw values unnecessarily

Exact production Redis configuration is a deployment decision.

---

# 57. WhatsApp Integration Security — Future

Future WhatsApp Business Cloud API integration must protect:

- access tokens
- app secrets
- webhook verification secrets

Webhook requests must be verified according to provider requirements.

Do not trust incoming webhook payloads blindly.

Message logging should avoid unnecessary patient information.

---

# 58. Security for Notifications

Notifications should reveal only the information needed by the recipient.

Avoid placing sensitive patient/case details in:

- push-like previews
- WhatsApp messages
- dashboard banners

unless explicitly required and approved.

Prefer using safe references and directing the user into the authenticated portal when appropriate.

---

# 59. Auditability

The system already stores some action actor IDs/timestamps for operational history.

Future high-impact modules should consider auditability for:

- production transitions
- correction decisions
- admin changes
- scanner assignment
- sensitive configuration changes

Do not create a full audit-log platform unless required, but important state changes should be attributable where business/security needs justify it.

---

# 60. Production Workflow Security — Future

Before Module 4D is implemented, define:

- which roles can start production
- which roles can move each state
- whether backward transitions are permitted
- whether Doctor/Clinic may only view
- when Lab Slip edits become locked
- whether completed production can be reopened
- whether production history is immutable

The chatbot must not invent these permissions.

---

# 61. Correction Workflow Security — Future

Before corrections are implemented, define:

- who can create
- who can review
- who can change status
- what evidence can be attached
- who can view correction data
- whether a correction permits modification of the original case
- rescan/reproduction permissions

Core rule:

The original completed case must remain historically intact.

---

# 62. Security Testing

Every module should include security-oriented tests where relevant.

Examples:

- unauthenticated request rejected
- wrong role rejected
- unrelated Doctor resource rejected
- Clinic Staff outside clinic rejected
- Scanning Staff unrelated booking rejected
- invalid state transition rejected
- immutable field update rejected
- disabled user behavior
- duplicate action rejected

Testing only the happy path is insufficient.

---

# 63. Manual Authorization QA

Before completing a module, manually check relevant role combinations.

Example:

```text
Doctor
✓ own record
✗ another Doctor's record

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

Exact checks depend on the module.

---

# 64. Security Review Per Module

Each module should answer:

```text
Authentication:
Does this require login?

Roles:
Which roles may attempt this?

Resources:
Which records may each role access?

Input:
What must be validated?

State:
Which transitions are valid?

Exposure:
What fields should each role receive?

Abuse:
Could this endpoint be spammed/replayed?

History:
What must remain immutable?

Logging:
What can safely be logged?

Failure:
What information should errors reveal?
```

This review happens before the module is considered complete.

---

# 65. Security Hardening Module

A later dedicated hardening pass is planned.

Potential areas:

- full authorization review
- CSRF implementation/review
- admin MFA
- token/session revocation improvements
- public endpoint rate limiting
- dependency audit
- security headers review
- attachment scanning
- secrets review
- production database/network review
- logging/privacy audit

This later module does not replace security work during feature development.

---

# 66. Incident / Compromise Direction

A production incident plan is not yet fully designed.

Future operational documentation should define procedures for:

- compromised user account
- compromised admin account
- leaked external API secret
- suspicious refresh-token replay
- unauthorized data exposure
- lost device/session revocation
- database backup/restore events

This belongs to production documentation/hardening.

---

# 67. No-Assumption Security Rule

Do not assume that a new role/action is allowed simply because it is convenient.

Do not assume:

- Cera Staff has every Admin permission
- Doctor can edit after production starts
- Clinic Staff can see all Doctor work
- Scanning Staff can reschedule
- completed records can be reopened
- attachments may be public
- new endpoints are safe without rate limiting
- new fields may be exposed to every role

When uncertain:

1. state what is known
2. identify the security-sensitive unknown
3. explain the impact
4. recommend an option if useful
5. ask for confirmation

---

# 68. Manual Chatbot Security Workflow

Because development is chatbot-only:

Before changing security-sensitive code:

1. ask for the current relevant file
2. inspect the actual implementation
3. identify existing middleware/service rules
4. preserve existing protections
5. provide exact code changes
6. run focused security/authorization tests
7. run regression tests
8. review lint/build
9. manually test affected roles

Do not reconstruct auth/authorization files from memory.

---

# 69. Security Source of Truth

Use this priority:

1. current secure implementation
2. confirmed requirements
3. this security design
4. architecture decisions
5. system/API/database design
6. session context

If the implementation conflicts with a confirmed security requirement, stop and resolve the conflict before building dependent behavior.

Never weaken a security control silently.

---

# 70. Current Security Boundary

Implemented security currently includes:

```text
Password hashing
↓
Login rate limiting
↓
Short-lived access JWT
↓
Rotating refresh token
↓
HttpOnly cookies
↓
Refresh replay handling
↓
Role authorization
↓
Resource authorization
↓
Strict validation
↓
State transition enforcement
↓
Least-privilege Scanner access
↓
Structured safe errors
↓
CORS / Helmet
```

The next major security design work will accompany:

**Module 4D — Lab Production Workflow**

Its production permissions and edit-lock rules must be explicitly approved before implementation.

---

# 40. Module 7 Hardening Baseline

Module 7 established the following current security baseline:

## Session invalidation

- access JWTs include the user's `authVersion`
- authentication compares token version to the current user
- disabling a user increments `authVersion` and revokes refresh-session records
- re-enabling does not make old tokens valid again

## Invitation protection

- invitation tokens are hashed with `INVITATION_TOKEN_SECRET`
- invitation and refresh secrets must differ
- preview and accept endpoints are rate-limited
- temporary legacy-hash verification is migration-only

## Browser CSRF / CORS

- credentialed CORS allows the configured React client origin
- unsafe browser methods require an exact normalized `Origin` match to `CLIENT_URL`
- safe methods (`GET`, `HEAD`, `OPTIONS`) bypass the CSRF Origin check
- future webhook/provider endpoints must use provider-specific authentication/signatures and explicitly scoped bypasses

## Private attachments

- authorization/state/count preflight occurs before multipart buffering where possible
- supported files: JPEG, PNG, WEBP, PDF
- declared type/extension and detected file signature are validated
- files remain private and are accessed through short-lived signed URLs
- internal object keys are not exposed in normal API serialization
- deletion is restricted according to resource/uploader/state rules
- database capacity slots prevent concurrent requests from exceeding attachment-count limits

## Workflow integrity

- Production and Correction transitions use atomic expected-state updates
- stale concurrent transitions fail with conflict behavior rather than silently overwriting state

## Logging / privacy

- request logging avoids raw query strings where patient identifiers may appear
- production error/lifecycle logs exclude stack traces and unnecessary raw messages
- logs must not contain passwords, raw tokens, invitation tokens/hashes, patient notes, attachment contents, or unnecessary patient identifiers

## Dependencies / environment

- dependency audit must remain clean before release checkpoints
- Node built-in `--watch` is used instead of the removed vulnerable dev-only nodemon chain
- R2 configuration is centralized through validated environment config
- partial R2 configuration is rejected; production requires complete R2 configuration
- real `.env` files remain untracked

## Deferred

- Cera Admin MFA remains deferred until required
- final HTTPS, reverse-proxy `trust proxy`, Secure/SameSite cookie topology is reviewed in Module 9
