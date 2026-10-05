import { LabSlipCounter } from "./labSlipCounter.model.js";

export async function generateLabSlipReference(now = new Date()) {
  const year = now.getUTCFullYear();

  const counter = await LabSlipCounter.findOneAndUpdate(
    {
      _id: `lab-slip:${year}`,
    },
    {
      $inc: {
        value: 1,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );

  const sequence = String(counter.value).padStart(6, "0");

  return `CDL-${year}-${sequence}`;
}
