import {
  activateCategory,
  activateProduct,
  createCategory,
  createProduct,
  disableCategory,
  disableProduct,
  getAdminProduct,
  listAdminCategories,
  listAdminProducts,
  updateCategory,
  updateProduct,
} from "./adminCatalog.service.js";

import { serializeCategory, serializeProduct } from "./catalog.serializer.js";

export async function createCategoryController(req, res, next) {
  try {
    const category = await createCategory({
      data: req.body,

      currentUserId: req.user._id,
    });

    res.status(201).json({
      success: true,

      data: {
        category: serializeCategory(category),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listCategoriesController(req, res, next) {
  try {
    const result = await listAdminCategories(req.validatedQuery);

    res.status(200).json({
      success: true,

      data: {
        categories: result.categories.map(serializeCategory),

        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryController(req, res, next) {
  try {
    const category = await updateCategory({
      categoryId: req.params.categoryId,

      data: req.body,

      currentUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        category: serializeCategory(category),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function disableCategoryController(req, res, next) {
  try {
    const category = await disableCategory({
      categoryId: req.params.categoryId,

      currentUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        category: serializeCategory(category),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function activateCategoryController(req, res, next) {
  try {
    const category = await activateCategory({
      categoryId: req.params.categoryId,

      currentUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        category: serializeCategory(category),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProductController(req, res, next) {
  try {
    const product = await createProduct({
      data: req.body,

      currentUserId: req.user._id,
    });

    res.status(201).json({
      success: true,

      data: {
        product: serializeProduct(product),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listProductsController(req, res, next) {
  try {
    const result = await listAdminProducts(req.validatedQuery);

    res.status(200).json({
      success: true,

      data: {
        products: result.products.map(serializeProduct),

        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductController(req, res, next) {
  try {
    const product = await getAdminProduct(req.params.productId);

    res.status(200).json({
      success: true,

      data: {
        product: serializeProduct(product),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(req, res, next) {
  try {
    const product = await updateProduct({
      productId: req.params.productId,

      data: req.body,

      currentUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        product: serializeProduct(product),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function disableProductController(req, res, next) {
  try {
    const product = await disableProduct({
      productId: req.params.productId,

      currentUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        product: serializeProduct(product),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function activateProductController(req, res, next) {
  try {
    const product = await activateProduct({
      productId: req.params.productId,

      currentUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        product: serializeProduct(product),
      },
    });
  } catch (error) {
    next(error);
  }
}
