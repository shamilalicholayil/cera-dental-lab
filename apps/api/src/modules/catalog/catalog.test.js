import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { CATALOG_STATUS, USER_ROLES, USER_STATUS } from "@cera/shared";

import { app } from "../../app.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { hashPassword } from "../auth/password.js";

import { User } from "../users/user.model.js";

import { Category } from "./category.model.js";

import { Product } from "./product.model.js";

const password = "StrongPass123";

async function createUser({ name, phone, role }) {
  return User.create({
    name,
    phone,
    role,

    status: USER_STATUS.ACTIVE,

    passwordHash: await hashPassword(password),
  });
}

async function login(agent, phone) {
  await agent
    .post("/api/v1/auth/login")
    .send({
      identifier: phone,

      password,
    })
    .expect(200);
}

async function createCategoryRecord(admin, overrides = {}) {
  return Category.create({
    name: "Fixed Prosthesis",

    slug: "fixed-prosthesis",

    description: "Fixed prosthetic products",

    createdByUserId: admin._id,

    updatedByUserId: admin._id,

    ...overrides,
  });
}

describe("catalogue", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    await User.syncIndexes();
    await Category.syncIndexes();
    await Product.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("allows Cera Admin to create a category", async () => {
    await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const agent = request.agent(app);

    await login(agent, "9876543210");

    const response = await agent.post("/api/v1/admin/catalog/categories").send({
      name: "Fixed Prosthesis",

      description: "Fixed restorations",

      sortOrder: 1,
    });

    expect(response.status).toBe(201);

    expect(response.body.data.category.slug).toBe("fixed-prosthesis");
  });

  it("prevents Doctor from managing categories", async () => {
    await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const agent = request.agent(app);

    await login(agent, "9876543211");

    const response = await agent.post("/api/v1/admin/catalog/categories").send({
      name: "Fixed Prosthesis",
    });

    expect(response.status).toBe(403);
  });

  it("allows Admin to create a product", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const category = await createCategoryRecord(admin);

    const agent = request.agent(app);

    await login(agent, "9876543210");

    const response = await agent.post("/api/v1/admin/catalog/products").send({
      categoryId: category.id,

      name: "Zirconia Crown",

      shortDescription: "Zirconia restoration",

      publicVisible: true,

      sortOrder: 1,
    });

    expect(response.status).toBe(201);

    expect(response.body.data.product.slug).toBe("zirconia-crown");

    expect(response.body.data.product.category.id).toBe(category.id);
  });

  it("does not create a product inside a disabled category", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const category = await createCategoryRecord(admin, {
      status: CATALOG_STATUS.DISABLED,
    });

    const agent = request.agent(app);

    await login(agent, "9876543210");

    const response = await agent.post("/api/v1/admin/catalog/products").send({
      categoryId: category.id,

      name: "Zirconia Crown",
    });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("CATEGORY_DISABLED");
  });

  it("returns active products to Doctor", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const category = await createCategoryRecord(admin);

    await Product.create({
      categoryId: category._id,

      name: "Zirconia Crown",

      slug: "zirconia-crown",

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543211");

    const response = await agent.get("/api/v1/catalog/products");

    expect(response.status).toBe(200);

    expect(response.body.data.products).toHaveLength(1);

    expect(response.body.data.products[0].name).toBe("Zirconia Crown");
  });

  it("hides disabled products from Doctor", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const category = await createCategoryRecord(admin);

    await Product.create({
      categoryId: category._id,

      name: "Hidden Product",

      slug: "hidden-product",

      status: CATALOG_STATUS.DISABLED,

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543211");

    const response = await agent.get("/api/v1/catalog/products");

    expect(response.status).toBe(200);

    expect(response.body.data.products).toHaveLength(0);
  });

  it("hides products when their category is disabled", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const category = await createCategoryRecord(admin, {
      status: CATALOG_STATUS.DISABLED,
    });

    await Product.create({
      categoryId: category._id,

      name: "Zirconia Crown",

      slug: "zirconia-crown",

      status: CATALOG_STATUS.ACTIVE,

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543211");

    const response = await agent.get("/api/v1/catalog/products");

    expect(response.status).toBe(200);

    expect(response.body.data.products).toHaveLength(0);
  });

  it("allows Cera Staff to read active catalogue", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    await createUser({
      name: "Staff",

      phone: "9876543212",

      role: USER_ROLES.CERA_STAFF,
    });

    await createCategoryRecord(admin);

    const agent = request.agent(app);

    await login(agent, "9876543212");

    const response = await agent.get("/api/v1/catalog/categories");

    expect(response.status).toBe(200);

    expect(response.body.data.categories).toHaveLength(1);
  });

  it("does not allow Scanning Staff to browse catalogue", async () => {
    await createUser({
      name: "Scanner",

      phone: "9876543213",

      role: USER_ROLES.SCANNING_STAFF,
    });

    const agent = request.agent(app);

    await login(agent, "9876543213");

    const response = await agent.get("/api/v1/catalog/products");

    expect(response.status).toBe(403);
  });

  it("cannot reactivate a product while its category is disabled", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const category = await createCategoryRecord(admin, {
      status: CATALOG_STATUS.DISABLED,
    });

    const product = await Product.create({
      categoryId: category._id,

      name: "Zirconia Crown",

      slug: "zirconia-crown",

      status: CATALOG_STATUS.DISABLED,

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543210");

    const response = await agent.post(
      `/api/v1/admin/catalog/products/${product.id}/activate`,
    );

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("CATEGORY_DISABLED");
  });
});
