import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  CATALOG_STATUS,
  CLINIC_TYPES,
  LAB_SLIP_SOURCE,
  LAB_SLIP_URGENCY,
  USER_ROLES,
  USER_STATUS,
} from "@cera/shared";

import { app } from "../../app.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { hashPassword } from "../auth/password.js";

import { User } from "../users/user.model.js";

import { Clinic } from "../clinics/clinic.model.js";

import { ClinicMembership } from "../clinics/clinicMembership.model.js";

import { Category } from "../catalog/category.model.js";

import { Product } from "../catalog/product.model.js";

import { LabSlip } from "./labSlip.model.js";

import { LabSlipCounter } from "./labSlipCounter.model.js";

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

async function setupCatalogue(admin) {
  const category = await Category.create({
    name: "Fixed Prosthesis",

    slug: "fixed-prosthesis",

    status: CATALOG_STATUS.ACTIVE,

    createdByUserId: admin._id,

    updatedByUserId: admin._id,
  });

  const product = await Product.create({
    categoryId: category._id,

    name: "Zirconia Crown",

    slug: "zirconia-crown",

    status: CATALOG_STATUS.ACTIVE,

    createdByUserId: admin._id,

    updatedByUserId: admin._id,
  });

  return {
    category,
    product,
  };
}

async function createClinic(admin, name = "Example Dental Clinic") {
  return Clinic.create({
    name,

    type: CLINIC_TYPES.CLINIC,

    address: {
      line1: "Main Road",

      city: "Kozhikode",

      state: "Kerala",

      pincode: "673001",

      country: "India",
    },

    createdByUserId: admin._id,

    updatedByUserId: admin._id,
  });
}

async function addMembership({ clinic, user, admin }) {
  return ClinicMembership.create({
    clinicId: clinic._id,

    userId: user._id,

    addedByUserId: admin._id,
  });
}

function payload({ clinic, product, doctorId, source } = {}) {
  return {
    clinicId: clinic.id,

    ...(doctorId
      ? {
          doctorId,
        }
      : {}),

    ...(source
      ? {
          source,
        }
      : {}),

    urgency: LAB_SLIP_URGENCY.STANDARD,

    patient: {
      name: "Test Patient",

      reference: "PAT-001",
    },

    items: [
      {
        productId: product.id,

        teeth: ["UR1", "UR2"],

        shade: "A2",

        ponticDesign: "Standard",

        designNotes: "Check occlusion",
      },
    ],

    notes: "General notes",

    scanRequired: true,
  };
}

describe("Digital Lab Slips", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    await User.syncIndexes();
    await Clinic.syncIndexes();
    await ClinicMembership.syncIndexes();
    await Category.syncIndexes();
    await Product.syncIndexes();
    await LabSlip.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("allows Doctor to submit a lab slip for an assigned clinic", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const doctor = await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const clinic = await createClinic(admin);

    await addMembership({
      clinic,
      user: doctor,
      admin,
    });

    const { product } = await setupCatalogue(admin);

    const agent = request.agent(app);

    await login(agent, doctor.phone);

    const response = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(response.status).toBe(201);

    expect(response.body.data.labSlip.reference).toMatch(/^CDL-\d{4}-\d{6}$/);

    expect(response.body.data.labSlip.source).toBe(LAB_SLIP_SOURCE.PORTAL);

    expect(response.body.data.labSlip.doctor.id).toBe(doctor.id);

    expect(response.body.data.labSlip.items[0].productName).toBe(
      "Zirconia Crown",
    );
  });

  it("rejects Doctor access to an unrelated clinic", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const doctor = await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const clinic = await createClinic(admin);

    const { product } = await setupCatalogue(admin);

    const agent = request.agent(app);

    await login(agent, doctor.phone);

    const response = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("CLINIC_NOT_FOUND");
  });

  it("does not allow Doctor to submit a phone-source slip", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const doctor = await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const clinic = await createClinic(admin);

    await addMembership({
      clinic,
      user: doctor,
      admin,
    });

    const { product } = await setupCatalogue(admin);

    const agent = request.agent(app);

    await login(agent, doctor.phone);

    const response = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,

        source: LAB_SLIP_SOURCE.PHONE,
      }),
    );

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("INVALID_LAB_SLIP_SOURCE");
  });

  it("allows Clinic Staff to submit for a Doctor in the same clinic", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const doctor = await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const staff = await createUser({
      name: "Clinic Staff",

      phone: "9876543212",

      role: USER_ROLES.CLINIC_STAFF,
    });

    const clinic = await createClinic(admin);

    await addMembership({
      clinic,
      user: doctor,
      admin,
    });

    await addMembership({
      clinic,
      user: staff,
      admin,
    });

    const { product } = await setupCatalogue(admin);

    const agent = request.agent(app);

    await login(agent, staff.phone);

    const response = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,

        doctorId: doctor.id,
      }),
    );

    expect(response.status).toBe(201);

    expect(response.body.data.labSlip.doctor.id).toBe(doctor.id);
  });

  it("allows Cera Staff to record a phone request", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const doctor = await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const ceraStaff = await createUser({
      name: "Cera Staff",

      phone: "9876543212",

      role: USER_ROLES.CERA_STAFF,
    });

    const clinic = await createClinic(admin);

    await addMembership({
      clinic,
      user: doctor,
      admin,
    });

    const { product } = await setupCatalogue(admin);

    const agent = request.agent(app);

    await login(agent, ceraStaff.phone);

    const response = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,

        doctorId: doctor.id,

        source: LAB_SLIP_SOURCE.PHONE,
      }),
    );

    expect(response.status).toBe(201);

    expect(response.body.data.labSlip.source).toBe(LAB_SLIP_SOURCE.PHONE);
  });

  it("returns only the Doctor's own lab slips", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const doctorA = await createUser({
      name: "Doctor A",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const doctorB = await createUser({
      name: "Doctor B",

      phone: "9876543212",

      role: USER_ROLES.DOCTOR,
    });

    const clinic = await createClinic(admin);

    await addMembership({
      clinic,
      user: doctorA,
      admin,
    });

    await addMembership({
      clinic,
      user: doctorB,
      admin,
    });

    const { product } = await setupCatalogue(admin);

    const staffAgent = request.agent(app);

    await login(staffAgent, admin.phone);

    await staffAgent
      .post("/api/v1/lab-slips")
      .send(
        payload({
          clinic,
          product,

          doctorId: doctorA.id,
        }),
      )
      .expect(201);

    await staffAgent
      .post("/api/v1/lab-slips")
      .send(
        payload({
          clinic,
          product,

          doctorId: doctorB.id,
        }),
      )
      .expect(201);

    const doctorAgent = request.agent(app);

    await login(doctorAgent, doctorA.phone);

    const response = await doctorAgent.get("/api/v1/lab-slips");

    expect(response.status).toBe(200);

    expect(response.body.data.labSlips).toHaveLength(1);

    expect(response.body.data.labSlips[0].doctor.id).toBe(doctorA.id);
  });

  it("does not allow Scanning Staff to browse lab slips", async () => {
    await createUser({
      name: "Scanner",

      phone: "9876543213",

      role: USER_ROLES.SCANNING_STAFF,
    });

    const agent = request.agent(app);

    await login(agent, "9876543213");

    const response = await agent.get("/api/v1/lab-slips");

    expect(response.status).toBe(403);
  });

  it("generates unique sequential references", async () => {
    const first = await LabSlipCounter.findOneAndUpdate(
      {
        _id: "lab-slip:2026",
      },
      {
        $inc: {
          value: 1,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    const second = await LabSlipCounter.findOneAndUpdate(
      {
        _id: "lab-slip:2026",
      },
      {
        $inc: {
          value: 1,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    expect(first.value).toBe(1);

    expect(second.value).toBe(2);
  });
});
