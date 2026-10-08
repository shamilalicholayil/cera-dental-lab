import mongoose from "mongoose";

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
  CLINIC_TYPES,
  CORRECTION_OUTCOME,
  CORRECTION_STATUS,
  LAB_SLIP_SOURCE,
  LAB_SLIP_STATUS,
  LAB_SLIP_URGENCY,
  PRODUCTION_STATUS,
  USER_ROLES,
  USER_STATUS,
} from "@cera/shared";

vi.mock("./correctionAttachment.storage.js", () => ({
  storeCorrectionAttachment: vi.fn().mockResolvedValue(undefined),

  deleteCorrectionAttachmentObject: vi.fn().mockResolvedValue(undefined),

  createCorrectionAttachmentAccessUrl: vi
    .fn()
    .mockResolvedValue("https://example.test/private-correction-file"),
}));

import { app } from "../../app.js";

import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../../__tests__/helpers/testDatabase.js";

import { hashPassword } from "../auth/password.js";

import { Clinic } from "../clinics/clinic.model.js";

import { ClinicMembership } from "../clinics/clinicMembership.model.js";

import { LabSlip } from "../labSlips/labSlip.model.js";

import { Production } from "../production/production.model.js";

import { User } from "../users/user.model.js";

import { Correction } from "./correction.model.js";

import { CorrectionAttachment } from "./correctionAttachment.model.js";

import {
  createCorrectionAttachment,
  deleteCorrectionAttachment,
  getCorrectionAttachmentAccess,
  listCorrectionAttachments,
} from "./correctionAttachment.service.js";

import {
  deleteCorrectionAttachmentObject,
  storeCorrectionAttachment,
} from "./correctionAttachment.storage.js";

import {
  createCorrection,
  getCorrection,
  listCorrections,
  rejectCorrection,
  requestCorrectionClarification,
  resolveCorrection,
  respondToCorrectionClarification,
  startCorrectionReview,
} from "./correction.service.js";

const PASSWORD = "StrongPass123";

const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=",
  "base64",
);

const VALID_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

const VALID_WEBP = Buffer.from("52494646100000005745425056503820", "hex");

const VALID_PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF");

let passwordHash;

let slipSequence = 0;

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

async function createClinic(admin, name = "Correction Test Clinic") {
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

async function createContext() {
  const admin = await createUser({
    name: "Cera Admin",
    phone: "9876700001",
    role: USER_ROLES.CERA_ADMIN,
  });

  const ceraStaff = await createUser({
    name: "Cera Staff",
    phone: "9876700002",
    role: USER_ROLES.CERA_STAFF,
  });

  const doctor = await createUser({
    name: "Doctor",
    phone: "9876700003",
    role: USER_ROLES.DOCTOR,
  });

  const otherDoctor = await createUser({
    name: "Other Doctor",
    phone: "9876700004",
    role: USER_ROLES.DOCTOR,
  });

  const clinicStaff = await createUser({
    name: "Clinic Staff",
    phone: "9876700005",
    role: USER_ROLES.CLINIC_STAFF,
  });

  const scanner = await createUser({
    name: "Scanning Staff",
    phone: "9876700006",
    role: USER_ROLES.SCANNING_STAFF,
  });

  const clinic = await createClinic(admin);

  await addMembership({
    clinic,
    user: doctor,
    admin,
  });

  await addMembership({
    clinic,
    user: otherDoctor,
    admin,
  });

  await addMembership({
    clinic,
    user: clinicStaff,
    admin,
  });

  return {
    admin,
    ceraStaff,
    doctor,
    otherDoctor,
    clinicStaff,
    scanner,
    clinic,
  };
}

async function createCase({
  context,
  doctor = context.doctor,
  clinic = context.clinic,
  productionStatus = PRODUCTION_STATUS.COMPLETED,
}) {
  slipSequence += 1;

  const labSlip = await LabSlip.create({
    reference: `CDL-CORR-${String(slipSequence).padStart(6, "0")}`,

    source: LAB_SLIP_SOURCE.PORTAL,

    status: LAB_SLIP_STATUS.SUBMITTED,

    urgency: LAB_SLIP_URGENCY.STANDARD,

    clinicId: clinic._id,

    doctorId: doctor._id,

    patient: {
      name: "Correction Patient",
      reference: `CORR-PAT-${slipSequence}`,
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
      {
        productId: new mongoose.Types.ObjectId(),

        productName: "Zirconia Bridge",

        categoryId: new mongoose.Types.ObjectId(),

        categoryName: "Fixed Prosthesis",

        teeth: ["UR2", "UR3"],

        shade: "A2",

        ponticDesign: null,

        designNotes: null,
      },
    ],

    notes: null,

    scanRequired: false,

    createdByUserId: doctor._id,
  });

  const productionData = {
    labSlipId: labSlip._id,
    status: productionStatus,
  };

  if (
    productionStatus === PRODUCTION_STATUS.IN_PRODUCTION ||
    productionStatus === PRODUCTION_STATUS.COMPLETED
  ) {
    productionData.startedAt = new Date(Date.now() - 60 * 60 * 1000);
  }

  if (productionStatus === PRODUCTION_STATUS.COMPLETED) {
    productionData.completedAt = new Date();
  }

  const production = await Production.create(productionData);

  return {
    labSlip,
    production,
  };
}

function attachmentFile({
  buffer = VALID_PNG,
  filename = "evidence.png",
  contentType = "image/png",
} = {}) {
  return {
    buffer,
    originalname: filename,
    mimetype: contentType,
    size: buffer.length,
  };
}

async function uploadCorrectionEvidence({
  agent,
  correctionId,
  filename = "evidence.png",
}) {
  const response = await agent
    .post(`/api/v1/corrections/${correctionId}/attachments`)
    .attach("attachment", VALID_PNG, {
      filename,
      contentType: "image/png",
    });

  expect(response.status).toBe(201);

  return response.body.data.attachment;
}

describe("Corrections", () => {
  beforeAll(async () => {
    await connectTestDatabase();

    passwordHash = await hashPassword(PASSWORD);

    await User.syncIndexes();
    await Clinic.syncIndexes();
    await ClinicMembership.syncIndexes();
    await LabSlip.syncIndexes();
    await Production.syncIndexes();
    await Correction.syncIndexes();
    await CorrectionAttachment.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDatabase();

    vi.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("allows a Doctor to create a correction for their completed case", async () => {
    const context = await createContext();

    const { labSlip, production } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "  Crown shade does not match  ",
      },
    });

    expect(correction.labSlipId.toString()).toBe(labSlip.id);

    expect(correction.productionId.toString()).toBe(production.id);

    expect(correction.createdByUserId.toString()).toBe(context.doctor.id);

    expect(correction.description).toBe("Crown shade does not match");

    expect(correction.status).toBe(CORRECTION_STATUS.OPEN);

    expect(correction.outcome).toBeNull();

    expect(correction.affectedLabSlipItemIds).toHaveLength(0);

    expect(correction.history).toHaveLength(0);
  });

  it("allows Clinic Staff to create a correction for their clinic", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.clinicStaff,
      labSlipId: labSlip.id,
      data: {
        description: "Patient reports a fitting issue",
      },
    });

    expect(correction.createdByUserId.toString()).toBe(context.clinicStaff.id);

    expect(correction.status).toBe(CORRECTION_STATUS.OPEN);
  });

  it("allows Cera Staff to create a correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.ceraStaff,
      labSlipId: labSlip.id,
      data: {
        description: "Issue recorded after phone discussion",
      },
    });

    expect(correction.createdByUserId.toString()).toBe(context.ceraStaff.id);
  });

  it("allows Cera Admin to create a correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.admin,
      labSlipId: labSlip.id,
      data: {
        description: "Correction recorded by administrator",
      },
    });

    expect(correction.createdByUserId.toString()).toBe(context.admin.id);
  });

  it("does not allow Scanning Staff to create corrections", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    await expect(
      createCorrection({
        user: context.scanner,
        labSlipId: labSlip.id,
        data: {
          description: "Attempted correction",
        },
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(await Correction.countDocuments()).toBe(0);
  });

  it("requires production to be completed before creating a correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
      productionStatus: PRODUCTION_STATUS.IN_PRODUCTION,
    });

    await expect(
      createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: "Issue found before production completed",
        },
      }),
    ).rejects.toMatchObject({
      code: "CORRECTION_PRODUCTION_NOT_COMPLETED",
    });

    expect(await Correction.countDocuments()).toBe(0);
  });

  it("does not allow a Doctor to create a correction for another Doctor's case", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
      doctor: context.otherDoctor,
    });

    await expect(
      createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: "Attempted unauthorized correction",
        },
      }),
    ).rejects.toMatchObject({
      code: "LAB_SLIP_NOT_FOUND",
    });

    expect(await Correction.countDocuments()).toBe(0);
  });

  it("rejects a blank correction description", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    await expect(
      createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: "   ",
        },
      }),
    ).rejects.toMatchObject({
      code: "CORRECTION_DESCRIPTION_REQUIRED",
    });

    expect(await Correction.countDocuments()).toBe(0);
  });

  it("stores valid affected Lab Slip item ids", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const itemIds = labSlip.items.map((item) => item._id.toString());

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Both restorations need review",

        affectedLabSlipItemIds: itemIds,
      },
    });

    expect(
      correction.affectedLabSlipItemIds.map((id) => id.toString()),
    ).toEqual(itemIds);
  });

  it("rejects an affected item belonging to another Lab Slip", async () => {
    const context = await createContext();

    const firstCase = await createCase({
      context,
    });

    const secondCase = await createCase({
      context,
    });

    const foreignItemId = secondCase.labSlip.items[0]._id.toString();

    await expect(
      createCorrection({
        user: context.doctor,
        labSlipId: firstCase.labSlip.id,
        data: {
          description: "Attempted foreign item reference",

          affectedLabSlipItemIds: [foreignItemId],
        },
      }),
    ).rejects.toMatchObject({
      code: "CORRECTION_ITEM_NOT_FOUND",
    });

    expect(await Correction.countDocuments()).toBe(0);
  });

  it("rejects an invalid affected Lab Slip item id", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    await expect(
      createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: "Invalid affected item",

          affectedLabSlipItemIds: ["not-an-object-id"],
        },
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CORRECTION_ITEM_ID",
    });

    expect(await Correction.countDocuments()).toBe(0);
  });

  it("removes duplicate affected Lab Slip item ids", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const itemId = labSlip.items[0]._id.toString();

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Single item submitted more than once",

        affectedLabSlipItemIds: [itemId, itemId, itemId],
      },
    });

    expect(correction.affectedLabSlipItemIds).toHaveLength(1);

    expect(correction.affectedLabSlipItemIds[0].toString()).toBe(itemId);
  });

  it("blocks a second unresolved correction for the same Lab Slip", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "First unresolved correction",
      },
    });

    await expect(
      createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: "Second unresolved correction",
        },
      }),
    ).rejects.toMatchObject({
      code: "ACTIVE_CORRECTION_EXISTS",
    });

    expect(
      await Correction.countDocuments({
        labSlipId: labSlip._id,
      }),
    ).toBe(1);
  });

  it("allows Cera Staff to start reviewing an open correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Shade mismatch",
      },
    });

    const reviewed = await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: correction.id,
      note: "Review started",
    });

    expect(reviewed.status).toBe(CORRECTION_STATUS.UNDER_REVIEW);

    expect(reviewed.history).toHaveLength(1);

    expect(reviewed.history[0].previousStatus).toBe(CORRECTION_STATUS.OPEN);

    expect(reviewed.history[0].newStatus).toBe(CORRECTION_STATUS.UNDER_REVIEW);

    expect(reviewed.history[0].changedByUserId.toString()).toBe(
      context.ceraStaff.id,
    );

    expect(reviewed.history[0].note).toBe("Review started");

    expect(reviewed.history[0].changedAt).toBeInstanceOf(Date);
  });

  it("does not allow Doctor to start correction review", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Fitting issue",
      },
    });

    await expect(
      startCorrectionReview({
        user: context.doctor,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const stored = await Correction.findById(correction.id);

    expect(stored.status).toBe(CORRECTION_STATUS.OPEN);
  });

  it("does not allow Clinic Staff to start correction review", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.clinicStaff,
      labSlipId: labSlip.id,
      data: {
        description: "Fitting issue",
      },
    });

    await expect(
      startCorrectionReview({
        user: context.clinicStaff,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows Cera Staff to request clarification while under review", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Restoration does not fit",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: correction.id,
    });

    const updated = await requestCorrectionClarification({
      user: context.ceraStaff,
      correctionId: correction.id,
      note: "Please confirm where the fitting problem occurs",
    });

    expect(updated.status).toBe(CORRECTION_STATUS.AWAITING_CLARIFICATION);

    expect(updated.history).toHaveLength(2);

    expect(updated.history[1].previousStatus).toBe(
      CORRECTION_STATUS.UNDER_REVIEW,
    );

    expect(updated.history[1].newStatus).toBe(
      CORRECTION_STATUS.AWAITING_CLARIFICATION,
    );

    expect(updated.history[1].note).toBe(
      "Please confirm where the fitting problem occurs",
    );
  });

  it("requires a note when requesting clarification", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Fitting issue",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    await expect(
      requestCorrectionClarification({
        user: context.admin,
        correctionId: correction.id,
        note: "   ",
      }),
    ).rejects.toMatchObject({
      code: "CORRECTION_CLARIFICATION_REQUIRED",
    });
  });

  it("allows the Doctor to respond to clarification for their own case", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Shade issue",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: correction.id,
    });

    await requestCorrectionClarification({
      user: context.ceraStaff,
      correctionId: correction.id,
      note: "Please confirm the expected shade",
    });

    const updated = await respondToCorrectionClarification({
      user: context.doctor,
      correctionId: correction.id,
      note: "Expected shade is A2",
    });

    expect(updated.status).toBe(CORRECTION_STATUS.UNDER_REVIEW);

    expect(updated.history).toHaveLength(3);

    expect(updated.history[2].previousStatus).toBe(
      CORRECTION_STATUS.AWAITING_CLARIFICATION,
    );

    expect(updated.history[2].newStatus).toBe(CORRECTION_STATUS.UNDER_REVIEW);

    expect(updated.history[2].changedByUserId.toString()).toBe(
      context.doctor.id,
    );

    expect(updated.history[2].note).toBe("Expected shade is A2");
  });

  it("allows Clinic Staff to respond to clarification for an accessible clinic", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Fitting issue",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    await requestCorrectionClarification({
      user: context.admin,
      correctionId: correction.id,
      note: "Please provide more details",
    });

    const updated = await respondToCorrectionClarification({
      user: context.clinicStaff,
      correctionId: correction.id,
      note: "The issue is on the distal margin",
    });

    expect(updated.status).toBe(CORRECTION_STATUS.UNDER_REVIEW);

    expect(updated.history.at(-1).changedByUserId.toString()).toBe(
      context.clinicStaff.id,
    );
  });

  it("does not allow another Doctor to respond to clarification", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Shade issue",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: correction.id,
    });

    await requestCorrectionClarification({
      user: context.ceraStaff,
      correctionId: correction.id,
      note: "Please confirm details",
    });

    await expect(
      respondToCorrectionClarification({
        user: context.otherDoctor,
        correctionId: correction.id,
        note: "Unauthorized response",
      }),
    ).rejects.toMatchObject({
      code: "LAB_SLIP_NOT_FOUND",
    });
  });

  it("does not allow Cera Staff to respond as the clarification responder", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Fitting issue",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: correction.id,
    });

    await requestCorrectionClarification({
      user: context.ceraStaff,
      correctionId: correction.id,
      note: "Please confirm details",
    });

    await expect(
      respondToCorrectionClarification({
        user: context.ceraStaff,
        correctionId: correction.id,
        note: "Attempted response",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("requires a clarification response note", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Fitting issue",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    await requestCorrectionClarification({
      user: context.admin,
      correctionId: correction.id,
      note: "Please provide details",
    });

    await expect(
      respondToCorrectionClarification({
        user: context.doctor,
        correctionId: correction.id,
        note: "",
      }),
    ).rejects.toMatchObject({
      code: "CORRECTION_CLARIFICATION_RESPONSE_REQUIRED",
    });
  });

  it.each([
    CORRECTION_OUTCOME.HANDLED,
    CORRECTION_OUTCOME.RESCAN_REQUIRED,
    CORRECTION_OUTCOME.REPRODUCTION_REQUIRED,
  ])(
    "allows Cera Staff to resolve a correction with outcome %s",
    async (outcome) => {
      const context = await createContext();

      const { labSlip } = await createCase({
        context,
      });

      const correction = await createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: "Correction requires review",
        },
      });

      await startCorrectionReview({
        user: context.ceraStaff,
        correctionId: correction.id,
      });

      const resolved = await resolveCorrection({
        user: context.ceraStaff,
        correctionId: correction.id,
        outcome,
        note: "Review completed",
      });

      expect(resolved.status).toBe(CORRECTION_STATUS.RESOLVED);

      expect(resolved.outcome).toBe(outcome);

      expect(resolved.history.at(-1).newStatus).toBe(
        CORRECTION_STATUS.RESOLVED,
      );

      expect(resolved.history.at(-1).changedByUserId.toString()).toBe(
        context.ceraStaff.id,
      );
    },
  );

  it("requires an outcome when resolving a correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Correction requiring review",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    await expect(
      resolveCorrection({
        user: context.admin,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "CORRECTION_OUTCOME_REQUIRED",
    });
  });

  it("rejects an invalid correction outcome", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Correction requiring review",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    await expect(
      resolveCorrection({
        user: context.admin,
        correctionId: correction.id,
        outcome: "UNKNOWN_OUTCOME",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CORRECTION_OUTCOME",
    });
  });

  it("allows Cera Admin to reject a correction under review", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Reported issue",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    const rejected = await rejectCorrection({
      user: context.admin,
      correctionId: correction.id,
      note: "No manufacturing issue was found",
    });

    expect(rejected.status).toBe(CORRECTION_STATUS.REJECTED);

    expect(rejected.outcome).toBeNull();

    expect(rejected.history.at(-1).note).toBe(
      "No manufacturing issue was found",
    );
  });

  it("does not allow an open correction to be resolved directly", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Reported issue",
      },
    });

    await expect(
      resolveCorrection({
        user: context.admin,
        correctionId: correction.id,
        outcome: CORRECTION_OUTCOME.HANDLED,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CORRECTION_TRANSITION",
    });
  });

  it("does not allow an open correction to be rejected directly", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Reported issue",
      },
    });

    await expect(
      rejectCorrection({
        user: context.admin,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CORRECTION_TRANSITION",
    });
  });

  it("does not allow a correction awaiting clarification to be resolved", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Reported issue",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    await requestCorrectionClarification({
      user: context.admin,
      correctionId: correction.id,
      note: "More information is required",
    });

    await expect(
      resolveCorrection({
        user: context.admin,
        correctionId: correction.id,
        outcome: CORRECTION_OUTCOME.HANDLED,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CORRECTION_TRANSITION",
    });
  });

  it("keeps a resolved correction terminal", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Reported issue",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    await resolveCorrection({
      user: context.admin,
      correctionId: correction.id,
      outcome: CORRECTION_OUTCOME.HANDLED,
    });

    await expect(
      startCorrectionReview({
        user: context.admin,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CORRECTION_TRANSITION",
    });

    const stored = await Correction.findById(correction.id);

    expect(stored.status).toBe(CORRECTION_STATUS.RESOLVED);
  });

  it("keeps a rejected correction terminal", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Reported issue",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: correction.id,
    });

    await rejectCorrection({
      user: context.admin,
      correctionId: correction.id,
    });

    await expect(
      startCorrectionReview({
        user: context.admin,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CORRECTION_TRANSITION",
    });

    const stored = await Correction.findById(correction.id);

    expect(stored.status).toBe(CORRECTION_STATUS.REJECTED);
  });

  it("allows a new correction after the previous correction is resolved", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const first = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "First issue",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: first.id,
    });

    await resolveCorrection({
      user: context.ceraStaff,
      correctionId: first.id,
      outcome: CORRECTION_OUTCOME.HANDLED,
    });

    const second = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Later unrelated issue",
      },
    });

    expect(second.status).toBe(CORRECTION_STATUS.OPEN);

    expect(second.id).not.toBe(first.id);

    expect(
      await Correction.countDocuments({
        labSlipId: labSlip._id,
      }),
    ).toBe(2);
  });

  it("allows a new correction after the previous correction is rejected", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const first = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "First reported issue",
      },
    });

    await startCorrectionReview({
      user: context.admin,
      correctionId: first.id,
    });

    await rejectCorrection({
      user: context.admin,
      correctionId: first.id,
    });

    const second = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "New issue",
      },
    });

    expect(second.status).toBe(CORRECTION_STATUS.OPEN);

    expect(
      await Correction.countDocuments({
        labSlipId: labSlip._id,
      }),
    ).toBe(2);
  });

  it("creates a correction through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip, production } = await createCase({
      context,
    });

    const agent = await loginAgent(context.doctor);

    const itemId = labSlip.items[0]._id.toString();

    const response = await agent.post("/api/v1/corrections").send({
      labSlipId: labSlip.id,
      description: "Crown shade needs correction",
      affectedLabSlipItemIds: [itemId],
    });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.correction.status).toBe(CORRECTION_STATUS.OPEN);

    expect(response.body.data.correction.outcome).toBeNull();

    expect(response.body.data.correction.description).toBe(
      "Crown shade needs correction",
    );

    expect(response.body.data.correction.labSlip.id).toBe(labSlip.id);

    expect(response.body.data.correction.production.id).toBe(production.id);

    expect(response.body.data.correction.affectedLabSlipItemIds).toEqual([
      itemId,
    ]);

    expect(response.body.data.correction.createdBy.id).toBe(context.doctor.id);

    expect(response.body.data.correction._id).toBeUndefined();

    expect(response.body.data.correction.__v).toBeUndefined();
  });

  it("rejects invalid correction creation payload through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const agent = await loginAgent(context.doctor);

    const response = await agent.post("/api/v1/corrections").send({
      labSlipId: labSlip.id,
      description: "   ",
    });

    expect(response.status).toBe(400);

    expect(await Correction.countDocuments()).toBe(0);
  });

  it("does not allow Scanning Staff to create corrections through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const agent = await loginAgent(context.scanner);

    const response = await agent.post("/api/v1/corrections").send({
      labSlipId: labSlip.id,
      description: "Attempted correction",
    });

    expect(response.status).toBe(403);

    expect(await Correction.countDocuments()).toBe(0);
  });

  it("runs the correction review and clarification flow through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const doctorAgent = await loginAgent(context.doctor);

    const createResponse = await doctorAgent.post("/api/v1/corrections").send({
      labSlipId: labSlip.id,
      description: "Fitting issue",
    });

    expect(createResponse.status).toBe(201);

    const correctionId = createResponse.body.data.correction.id;

    const ceraAgent = await loginAgent(context.ceraStaff);

    const reviewResponse = await ceraAgent
      .post(`/api/v1/corrections/${correctionId}/start-review`)
      .send({
        note: "Review started",
      });

    expect(reviewResponse.status).toBe(200);

    expect(reviewResponse.body.data.correction.status).toBe(
      CORRECTION_STATUS.UNDER_REVIEW,
    );

    const clarificationResponse = await ceraAgent
      .post(`/api/v1/corrections/${correctionId}/request-clarification`)
      .send({
        note: "Where exactly is the fitting problem?",
      });

    expect(clarificationResponse.status).toBe(200);

    expect(clarificationResponse.body.data.correction.status).toBe(
      CORRECTION_STATUS.AWAITING_CLARIFICATION,
    );

    const doctorResponse = await doctorAgent
      .post(`/api/v1/corrections/${correctionId}/respond-clarification`)
      .send({
        note: "The problem is on the distal margin",
      });

    expect(doctorResponse.status).toBe(200);

    expect(doctorResponse.body.data.correction.status).toBe(
      CORRECTION_STATUS.UNDER_REVIEW,
    );

    expect(doctorResponse.body.data.correction.history).toHaveLength(3);

    expect(doctorResponse.body.data.correction.history[2].changedBy.id).toBe(
      context.doctor.id,
    );
  });

  it("resolves a correction through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const doctorAgent = await loginAgent(context.doctor);

    const createResponse = await doctorAgent.post("/api/v1/corrections").send({
      labSlipId: labSlip.id,
      description: "New scan may be required",
    });

    const correctionId = createResponse.body.data.correction.id;

    const ceraAgent = await loginAgent(context.ceraStaff);

    await ceraAgent
      .post(`/api/v1/corrections/${correctionId}/start-review`)
      .send({})
      .expect(200);

    const response = await ceraAgent
      .post(`/api/v1/corrections/${correctionId}/resolve`)
      .send({
        outcome: CORRECTION_OUTCOME.RESCAN_REQUIRED,
        note: "A fresh scan is required",
      });

    expect(response.status).toBe(200);

    expect(response.body.data.correction.status).toBe(
      CORRECTION_STATUS.RESOLVED,
    );

    expect(response.body.data.correction.outcome).toBe(
      CORRECTION_OUTCOME.RESCAN_REQUIRED,
    );

    const production = await Production.findOne({
      labSlipId: labSlip._id,
    });

    /*
     * Critical historical-integrity rule:
     * resolving a Correction must not reopen Production.
     */
    expect(production.status).toBe(PRODUCTION_STATUS.COMPLETED);
  });

  it("rejects an invalid resolution outcome at the HTTP validation boundary", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const doctorAgent = await loginAgent(context.doctor);

    const createResponse = await doctorAgent.post("/api/v1/corrections").send({
      labSlipId: labSlip.id,
      description: "Reported issue",
    });

    const correctionId = createResponse.body.data.correction.id;

    const adminAgent = await loginAgent(context.admin);

    await adminAgent
      .post(`/api/v1/corrections/${correctionId}/start-review`)
      .send({})
      .expect(200);

    const response = await adminAgent
      .post(`/api/v1/corrections/${correctionId}/resolve`)
      .send({
        outcome: "INVALID_OUTCOME",
      });

    expect(response.status).toBe(400);

    const stored = await Correction.findById(correctionId);

    expect(stored.status).toBe(CORRECTION_STATUS.UNDER_REVIEW);

    expect(stored.outcome).toBeNull();
  });

  it("enforces correction lifecycle transitions through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const doctorAgent = await loginAgent(context.doctor);

    const createResponse = await doctorAgent.post("/api/v1/corrections").send({
      labSlipId: labSlip.id,
      description: "Reported issue",
    });

    const correctionId = createResponse.body.data.correction.id;

    const adminAgent = await loginAgent(context.admin);

    const response = await adminAgent
      .post(`/api/v1/corrections/${correctionId}/resolve`)
      .send({
        outcome: CORRECTION_OUTCOME.HANDLED,
      });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("INVALID_CORRECTION_TRANSITION");
  });

  it("does not allow Doctor to use Cera review endpoints", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const doctorAgent = await loginAgent(context.doctor);

    const createResponse = await doctorAgent.post("/api/v1/corrections").send({
      labSlipId: labSlip.id,
      description: "Reported issue",
    });

    const correctionId = createResponse.body.data.correction.id;

    const response = await doctorAgent
      .post(`/api/v1/corrections/${correctionId}/start-review`)
      .send({});

    expect(response.status).toBe(403);

    const stored = await Correction.findById(correctionId);

    expect(stored.status).toBe(CORRECTION_STATUS.OPEN);
  });

  it("allows Cera Admin to list all corrections with pagination", async () => {
    const context = await createContext();

    for (let index = 0; index < 3; index += 1) {
      const { labSlip } = await createCase({
        context,
      });

      await createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: `Correction ${index + 1}`,
        },
      });
    }

    const result = await listCorrections({
      user: context.admin,
      query: {
        page: 2,
        limit: 1,
      },
    });

    expect(result.corrections).toHaveLength(1);

    expect(result.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 3,
      pages: 3,
    });
  });

  it("lists only unresolved corrections with the ACTIVE status filter", async () => {
    const context = await createContext();

    const openCase = await createCase({
      context,
    });

    const openCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: openCase.labSlip.id,
      data: {
        description: "Open correction",
      },
    });

    const underReviewCase = await createCase({
      context,
    });

    const underReviewCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: underReviewCase.labSlip.id,
      data: {
        description: "Correction under review",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: underReviewCorrection.id,
    });

    const clarificationCase = await createCase({
      context,
    });

    const clarificationCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: clarificationCase.labSlip.id,
      data: {
        description: "Correction awaiting clarification",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: clarificationCorrection.id,
    });

    await requestCorrectionClarification({
      user: context.ceraStaff,
      correctionId: clarificationCorrection.id,
      note: "Please provide additional details",
    });

    const resolvedCase = await createCase({
      context,
    });

    const resolvedCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: resolvedCase.labSlip.id,
      data: {
        description: "Resolved correction",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: resolvedCorrection.id,
    });

    await resolveCorrection({
      user: context.ceraStaff,
      correctionId: resolvedCorrection.id,
      outcome: CORRECTION_OUTCOME.HANDLED,
    });

    const rejectedCase = await createCase({
      context,
    });

    const rejectedCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: rejectedCase.labSlip.id,
      data: {
        description: "Rejected correction",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: rejectedCorrection.id,
    });

    await rejectCorrection({
      user: context.ceraStaff,
      correctionId: rejectedCorrection.id,
      note: "No correction required",
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    const response = await ceraAgent.get("/api/v1/corrections?status=ACTIVE");

    expect(response.status).toBe(200);

    expect(response.body.data.corrections).toHaveLength(3);

    expect(response.body.data.pagination.total).toBe(3);

    const returnedStatuses = response.body.data.corrections.map(
      (correction) => correction.status,
    );

    expect(returnedStatuses).toEqual(
      expect.arrayContaining([
        CORRECTION_STATUS.OPEN,
        CORRECTION_STATUS.UNDER_REVIEW,
        CORRECTION_STATUS.AWAITING_CLARIFICATION,
      ]),
    );

    expect(returnedStatuses).not.toContain(CORRECTION_STATUS.RESOLVED);

    expect(returnedStatuses).not.toContain(CORRECTION_STATUS.REJECTED);

    const returnedIds = response.body.data.corrections.map(
      (correction) => correction.id,
    );

    expect(returnedIds).toContain(openCorrection.id);

    expect(returnedIds).toContain(underReviewCorrection.id);

    expect(returnedIds).toContain(clarificationCorrection.id);

    expect(returnedIds).not.toContain(resolvedCorrection.id);

    expect(returnedIds).not.toContain(rejectedCorrection.id);
  });

  it("only lists a Doctor's own corrections", async () => {
    const context = await createContext();

    const ownCase = await createCase({
      context,
      doctor: context.doctor,
    });

    const otherCase = await createCase({
      context,
      doctor: context.otherDoctor,
    });

    const ownCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: ownCase.labSlip.id,
      data: {
        description: "Doctor's own issue",
      },
    });

    await createCorrection({
      user: context.otherDoctor,
      labSlipId: otherCase.labSlip.id,
      data: {
        description: "Other doctor's issue",
      },
    });

    const result = await listCorrections({
      user: context.doctor,
      query: {
        page: 1,
        limit: 20,
      },
    });

    expect(result.corrections).toHaveLength(1);

    expect(result.corrections[0].id).toBe(ownCorrection.id);

    expect(result.pagination.total).toBe(1);
  });

  it("only lists Clinic Staff corrections from accessible clinics", async () => {
    const context = await createContext();

    const accessibleCase = await createCase({
      context,
    });

    const accessibleCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: accessibleCase.labSlip.id,
      data: {
        description: "Accessible clinic issue",
      },
    });

    const otherClinic = await createClinic(
      context.admin,
      "Other Correction Test Clinic",
    );

    await addMembership({
      clinic: otherClinic,
      user: context.otherDoctor,
      admin: context.admin,
    });

    const inaccessibleCase = await createCase({
      context,
      doctor: context.otherDoctor,
      clinic: otherClinic,
    });

    await createCorrection({
      user: context.ceraStaff,
      labSlipId: inaccessibleCase.labSlip.id,
      data: {
        description: "Other clinic issue",
      },
    });

    const result = await listCorrections({
      user: context.clinicStaff,
      query: {
        page: 1,
        limit: 20,
      },
    });

    expect(result.corrections).toHaveLength(1);

    expect(result.corrections[0].id).toBe(accessibleCorrection.id);

    expect(result.pagination.total).toBe(1);
  });

  it("does not allow Scanning Staff to list corrections", async () => {
    const context = await createContext();

    await expect(
      listCorrections({
        user: context.scanner,
        query: {
          page: 1,
          limit: 20,
        },
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows a Doctor to retrieve their own correction with populated detail", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Detailed correction",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: correction.id,
      note: "Review started",
    });

    const result = await getCorrection({
      user: context.doctor,
      correctionId: correction.id,
    });

    expect(result.id).toBe(correction.id);

    expect(result.labSlipId.reference).toBe(labSlip.reference);

    expect(result.createdByUserId.name).toBe(context.doctor.name);

    expect(result.history).toHaveLength(1);

    expect(result.history[0].changedByUserId.name).toBe(context.ceraStaff.name);
  });

  it("does not allow a Doctor to retrieve another Doctor's correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
      doctor: context.otherDoctor,
    });

    const correction = await createCorrection({
      user: context.otherDoctor,
      labSlipId: labSlip.id,
      data: {
        description: "Other Doctor correction",
      },
    });

    await expect(
      getCorrection({
        user: context.doctor,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "LAB_SLIP_NOT_FOUND",
    });
  });

  it("does not allow Clinic Staff to retrieve a correction from an inaccessible clinic", async () => {
    const context = await createContext();

    const otherClinic = await createClinic(
      context.admin,
      "Restricted Correction Clinic",
    );

    await addMembership({
      clinic: otherClinic,
      user: context.otherDoctor,
      admin: context.admin,
    });

    const { labSlip } = await createCase({
      context,
      doctor: context.otherDoctor,
      clinic: otherClinic,
    });

    const correction = await createCorrection({
      user: context.ceraStaff,
      labSlipId: labSlip.id,
      data: {
        description: "Restricted clinic correction",
      },
    });

    await expect(
      getCorrection({
        user: context.clinicStaff,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "LAB_SLIP_NOT_FOUND",
    });
  });

  it("allows Cera Staff to retrieve any correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Operational correction",
      },
    });

    const result = await getCorrection({
      user: context.ceraStaff,
      correctionId: correction.id,
    });

    expect(result.id).toBe(correction.id);

    expect(result.labSlipId.reference).toBe(labSlip.reference);
  });

  it("rejects invalid and missing correction ids when retrieving detail", async () => {
    const context = await createContext();

    await expect(
      getCorrection({
        user: context.admin,
        correctionId: "invalid-id",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CORRECTION_ID",
    });

    const missingId = new mongoose.Types.ObjectId();

    await expect(
      getCorrection({
        user: context.admin,
        correctionId: missingId.toString(),
      }),
    ).rejects.toMatchObject({
      code: "CORRECTION_NOT_FOUND",
    });
  });

  it("does not allow Scanning Staff to retrieve correction detail", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Scanner cannot view this",
      },
    });

    await expect(
      getCorrection({
        user: context.scanner,
        correctionId: correction.id,
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("lists corrections through the HTTP API with pagination", async () => {
    const context = await createContext();

    for (let index = 0; index < 3; index += 1) {
      const { labSlip } = await createCase({
        context,
      });

      await createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: `HTTP list correction ${index + 1}`,
        },
      });
    }

    const adminAgent = await loginAgent(context.admin);

    const response = await adminAgent.get("/api/v1/corrections?page=2&limit=1");

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.corrections).toHaveLength(1);

    expect(response.body.data.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 3,
      pages: 3,
    });

    /*
     * List responses use the summary serializer.
     */
    expect(response.body.data.corrections[0].history).toBeUndefined();

    expect(
      response.body.data.corrections[0].affectedLabSlipItemIds,
    ).toBeUndefined();
  });

  it("filters correction list by status through the HTTP API", async () => {
    const context = await createContext();

    const firstCase = await createCase({
      context,
    });

    const resolvedCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: firstCase.labSlip.id,
      data: {
        description: "Resolved HTTP correction",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: resolvedCorrection.id,
    });

    await resolveCorrection({
      user: context.ceraStaff,
      correctionId: resolvedCorrection.id,
      outcome: CORRECTION_OUTCOME.HANDLED,
    });

    const secondCase = await createCase({
      context,
    });

    await createCorrection({
      user: context.doctor,
      labSlipId: secondCase.labSlip.id,
      data: {
        description: "Open HTTP correction",
      },
    });

    const ceraAgent = await loginAgent(context.ceraStaff);

    const response = await ceraAgent.get(
      `/api/v1/corrections?status=${CORRECTION_STATUS.RESOLVED}`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.corrections).toHaveLength(1);

    expect(response.body.data.corrections[0].status).toBe(
      CORRECTION_STATUS.RESOLVED,
    );

    expect(response.body.data.pagination.total).toBe(1);
  });

  it("only returns a Doctor's own corrections through the HTTP API", async () => {
    const context = await createContext();

    const ownCase = await createCase({
      context,
      doctor: context.doctor,
    });

    const otherCase = await createCase({
      context,
      doctor: context.otherDoctor,
    });

    const ownCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: ownCase.labSlip.id,
      data: {
        description: "Doctor HTTP correction",
      },
    });

    await createCorrection({
      user: context.otherDoctor,
      labSlipId: otherCase.labSlip.id,
      data: {
        description: "Other doctor HTTP correction",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const response = await doctorAgent.get("/api/v1/corrections");

    expect(response.status).toBe(200);

    expect(response.body.data.corrections).toHaveLength(1);

    expect(response.body.data.corrections[0].id).toBe(ownCorrection.id);

    expect(response.body.data.pagination.total).toBe(1);
  });

  it("only returns Clinic Staff corrections from accessible clinics through the HTTP API", async () => {
    const context = await createContext();

    const accessibleCase = await createCase({
      context,
    });

    const accessibleCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: accessibleCase.labSlip.id,
      data: {
        description: "Accessible HTTP correction",
      },
    });

    const otherClinic = await createClinic(
      context.admin,
      "HTTP Restricted Clinic",
    );

    await addMembership({
      clinic: otherClinic,
      user: context.otherDoctor,
      admin: context.admin,
    });

    const restrictedCase = await createCase({
      context,
      doctor: context.otherDoctor,
      clinic: otherClinic,
    });

    await createCorrection({
      user: context.ceraStaff,
      labSlipId: restrictedCase.labSlip.id,
      data: {
        description: "Restricted HTTP correction",
      },
    });

    const clinicAgent = await loginAgent(context.clinicStaff);

    const response = await clinicAgent.get("/api/v1/corrections");

    expect(response.status).toBe(200);

    expect(response.body.data.corrections).toHaveLength(1);

    expect(response.body.data.corrections[0].id).toBe(accessibleCorrection.id);
  });

  it("does not allow Scanning Staff to list corrections through the HTTP API", async () => {
    const context = await createContext();

    const scannerAgent = await loginAgent(context.scanner);

    const response = await scannerAgent.get("/api/v1/corrections");

    expect(response.status).toBe(403);
  });

  it("returns populated correction detail through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Detailed HTTP correction",
      },
    });

    await startCorrectionReview({
      user: context.ceraStaff,
      correctionId: correction.id,
      note: "HTTP review started",
    });

    const doctorAgent = await loginAgent(context.doctor);

    const response = await doctorAgent.get(
      `/api/v1/corrections/${correction.id}`,
    );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.correction.id).toBe(correction.id);

    expect(response.body.data.correction.labSlip.id).toBe(labSlip.id);

    expect(response.body.data.correction.labSlip.reference).toBe(
      labSlip.reference,
    );

    expect(response.body.data.correction.labSlip.patient.name).toBe(
      "Correction Patient",
    );

    expect(response.body.data.correction.createdBy.id).toBe(context.doctor.id);

    expect(response.body.data.correction.createdBy.name).toBe(
      context.doctor.name,
    );

    expect(response.body.data.correction.history).toHaveLength(1);

    expect(response.body.data.correction.history[0].changedBy.id).toBe(
      context.ceraStaff.id,
    );

    expect(response.body.data.correction.history[0].changedBy.name).toBe(
      context.ceraStaff.name,
    );
  });

  it("does not allow a Doctor to retrieve another Doctor's correction through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
      doctor: context.otherDoctor,
    });

    const correction = await createCorrection({
      user: context.otherDoctor,
      labSlipId: labSlip.id,
      data: {
        description: "Other Doctor HTTP detail",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const response = await doctorAgent.get(
      `/api/v1/corrections/${correction.id}`,
    );

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("LAB_SLIP_NOT_FOUND");
  });

  it("does not allow Clinic Staff to retrieve correction detail from an inaccessible clinic through the HTTP API", async () => {
    const context = await createContext();

    const otherClinic = await createClinic(
      context.admin,
      "HTTP Inaccessible Detail Clinic",
    );

    await addMembership({
      clinic: otherClinic,
      user: context.otherDoctor,
      admin: context.admin,
    });

    const { labSlip } = await createCase({
      context,
      doctor: context.otherDoctor,
      clinic: otherClinic,
    });

    const correction = await createCorrection({
      user: context.ceraStaff,
      labSlipId: labSlip.id,
      data: {
        description: "Restricted HTTP detail",
      },
    });

    const clinicAgent = await loginAgent(context.clinicStaff);

    const response = await clinicAgent.get(
      `/api/v1/corrections/${correction.id}`,
    );

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("LAB_SLIP_NOT_FOUND");
  });

  it("returns the expected errors for invalid and missing correction ids through the HTTP API", async () => {
    const context = await createContext();

    const adminAgent = await loginAgent(context.admin);

    const invalidResponse = await adminAgent.get(
      "/api/v1/corrections/not-an-object-id",
    );

    expect(invalidResponse.status).toBe(400);

    expect(invalidResponse.body.error.code).toBe("INVALID_CORRECTION_ID");

    const missingId = new mongoose.Types.ObjectId().toString();

    const missingResponse = await adminAgent.get(
      `/api/v1/corrections/${missingId}`,
    );

    expect(missingResponse.status).toBe(404);

    expect(missingResponse.body.error.code).toBe("CORRECTION_NOT_FOUND");
  });

  it.each([["status=INVALID_STATUS"], ["page=0"], ["limit=0"], ["limit=101"]])(
    "rejects invalid correction list query: %s",
    async (queryString) => {
      const context = await createContext();

      const adminAgent = await loginAgent(context.admin);

      const response = await adminAgent.get(
        `/api/v1/corrections?${queryString}`,
      );

      expect(response.status).toBe(400);
    },
  );

  it("does not allow Scanning Staff to retrieve correction detail through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Scanner HTTP restriction",
      },
    });

    const scannerAgent = await loginAgent(context.scanner);

    const response = await scannerAgent.get(
      `/api/v1/corrections/${correction.id}`,
    );

    expect(response.status).toBe(403);
  });

  it("allows authorized actors to upload evidence to an active correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Evidence upload test",
      },
    });

    const actors = [
      context.doctor,
      context.clinicStaff,
      context.ceraStaff,
      context.admin,
    ];

    for (const [index, user] of actors.entries()) {
      const attachment = await createCorrectionAttachment({
        user,
        correctionId: correction.id,
        file: attachmentFile({
          filename: `evidence-${index + 1}.png`,
        }),
      });

      expect(attachment.correctionId.toString()).toBe(correction.id);

      expect(attachment.uploadedByUserId.toString()).toBe(user.id);

      expect(attachment.contentType).toBe("image/png");

      expect(attachment.sizeBytes).toBe(VALID_PNG.length);

      expect(attachment.objectKey).toMatch(
        new RegExp(`^correction-attachments/${correction.id}/`),
      );
    }

    expect(
      await CorrectionAttachment.countDocuments({
        correctionId: correction._id,
      }),
    ).toBe(4);

    expect(storeCorrectionAttachment).toHaveBeenCalledTimes(4);
  });

  it("does not allow Scanning Staff to upload correction evidence", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Scanner restriction",
      },
    });

    await expect(
      createCorrectionAttachment({
        user: context.scanner,
        correctionId: correction.id,
        file: attachmentFile(),
      }),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_UPLOAD_FORBIDDEN",
    });

    expect(await CorrectionAttachment.countDocuments()).toBe(0);
  });

  it("does not allow another Doctor to upload evidence to an inaccessible correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Private correction",
      },
    });

    await expect(
      createCorrectionAttachment({
        user: context.otherDoctor,
        correctionId: correction.id,
        file: attachmentFile(),
      }),
    ).rejects.toMatchObject({
      code: "LAB_SLIP_NOT_FOUND",
    });

    expect(await CorrectionAttachment.countDocuments()).toBe(0);
  });

  it("rejects correction evidence when no file is provided", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Missing evidence",
      },
    });

    await expect(
      createCorrectionAttachment({
        user: context.doctor,
        correctionId: correction.id,
        file: undefined,
      }),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_REQUIRED",
    });
  });

  it("rejects correction evidence whose bytes are not a real supported file", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Fake evidence",
      },
    });

    const fakePng = Buffer.from("this is not really a PNG file");

    await expect(
      createCorrectionAttachment({
        user: context.doctor,
        correctionId: correction.id,
        file: attachmentFile({
          buffer: fakePng,
          filename: "fake.png",
          contentType: "image/png",
        }),
      }),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_TYPE_INVALID",
    });

    expect(await CorrectionAttachment.countDocuments()).toBe(0);
  });

  it("rejects correction evidence whose content does not match its declared file type", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Mismatched evidence",
      },
    });

    await expect(
      createCorrectionAttachment({
        user: context.doctor,
        correctionId: correction.id,
        file: attachmentFile({
          buffer: VALID_PNG,
          filename: "evidence.jpg",
          contentType: "image/jpeg",
        }),
      }),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_TYPE_MISMATCH",
    });
  });

  it.each([
    {
      name: "JPEG",
      buffer: VALID_JPEG,
      filename: "evidence.jpg",
      contentType: "image/jpeg",
    },
    {
      name: "PNG",
      buffer: VALID_PNG,
      filename: "evidence.png",
      contentType: "image/png",
    },
    {
      name: "WEBP",
      buffer: VALID_WEBP,
      filename: "evidence.webp",
      contentType: "image/webp",
    },
    {
      name: "PDF",
      buffer: VALID_PDF,
      filename: "evidence.pdf",
      contentType: "application/pdf",
    },
  ])(
    "accepts verified $name correction evidence",
    async ({ buffer, filename, contentType }) => {
      const context = await createContext();

      const { labSlip } = await createCase({
        context,
      });

      const correction = await createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: `${filename} evidence`,
        },
      });

      const attachment = await createCorrectionAttachment({
        user: context.doctor,
        correctionId: correction.id,
        file: attachmentFile({
          buffer,
          filename,
          contentType,
        }),
      });

      expect(attachment.contentType).toBe(contentType);

      expect(attachment.sizeBytes).toBe(buffer.length);
    },
  );

  it("rejects a sixth attachment on the same correction", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Attachment limit",
      },
    });

    for (let index = 1; index <= 5; index += 1) {
      await createCorrectionAttachment({
        user: context.doctor,
        correctionId: correction.id,
        file: attachmentFile({
          filename: `evidence-${index}.png`,
        }),
      });
    }

    expect(
      await CorrectionAttachment.countDocuments({
        correctionId: correction._id,
      }),
    ).toBe(5);

    await expect(
      createCorrectionAttachment({
        user: context.doctor,
        correctionId: correction.id,
        file: attachmentFile({
          filename: "evidence-6.png",
        }),
      }),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_LIMIT_REACHED",
    });

    expect(
      await CorrectionAttachment.countDocuments({
        correctionId: correction._id,
      }),
    ).toBe(5);
  });

  it("returns canDelete true only for the original uploader while correction is active", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Deletion permissions",
      },
    });

    const attachment = await createCorrectionAttachment({
      user: context.doctor,
      correctionId: correction.id,
      file: attachmentFile(),
    });

    const doctorResult = await listCorrectionAttachments({
      user: context.doctor,
      correctionId: correction.id,
    });

    expect(doctorResult.attachments).toHaveLength(1);

    expect(doctorResult.attachments[0].attachment.id).toBe(attachment.id);

    expect(doctorResult.attachments[0].canDelete).toBe(true);

    const adminResult = await listCorrectionAttachments({
      user: context.admin,
      correctionId: correction.id,
    });

    expect(adminResult.attachments[0].canDelete).toBe(false);
  });

  it("allows the original uploader to delete evidence while correction is active", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Deletable evidence",
      },
    });

    const attachment = await createCorrectionAttachment({
      user: context.doctor,
      correctionId: correction.id,
      file: attachmentFile(),
    });

    await deleteCorrectionAttachment({
      user: context.doctor,
      correctionId: correction.id,
      attachmentId: attachment.id,
    });

    expect(await CorrectionAttachment.findById(attachment.id)).toBeNull();

    expect(deleteCorrectionAttachmentObject).toHaveBeenCalledWith(
      attachment.objectKey,
    );
  });

  it("does not allow another user to delete correction evidence", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Uploader-only deletion",
      },
    });

    const attachment = await createCorrectionAttachment({
      user: context.doctor,
      correctionId: correction.id,
      file: attachmentFile(),
    });

    await expect(
      deleteCorrectionAttachment({
        user: context.admin,
        correctionId: correction.id,
        attachmentId: attachment.id,
      }),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_DELETE_FORBIDDEN",
    });

    expect(await CorrectionAttachment.findById(attachment.id)).not.toBeNull();
  });

  it.each([CORRECTION_STATUS.RESOLVED, CORRECTION_STATUS.REJECTED])(
    "makes evidence read-only when correction becomes %s",
    async (terminalStatus) => {
      const context = await createContext();

      const { labSlip } = await createCase({
        context,
      });

      const correction = await createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: "Terminal evidence",
        },
      });

      const attachment = await createCorrectionAttachment({
        user: context.doctor,
        correctionId: correction.id,
        file: attachmentFile(),
      });

      await startCorrectionReview({
        user: context.admin,
        correctionId: correction.id,
      });

      if (terminalStatus === CORRECTION_STATUS.RESOLVED) {
        await resolveCorrection({
          user: context.admin,
          correctionId: correction.id,
          outcome: CORRECTION_OUTCOME.HANDLED,
        });
      } else {
        await rejectCorrection({
          user: context.admin,
          correctionId: correction.id,
        });
      }

      await expect(
        createCorrectionAttachment({
          user: context.doctor,
          correctionId: correction.id,
          file: attachmentFile({
            filename: "late-evidence.png",
          }),
        }),
      ).rejects.toMatchObject({
        code: "CORRECTION_ATTACHMENT_LOCKED",
      });

      await expect(
        deleteCorrectionAttachment({
          user: context.doctor,
          correctionId: correction.id,
          attachmentId: attachment.id,
        }),
      ).rejects.toMatchObject({
        code: "CORRECTION_ATTACHMENT_LOCKED",
      });

      const listed = await listCorrectionAttachments({
        user: context.doctor,
        correctionId: correction.id,
      });

      expect(listed.attachments).toHaveLength(1);

      expect(listed.attachments[0].canDelete).toBe(false);

      const access = await getCorrectionAttachmentAccess({
        user: context.doctor,
        correctionId: correction.id,
        attachmentId: attachment.id,
      });

      expect(access.url).toBe("https://example.test/private-correction-file");

      expect(access.expiresInSeconds).toBe(300);
    },
  );

  it("requires the attachment to belong to the requested correction", async () => {
    const context = await createContext();

    const firstCase = await createCase({
      context,
    });

    const firstCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: firstCase.labSlip.id,
      data: {
        description: "First correction",
      },
    });

    const attachment = await createCorrectionAttachment({
      user: context.doctor,
      correctionId: firstCorrection.id,
      file: attachmentFile(),
    });

    const secondCase = await createCase({
      context,
    });

    const secondCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: secondCase.labSlip.id,
      data: {
        description: "Second correction",
      },
    });

    await expect(
      getCorrectionAttachmentAccess({
        user: context.doctor,
        correctionId: secondCorrection.id,
        attachmentId: attachment.id,
      }),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_NOT_FOUND",
    });
  });

  it("rejects invalid and missing correction attachment ids", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Attachment lookup",
      },
    });

    await expect(
      getCorrectionAttachmentAccess({
        user: context.doctor,
        correctionId: correction.id,
        attachmentId: "invalid-id",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_ATTACHMENT_ID",
    });

    const missingId = new mongoose.Types.ObjectId().toString();

    await expect(
      getCorrectionAttachmentAccess({
        user: context.doctor,
        correctionId: correction.id,
        attachmentId: missingId,
      }),
    ).rejects.toMatchObject({
      code: "ATTACHMENT_NOT_FOUND",
    });
  });

  it("removes the stored object when attachment database persistence fails", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Persistence cleanup",
      },
    });

    const databaseError = new Error("simulated attachment database failure");

    const createSpy = vi
      .spyOn(CorrectionAttachment, "create")
      .mockRejectedValueOnce(databaseError);

    try {
      await expect(
        createCorrectionAttachment({
          user: context.doctor,
          correctionId: correction.id,
          file: attachmentFile(),
        }),
      ).rejects.toBe(databaseError);

      expect(storeCorrectionAttachment).toHaveBeenCalledTimes(1);

      expect(deleteCorrectionAttachmentObject).toHaveBeenCalledTimes(1);

      const storedObjectKey =
        storeCorrectionAttachment.mock.calls[0][0].objectKey;

      expect(deleteCorrectionAttachmentObject).toHaveBeenCalledWith(
        storedObjectKey,
      );
    } finally {
      createSpy.mockRestore();
    }
  });

  it("uploads correction evidence through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "HTTP evidence upload",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const response = await doctorAgent
      .post(`/api/v1/corrections/${correction.id}/attachments`)
      .attach("attachment", VALID_PNG, {
        filename: "fit-issue.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.attachment.originalFilename).toBe(
      "fit-issue.png",
    );

    expect(response.body.data.attachment.contentType).toBe("image/png");

    expect(response.body.data.attachment.sizeBytes).toBe(VALID_PNG.length);

    expect(response.body.data.attachment.uploadedByUserId).toBe(
      context.doctor.id,
    );

    expect(response.body.data.attachment.canDelete).toBe(true);

    expect(response.body.data.attachment.objectKey).toBeUndefined();

    const stored = await CorrectionAttachment.findById(
      response.body.data.attachment.id,
    );

    expect(stored).not.toBeNull();

    expect(stored.correctionId.toString()).toBe(correction.id);
  });

  it("lists correction evidence through the HTTP API with current delete permission", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "HTTP evidence list",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const uploaded = await uploadCorrectionEvidence({
      agent: doctorAgent,
      correctionId: correction.id,
    });

    const response = await doctorAgent.get(
      `/api/v1/corrections/${correction.id}/attachments`,
    );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.attachments).toHaveLength(1);

    expect(response.body.data.attachments[0].id).toBe(uploaded.id);

    expect(response.body.data.attachments[0].canDelete).toBe(true);

    expect(response.body.data.attachments[0].objectKey).toBeUndefined();

    const adminAgent = await loginAgent(context.admin);

    const adminResponse = await adminAgent.get(
      `/api/v1/corrections/${correction.id}/attachments`,
    );

    expect(adminResponse.status).toBe(200);

    expect(adminResponse.body.data.attachments[0].canDelete).toBe(false);
  });

  it("returns temporary private access to correction evidence through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Private evidence access",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const attachment = await uploadCorrectionEvidence({
      agent: doctorAgent,
      correctionId: correction.id,
    });

    const response = await doctorAgent.get(
      `/api/v1/corrections/${correction.id}/attachments/${attachment.id}/access`,
    );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.url).toBe(
      "https://example.test/private-correction-file",
    );

    expect(response.body.data.expiresInSeconds).toBe(300);

    expect(response.body.data.attachment.id).toBe(attachment.id);

    expect(response.body.data.attachment.objectKey).toBeUndefined();
  });

  it("allows the original uploader to delete correction evidence through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "HTTP evidence deletion",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const attachment = await uploadCorrectionEvidence({
      agent: doctorAgent,
      correctionId: correction.id,
    });

    const response = await doctorAgent.delete(
      `/api/v1/corrections/${correction.id}/attachments/${attachment.id}`,
    );

    expect(response.status).toBe(204);

    expect(await CorrectionAttachment.findById(attachment.id)).toBeNull();
  });

  it("does not expose correction evidence endpoints to Scanning Staff", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Scanner evidence restriction",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    await uploadCorrectionEvidence({
      agent: doctorAgent,
      correctionId: correction.id,
    });

    const scannerAgent = await loginAgent(context.scanner);

    const listResponse = await scannerAgent.get(
      `/api/v1/corrections/${correction.id}/attachments`,
    );

    expect(listResponse.status).toBe(403);

    const uploadResponse = await scannerAgent
      .post(`/api/v1/corrections/${correction.id}/attachments`)
      .attach("attachment", VALID_PNG, {
        filename: "scanner.png",
        contentType: "image/png",
      });

    expect(uploadResponse.status).toBe(403);
  });

  it("does not allow another Doctor to access correction evidence", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
      doctor: context.doctor,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Doctor evidence isolation",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    await uploadCorrectionEvidence({
      agent: doctorAgent,
      correctionId: correction.id,
    });

    const otherDoctorAgent = await loginAgent(context.otherDoctor);

    const response = await otherDoctorAgent.get(
      `/api/v1/corrections/${correction.id}/attachments`,
    );

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("LAB_SLIP_NOT_FOUND");
  });

  it.each([CORRECTION_STATUS.RESOLVED, CORRECTION_STATUS.REJECTED])(
    "makes HTTP evidence mutations read-only when correction is %s",
    async (terminalStatus) => {
      const context = await createContext();

      const { labSlip } = await createCase({
        context,
      });

      const correction = await createCorrection({
        user: context.doctor,
        labSlipId: labSlip.id,
        data: {
          description: "Terminal HTTP evidence",
        },
      });

      const doctorAgent = await loginAgent(context.doctor);

      const attachment = await uploadCorrectionEvidence({
        agent: doctorAgent,
        correctionId: correction.id,
      });

      await startCorrectionReview({
        user: context.admin,
        correctionId: correction.id,
      });

      if (terminalStatus === CORRECTION_STATUS.RESOLVED) {
        await resolveCorrection({
          user: context.admin,
          correctionId: correction.id,
          outcome: CORRECTION_OUTCOME.HANDLED,
        });
      } else {
        await rejectCorrection({
          user: context.admin,
          correctionId: correction.id,
        });
      }

      const uploadResponse = await doctorAgent
        .post(`/api/v1/corrections/${correction.id}/attachments`)
        .attach("attachment", VALID_PNG, {
          filename: "late-evidence.png",
          contentType: "image/png",
        });

      expect(uploadResponse.status).toBe(409);

      expect(uploadResponse.body.error.code).toBe(
        "CORRECTION_ATTACHMENT_LOCKED",
      );

      const deleteResponse = await doctorAgent.delete(
        `/api/v1/corrections/${correction.id}/attachments/${attachment.id}`,
      );

      expect(deleteResponse.status).toBe(409);

      expect(deleteResponse.body.error.code).toBe(
        "CORRECTION_ATTACHMENT_LOCKED",
      );

      /*
       * Historical evidence remains readable.
       */
      const listResponse = await doctorAgent.get(
        `/api/v1/corrections/${correction.id}/attachments`,
      );

      expect(listResponse.status).toBe(200);

      expect(listResponse.body.data.attachments).toHaveLength(1);

      expect(listResponse.body.data.attachments[0].canDelete).toBe(false);

      const accessResponse = await doctorAgent.get(
        `/api/v1/corrections/${correction.id}/attachments/${attachment.id}/access`,
      );

      expect(accessResponse.status).toBe(200);
    },
  );

  it("rejects fake correction evidence through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Fake HTTP evidence",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const fakePng = Buffer.from("this is not really a png");

    const response = await doctorAgent
      .post(`/api/v1/corrections/${correction.id}/attachments`)
      .attach("attachment", fakePng, {
        filename: "fake.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("ATTACHMENT_TYPE_INVALID");

    expect(
      await CorrectionAttachment.countDocuments({
        correctionId: correction._id,
      }),
    ).toBe(0);
  });

  it("rejects correction evidence larger than 10 MB through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Oversized HTTP evidence",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const oversizedFile = Buffer.alloc(10 * 1024 * 1024 + 1, 0);

    const response = await doctorAgent
      .post(`/api/v1/corrections/${correction.id}/attachments`)
      .attach("attachment", oversizedFile, {
        filename: "large.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("ATTACHMENT_TOO_LARGE");

    expect(
      await CorrectionAttachment.countDocuments({
        correctionId: correction._id,
      }),
    ).toBe(0);
  });

  it("rejects a sixth correction evidence attachment through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "HTTP attachment limit",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    for (let index = 1; index <= 5; index += 1) {
      const response = await doctorAgent
        .post(`/api/v1/corrections/${correction.id}/attachments`)
        .attach("attachment", VALID_PNG, {
          filename: `evidence-${index}.png`,
          contentType: "image/png",
        });

      expect(response.status).toBe(201);
    }

    const response = await doctorAgent
      .post(`/api/v1/corrections/${correction.id}/attachments`)
      .attach("attachment", VALID_PNG, {
        filename: "evidence-6.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(409);

    expect(response.body.error.code).toBe("ATTACHMENT_LIMIT_REACHED");

    expect(
      await CorrectionAttachment.countDocuments({
        correctionId: correction._id,
      }),
    ).toBe(5);
  });

  it("does not allow another authorized user to delete someone else's correction evidence", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "HTTP uploader-only deletion",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const attachment = await uploadCorrectionEvidence({
      agent: doctorAgent,
      correctionId: correction.id,
    });

    const adminAgent = await loginAgent(context.admin);

    const response = await adminAgent.delete(
      `/api/v1/corrections/${correction.id}/attachments/${attachment.id}`,
    );

    expect(response.status).toBe(403);

    expect(response.body.error.code).toBe("ATTACHMENT_DELETE_FORBIDDEN");

    expect(await CorrectionAttachment.findById(attachment.id)).not.toBeNull();
  });

  it("rejects invalid and missing attachment ids through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "HTTP attachment lookup",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const invalidResponse = await doctorAgent.get(
      `/api/v1/corrections/${correction.id}/attachments/not-an-object-id/access`,
    );

    expect(invalidResponse.status).toBe(400);

    expect(invalidResponse.body.error.code).toBe("INVALID_ATTACHMENT_ID");

    const missingId = new mongoose.Types.ObjectId().toString();

    const missingResponse = await doctorAgent.get(
      `/api/v1/corrections/${correction.id}/attachments/${missingId}/access`,
    );

    expect(missingResponse.status).toBe(404);

    expect(missingResponse.body.error.code).toBe("ATTACHMENT_NOT_FOUND");
  });

  it("does not expose an attachment through a different correction", async () => {
    const context = await createContext();

    const firstCase = await createCase({
      context,
    });

    const firstCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: firstCase.labSlip.id,
      data: {
        description: "First HTTP correction",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const attachment = await uploadCorrectionEvidence({
      agent: doctorAgent,
      correctionId: firstCorrection.id,
    });

    const secondCase = await createCase({
      context,
    });

    const secondCorrection = await createCorrection({
      user: context.doctor,
      labSlipId: secondCase.labSlip.id,
      data: {
        description: "Second HTTP correction",
      },
    });

    const response = await doctorAgent.get(
      `/api/v1/corrections/${secondCorrection.id}/attachments/${attachment.id}/access`,
    );

    expect(response.status).toBe(404);

    expect(response.body.error.code).toBe("ATTACHMENT_NOT_FOUND");
  });

  it("requires an attachment file through the HTTP API", async () => {
    const context = await createContext();

    const { labSlip } = await createCase({
      context,
    });

    const correction = await createCorrection({
      user: context.doctor,
      labSlipId: labSlip.id,
      data: {
        description: "Missing HTTP evidence",
      },
    });

    const doctorAgent = await loginAgent(context.doctor);

    const response = await doctorAgent.post(
      `/api/v1/corrections/${correction.id}/attachments`,
    );

    expect(response.status).toBe(400);

    expect(response.body.error.code).toBe("ATTACHMENT_REQUIRED");
  });
});
