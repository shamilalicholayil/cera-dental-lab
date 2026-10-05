import { SCAN_BOOKING_STATUS } from "@cera/shared";

export const SCAN_BOOKING_STATUS_LABELS = Object.freeze({
  [SCAN_BOOKING_STATUS.PENDING_REVIEW]: "Pending review",

  [SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION]: "Awaiting confirmation",

  [SCAN_BOOKING_STATUS.CONFIRMED]: "Confirmed",

  [SCAN_BOOKING_STATUS.ASSIGNED]: "Assigned",

  [SCAN_BOOKING_STATUS.COMPLETED]: "Completed",

  [SCAN_BOOKING_STATUS.REJECTED]: "Rejected",

  [SCAN_BOOKING_STATUS.CANCELLED]: "Cancelled",
});
