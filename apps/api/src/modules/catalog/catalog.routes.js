import { Router } from "express";

import { USER_ROLES } from "@cera/shared";

import { authenticate } from "../../middleware/authenticate.js";

import { authorizeRoles } from "../../middleware/authorizeRoles.js";

import { validateQuery } from "../../middleware/validateQuery.js";

import {
  getProduct,
  listCategories,
  listProducts,
} from "./catalog.controller.js";

import { listAccessibleProductsQuerySchema } from "./catalog.schemas.js";

const router = Router();

router.use(
  authenticate,
  authorizeRoles(
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
  ),
);

router.get("/categories", listCategories);

router.get(
  "/products",
  validateQuery(listAccessibleProductsQuerySchema),
  listProducts,
);

router.get("/products/:productId", getProduct);

export default router;
