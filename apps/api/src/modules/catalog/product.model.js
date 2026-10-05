import mongoose from "mongoose";

import { CATALOG_STATUS, CATALOG_STATUS_VALUES } from "@cera/shared";

const productSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Category",

      required: true,

      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 180,
    },

    shortDescription: {
      type: String,
      trim: true,
      default: null,
      maxlength: 1500,
    },

    status: {
      type: String,
      enum: CATALOG_STATUS_VALUES,

      default: CATALOG_STATUS.ACTIVE,

      required: true,

      index: true,
    },

    /*
     * This does not make the product public yet.
     *
     * A later public website module will expose only:
     * - ACTIVE product
     * - ACTIVE category
     * - publicVisible === true
     */
    publicVisible: {
      type: Boolean,
      default: false,
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

productSchema.index({
  categoryId: 1,
  status: 1,
  sortOrder: 1,
  name: 1,
});

productSchema.index({
  status: 1,
  publicVisible: 1,
});

export const Product = mongoose.model("Product", productSchema);
