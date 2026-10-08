import mongoose from "mongoose";

import {
  USER_ROLE_VALUES,
  USER_STATUS,
  USER_STATUS_VALUES,
} from "@cera/shared";

import {
  isValidEmail,
  isValidIndianPhone,
  normalizeEmail,
  normalizeIndianPhone,
} from "./user.utils.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,

      set(value) {
        return normalizeIndianPhone(value) ?? value;
      },

      validate: {
        validator: isValidIndianPhone,
        message: "A valid Indian mobile number is required",
      },
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      index: true,

      set: normalizeEmail,

      validate: {
        validator: isValidEmail,
        message: "A valid email address is required",
      },
    },

    passwordHash: {
      type: String,
      select: false,

      required() {
        return this.status === USER_STATUS.ACTIVE;
      },
    },

    role: {
      type: String,
      required: true,
      enum: USER_ROLE_VALUES,
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: USER_STATUS_VALUES,
      default: USER_STATUS.INVITED,
      index: true,
    },

    authVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(_document, object) {
        delete object.passwordHash;
        delete object.__v;

        return object;
      },
    },
  },
);

export const User = mongoose.model("User", userSchema);
