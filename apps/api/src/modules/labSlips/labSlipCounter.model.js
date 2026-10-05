import mongoose from "mongoose";

const labSlipCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    value: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    versionKey: false,
  },
);

export const LabSlipCounter = mongoose.model(
  "LabSlipCounter",
  labSlipCounterSchema,
);
