import { PRODUCTION_STATUS } from "@cera/shared";

export const PRODUCTION_STATUS_LABELS = Object.freeze({
  [PRODUCTION_STATUS.SUBMITTED]: "Submitted",
  [PRODUCTION_STATUS.IN_PRODUCTION]: "In Production",
  [PRODUCTION_STATUS.COMPLETED]: "Completed",
});
