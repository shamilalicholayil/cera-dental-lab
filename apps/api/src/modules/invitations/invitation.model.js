import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    tokenHash: {
      type: String,

      required: true,

      unique: true,

      select: false,
    },

    expiresAt: {
      type: Date,

      required: true,
    },

    consumedAt: {
      type: Date,

      default: null,

      index: true,
    },

    revokedAt: {
      type: Date,

      default: null,

      index: true,
    },
  },
  {
    timestamps: true,
  },
);

invitationSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

export const Invitation = mongoose.model("Invitation", invitationSchema);
