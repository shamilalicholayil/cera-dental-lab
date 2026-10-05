import { ScanBookingCounter } from "./scanBookingCounter.model.js";

export async function generateScanBookingReference(now = new Date()) {
  const year = now.getUTCFullYear();

  const counter = await ScanBookingCounter.findOneAndUpdate(
    {
      _id: `scan-booking:${year}`,
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

  return `SCAN-${year}-${sequence}`;
}
