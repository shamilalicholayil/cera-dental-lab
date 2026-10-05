import mongoose from "mongoose";

import { CATALOG_STATUS } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { Category } from "./category.model.js";

import { Product } from "./product.model.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listAccessibleCategories() {
  return Category.find({
    status: CATALOG_STATUS.ACTIVE,
  }).sort({
    sortOrder: 1,
    name: 1,
  });
}

export async function listAccessibleProducts({ search, categoryId }) {
  const activeCategories = await Category.find({
    status: CATALOG_STATUS.ACTIVE,
  }).select("_id");

  const activeCategoryIds = activeCategories.map((category) => category._id);

  const filter = {
    status: CATALOG_STATUS.ACTIVE,

    categoryId: {
      $in: activeCategoryIds,
    },
  };

  if (categoryId) {
    if (!mongoose.isValidObjectId(categoryId)) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    const allowed = activeCategoryIds.some((id) => id.equals(categoryId));

    if (!allowed) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    filter.categoryId = categoryId;
  }

  if (search) {
    const pattern = escapeRegex(search);

    filter.$or = [
      {
        name: {
          $regex: pattern,
          $options: "i",
        },
      },

      {
        shortDescription: {
          $regex: pattern,
          $options: "i",
        },
      },
    ];
  }

  return Product.find(filter).populate("categoryId").sort({
    sortOrder: 1,
    name: 1,
  });
}

export async function getAccessibleProduct(productId) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  const product = await Product.findOne({
    _id: productId,

    status: CATALOG_STATUS.ACTIVE,
  }).populate("categoryId");

  if (
    !product ||
    !product.categoryId ||
    product.categoryId.status !== CATALOG_STATUS.ACTIVE
  ) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return product;
}
