import mongoose from "mongoose";

import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  LAB_SLIP_SOURCE,
  LAB_SLIP_STATUS,
  LAB_SLIP_URGENCY,
  PRODUCTION_STATUS,
  SCAN_BOOKING_STATUS,
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

import { LabSlip } from "../labSlips/labSlip.model.js";

import { ScanBooking } from "../scanBookings/scanBooking.model.js";

import { User } from "../users/user.model.js";

import { Production } from "./production.model.js";

const PASSWORD = "StrongPass123";

let passwordHash;

let slipSequence = 0;

let scanSequence = 0;

async function createUser({ name, phone, role }) {
  return User.create({
    name,
    phone,
    role,
    status: USER_STATUS.ACTIVE,
    passwordHash,
  });
}

async function loginAgent(user) {
  const agent = request.agent(app);

  const response = await agent.post("/api/v1/auth/login").send({
    identifier: user.phone,
    password: PASSWORD,
  });

  expect(response.status).toBe(200);

  return agent;
}

async function createContext() {
  const admin = await createUser({
    name: "Cera Admin",
    phone: "9876600001",
    role: USER_ROLES.CERA_ADMIN,
  });

  const ceraStaff = await createUser({
    name: "Cera Staff",
    phone: "9876600002",
    role: USER_ROLES.CERA_STAFF,
  });

  const doctor = await createUser({
    name: "Doctor",
    phone: "9876600003",
    role: USER_ROLES.DOCTOR,
  });

  return {
    admin,
    ceraStaff,
    doctor,
  };
}

async function createLabSlip({
  doctor,
  createdBy = doctor,
  scanRequired = false,
}) {
  slipSequence += 1;

  return LabSlip.create({
    reference: `CDL-PROD-${String(slipSequence).padStart(6, "0")}`,

    source: LAB_SLIP_SOURCE.PORTAL,

    status: LAB_SLIP_STATUS.SUBMITTED,

    urgency: LAB_SLIP_URGENCY.STANDARD,

    clinicId: new mongoose.Types.ObjectId(),

    doctorId: doctor._id,

    patient: {
      name: "Production Patient",
      reference: `PROD-PAT-${slipSequence}`,
    },

    items: [
      {
        productId: new mongoose.Types.ObjectId(),

        productName: "Zirconia Crown",

        categoryId: new mongoose.Types.ObjectId(),

        categoryName: "Fixed Prosthesis",

        teeth: ["UR1"],

        shade: "A2",

        ponticDesign: null,

        designNotes: null,
      },
    ],

    notes: null,

    scanRequired,

    createdByUserId: createdBy._id,
  });
}

async function createProductionCase({ context, scanRequired = false }) {
  const labSlip = await createLabSlip({
    doctor: context.doctor,
    scanRequired,
  });

  const production = await Production.create({
    labSlipId: labSlip._id,
  });

  return {
    labSlip,
    production,
  };
}

async function createCompletedScan({ context, labSlip }) {
  scanSequence += 1;

  return ScanBooking.create({
    reference: `SCAN-PROD-${String(scanSequence).padStart(6, "0")}`,

    labSlipId: labSlip._id,

    clinicId: labSlip.clinicId,

    doctorId: context.doctor._id,

    urgency: labSlip.urgency,

    status: SCAN_BOOKING_STATUS.COMPLETED,

    requestedStartAt: new Date(),

    confirmedStartAt: new Date(),

    requestedByUserId: context.doctor._id,

    completedByUserId: context.ceraStaff._id,

    completedAt: new Date(),
  });
}

describe("Production Workflow", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    passwordHash = await hashPassword(PASSWORD);

    await User.syncIndexes();
    await LabSlip.syncIndexes();
    await ScanBooking.syncIndexes();
    await Production.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("lists only active production cases by default", async () => {
    const context = await createContext();

    const submittedCase = await createProductionCase({
      context,
      scanRequired: false,
    });

    const inProductionCase = await createProductionCase({
      context,
      scanRequired: true,
    });

    const completedCase = await createProductionCase({
      context,
      scanRequired: false,
    });

    await Production.findByIdAndUpdate(inProductionCase.production._id, {
      status: PRODUCTION_STATUS.IN_PRODUCTION,
      startedAt: new Date(),
    });

    await Production.findByIdAndUpdate(completedCase.production._id, {
      status: PRODUCTION_STATUS.COMPLETED,
      startedAt: new Date(Date.now() - 60 * 60 * 1000),
      completedAt: new Date(),
    });

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent.get("/api/v1/productions");

    expect(response.status).toBe(200);

    expect(response.body.data.productions).toHaveLength(2);

    expect(response.body.data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      pages: 1,
    });

    const ids = response.body.data.productions.map(
      (production) => production.id,
    );

    expect(ids).toContain(submittedCase.production.id);

    expect(ids).toContain(inProductionCase.production.id);

    expect(ids).not.toContain(completedCase.production.id);

    const statuses = response.body.data.productions.map(
      (production) => production.status,
    );

    expect(statuses).toContain(PRODUCTION_STATUS.SUBMITTED);

    expect(statuses).toContain(PRODUCTION_STATUS.IN_PRODUCTION);

    expect(statuses).not.toContain(PRODUCTION_STATUS.COMPLETED);

    const submitted = response.body.data.productions.find(
      (production) => production.id === submittedCase.production.id,
    );

    expect(submitted.labSlip.reference).toBe(submittedCase.labSlip.reference);

    expect(submitted.labSlip.patient.name).toBe("Production Patient");

    expect(submitted.labSlip.urgency).toBe(LAB_SLIP_URGENCY.STANDARD);

    expect(submitted.labSlip.scanRequired).toBe(false);

    expect(submitted.labSlip.createdAt).toBeTruthy();
  });

  it("allows Cera Staff to filter production cases by completed status", async () => {
    const context = await createContext();

    await createProductionCase({
      context,
    });

    const completedCase = await createProductionCase({
      context,
    });

    await Production.findByIdAndUpdate(completedCase.production._id, {
      status: PRODUCTION_STATUS.COMPLETED,
      startedAt: new Date(Date.now() - 60 * 60 * 1000),
      completedAt: new Date(),
    });

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent.get(
      `/api/v1/productions?status=${PRODUCTION_STATUS.COMPLETED}`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.productions).toHaveLength(1);

    expect(response.body.data.productions[0].id).toBe(
      completedCase.production.id,
    );

    expect(response.body.data.productions[0].status).toBe(
      PRODUCTION_STATUS.COMPLETED,
    );

    expect(response.body.data.pagination.total).toBe(1);
  });

  it("allows Cera Staff to list all production cases explicitly", async () => {
    const context = await createContext();

    const submittedCase = await createProductionCase({
      context,
    });

    const inProductionCase = await createProductionCase({
      context,
    });

    const completedCase = await createProductionCase({
      context,
    });

    await Production.findByIdAndUpdate(inProductionCase.production._id, {
      status: PRODUCTION_STATUS.IN_PRODUCTION,
      startedAt: new Date(),
    });

    await Production.findByIdAndUpdate(completedCase.production._id, {
      status: PRODUCTION_STATUS.COMPLETED,
      startedAt: new Date(Date.now() - 60 * 60 * 1000),
      completedAt: new Date(),
    });

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent.get("/api/v1/productions?status=ALL");

    expect(response.status).toBe(200);

    expect(response.body.data.productions).toHaveLength(3);

    expect(response.body.data.pagination.total).toBe(3);

    const ids = response.body.data.productions.map(
      (production) => production.id,
    );

    expect(ids).toContain(submittedCase.production.id);

    expect(ids).toContain(inProductionCase.production.id);

    expect(ids).toContain(completedCase.production.id);
  });

  it("paginates the production queue", async () => {
    const context = await createContext();

    await createProductionCase({
      context,
    });

    await createProductionCase({
      context,
    });

    await createProductionCase({
      context,
    });

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent.get("/api/v1/productions?page=2&limit=2");

    expect(response.status).toBe(200);

    expect(response.body.data.productions).toHaveLength(1);

    expect(response.body.data.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      pages: 2,
    });
  });

  it("allows Cera Admin to list production cases", async () => {
    const context = await createContext();

    await createProductionCase({
      context,
    });

    const agent = await loginAgent(context.admin);

    const response = await agent.get("/api/v1/productions");

    expect(response.status).toBe(200);

    expect(response.body.data.productions).toHaveLength(1);
  });

  it("allows Cera Staff to view a production case with history", async () => {
    const context = await createContext();

    const { labSlip, production } = await createProductionCase({
      context,
    });

    const agent = await loginAgent(context.ceraStaff);

    await agent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({
        note: "Fabrication started",
      })
      .expect(200);

    const response = await agent.get(`/api/v1/productions/${production.id}`);

    expect(response.status).toBe(200);

    expect(response.body.data.production.id).toBe(production.id);

    expect(response.body.data.production.status).toBe(
      PRODUCTION_STATUS.IN_PRODUCTION,
    );

    expect(response.body.data.production.labSlip.id).toBe(labSlip.id);

    expect(response.body.data.production.labSlip.reference).toBe(
      labSlip.reference,
    );

    expect(response.body.data.production.labSlip.patient.name).toBe(
      "Production Patient",
    );

    expect(response.body.data.production.labSlip.urgency).toBe(
      LAB_SLIP_URGENCY.STANDARD,
    );

    expect(response.body.data.production.labSlip.createdAt).toBeTruthy();

    expect(response.body.data.production.history).toHaveLength(1);

    expect(response.body.data.production.history[0].changedBy.id).toBe(
      context.ceraStaff.id,
    );

    expect(response.body.data.production.history[0].note).toBe(
      "Fabrication started",
    );
  });

  it("does not allow a Doctor to access production detail", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const agent = await loginAgent(context.doctor);

    const response = await agent.get(`/api/v1/productions/${production.id}`);

    expect(response.status).toBe(403);
  });

  it("returns not found for a missing production case", async () => {
    const context = await createContext();

    const agent = await loginAgent(context.ceraStaff);

    const missingId = new mongoose.Types.ObjectId().toString();

    const response = await agent.get(`/api/v1/productions/${missingId}`);

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("PRODUCTION_NOT_FOUND");
  });

  it("rejects an invalid production id", async () => {
    const context = await createContext();

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent.get("/api/v1/productions/not-an-object-id");

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("INVALID_PRODUCTION_ID");
  });

  it("does not allow a Doctor to access the production queue", async () => {
    const context = await createContext();

    await createProductionCase({
      context,
    });

    const agent = await loginAgent(context.doctor);

    const response = await agent.get("/api/v1/productions");

    expect(response.status).toBe(403);
  });

  it("rejects an invalid production status filter", async () => {
    const context = await createContext();

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent.get("/api/v1/productions?status=READY");

    expect(response.status).toBe(400);
  });

  it("allows Cera Staff to start a non-scan production case", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
      scanRequired: false,
    });

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({
        note: "Fabrication started",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.production.status).toBe(
      PRODUCTION_STATUS.IN_PRODUCTION,
    );

    expect(response.body.data.production.startedAt).toBeTruthy();

    expect(response.body.data.production.completedAt).toBeNull();

    expect(response.body.data.production.history).toHaveLength(1);

    expect(response.body.data.production.history[0].previousStatus).toBe(
      PRODUCTION_STATUS.SUBMITTED,
    );

    expect(response.body.data.production.history[0].newStatus).toBe(
      PRODUCTION_STATUS.IN_PRODUCTION,
    );

    expect(response.body.data.production.history[0].note).toBe(
      "Fabrication started",
    );

    expect(response.body.data.production.history[0].changedBy.id).toBe(
      context.ceraStaff.id,
    );
  });

  it("blocks production start when a required scan is not completed", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
      scanRequired: true,
    });

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({});

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("PRODUCTION_SCAN_NOT_COMPLETED");

    const storedProduction = await Production.findById(production.id);

    expect(storedProduction.status).toBe(PRODUCTION_STATUS.SUBMITTED);

    expect(storedProduction.startedAt).toBeNull();

    expect(storedProduction.history).toHaveLength(0);
  });

  it("allows production to start after the required scan is completed", async () => {
    const context = await createContext();

    const { labSlip, production } = await createProductionCase({
      context,
      scanRequired: true,
    });

    await createCompletedScan({
      context,
      labSlip,
    });

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({});

    expect(response.status).toBe(200);

    expect(response.body.data.production.status).toBe(
      PRODUCTION_STATUS.IN_PRODUCTION,
    );
  });

  it("allows Cera Staff to complete production", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const agent = await loginAgent(context.ceraStaff);

    const startResponse = await agent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({});

    expect(startResponse.status).toBe(200);

    const originalStartedAt = startResponse.body.data.production.startedAt;

    const response = await agent
      .post(`/api/v1/productions/${production.id}/complete`)
      .send({
        note: "Fabrication and final internal check completed",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.production.status).toBe(
      PRODUCTION_STATUS.COMPLETED,
    );

    expect(response.body.data.production.startedAt).toBe(originalStartedAt);

    expect(response.body.data.production.completedAt).toBeTruthy();

    expect(response.body.data.production.history).toHaveLength(2);

    expect(response.body.data.production.history[1].previousStatus).toBe(
      PRODUCTION_STATUS.IN_PRODUCTION,
    );

    expect(response.body.data.production.history[1].newStatus).toBe(
      PRODUCTION_STATUS.COMPLETED,
    );
  });

  it("does not allow a Doctor to start production", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const agent = await loginAgent(context.doctor);

    const response = await agent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({});

    expect(response.status).toBe(403);
  });

  it("does not allow a submitted production case to be completed directly", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const agent = await loginAgent(context.ceraStaff);

    const response = await agent
      .post(`/api/v1/productions/${production.id}/complete`)
      .send({});

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("INVALID_PRODUCTION_TRANSITION");
  });

  it("does not allow Cera Staff to move production backward", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const staffAgent = await loginAgent(context.ceraStaff);

    await staffAgent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({})
      .expect(200);

    const response = await staffAgent
      .post(`/api/v1/productions/${production.id}/move-back`)
      .send({
        targetStatus: PRODUCTION_STATUS.SUBMITTED,
        reason: "Case details need review",
      });

    expect(response.status).toBe(403);
  });

  it("allows Cera Admin to move completed production back to in production", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const staffAgent = await loginAgent(context.ceraStaff);

    const startResponse = await staffAgent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({});

    expect(startResponse.status).toBe(200);

    const originalStartedAt = startResponse.body.data.production.startedAt;

    await staffAgent
      .post(`/api/v1/productions/${production.id}/complete`)
      .send({})
      .expect(200);

    const adminAgent = await loginAgent(context.admin);

    const response = await adminAgent
      .post(`/api/v1/productions/${production.id}/move-back`)
      .send({
        targetStatus: PRODUCTION_STATUS.IN_PRODUCTION,
        reason: "Final internal check found an adjustment",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.production.status).toBe(
      PRODUCTION_STATUS.IN_PRODUCTION,
    );

    expect(response.body.data.production.startedAt).toBe(originalStartedAt);

    expect(response.body.data.production.completedAt).toBeNull();

    expect(response.body.data.production.history).toHaveLength(3);

    expect(response.body.data.production.history[2].note).toBe(
      "Final internal check found an adjustment",
    );

    expect(response.body.data.production.history[2].changedBy.id).toBe(
      context.admin.id,
    );
  });

  it("clears production timestamps when Admin moves in-production back to submitted", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const staffAgent = await loginAgent(context.ceraStaff);

    await staffAgent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({})
      .expect(200);

    const adminAgent = await loginAgent(context.admin);

    const response = await adminAgent
      .post(`/api/v1/productions/${production.id}/move-back`)
      .send({
        targetStatus: PRODUCTION_STATUS.SUBMITTED,
        reason: "Manufacturing details require correction",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.production.status).toBe(
      PRODUCTION_STATUS.SUBMITTED,
    );

    expect(response.body.data.production.startedAt).toBeNull();

    expect(response.body.data.production.completedAt).toBeNull();

    expect(response.body.data.production.history).toHaveLength(2);
  });

  it("requires a reason for an Admin backward transition", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const staffAgent = await loginAgent(context.ceraStaff);

    await staffAgent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({})
      .expect(200);

    const adminAgent = await loginAgent(context.admin);

    const response = await adminAgent
      .post(`/api/v1/productions/${production.id}/move-back`)
      .send({
        targetStatus: PRODUCTION_STATUS.SUBMITTED,
      });

    expect(response.status).toBe(400);
  });

  it("does not allow completed production to jump directly back to submitted", async () => {
    const context = await createContext();

    const { production } = await createProductionCase({
      context,
    });

    const staffAgent = await loginAgent(context.ceraStaff);

    await staffAgent
      .post(`/api/v1/productions/${production.id}/start`)
      .send({})
      .expect(200);

    await staffAgent
      .post(`/api/v1/productions/${production.id}/complete`)
      .send({})
      .expect(200);

    const adminAgent = await loginAgent(context.admin);

    const response = await adminAgent
      .post(`/api/v1/productions/${production.id}/move-back`)
      .send({
        targetStatus: PRODUCTION_STATUS.SUBMITTED,
        reason: "Attempted invalid jump",
      });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("INVALID_PRODUCTION_TRANSITION");
  });
});
