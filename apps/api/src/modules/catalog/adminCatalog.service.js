import mongoose from "mongoose";

import { CATALOG_STATUS } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { Category } from "./category.model.js";

import { Product } from "./product.model.js";

import { createSlug } from "./catalogSlug.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeOptional(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function assertObjectId(value, code) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError("Invalid id", 400, code);
  }
}

async function ensureUniqueCategorySlug(slug, excludedId = null) {
  const filter = {
    slug,
  };

  if (excludedId) {
    filter._id = {
      $ne: excludedId,
    };
  }

  const exists = await Category.exists(filter);

  if (exists) {
    throw new AppError(
      "A category with this name already exists",
      409,
      "CATEGORY_ALREADY_EXISTS",
    );
  }
}

async function ensureUniqueProductSlug(slug, excludedId = null) {
  const filter = {
    slug,
  };

  if (excludedId) {
    filter._id = {
      $ne: excludedId,
    };
  }

  const exists = await Product.exists(filter);

  if (exists) {
    throw new AppError(
      "A product with this name already exists",
      409,
      "PRODUCT_ALREADY_EXISTS",
    );
  }
}

async function getCategoryOrThrow(categoryId) {
  assertObjectId(categoryId, "INVALID_CATEGORY_ID");

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  return category;
}

async function getProductOrThrow(productId) {
  assertObjectId(productId, "INVALID_PRODUCT_ID");

  const product = await Product.findById(productId).populate("categoryId");

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return product;
}

export async function createCategory({ data, currentUserId }) {
  const slug = createSlug(data.name);

  if (!slug) {
    throw new AppError(
      "Category name is invalid",
      400,
      "INVALID_CATEGORY_NAME",
    );
  }

  await ensureUniqueCategorySlug(slug);

  return Category.create({
    name: data.name,

    slug,

    description: normalizeOptional(data.description),

    sortOrder: data.sortOrder,

    createdByUserId: currentUserId,

    updatedByUserId: currentUserId,
  });
}

export async function listAdminCategories({
  search,
  status,
  page = 1,
  limit = 20,
}) {
  const filter = {};

  if (status) {
    filter.status = status;
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
        description: {
          $regex: pattern,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .sort({
        sortOrder: 1,
        name: 1,
      })
      .skip(skip)
      .limit(limit),

    Category.countDocuments(filter),
  ]);

  return {
    categories,

    pagination: {
      page,
      limit,
      total,

      pages: Math.ceil(total / limit),
    },
  };
}

export async function updateCategory({ categoryId, data, currentUserId }) {
  const category = await getCategoryOrThrow(categoryId);

  if (data.name !== undefined) {
    /*
     * Keep slug stable after creation.
     * Public URLs can safely use it later.
     */
    category.name = data.name;
  }

  if (data.description !== undefined) {
    category.description = normalizeOptional(data.description);
  }

  if (data.sortOrder !== undefined) {
    category.sortOrder = data.sortOrder;
  }

  category.updatedByUserId = currentUserId;

  await category.save();

  return category;
}

export async function disableCategory({ categoryId, currentUserId }) {
  assertObjectId(categoryId, "INVALID_CATEGORY_ID");

  const category = await Category.findOneAndUpdate(
    {
      _id: categoryId,

      status: CATALOG_STATUS.ACTIVE,
    },
    {
      $set: {
        status: CATALOG_STATUS.DISABLED,

        updatedByUserId: currentUserId,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!category) {
    throw new AppError(
      "Only active categories can be disabled",
      409,
      "CATEGORY_CANNOT_BE_DISABLED",
    );
  }

  return category;
}

export async function activateCategory({ categoryId, currentUserId }) {
  assertObjectId(categoryId, "INVALID_CATEGORY_ID");

  const category = await Category.findOneAndUpdate(
    {
      _id: categoryId,

      status: CATALOG_STATUS.DISABLED,
    },
    {
      $set: {
        status: CATALOG_STATUS.ACTIVE,

        updatedByUserId: currentUserId,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!category) {
    throw new AppError(
      "Only disabled categories can be reactivated",
      409,
      "CATEGORY_CANNOT_BE_ACTIVATED",
    );
  }

  return category;
}

export async function createProduct({ data, currentUserId }) {
  const category = await getCategoryOrThrow(data.categoryId);

  if (category.status !== CATALOG_STATUS.ACTIVE) {
    throw new AppError(
      "Products cannot be added to a disabled category",
      409,
      "CATEGORY_DISABLED",
    );
  }

  const slug = createSlug(data.name);

  if (!slug) {
    throw new AppError("Product name is invalid", 400, "INVALID_PRODUCT_NAME");
  }

  await ensureUniqueProductSlug(slug);

  const product = await Product.create({
    categoryId: category._id,

    name: data.name,

    slug,

    shortDescription: normalizeOptional(data.shortDescription),

    publicVisible: data.publicVisible,

    sortOrder: data.sortOrder,

    createdByUserId: currentUserId,

    updatedByUserId: currentUserId,
  });

  await product.populate("categoryId");

  return product;
}

export async function listAdminProducts({
  search,
  categoryId,
  status,
  publicVisible,
  page = 1,
  limit = 20,
}) {
  const filter = {};

  if (categoryId) {
    assertObjectId(categoryId, "INVALID_CATEGORY_ID");

    filter.categoryId = categoryId;
  }

  if (status) {
    filter.status = status;
  }

  if (publicVisible !== undefined) {
    filter.publicVisible = publicVisible;
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

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("categoryId")
      .sort({
        sortOrder: 1,
        name: 1,
      })
      .skip(skip)
      .limit(limit),

    Product.countDocuments(filter),
  ]);

  return {
    products,

    pagination: {
      page,
      limit,
      total,

      pages: Math.ceil(total / limit),
    },
  };
}

export async function updateProduct({ productId, data, currentUserId }) {
  assertObjectId(productId, "INVALID_PRODUCT_ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  if (
    data.categoryId !== undefined &&
    String(product.categoryId) !== data.categoryId
  ) {
    const category = await getCategoryOrThrow(data.categoryId);

    if (category.status !== CATALOG_STATUS.ACTIVE) {
      throw new AppError(
        "Products cannot be moved to a disabled category",
        409,
        "CATEGORY_DISABLED",
      );
    }

    product.categoryId = category._id;
  }
  if (data.name !== undefined) {
    /*
     * Keep slug stable after creation.
     */
    product.name = data.name;
  }

  if (data.shortDescription !== undefined) {
    product.shortDescription = normalizeOptional(data.shortDescription);
  }

  if (data.publicVisible !== undefined) {
    product.publicVisible = data.publicVisible;
  }

  if (data.sortOrder !== undefined) {
    product.sortOrder = data.sortOrder;
  }

  product.updatedByUserId = currentUserId;

  await product.save();

  await product.populate("categoryId");

  return product;
}

export async function disableProduct({ productId, currentUserId }) {
  assertObjectId(productId, "INVALID_PRODUCT_ID");

  const product = await Product.findOneAndUpdate(
    {
      _id: productId,

      status: CATALOG_STATUS.ACTIVE,
    },
    {
      $set: {
        status: CATALOG_STATUS.DISABLED,

        updatedByUserId: currentUserId,
      },
    },
    {
      returnDocument: "after",
    },
  ).populate("categoryId");

  if (!product) {
    throw new AppError(
      "Only active products can be disabled",
      409,
      "PRODUCT_CANNOT_BE_DISABLED",
    );
  }

  return product;
}

export async function activateProduct({ productId, currentUserId }) {
  assertObjectId(productId, "INVALID_PRODUCT_ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  const category = await Category.findById(product.categoryId);

  if (!category || category.status !== CATALOG_STATUS.ACTIVE) {
    throw new AppError(
      "Product cannot be activated while its category is disabled",
      409,
      "CATEGORY_DISABLED",
    );
  }

  if (product.status !== CATALOG_STATUS.DISABLED) {
    throw new AppError(
      "Only disabled products can be reactivated",
      409,
      "PRODUCT_CANNOT_BE_ACTIVATED",
    );
  }

  product.status = CATALOG_STATUS.ACTIVE;

  product.updatedByUserId = currentUserId;

  await product.save();

  await product.populate("categoryId");

  return product;
}

export async function getAdminProduct(productId) {
  return getProductOrThrow(productId);
}
