# Cera Dental Lab — Session Handoff

> **Current implementation baseline — 2026-10-08**  
> Current completed feature boundary is Module 6C; Modules 5A/5B remain planned; Module 7 is NEXT.

> **Updated: 2026-10-08**

## 1. Current Handoff Summary

Last completed module:

```text
Module 6C — Scanning Staff Mobile Workflow Refinement
```

Next module:

```text
Module 7 — Security & Cross-Module Hardening
```

Last reported Git boundary:

```text
working tree clean
master == origin/master
253178a feat: refine scanning staff mobile workflow
```

Always verify dynamic Git state again before new changes.

---

## 2. Current Completed Functional Boundary

```text
Authentication / invitations / roles
↓
Clinics + memberships
↓
Catalogue
↓
Digital Lab Slip
↓
Scan Booking + scheduling + assignment + rescheduling + completion
↓
Lab Production
↓
Private supporting attachments
↓
Corrections / clarification / resolution
↓
Doctor Dashboard
↓
Cera Operations Dashboard
↓
Scanning Staff Mobile Workflow
```

Modules 5A/5B notifications remain planned and are not implemented merely because later UX refinement modules are complete.

---

## 3. Module 6C — What Was Added

### Backend privacy boundary

Scan Booking serialization is role-aware for Scanning Staff. Scanner responses retain only visit information required for the assigned visit and avoid unrelated Doctor/user contact exposure.

### Scanner dashboard

`/portal` now provides Scanning Staff with:

- today's assigned visits
- chronological visit order
- confirmed time
- patient identity/reference
- clinic and address
- urgency
- read-only reschedule warning
- loading/empty/failure/retry states
- link to all assigned visits

### My Visits

`/portal/scans` now has a mobile-first Scanner experience with:

- all assigned visit history/future visits
- scanner-relevant filters only
- assigned/completed/cancelled views
- confirmed-time-first cards
- patient/clinic emphasis
- urgent/reschedule indicators
- pagination and retry states

### Visit detail

Scanner detail now prioritizes:

```text
confirmed time
→ patient
→ clinic/address
→ reschedule notice
→ completion action
```

Scanner cannot manage reschedules. Attachments remain read-only. Assigned Scanner can mark an `ASSIGNED` visit completed.

---

## 4. Module 6C Verification

Reported passing before commit:

```text
npm run test:web
npm run test:api
npm run lint:web
npm run lint:api
npm run build:web
```

Focused tests were added/updated for:

- Scanner dashboard
- Scan Bookings list
- Scan Booking detail
- backend Scan Booking serializer/privacy behavior

Module 6C was committed and pushed.

---

## 5. Current Module Status

Complete:

```text
0, 1A, 1B, 1C, 1D
2A, 2B
3A, 3B
4A, 4B, 4C, 4D, 4E, 4F
6A, 6B, 6C
```

Still planned:

```text
5A In-App Notifications
5B WhatsApp Notifications
```

Next:

```text
7 Security & Cross-Module Hardening
```

Later:

```text
8 End-to-End Regression
9 Production Deployment
10 Final Documentation & Monitoring
```

---

## 6. Module 7 — Start Here

Module 7 is a system-wide hardening pass, not a new business-feature module.

Start source-first by inventorying the current repository before editing code. Review:

1. authentication/session boundaries
2. route role guards vs service resource authorization
3. serializers and patient/contact data exposure
4. CSRF strategy for cookie-based auth
5. CORS and browser security
6. invitation/reset/session revocation hardening
7. upload type/size/private-access enforcement
8. rate-limit coverage
9. logging/privacy and request IDs
10. dependency/security audit
11. environment/secrets handling
12. cross-module state-transition authorization

Do not assume a vulnerability exists merely because an area is listed for review. Inspect current code first.

---

## 7. Permanent Development Rules

- React + Vite + JavaScript frontend.
- Node.js + Express ESM backend.
- MongoDB/Mongoose.
- REST under `/api/v1`.
- Modular monolith.
- Frontend/backend developed together by vertical slice.
- UI/UX is part of each module, not deferred.
- Route definitions stay outside `App.jsx`.
- Redux Toolkit only for suitable app-wide state.
- Backend is the security boundary; frontend role checks are UX only.
- Inspect the current source before proposing edits.
- Give exact file path and targeted edit vs full replacement.
- User manually copies code into VS Code.
- Test normal, permission, validation, failure and edge cases.
- Run relevant tests/lint/build before completion.
- Commit and push a completed module before starting the next one.
- Do not invent business rules, statuses, roles, permissions or integrations.

---

## 8. Scope Locks

Do not add without explicit scope change:

- online payments/billing ERP
- inventory/ecommerce
- direct intraoral scanner integration
- large raw scanner-file website storage
- public operational signup
- unconfirmed notification behavior

---

## 9. Source of Truth

Use this order:

```text
1. current repository/code
2. confirmed requirements
3. current project/design docs
4. architecture decisions
5. MODULE_STATUS / SESSION_HANDOFF
6. Git history
7. chat context/memory
```

If current code and a confirmed requirement conflict, identify the conflict instead of silently choosing.
