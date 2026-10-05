import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateBody } from "../../middleware/validateBody.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import {
  acceptAlternate,
  assign,
  cancel,
  complete,
  confirm,
  create,
  getOne,
  list,
  listScanningStaff,
  proposeAlternate,
  reject,
  acceptReschedule,
  confirmReschedule,
  proposeReschedule,
  requestReschedule,
} from "./scanBooking.controller.js";

import {
  assignScanBookingSchema,
  cancelScanBookingSchema,
  createScanBookingSchema,
  listScanBookingsQuerySchema,
  proposeAlternateSchema,
  rejectScanBookingSchema,
  proposeScanRescheduleSchema,
  requestScanRescheduleSchema,
} from "./scanBooking.schemas.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
    USER_ROLES.SCANNING_STAFF,
  ),
  validateQuery(listScanBookingsQuerySchema),
  list,
);

router.post(
  "/",
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
  ),
  validateBody(createScanBookingSchema),
  create,
);

router.get(
  "/scanning-staff",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  listScanningStaff,
);

router.get(
  "/:bookingId",
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
    USER_ROLES.SCANNING_STAFF,
  ),
  getOne,
);

/*
 * Cera operational transitions.
 */

router.post(
  "/:bookingId/confirm",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  confirm,
);

router.post(
  "/:bookingId/propose-alternate",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  validateBody(proposeAlternateSchema),
  proposeAlternate,
);

router.post(
  "/:bookingId/reject",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  validateBody(rejectScanBookingSchema),
  reject,
);

router.post(
  "/:bookingId/assign",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  validateBody(assignScanBookingSchema),
  assign,
);

/*
 * Doctor / Clinic Staff acknowledgement.
 */

router.post(
  "/:bookingId/accept-alternate",
  authorizeRoles(USER_ROLES.DOCTOR, USER_ROLES.CLINIC_STAFF),
  acceptAlternate,
);

router.post(
  "/:bookingId/reschedule-request",
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
  ),
  validateBody(requestScanRescheduleSchema),
  requestReschedule,
);

router.post(
  "/:bookingId/reschedule-confirm",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  confirmReschedule,
);

router.post(
  "/:bookingId/reschedule-propose",
  authorizeRoles(USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF),
  validateBody(proposeScanRescheduleSchema),
  proposeReschedule,
);

router.post(
  "/:bookingId/reschedule-accept",
  authorizeRoles(USER_ROLES.DOCTOR, USER_ROLES.CLINIC_STAFF),
  acceptReschedule,
);

/*
 * Scanner or Cera completion.
 */

router.post(
  "/:bookingId/complete",
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.SCANNING_STAFF,
  ),
  complete,
);

/*
 * Resource-aware cancellation.
 */

router.post(
  "/:bookingId/cancel",
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
  ),
  validateBody(cancelScanBookingSchema),
  cancel,
);

export default router;
