import mongoose from "mongoose";

import { CATALOG_STATUS, CATALOG_STATUS_VALUES } from "@cera/shared";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 140,
    },

    description: {
      type: String,
      trim: true,
      default: null,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: CATALOG_STATUS_VALUES,

      default: CATALOG_STATUS.ACTIVE,

      required: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
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

categorySchema.index({
  status: 1,
  sortOrder: 1,
  name: 1,
});

export const Category = mongoose.model("Category", categorySchema);
