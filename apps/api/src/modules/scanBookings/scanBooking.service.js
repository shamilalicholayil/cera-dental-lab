import mongoose from "mongoose";

import {
  SCAN_BOOKING_STATUS,
  SCAN_RESCHEDULE_STATUS,
  USER_ROLES,
  USER_STATUS,
} from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { ClinicMembership } from "../clinics/clinicMembership.model.js";

import { getLabSlip } from "../labSlips/labSlip.service.js";

import { User } from "../users/user.model.js";

import { ScanBooking } from "./scanBooking.model.js";

import { generateScanBookingReference } from "./scanBookingReference.js";

const TERMINAL_STATUSES = [
  SCAN_BOOKING_STATUS.REJECTED,
  SCAN_BOOKING_STATUS.CANCELLED,
];

const RESCHEDULABLE_STATUSES = [
  SCAN_BOOKING_STATUS.CONFIRMED,
  SCAN_BOOKING_STATUS.ASSIGNED,
];

const SCANNING_STAFF_VISIBLE_STATUSES = [
  SCAN_BOOKING_STATUS.ASSIGNED,
  SCAN_BOOKING_STATUS.COMPLETED,
];

function assertObjectId(value, code, message) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(message, 400, code);
  }
}

function assertFutureDate(value, code = "INVALID_SCAN_TIME") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new AppError("Scan time must be in the future", 400, code);
  }

  return date;
}

function normalizeOptional(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

async function populateBooking(booking) {
  await booking.populate([
    {
      path: "labSlipId",

      select: "reference patient status urgency scanRequired",
    },

    {
      path: "clinicId",
    },

    {
      path: "doctorId",

      select: "name phone email role status",
    },

    {
      path: "assignedScanningStaffId",

      select: "name phone email role status",
    },
    {
      path: "rescheduleRequestedByUserId",

      select: "name phone email role status",
    },

    {
      path: "rescheduleReviewedByUserId",

      select: "name phone email role status",
    },

    {
      path: "rescheduleHistory.requestedByUserId",

      select: "name phone email role status",
    },

    {
      path: "rescheduleHistory.reviewedByUserId",

      select: "name phone email role status",
    },
  ]);

  return booking;
}

async function getBookingOrThrow(bookingId) {
  assertObjectId(
    bookingId,
    "INVALID_SCAN_BOOKING_ID",
    "Invalid scan booking id",
  );

  const booking = await ScanBooking.findById(bookingId);

  if (!booking) {
    throw new AppError("Scan booking not found", 404, "SCAN_BOOKING_NOT_FOUND");
  }

  return booking;
}

async function canAccessClinic(user, clinicId) {
  return ClinicMembership.exists({
    userId: user._id,

    clinicId,

    active: true,
  });
}

async function assertBookingAccess(user, booking) {
  if ([USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF].includes(user.role)) {
    return;
  }

  if (user.role === USER_ROLES.DOCTOR) {
    if (booking.doctorId.equals(user._id)) {
      return;
    }

    throw new AppError("Scan booking not found", 404, "SCAN_BOOKING_NOT_FOUND");
  }

  if (user.role === USER_ROLES.CLINIC_STAFF) {
    const membership = await canAccessClinic(user, booking.clinicId);

    if (membership) {
      return;
    }

    throw new AppError("Scan booking not found", 404, "SCAN_BOOKING_NOT_FOUND");
  }

  if (user.role === USER_ROLES.SCANNING_STAFF) {
    const assignedToUser =
      booking.assignedScanningStaffId &&
      booking.assignedScanningStaffId.equals(user._id);

    const visibleStatus = SCANNING_STAFF_VISIBLE_STATUSES.includes(
      booking.status,
    );

    if (assignedToUser && visibleStatus) {
      return;
    }

    throw new AppError("Scan booking not found", 404, "SCAN_BOOKING_NOT_FOUND");
  }

  throw new AppError("Scan booking not found", 404, "SCAN_BOOKING_NOT_FOUND");
}

function assertStatus(booking, allowedStatuses) {
  if (!allowedStatuses.includes(booking.status)) {
    throw new AppError(
      `Scan booking cannot transition from ${booking.status}`,
      409,
      "INVALID_SCAN_BOOKING_TRANSITION",
    );
  }
}

function assertReschedulable(booking) {
  if (!RESCHEDULABLE_STATUSES.includes(booking.status)) {
    throw new AppError(
      `Scan booking cannot be rescheduled from ${booking.status}`,
      409,
      "INVALID_SCAN_RESCHEDULE_TRANSITION",
    );
  }
}

function clearPendingReschedule(booking) {
  booking.rescheduleStatus = null;

  booking.rescheduleRequestedStartAt = null;

  booking.rescheduleProposedStartAt = null;

  booking.rescheduleReason = null;

  booking.rescheduleRequestedByUserId = null;

  booking.rescheduleReviewedByUserId = null;

  booking.rescheduleRequestedAt = null;
}

async function finalizeReschedule({ booking, confirmedStartAt }) {
  const confirmedAt = new Date();

  booking.rescheduleHistory.push({
    previousConfirmedStartAt: booking.confirmedStartAt,

    requestedStartAt: booking.rescheduleRequestedStartAt,

    proposedStartAt: booking.rescheduleProposedStartAt,

    confirmedStartAt,

    requestedByUserId: booking.rescheduleRequestedByUserId,

    reviewedByUserId: booking.rescheduleReviewedByUserId,

    reason: booking.rescheduleReason,

    requestedAt: booking.rescheduleRequestedAt,

    confirmedAt,
  });

  booking.confirmedStartAt = confirmedStartAt;

  clearPendingReschedule(booking);

  await booking.save();

  return populateBooking(booking);
}

export async function createScanBooking({ user, data }) {
  const requestedStartAt = assertFutureDate(data.requestedStartAt);

  /*
   * Reuse Lab Slip authorization.
   *
   * Doctor -> own slip
   * Clinic Staff -> permitted clinic
   * Cera Admin/Staff -> broad access
   */
  const labSlip = await getLabSlip({
    user,
    labSlipId: data.labSlipId,
  });

  const existing = await ScanBooking.exists({
    labSlipId: labSlip._id,

    status: {
      $nin: TERMINAL_STATUSES,
    },
  });

  if (existing) {
    throw new AppError(
      "A scan booking already exists for this lab slip",
      409,
      "SCAN_BOOKING_ALREADY_EXISTS",
    );
  }

  if (!labSlip.scanRequired) {
    labSlip.scanRequired = true;
    await labSlip.save();
  }

  const reference = await generateScanBookingReference();

  const booking = await ScanBooking.create({
    reference,

    labSlipId: labSlip._id,

    clinicId: labSlip.clinicId._id,

    doctorId: labSlip.doctorId._id,

    urgency: labSlip.urgency,

    requestedStartAt,

    requestedByUserId: user._id,
  });

  return populateBooking(booking);
}

async function getAccessibleClinicIds(userId) {
  const memberships = await ClinicMembership.find({
    userId,
    active: true,
  }).select("clinicId");

  return memberships.map((membership) => membership.clinicId);
}

export async function listScanBookings({ user, query }) {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.clinicId) {
    assertObjectId(query.clinicId, "INVALID_CLINIC_ID", "Invalid clinic id");

    filter.clinicId = query.clinicId;
  }

  if (query.labSlipId) {
    assertObjectId(
      query.labSlipId,
      "INVALID_LAB_SLIP_ID",
      "Invalid lab slip id",
    );

    filter.labSlipId = query.labSlipId;
  }

  if (query.confirmedFrom || query.confirmedTo) {
    filter.confirmedStartAt = {};

    if (query.confirmedFrom) {
      filter.confirmedStartAt.$gte = new Date(query.confirmedFrom);
    }

    if (query.confirmedTo) {
      filter.confirmedStartAt.$lt = new Date(query.confirmedTo);
    }
  }

  if (user.role === USER_ROLES.DOCTOR) {
    filter.doctorId = user._id;
  }

  if (user.role === USER_ROLES.CLINIC_STAFF) {
    const clinicIds = await getAccessibleClinicIds(user._id);

    if (
      query.clinicId &&
      !clinicIds.some((clinicId) => clinicId.equals(query.clinicId))
    ) {
      throw new AppError("Clinic not found", 404, "CLINIC_NOT_FOUND");
    }

    filter.clinicId = query.clinicId || {
      $in: clinicIds,
    };
  }

  if (user.role === USER_ROLES.SCANNING_STAFF) {
    filter.assignedScanningStaffId = user._id;

    filter.status = query.status
      ? SCANNING_STAFF_VISIBLE_STATUSES.includes(query.status)
        ? query.status
        : { $in: [] }
      : {
          $in: SCANNING_STAFF_VISIBLE_STATUSES,
        };
  }

  const skip = (query.page - 1) * query.limit;

  const sort =
    query.confirmedFrom || query.confirmedTo
      ? {
          confirmedStartAt: 1,
          createdAt: 1,
        }
      : {
          createdAt: -1,
        };

  const [bookings, total] = await Promise.all([
    ScanBooking.find(filter)
      .populate("labSlipId", "reference patient status urgency scanRequired")
      .populate("clinicId")
      .populate("doctorId", "name phone email role status")
      .populate("assignedScanningStaffId", "name phone email role status")
      .sort(sort)
      .skip(skip)
      .limit(query.limit),

    ScanBooking.countDocuments(filter),
  ]);

  return {
    bookings,

    pagination: {
      page: query.page,

      limit: query.limit,

      total,

      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getScanBooking({ user, bookingId }) {
  const booking = await getBookingOrThrow(bookingId);

  await assertBookingAccess(user, booking);

  return populateBooking(booking);
}

export async function confirmRequestedTime({ user, bookingId }) {
  const booking = await getBookingOrThrow(bookingId);

  assertStatus(booking, [SCAN_BOOKING_STATUS.PENDING_REVIEW]);

  booking.status = SCAN_BOOKING_STATUS.CONFIRMED;

  booking.confirmedStartAt = booking.requestedStartAt;

  booking.proposedStartAt = null;

  booking.reviewedByUserId = user._id;

  await booking.save();

  return populateBooking(booking);
}

export async function proposeAlternateTime({
  user,
  bookingId,
  proposedStartAt,
}) {
  const booking = await getBookingOrThrow(bookingId);

  assertStatus(booking, [
    SCAN_BOOKING_STATUS.PENDING_REVIEW,
    SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,
  ]);

  booking.proposedStartAt = assertFutureDate(
    proposedStartAt,
    "INVALID_PROPOSED_SCAN_TIME",
  );

  booking.confirmedStartAt = null;

  booking.status = SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION;

  booking.reviewedByUserId = user._id;

  await booking.save();

  return populateBooking(booking);
}

export async function acceptAlternateTime({ user, bookingId }) {
  const booking = await getBookingOrThrow(bookingId);

  await assertBookingAccess(user, booking);

  if (![USER_ROLES.DOCTOR, USER_ROLES.CLINIC_STAFF].includes(user.role)) {
    throw new AppError(
      "Only the Doctor or Clinic Staff can accept an alternate scan time",
      403,
      "FORBIDDEN",
    );
  }

  assertStatus(booking, [SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION]);

  if (!booking.proposedStartAt) {
    throw new AppError(
      "No alternate scan time is available",
      409,
      "PROPOSED_SCAN_TIME_MISSING",
    );
  }

  booking.confirmedStartAt = booking.proposedStartAt;

  booking.status = SCAN_BOOKING_STATUS.CONFIRMED;

  await booking.save();

  return populateBooking(booking);
}

export async function requestScanReschedule({
  user,
  bookingId,
  requestedStartAt,
  reason,
}) {
  const booking = await getBookingOrThrow(bookingId);

  await assertBookingAccess(user, booking);

  if (
    ![
      USER_ROLES.CERA_ADMIN,
      USER_ROLES.CERA_STAFF,
      USER_ROLES.DOCTOR,
      USER_ROLES.CLINIC_STAFF,
    ].includes(user.role)
  ) {
    throw new AppError(
      "You cannot request a scan reschedule",
      403,
      "FORBIDDEN",
    );
  }

  assertReschedulable(booking);

  if (booking.rescheduleStatus) {
    throw new AppError(
      "A scan reschedule is already pending",
      409,
      "SCAN_RESCHEDULE_ALREADY_PENDING",
    );
  }

  booking.rescheduleRequestedStartAt = assertFutureDate(
    requestedStartAt,
    "INVALID_RESCHEDULE_TIME",
  );

  booking.rescheduleProposedStartAt = null;

  booking.rescheduleReason = reason.trim();

  booking.rescheduleRequestedByUserId = user._id;

  booking.rescheduleReviewedByUserId = null;

  booking.rescheduleRequestedAt = new Date();

  booking.rescheduleStatus = SCAN_RESCHEDULE_STATUS.REQUESTED;

  await booking.save();

  return populateBooking(booking);
}

export async function confirmRequestedReschedule({ user, bookingId }) {
  const booking = await getBookingOrThrow(bookingId);

  assertReschedulable(booking);

  if (booking.rescheduleStatus !== SCAN_RESCHEDULE_STATUS.REQUESTED) {
    throw new AppError(
      "No requested reschedule is waiting for review",
      409,
      "INVALID_SCAN_RESCHEDULE_TRANSITION",
    );
  }

  if (!booking.rescheduleRequestedStartAt) {
    throw new AppError(
      "Requested reschedule time is missing",
      409,
      "RESCHEDULE_REQUEST_MISSING",
    );
  }

  const confirmedStartAt = assertFutureDate(
    booking.rescheduleRequestedStartAt,
    "INVALID_RESCHEDULE_TIME",
  );

  booking.rescheduleReviewedByUserId = user._id;

  return finalizeReschedule({
    booking,
    confirmedStartAt,
  });
}

export async function proposeRescheduleTime({
  user,
  bookingId,
  proposedStartAt,
  reason,
}) {
  const booking = await getBookingOrThrow(bookingId);

  assertReschedulable(booking);

  const proposed = assertFutureDate(
    proposedStartAt,
    "INVALID_PROPOSED_RESCHEDULE_TIME",
  );

  /*
   * If Cera starts the reschedule directly,
   * initialize the negotiation here.
   *
   * If Doctor/Clinic already requested it,
   * preserve their request and reason.
   */
  if (!booking.rescheduleStatus) {
    booking.rescheduleRequestedStartAt = null;

    booking.rescheduleRequestedByUserId = null;

    booking.rescheduleRequestedAt = new Date();

    booking.rescheduleReason = normalizeOptional(reason);
  }

  booking.rescheduleProposedStartAt = proposed;

  booking.rescheduleReviewedByUserId = user._id;

  booking.rescheduleStatus = SCAN_RESCHEDULE_STATUS.AWAITING_CONFIRMATION;

  await booking.save();

  return populateBooking(booking);
}

export async function acceptProposedReschedule({ user, bookingId }) {
  const booking = await getBookingOrThrow(bookingId);

  await assertBookingAccess(user, booking);

  if (![USER_ROLES.DOCTOR, USER_ROLES.CLINIC_STAFF].includes(user.role)) {
    throw new AppError(
      "Only the Doctor or Clinic Staff can accept a proposed reschedule",
      403,
      "FORBIDDEN",
    );
  }

  assertReschedulable(booking);

  if (
    booking.rescheduleStatus !== SCAN_RESCHEDULE_STATUS.AWAITING_CONFIRMATION
  ) {
    throw new AppError(
      "No proposed reschedule is waiting for confirmation",
      409,
      "INVALID_SCAN_RESCHEDULE_TRANSITION",
    );
  }

  if (!booking.rescheduleProposedStartAt) {
    throw new AppError(
      "Proposed reschedule time is missing",
      409,
      "RESCHEDULE_PROPOSAL_MISSING",
    );
  }

  const confirmedStartAt = assertFutureDate(
    booking.rescheduleProposedStartAt,
    "INVALID_PROPOSED_RESCHEDULE_TIME",
  );

  return finalizeReschedule({
    booking,
    confirmedStartAt,
  });
}

export async function rejectScanBooking({ user, bookingId, reason }) {
  const booking = await getBookingOrThrow(bookingId);

  assertStatus(booking, [
    SCAN_BOOKING_STATUS.PENDING_REVIEW,
    SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,
  ]);

  booking.status = SCAN_BOOKING_STATUS.REJECTED;

  booking.rejectionReason = reason.trim();

  booking.rejectedByUserId = user._id;

  booking.reviewedByUserId = user._id;

  await booking.save();

  return populateBooking(booking);
}

export async function assignScanBooking({ user, bookingId, scanningStaffId }) {
  const booking = await getBookingOrThrow(bookingId);

  assertStatus(booking, [SCAN_BOOKING_STATUS.CONFIRMED]);

  if (booking.rescheduleStatus) {
    throw new AppError(
      "Resolve the pending reschedule before assigning scanning staff",
      409,
      "SCAN_RESCHEDULE_PENDING",
    );
  }

  assertObjectId(
    scanningStaffId,
    "INVALID_SCANNING_STAFF_ID",
    "Invalid scanning staff id",
  );

  const scanningStaff = await User.findOne({
    _id: scanningStaffId,

    role: USER_ROLES.SCANNING_STAFF,

    status: USER_STATUS.ACTIVE,
  });

  if (!scanningStaff) {
    throw new AppError(
      "Scanning staff not found",
      404,
      "SCANNING_STAFF_NOT_FOUND",
    );
  }

  booking.assignedScanningStaffId = scanningStaff._id;

  booking.assignedByUserId = user._id;

  booking.status = SCAN_BOOKING_STATUS.ASSIGNED;

  await booking.save();

  return populateBooking(booking);
}

export async function completeScanBooking({ user, bookingId }) {
  const booking = await getBookingOrThrow(bookingId);

  assertStatus(booking, [SCAN_BOOKING_STATUS.ASSIGNED]);

  if (
    user.role === USER_ROLES.SCANNING_STAFF &&
    (!booking.assignedScanningStaffId ||
      !booking.assignedScanningStaffId.equals(user._id))
  ) {
    throw new AppError("Scan booking not found", 404, "SCAN_BOOKING_NOT_FOUND");
  }

  booking.status = SCAN_BOOKING_STATUS.COMPLETED;

  booking.completedAt = new Date();

  booking.completedByUserId = user._id;

  clearPendingReschedule(booking);

  await booking.save();

  return populateBooking(booking);
}

export async function cancelScanBooking({ user, bookingId, reason }) {
  const booking = await getBookingOrThrow(bookingId);

  await assertBookingAccess(user, booking);

  if (
    [
      SCAN_BOOKING_STATUS.COMPLETED,
      SCAN_BOOKING_STATUS.REJECTED,
      SCAN_BOOKING_STATUS.CANCELLED,
    ].includes(booking.status)
  ) {
    throw new AppError(
      `Scan booking cannot transition from ${booking.status}`,
      409,
      "INVALID_SCAN_BOOKING_TRANSITION",
    );
  }

  /*
   * Doctor / Clinic Staff cannot cancel once
   * scanning staff has already been assigned.
   * Cera can still operationally cancel it.
   */
  if (
    booking.status === SCAN_BOOKING_STATUS.ASSIGNED &&
    ![USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF].includes(user.role)
  ) {
    throw new AppError(
      "Assigned scan bookings must be cancelled by Cera",
      403,
      "FORBIDDEN",
    );
  }

  booking.status = SCAN_BOOKING_STATUS.CANCELLED;

  booking.cancellationReason = normalizeOptional(reason);

  booking.cancelledByUserId = user._id;

  clearPendingReschedule(booking);

  await booking.save();

  return populateBooking(booking);
}
