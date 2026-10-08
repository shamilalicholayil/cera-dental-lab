import mongoose from "mongoose";

import {
  PRODUCTION_STATUS,
  SCAN_BOOKING_STATUS,
  USER_ROLES,
} from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { LabSlip } from "../labSlips/labSlip.model.js";

import { ScanBooking } from "../scanBookings/scanBooking.model.js";

import { Production } from "./production.model.js";

function normalizeOptional(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function assertObjectId(value, code, message) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(message, 400, code);
  }
}

function assertOperationalRole(user) {
  if (![USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF].includes(user.role)) {
    throw new AppError("You cannot manage production", 403, "FORBIDDEN");
  }
}

function assertAdminRole(user) {
  if (user.role !== USER_ROLES.CERA_ADMIN) {
    throw new AppError(
      "Only Cera Admin can move production backward",
      403,
      "FORBIDDEN",
    );
  }
}

function assertStatus(production, allowedStatuses) {
  if (!allowedStatuses.includes(production.status)) {
    throw new AppError(
      `Production cannot transition from ${production.status}`,
      409,
      "INVALID_PRODUCTION_TRANSITION",
    );
  }
}

async function getProductionOrThrow(productionId) {
  assertObjectId(
    productionId,
    "INVALID_PRODUCTION_ID",
    "Invalid production id",
  );

  const production = await Production.findById(productionId);

  if (!production) {
    throw new AppError("Production not found", 404, "PRODUCTION_NOT_FOUND");
  }

  return production;
}

async function applyProductionTransition({
  production,
  expectedStatus,
  newStatus,
  user,
  note,
  set = {},
}) {
  const changedAt = new Date();

  const updatedProduction = await Production.findOneAndUpdate(
    {
      _id: production._id,
      status: expectedStatus,
    },
    {
      $set: {
        status: newStatus,
        ...set,
      },

      $push: {
        history: {
          previousStatus: expectedStatus,
          newStatus,
          changedByUserId: user._id,
          note: normalizeOptional(note),
          changedAt,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (updatedProduction) {
    return populateProduction(updatedProduction);
  }

  /*
   * Another request changed the state after this request
   * originally read it.
   *
   * Re-read only to return an accurate conflict response.
   */
  const currentProduction = await Production.findById(production._id);

  if (!currentProduction) {
    throw new AppError("Production not found", 404, "PRODUCTION_NOT_FOUND");
  }

  throw new AppError(
    `Production cannot transition from ${currentProduction.status}`,
    409,
    "INVALID_PRODUCTION_TRANSITION",
  );
}

async function populateProduction(production) {
  await production.populate([
    {
      path: "labSlipId",
      select: "reference patient status urgency scanRequired createdAt",
    },
    {
      path: "history.changedByUserId",
      select: "name",
    },
  ]);

  return production;
}

async function assertProductionReady(production) {
  const labSlip = await LabSlip.findById(production.labSlipId).select(
    "scanRequired",
  );

  if (!labSlip) {
    throw new AppError(
      "Lab slip for this production record was not found",
      409,
      "PRODUCTION_LAB_SLIP_MISSING",
    );
  }

  if (!labSlip.scanRequired) {
    return;
  }

  const completedScan = await ScanBooking.exists({
    labSlipId: labSlip._id,
    status: SCAN_BOOKING_STATUS.COMPLETED,
  });

  if (!completedScan) {
    throw new AppError(
      "Production cannot start until the required scan is completed",
      409,
      "PRODUCTION_SCAN_NOT_COMPLETED",
    );
  }
}

export async function listProductions({ user, query }) {
  assertOperationalRole(user);

  const filter = {};

  if (!query.status) {
    /*
     * Production Queue default:
     * show only work that still requires operational attention.
     */
    filter.status = {
      $in: [PRODUCTION_STATUS.SUBMITTED, PRODUCTION_STATUS.IN_PRODUCTION],
    };
  } else if (query.status !== "ALL") {
    filter.status = query.status;
  }

  if (query.urgency) {
    const labSlipIds = await LabSlip.distinct("_id", {
      urgency: query.urgency,
    });

    filter.labSlipId = {
      $in: labSlipIds,
    };
  }

  const skip = (query.page - 1) * query.limit;

  const [productions, total] = await Promise.all([
    Production.find(filter)
      .populate(
        "labSlipId",
        "reference patient status urgency scanRequired createdAt",
      )
      .sort({
        updatedAt: -1,
      })
      .skip(skip)
      .limit(query.limit),

    Production.countDocuments(filter),
  ]);

  return {
    productions,

    pagination: {
      page: query.page,

      limit: query.limit,

      total,

      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getProduction({ user, productionId }) {
  assertOperationalRole(user);

  const production = await getProductionOrThrow(productionId);

  return populateProduction(production);
}

export async function startProduction({ user, productionId, note }) {
  assertOperationalRole(user);

  const production = await getProductionOrThrow(productionId);

  assertStatus(production, [PRODUCTION_STATUS.SUBMITTED]);

  await assertProductionReady(production);

  return applyProductionTransition({
    production,

    expectedStatus: PRODUCTION_STATUS.SUBMITTED,

    newStatus: PRODUCTION_STATUS.IN_PRODUCTION,

    user,

    note,

    set: {
      startedAt: new Date(),
      completedAt: null,
    },
  });
}

export async function completeProduction({ user, productionId, note }) {
  assertOperationalRole(user);

  const production = await getProductionOrThrow(productionId);

  assertStatus(production, [PRODUCTION_STATUS.IN_PRODUCTION]);

  return applyProductionTransition({
    production,

    expectedStatus: PRODUCTION_STATUS.IN_PRODUCTION,

    newStatus: PRODUCTION_STATUS.COMPLETED,

    user,

    note,

    set: {
      completedAt: new Date(),
    },
  });
}

export async function moveProductionBack({
  user,
  productionId,
  targetStatus,
  reason,
}) {
  assertAdminRole(user);

  const production = await getProductionOrThrow(productionId);

  const normalizedReason = normalizeOptional(reason);

  if (!normalizedReason) {
    throw new AppError(
      "A reason is required when moving production backward",
      400,
      "PRODUCTION_BACKWARD_REASON_REQUIRED",
    );
  }

  const isCompletedToInProduction =
    production.status === PRODUCTION_STATUS.COMPLETED &&
    targetStatus === PRODUCTION_STATUS.IN_PRODUCTION;

  const isInProductionToSubmitted =
    production.status === PRODUCTION_STATUS.IN_PRODUCTION &&
    targetStatus === PRODUCTION_STATUS.SUBMITTED;

  if (!isCompletedToInProduction && !isInProductionToSubmitted) {
    throw new AppError(
      `Production cannot transition from ${production.status} to ${targetStatus}`,
      409,
      "INVALID_PRODUCTION_TRANSITION",
    );
  }

  const previousStatus = production.status;

  const set = {};

  if (isCompletedToInProduction) {
    /*
     * Production is active again.
     *
     * Keep startedAt as historical/current cycle context,
     * but it is no longer completed.
     */
    set.completedAt = null;
  }

  if (isInProductionToSubmitted) {
    /*
     * Return current state completely to pre-production.
     * Transition history still preserves the previous start.
     */
    set.startedAt = null;
    set.completedAt = null;
  }

  return applyProductionTransition({
    production,

    expectedStatus: previousStatus,

    newStatus: targetStatus,

    user,

    note: normalizedReason,

    set,
  });
}
