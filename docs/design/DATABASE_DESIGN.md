# Cera Dental Lab — Database Design

## 1. Purpose of This Document

This document defines the current database design for the Cera Dental Lab platform.

It explains:

- major entities
- relationships
- persistence responsibilities
- historical-data rules
- indexing direction
- reference strategy
- authorization-related relationships
- current implemented schema concepts
- future database decisions that must remain open until their modules are designed

This document describes confirmed design direction only.

If an entity, field, relationship, or lifecycle is not yet confirmed, it must not be invented here.

---

# 2. Database Technology

Primary database:

- MongoDB

ODM:

- Mongoose

Current development database:

```text
mongodb://127.0.0.1:27017/cera_dev
```

The application uses MongoDB documents and references in a modular-monolith architecture.

---

# 3. Database Design Principles

The database design follows these principles:

1. Preserve historical business meaning.
2. Use references for live relationships.
3. Use snapshots when historical values must not change.
4. Support resource-level authorization queries.
5. Support operational filtering and search.
6. Avoid storing unnecessary patient information.
7. Avoid introducing fields without confirmed business purpose.
8. Keep state transitions enforceable by backend services.
9. Use indexes where they support uniqueness, lookup, filtering, or operational performance.
10. Consider migration/backfill impact before changing persisted structures.

---

# 4. High-Level Entity Relationship View

Current implemented business relationships are approximately:

```text
User
  │
  ├───────────────┐
  │               │
  ▼               ▼
ClinicMembership  RefreshToken
  │
  ▼
Clinic

Category
  │
  ▼
Product

Clinic + Doctor + Creator
          │
          ▼
        LabSlip
          │
          ▼
      ScanBooking
          │
          ├── assigned Scanning Staff
          └── rescheduleHistory[]
```

Future entities may include:

```text
Production / Production history
Attachments
Corrections
Notifications
```

These must not be designed prematurely before their business rules are approved.

---

# 5. User

The `User` entity represents authenticated operational accounts.

Known concepts include:

```text
User
├── name
├── phone
├── email
├── passwordHash
├── role
├── status
├── lastLoginAt
└── timestamps
```

Important rules:

- phone is required for operational accounts
- email is optional
- password is stored only as a secure hash
- role controls coarse permissions
- status controls whether operational access is active

Confirmed user statuses include:

- `INVITED`
- `ACTIVE`
- `DISABLED`

Confirmed roles include:

- Doctor
- Clinic Staff
- Cera Admin
- Cera Staff
- Scanning Staff

The exact enum constants are defined in the shared package.

---

# 6. Refresh Token

The refresh-token persistence model supports secure rotating sessions.

Conceptual fields include:

```text
RefreshToken
├── userId
├── tokenHash
├── expiresAt
├── revokedAt / revocation state
├── rotation / replay-related metadata
└── timestamps
```

Important rules:

- raw refresh tokens must not be stored
- token hashes are stored server-side
- refresh tokens are revocable
- replay handling may revoke active sessions
- inactive users must not retain usable refresh sessions

Exact fields should remain aligned with the current implementation.

---

# 7. Invitation

The user-invitation workflow persists invitation-related state.

Conceptually, invitation data supports:

- invited user/account relationship
- secure invitation token hash
- expiry
- single-use behavior
- revocation/regeneration
- invitation state

Important rules:

- invitation tokens should not be stored in raw form
- invitation lifecycle must preserve security behavior
- public operational signup is not allowed

Exact storage structure must follow the current implementation.

---

# 8. Clinic

The `Clinic` entity represents a clinic or hospital.

Conceptual fields include:

```text
Clinic
├── name
├── type
├── address / contact information as confirmed
├── status
└── timestamps
```

Confirmed behavior:

- Cera Admin can create/edit clinics
- clinics may be disabled/reactivated
- operational access depends on active relationships

Exact clinic fields should follow the existing model.

---

# 9. ClinicMembership

`ClinicMembership` represents the relationship between a user and a clinic.

Conceptual structure:

```text
ClinicMembership
├── userId
├── clinicId
├── active
└── timestamps
```

Primary purposes:

- Doctor-to-clinic relationships
- Clinic Staff-to-clinic relationships
- resource authorization
- accessible-clinic queries

Important rules:

- Doctor may belong to multiple clinics
- Clinic Staff access is limited to active memberships
- membership removal is handled as an inactive/soft relationship rather than destructive history where applicable

Typical authorization query:

```text
userId = current user
clinicId = requested clinic
active = true
```

---

# 10. Category

The `Category` entity groups Cera products.

Known concepts include:

```text
Category
├── name
├── slug
├── description
├── status
├── sortOrder
└── timestamps
```

Confirmed category behavior:

- stable slug behavior
- active/inactive status
- sort order
- disabling a category hides its active child products from new selection
- category disable does not rewrite historical Lab Slip snapshots

---

# 11. Product

The `Product` entity represents an item in Cera's catalogue.

Known concepts include:

```text
Product
├── categoryId
├── name
├── slug
├── shortDescription
├── status
├── publicVisible
├── sortOrder
└── timestamps
```

Important rules:

- new Lab Slip selections require active products
- product category must also be active for new selection
- disabled products may still appear in historical Lab Slip snapshots
- official product data must not be invented

---

# 12. Lab Slip

The `LabSlip` entity is the central operational case/prescription record.

Conceptual structure:

```text
LabSlip
├── reference
├── source
├── status
├── urgency
├── clinicId
├── doctorId
├── patient
│   ├── name
│   └── reference
├── items[]
│   ├── productId
│   ├── productName snapshot
│   ├── categoryId
│   ├── categoryName snapshot
│   ├── teeth[]
│   ├── shade
│   ├── ponticDesign
│   ├── designNotes
│   └── other confirmed item fields
├── notes
├── scanRequired
├── createdByUserId
└── timestamps
```

Current confirmed Lab Slip status:

```text
SUBMITTED
```

A production lifecycle has not yet been added.

Do not add production statuses until Module 4D is designed and approved.

---

# 13. Lab Slip Human Reference

Lab Slips use human-readable references such as:

```text
CDL-YYYY-000001
```

Reference generation uses an atomic sequence/counter approach.

Purpose:

- easier operational communication
- easier search
- stable external reference

MongoDB `_id` remains the internal identifier.

---

# 14. Lab Slip Source

Confirmed source values include:

- `PORTAL`
- `PHONE`
- `WHATSAPP`
- `PAPER`

Purpose:

Track how the case entered Cera's workflow.

This field is part of the Lab Slip's historical identity and is not normally editable after submission.

---

# 15. Lab Slip Patient Data

Current patient structure is intentionally minimal:

```text
patient
├── name
└── reference
```

Design principle:

> Do not collect more patient data than the business workflow requires.

Any future patient field must have a confirmed operational need before being added.

---

# 16. Lab Slip Items and Snapshot Strategy

Lab Slip items contain both references and snapshots.

Conceptually:

```text
item
├── productId
├── categoryId
├── productName snapshot
├── categoryName snapshot
└── case-specific fields
```

Reason:

The catalogue may change after a Lab Slip is submitted.

Without snapshots:

```text
Product renamed later
↓
Historical Lab Slip meaning changes
```

With snapshots:

```text
Historical Lab Slip
↓
retains original product/category meaning
```

This historical integrity rule is already confirmed.

---

# 17. Existing vs Newly Selected Catalogue Items During Edit

When editing a submitted Lab Slip:

### Existing item

If the product already exists in the Lab Slip:

- stored snapshot may be retained
- later catalogue disable does not invalidate the historical item

### Newly added or replaced item

The selected product must currently be:

- active
- under an active category

This distinction is intentional.

---

# 18. Tooth Storage

The backend stores tooth selections using quadrant codes.

Examples:

```text
UR1
UR2
...
UR8

UL1
...
UL8

LR1
...
LR8

LL1
...
LL8
```

The UI may present familiar numbers `1–8`, but persistence uses unambiguous quadrant values.

This prevents ambiguity between left/right and upper/lower positions.

---

# 19. Lab Slip Editing and Identity Fields

Currently editable fields include:

- urgency
- patient name/reference
- items
- teeth
- shade
- pontic/design information
- design notes
- general notes

Identity fields remain immutable:

- reference
- clinic
- doctor
- source
- creator
- createdAt

`scanRequired` is managed through scan-booking behavior rather than normal Lab Slip editing.

The future production edit-lock point remains an open Module 4D decision.

---

# 20. Scan Booking

The `ScanBooking` entity represents a Cera scan visit related to a Lab Slip.

Conceptual structure:

```text
ScanBooking
├── reference
├── labSlipId
├── clinicId
├── doctorId
├── urgency
├── status
├── requestedStartAt
├── proposedStartAt
├── confirmedStartAt
├── assignedScanningStaffId
├── rejectionReason
├── cancellationReason
├── requestedByUserId
├── reviewedByUserId
├── assignedByUserId
├── completedByUserId
├── rejectedByUserId
├── cancelledByUserId
├── completedAt
├── reschedule...
├── rescheduleHistory[]
└── timestamps
```

Exact field names must remain aligned with the current implementation.

---

# 21. Scan Booking Human Reference

Scan Bookings use human-readable references such as:

```text
SCAN-YYYY-000001
```

Reference generation uses an atomic sequence/counter pattern.

---

# 22. Scan Booking Main Status

Confirmed main states:

- `PENDING_REVIEW`
- `AWAITING_CONFIRMATION`
- `CONFIRMED`
- `ASSIGNED`
- `COMPLETED`
- `REJECTED`
- `CANCELLED`

These values are shared between frontend and backend through `packages/shared`.

State transitions are enforced in the backend service layer.

---

# 23. Scan Booking Relationship Duplication

Scan Booking stores:

- `labSlipId`
- `clinicId`
- `doctorId`

Although clinic and doctor can also be reached through the Lab Slip, storing them on the booking supports:

- authorization queries
- operational filtering
- simpler listing
- scan-specific historical context

This duplication is intentional only where it serves confirmed operational behavior.

---

# 24. Scan Booking Urgency

Scan Booking stores urgency.

Current rule:

When Lab Slip urgency changes, urgency synchronizes to active Scan Bookings in:

- `PENDING_REVIEW`
- `AWAITING_CONFIRMATION`
- `CONFIRMED`
- `ASSIGNED`

Terminal history remains unchanged:

- `COMPLETED`
- `REJECTED`
- `CANCELLED`

This preserves historical accuracy.

---

# 25. Scan Booking Duplicate Protection

A Lab Slip must not have more than one active/non-terminal Scan Booking.

The service checks for an existing booking whose state is not considered ended for new-request purposes.

Current terminal cases that allow a later new request include:

- `REJECTED`
- `CANCELLED`

Completed-booking rescan behavior is intentionally not treated as a normal new scan request.

Rescan rules belong to future correction/rescan design.

---

# 26. Reschedule Active Fields

Scan Booking contains active reschedule negotiation fields conceptually like:

```text
rescheduleStatus
rescheduleRequestedStartAt
rescheduleProposedStartAt
rescheduleReason
rescheduleRequestedByUserId
rescheduleReviewedByUserId
rescheduleRequestedAt
```

Current reschedule states:

- `REQUESTED`
- `AWAITING_CONFIRMATION`

The main Scan Booking status remains `CONFIRMED` or `ASSIGNED`.

---

# 27. Reschedule History

Completed schedule changes are stored in `rescheduleHistory[]`.

Conceptually each history entry contains:

```text
previousConfirmedStartAt
requestedStartAt
proposedStartAt
confirmedStartAt
requestedByUserId
reviewedByUserId
reason
requestedAt
confirmedAt
```

Important rule:

History must not be overwritten by later reschedules.

---

# 28. Assigned Scanning Staff

`assignedScanningStaffId` references a `User`.

Assignment is valid only when the target user is:

- role = Scanning Staff
- status = Active

Assigned booking access for Scanning Staff is scoped through this relationship.

---

# 29. Scan Completion

Completion persists:

- status = `COMPLETED`
- completed timestamp
- completing user reference

Exact fields follow the current implementation.

Completed bookings are treated as historical records.

---

# 30. Counters / Sequences

Human references use sequence/counter collections/models.

Known examples:

```text
Lab Slip counter
Scan Booking counter
```

Counter generation should remain atomic to reduce duplicate references.

Future entities that need human references may use the same pattern only if their business requirements justify it.

---

# 31. Indexing Strategy

Indexes should be added for real lookup/filter/uniqueness needs.

Current/common examples include:

- unique human reference
- foreign-key-like ObjectId references
- status
- confirmed/requested date fields where operational listing needs them
- assignedScanningStaffId
- userId / clinicId in membership queries

Indexes should not be added blindly.

Before introducing a new index, consider:

- query pattern
- selectivity
- write cost
- compound ordering
- uniqueness needs

---

# 32. Authorization-Oriented Queries

Database shape must support efficient resource authorization.

Examples:

### Doctor Scan Booking

```text
doctorId = current user
```

### Clinic Staff

```text
ClinicMembership:
userId = current user
active = true

then:
booking.clinicId in accessible clinicIds
```

### Scanning Staff

```text
assignedScanningStaffId = current user
```

These relationships are part of the security model.

---

# 33. Soft Disable vs Deletion

Current design favors disabling/deactivating important operational records rather than destructive deletion where history matters.

Examples:

- User disabled
- Clinic disabled
- Product/category inactive
- ClinicMembership inactive

Historical Lab Slips and Scan Bookings must remain meaningful even when related configuration records later become inactive.

---

# 34. Timestamps

Operational entities use timestamps where appropriate.

Typical fields:

```text
createdAt
updatedAt
```

Workflow-specific timestamps may also exist, such as:

```text
lastLoginAt
completedAt
rescheduleRequestedAt
confirmedAt
```

Do not add timestamps without a clear business/debugging need.

---

# 35. Data Retention

A full retention policy has not yet been confirmed.

Do not assume automatic deletion of:

- Lab Slips
- Scan Bookings
- reschedule history
- completed operational records
- corrections
- attachments

Retention requirements should be explicitly designed before destructive lifecycle behavior is introduced.

---

# 36. Attachments — Future Design

Attachments are not yet implemented.

Future attachment persistence must decide:

- metadata model
- owner entity
- object-storage key
- original file name
- content type
- size
- uploader
- timestamps
- access policy
- deletion/retention rules

Large raw intraoral scan files are outside normal attachment storage.

Do not create attachment collections/schema before Module 4E design.

---

# 37. Production — Future Database Design

Production workflow is the next major open area.

Before persistence is designed, the project must decide whether production state belongs:

### Option A

Directly on `LabSlip`

or

### Option B

In a separate production entity linked to `LabSlip`

This must not be assumed.

Required business decisions include:

- production states
- production history
- assignment/ownership
- timestamps
- readiness
- completion
- edit lock
- backward transitions

Only after those decisions should database structure be chosen.

---

# 38. Corrections — Future Database Design

Correction workflow is planned but not yet modeled.

Possible future relationship:

```text
LabSlip
   │
   └── Correction
```

However, the actual model depends on decisions such as:

- whether correction is a separate case
- whether it creates a new production cycle
- whether rescanning is required
- whether correction history is immutable
- whether multiple corrections may exist per completed case

Do not create correction schema before Module 4F design.

---

# 39. Notifications — Future Database Design

Notification persistence is not yet designed.

Potential concerns include:

- recipient
- event type
- read/unread
- related resource
- delivery channel
- delivery status
- retry metadata

No notification collection/schema should be assumed before Module 5 design.

---

# 40. Private File Storage

Binary file contents should not be stored directly in MongoDB by default for planned supporting attachments.

Future direction is external private object storage with database metadata/references.

Exact provider and signed-access design remain undecided.

GridFS is not currently the chosen direction.

---

# 41. Transactions

Current implementation does not rely on full MongoDB transaction usage for every cross-model operation.

Some workflows are currently non-transactional.

Example:

```text
late scan request
↓
LabSlip.scanRequired may be updated
↓
ScanBooking created
```

If one step fails after another succeeds, partial state is theoretically possible.

More advanced transactionality may be introduced where a confirmed business risk justifies it.

Do not add transaction complexity everywhere without need.

---

# 42. Concurrency

Concurrency-sensitive operations should use atomic database behavior where required.

Confirmed example:

- human-reference sequence generation

Future state-transition concurrency issues should be evaluated per module.

If two users may perform competing transitions, the service/database design should prevent invalid final state.

---

# 43. Validation vs Database Constraints

Both layers have different responsibilities.

### Validation layer

Checks:

- request format
- required fields
- string length
- enum input
- date-time syntax

### Database/model layer

Checks:

- persistence types
- enum constraints
- uniqueness
- indexes
- defaults

### Service layer

Checks:

- business permission
- current state
- cross-record relationships
- allowed transition
- active/inactive related records

No one layer replaces the others.

---

# 44. Migration / Backfill Rule

Before changing an existing persisted schema, ask:

- Will old documents have this field?
- Does the new field need a default?
- Is backfill required?
- Can old records still be serialized safely?
- Will existing tests/queries fail?
- Is an index migration required?
- Does production data need transformation?

The project currently develops rapidly, but schema compatibility should still be considered.

---

# 45. Sensitive Data Rule

Do not store sensitive or patient data merely because it may be useful later.

Only persist what the confirmed business process requires.

Avoid unnecessary storage of:

- medical history
- diagnoses
- unrelated personal identifiers
- raw auth tokens
- passwords
- private file contents in logs

Patient-related fields should remain purpose-limited.

---

# 46. Database Naming Rule

Use established domain names consistently.

Examples:

```text
User
Clinic
ClinicMembership
Category
Product
LabSlip
ScanBooking
```

Do not rename existing domain models casually.

New model names must reflect a confirmed business concept.

---

# 47. Current Implemented Data Boundary

Current persisted business capabilities include:

```text
Users
Authentication sessions/tokens
Invitations
Clinics
Clinic memberships
Catalogue categories
Catalogue products
Lab Slips
Lab Slip item snapshots
Scan Bookings
Scan assignments
Scan reschedule state
Scan reschedule history
```

The next database-design extension will depend on:

**Module 4D — Lab Production Workflow**

No production schema should be added until the module's business model is approved.

---

# 25. Module 7 Security Persistence Additions

## User `authVersion`

Operational users include an `authVersion` integer used to invalidate previously issued access tokens when security-sensitive account state changes. Disabling a user increments this version.

## Refresh-session revocation

Refresh-token/session records can be revoked in bulk for a disabled user. Account disable therefore invalidates both existing access-token version checks and refresh-session continuation.

## Attachment capacity slots

Lab Slip and Correction attachment records may include an internal integer `capacitySlot`.

A partial unique compound index is enforced on:

```text
(parent resource id, capacitySlot)
```

The index applies only when `capacitySlot` exists, allowing legacy slotless documents to remain valid. Legacy records still count toward the configured attachment maximum.

Purpose:

- close the concurrent `count -> insert` race
- keep the attachment maximum enforceable by MongoDB
- avoid exposing the slot as part of the public API contract
