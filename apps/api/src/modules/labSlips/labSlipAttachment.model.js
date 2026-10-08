import mongoose from "mongoose";

const labSlipAttachmentSchema = new mongoose.Schema(
  {
    labSlipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabSlip",
      required: true,
      index: true,
    },

    capacitySlot: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "capacitySlot must be an integer",
      },
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

labSlipAttachmentSchema.index(
  {
    labSlipId: 1,
    capacitySlot: 1,
  },
  {
    unique: true,

    /*
     * Existing attachments created before this hardening
     * do not have capacitySlot and remain valid.
     */
    partialFilterExpression: {
      capacitySlot: {
        $exists: true,
      },
    },

    name: "uniq_lab_slip_attachment_capacity_slot",
  },
);

export const LabSlipAttachment = mongoose.model(
  "LabSlipAttachment",
  labSlipAttachmentSchema,
);
