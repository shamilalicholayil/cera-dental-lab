import crypto from "node:crypto";
import path from "node:path";
import mongoose from "mongoose";

import { fileTypeFromBuffer } from "file-type";

import { PRODUCTION_STATUS, USER_ROLES } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { LabSlipAttachment } from "./labSlipAttachment.model.js";

import {
  ALLOWED_ATTACHMENT_TYPES,
  LAB_SLIP_ATTACHMENT_MAX_COUNT,
} from "./labSlipAttachment.upload.js";

import {
  deleteLabSlipAttachmentObject,
  storeLabSlipAttachment,
  createLabSlipAttachmentAccessUrl,
} from "./labSlipAttachment.storage.js";

import { getLabSlip } from "./labSlip.service.js";

const UPLOAD_ROLES = new Set([
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
]);

function assertUploadRole(user) {
  if (!UPLOAD_ROLES.has(user.role)) {
    throw new AppError(
      "You are not allowed to upload Lab Slip attachments",
      403,
      "ATTACHMENT_UPLOAD_FORBIDDEN",
    );
  }
}

function assertAttachmentId(attachmentId) {
  if (!mongoose.isValidObjectId(attachmentId)) {
    throw new AppError("Invalid attachment id", 400, "INVALID_ATTACHMENT_ID");
  }
}

function attachmentCanBeDeleted({ attachment, user, labSlip }) {
  return (
    attachment.uploadedByUserId.equals(user._id) &&
    labSlip.production?.status === PRODUCTION_STATUS.SUBMITTED
  );
}

export async function listLabSlipAttachments({ user, labSlipId }) {
  const labSlip = await getLabSlip({
    user,
    labSlipId,
  });

  const attachments = await LabSlipAttachment.find({
    labSlipId: labSlip._id,
  }).sort({
    createdAt: 1,
  });

  return {
    labSlip,

    attachments: attachments.map((attachment) => ({
      attachment,

      canDelete: attachmentCanBeDeleted({
        attachment,
        user,
        labSlip,
      }),
    })),
  };
}

export async function getLabSlipAttachmentAccess({
  user,
  labSlipId,
  attachmentId,
}) {
  assertAttachmentId(attachmentId);

  const labSlip = await getLabSlip({
    user,
    labSlipId,
  });

  const attachment = await LabSlipAttachment.findOne({
    _id: attachmentId,
    labSlipId: labSlip._id,
  });

  if (!attachment) {
    throw new AppError("Attachment not found", 404, "ATTACHMENT_NOT_FOUND");
  }

  const url = await createLabSlipAttachmentAccessUrl(attachment.objectKey);

  return {
    attachment,
    url,
    expiresInSeconds: 5 * 60,
  };
}

export async function deleteLabSlipAttachment({
  user,
  labSlipId,
  attachmentId,
}) {
  assertAttachmentId(attachmentId);

  const labSlip = await getLabSlip({
    user,
    labSlipId,
  });

  const attachment = await LabSlipAttachment.findOne({
    _id: attachmentId,
    labSlipId: labSlip._id,
  });

  if (!attachment) {
    throw new AppError("Attachment not found", 404, "ATTACHMENT_NOT_FOUND");
  }

  if (!attachment.uploadedByUserId.equals(user._id)) {
    throw new AppError(
      "Only the original uploader can delete this attachment",
      403,
      "ATTACHMENT_DELETE_FORBIDDEN",
    );
  }

  assertProductionAllowsAttachments(labSlip);

  /*
   * Delete the private object first.
   *
   * If MongoDB deletion unexpectedly fails afterward,
   * retrying this operation is safe because deleting a
   * missing R2 object is effectively idempotent.
   */
  await deleteLabSlipAttachmentObject(attachment.objectKey);

  await LabSlipAttachment.deleteOne({
    _id: attachment._id,
  });
}

function getExpectedMimeType(originalFilename) {
  const extension = path.extname(originalFilename).toLowerCase();

  return ALLOWED_ATTACHMENT_TYPES[extension] || null;
}

async function validateAttachmentContent(file) {
  if (!file?.buffer?.length) {
    throw new AppError(
      "Attachment file is required",
      400,
      "ATTACHMENT_REQUIRED",
    );
  }

  const expectedMimeType = getExpectedMimeType(file.originalname);

  if (!expectedMimeType) {
    throw new AppError(
      "Only JPEG, PNG, WEBP, and PDF attachments are allowed",
      400,
      "UNSUPPORTED_ATTACHMENT_TYPE",
    );
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (!detectedType) {
    throw new AppError(
      "Unable to verify attachment file type",
      400,
      "ATTACHMENT_TYPE_INVALID",
    );
  }

  if (detectedType.mime !== expectedMimeType) {
    throw new AppError(
      "Attachment content does not match its file type",
      400,
      "ATTACHMENT_TYPE_MISMATCH",
    );
  }

  if (file.mimetype !== detectedType.mime) {
    throw new AppError(
      "Attachment content type is invalid",
      400,
      "ATTACHMENT_TYPE_MISMATCH",
    );
  }

  return detectedType;
}

function buildObjectKey({ labSlipId, detectedExtension }) {
  const attachmentId = crypto.randomUUID();

  return [
    "lab-slip-attachments",
    String(labSlipId),
    `${attachmentId}.${detectedExtension}`,
  ].join("/");
}

function createAttachmentLimitError() {
  return new AppError(
    `A Lab Slip can have a maximum of ${LAB_SLIP_ATTACHMENT_MAX_COUNT} attachments`,
    409,
    "ATTACHMENT_LIMIT_REACHED",
  );
}

async function assertAttachmentLimit(labSlipId) {
  const attachmentCount = await LabSlipAttachment.countDocuments({
    labSlipId,
  });

  if (attachmentCount >= LAB_SLIP_ATTACHMENT_MAX_COUNT) {
    throw createAttachmentLimitError();
  }
}

function isCapacitySlotDuplicate(error) {
  if (error?.code !== 11000) {
    return false;
  }

  return (
    error?.keyPattern?.capacitySlot === 1 ||
    Object.prototype.hasOwnProperty.call(error?.keyValue ?? {}, "capacitySlot")
  );
}

async function getAvailableCapacitySlot(labSlipId) {
  const attachments = await LabSlipAttachment.find({
    labSlipId,
  })
    .select({
      capacitySlot: 1,
    })
    .lean();

  if (attachments.length >= LAB_SLIP_ATTACHMENT_MAX_COUNT) {
    throw createAttachmentLimitError();
  }

  /*
   * Attachments created before capacitySlot was introduced
   * still consume capacity.
   */
  const legacyAttachmentCount = attachments.filter(
    (attachment) => !Number.isInteger(attachment.capacitySlot),
  ).length;

  const usableSlotCount = LAB_SLIP_ATTACHMENT_MAX_COUNT - legacyAttachmentCount;

  const occupiedSlots = new Set(
    attachments
      .filter((attachment) => Number.isInteger(attachment.capacitySlot))
      .map((attachment) => attachment.capacitySlot),
  );

  for (let slot = 0; slot < usableSlotCount; slot += 1) {
    if (!occupiedSlots.has(slot)) {
      return slot;
    }
  }

  throw createAttachmentLimitError();
}

async function createAttachmentMetadataWithCapacity({
  labSlipId,
  objectKey,
  originalFilename,
  contentType,
  sizeBytes,
  uploadedByUserId,
}) {
  /*
   * Concurrent requests deliberately choose the same lowest
   * available slot.
   *
   * MongoDB's unique compound index decides which request wins.
   * A loser recalculates capacity and tries the next free slot.
   */
  for (let attempt = 0; attempt < LAB_SLIP_ATTACHMENT_MAX_COUNT; attempt += 1) {
    const capacitySlot = await getAvailableCapacitySlot(labSlipId);

    try {
      return await LabSlipAttachment.create({
        labSlipId,
        capacitySlot,
        objectKey,
        originalFilename,
        contentType,
        sizeBytes,
        uploadedByUserId,
      });
    } catch (error) {
      if (isCapacitySlotDuplicate(error)) {
        continue;
      }

      throw error;
    }
  }

  throw createAttachmentLimitError();
}

function assertProductionAllowsAttachments(labSlip) {
  if (!labSlip.production) {
    throw new AppError(
      "Production record is unavailable for this Lab Slip",
      409,
      "LAB_SLIP_PRODUCTION_UNAVAILABLE",
    );
  }

  if (labSlip.production.status !== PRODUCTION_STATUS.SUBMITTED) {
    throw new AppError(
      "Attachments cannot be added after production has started",
      409,
      "ATTACHMENT_PRODUCTION_LOCKED",
    );
  }
}

export async function preflightLabSlipAttachmentUpload({ user, labSlipId }) {
  assertUploadRole(user);

  const labSlip = await getLabSlip({
    user,
    labSlipId,
  });

  assertProductionAllowsAttachments(labSlip);

  await assertAttachmentLimit(labSlip._id);

  return labSlip;
}

export async function createLabSlipAttachment({ user, labSlipId, file }) {
  /*
   * Revalidate after upload parsing.
   *
   * The route performs a preflight before Multer buffers the file,
   * but authorization/state may theoretically change between
   * preflight and persistence.
   */
  const labSlip = await preflightLabSlipAttachmentUpload({
    user,
    labSlipId,
  });

  const detectedType = await validateAttachmentContent(file);

  const objectKey = buildObjectKey({
    labSlipId: labSlip._id,
    detectedExtension: detectedType.ext,
  });

  await storeLabSlipAttachment({
    objectKey,
    buffer: file.buffer,
    contentType: detectedType.mime,
  });

  try {
    return await createAttachmentMetadataWithCapacity({
      labSlipId: labSlip._id,
      objectKey,
      originalFilename: file.originalname,
      contentType: detectedType.mime,
      sizeBytes: file.size,
      uploadedByUserId: user._id,
    });
  } catch (error) {
    /*
     * R2 upload succeeded but MongoDB persistence failed.
     *
     * Remove the object so we don't intentionally leave
     * an untracked attachment in storage.
     */
    try {
      await deleteLabSlipAttachmentObject(objectKey);
    } catch {
      /*
       * Do not hide the original database failure.
       * Storage cleanup failures can be logged later when
       * this endpoint is wired into the application logger.
       */
    }

    throw error;
  }
}
