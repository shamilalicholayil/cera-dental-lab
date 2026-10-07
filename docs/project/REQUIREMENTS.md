# Cera Dental Lab — Requirements

## 1. Purpose of This Document

This document defines the confirmed product and business requirements for the Cera Dental Lab platform.

It describes **what the system must support** without prescribing implementation details that belong in system design, database design, API design, or architecture decision documents.

If a requirement is unclear or not yet confirmed, it must not be silently invented. Unresolved items belong in:

`docs/decisions/OPEN_QUESTIONS.md`

---

## 2. Product Goal

The platform must digitize the workflow between doctors, clinics/hospitals, Cera Dental Lab staff, and scanning staff.

The core product principle is:

> Minimum doctor effort, without reducing the quality of information Cera receives.

The system should reduce dependence on phone calls, paper slips, and scattered operational communication while keeping the doctor-facing experience simple and familiar.

---

## 3. User Roles

The system must support these roles:

- Visitor
- Doctor
- Clinic / Hospital Staff
- Cera Admin
- Cera Staff
- Scanning Staff

Each authenticated role must only access functions and records permitted by backend authorization rules.

Frontend visibility alone must never be treated as the security boundary.

---

## 4. Visitor Requirements

Visitors must be able to access the public-facing website without authentication.

The public website is intended to present Cera Dental Lab, its work, services/products, and relevant public information.

Operational portal functions must require authentication.

---

## 5. Authentication Requirements

### 5.1 Login

Operational users must be able to log in using:

- phone number + password, or
- email + password

### 5.2 Phone Number

Every operational account must have a phone number.

V1 supports Indian mobile numbers only.

### 5.3 Email

Email is optional unless a later workflow specifically requires it.

### 5.4 Password

Minimum password length:

- 8 characters

### 5.5 Session Security

The system must use:

- short-lived access tokens
- rotating refresh tokens
- HttpOnly cookies for browser token transport/storage
- secure password hashing

Current confirmed lifetimes:

- access token: 15 minutes
- refresh token: 10 days

### 5.6 Logout

Users must be able to log out.

Logout must invalidate the active refresh session.

---

## 6. User Administration Requirements

### 6.1 Invitations

Cera Admin must be able to invite operational users.

Invitation-based registration must be used instead of unrestricted public operational-account signup.

### 6.2 User Management

Cera Admin must be able to manage operational users.

This includes:

- viewing users
- inviting users
- revoking/regenerating invitations
- disabling users
- reactivating users where permitted

### 6.3 User Status

Operational accounts must support appropriate lifecycle states, including:

- invited
- active
- disabled

Disabled users must not retain operational access.

---

## 7. Clinic Requirements

### 7.1 Clinic Management

Cera Admin must be able to:

- create clinics/hospitals
- edit clinics/hospitals
- disable clinics/hospitals
- reactivate clinics/hospitals

### 7.2 Clinic Memberships

The system must support user-to-clinic memberships.

A Doctor may belong to more than one clinic.

Clinic Staff must be restricted to clinics they are assigned to.

### 7.3 Clinic Access

Doctor:
- may access permitted clinic-related work

Clinic Staff:
- may access only their assigned clinic(s)

Cera Admin / Cera Staff:
- may access clinic data required for operations according to their role

Scanning Staff:
- must not receive general clinic-directory access beyond what is needed for assigned visits

---

## 8. Product Catalogue Requirements

### 8.1 Catalogue Administration

Cera Admin must be able to manage:

- product categories
- products
- active/inactive status
- ordering/sort order
- basic descriptions

### 8.2 Catalogue Visibility

Doctors, Clinic Staff, and Cera Staff must only use active catalogue items for new Lab Slip selections.

Scanning Staff must not require access to the full product catalogue.

### 8.3 Historical Integrity

Submitted Lab Slips must retain product/category snapshot information.

A later catalogue rename or disable must not rewrite historical Lab Slip meaning.

### 8.4 Product Coverage

The Digital Lab Slip must ultimately support all products in Cera's real catalogue.

The system must not invent catalogue items where the official catalogue is unavailable.

---

## 9. Digital Lab Slip Requirements

## 9.1 Core Role

The Digital Lab Slip is the central digital case/prescription record.

It must collect the information Cera needs while keeping doctor input simple.

### 9.2 Creation

A Doctor must be able to create a Digital Lab Slip for permitted clinic work.

Clinic Staff must be able to create Lab Slips within their permitted clinic context and permitted doctor relationship.

Cera Staff / Cera Admin must be able to create Lab Slips for operationally received cases.

### 9.3 Source

The Lab Slip must support source tracking.

Confirmed source values include:

- portal
- phone
- WhatsApp
- paper

### 9.4 Patient Information

A Lab Slip must support:

- patient name
- optional patient reference

The system should not collect unnecessary patient information.

### 9.5 Product Information

A Lab Slip must support one or more selected products/items.

Each item may include product-related details such as:

- selected product
- product/category snapshot
- teeth
- shade
- pontic/design information
- design notes
- other product-specific notes where required

### 9.6 Tooth Selection

The UI must follow the familiar Cera paper-slip tooth arrangement.

The backend uses stable quadrant-based tooth codes.

### 9.7 Notes

A Lab Slip must support:

- item/product-level notes where relevant
- general notes

### 9.8 Urgency

A Lab Slip must support:

- standard
- urgent

Urgent is a request/priority indicator and must not silently imply unconfirmed operational guarantees beyond agreed business rules.

### 9.9 Scan Requirement

A Lab Slip must indicate whether Cera scanning is required.

A scan may also be requested later even if the original Lab Slip was submitted without scanning.

### 9.10 Listing and Detail

Authorized users must be able to:

- list accessible Lab Slips
- search/filter where supported
- open Lab Slip details

### 9.11 Editing

Submitted Lab Slips may currently be edited only within the confirmed pre-production rules.

Editable fields currently include:

- urgency
- patient name/reference
- products/items
- teeth
- shade
- pontic/design information
- design notes
- general notes

Identity fields must remain immutable, including:

- Lab Slip reference
- clinic
- doctor
- source
- creator
- creation timestamp

`scanRequired` is managed through the scan-booking flow rather than normal Lab Slip editing.

### 9.12 Production Edit Lock

The Production edit-lock behavior is defined in Section 12.7.

Normal Lab Slip edits lock when Production reaches `IN_PRODUCTION`.

Only Cera Admin may override the lock, and an audited reason is mandatory.

---

## 10. Scan Booking Requirements

### 10.1 Creation

Authorized Doctor, Clinic Staff, Cera Staff, or Cera Admin users must be able to request a scan for an accessible Lab Slip.

A later scan request must be allowed even when the Lab Slip was originally submitted with scanning disabled.

### 10.2 Requested Time

The scan request must support a preferred future date/time.

### 10.3 Booking Lifecycle

The booking lifecycle currently supports:

- `PENDING_REVIEW`
- `AWAITING_CONFIRMATION`
- `CONFIRMED`
- `ASSIGNED`
- `COMPLETED`
- `REJECTED`
- `CANCELLED`

### 10.4 Cera Review

Cera Staff / Cera Admin must be able to:

- confirm the requested time
- propose an alternate time
- reject an initial request
- assign scanning staff after confirmation
- cancel according to operational rules

### 10.5 Doctor / Clinic Acknowledgement

Doctor / Clinic Staff must be able to accept a Cera-proposed alternate time for accessible bookings.

### 10.6 Scanning Staff Assignment

Only an active Scanning Staff user may be assigned to a scan booking.

Doctors or other roles must not be assignable as scanning staff.

### 10.7 Scanning Staff Access

Scanning Staff must only see bookings assigned to them.

They should receive the minimum information required to perform the visit.

They must not receive unnecessary product/manufacturing information.

### 10.8 Completion

Assigned Scanning Staff must be able to mark their assigned visit completed.

Cera operational users may also complete according to current role rules.

### 10.9 Cancellation

Doctor / Clinic Staff may cancel before scanning staff assignment.

Once a booking is assigned, Doctor / Clinic Staff cannot cancel it directly under the current confirmed rule.

Cera operations may cancel assigned bookings.

### 10.10 Rejection

Cera operational users may reject an initial pending/awaiting scan request.

### 10.11 Duplicate Protection

A Lab Slip must not have more than one active/non-terminal Scan Booking at the same time.

Terminal rejected/cancelled history may allow a later new request.

A completed scan does not automatically imply that a rescan is allowed.

Rescan behavior belongs to future correction/rescan rules and must not be assumed.

---

## 11. Scan Rescheduling Requirements

### 11.1 Allowed Booking States

Rescheduling is allowed for:

- `CONFIRMED`
- `ASSIGNED`

### 11.2 Who Can Request

Current confirmed rule:

- Doctor: yes
- Clinic Staff: yes
- Cera Staff: yes
- Cera Admin: yes
- Scanning Staff: no

### 11.3 Pending Reschedule State

Rescheduling must not change the main booking status.

The booking remains:

- `CONFIRMED`, or
- `ASSIGNED`

while reschedule negotiation is in progress.

### 11.4 Current Appointment Preservation

The existing confirmed appointment remains valid until the new reschedule time is accepted.

### 11.5 Reschedule Flow

The system must support:

Doctor / Clinic / Cera requests new time
→ Cera confirms requested time

or

Doctor / Clinic requests new time
→ Cera proposes alternate
→ Doctor / Clinic accepts

or

Cera proposes a new time directly
→ Doctor / Clinic accepts

### 11.6 Assigned Booking

An assigned scanning staff member remains assigned during rescheduling unless Cera explicitly changes the assignment.

### 11.7 Assignment Protection

A confirmed booking with unresolved reschedule negotiation must not be newly assigned to scanning staff until the reschedule is resolved.

### 11.8 History

Completed reschedule changes must retain history.

Historical entries must not be overwritten by later reschedules.

### 11.9 Scanning Staff Visibility

Scanning Staff may see the current appointment and relevant reschedule information for assigned visits.

They must not receive reschedule-management controls.

---

## 12. Lab Production Requirements

### 12.1 Production Record

Each Lab Slip must have exactly one linked Production record.

New Lab Slip creation must create Production in:

```text
SUBMITTED
```

### 12.2 Production Lifecycle

Supported statuses:

```text
SUBMITTED
IN_PRODUCTION
COMPLETED
```

Forward lifecycle:

```text
SUBMITTED
→ IN_PRODUCTION
→ COMPLETED
```

### 12.3 Production Readiness

For a Lab Slip with no required scan, Production may begin after submission.

For a Lab Slip where scanning is required, the related Scan Booking must be `COMPLETED` before Production may start.

Completing a scan must not automatically start Production.

### 12.4 Forward Permissions

Cera Admin and Cera Staff may:

```text
SUBMITTED → IN_PRODUCTION
IN_PRODUCTION → COMPLETED
```

Doctor, Clinic Staff, and Scanning Staff may not change Production status.

### 12.5 Backward Permissions

Only Cera Admin may perform:

```text
COMPLETED → IN_PRODUCTION
IN_PRODUCTION → SUBMITTED
```

A reason is mandatory.

Direct:

```text
COMPLETED → SUBMITTED
```

must be rejected.

### 12.6 Production History

Every status transition must retain:

- previous status
- new status
- actor
- timestamp
- optional note/reason

Backward transition reasons are mandatory.

### 12.7 Lab Slip Production Edit Lock

Normal Lab Slip editing is allowed while Production remains `SUBMITTED`.

When Production reaches `IN_PRODUCTION` or `COMPLETED`, normal Lab Slip editing is locked.

Cera Admin may intentionally override the lock with a mandatory reason.

The override must be audited.

Cera Staff, Doctor, and Clinic Staff cannot bypass the lock.

### 12.8 Production Visibility

Doctor and Clinic Staff must see simplified production wording:

```text
Submitted
In Progress
Completed
```

Cera Staff and Cera Admin use internal wording:

```text
Submitted
In Production
Completed
```

Scanning Staff do not receive general Production access.

### 12.9 Completion Meaning

Production `COMPLETED` means fabrication and final internal check are complete.

It must not imply delivery, dispatch, or patient handover.

### 12.10 Assignment

V1 does not include a Production assignee.

### 12.11 Out of Scope

Module 4D does not include:

- delivery/logistics
- attachments
- corrections
- notifications
- billing/payments
- inventory
- scanner integration

---

## 13. Attachment Requirements

Attachments are planned.

The system should support private supporting attachments such as:

- JPEG
- PNG
- WEBP
- PDF

Attachments must not be publicly exposed by default.

Large intraoral scan files are outside the website storage workflow.

Direct scanner integration is out of scope.

---

## 14. Correction / Issue Requirements

The system must eventually allow a Doctor/Clinic to raise a correction or issue for a finished product.

The original completed Lab Slip/case must remain historically intact.

Correction workflow details must be explicitly designed before implementation.

Do not assume:

- correction statuses
- who approves corrections
- whether a correction creates a new production cycle
- whether rescanning is required
- whether a new Lab Slip is created

These remain future design decisions unless separately confirmed.

---

## 15. Notification Requirements

Operational notifications should prioritize:

1. WhatsApp
2. In-app notifications
3. Email where useful later

WhatsApp Business Cloud API is the preferred external notification direction.

Notification events, templates, recipients, retry rules, and opt-in requirements must be defined before implementation.

---

## 16. UI/UX Requirements

### 16.1 Doctor

The Doctor experience must be:

- mobile-first
- fast
- low-friction
- familiar
- simple to understand

The Lab Slip should not become a long ERP-style wizard unless business needs require it.

### 16.2 Clinic Staff

Clinic Staff should have a similar operational experience while remaining constrained to permitted clinic/doctor scope.

### 16.3 Cera Operations

Cera operational screens should favor:

- desktop usability
- clear actions
- efficient case handling
- useful information density
- visible status/state

### 16.4 Scanning Staff

Scanning Staff UI should be:

- mobile-first
- focused on assigned visits
- minimal
- easy to use on-site
- limited to necessary visit information

### 16.5 UI States

Each module should include appropriate:

- loading states
- empty states
- validation feedback
- failure/error states
- disabled states
- responsive behavior
- accessibility considerations

---

## 17. Security Requirements

The system must enforce:

- least privilege
- backend authorization
- resource-level access checks
- secure password hashing
- short-lived access tokens
- refresh-token rotation
- secure cookies
- input validation
- safe error responses
- private file access for future attachments
- structured logging without sensitive patient content

Security controls must be continuous throughout development rather than deferred to the end.

---

## 18. API Requirements

The operational API uses:

`/api/v1`

Success responses follow the established pattern:

```json
{
  "success": true,
  "data": {}
}
```

Error responses follow the established pattern:

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

The backend remains the source of truth for permissions and state transitions.

---

## 19. Data Integrity Requirements

The system must preserve operational history where business meaning depends on it.

Examples already confirmed:

- Lab Slip product/category snapshots
- Scan Booking references
- Reschedule history
- immutable Lab Slip identity fields
- append-only Production transition history
- Lab Slip Admin production-lock override audit

Correction history requirements remain deferred to Module 4F and must be explicitly designed rather than assumed.

---

## 20. Scope Exclusions

The following are explicitly outside current scope:

- online payment processing
- payment gateway integration
- billing/accounting
- inventory ERP
- ecommerce/cart
- direct intraoral scanner integration
- large scan-file storage
- arbitrary public operational-account signup

---

## 21. Development Requirements

Development is performed one module at a time.

Each module should include, where relevant:

- confirmed business rules
- backend implementation
- frontend implementation
- authorization
- validation
- failure handling
- edge cases
- automated tests
- manual QA
- lint/build checks
- security review
- cleanup/refactoring

A module must not be considered complete until:

- required tests pass
- lint passes
- build passes
- manual workflow checks pass
- changes are committed
- changes are pushed to GitHub
- working tree is clean

---

## 22. No-Assumption Requirement

If a requirement, permission, workflow transition, field, visibility rule, integration, security behavior, or architecture decision is not clearly established:

1. Check existing documentation.
2. Check current implementation.
3. Check architecture decisions.
4. Check open questions.
5. Ask the user if still unclear.

Do not silently invent a business rule.

Small implementation details may follow existing project conventions only when they do not alter business behavior.
