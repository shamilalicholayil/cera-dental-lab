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

async function populateProduction(production) {
  await production.populate([
    {
      path: "labSlipId",
      select: "reference patient status urgency scanRequired createdAt",
    },
    {
      path: "history.changedByUserId",
      select: "name phone email role status",
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

  const changedAt = new Date();

  production.history.push({
    previousStatus: PRODUCTION_STATUS.SUBMITTED,
    newStatus: PRODUCTION_STATUS.IN_PRODUCTION,
    changedByUserId: user._id,
    note: normalizeOptional(note),
    changedAt,
  });

  production.status = PRODUCTION_STATUS.IN_PRODUCTION;

  production.startedAt = changedAt;

  production.completedAt = null;

  await production.save();

  return populateProduction(production);
}

export async function completeProduction({ user, productionId, note }) {
  assertOperationalRole(user);

  const production = await getProductionOrThrow(productionId);

  assertStatus(production, [PRODUCTION_STATUS.IN_PRODUCTION]);

  const changedAt = new Date();

  production.history.push({
    previousStatus: PRODUCTION_STATUS.IN_PRODUCTION,
    newStatus: PRODUCTION_STATUS.COMPLETED,
    changedByUserId: user._id,
    note: normalizeOptional(note),
    changedAt,
  });

  production.status = PRODUCTION_STATUS.COMPLETED;

  production.completedAt = changedAt;

  await production.save();

  return populateProduction(production);
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

  const changedAt = new Date();

  production.history.push({
    previousStatus,
    newStatus: targetStatus,
    changedByUserId: user._id,
    note: normalizedReason,
    changedAt,
  });

  production.status = targetStatus;

  if (isCompletedToInProduction) {
    /*
     * Current-state timestamp policy:
     *
     * Production has returned to active work,
     * so it is no longer completed.
     *
     * Keep startedAt because this production cycle
     * originally began at that time.
     */
    production.completedAt = null;
  }

  if (isInProductionToSubmitted) {
    /*
     * Production has returned completely to its
     * pre-start state.
     *
     * Historical start information still exists
     * inside production.history.
     */
    production.startedAt = null;

    production.completedAt = null;
  }

  await production.save();

  return populateProduction(production);
}
