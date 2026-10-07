import path from "node:path";

import multer from "multer";

import { AppError } from "../../utils/AppError.js";

export const CORRECTION_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;

export const CORRECTION_ATTACHMENT_MAX_COUNT = 5;

export const CORRECTION_ATTACHMENT_TYPES = Object.freeze({
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
});

const storage = multer.memoryStorage();

function correctionAttachmentFileFilter(req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();

  const expectedMimeType = CORRECTION_ATTACHMENT_TYPES[extension];

  if (!expectedMimeType) {
    callback(
      new AppError(
        "Only JPEG, PNG, WEBP, and PDF attachments are allowed",
        400,
        "UNSUPPORTED_ATTACHMENT_TYPE",
      ),
    );

    return;
  }

  if (file.mimetype !== expectedMimeType) {
    callback(
      new AppError(
        "Attachment file extension and content type do not match",
        400,
        "ATTACHMENT_TYPE_MISMATCH",
      ),
    );

    return;
  }

  callback(null, true);
}

const correctionAttachmentUpload = multer({
  storage,

  limits: {
    fileSize: CORRECTION_ATTACHMENT_MAX_SIZE,
    files: 1,
  },

  fileFilter: correctionAttachmentFileFilter,
}).single("attachment");

export function parseCorrectionAttachmentUpload(req, res, next) {
  correctionAttachmentUpload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(
          new AppError(
            "Attachment must be 10 MB or smaller",
            400,
            "ATTACHMENT_TOO_LARGE",
          ),
        );

        return;
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        next(
          new AppError(
            "Only one attachment file may be uploaded at a time",
            400,
            "ATTACHMENT_UPLOAD_INVALID",
          ),
        );

        return;
      }

      next(
        new AppError(
          "Invalid attachment upload",
          400,
          "ATTACHMENT_UPLOAD_INVALID",
        ),
      );

      return;
    }

    next(error);
  });
}
