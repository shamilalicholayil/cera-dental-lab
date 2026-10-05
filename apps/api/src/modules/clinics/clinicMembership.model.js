import mongoose from "mongoose";

const clinicMembershipSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Clinic",

      required: true,

      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    active: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },

    addedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,
    },

    removedByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    removedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

clinicMembershipSchema.index(
  {
    clinicId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

clinicMembershipSchema.index({
  userId: 1,
  active: 1,
});

clinicMembershipSchema.index({
  clinicId: 1,
  active: 1,
});

export const ClinicMembership = mongoose.model(
  "ClinicMembership",
  clinicMembershipSchema,
);
