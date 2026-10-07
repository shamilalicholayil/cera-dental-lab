import mongoose from "mongoose";

import { PRODUCTION_STATUS, PRODUCTION_STATUS_VALUES } from "@cera/shared";

const productionHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      enum: PRODUCTION_STATUS_VALUES,
      required: true,
    },

    newStatus: {
      type: String,
      enum: PRODUCTION_STATUS_VALUES,
      required: true,
    },

    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
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

const productionSchema = new mongoose.Schema(
  {
    labSlipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabSlip",
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: PRODUCTION_STATUS_VALUES,
      default: PRODUCTION_STATUS.SUBMITTED,
      required: true,
      index: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    history: {
      type: [productionHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

productionSchema.index({
  status: 1,
  updatedAt: -1,
});

productionSchema.index({
  updatedAt: -1,
});

export const Production = mongoose.model("Production", productionSchema);
