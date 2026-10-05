import mongoose from "mongoose";

import {
  LAB_SLIP_URGENCY_VALUES,
  SCAN_BOOKING_STATUS,
  SCAN_BOOKING_STATUS_VALUES,
  SCAN_RESCHEDULE_STATUS_VALUES,
} from "@cera/shared";

const rescheduleHistorySchema = new mongoose.Schema(
  {
    previousConfirmedStartAt: {
      type: Date,
      required: true,
    },

    requestedStartAt: {
      type: Date,
      default: null,
    },

    proposedStartAt: {
      type: Date,
      default: null,
    },

    confirmedStartAt: {
      type: Date,
      required: true,
    },

    requestedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    requestedAt: {
      type: Date,
      default: null,
    },

    confirmedAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const scanBookingSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    labSlipId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "LabSlip",

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

    urgency: {
      type: String,

      enum: LAB_SLIP_URGENCY_VALUES,

      required: true,
      index: true,
    },

    status: {
      type: String,

      enum: SCAN_BOOKING_STATUS_VALUES,

      default: SCAN_BOOKING_STATUS.PENDING_REVIEW,

      required: true,
      index: true,
    },

    requestedStartAt: {
      type: Date,
      required: true,
      index: true,
    },

    proposedStartAt: {
      type: Date,
      default: null,
    },

    confirmedStartAt: {
      type: Date,
      default: null,
      index: true,
    },

    rescheduleStatus: {
      type: String,

      enum: SCAN_RESCHEDULE_STATUS_VALUES,

      default: null,

      index: true,
    },

    rescheduleRequestedStartAt: {
      type: Date,

      default: null,
    },

    rescheduleProposedStartAt: {
      type: Date,

      default: null,
    },

    rescheduleReason: {
      type: String,

      trim: true,

      maxlength: 500,

      default: null,
    },

    rescheduleRequestedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    rescheduleReviewedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    rescheduleRequestedAt: {
      type: Date,

      default: null,
    },

    rescheduleHistory: {
      type: [rescheduleHistorySchema],

      default: [],
    },

    assignedScanningStaffId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },

    requestedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,
    },

    reviewedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    assignedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    completedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    rejectedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    cancelledByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },
  },
  {
    timestamps: true,
  },
);

scanBookingSchema.index({
  status: 1,
  confirmedStartAt: 1,
});

scanBookingSchema.index({
  assignedScanningStaffId: 1,
  status: 1,
  confirmedStartAt: 1,
});

scanBookingSchema.index({
  clinicId: 1,
  createdAt: -1,
});

scanBookingSchema.index({
  doctorId: 1,
  createdAt: -1,
});

export const ScanBooking = mongoose.model("ScanBooking", scanBookingSchema);
