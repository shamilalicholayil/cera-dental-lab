import crypto from "node:crypto";
import path from "node:path";

import mongoose from "mongoose";

import { fileTypeFromBuffer } from "file-type";

import { CORRECTION_STATUS, USER_ROLES } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { getCorrection } from "./correction.service.js";

import { CorrectionAttachment } from "./correctionAttachment.model.js";

import {
  CORRECTION_ATTACHMENT_MAX_COUNT,
  CORRECTION_ATTACHMENT_TYPES,
} from "./correctionAttachment.upload.js";

import {
  createCorrectionAttachmentAccessUrl,
  deleteCorrectionAttachmentObject,
  storeCorrectionAttachment,
} from "./correctionAttachment.storage.js";

const UPLOAD_ROLES = new Set([
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
]);

function assertUploadRole(user) {
  if (!UPLOAD_ROLES.has(user.role)) {
    throw new AppError(
      "You are not allowed to upload Correction attachments",
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

function correctionAllowsAttachmentChanges(correction) {
  return ![CORRECTION_STATUS.RESOLVED, CORRECTION_STATUS.REJECTED].includes(
    correction.status,
  );
}

function assertCorrectionAllowsAttachmentChanges(correction) {
  if (!correctionAllowsAttachmentChanges(correction)) {
    throw new AppError(
      "Correction evidence is read-only after the correction is resolved or rejected",
      409,
      "CORRECTION_ATTACHMENT_LOCKED",
    );
  }
}

function attachmentCanBeDeleted({ attachment, user, correction }) {
  return (
    attachment.uploadedByUserId.equals(user._id) &&
    correctionAllowsAttachmentChanges(correction)
  );
}

export async function listCorrectionAttachments({ user, correctionId }) {
  const correction = await getCorrection({
    user,
    correctionId,
  });

  const attachments = await CorrectionAttachment.find({
    correctionId: correction._id,
  }).sort({
    createdAt: 1,
  });

  return {
    correction,

    attachments: attachments.map((attachment) => ({
      attachment,

      canDelete: attachmentCanBeDeleted({
        attachment,
        user,
        correction,
      }),
    })),
  };
}

export async function getCorrectionAttachmentAccess({
  user,
  correctionId,
  attachmentId,
}) {
  assertAttachmentId(attachmentId);

  const correction = await getCorrection({
    user,
    correctionId,
  });

  const attachment = await CorrectionAttachment.findOne({
    _id: attachmentId,
    correctionId: correction._id,
  });

  if (!attachment) {
    throw new AppError("Attachment not found", 404, "ATTACHMENT_NOT_FOUND");
  }

  const url = await createCorrectionAttachmentAccessUrl(attachment.objectKey);

  return {
    attachment,
    url,
    expiresInSeconds: 5 * 60,
  };
}

export async function deleteCorrectionAttachment({
  user,
  correctionId,
  attachmentId,
}) {
  assertAttachmentId(attachmentId);

  const correction = await getCorrection({
    user,
    correctionId,
  });

  const attachment = await CorrectionAttachment.findOne({
    _id: attachmentId,
    correctionId: correction._id,
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

  assertCorrectionAllowsAttachmentChanges(correction);

  /*
   * Delete the private object first.
   *
   * If database deletion unexpectedly fails afterward,
   * retrying the operation is safe because deleting an
   * already-missing R2 object is effectively idempotent.
   */
  await deleteCorrectionAttachmentObject(attachment.objectKey);

  await CorrectionAttachment.deleteOne({
    _id: attachment._id,
  });
}

function getExpectedMimeType(originalFilename) {
  const extension = path.extname(originalFilename).toLowerCase();

  return CORRECTION_ATTACHMENT_TYPES[extension] || null;
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

function buildObjectKey({ correctionId, detectedExtension }) {
  const attachmentId = crypto.randomUUID();

  return [
    "correction-attachments",
    String(correctionId),
    `${attachmentId}.${detectedExtension}`,
  ].join("/");
}

function createAttachmentLimitError() {
  return new AppError(
    `A Correction can have a maximum of ${CORRECTION_ATTACHMENT_MAX_COUNT} attachments`,
    409,
    "ATTACHMENT_LIMIT_REACHED",
  );
}

async function assertAttachmentLimit(correctionId) {
  const attachmentCount = await CorrectionAttachment.countDocuments({
    correctionId,
  });

  if (attachmentCount >= CORRECTION_ATTACHMENT_MAX_COUNT) {
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

async function getAvailableCapacitySlot(correctionId) {
  const attachments = await CorrectionAttachment.find({
    correctionId,
  })
    .select({
      capacitySlot: 1,
    })
    .lean();

  if (attachments.length >= CORRECTION_ATTACHMENT_MAX_COUNT) {
    throw createAttachmentLimitError();
  }

  const legacyAttachmentCount = attachments.filter(
    (attachment) => !Number.isInteger(attachment.capacitySlot),
  ).length;

  const usableSlotCount =
    CORRECTION_ATTACHMENT_MAX_COUNT - legacyAttachmentCount;

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
  correctionId,
  objectKey,
  originalFilename,
  contentType,
  sizeBytes,
  uploadedByUserId,
}) {
  for (
    let attempt = 0;
    attempt < CORRECTION_ATTACHMENT_MAX_COUNT;
    attempt += 1
  ) {
    const capacitySlot = await getAvailableCapacitySlot(correctionId);

    try {
      return await CorrectionAttachment.create({
        correctionId,
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

export async function preflightCorrectionAttachmentUpload({
  user,
  correctionId,
}) {
  assertUploadRole(user);

  const correction = await getCorrection({
    user,
    correctionId,
  });

  assertCorrectionAllowsAttachmentChanges(correction);

  await assertAttachmentLimit(correction._id);

  return correction;
}

export async function createCorrectionAttachment({ user, correctionId, file }) {
  /*
   * The route performs this preflight before Multer buffers
   * the request body.
   *
   * Revalidate here because authorization/state/count may
   * theoretically change before persistence completes.
   */
  const correction = await preflightCorrectionAttachmentUpload({
    user,
    correctionId,
  });

  const detectedType = await validateAttachmentContent(file);

  const objectKey = buildObjectKey({
    correctionId: correction._id,
    detectedExtension: detectedType.ext,
  });

  await storeCorrectionAttachment({
    objectKey,
    buffer: file.buffer,
    contentType: detectedType.mime,
  });

  try {
    return await createAttachmentMetadataWithCapacity({
      correctionId: correction._id,
      objectKey,
      originalFilename: file.originalname,
      contentType: detectedType.mime,
      sizeBytes: file.size,
      uploadedByUserId: user._id,
    });
  } catch (error) {
    /*
     * Storage succeeded but MongoDB persistence failed.
     *
     * Clean up the private R2 object so we do not
     * intentionally leave an orphaned object.
     */
    try {
      await deleteCorrectionAttachmentObject(objectKey);
    } catch {
      /*
       * Preserve the original database error.
       * Storage cleanup failures can be logged separately.
       */
    }

    throw error;
  }
}
