import mongoose from "mongoose";

import { CLINIC_STATUS, USER_ROLES, USER_STATUS } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { User } from "../users/user.model.js";

import { Clinic } from "./clinic.model.js";

import { ClinicMembership } from "./clinicMembership.model.js";

function assertClinicId(clinicId) {
  if (!mongoose.isValidObjectId(clinicId)) {
    throw new AppError("Invalid clinic id", 400, "INVALID_CLINIC_ID");
  }
}

function assertUserId(userId) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Invalid user id", 400, "INVALID_USER_ID");
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeOptional(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

export async function createClinic({ data, currentUserId }) {
  const clinic = await Clinic.create({
    name: data.name,

    type: data.type,

    contactPhone: normalizeOptional(data.contactPhone),

    email: normalizeOptional(data.email)?.toLowerCase() || null,

    address: {
      line1: data.address.line1,

      line2: normalizeOptional(data.address.line2),

      locality: normalizeOptional(data.address.locality),

      city: data.address.city,

      district: normalizeOptional(data.address.district),

      state: data.address.state,

      pincode: data.address.pincode,

      country: "India",
    },

    createdByUserId: currentUserId,

    updatedByUserId: currentUserId,
  });

  return clinic;
}

export async function listAdminClinics({
  search,
  type,
  status,
  page = 1,
  limit = 20,
}) {
  const filter = {};

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    const pattern = escapeRegex(search);

    filter.$or = [
      {
        name: {
          $regex: pattern,
          $options: "i",
        },
      },

      {
        "address.city": {
          $regex: pattern,
          $options: "i",
        },
      },

      {
        "address.district": {
          $regex: pattern,
          $options: "i",
        },
      },

      {
        contactPhone: {
          $regex: pattern,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [clinics, total] = await Promise.all([
    Clinic.find(filter)
      .sort({
        name: 1,
      })
      .skip(skip)
      .limit(limit),

    Clinic.countDocuments(filter),
  ]);

  return {
    clinics,

    pagination: {
      page,
      limit,
      total,

      pages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminClinic(clinicId) {
  assertClinicId(clinicId);

  const clinic = await Clinic.findById(clinicId);

  if (!clinic) {
    throw new AppError("Clinic not found", 404, "CLINIC_NOT_FOUND");
  }

  return clinic;
}

export async function updateClinic({ clinicId, data, currentUserId }) {
  const clinic = await getAdminClinic(clinicId);

  if (data.name !== undefined) {
    clinic.name = data.name;
  }

  if (data.type !== undefined) {
    clinic.type = data.type;
  }

  if (data.contactPhone !== undefined) {
    clinic.contactPhone = normalizeOptional(data.contactPhone);
  }

  if (data.email !== undefined) {
    clinic.email = normalizeOptional(data.email)?.toLowerCase() || null;
  }

  if (data.address) {
    for (const [key, value] of Object.entries(data.address)) {
      if (value === undefined) {
        continue;
      }

      clinic.address[key] = ["line2", "locality", "district"].includes(key)
        ? normalizeOptional(value)
        : value;
    }
  }

  clinic.updatedByUserId = currentUserId;

  await clinic.save();

  return clinic;
}

export async function disableClinic({ clinicId, currentUserId }) {
  assertClinicId(clinicId);

  const clinic = await Clinic.findOneAndUpdate(
    {
      _id: clinicId,

      status: CLINIC_STATUS.ACTIVE,
    },
    {
      $set: {
        status: CLINIC_STATUS.DISABLED,

        updatedByUserId: currentUserId,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!clinic) {
    throw new AppError(
      "Only active clinics can be disabled",
      409,
      "CLINIC_CANNOT_BE_DISABLED",
    );
  }

  return clinic;
}

export async function activateClinic({ clinicId, currentUserId }) {
  assertClinicId(clinicId);

  const clinic = await Clinic.findOneAndUpdate(
    {
      _id: clinicId,

      status: CLINIC_STATUS.DISABLED,
    },
    {
      $set: {
        status: CLINIC_STATUS.ACTIVE,

        updatedByUserId: currentUserId,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!clinic) {
    throw new AppError(
      "Only disabled clinics can be reactivated",
      409,
      "CLINIC_CANNOT_BE_ACTIVATED",
    );
  }

  return clinic;
}

export async function listClinicMembers(clinicId) {
  await getAdminClinic(clinicId);

  return ClinicMembership.find({
    clinicId,
    active: true,
  })
    .populate("userId")
    .sort({
      createdAt: 1,
    });
}

export async function addClinicMember({ clinicId, userId, currentUserId }) {
  assertClinicId(clinicId);

  assertUserId(userId);

  const clinic = await Clinic.findById(clinicId);

  if (!clinic) {
    throw new AppError("Clinic not found", 404, "CLINIC_NOT_FOUND");
  }

  if (clinic.status !== CLINIC_STATUS.ACTIVE) {
    throw new AppError(
      "Members cannot be added to a disabled clinic",
      409,
      "CLINIC_DISABLED",
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (![USER_ROLES.DOCTOR, USER_ROLES.CLINIC_STAFF].includes(user.role)) {
    throw new AppError(
      "Only doctors and clinic staff can be clinic members",
      400,
      "INVALID_CLINIC_MEMBER_ROLE",
    );
  }

  if (user.status === USER_STATUS.DISABLED) {
    throw new AppError(
      "Disabled users cannot be added to clinics",
      409,
      "USER_DISABLED",
    );
  }

  const existing = await ClinicMembership.findOne({
    clinicId,
    userId,
  });

  if (existing?.active) {
    throw new AppError(
      "User is already a member of this clinic",
      409,
      "CLINIC_MEMBER_EXISTS",
    );
  }

  if (existing) {
    existing.active = true;

    existing.addedByUserId = currentUserId;

    existing.removedByUserId = null;

    existing.removedAt = null;

    await existing.save();

    await existing.populate("userId");

    return existing;
  }

  const membership = await ClinicMembership.create({
    clinicId,

    userId,

    addedByUserId: currentUserId,
  });

  await membership.populate("userId");

  return membership;
}

export async function removeClinicMember({ clinicId, userId, currentUserId }) {
  assertClinicId(clinicId);

  assertUserId(userId);

  const membership = await ClinicMembership.findOneAndUpdate(
    {
      clinicId,
      userId,
      active: true,
    },
    {
      $set: {
        active: false,

        removedAt: new Date(),

        removedByUserId: currentUserId,
      },
    },
    {
      returnDocument: "after",
    },
  ).populate("userId");

  if (!membership) {
    throw new AppError(
      "Active clinic membership not found",
      404,
      "CLINIC_MEMBERSHIP_NOT_FOUND",
    );
  }

  return membership;
}
