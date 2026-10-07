import mongoose from "mongoose";

import {
  CORRECTION_OUTCOME_VALUES,
  CORRECTION_STATUS,
  CORRECTION_STATUS_VALUES,
} from "@cera/shared";

const correctionHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      enum: CORRECTION_STATUS_VALUES,
      required: true,
    },

    newStatus: {
      type: String,
      enum: CORRECTION_STATUS_VALUES,
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
      maxlength: 3000,
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

const correctionSchema = new mongoose.Schema(
  {
    labSlipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabSlip",
      required: true,
      index: true,
    },

    productionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Production",
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    affectedLabSlipItemIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
        },
      ],
      default: [],
    },

    status: {
      type: String,
      enum: CORRECTION_STATUS_VALUES,
      default: CORRECTION_STATUS.OPEN,
      required: true,
      index: true,
    },

    outcome: {
      type: String,
      enum: CORRECTION_OUTCOME_VALUES,
      default: null,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    history: {
      type: [correctionHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

correctionSchema.index(
  {
    labSlipId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          CORRECTION_STATUS.OPEN,
          CORRECTION_STATUS.UNDER_REVIEW,
          CORRECTION_STATUS.AWAITING_CLARIFICATION,
        ],
      },
    },
    name: "unique_active_correction_per_lab_slip",
  },
);

correctionSchema.index({
  labSlipId: 1,
  createdAt: -1,
});

correctionSchema.index({
  productionId: 1,
  createdAt: -1,
});

correctionSchema.index({
  status: 1,
  updatedAt: -1,
});

export const Correction = mongoose.model("Correction", correctionSchema);
