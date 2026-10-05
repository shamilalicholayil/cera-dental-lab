import mongoose from "mongoose";

import {
  CATALOG_STATUS,
  CLINIC_STATUS,
  LAB_SLIP_SOURCE,
  USER_ROLES,
  USER_STATUS,
} from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { Clinic } from "../clinics/clinic.model.js";

import { ClinicMembership } from "../clinics/clinicMembership.model.js";

import { Product } from "../catalog/product.model.js";

import { User } from "../users/user.model.js";

import { LabSlip } from "./labSlip.model.js";

import { generateLabSlipReference } from "./labSlipReference.js";

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getActiveClinic(clinicId) {
  assertObjectId(clinicId, "INVALID_CLINIC_ID", "Invalid clinic id");

  const clinic = await Clinic.findOne({
    _id: clinicId,

    status: CLINIC_STATUS.ACTIVE,
  });

  if (!clinic) {
    throw new AppError("Clinic not found", 404, "CLINIC_NOT_FOUND");
  }

  return clinic;
}

async function getDoctor(doctorId) {
  assertObjectId(doctorId, "INVALID_DOCTOR_ID", "Invalid doctor id");

  const doctor = await User.findOne({
    _id: doctorId,

    role: USER_ROLES.DOCTOR,

    status: {
      $in: [USER_STATUS.ACTIVE, USER_STATUS.INVITED],
    },
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }

  return doctor;
}

async function assertMembership({ userId, clinicId, code, message }) {
  const membership = await ClinicMembership.exists({
    userId,
    clinicId,
    active: true,
  });

  if (!membership) {
    throw new AppError(message, 404, code);
  }
}

async function resolveProducts(items) {
  const productIds = [...new Set(items.map((item) => item.productId))];

  for (const productId of productIds) {
    assertObjectId(productId, "INVALID_PRODUCT_ID", "Invalid product id");
  }

  const products = await Product.find({
    _id: {
      $in: productIds,
    },

    status: CATALOG_STATUS.ACTIVE,
  }).populate("categoryId");

  const usableProducts = products.filter(
    (product) =>
      product.categoryId && product.categoryId.status === CATALOG_STATUS.ACTIVE,
  );

  if (usableProducts.length !== productIds.length) {
    throw new AppError(
      "One or more products are unavailable",
      400,
      "PRODUCT_UNAVAILABLE",
    );
  }

  return new Map(usableProducts.map((product) => [product.id, product]));
}

async function resolveCreationContext({ user, data }) {
  const clinic = await getActiveClinic(data.clinicId);

  let doctorId;
  let source;

  if (user.role === USER_ROLES.DOCTOR) {
    doctorId = String(user._id);

    source = LAB_SLIP_SOURCE.PORTAL;

    if (data.source && data.source !== LAB_SLIP_SOURCE.PORTAL) {
      throw new AppError(
        "Doctors can only submit portal lab slips",
        400,
        "INVALID_LAB_SLIP_SOURCE",
      );
    }

    await assertMembership({
      userId: user._id,

      clinicId: clinic._id,

      code: "CLINIC_NOT_FOUND",

      message: "Clinic not found",
    });
  } else {
    if (!data.doctorId) {
      throw new AppError("Doctor is required", 400, "DOCTOR_REQUIRED");
    }

    doctorId = data.doctorId;

    source = data.source || LAB_SLIP_SOURCE.PORTAL;

    if (user.role === USER_ROLES.CLINIC_STAFF) {
      if (source !== LAB_SLIP_SOURCE.PORTAL) {
        throw new AppError(
          "Clinic Staff can only submit portal lab slips",
          400,
          "INVALID_LAB_SLIP_SOURCE",
        );
      }

      await assertMembership({
        userId: user._id,

        clinicId: clinic._id,

        code: "CLINIC_NOT_FOUND",

        message: "Clinic not found",
      });
    }
  }

  const doctor = await getDoctor(doctorId);

  /*
   * Every slip must connect a Doctor
   * to a clinic they actually belong to.
   *
   * This applies even when Cera Staff
   * enters a phone/paper/WhatsApp request.
   */
  await assertMembership({
    userId: doctor._id,

    clinicId: clinic._id,

    code: "DOCTOR_NOT_AVAILABLE_FOR_CLINIC",

    message: "Doctor is not available for this clinic",
  });

  return {
    clinic,
    doctor,
    source,
  };
}

async function populateLabSlip(labSlip) {
  await labSlip.populate([
    {
      path: "clinicId",
    },
    {
      path: "doctorId",

      select: "name phone email role status",
    },
  ]);

  return labSlip;
}

export async function createLabSlip({ user, data }) {
  const { clinic, doctor, source } = await resolveCreationContext({
    user,
    data,
  });

  const products = await resolveProducts(data.items);

  const items = data.items.map((item) => {
    const product = products.get(item.productId);

    return {
      productId: product._id,

      productName: product.name,

      categoryId: product.categoryId._id,

      categoryName: product.categoryId.name,

      teeth: item.teeth,

      shade: normalizeOptional(item.shade),

      ponticDesign: normalizeOptional(item.ponticDesign),

      designNotes: normalizeOptional(item.designNotes),
    };
  });

  const reference = await generateLabSlipReference();

  const labSlip = await LabSlip.create({
    reference,

    source,

    urgency: data.urgency,

    clinicId: clinic._id,

    doctorId: doctor._id,

    patient: {
      name: data.patient.name,

      reference: normalizeOptional(data.patient.reference),
    },

    items,

    notes: normalizeOptional(data.notes),

    scanRequired: data.scanRequired,

    createdByUserId: user._id,
  });

  return populateLabSlip(labSlip);
}

async function getAccessibleClinicIds(userId) {
  const memberships = await ClinicMembership.find({
    userId,
    active: true,
  }).select("clinicId");

  return memberships.map((membership) => membership.clinicId);
}

function applySearch(filter, search) {
  if (!search) {
    return;
  }

  const pattern = escapeRegex(search);

  filter.$or = [
    {
      reference: {
        $regex: pattern,
        $options: "i",
      },
    },

    {
      "patient.name": {
        $regex: pattern,
        $options: "i",
      },
    },

    {
      "patient.reference": {
        $regex: pattern,
        $options: "i",
      },
    },
  ];
}

export async function listLabSlips({ user, query }) {
  const filter = {};

  if (query.clinicId) {
    assertObjectId(query.clinicId, "INVALID_CLINIC_ID", "Invalid clinic id");

    filter.clinicId = query.clinicId;
  }

  if (user.role === USER_ROLES.DOCTOR) {
    filter.doctorId = user._id;

    if (query.clinicId) {
      await assertMembership({
        userId: user._id,

        clinicId: query.clinicId,

        code: "CLINIC_NOT_FOUND",

        message: "Clinic not found",
      });
    }
  }

  if (user.role === USER_ROLES.CLINIC_STAFF) {
    const clinicIds = await getAccessibleClinicIds(user._id);

    if (query.clinicId && !clinicIds.some((id) => id.equals(query.clinicId))) {
      throw new AppError("Clinic not found", 404, "CLINIC_NOT_FOUND");
    }

    filter.clinicId = query.clinicId || {
      $in: clinicIds,
    };
  }

  applySearch(filter, query.search);

  const skip = (query.page - 1) * query.limit;

  const [labSlips, total] = await Promise.all([
    LabSlip.find(filter)
      .populate("clinicId")
      .populate("doctorId", "name phone email role status")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(query.limit),

    LabSlip.countDocuments(filter),
  ]);

  return {
    labSlips,

    pagination: {
      page: query.page,

      limit: query.limit,

      total,

      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getLabSlip({ user, labSlipId }) {
  assertObjectId(labSlipId, "INVALID_LAB_SLIP_ID", "Invalid lab slip id");

  const labSlip = await LabSlip.findById(labSlipId)
    .populate("clinicId")
    .populate("doctorId", "name phone email role status");

  if (!labSlip) {
    throw new AppError("Lab slip not found", 404, "LAB_SLIP_NOT_FOUND");
  }

  if (
    user.role === USER_ROLES.DOCTOR &&
    !labSlip.doctorId._id.equals(user._id)
  ) {
    throw new AppError("Lab slip not found", 404, "LAB_SLIP_NOT_FOUND");
  }

  if (user.role === USER_ROLES.CLINIC_STAFF) {
    const membership = await ClinicMembership.exists({
      userId: user._id,

      clinicId: labSlip.clinicId._id,

      active: true,
    });

    if (!membership) {
      throw new AppError("Lab slip not found", 404, "LAB_SLIP_NOT_FOUND");
    }
  }

  return labSlip;
}
