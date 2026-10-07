# Cera Dental Lab — UI/UX Design

## 1. Purpose of This Document

This document defines the UI/UX direction and interaction principles for the Cera Dental Lab platform.

It exists to keep the interface consistent across modules and chatbot sessions.

It covers:

- role-specific UX priorities
- navigation direction
- layout principles
- forms
- Digital Lab Slip interaction
- tooth selection
- Scan Booking interaction
- status/action hierarchy
- responsive behavior
- accessibility
- loading/error/empty states
- design tokens
- UI change rules

This document defines confirmed direction and established patterns only.

If a screen, interaction, visual rule, or workflow is not yet confirmed, it must not be invented.

---

# 2. Core UX Principle

The central UX principle is:

> Minimum doctor effort, without reducing the quality of information Cera receives.

Every Doctor-facing interaction should be evaluated against this principle.

The portal should not become a generic ERP interface.

The system should feel:

- focused
- fast
- clear
- operational
- familiar
- low-friction

---

# 3. Role-Specific UX Priorities

The project has different UX priorities for different roles.

## Doctor

Primary characteristics:

- mobile-first
- quick actions
- minimal typing
- familiar workflow
- simple Lab Slip creation
- clear scan status
- clear case status
- low cognitive load

## Clinic / Hospital Staff

Primary characteristics:

- similar workflow to Doctor
- clinic context should be clear
- Doctor selection should be simple
- access scope should be obvious
- avoid unnecessary administrative detail

## Cera Staff

Primary characteristics:

- desktop-oriented
- operational efficiency
- higher information density
- clear action priority
- fast filtering/navigation
- state/status visibility
- minimal repetitive work

## Cera Admin

Primary characteristics:

- desktop-oriented
- administration + operations
- clear management screens
- safe destructive/disable actions
- visibility into users, clinics, catalogue, and operations

## Scanning Staff

Primary characteristics:

- mobile-first
- assigned visits only
- minimal information
- clear visit date/time
- simple completion flow
- no unnecessary manufacturing information

---

# 4. Public Website vs Operational Portal

The frontend contains two conceptually different experiences:

```text
Public website
→ visitors
→ Cera presentation / services / public information

Operational portal
→ authenticated users
→ Lab Slips / scans / operations
```

These areas should remain visually coherent but functionally distinct.

The public site should not expose operational data or portal actions.

---

# 5. Doctor Portal Navigation

Current confirmed Doctor navigation direction:

```text
Dashboard
New Lab Slip
My Slips
Scans
Corrections
Profile
```

Notes:

- `New Lab Slip` should remain a prominent primary action.
- `Corrections` is a planned area and may not be active until its module is implemented.
- Navigation should remain simple and should not grow into a long ERP menu.

---

# 6. Clinic Staff Navigation

Clinic Staff navigation should closely follow the Doctor workflow where practical.

Likely operational areas include:

```text
Dashboard
New Lab Slip
Lab Slips
Scans
Corrections
Profile
```

Exact labels should follow the implemented routing and approved UX.

Clinic context should remain clear.

Do not add unrelated administrative navigation.

---

# 7. Cera Operations Navigation

Cera operational navigation should favor work management.

Potential areas include:

```text
Dashboard
Lab Slips
Scans
Production
Corrections
Catalogue
Clinics
```

Cera Admin may additionally have:

```text
Users
Administrative settings
```

Exact final navigation structure must follow implemented modules.

Do not expose navigation entries for modules that do not exist yet unless they are intentionally marked as unavailable.

---

# 8. Scanning Staff Navigation

Scanning Staff should have a very narrow mobile-first interface.

The primary experience should revolve around:

```text
Assigned scans / visits
↓
Visit detail
↓
Complete visit
```

Avoid exposing:

- full catalogue
- unrelated Lab Slips
- user administration
- clinic management
- production controls

---

# 9. Visual Direction

The interface should communicate:

- professional healthcare/lab operations
- clarity
- trust
- precision
- modern but not flashy
- efficient information hierarchy

Avoid:

- excessive gradients
- decorative animation that slows workflows
- unnecessary dashboard clutter
- oversized marketing-style cards inside operational screens
- dense ERP tables on Doctor mobile screens

---

# 10. Current Design Tokens

Current working color tokens:

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

These are working interface tokens.

Important:

The final official brand palette has not been confirmed from a complete brand guide.

Do not claim these values are official Cera brand colors unless the client confirms them.

---

# 11. Logo / Brand Asset Rule

Use actual client-provided logo/brand assets when available.

Do not invent:

- a new Cera logo
- alternate logo marks
- official brand typefaces
- exact brand-color claims

without authoritative source material.

Temporary layout decisions should be easy to update once official brand assets are confirmed.

---

# 12. Typography

Typography should prioritize:

- readability
- compact operational layouts
- clear hierarchy
- good mobile rendering

Use the project's existing configured font stack.

Do not introduce a new font dependency casually.

If typography is not explicitly branded, system/established project fonts should be preferred over adding decorative fonts.

---

# 13. Page Layout

Operational pages should generally include:

```text
Page heading
↓
Short supporting context if needed
↓
Primary action / filters
↓
Main content
```

Avoid long explanatory text inside routine operational screens.

The interface should allow experienced users to work quickly.

---

# 14. Card vs Table Usage

Use cards when:

- mobile readability is important
- each item needs clear actions/status
- list size is moderate
- Doctor/Scanning Staff are primary users

Use tables when:

- Cera operations need dense comparison
- desktop is the primary device
- multiple attributes must be scanned quickly

Do not force one layout style on every role.

---

# 15. Responsive Design

Responsive behavior must be implemented continuously.

Required priorities:

### Doctor

Mobile-first.

### Scanning Staff

Mobile-first.

### Clinic Staff

Mobile-friendly.

### Cera Staff / Admin

Desktop-first but responsive.

Pages must not rely on a large desktop viewport to remain usable.

---

# 16. Form Design Principles

Forms should:

- show only necessary fields
- use clear labels
- group related inputs
- avoid asking for the same information twice
- use useful defaults where confirmed
- provide inline validation
- keep primary action visible
- avoid unnecessary multi-step wizard behavior

For Doctor-facing forms, reduce typing wherever possible.

---

# 17. Required vs Optional Fields

Required fields should be clearly identifiable.

Optional fields should not look mandatory.

Do not make fields required merely because they are convenient for implementation.

Field requirement must come from business requirements.

If uncertain:

- treat it as an open question
- ask before implementing

---

# 18. Digital Lab Slip UX

The Digital Lab Slip should resemble the simplicity of Cera's familiar paper prescription rather than an ecommerce checkout or complex wizard.

General flow:

```text
Clinic
↓
Patient
↓
Product
↓
Relevant product details
↓
Teeth / shade / design
↓
Notes
↓
Scan requirement
↓
Submit
```

The page should remain compact and adaptive.

---

# 19. Product Selection UX

Planned direction for product selection includes:

- search
- recent/frequent products where later justified
- categories
- full catalogue access

The system should help Doctors select quickly without hiding the complete Cera catalogue.

Do not implement fabricated "popular products" or usage ranking without real data.

---

# 20. Product-Specific Fields

Not every product should necessarily display every possible prescription field.

The UI should eventually show relevant fields conditionally when business rules are confirmed.

Examples may include:

- shade
- teeth
- pontic design
- design notes

Do not create product-specific requirements by guessing.

If the catalogue does not define which fields apply, ask before implementing dynamic rules.

---

# 21. Tooth Selector UX

The tooth selector should visually follow the familiar Cera paper-slip convention.

Display:

```text
Upper:
8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8

Lower:
8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8
```

Internally the frontend/backend use:

```text
UR1–UR8
UL1–UL8
LR1–LR8
LL1–LL8
```

UX goals:

- one-tap/click tooth selection
- selected state visually obvious
- upper/lower and left/right positions clear
- usable on mobile
- keyboard/accessibility support where practical

Do not replace this with FDI numbering unless explicitly requested.

---

# 22. Shade Selection

Shade entry should be quick.

The exact shade catalogue/options must follow confirmed Cera workflow.

Do not invent supported shade values.

If shade remains free-form in the current implementation, preserve that until a confirmed standard is supplied.

---

# 23. Pontic / Design Input

Pontic/design information should be presented in a clear, low-friction way.

A richer visual design selector may be added later if the client provides the required business definitions/reference material.

Do not invent pontic categories or visual choices without authoritative requirements.

---

# 24. Notes and Attachments

Notes should be easy to find near relevant case information.

Future supporting attachment controls should be positioned near notes/case detail rather than hidden inside a separate technical upload area.

Attachments are planned and must support only approved private file types.

Do not add raw scanner-file upload UI.

---

# 25. Scan Requirement UX

Doctor/Clinic Lab Slip creation should clearly ask whether Cera scanning is required.

The interaction should be simple, such as a clear yes/no choice or toggle.

If scanning is required:

```text
show preferred date/time input
```

If not:

```text
do not force scan scheduling fields
```

A later scan request remains possible from the Lab Slip.

---

# 26. Urgency UX

Urgency options:

```text
Standard
Urgent
```

Urgent should be clearly visible but not styled in a way that implies guaranteed timing unless the business has explicitly confirmed a guarantee.

Avoid aggressive warning styling for normal urgent requests unless operationally justified.

---

# 27. Lab Slip List UX

Doctor/Clinic list should prioritize:

- reference
- patient name/reference
- status
- urgency
- recent activity/date
- simple action to open details

Cera lists may include more operational information.

Search should support real operational lookup needs such as:

- Lab Slip reference
- patient information

Do not overcrowd Doctor lists with internal operational fields.

---

# 28. Lab Slip Detail UX

Lab Slip detail should group information logically:

```text
Case identity
Patient
Clinic / Doctor
Items / prescription
Notes
Scan information
Status / operational progress
Actions
```

Role-specific actions should only appear when currently valid.

The UI must not imply that hidden actions are the only authorization protection.

---

# 29. Lab Slip Editing UX

Editing should reuse familiar Lab Slip controls.

The UI should clearly differentiate:

- editable fields
- fixed identity fields

Do not present immutable fields as editable controls and then silently ignore changes.

When production introduces an edit lock, the UI should explain why editing is unavailable.

---

# 30. Scan Booking List UX

Scan lists should emphasize:

- booking reference
- current status
- clinic
- confirmed/requested time
- urgency
- assigned scanner where relevant

Doctor/Clinic and Cera screens may differ in density.

Scanning Staff should see only their assigned visits.

---

# 31. Scan Booking Detail UX

Current recommended information/action order:

```text
1. Booking summary
2. Action error / important feedback
3. Active reschedule notice
4. Main booking workflow actions
5. Reschedule actions
6. Cancel action
7. Reschedule history
```

This ordering keeps the primary booking workflow more important than secondary rescheduling.

---

# 32. Active Reschedule Notice

When rescheduling is in progress, the UI should clearly communicate:

- current confirmed appointment remains active
- requested/proposed new time
- reschedule reason where permitted
- reschedule state

This prevents users from assuming the old appointment has already been replaced.

---

# 33. Scan Reschedule Controls

Doctor/Clinic:

- may request reschedule when allowed
- may accept Cera proposal

Cera:

- may confirm requested time
- may propose another time
- may initiate a proposal

Scanning Staff:

- read-only reschedule visibility
- no reschedule-management controls

Controls should only appear when state and role make them relevant.

---

# 34. Scanner Assignment UX

Cera assignment UI should:

- show current confirmed visit time
- allow selection of active Scanning Staff
- clearly show assigned person after assignment

When unresolved rescheduling exists:

- new assignment control should be hidden/disabled according to current rule

Existing assignment remains visible.

---

# 35. Scanning Staff Visit Detail

Scanning Staff visit detail should prioritize:

```text
Clinic
Confirmed visit time
Patient/reference needed for visit
Current status
Reschedule notice
Completion action
```

Avoid displaying unnecessary:

- manufacturing details
- catalogue detail
- internal admin data

The page should be usable quickly on a phone.

---

# 36. Status Presentation

Statuses should be human-readable.

Examples:

```text
PENDING_REVIEW
→ Pending review

AWAITING_CONFIRMATION
→ Awaiting confirmation

CONFIRMED
→ Confirmed

ASSIGNED
→ Assigned

COMPLETED
→ Completed
```

Internal enum values should not be displayed raw unless intentionally useful.

Use consistent badge/status styling across screens.

---

# 37. Action Hierarchy

Each page should make the most important valid action visually primary.

Example:

Confirmed Scan Booking for Cera:

```text
Primary:
Assign scanning staff

Secondary:
Reschedule

Destructive:
Cancel
```

Actual hierarchy must follow state.

Avoid rendering many equal-weight buttons.

---

# 38. Destructive Actions

Potentially destructive actions such as:

- cancel
- reject
- disable
- revoke

should be visually distinguishable.

Use confirmation where accidental activation would be costly.

Do not overuse confirmation dialogs for reversible low-risk actions.

---

# 39. Loading States

Every asynchronous page/action should have a clear loading state.

Examples:

```text
Page load
→ loading indicator/skeleton

Submit button
→ disabled + progress label

State transition
→ prevent duplicate clicks
```

Do not leave users wondering whether an action was accepted.

---

# 40. Error States

Errors should be:

- visible
- actionable when possible
- written in plain language
- associated with the relevant form/action

Avoid exposing technical error codes alone to end users.

The application error code may still be useful for debugging internally.

---

# 41. Empty States

Empty states should explain:

- why the area is empty
- what the user can do next, if applicable

Examples:

Doctor:

```text
No Lab Slips yet.
Create your first Lab Slip.
```

Scanning Staff:

```text
No assigned visits.
```

Do not display large complex empty-state marketing content inside operational views.

---

# 42. Success Feedback

Use clear feedback after meaningful actions.

Examples:

- Lab Slip submitted
- Scan requested
- Appointment confirmed
- Scanner assigned
- Reschedule accepted

Success feedback should not block the user unnecessarily.

Use the project's existing toast/notification pattern where available.

---

# 43. Form Validation UX

Validation should:

- appear close to the relevant field
- preserve entered values
- avoid generic "Something went wrong" for known input errors
- distinguish field validation from server/business-state errors

Backend remains authoritative.

Frontend validation is for faster feedback, not security.

---

# 44. Disabled States

A disabled control should communicate why when the reason is not obvious.

Example:

```text
Assign scanner
disabled because a reschedule is awaiting confirmation
```

Where possible, show explanatory helper text rather than silently disabling important actions.

---

# 45. Accessibility

Each module should consider basic accessibility.

Requirements include:

- semantic buttons/inputs
- associated labels
- keyboard-accessible actions
- visible focus states
- adequate contrast
- readable status text, not color-only meaning
- form errors connected to fields where practical
- accessible modal/dialog behavior where used

Accessibility should be built continuously, not postponed until the end.

---

# 46. Touch Targets

Doctor and Scanning Staff interfaces must support touch comfortably.

Small icon-only controls should not be the only way to perform important actions.

Tooth-selector controls must remain usable on smaller screens.

---

# 47. Mobile Layout

On mobile:

- content should stack logically
- actions should remain reachable
- tables should convert/adapt rather than require unusable horizontal scrolling where possible
- forms should use full-width inputs when appropriate
- modals should remain usable on short viewports

---

# 48. Desktop Operations Layout

Cera operational screens may use:

- tables
- side panels
- filters
- compact cards
- grouped action areas

But clarity is more important than maximum density.

Avoid recreating spreadsheet complexity inside every screen.

---

# 49. Search and Filter UX

Search/filter controls should exist only for real operational needs.

Examples:

- Lab Slip reference search
- patient search
- booking status
- date
- urgency

For Cera operational lists, filters should be easy to clear.

Do not add a large generic filter builder.

---

# 50. Consistent Terminology

UI text should use established domain terms.

Preferred:

```text
Lab Slip
Scan Booking
Scan
Clinic
Doctor
Reschedule
Correction
```

Avoid changing the same concept between screens:

```text
Lab Slip
Order
Job
Case Ticket
```

unless the difference is intentional and documented.

---

# 51. Human References

Human-readable references should be visible in detail/list screens.

Examples:

```text
CDL-2026-000001
SCAN-2026-000001
```

They are useful for:

- phone conversations
- WhatsApp
- support
- search
- operational coordination

---

# 52. Patient Information Display

Display only patient information needed for the current role/workflow.

Scanning Staff especially should receive minimal visit-related information.

Do not display unrelated sensitive patient information merely because it exists.

---

# 53. Privacy in Shared Screens

Operational screens may be used in clinics/labs where others are physically nearby.

Avoid unnecessarily exposing sensitive information in:

- dashboard summaries
- notifications
- table columns
- toast messages

Use patient data only where operationally required.

---

# 54. Production UX

Module 4D Production UX is implemented.

### Cera Operations

Cera Admin and Cera Staff have an operational Production queue with:

- active queue default (`Submitted` + `In Production`)
- explicit Completed filter
- explicit All filter
- case summary cards linking to Production detail
- loading, error, and empty states

Production detail supports:

- case/Lab Slip summary
- current Production status
- scan-readiness messaging
- optional forward-transition note
- Production history

Cera Staff may start/complete production.

Cera Admin additionally receives backward-transition controls with mandatory reason.

### Lab Slip Editing

When Production is `IN_PRODUCTION` or `COMPLETED`:

- Doctor, Clinic Staff, and Cera Staff see a locked edit experience
- Cera Admin may edit through an explicit override state
- Admin override reason is mandatory
- missing Production information blocks editing rather than silently allowing it

### External Production Wording

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

`Completed` must not imply delivery.

---

# 55. Planned Corrections UX

Corrections are planned but not yet designed.

Potential UX must wait for decisions about:

- correction reasons
- statuses
- evidence/attachments
- review flow
- rescan/reproduction
- Doctor/Cera actions

Do not design a generic support-ticket UI unless the business workflow actually requires it.

---

# 56. Planned Attachment UX

Supporting attachments should be simple.

Future likely interaction:

```text
Add attachment
↓
Choose supported file
↓
Upload
↓
Show file name/type/state
```

Exact rules must wait for Module 4E.

Do not display raw object-storage URLs.

---

# 57. Planned Notification UX

In-app notifications should eventually prioritize actionable operational updates.

Avoid notification overload.

A notification should exist because it changes what the user needs to know or do.

Do not notify every minor database update.

---

# 58. Dashboard Rule

Dashboards should be based on real user decisions/actions, not decorative metrics.

A dashboard card should answer something useful, such as:

- What needs my attention?
- What is scheduled today?
- What is waiting for confirmation?
- Which cases are urgent?

Do not add vanity charts without an operational purpose.

---

# 59. UI Consistency Rule

Before creating a new screen or component:

1. inspect existing pages/components
2. reuse existing layout patterns
3. reuse existing buttons/forms/status styles
4. reuse established spacing and tokens
5. only introduce a new pattern when the existing one does not fit

This is especially important across separate chatbot sessions.

---

# 60. No-Assumption UI Rule

The chatbot must not invent:

- fields
- labels representing unconfirmed business states
- role actions
- required inputs
- workflow steps
- product-specific form behavior
- new navigation areas
- notification events
- production statuses

If UX depends on an unresolved business rule, stop and ask.

---

# 61. UI Modification Workflow

Because the user manually copies code:

Before modifying an existing page/component:

1. request the current file
2. inspect existing imports/state/layout
3. identify whether targeted edit or full replacement is safer
4. provide exact file path
5. provide code
6. user pastes manually
7. run relevant frontend test
8. run lint/build at checkpoint
9. review visual/manual behavior

Do not reconstruct a page from memory if the current version has not been shown.

---

# 62. Full-File Replacement Rule

Prefer a full-file replacement when:

- JSX has many coordinated changes
- imports and state change together
- action ordering matters
- a previous partial edit caused inconsistency
- manual patching would be error-prone

Prefer a targeted edit when:

- the change is isolated
- insertion point is unambiguous

State clearly which approach is being used.

---

# 63. UI Completion Criteria

A UI module is not complete until relevant checks include:

- normal workflow works
- role-specific controls are correct
- invalid actions are not presented
- backend still protects actions
- loading states work
- error states work
- empty states work
- form validation is understandable
- responsive layout is usable
- accessibility basics are checked
- frontend tests pass
- lint passes
- build passes
- manual browser QA passes

---

# 64. Current Implemented UX Boundary

The implemented operational UX currently includes:

```text
Authentication
↓
Role-protected portal
↓
User administration
↓
Clinic management
↓
Catalogue management
↓
Lab Slip create/list/detail/edit
↓
Scan request/list/detail/scheduling/assignment/rescheduling/completion
↓
Production queue
↓
Production detail + history + transitions
↓
Production-aware Lab Slip edit lock / Admin override
↓
Doctor/Clinic production visibility
```

Module 4D UX is complete and passed automated checks and manual role/state QA. The next planned UX area is Module 4E — Private Attachments.
