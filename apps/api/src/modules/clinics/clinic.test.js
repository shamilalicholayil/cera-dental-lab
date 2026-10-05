import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { CLINIC_TYPES, USER_ROLES, USER_STATUS } from "@cera/shared";

import { app } from "../../app.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { hashPassword } from "../auth/password.js";

import { User } from "../users/user.model.js";

import { Clinic } from "./clinic.model.js";

import { ClinicMembership } from "./clinicMembership.model.js";

const password = "StrongPass123";

async function createUser({ name, phone, role, status = USER_STATUS.ACTIVE }) {
  const data = {
    name,
    phone,
    role,
    status,
  };

  if (status === USER_STATUS.ACTIVE) {
    data.passwordHash = await hashPassword(password);
  }

  return User.create(data);
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

const clinicPayload = {
  name: "Example Dental Clinic",

  type: CLINIC_TYPES.CLINIC,

  contactPhone: "0495 1234567",

  email: "clinic@example.com",

  address: {
    line1: "First Floor, Example Building",

    locality: "Town Centre",

    city: "Kozhikode",

    district: "Kozhikode",

    state: "Kerala",

    pincode: "673001",
  },
};

describe("clinics and memberships", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    await User.syncIndexes();

    await Clinic.syncIndexes();

    await ClinicMembership.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("allows Cera Admin to create a clinic", async () => {
    await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const agent = request.agent(app);

    await login(agent, "9876543210");

    const response = await agent
      .post("/api/v1/admin/clinics")
      .send(clinicPayload);

    expect(response.status).toBe(201);

    expect(response.body.data.clinic.name).toBe("Example Dental Clinic");

    expect(response.body.data.clinic.address.city).toBe("Kozhikode");
  });

  it("does not allow Doctor to create clinics", async () => {
    await createUser({
      name: "Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,
    });

    const agent = request.agent(app);

    await login(agent, "9876543211");

    const response = await agent
      .post("/api/v1/admin/clinics")
      .send(clinicPayload);

    expect(response.status).toBe(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("allows Admin to add a Doctor to a clinic", async () => {
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

    const clinic = await Clinic.create({
      ...clinicPayload,

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543210");

    const response = await agent
      .post(`/api/v1/admin/clinics/${clinic.id}/members`)
      .send({
        userId: doctor.id,
      });

    expect(response.status).toBe(201);

    expect(response.body.data.membership.user.id).toBe(doctor.id);

    expect(response.body.data.membership.active).toBe(true);
  });

  it("allows an INVITED Doctor to be assigned before activation", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const invitedDoctor = await createUser({
      name: "Invited Doctor",

      phone: "9876543211",

      role: USER_ROLES.DOCTOR,

      status: USER_STATUS.INVITED,
    });

    const clinic = await Clinic.create({
      ...clinicPayload,

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543210");

    await agent
      .post(`/api/v1/admin/clinics/${clinic.id}/members`)
      .send({
        userId: invitedDoctor.id,
      })
      .expect(201);

    const membership = await ClinicMembership.findOne({
      clinicId: clinic._id,

      userId: invitedDoctor._id,
    });

    expect(membership.active).toBe(true);
  });

  it("rejects Cera Staff as a clinic member", async () => {
    const admin = await createUser({
      name: "Admin",

      phone: "9876543210",

      role: USER_ROLES.CERA_ADMIN,
    });

    const ceraStaff = await createUser({
      name: "Cera Staff",

      phone: "9876543211",

      role: USER_ROLES.CERA_STAFF,
    });

    const clinic = await Clinic.create({
      ...clinicPayload,

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543210");

    const response = await agent
      .post(`/api/v1/admin/clinics/${clinic.id}/members`)
      .send({
        userId: ceraStaff.id,
      });

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("INVALID_CLINIC_MEMBER_ROLE");
  });

  it("returns only assigned clinics to a Doctor", async () => {
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

    const first = await Clinic.create({
      ...clinicPayload,

      name: "Assigned Clinic",

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    await Clinic.create({
      ...clinicPayload,

      name: "Unrelated Clinic",

      email: "other@example.com",

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    await ClinicMembership.create({
      clinicId: first._id,

      userId: doctor._id,

      addedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543211");

    const response = await agent.get("/api/v1/clinics");

    expect(response.status).toBe(200);

    expect(response.body.data.clinics).toHaveLength(1);

    expect(response.body.data.clinics[0].name).toBe("Assigned Clinic");
  });

  it("does not expose an unrelated clinic to a Doctor", async () => {
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

    const clinic = await Clinic.create({
      ...clinicPayload,

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    const agent = request.agent(app);

    await login(agent, "9876543211");

    const response = await agent.get(`/api/v1/clinics/${clinic.id}`);

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("CLINIC_NOT_FOUND");
  });

  it("removing membership removes Doctor access", async () => {
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

    const clinic = await Clinic.create({
      ...clinicPayload,

      createdByUserId: admin._id,

      updatedByUserId: admin._id,
    });

    await ClinicMembership.create({
      clinicId: clinic._id,

      userId: doctor._id,

      addedByUserId: admin._id,
    });

    const adminAgent = request.agent(app);

    await login(adminAgent, "9876543210");

    await adminAgent
      .delete(`/api/v1/admin/clinics/${clinic.id}/members/${doctor.id}`)
      .expect(200);

    const doctorAgent = request.agent(app);

    await login(doctorAgent, "9876543211");

    const response = await doctorAgent.get(`/api/v1/clinics/${clinic.id}`);

    expect(response.status).toBe(404);
  });

  it("does not allow Scanning Staff to browse the clinic directory", async () => {
    await createUser({
      name: "Scanner",

      phone: "9876543212",

      role: USER_ROLES.SCANNING_STAFF,
    });

    const agent = request.agent(app);

    await login(agent, "9876543212");

    const response = await agent.get("/api/v1/clinics");

    expect(response.status).toBe(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});
