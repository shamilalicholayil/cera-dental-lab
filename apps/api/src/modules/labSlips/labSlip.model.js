import mongoose from "mongoose";

import {
  LAB_SLIP_SOURCE,
  LAB_SLIP_SOURCE_VALUES,
  LAB_SLIP_STATUS,
  LAB_SLIP_STATUS_VALUES,
  LAB_SLIP_URGENCY,
  LAB_SLIP_URGENCY_VALUES,
  PRODUCTION_STATUS_VALUES,
  TOOTH_VALUES,
} from "@cera/shared";

const labSlipItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Product",

      required: true,
    },

    /*
     * Snapshot fields preserve what was ordered
     * even if catalogue names change later.
     */
    productName: {
      type: String,
      required: true,
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Category",

      required: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    teeth: {
      type: [
        {
          type: String,
          enum: TOOTH_VALUES,
        },
      ],

      default: [],
    },

    shade: {
      type: String,
      trim: true,
      default: null,
      maxlength: 50,
    },

    ponticDesign: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },

    designNotes: {
      type: String,
      trim: true,
      default: null,
      maxlength: 1000,
    },
  },
  {
    _id: true,
  },
);

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    reference: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },
  },
  {
    _id: false,
  },
);

const productionEditOverrideSchema = new mongoose.Schema(
  {
    productionStatus: {
      type: String,
      enum: PRODUCTION_STATUS_VALUES,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    changedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const labSlipSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    source: {
      type: String,
      enum: LAB_SLIP_SOURCE_VALUES,

      default: LAB_SLIP_SOURCE.PORTAL,

      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: LAB_SLIP_STATUS_VALUES,

      default: LAB_SLIP_STATUS.SUBMITTED,

      required: true,
      index: true,
    },

    urgency: {
      type: String,
      enum: LAB_SLIP_URGENCY_VALUES,

      default: LAB_SLIP_URGENCY.STANDARD,

      required: true,
      index: true,
    },

    clinicId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Clinic",

      required: true,
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,
      index: true,
    },

    patient: {
      type: patientSchema,

      required: true,
    },

    items: {
      type: [labSlipItemSchema],

      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,

        message: "At least one product is required",
      },

      required: true,
    },

    notes: {
      type: String,
      trim: true,
      default: null,
      maxlength: 3000,
    },

    scanRequired: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,
    },

    productionEditOverrideHistory: {
      type: [productionEditOverrideSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

labSlipSchema.virtual("production", {
  ref: "Production",
  localField: "_id",
  foreignField: "labSlipId",
  justOne: true,
});

labSlipSchema.index({
  doctorId: 1,
  createdAt: -1,
});

labSlipSchema.index({
  clinicId: 1,
  createdAt: -1,
});

labSlipSchema.index({
  createdAt: -1,
});

export const LabSlip = mongoose.model("LabSlip", labSlipSchema);
