import request from "supertest";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CATALOG_STATUS,
  CLINIC_TYPES,
  LAB_SLIP_SOURCE,
  LAB_SLIP_URGENCY,
  PRODUCTION_STATUS,
  USER_ROLES,
  USER_STATUS,
  SCAN_BOOKING_STATUS,
} from "@cera/shared";

vi.mock("./labSlipAttachment.storage.js", () => ({
  storeLabSlipAttachment: vi.fn().mockResolvedValue(undefined),

  deleteLabSlipAttachmentObject: vi.fn().mockResolvedValue(undefined),

  createLabSlipAttachmentAccessUrl: vi
    .fn()
    .mockResolvedValue("https://example.test/private-file"),
}));

import { app } from "../../app.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { hashPassword } from "../auth/password.js";

import { User } from "../users/user.model.js";

import { ScanBooking } from "../scanBookings/scanBooking.model.js";

import { Clinic } from "../clinics/clinic.model.js";

import { ClinicMembership } from "../clinics/clinicMembership.model.js";

import { Category } from "../catalog/category.model.js";

import { Product } from "../catalog/product.model.js";

import { LabSlip } from "./labSlip.model.js";

import { Production } from "../production/production.model.js";

import { LabSlipCounter } from "./labSlipCounter.model.js";

import { LabSlipAttachment } from "./labSlipAttachment.model.js";

import {
  deleteLabSlipAttachmentObject,
  storeLabSlipAttachment,
} from "./labSlipAttachment.storage.js";

const password = "StrongPass123";

const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=",
  "base64",
);

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

async function createDoctorLabSlipFixture() {
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

  const doctorAgent = request.agent(app);

  await login(doctorAgent, doctor.phone);

  const response = await doctorAgent.post("/api/v1/lab-slips").send(
    payload({
      clinic,
      product,
    }),
  );

  expect(response.status).toBe(201);

  return {
    admin,
    doctor,
    clinic,
    product,
    doctorAgent,
    labSlip: response.body.data.labSlip,
  };
}

async function uploadTestAttachment({
  agent,
  labSlipId,
  filename = "reference.png",
}) {
  const response = await agent
    .post(`/api/v1/lab-slips/${labSlipId}/attachments`)
    .attach("attachment", VALID_PNG, {
      filename,
      contentType: "image/png",
    });

  expect(response.status).toBe(201);

  return response.body.data.attachment;
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
    await LabSlipAttachment.syncIndexes();
    await Production.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("allows Doctor to upload an attachment to their Lab Slip", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const response = await agent
      .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
      .attach("attachment", VALID_PNG, {
        filename: "reference.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);

    expect(response.body.data.attachment.originalFilename).toBe(
      "reference.png",
    );

    expect(response.body.data.attachment.contentType).toBe("image/png");

    expect(response.body.data.attachment.sizeBytes).toBe(VALID_PNG.length);

    expect(response.body.data.attachment.uploadedByUserId).toBe(doctor.id);

    expect(response.body.data.attachment.objectKey).toBeUndefined();

    const storedAttachment = await LabSlipAttachment.findById(
      response.body.data.attachment.id,
    );

    expect(storedAttachment).not.toBeNull();

    expect(storedAttachment.labSlipId.toString()).toBe(labSlip.id);

    expect(storedAttachment.uploadedByUserId.toString()).toBe(doctor.id);
  });

  it("rejects an attachment whose content does not match its file type", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    const labSlip = createResponse.body.data.labSlip;

    const fakePng = Buffer.from("this is not really a PNG file");

    const response = await agent
      .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
      .attach("attachment", fakePng, {
        filename: "fake.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("ATTACHMENT_TYPE_INVALID");

    expect(
      await LabSlipAttachment.countDocuments({
        labSlipId: labSlip.id,
      }),
    ).toBe(0);
  });

  it("rejects attachment uploads after production has started", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    const labSlip = createResponse.body.data.labSlip;

    await Production.findOneAndUpdate(
      {
        labSlipId: labSlip.id,
      },
      {
        $set: {
          status: PRODUCTION_STATUS.IN_PRODUCTION,
          startedAt: new Date(),
        },
      },
    );

    const response = await agent
      .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
      .attach("attachment", VALID_PNG, {
        filename: "reference.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("ATTACHMENT_PRODUCTION_LOCKED");
  });

  it("does not allow Scanning Staff to upload Lab Slip attachments", async () => {
    const scanner = await createUser({
      name: "Scanner",
      phone: "9876543213",
      role: USER_ROLES.SCANNING_STAFF,
    });

    const agent = request.agent(app);

    await login(agent, scanner.phone);

    const response = await agent
      .post("/api/v1/lab-slips/507f1f77bcf86cd799439011/attachments")
      .attach("attachment", VALID_PNG, {
        filename: "reference.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(403);
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

  it("creates a submitted Production record with every new Lab Slip", async () => {
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

    const labSlip = response.body.data.labSlip;

    const production = await Production.findOne({
      labSlipId: labSlip.id,
    });

    expect(production).not.toBeNull();

    expect(production.status).toBe(PRODUCTION_STATUS.SUBMITTED);

    expect(production.labSlipId.toString()).toBe(labSlip.id);

    expect(production.startedAt).toBeNull();

    expect(production.completedAt).toBeNull();

    expect(production.history).toHaveLength(0);
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

  it("allows a Doctor to edit their own submitted lab slip", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const response = await agent.patch(`/api/v1/lab-slips/${labSlip.id}`).send({
      urgency: LAB_SLIP_URGENCY.URGENT,

      patient: {
        name: "Updated Patient",
        reference: "PAT-UPDATED",
      },

      items: [
        {
          productId: product.id,
          teeth: ["UL1", "UL2"],
          shade: "B1",
          ponticDesign: "Modified",
          designNotes: "Updated design notes",
        },
      ],

      notes: "Updated general notes",
    });

    expect(response.status).toBe(200);

    expect(response.body.data.labSlip.urgency).toBe(LAB_SLIP_URGENCY.URGENT);

    expect(response.body.data.labSlip.patient.name).toBe("Updated Patient");

    expect(response.body.data.labSlip.patient.reference).toBe("PAT-UPDATED");

    expect(response.body.data.labSlip.items[0].teeth).toEqual(["UL1", "UL2"]);

    expect(response.body.data.labSlip.items[0].shade).toBe("B1");

    expect(response.body.data.labSlip.notes).toBe("Updated general notes");

    const storedLabSlip = await LabSlip.findById(labSlip.id);

    expect(storedLabSlip.productionEditOverrideHistory).toHaveLength(0);
  });

  it("allows Clinic Staff to edit a lab slip from their assigned clinic", async () => {
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

    const doctorAgent = request.agent(app);

    await login(doctorAgent, doctor.phone);

    const createResponse = await doctorAgent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const staffAgent = request.agent(app);

    await login(staffAgent, staff.phone);

    const response = await staffAgent
      .patch(`/api/v1/lab-slips/${labSlip.id}`)
      .send({
        notes: "Updated by clinic staff",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.labSlip.notes).toBe("Updated by clinic staff");
  });

  it("does not allow a Doctor to edit another Doctor's lab slip", async () => {
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

    const doctorBAgent = request.agent(app);

    await login(doctorBAgent, doctorB.phone);

    const createResponse = await doctorBAgent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const doctorAAgent = request.agent(app);

    await login(doctorAAgent, doctorA.phone);

    const response = await doctorAAgent
      .patch(`/api/v1/lab-slips/${labSlip.id}`)
      .send({
        notes: "Unauthorized change",
      });

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("LAB_SLIP_NOT_FOUND");

    const storedLabSlip = await LabSlip.findById(labSlip.id);

    expect(storedLabSlip.notes).toBe("General notes");
  });

  it("does not allow immutable lab slip identity fields to be changed", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const response = await agent.patch(`/api/v1/lab-slips/${labSlip.id}`).send({
      notes: "Attempted immutable edit",

      clinicId: "507f1f77bcf86cd799439011",
      doctorId: "507f191e810c19729de860ea",
      reference: "CDL-FAKE-999999",
      source: LAB_SLIP_SOURCE.PHONE,
      scanRequired: false,
    });

    expect(response.status).toBe(400);

    const storedLabSlip = await LabSlip.findById(labSlip.id);

    expect(storedLabSlip.reference).toBe(labSlip.reference);

    expect(storedLabSlip.clinicId.toString()).toBe(clinic.id);

    expect(storedLabSlip.doctorId.toString()).toBe(doctor.id);

    expect(storedLabSlip.source).toBe(LAB_SLIP_SOURCE.PORTAL);

    expect(storedLabSlip.scanRequired).toBe(true);
  });

  it("syncs an active Scan Booking when Lab Slip urgency changes", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const bookingResponse = await agent.post("/api/v1/scan-bookings").send({
      labSlipId: labSlip.id,

      requestedStartAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    expect(bookingResponse.status).toBe(201);

    expect(bookingResponse.body.data.scanBooking.urgency).toBe(
      LAB_SLIP_URGENCY.STANDARD,
    );

    expect(bookingResponse.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.PENDING_REVIEW,
    );

    const updateResponse = await agent
      .patch(`/api/v1/lab-slips/${labSlip.id}`)
      .send({
        urgency: LAB_SLIP_URGENCY.URGENT,
      });

    expect(updateResponse.status).toBe(200);

    expect(updateResponse.body.data.labSlip.urgency).toBe(
      LAB_SLIP_URGENCY.URGENT,
    );

    const storedBooking = await ScanBooking.findOne({
      labSlipId: labSlip.id,
    });

    expect(storedBooking).not.toBeNull();

    expect(storedBooking.urgency).toBe(LAB_SLIP_URGENCY.URGENT);
  });

  it("does not change urgency on a terminal Scan Booking", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const bookingResponse = await agent.post("/api/v1/scan-bookings").send({
      labSlipId: labSlip.id,

      requestedStartAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    expect(bookingResponse.status).toBe(201);

    const booking = bookingResponse.body.data.scanBooking;

    const cancelResponse = await agent
      .post(`/api/v1/scan-bookings/${booking.id}/cancel`)
      .send({
        reason: "Patient unavailable",
      });

    expect(cancelResponse.status).toBe(200);

    expect(cancelResponse.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.CANCELLED,
    );

    const updateResponse = await agent
      .patch(`/api/v1/lab-slips/${labSlip.id}`)
      .send({
        urgency: LAB_SLIP_URGENCY.URGENT,
      });

    expect(updateResponse.status).toBe(200);

    expect(updateResponse.body.data.labSlip.urgency).toBe(
      LAB_SLIP_URGENCY.URGENT,
    );

    const storedBooking = await ScanBooking.findById(booking.id);

    expect(storedBooking).not.toBeNull();

    expect(storedBooking.status).toBe(SCAN_BOOKING_STATUS.CANCELLED);

    expect(storedBooking.urgency).toBe(LAB_SLIP_URGENCY.STANDARD);
  });

  it("returns the linked Production status with a Lab Slip", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const response = await agent.get(`/api/v1/lab-slips/${labSlip.id}`);

    expect(response.status).toBe(200);

    expect(response.body.data.labSlip.production).toEqual({
      status: PRODUCTION_STATUS.SUBMITTED,
    });
  });

  it("does not allow Cera Staff to edit after production has started", async () => {
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

    const doctorAgent = request.agent(app);

    await login(doctorAgent, doctor.phone);

    const createResponse = await doctorAgent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    await Production.findOneAndUpdate(
      {
        labSlipId: labSlip.id,
      },
      {
        $set: {
          status: PRODUCTION_STATUS.IN_PRODUCTION,
          startedAt: new Date(),
        },
      },
    );

    const staffAgent = request.agent(app);

    await login(staffAgent, ceraStaff.phone);

    const response = await staffAgent
      .patch(`/api/v1/lab-slips/${labSlip.id}`)
      .send({
        notes: "Attempted production edit",

        /*
         * Supplying a reason must not let
         * Cera Staff bypass the Admin-only lock.
         */
        overrideReason: "Trying to override",
      });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("LAB_SLIP_PRODUCTION_LOCKED");

    const storedLabSlip = await LabSlip.findById(labSlip.id);

    expect(storedLabSlip.notes).toBe("General notes");

    expect(storedLabSlip.productionEditOverrideHistory).toHaveLength(0);
  });

  it("does not allow a Doctor to edit after production is completed", async () => {
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

    const createResponse = await agent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    const startedAt = new Date(Date.now() - 60 * 60 * 1000);

    await Production.findOneAndUpdate(
      {
        labSlipId: labSlip.id,
      },
      {
        $set: {
          status: PRODUCTION_STATUS.COMPLETED,
          startedAt,
          completedAt: new Date(),
        },
      },
    );

    const response = await agent.patch(`/api/v1/lab-slips/${labSlip.id}`).send({
      notes: "Attempted completed-case edit",
    });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("LAB_SLIP_PRODUCTION_LOCKED");

    const storedLabSlip = await LabSlip.findById(labSlip.id);

    expect(storedLabSlip.notes).toBe("General notes");
  });

  it("requires an override reason when Admin edits after production has started", async () => {
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

    const doctorAgent = request.agent(app);

    await login(doctorAgent, doctor.phone);

    const createResponse = await doctorAgent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    await Production.findOneAndUpdate(
      {
        labSlipId: labSlip.id,
      },
      {
        $set: {
          status: PRODUCTION_STATUS.IN_PRODUCTION,
          startedAt: new Date(),
        },
      },
    );

    const adminAgent = request.agent(app);

    await login(adminAgent, admin.phone);

    const response = await adminAgent
      .patch(`/api/v1/lab-slips/${labSlip.id}`)
      .send({
        notes: "Admin edit without reason",
      });

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("LAB_SLIP_OVERRIDE_REASON_REQUIRED");

    const storedLabSlip = await LabSlip.findById(labSlip.id);

    expect(storedLabSlip.notes).toBe("General notes");

    expect(storedLabSlip.productionEditOverrideHistory).toHaveLength(0);
  });

  it("allows Admin to override the production edit lock with an audited reason", async () => {
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

    const doctorAgent = request.agent(app);

    await login(doctorAgent, doctor.phone);

    const createResponse = await doctorAgent.post("/api/v1/lab-slips").send(
      payload({
        clinic,
        product,
      }),
    );

    expect(createResponse.status).toBe(201);

    const labSlip = createResponse.body.data.labSlip;

    await Production.findOneAndUpdate(
      {
        labSlipId: labSlip.id,
      },
      {
        $set: {
          status: PRODUCTION_STATUS.IN_PRODUCTION,
          startedAt: new Date(),
        },
      },
    );

    const adminAgent = request.agent(app);

    await login(adminAgent, admin.phone);

    const response = await adminAgent
      .patch(`/api/v1/lab-slips/${labSlip.id}`)
      .send({
        notes: "Corrected manufacturing instructions",

        overrideReason:
          "Doctor confirmed that the original instructions were incorrect",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.labSlip.notes).toBe(
      "Corrected manufacturing instructions",
    );

    const storedLabSlip = await LabSlip.findById(labSlip.id);

    expect(storedLabSlip.productionEditOverrideHistory).toHaveLength(1);

    const [auditEntry] = storedLabSlip.productionEditOverrideHistory;

    expect(auditEntry.productionStatus).toBe(PRODUCTION_STATUS.IN_PRODUCTION);

    expect(auditEntry.reason).toBe(
      "Doctor confirmed that the original instructions were incorrect",
    );

    expect(auditEntry.changedByUserId.toString()).toBe(admin.id);

    expect(auditEntry.changedAt).toBeInstanceOf(Date);

    /*
     * A Lab Slip edit override is not a
     * Production status transition.
     */
    const production = await Production.findOne({
      labSlipId: labSlip.id,
    });

    expect(production.status).toBe(PRODUCTION_STATUS.IN_PRODUCTION);

    expect(production.history).toHaveLength(0);
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

  it("allows the uploader to list Lab Slip attachments", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    const uploaded = await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    const response = await doctorAgent.get(
      `/api/v1/lab-slips/${labSlip.id}/attachments`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.attachments).toHaveLength(1);

    const [attachment] = response.body.data.attachments;

    expect(attachment.id).toBe(uploaded.id);
    expect(attachment.originalFilename).toBe("reference.png");
    expect(attachment.canDelete).toBe(true);
    expect(attachment.objectKey).toBeUndefined();
  });

  it("returns temporary private access for an authorized attachment", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    const attachment = await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    const response = await doctorAgent.get(
      `/api/v1/lab-slips/${labSlip.id}/attachments/${attachment.id}/access`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.url).toBe("https://example.test/private-file");

    expect(response.body.data.expiresInSeconds).toBe(300);

    expect(response.body.data.attachment.id).toBe(attachment.id);

    expect(response.body.data.attachment.objectKey).toBeUndefined();
  });

  it("does not allow another Doctor to view Lab Slip attachments", async () => {
    const { admin, doctorAgent, clinic, labSlip } =
      await createDoctorLabSlipFixture();

    await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    const otherDoctor = await createUser({
      name: "Other Doctor",
      phone: "9876543212",
      role: USER_ROLES.DOCTOR,
    });

    await addMembership({
      clinic,
      user: otherDoctor,
      admin,
    });

    const otherAgent = request.agent(app);

    await login(otherAgent, otherDoctor.phone);

    const response = await otherAgent.get(
      `/api/v1/lab-slips/${labSlip.id}/attachments`,
    );

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("LAB_SLIP_NOT_FOUND");
  });

  it("allows the original uploader to delete before production starts", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    const attachment = await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    const response = await doctorAgent.delete(
      `/api/v1/lab-slips/${labSlip.id}/attachments/${attachment.id}`,
    );

    expect(response.status).toBe(204);

    expect(await LabSlipAttachment.findById(attachment.id)).toBeNull();
  });

  it("does not allow Admin to delete another user's attachment", async () => {
    const { admin, doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    const attachment = await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    const adminAgent = request.agent(app);

    await login(adminAgent, admin.phone);

    const response = await adminAgent.delete(
      `/api/v1/lab-slips/${labSlip.id}/attachments/${attachment.id}`,
    );

    expect(response.status).toBe(403);

    expect(response.body.error.code).toBe("ATTACHMENT_DELETE_FORBIDDEN");

    expect(await LabSlipAttachment.findById(attachment.id)).not.toBeNull();
  });

  it("does not allow attachment deletion after production starts", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    const attachment = await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    await Production.findOneAndUpdate(
      {
        labSlipId: labSlip.id,
      },
      {
        $set: {
          status: PRODUCTION_STATUS.IN_PRODUCTION,
          startedAt: new Date(),
        },
      },
    );

    const response = await doctorAgent.delete(
      `/api/v1/lab-slips/${labSlip.id}/attachments/${attachment.id}`,
    );

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("ATTACHMENT_PRODUCTION_LOCKED");

    expect(await LabSlipAttachment.findById(attachment.id)).not.toBeNull();
  });

  it("allows assigned Scanning Staff to view the Lab Slip and attachments", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    const attachment = await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    const scanner = await createUser({
      name: "Scanner",
      phone: "9876543213",
      role: USER_ROLES.SCANNING_STAFF,
    });

    const bookingResponse = await doctorAgent
      .post("/api/v1/scan-bookings")
      .send({
        labSlipId: labSlip.id,

        requestedStartAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
      });

    expect(bookingResponse.status).toBe(201);

    await ScanBooking.findByIdAndUpdate(
      bookingResponse.body.data.scanBooking.id,
      {
        $set: {
          assignedScanningStaffId: scanner._id,
          status: SCAN_BOOKING_STATUS.ASSIGNED,
        },
      },
    );

    const scannerAgent = request.agent(app);

    await login(scannerAgent, scanner.phone);

    const labSlipResponse = await scannerAgent.get(
      `/api/v1/lab-slips/${labSlip.id}`,
    );

    expect(labSlipResponse.status).toBe(403);

    const attachmentsResponse = await scannerAgent.get(
      `/api/v1/lab-slips/${labSlip.id}/attachments`,
    );

    expect(attachmentsResponse.status).toBe(200);

    expect(attachmentsResponse.body.data.attachments).toHaveLength(1);

    expect(attachmentsResponse.body.data.attachments[0].canDelete).toBe(false);

    const accessResponse = await scannerAgent.get(
      `/api/v1/lab-slips/${labSlip.id}/attachments/${attachment.id}/access`,
    );

    expect(accessResponse.status).toBe(200);

    expect(accessResponse.body.data.url).toBe(
      "https://example.test/private-file",
    );
  });

  it("does not allow Scanning Staff to open the full Lab Slip detail", async () => {
    const { labSlip } = await createDoctorLabSlipFixture();

    const scanner = await createUser({
      name: "Scanner",
      phone: "9876543213",
      role: USER_ROLES.SCANNING_STAFF,
    });

    const scannerAgent = request.agent(app);

    await login(scannerAgent, scanner.phone);

    const response = await scannerAgent.get(`/api/v1/lab-slips/${labSlip.id}`);

    expect(response.status).toBe(403);
  });

  it("does not allow unassigned Scanning Staff to view Lab Slip attachments", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    const scanner = await createUser({
      name: "Scanner",
      phone: "9876543213",
      role: USER_ROLES.SCANNING_STAFF,
    });

    const scannerAgent = request.agent(app);

    await login(scannerAgent, scanner.phone);

    const response = await scannerAgent.get(
      `/api/v1/lab-slips/${labSlip.id}/attachments`,
    );

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("LAB_SLIP_NOT_FOUND");
  });

  it("rejects attachments larger than 10 MB", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    const oversizedFile = Buffer.alloc(10 * 1024 * 1024 + 1, 0);

    const response = await doctorAgent
      .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
      .attach("attachment", oversizedFile, {
        filename: "large.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("ATTACHMENT_TOO_LARGE");

    expect(
      await LabSlipAttachment.countDocuments({
        labSlipId: labSlip.id,
      }),
    ).toBe(0);
  });

  it("rejects a sixth attachment on the same Lab Slip", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    for (let index = 1; index <= 5; index += 1) {
      const response = await doctorAgent
        .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
        .attach("attachment", VALID_PNG, {
          filename: `reference-${index}.png`,
          contentType: "image/png",
        });

      expect(response.status).toBe(201);
    }

    expect(
      await LabSlipAttachment.countDocuments({
        labSlipId: labSlip.id,
      }),
    ).toBe(5);

    const response = await doctorAgent
      .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
      .attach("attachment", VALID_PNG, {
        filename: "reference-6.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("ATTACHMENT_LIMIT_REACHED");

    expect(
      await LabSlipAttachment.countDocuments({
        labSlipId: labSlip.id,
      }),
    ).toBe(5);
  });

  it("prevents concurrent uploads from exceeding the Lab Slip attachment limit", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    /*
     * Leave exactly one attachment slot available.
     */
    for (let index = 1; index <= 4; index += 1) {
      await uploadTestAttachment({
        agent: doctorAgent,
        labSlipId: labSlip.id,
        filename: `existing-${index}.png`,
      });
    }

    expect(
      await LabSlipAttachment.countDocuments({
        labSlipId: labSlip.id,
      }),
    ).toBe(4);

    vi.clearAllMocks();

    /*
     * Hold both R2 uploads until both HTTP requests have passed
     * authorization/state/count preflight.
     *
     * Without the database capacity-slot guard, both requests
     * would then persist and the Lab Slip would end with 6 files.
     */
    let waitingUploads = 0;
    let releaseUploads;

    const uploadGate = new Promise((resolve) => {
      releaseUploads = resolve;
    });

    storeLabSlipAttachment.mockImplementation(async () => {
      waitingUploads += 1;

      if (waitingUploads === 2) {
        releaseUploads();
      }

      await uploadGate;
    });

    try {
      const firstRequest = doctorAgent
        .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
        .attach("attachment", VALID_PNG, {
          filename: "concurrent-a.png",
          contentType: "image/png",
        });

      const secondRequest = doctorAgent
        .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
        .attach("attachment", VALID_PNG, {
          filename: "concurrent-b.png",
          contentType: "image/png",
        });

      const responses = await Promise.all([firstRequest, secondRequest]);

      const statuses = responses.map((response) => response.status).sort();

      expect(statuses).toEqual([201, 409]);

      const rejectedResponse = responses.find(
        (response) => response.status === 409,
      );

      expect(rejectedResponse.body.error.code).toBe("ATTACHMENT_LIMIT_REACHED");

      expect(
        await LabSlipAttachment.countDocuments({
          labSlipId: labSlip.id,
        }),
      ).toBe(5);

      /*
       * The losing request already placed its object in storage,
       * so it must clean that object up.
       */
      expect(deleteLabSlipAttachmentObject).toHaveBeenCalledTimes(1);
    } finally {
      storeLabSlipAttachment.mockResolvedValue(undefined);
    }
  });

  it("allows creating a Lab Slip without attachments", async () => {
    const { labSlip } = await createDoctorLabSlipFixture();

    expect(labSlip.id).toBeTruthy();

    expect(
      await LabSlipAttachment.countDocuments({
        labSlipId: labSlip.id,
      }),
    ).toBe(0);
  });

  it("rejects an unrelated Doctor before processing the attachment body", async () => {
    const { admin, clinic, labSlip } = await createDoctorLabSlipFixture();

    const otherDoctor = await createUser({
      name: "Other Doctor",
      phone: "9876543212",
      role: USER_ROLES.DOCTOR,
    });

    await addMembership({
      clinic,
      user: otherDoctor,
      admin,
    });

    const otherAgent = request.agent(app);

    await login(otherAgent, otherDoctor.phone);

    const response = await otherAgent
      .post(`/api/v1/lab-slips/${labSlip.id}/attachments`)
      .attach("attachment", VALID_PNG, {
        filename: "reference.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LAB_SLIP_NOT_FOUND");

    expect(
      await LabSlipAttachment.countDocuments({
        labSlipId: labSlip.id,
      }),
    ).toBe(0);
  });

  it("removes Scanning Staff attachment access after the assigned scan is completed", async () => {
    const { doctorAgent, labSlip } = await createDoctorLabSlipFixture();

    const attachment = await uploadTestAttachment({
      agent: doctorAgent,
      labSlipId: labSlip.id,
    });

    const scanner = await createUser({
      name: "Scanner",
      phone: "9876543213",
      role: USER_ROLES.SCANNING_STAFF,
    });

    const bookingResponse = await doctorAgent
      .post("/api/v1/scan-bookings")
      .send({
        labSlipId: labSlip.id,
        requestedStartAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
      });

    await ScanBooking.findByIdAndUpdate(
      bookingResponse.body.data.scanBooking.id,
      {
        $set: {
          assignedScanningStaffId: scanner._id,
          status: SCAN_BOOKING_STATUS.COMPLETED,
          completedAt: new Date(),
        },
      },
    );

    const scannerAgent = request.agent(app);

    await login(scannerAgent, scanner.phone);

    const response = await scannerAgent.get(
      `/api/v1/lab-slips/${labSlip.id}/attachments/${attachment.id}/access`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LAB_SLIP_NOT_FOUND");
  });
});
