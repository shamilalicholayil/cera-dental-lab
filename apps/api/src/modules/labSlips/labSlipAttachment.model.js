import mongoose from "mongoose";

const labSlipAttachmentSchema = new mongoose.Schema(
  {
    labSlipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabSlip",
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

labSlipAttachmentSchema.index({
  labSlipId: 1,
  createdAt: 1,
});

export const LabSlipAttachment = mongoose.model(
  "LabSlipAttachment",
  labSlipAttachmentSchema,
);
