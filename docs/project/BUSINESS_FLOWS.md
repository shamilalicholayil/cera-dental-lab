# Cera Dental Lab — Business Flows

## 1. Purpose of This Document

This document defines the confirmed end-to-end business flows for the Cera Dental Lab platform.

It explains how users and operational records move through the system from the business perspective.

This document is not intended to define database schemas, API endpoints, or UI implementation details.

If a flow contains an unresolved business decision, that uncertainty must be recorded explicitly rather than silently assumed.

Unresolved items belong in:

`docs/decisions/OPEN_QUESTIONS.md`

---

# 2. Core Operational Flow

The high-level case flow is:

```text
Doctor / Clinic Staff
        ↓
Digital Lab Slip
        ↓
Scan required?
   ┌────┴────┐
   │         │
  No        Yes
   │         ↓
   │    Scan Booking
   │         ↓
   │    Cera Review
   │         ↓
   │    Confirm / Propose Time
   │         ↓
   │    Assign Scanning Staff
   │         ↓
   │    Scan Completed
   │
   └─────────┬─────────
             ↓
       Lab Production
             ↓
        Case Completed
             ↓
   Correction / Issue if required
```

Production is implemented through completion. The correction stage remains planned and must be designed in Module 4F.

---

# 3. Doctor Flow

## 3.1 Login

Doctor:

```text
Open portal
↓
Enter phone/email + password
↓
Authenticated
↓
Doctor dashboard / portal
```

The Doctor can only access permitted resources.

---

## 3.2 Create Digital Lab Slip

Doctor:

```text
New Lab Slip
↓
Select permitted clinic
↓
Enter patient name
↓
Optional patient reference
↓
Select product(s)
↓
Enter relevant product details
↓
Select teeth where applicable
↓
Enter shade where applicable
↓
Enter pontic/design information where applicable
↓
Add notes if needed
↓
Select urgency
↓
Choose whether Cera scan is required
↓
Submit Lab Slip
```

Important principles:

- The form should minimize doctor effort.
- Only relevant fields should be shown where practical.
- The experience should remain familiar to the physical lab-slip workflow.
- The Doctor must not be able to create a Lab Slip for an unrelated clinic.

---

## 3.3 Doctor — Scan Requested During Lab Slip Creation

If scan is required:

```text
Lab Slip submitted
↓
Doctor provides preferred scan date/time
↓
Scan Booking created
↓
Status: PENDING_REVIEW
↓
Cera reviews request
```

Cera may:

```text
Confirm requested time
        OR
Propose alternate time
        OR
Reject request
```

If confirmed:

```text
Status → CONFIRMED
```

If Cera proposes another time:

```text
Status → AWAITING_CONFIRMATION
↓
Doctor reviews proposed time
↓
Doctor accepts
↓
Status → CONFIRMED
```

---

## 3.4 Doctor — Request Scan Later

A Doctor may originally submit:

```text
scanRequired = false
```

and later decide a scan is needed.

Flow:

```text
Open Lab Slip
↓
Request scan
↓
Select preferred future date/time
↓
Scan Booking created
↓
Lab Slip scanRequired becomes true
↓
Booking enters normal scan-review flow
```

This behavior is already confirmed.

---

## 3.5 Doctor — View Scan Booking

Doctor can view their own accessible scan bookings.

The Doctor may see:

- booking reference
- clinic
- patient reference information
- requested time
- proposed time
- confirmed time
- booking status
- assigned scanning staff where appropriate
- current reschedule information
- reschedule history

Doctor-visible Production status is exposed through accessible Lab Slip detail using the simplified labels `Submitted`, `In Progress`, and `Completed`.

---

## 3.6 Doctor — Reschedule Confirmed Scan

Allowed when Scan Booking main status is:

- `CONFIRMED`
- `ASSIGNED`

Doctor flow:

```text
Open Scan Booking
↓
Request reschedule
↓
Enter preferred future date/time
↓
Enter reason
↓
Reschedule status → REQUESTED
```

Important:

```text
Main booking status remains CONFIRMED or ASSIGNED.
```

The current confirmed appointment remains valid while the request is being reviewed.

Cera may:

```text
Accept requested time
        OR
Propose another time
```

If Cera confirms requested time:

```text
confirmedStartAt updated
↓
reschedule completed
↓
history recorded
```

If Cera proposes another time:

```text
Reschedule status → AWAITING_CONFIRMATION
↓
Doctor reviews proposed time
↓
Doctor accepts
↓
confirmedStartAt updated
↓
history recorded
```

---

## 3.7 Doctor — Cancel Scan

Current rule:

Before Scanning Staff assignment:

```text
Doctor may cancel
```

After booking becomes `ASSIGNED`:

```text
Doctor may not directly cancel
↓
Cera must handle operational cancellation
```

---

## 3.8 Doctor — Lab Slip Editing

While the Lab Slip remains within the currently editable pre-production stage, Doctor may edit permitted fields such as:

- urgency
- patient name/reference
- products/items
- teeth
- shade
- pontic/design details
- design notes
- general notes

Doctor cannot edit identity fields such as:

- Lab Slip reference
- clinic
- doctor
- source
- creator
- created timestamp

Normal Doctor editing locks when linked Production reaches `IN_PRODUCTION` and remains locked for `COMPLETED`.

---

## 3.9 Doctor — Production Flow

Doctor-facing flow:

```text
Lab Slip submitted
↓
Production = Submitted
↓
Cera starts fabrication
↓
Doctor sees In Progress
↓
Cera completes fabrication + final internal check
↓
Doctor sees Completed
```

Doctor cannot mutate Production status.

When Production is `IN_PRODUCTION` or `COMPLETED`, the Doctor cannot edit the Lab Slip.

---

## 3.10 Doctor — Future Correction Flow

Planned:

```text
Completed case
↓
Doctor identifies issue/correction
↓
Doctor raises correction
↓
Cera reviews
↓
Correction handled
```

The original completed case must remain historically intact.

Exact correction states and whether a correction triggers rescan/reproduction are not yet defined.

---

# 4. Clinic / Hospital Staff Flow

Clinic Staff operate similarly to Doctors but are constrained by clinic membership.

---

## 4.1 Login

```text
Clinic Staff login
↓
Authenticated portal
↓
Only permitted clinic resources available
```

---

## 4.2 Create Lab Slip

Clinic Staff:

```text
New Lab Slip
↓
Clinic fixed or selected from permitted clinic(s)
↓
Select permitted Doctor associated with clinic
↓
Enter patient/case information
↓
Select products and required details
↓
Choose scan requirement
↓
Submit
```

Clinic Staff must not create a Lab Slip for:

- an unrelated clinic
- an unrelated Doctor
- resources outside their active clinic membership

---

## 4.3 Clinic Staff — Scan Booking

Clinic Staff may:

- request scan
- view scan bookings for permitted clinic(s)
- accept Cera-proposed alternate times
- request reschedule
- view reschedule status/history
- cancel before assignment under current rule

Clinic Staff must not access unrelated clinic scan bookings.

---

## 4.4 Clinic Staff — Lab Slip Editing

Clinic Staff may edit permitted Lab Slips within their authorized clinic scope and within the current editable state.

The same immutable Lab Slip identity rules apply.

---

## 4.5 Clinic Staff — Production / Corrections

Clinic Staff Production visibility remains limited to clinic-authorized cases.

Clinic Staff see the same simplified Production labels as Doctors:

```text
Submitted
In Progress
Completed
```

Clinic Staff cannot mutate Production status and cannot edit a Lab Slip after Production reaches `IN_PRODUCTION`.

Correction permissions remain deferred to Module 4F.

---

# 5. Cera Staff Flow

Cera Staff are operational users responsible for handling cases.

---

## 5.1 Login

```text
Cera Staff login
↓
Operational portal
```

Cera Staff are not equivalent to Cera Admin for all security/administrative tasks.

They receive broad operational access, not unrestricted security administration.

---

## 5.2 Create Lab Slip From Offline Source

Cera may receive case details through:

- phone
- WhatsApp
- paper

Cera Staff flow:

```text
Receive case details
↓
Create Digital Lab Slip
↓
Select clinic
↓
Select doctor
↓
Enter patient information
↓
Select product(s)
↓
Enter case details
↓
Set source:
PHONE / WHATSAPP / PAPER
↓
Submit
```

This allows offline work to enter the same digital operational system.

---

## 5.3 Review Scan Requests

Cera Staff:

```text
View pending scan requests
↓
Open booking
↓
Review requested date/time
```

Available actions:

```text
Confirm requested time
        OR
Propose alternate time
        OR
Reject request
```

---

## 5.4 Propose Alternate Scan Time

```text
Pending / awaiting booking
↓
Cera chooses future alternate time
↓
Booking status → AWAITING_CONFIRMATION
↓
Doctor / Clinic Staff accepts
↓
Booking status → CONFIRMED
```

---

## 5.5 Assign Scanning Staff

Once booking is confirmed and no unresolved reschedule exists:

```text
Confirmed Scan Booking
↓
Select active Scanning Staff
↓
Assign
↓
Status → ASSIGNED
```

Only active users with Scanning Staff role may be assigned.

---

## 5.6 Cera — Reschedule Scan

For `CONFIRMED` or `ASSIGNED` bookings, Cera may:

### Confirm Doctor/Clinic request

```text
Reschedule requested
↓
Cera accepts requested time
↓
confirmedStartAt updated
↓
history recorded
```

### Propose another time

```text
Reschedule requested
↓
Cera proposes alternate
↓
Doctor/Clinic accepts
↓
confirmedStartAt updated
↓
history recorded
```

### Initiate directly

```text
Confirmed / Assigned booking
↓
Cera proposes new time
↓
Doctor/Clinic accepts
↓
confirmedStartAt updated
↓
history recorded
```

During reschedule negotiation:

- main booking status remains unchanged
- old confirmed time remains operational
- newly confirmed assignment is blocked if booking is not already assigned
- existing assigned Scanning Staff remains assigned

---

## 5.7 Cera — Cancel Assigned Booking

Cera may operationally cancel an assigned booking.

This is necessary because Doctor/Clinic Staff cannot directly cancel once scanning staff assignment has occurred.

---

## 5.8 Cera — Complete Scan

Cera operational users may complete a scan booking where permitted.

Normally the assigned Scanning Staff member is expected to complete their visit.

---

## 5.9 Cera — Production

Cera Staff and Cera Admin operate the forward Production flow:

```text
SUBMITTED
↓
Start Production
↓
IN_PRODUCTION
↓
Complete Production
↓
COMPLETED
```

If the Lab Slip requires scanning:

```text
Scan Booking not COMPLETED
↓
Production start blocked

Scan Booking COMPLETED
↓
Production may be started manually
```

Scan completion does not automatically start Production.

Cera Staff may perform forward transitions only.

Cera Admin may also move Production backward:

```text
COMPLETED → IN_PRODUCTION
IN_PRODUCTION → SUBMITTED
```

A backward reason is mandatory.

Production history remains preserved.

---

# 6. Cera Admin Flow

Cera Admin has administrative responsibilities in addition to broad operational capabilities.

---

## 6.1 User Administration

Cera Admin can:

```text
Create/send invitation
↓
User accepts invitation
↓
Operational account becomes active
```

Admin can also:

- view users
- disable users
- reactivate users
- revoke invitations
- regenerate invitations

---

## 6.2 Clinic Administration

Cera Admin can:

- create clinic/hospital
- edit clinic/hospital
- disable
- reactivate
- assign Doctor memberships
- assign Clinic Staff memberships
- remove active memberships

---

## 6.3 Catalogue Administration

Cera Admin can:

- create/edit categories
- activate/deactivate categories
- create/edit products
- activate/deactivate products
- manage sort order

A category becoming inactive prevents its products from being used for new selections even when a product record itself remains active.

Historical Lab Slips retain their snapshots.

---

## 6.4 Operational Access

Cera Admin may participate in operational Lab Slip and Scan Booking flows where current role rules allow.

Cera Admin has the same forward Production permissions as Cera Staff and additionally owns Admin-only backward transitions and production-lock Lab Slip override capability.

---

# 7. Scanning Staff Flow

Scanning Staff have intentionally narrow access.

---

## 7.1 Login

```text
Scanning Staff login
↓
My Visits / Scans
```

The experience should be mobile-first.

---

## 7.2 View Assigned Visits

Scanning Staff may only view bookings assigned to them.

They should see only the information required to perform the visit.

Examples:

- booking reference
- clinic
- visit date/time
- patient identifying reference needed operationally
- status
- reschedule notice if applicable

They should not receive unnecessary manufacturing/product details.

---

## 7.3 Reschedule Visibility

If an assigned booking has a pending reschedule:

```text
Scanning Staff sees current confirmed visit
+
reschedule-in-progress information
```

Scanning Staff cannot:

- request reschedule
- confirm reschedule
- propose reschedule
- accept reschedule

Reschedule management belongs to Doctor/Clinic/Cera roles.

---

## 7.4 Complete Visit

```text
Assigned visit
↓
Scanning Staff performs scan
↓
Mark scan completed
↓
Booking status → COMPLETED
```

Only the assigned Scanning Staff member may complete their booking through scanning-staff access rules.

---

# 8. Initial Scan Booking State Flow

Current confirmed main state machine:

```text
PENDING_REVIEW
      │
      ├── Cera confirms requested time
      │          ↓
      │      CONFIRMED
      │
      ├── Cera proposes alternate
      │          ↓
      │   AWAITING_CONFIRMATION
      │          │
      │          └── Doctor/Clinic accepts
      │                     ↓
      │                 CONFIRMED
      │
      └── Cera rejects
                 ↓
             REJECTED
```

Then:

```text
CONFIRMED
    ↓
Cera assigns active scanner
    ↓
ASSIGNED
    ↓
Scan completed
    ↓
COMPLETED
```

Cancellation may occur according to role/state rules:

```text
Eligible non-terminal booking
↓
CANCELLED
```

`COMPLETED`, `REJECTED`, and `CANCELLED` are terminal for the current booking workflow.

---

# 9. Scan Reschedule Flow

Reschedule state is separate from main booking state.

Main booking remains:

```text
CONFIRMED
or
ASSIGNED
```

while rescheduling is in progress.

---

## 9.1 Doctor / Clinic Request

```text
CONFIRMED / ASSIGNED
↓
Doctor/Clinic enters new time + reason
↓
Reschedule status → REQUESTED
```

Old confirmed time remains active.

Cera:

```text
REQUESTED
├── confirm requested time
│       ↓
│   reschedule finalized
│
└── propose alternate
        ↓
    AWAITING_CONFIRMATION
        ↓
    Doctor/Clinic accepts
        ↓
    reschedule finalized
```

---

## 9.2 Cera-Initiated Reschedule

```text
CONFIRMED / ASSIGNED
↓
Cera proposes new time
↓
AWAITING_CONFIRMATION
↓
Doctor/Clinic accepts
↓
reschedule finalized
```

---

## 9.3 Reschedule Finalization

When a new time is finalized:

```text
Previous confirmed time
↓
stored in reschedule history

New accepted time
↓
becomes confirmedStartAt

Active reschedule fields
↓
cleared
```

If booking was `ASSIGNED`, the assigned scanner remains assigned.

---

# 10. Lab Slip Edit Flow

Current flow:

```text
Accessible Lab Slip
↓
Status currently allows editing
↓
Authorized user opens Edit
↓
Changes allowed fields
↓
Backend revalidates products/permissions
↓
Save
```

Existing catalog snapshots behave differently from newly selected products:

```text
Existing historical item
↓
snapshot preserved even if product/category later disabled
```

but:

```text
Newly added/replaced product
↓
must currently be active
+
category must currently be active
```

Production will introduce a future edit lock.

The exact point is still open.

---

# 11. Urgency Synchronization Flow

If Lab Slip urgency changes while a Scan Booking is active in one of these states:

- `PENDING_REVIEW`
- `AWAITING_CONFIRMATION`
- `CONFIRMED`
- `ASSIGNED`

then:

```text
Lab Slip urgency changes
↓
Active Scan Booking urgency synchronizes
```

Terminal history:

- `COMPLETED`
- `REJECTED`
- `CANCELLED`

does not change.

This preserves historical accuracy.

---

# 12. Production Flow

Confirmed lifecycle:

```text
Lab Slip submitted
↓
Production SUBMITTED
↓
Readiness check
↓
Cera starts production
↓
IN_PRODUCTION
↓
Cera completes fabrication + final internal check
↓
COMPLETED
```

For scan-required cases:

```text
Scan Booking must be COMPLETED
```

before Production starts.

For non-scan cases, no Scan Booking completion is required.

Doctor and Clinic Staff see:

```text
Submitted
In Progress
Completed
```

Cera operational users see:

```text
Submitted
In Production
Completed
```

Production completion is an internal manufacturing milestone and does not represent delivery.

---

# 13. Future Correction Flow

High-level direction:

```text
Completed case
↓
Doctor/Clinic identifies issue
↓
Raise correction
↓
Cera reviews
↓
Correction handled
```

Confirmed principle:

The original completed case must remain historically intact.

Open questions:

- correction statuses
- approval/rejection
- clarification flow
- rescan behavior
- re-production behavior
- relationship to original Lab Slip
- whether new production records are created

---

# 14. Future Notification Flow

Preferred operational communication:

```text
System event
↓
In-app notification
+
WhatsApp notification where approved
```

Potential events may include:

- scan review outcome
- alternate time proposed
- scan assigned
- reschedule changes
- production progress
- completion
- corrections

No notification event should be implemented until recipients and business behavior are confirmed.

---

# 15. Error / Failure Flow Principle

For any business action:

```text
User initiates action
↓
Backend validates input
↓
Backend checks authentication
↓
Backend checks role
↓
Backend checks resource access
↓
Backend checks current state
↓
Action succeeds
or
structured error returned
```

Frontend must display useful failure feedback.

Frontend-hidden controls do not replace backend checks.

---

# 16. Resource Authorization Principle

Access is determined by the business relationship to the resource.

Examples:

### Doctor

```text
Doctor
↓
Own Lab Slip / own permitted clinic work
```

### Clinic Staff

```text
Clinic Staff
↓
Active clinic membership
↓
Clinic-scoped resources
```

### Cera

```text
Cera operational role
↓
Broad operational resource access
```

### Scanning Staff

```text
Scanning Staff
↓
Assigned Scan Booking only
```

Unauthorized resources should generally not reveal unnecessary existence/details.

---

# 17. Terminology Consistency

Use established domain terminology:

- `Lab Slip`
- `Scan Booking`
- `Reschedule`
- `Clinic Membership`
- `Product`
- `Correction`

Do not casually rename core domain concepts to:

- Order
- Job
- Ticket
- Task

unless a separate domain entity is intentionally introduced and approved.

---

# 18. Flow Change Rule

Any future change to a business flow must be checked against:

- requirements
- module plan
- architecture decisions
- authorization
- existing tests
- downstream modules

If the new behavior conflicts with an existing confirmed flow, the conflict must be explicitly resolved rather than silently changing the implementation.

---

# 19. Current Flow Boundary

Implemented end-to-end flow currently reaches:

```text
Authentication
↓
Clinic membership
↓
Catalogue
↓
Digital Lab Slip
↓
Optional Scan Booking
↓
Scan review
↓
Confirmation / alternate proposal
↓
Scanner assignment
↓
Rescheduling if required
↓
Scan completion
```

The next unimplemented core business area is:

**Lab Production Workflow — Module 4D**
