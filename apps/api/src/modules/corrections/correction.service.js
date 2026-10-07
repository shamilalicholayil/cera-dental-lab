import mongoose from "mongoose";

import {
  CORRECTION_OUTCOME_VALUES,
  CORRECTION_STATUS,
  PRODUCTION_STATUS,
  USER_ROLES,
} from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { getLabSlip } from "../labSlips/labSlip.service.js";

import { ClinicMembership } from "../clinics/clinicMembership.model.js";

import { LabSlip } from "../labSlips/labSlip.model.js";

import { Correction } from "./correction.model.js";

const ACTIVE_CORRECTION_STATUSES = [
  CORRECTION_STATUS.OPEN,
  CORRECTION_STATUS.UNDER_REVIEW,
  CORRECTION_STATUS.AWAITING_CLARIFICATION,
];

function assertObjectId(value, code, message) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(message, 400, code);
  }
}

function assertCorrectionCreatorRole(user) {
  const allowedRoles = [
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.CERA_ADMIN,
  ];

  if (!allowedRoles.includes(user.role)) {
    throw new AppError("You cannot create corrections", 403, "FORBIDDEN");
  }
}

function assertCorrectionReaderRole(user) {
  const allowedRoles = [
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.CERA_ADMIN,
  ];

  if (!allowedRoles.includes(user.role)) {
    throw new AppError("You cannot view corrections", 403, "FORBIDDEN");
  }
}

function assertCorrectionReviewerRole(user) {
  if (![USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF].includes(user.role)) {
    throw new AppError("You cannot review corrections", 403, "FORBIDDEN");
  }
}

function assertClarificationResponderRole(user) {
  if (![USER_ROLES.DOCTOR, USER_ROLES.CLINIC_STAFF].includes(user.role)) {
    throw new AppError(
      "You cannot respond to correction clarification",
      403,
      "FORBIDDEN",
    );
  }
}

function normalizeOptionalNote(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(
      "Correction note must be text",
      400,
      "INVALID_CORRECTION_NOTE",
    );
  }

  const note = value.trim();

  return note || null;
}

function normalizeRequiredNote(value, code, message) {
  const note = normalizeOptionalNote(value);

  if (!note) {
    throw new AppError(message, 400, code);
  }

  return note;
}

function assertCorrectionOutcome(outcome) {
  if (!outcome) {
    throw new AppError(
      "Correction outcome is required",
      400,
      "CORRECTION_OUTCOME_REQUIRED",
    );
  }

  if (!CORRECTION_OUTCOME_VALUES.includes(outcome)) {
    throw new AppError(
      "Invalid correction outcome",
      400,
      "INVALID_CORRECTION_OUTCOME",
    );
  }
}

async function getCorrectionOrThrow(correctionId) {
  assertObjectId(
    correctionId,
    "INVALID_CORRECTION_ID",
    "Invalid correction id",
  );

  const correction = await Correction.findById(correctionId);

  if (!correction) {
    throw new AppError("Correction not found", 404, "CORRECTION_NOT_FOUND");
  }

  return correction;
}

async function populateCorrection(correction) {
  await correction.populate([
    {
      path: "labSlipId",
      select:
        "reference patient status urgency scanRequired clinicId doctorId createdAt",
    },
    {
      path: "createdByUserId",
      select: "name phone email role status",
    },
    {
      path: "history.changedByUserId",
      select: "name phone email role status",
    },
  ]);

  return correction;
}

async function getCorrectionAccessibleLabSlipIds(user) {
  if (
    user.role === USER_ROLES.CERA_ADMIN ||
    user.role === USER_ROLES.CERA_STAFF
  ) {
    return null;
  }

  if (user.role === USER_ROLES.DOCTOR) {
    const labSlips = await LabSlip.find({
      doctorId: user._id,
    }).select("_id");

    return labSlips.map((labSlip) => labSlip._id);
  }

  if (user.role === USER_ROLES.CLINIC_STAFF) {
    const memberships = await ClinicMembership.find({
      userId: user._id,
      active: true,
    }).select("clinicId");

    const clinicIds = memberships.map((membership) => membership.clinicId);

    const labSlips = await LabSlip.find({
      clinicId: {
        $in: clinicIds,
      },
    }).select("_id");

    return labSlips.map((labSlip) => labSlip._id);
  }

  return [];
}

function assertCorrectionStatus(correction, allowedStatuses) {
  if (!allowedStatuses.includes(correction.status)) {
    throw new AppError(
      `Correction cannot transition from ${correction.status}`,
      409,
      "INVALID_CORRECTION_TRANSITION",
    );
  }
}

async function saveCorrectionTransition({
  correction,
  user,
  newStatus,
  note = null,
  outcome,
}) {
  const previousStatus = correction.status;
  const changedAt = new Date();

  correction.history.push({
    previousStatus,
    newStatus,
    changedByUserId: user._id,
    note,
    changedAt,
  });

  correction.status = newStatus;

  if (outcome !== undefined) {
    correction.outcome = outcome;
  }

  await correction.save();

  return correction;
}

function normalizeDescription(value) {
  if (typeof value !== "string") {
    throw new AppError(
      "Correction description is required",
      400,
      "CORRECTION_DESCRIPTION_REQUIRED",
    );
  }

  const description = value.trim();

  if (!description) {
    throw new AppError(
      "Correction description is required",
      400,
      "CORRECTION_DESCRIPTION_REQUIRED",
    );
  }

  return description;
}

function resolveAffectedLabSlipItemIds({ labSlip, affectedLabSlipItemIds }) {
  if (affectedLabSlipItemIds === undefined) {
    return [];
  }

  if (!Array.isArray(affectedLabSlipItemIds)) {
    throw new AppError(
      "Affected Lab Slip items must be an array",
      400,
      "INVALID_CORRECTION_ITEMS",
    );
  }

  const itemMap = new Map(
    labSlip.items.map((item) => [String(item._id), item._id]),
  );

  const resolvedIds = [];
  const seenIds = new Set();

  for (const itemId of affectedLabSlipItemIds) {
    assertObjectId(
      itemId,
      "INVALID_CORRECTION_ITEM_ID",
      "Invalid affected Lab Slip item id",
    );

    const normalizedId = String(itemId);

    if (!itemMap.has(normalizedId)) {
      throw new AppError(
        "One or more affected items do not belong to this Lab Slip",
        400,
        "CORRECTION_ITEM_NOT_FOUND",
      );
    }

    if (!seenIds.has(normalizedId)) {
      seenIds.add(normalizedId);
      resolvedIds.push(itemMap.get(normalizedId));
    }
  }

  return resolvedIds;
}

async function assertNoActiveCorrection(labSlipId) {
  const existingCorrection = await Correction.exists({
    labSlipId,
    status: {
      $in: ACTIVE_CORRECTION_STATUSES,
    },
  });

  if (existingCorrection) {
    throw new AppError(
      "This Lab Slip already has an unresolved correction",
      409,
      "ACTIVE_CORRECTION_EXISTS",
    );
  }
}

function isActiveCorrectionDuplicateKeyError(error) {
  return (
    error?.code === 11000 &&
    (error?.keyPattern?.labSlipId === 1 ||
      error?.index === "unique_active_correction_per_lab_slip")
  );
}

export async function listCorrections({ user, query }) {
  assertCorrectionReaderRole(user);

  const filter = {};

  if (query.status && query.status !== "ALL") {
    filter.status = query.status;
  }

  const accessibleLabSlipIds = await getCorrectionAccessibleLabSlipIds(user);

  /*
   * null means unrestricted operational access for
   * Cera Staff/Admin.
   *
   * An array means Doctor/Clinic Staff are restricted
   * to their accessible Lab Slips.
   */
  if (accessibleLabSlipIds !== null) {
    filter.labSlipId = {
      $in: accessibleLabSlipIds,
    };
  }

  const skip = (query.page - 1) * query.limit;

  const [corrections, total] = await Promise.all([
    Correction.find(filter)
      .populate({
        path: "labSlipId",
        select:
          "reference patient status urgency scanRequired clinicId doctorId createdAt",
      })
      .populate("createdByUserId", "name phone email role status")
      .sort({
        updatedAt: -1,
      })
      .skip(skip)
      .limit(query.limit),

    Correction.countDocuments(filter),
  ]);

  return {
    corrections,

    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getActiveCorrectionForLabSlip({ user, labSlipId }) {
  assertCorrectionReaderRole(user);

  assertObjectId(labSlipId, "INVALID_LAB_SLIP_ID", "Invalid lab slip id");

  /*
   * Reuse Lab Slip resource authorization.
   *
   * Doctor: own Lab Slip
   * Clinic Staff: permitted clinic scope
   * Cera Staff/Admin: operational access
   */
  await getLabSlip({
    user,
    labSlipId,
  });

  const correction = await Correction.findOne({
    labSlipId,
    status: {
      $in: ACTIVE_CORRECTION_STATUSES,
    },
  });

  if (!correction) {
    return null;
  }

  return populateCorrection(correction);
}

export async function getCorrection({ user, correctionId }) {
  assertCorrectionReaderRole(user);

  const correction = await getCorrectionOrThrow(correctionId);

  /*
   * Doctors and Clinic Staff reuse Lab Slip's established
   * resource authorization instead of maintaining a second
   * copy of those access rules here.
   */
  if (
    user.role === USER_ROLES.DOCTOR ||
    user.role === USER_ROLES.CLINIC_STAFF
  ) {
    await getLabSlip({
      user,
      labSlipId: correction.labSlipId,
    });
  }

  return populateCorrection(correction);
}

export async function createCorrection({ user, labSlipId, data }) {
  assertCorrectionCreatorRole(user);

  assertObjectId(labSlipId, "INVALID_LAB_SLIP_ID", "Invalid lab slip id");

  /*
   * Reuse the Lab Slip module's existing resource authorization.
   *
   * - Doctor: own Lab Slips
   * - Clinic Staff: Lab Slips for an active clinic membership
   * - Cera Staff/Admin: operational access
   *
   * Scanning Staff were rejected above before reaching this call.
   */
  const labSlip = await getLabSlip({
    user,
    labSlipId,
  });

  if (!labSlip.production) {
    throw new AppError(
      "Production record is unavailable for this Lab Slip",
      409,
      "CORRECTION_PRODUCTION_UNAVAILABLE",
    );
  }

  if (labSlip.production.status !== PRODUCTION_STATUS.COMPLETED) {
    throw new AppError(
      "A correction can only be raised after production is completed",
      409,
      "CORRECTION_PRODUCTION_NOT_COMPLETED",
    );
  }

  const description = normalizeDescription(data.description);

  const affectedLabSlipItemIds = resolveAffectedLabSlipItemIds({
    labSlip,
    affectedLabSlipItemIds: data.affectedLabSlipItemIds,
  });

  /*
   * Friendly pre-check for the normal case.
   *
   * The unique partial database index remains the real
   * concurrency-safe protection if two requests race.
   */
  await assertNoActiveCorrection(labSlip._id);

  try {
    return await Correction.create({
      labSlipId: labSlip._id,
      productionId: labSlip.production._id,
      description,
      affectedLabSlipItemIds,
      status: CORRECTION_STATUS.OPEN,
      outcome: null,
      createdByUserId: user._id,
    });
  } catch (error) {
    if (isActiveCorrectionDuplicateKeyError(error)) {
      throw new AppError(
        "This Lab Slip already has an unresolved correction",
        409,
        "ACTIVE_CORRECTION_EXISTS",
      );
    }

    throw error;
  }
}

export async function startCorrectionReview({ user, correctionId, note }) {
  assertCorrectionReviewerRole(user);

  const correction = await getCorrectionOrThrow(correctionId);

  assertCorrectionStatus(correction, [CORRECTION_STATUS.OPEN]);

  return saveCorrectionTransition({
    correction,
    user,
    newStatus: CORRECTION_STATUS.UNDER_REVIEW,
    note: normalizeOptionalNote(note),
  });
}

export async function requestCorrectionClarification({
  user,
  correctionId,
  note,
}) {
  assertCorrectionReviewerRole(user);

  const correction = await getCorrectionOrThrow(correctionId);

  assertCorrectionStatus(correction, [CORRECTION_STATUS.UNDER_REVIEW]);

  const clarificationRequest = normalizeRequiredNote(
    note,
    "CORRECTION_CLARIFICATION_REQUIRED",
    "Clarification request is required",
  );

  return saveCorrectionTransition({
    correction,
    user,
    newStatus: CORRECTION_STATUS.AWAITING_CLARIFICATION,
    note: clarificationRequest,
  });
}

export async function respondToCorrectionClarification({
  user,
  correctionId,
  note,
}) {
  assertClarificationResponderRole(user);

  const correction = await getCorrectionOrThrow(correctionId);

  /*
   * Reuse the established Lab Slip resource authorization.
   * A Doctor must own the case and Clinic Staff must have
   * active access to the clinic.
   */
  await getLabSlip({
    user,
    labSlipId: correction.labSlipId,
  });

  assertCorrectionStatus(correction, [
    CORRECTION_STATUS.AWAITING_CLARIFICATION,
  ]);

  const clarificationResponse = normalizeRequiredNote(
    note,
    "CORRECTION_CLARIFICATION_RESPONSE_REQUIRED",
    "Clarification response is required",
  );

  return saveCorrectionTransition({
    correction,
    user,
    newStatus: CORRECTION_STATUS.UNDER_REVIEW,
    note: clarificationResponse,
  });
}

export async function resolveCorrection({ user, correctionId, outcome, note }) {
  assertCorrectionReviewerRole(user);

  const correction = await getCorrectionOrThrow(correctionId);

  assertCorrectionStatus(correction, [CORRECTION_STATUS.UNDER_REVIEW]);

  assertCorrectionOutcome(outcome);

  return saveCorrectionTransition({
    correction,
    user,
    newStatus: CORRECTION_STATUS.RESOLVED,
    note: normalizeOptionalNote(note),
    outcome,
  });
}

export async function rejectCorrection({ user, correctionId, note }) {
  assertCorrectionReviewerRole(user);

  const correction = await getCorrectionOrThrow(correctionId);

  assertCorrectionStatus(correction, [CORRECTION_STATUS.UNDER_REVIEW]);

  return saveCorrectionTransition({
    correction,
    user,
    newStatus: CORRECTION_STATUS.REJECTED,
    note: normalizeOptionalNote(note),
    outcome: null,
  });
}
