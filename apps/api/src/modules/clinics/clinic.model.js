import mongoose from "mongoose";

import {
  CLINIC_STATUS,
  CLINIC_STATUS_VALUES,
  CLINIC_TYPE_VALUES,
} from "@cera/shared";

const addressSchema = new mongoose.Schema(
  {
    line1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    line2: {
      type: String,
      trim: true,
      default: null,
      maxlength: 200,
    },

    locality: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    district: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },

    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{6}$/,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    type: {
      type: String,
      required: true,
      enum: CLINIC_TYPE_VALUES,
    },

    contactPhone: {
      type: String,
      trim: true,
      default: null,
      maxlength: 30,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      maxlength: 254,
    },

    address: {
      type: addressSchema,
      required: true,
    },

    status: {
      type: String,
      enum: CLINIC_STATUS_VALUES,

      default: CLINIC_STATUS.ACTIVE,

      required: true,

      index: true,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,
    },

    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,
    },
  },
  {
    timestamps: true,
  },
);

clinicSchema.index({
  name: 1,
});

clinicSchema.index({
  type: 1,
  status: 1,
});

clinicSchema.index({
  "address.city": 1,
  status: 1,
});

export const Clinic = mongoose.model("Clinic", clinicSchema);
