import mongoose from "mongoose";
import request from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  LAB_SLIP_SOURCE,
  LAB_SLIP_STATUS,
  LAB_SLIP_URGENCY,
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

import { User } from "../users/user.model.js";

import { Clinic } from "../clinics/clinic.model.js";

import { ClinicMembership } from "../clinics/clinicMembership.model.js";

import { LabSlip } from "../labSlips/labSlip.model.js";

import { ScanBooking } from "./scanBooking.model.js";

import { ScanBookingCounter } from "./scanBookingCounter.model.js";

const PASSWORD = "StrongPass123";

let passwordHash;

let slipSequence = 0;

function futureIso(hours = 24) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function pastIso(hours = 1) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function createUser({ name, phone, role, status = USER_STATUS.ACTIVE }) {
  return User.create({
    name,
    phone,
    role,
    status,
    passwordHash,
  });
}

async function createClinic({ admin, name, city = "Kozhikode" }) {
  return Clinic.create({
    name,

    type: "CLINIC",

    address: {
      line1: "Main Road",
      city,
      state: "Kerala",
      pincode: "673001",
      country: "India",
    },

    /*
     * Supplying both forms makes this fixture
     * compatible with the clinic audit fields
     * already used in the project.
     *
     * Mongoose ignores fields that are not
     * declared by the schema.
     */
    createdBy: admin._id,
    updatedBy: admin._id,

    createdByUserId: admin._id,
    updatedByUserId: admin._id,
  });
}

async function addMembership({ clinic, user, admin }) {
  return ClinicMembership.create({
    clinicId: clinic._id,

    userId: user._id,

    active: true,

    addedBy: admin._id,
    addedByUserId: admin._id,
  });
}

async function createLabSlip({
  clinic,
  doctor,
  createdBy = doctor,
  scanRequired = true,
  patientName = "Test Patient",
  urgency = LAB_SLIP_URGENCY.STANDARD,
}) {
  slipSequence += 1;

  return LabSlip.create({
    reference: `CDL-TEST-${String(slipSequence).padStart(6, "0")}`,

    source: LAB_SLIP_SOURCE.PORTAL,

    status: LAB_SLIP_STATUS.SUBMITTED,

    urgency,

    clinicId: clinic._id,

    doctorId: doctor._id,

    patient: {
      name: patientName,
      reference: `PAT-${slipSequence}`,
    },

    /*
     * Scan booking tests do not need a
     * real catalogue product. The Lab Slip
     * only needs a valid stored snapshot.
     */
    items: [
      {
        productId: new mongoose.Types.ObjectId(),

        productName: "Zirconia Crown",

        categoryId: new mongoose.Types.ObjectId(),

        categoryName: "Fixed Prosthesis",

        teeth: ["UR1", "UR2"],

        shade: "A2",

        ponticDesign: "Standard",

        designNotes: "Check occlusion",
      },
    ],

    notes: "Test lab slip",

    scanRequired,

    createdByUserId: createdBy._id,
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

    phone: "9876500001",

    role: USER_ROLES.CERA_ADMIN,
  });

  const ceraStaff = await createUser({
    name: "Cera Staff",

    phone: "9876500002",

    role: USER_ROLES.CERA_STAFF,
  });

  const doctorA = await createUser({
    name: "Doctor A",

    phone: "9876500003",

    role: USER_ROLES.DOCTOR,
  });

  const doctorB = await createUser({
    name: "Doctor B",

    phone: "9876500004",

    role: USER_ROLES.DOCTOR,
  });

  const clinicStaffA = await createUser({
    name: "Clinic Staff A",

    phone: "9876500005",

    role: USER_ROLES.CLINIC_STAFF,
  });

  const scannerA = await createUser({
    name: "Scanner A",

    phone: "9876500006",

    role: USER_ROLES.SCANNING_STAFF,
  });

  const scannerB = await createUser({
    name: "Scanner B",

    phone: "9876500007",

    role: USER_ROLES.SCANNING_STAFF,
  });

  const disabledScanner = await createUser({
    name: "Disabled Scanner",

    phone: "9876500008",

    role: USER_ROLES.SCANNING_STAFF,

    status: USER_STATUS.DISABLED,
  });

  const clinicA = await createClinic({
    admin,

    name: "Clinic A",

    city: "Kozhikode",
  });

  const clinicB = await createClinic({
    admin,

    name: "Clinic B",

    city: "Malappuram",
  });

  await addMembership({
    clinic: clinicA,

    user: doctorA,

    admin,
  });

  await addMembership({
    clinic: clinicA,

    user: clinicStaffA,

    admin,
  });

  await addMembership({
    clinic: clinicB,

    user: doctorB,

    admin,
  });

  return {
    admin,
    ceraStaff,
    doctorA,
    doctorB,
    clinicStaffA,
    scannerA,
    scannerB,
    disabledScanner,
    clinicA,
    clinicB,
  };
}

async function createBooking({
  agent,
  labSlip,
  requestedStartAt = futureIso(),
}) {
  return agent.post("/api/v1/scan-bookings").send({
    labSlipId: labSlip.id,

    requestedStartAt,
  });
}

async function createPendingBooking({
  context,
  doctor = context.doctorA,
  clinic = context.clinicA,
  scanRequired = true,
}) {
  const labSlip = await createLabSlip({
    clinic,
    doctor,
    scanRequired,
  });

  const doctorAgent = await loginAgent(doctor);

  const response = await createBooking({
    agent: doctorAgent,

    labSlip,
  });

  expect(response.status).toBe(201);

  return {
    labSlip,
    doctorAgent,

    booking: response.body.data.scanBooking,
  };
}

async function createConfirmedBooking({ context }) {
  const pending = await createPendingBooking({
    context,
  });

  const ceraAgent = await loginAgent(context.ceraStaff);

  const response = await ceraAgent.post(
    `/api/v1/scan-bookings/${pending.booking.id}/confirm`,
  );

  expect(response.status).toBe(200);

  return {
    ...pending,
    ceraAgent,

    booking: response.body.data.scanBooking,
  };
}

async function createAssignedBooking({ context }) {
  const confirmed = await createConfirmedBooking({
    context,
  });

  const response = await confirmed.ceraAgent
    .post(`/api/v1/scan-bookings/${confirmed.booking.id}/assign`)
    .send({
      scanningStaffId: context.scannerA.id,
    });

  expect(response.status).toBe(200);

  return {
    ...confirmed,

    booking: response.body.data.scanBooking,
  };
}

describe("Scan Bookings", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    passwordHash = await hashPassword(PASSWORD);

    await User.syncIndexes();
    await Clinic.syncIndexes();
    await ClinicMembership.syncIndexes();
    await LabSlip.syncIndexes();
    await ScanBooking.syncIndexes();
    await ScanBookingCounter.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("allows a Doctor to create a scan booking for their own scan-required Lab Slip", async () => {
    const context = await createContext();

    const labSlip = await createLabSlip({
      clinic: context.clinicA,

      doctor: context.doctorA,

      scanRequired: true,
    });

    const doctorAgent = await loginAgent(context.doctorA);

    const requestedStartAt = futureIso(24);

    const response = await createBooking({
      agent: doctorAgent,

      labSlip,

      requestedStartAt,
    });

    expect(response.status).toBe(201);

    /*
     * Human-readable Scan Booking
     * reference assertion.
     */
    expect(response.body.data.scanBooking.reference).toMatch(
      /^SCAN-\d{4}-\d{6}$/,
    );

    expect(response.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.PENDING_REVIEW,
    );

    expect(response.body.data.scanBooking.labSlip.id).toBe(labSlip.id);

    expect(response.body.data.scanBooking.clinic.id).toBe(context.clinicA.id);

    expect(response.body.data.scanBooking.doctor.id).toBe(context.doctorA.id);

    expect(
      new Date(response.body.data.scanBooking.requestedStartAt).toISOString(),
    ).toBe(new Date(requestedStartAt).toISOString());
  });

  it("rejects a scan time in the past", async () => {
    const context = await createContext();

    const labSlip = await createLabSlip({
      clinic: context.clinicA,

      doctor: context.doctorA,
    });

    const doctorAgent = await loginAgent(context.doctorA);

    const response = await createBooking({
      agent: doctorAgent,

      labSlip,

      requestedStartAt: pastIso(),
    });

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("INVALID_SCAN_TIME");
  });

  it("allows a later scan request when the Lab Slip was originally submitted without scanning", async () => {
    const context = await createContext();

    const labSlip = await createLabSlip({
      clinic: context.clinicA,

      doctor: context.doctorA,

      scanRequired: false,
    });

    expect(labSlip.scanRequired).toBe(false);

    const doctorAgent = await loginAgent(context.doctorA);

    const response = await createBooking({
      agent: doctorAgent,

      labSlip,

      requestedStartAt: futureIso(),
    });

    expect(response.status).toBe(201);

    expect(response.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.PENDING_REVIEW,
    );

    expect(response.body.data.scanBooking.reference).toMatch(
      /^SCAN-\d{4}-\d{6}$/,
    );

    const updatedLabSlip = await LabSlip.findById(labSlip._id);

    expect(updatedLabSlip).not.toBeNull();

    expect(updatedLabSlip.scanRequired).toBe(true);
  });

  it("allows Cera Staff to confirm the requested scan time", async () => {
    const context = await createContext();

    const { booking } = await createPendingBooking({
      context,
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    const response = await ceraAgent.post(
      `/api/v1/scan-bookings/${booking.id}/confirm`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.CONFIRMED,
    );

    expect(
      new Date(response.body.data.scanBooking.confirmedStartAt).toISOString(),
    ).toBe(new Date(booking.requestedStartAt).toISOString());
  });

  it("allows Cera Staff to propose an alternate time and the Doctor to accept it", async () => {
    const context = await createContext();

    const { booking, doctorAgent } = await createPendingBooking({
      context,
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    const proposedStartAt = futureIso(72);

    const proposeResponse = await ceraAgent
      .post(`/api/v1/scan-bookings/${booking.id}/propose-alternate`)
      .send({
        proposedStartAt,
      });

    expect(proposeResponse.status).toBe(200);

    expect(proposeResponse.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,
    );

    expect(
      new Date(
        proposeResponse.body.data.scanBooking.proposedStartAt,
      ).toISOString(),
    ).toBe(new Date(proposedStartAt).toISOString());

    const acceptResponse = await doctorAgent.post(
      `/api/v1/scan-bookings/${booking.id}/accept-alternate`,
    );

    expect(acceptResponse.status).toBe(200);

    expect(acceptResponse.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.CONFIRMED,
    );

    expect(
      new Date(
        acceptResponse.body.data.scanBooking.confirmedStartAt,
      ).toISOString(),
    ).toBe(new Date(proposedStartAt).toISOString());
  });

  it("does not allow an unrelated Doctor to accept an alternate time", async () => {
    const context = await createContext();

    const { booking } = await createPendingBooking({
      context,
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    await ceraAgent
      .post(`/api/v1/scan-bookings/${booking.id}/propose-alternate`)
      .send({
        proposedStartAt: futureIso(72),
      })
      .expect(200);

    const doctorBAgent = await loginAgent(context.doctorB);

    const response = await doctorBAgent.post(
      `/api/v1/scan-bookings/${booking.id}/accept-alternate`,
    );

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("SCAN_BOOKING_NOT_FOUND");
  });

  it("allows Cera Staff to assign an active Scanning Staff member", async () => {
    const context = await createContext();

    const { booking, ceraAgent } = await createConfirmedBooking({
      context,
    });

    const response = await ceraAgent
      .post(`/api/v1/scan-bookings/${booking.id}/assign`)
      .send({
        scanningStaffId: context.scannerA.id,
      });

    expect(response.status).toBe(200);

    expect(response.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.ASSIGNED,
    );

    expect(response.body.data.scanBooking.assignedScanningStaff.id).toBe(
      context.scannerA.id,
    );
  });

  it("does not allow a Doctor to be assigned as Scanning Staff", async () => {
    const context = await createContext();

    const { booking, ceraAgent } = await createConfirmedBooking({
      context,
    });

    const response = await ceraAgent
      .post(`/api/v1/scan-bookings/${booking.id}/assign`)
      .send({
        scanningStaffId: context.doctorA.id,
      });

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("SCANNING_STAFF_NOT_FOUND");
  });

  it("does not allow disabled Scanning Staff to be assigned", async () => {
    const context = await createContext();

    const { booking, ceraAgent } = await createConfirmedBooking({
      context,
    });

    const response = await ceraAgent
      .post(`/api/v1/scan-bookings/${booking.id}/assign`)
      .send({
        scanningStaffId: context.disabledScanner.id,
      });

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("SCANNING_STAFF_NOT_FOUND");
  });

  it("rejects assignment while a booking is still pending review", async () => {
    const context = await createContext();

    const { booking } = await createPendingBooking({
      context,
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    const response = await ceraAgent
      .post(`/api/v1/scan-bookings/${booking.id}/assign`)
      .send({
        scanningStaffId: context.scannerA.id,
      });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("INVALID_SCAN_BOOKING_TRANSITION");
  });

  it("shows an assigned booking only to its assigned Scanning Staff member", async () => {
    const context = await createContext();

    const { booking } = await createAssignedBooking({
      context,
    });

    const scannerAAgent = await loginAgent(context.scannerA);

    const scannerB = await loginAgent(context.scannerB);

    const listA = await scannerAAgent.get("/api/v1/scan-bookings");

    expect(listA.status).toBe(200);

    expect(listA.body.data.scanBookings).toHaveLength(1);

    expect(listA.body.data.scanBookings[0].id).toBe(booking.id);

    /*
     * Scanning Staff gets visit context,
     * but not Lab Slip product instructions.
     */
    expect(listA.body.data.scanBookings[0].labSlip).not.toHaveProperty("items");

    expect(JSON.stringify(listA.body.data.scanBookings[0])).not.toContain(
      "Zirconia Crown",
    );

    const listB = await scannerB.get("/api/v1/scan-bookings");

    expect(listB.status).toBe(200);

    expect(listB.body.data.scanBookings).toHaveLength(0);
  });

  it("allows only the assigned Scanning Staff member to open the booking", async () => {
    const context = await createContext();

    const { booking } = await createAssignedBooking({
      context,
    });

    const scannerAAgent = await loginAgent(context.scannerA);

    const scannerBAgent = await loginAgent(context.scannerB);

    const allowed = await scannerAAgent.get(
      `/api/v1/scan-bookings/${booking.id}`,
    );

    expect(allowed.status).toBe(200);

    expect(allowed.body.data.scanBooking.id).toBe(booking.id);

    expect(allowed.body.data.scanBooking.labSlip).not.toHaveProperty("items");

    const denied = await scannerBAgent.get(
      `/api/v1/scan-bookings/${booking.id}`,
    );

    expect(denied.status).toBe(404);

    expect(denied.body.error.code).toBe("SCAN_BOOKING_NOT_FOUND");
  });

  it("allows the assigned Scanning Staff member to complete the booking", async () => {
    const context = await createContext();

    const { booking } = await createAssignedBooking({
      context,
    });

    const scannerAgent = await loginAgent(context.scannerA);

    const response = await scannerAgent.post(
      `/api/v1/scan-bookings/${booking.id}/complete`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.COMPLETED,
    );

    expect(response.body.data.scanBooking.completedAt).toBeTruthy();
  });

  it("does not allow a Doctor to complete a scan booking", async () => {
    const context = await createContext();

    const { booking, doctorAgent } = await createAssignedBooking({
      context,
    });

    const response = await doctorAgent.post(
      `/api/v1/scan-bookings/${booking.id}/complete`,
    );

    expect(response.status).toBe(403);
  });

  it("allows Cera Staff to reject a pending booking", async () => {
    const context = await createContext();

    const { booking } = await createPendingBooking({
      context,
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    const response = await ceraAgent
      .post(`/api/v1/scan-bookings/${booking.id}/reject`)
      .send({
        reason: "Scanner unavailable for the requested area",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.REJECTED,
    );

    expect(response.body.data.scanBooking.rejectionReason).toBe(
      "Scanner unavailable for the requested area",
    );
  });

  it("allows a Doctor to cancel before assignment", async () => {
    const context = await createContext();

    const { booking, doctorAgent } = await createPendingBooking({
      context,
    });

    const response = await doctorAgent
      .post(`/api/v1/scan-bookings/${booking.id}/cancel`)
      .send({
        reason: "Patient unavailable",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.CANCELLED,
    );

    expect(response.body.data.scanBooking.cancellationReason).toBe(
      "Patient unavailable",
    );
  });

  it("does not allow a Doctor to cancel after Scanning Staff has been assigned", async () => {
    const context = await createContext();

    const { booking, doctorAgent } = await createAssignedBooking({
      context,
    });

    const response = await doctorAgent
      .post(`/api/v1/scan-bookings/${booking.id}/cancel`)
      .send({
        reason: "Patient unavailable",
      });

    expect(response.status).toBe(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("allows Cera Staff to cancel after Scanning Staff has been assigned", async () => {
    const context = await createContext();

    const { booking, ceraAgent } = await createAssignedBooking({
      context,
    });

    const response = await ceraAgent
      .post(`/api/v1/scan-bookings/${booking.id}/cancel`)
      .send({
        reason: "Operational cancellation",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.scanBooking.status).toBe(
      SCAN_BOOKING_STATUS.CANCELLED,
    );
  });

  it("rejects an invalid transition after completion", async () => {
    const context = await createContext();

    const { booking, ceraAgent } = await createAssignedBooking({
      context,
    });

    const scannerAgent = await loginAgent(context.scannerA);

    await scannerAgent
      .post(`/api/v1/scan-bookings/${booking.id}/complete`)
      .expect(200);

    const response = await ceraAgent.post(
      `/api/v1/scan-bookings/${booking.id}/confirm`,
    );

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("INVALID_SCAN_BOOKING_TRANSITION");
  });

  it("returns only the Doctor's own scan bookings", async () => {
    const context = await createContext();

    const slipA = await createLabSlip({
      clinic: context.clinicA,

      doctor: context.doctorA,

      patientName: "Patient A",
    });

    const slipB = await createLabSlip({
      clinic: context.clinicB,

      doctor: context.doctorB,

      patientName: "Patient B",
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    await createBooking({
      agent: ceraAgent,

      labSlip: slipA,

      requestedStartAt: futureIso(24),
    });

    await createBooking({
      agent: ceraAgent,

      labSlip: slipB,

      requestedStartAt: futureIso(48),
    });

    const doctorAgent = await loginAgent(context.doctorA);

    const response = await doctorAgent.get("/api/v1/scan-bookings");

    expect(response.status).toBe(200);

    expect(response.body.data.scanBookings).toHaveLength(1);

    expect(response.body.data.scanBookings[0].doctor.id).toBe(
      context.doctorA.id,
    );
  });

  it("returns only bookings from permitted clinics to Clinic Staff", async () => {
    const context = await createContext();

    const slipA = await createLabSlip({
      clinic: context.clinicA,

      doctor: context.doctorA,
    });

    const slipB = await createLabSlip({
      clinic: context.clinicB,

      doctor: context.doctorB,
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    await createBooking({
      agent: ceraAgent,

      labSlip: slipA,

      requestedStartAt: futureIso(24),
    });

    await createBooking({
      agent: ceraAgent,

      labSlip: slipB,

      requestedStartAt: futureIso(48),
    });

    const clinicStaffAgent = await loginAgent(context.clinicStaffA);

    const response = await clinicStaffAgent.get("/api/v1/scan-bookings");

    expect(response.status).toBe(200);

    expect(response.body.data.scanBookings).toHaveLength(1);

    expect(response.body.data.scanBookings[0].clinic.id).toBe(
      context.clinicA.id,
    );
  });

  it("allows Cera Staff to list all scan bookings", async () => {
    const context = await createContext();

    const slipA = await createLabSlip({
      clinic: context.clinicA,

      doctor: context.doctorA,
    });

    const slipB = await createLabSlip({
      clinic: context.clinicB,

      doctor: context.doctorB,
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    await createBooking({
      agent: ceraAgent,

      labSlip: slipA,

      requestedStartAt: futureIso(24),
    });

    await createBooking({
      agent: ceraAgent,

      labSlip: slipB,

      requestedStartAt: futureIso(48),
    });

    const response = await ceraAgent.get("/api/v1/scan-bookings");

    expect(response.status).toBe(200);

    expect(response.body.data.scanBookings).toHaveLength(2);
  });

  it("lists only active Scanning Staff for Cera operations", async () => {
    const context = await createContext();

    const ceraAgent = await loginAgent(context.ceraStaff);

    const response = await ceraAgent.get(
      "/api/v1/scan-bookings/scanning-staff",
    );

    expect(response.status).toBe(200);

    const ids = response.body.data.scanningStaff.map((staff) => staff.id);

    expect(ids).toContain(context.scannerA.id);

    expect(ids).toContain(context.scannerB.id);

    expect(ids).not.toContain(context.disabledScanner.id);

    expect(ids).not.toContain(context.doctorA.id);
  });
});
