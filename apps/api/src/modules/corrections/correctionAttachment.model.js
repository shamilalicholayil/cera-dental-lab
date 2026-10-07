import mongoose from "mongoose";

const correctionAttachmentSchema = new mongoose.Schema(
  {
    correctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Correction",
      required: true,
      index: true,
    },

    objectKey: {
      type: String,
      required: true,
      unique: true,
    },

    originalFilename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    contentType: {
      type: String,
      required: true,
    },

    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },

    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

correctionAttachmentSchema.index({
  correctionId: 1,
  createdAt: 1,
});

export const CorrectionAttachment = mongoose.model(
  "CorrectionAttachment",
  correctionAttachmentSchema,
);
