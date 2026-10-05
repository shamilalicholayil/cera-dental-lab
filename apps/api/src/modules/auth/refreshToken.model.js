import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    tokenHash: {
      type: String,

      required: true,

      unique: true,

      index: true,

      select: false,
    },

    expiresAt: {
      type: Date,

      required: true,

      index: {
        expires: 0,
      },
    },

    revokedAt: {
      type: Date,

      default: null,

      index: true,
    },

    replacedByTokenId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "RefreshToken",

      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
