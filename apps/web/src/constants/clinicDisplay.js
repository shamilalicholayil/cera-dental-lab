import { CLINIC_STATUS, CLINIC_TYPES } from "@cera/shared";

export const CLINIC_TYPE_LABELS = Object.freeze({
  [CLINIC_TYPES.CLINIC]: "Clinic",

  [CLINIC_TYPES.HOSPITAL]: "Hospital",
});

export const CLINIC_STATUS_LABELS = Object.freeze({
  [CLINIC_STATUS.ACTIVE]: "Active",

  [CLINIC_STATUS.DISABLED]: "Disabled",
});

export const CLINIC_TYPE_OPTIONS = Object.freeze([
  {
    value: CLINIC_TYPES.CLINIC,

    label: "Clinic",
  },

  {
    value: CLINIC_TYPES.HOSPITAL,

    label: "Hospital",
  },
]);
