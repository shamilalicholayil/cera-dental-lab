import {
  getAccessibleProduct,
  listAccessibleCategories,
  listAccessibleProducts,
} from "./catalogAccess.service.js";

import { serializeCategory, serializeProduct } from "./catalog.serializer.js";

export async function listCategories(req, res, next) {
  try {
    const categories = await listAccessibleCategories();

    res.status(200).json({
      success: true,

      data: {
        categories: categories.map(serializeCategory),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req, res, next) {
  try {
    const products = await listAccessibleProducts(req.validatedQuery);

    res.status(200).json({
      success: true,

      data: {
        products: products.map(serializeProduct),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await getAccessibleProduct(req.params.productId);

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
