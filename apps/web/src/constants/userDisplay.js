import { USER_ROLES, USER_STATUS } from "@cera/shared";

export const ROLE_LABELS = Object.freeze({
  [USER_ROLES.DOCTOR]: "Doctor",

  [USER_ROLES.CLINIC_STAFF]: "Clinic Staff",

  [USER_ROLES.CERA_ADMIN]: "Cera Admin",

  [USER_ROLES.CERA_STAFF]: "Cera Staff",

  [USER_ROLES.SCANNING_STAFF]: "Scanning Staff",
});

export const STATUS_LABELS = Object.freeze({
  [USER_STATUS.INVITED]: "Invited",

  [USER_STATUS.ACTIVE]: "Active",

  [USER_STATUS.DISABLED]: "Disabled",

  PENDING: "Pending",

  ACCEPTED: "Accepted",

  REVOKED: "Revoked",

  EXPIRED: "Expired",
});

export const ROLE_OPTIONS = Object.freeze([
  {
    value: USER_ROLES.DOCTOR,
    label: "Doctor",
  },

  {
    value: USER_ROLES.CLINIC_STAFF,
    label: "Clinic Staff",
  },

  {
    value: USER_ROLES.CERA_STAFF,
    label: "Cera Staff",
  },

  {
    value: USER_ROLES.SCANNING_STAFF,
    label: "Scanning Staff",
  },

  {
    value: USER_ROLES.CERA_ADMIN,
    label: "Cera Admin",
  },
]);
