import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateBody } from "../../middleware/validateBody.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import {
  activateCategoryController,
  activateProductController,
  createCategoryController,
  createProductController,
  disableCategoryController,
  disableProductController,
  getProductController,
  listCategoriesController,
  listProductsController,
  updateCategoryController,
  updateProductController,
} from "./adminCatalog.controller.js";

import {
  createCategorySchema,
  createProductSchema,
  listAdminCategoriesQuerySchema,
  listAdminProductsQuerySchema,
  updateCategorySchema,
  updateProductSchema,
} from "./catalog.schemas.js";

const router = Router();

router.use(authenticate, authorizeRoles(USER_ROLES.CERA_ADMIN));

router.get(
  "/categories",
  validateQuery(listAdminCategoriesQuerySchema),
  listCategoriesController,
);

router.post(
  "/categories",
  validateBody(createCategorySchema),
  createCategoryController,
);

router.patch(
  "/categories/:categoryId",
  validateBody(updateCategorySchema),
  updateCategoryController,
);

router.post("/categories/:categoryId/disable", disableCategoryController);

router.post("/categories/:categoryId/activate", activateCategoryController);

router.get(
  "/products",
  validateQuery(listAdminProductsQuerySchema),
  listProductsController,
);

router.post(
  "/products",
  validateBody(createProductSchema),
  createProductController,
);

router.get("/products/:productId", getProductController);

router.patch(
  "/products/:productId",
  validateBody(updateProductSchema),
  updateProductController,
);

router.post("/products/:productId/disable", disableProductController);

router.post("/products/:productId/activate", activateProductController);

export default router;
