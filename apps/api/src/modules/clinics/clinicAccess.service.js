import mongoose from "mongoose";

import { USER_STATUS, CLINIC_STATUS, USER_ROLES } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { Clinic } from "./clinic.model.js";

import { ClinicMembership } from "./clinicMembership.model.js";

import { User } from "../users/user.model.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listAccessibleClinics({ user, search }) {
  const clinicFilter = {
    status: CLINIC_STATUS.ACTIVE,
  };

  if (search) {
    const pattern = escapeRegex(search);

    clinicFilter.$or = [
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
    ];
  }

  if ([USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF].includes(user.role)) {
    return Clinic.find(clinicFilter).sort({
      name: 1,
    });
  }

  const memberships = await ClinicMembership.find({
    userId: user._id,

    active: true,
  }).select("clinicId");

  const clinicIds = memberships.map((membership) => membership.clinicId);

  return Clinic.find({
    ...clinicFilter,

    _id: {
      $in: clinicIds,
    },
  }).sort({
    name: 1,
  });
}

export async function getAccessibleClinic({ user, clinicId }) {
  if (!mongoose.isValidObjectId(clinicId)) {
    throw new AppError("Clinic not found", 404, "CLINIC_NOT_FOUND");
  }

  const clinic = await Clinic.findOne({
    _id: clinicId,

    status: CLINIC_STATUS.ACTIVE,
  });

  if (!clinic) {
    throw new AppError("Clinic not found", 404, "CLINIC_NOT_FOUND");
  }

  if ([USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF].includes(user.role)) {
    return clinic;
  }

  const membership = await ClinicMembership.exists({
    clinicId: clinic._id,

    userId: user._id,

    active: true,
  });

  if (!membership) {
    /*
     * Return 404 rather than exposing
     * whether an unrelated clinic exists.
     */
    throw new AppError("Clinic not found", 404, "CLINIC_NOT_FOUND");
  }

  return clinic;
}

export async function hasActiveClinicMembership({ userId, clinicId }) {
  if (
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(clinicId)
  ) {
    return false;
  }

  const membership = await ClinicMembership.exists({
    userId,
    clinicId,
    active: true,
  });

  return Boolean(membership);
}

export async function listAccessibleClinicDoctors({ user, clinicId }) {
  const clinic = await getAccessibleClinic({
    user,
    clinicId,
  });

  const memberships = await ClinicMembership.find({
    clinicId: clinic._id,

    active: true,
  }).select("userId");

  const userIds = memberships.map((membership) => membership.userId);

  return User.find({
    _id: {
      $in: userIds,
    },

    role: USER_ROLES.DOCTOR,

    status: {
      $in: [USER_STATUS.ACTIVE, USER_STATUS.INVITED],
    },
  })
    .select("name phone email role status")
    .sort({
      name: 1,
    });
}
