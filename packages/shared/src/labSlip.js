export const LAB_SLIP_SOURCE = Object.freeze({
  PORTAL: "PORTAL",
  PHONE: "PHONE",
  WHATSAPP: "WHATSAPP",
  PAPER: "PAPER",
});

export const LAB_SLIP_SOURCE_VALUES = Object.freeze(
  Object.values(LAB_SLIP_SOURCE),
);

export const LAB_SLIP_STATUS = Object.freeze({
  SUBMITTED: "SUBMITTED",
});

export const LAB_SLIP_STATUS_VALUES = Object.freeze(
  Object.values(LAB_SLIP_STATUS),
);

export const LAB_SLIP_URGENCY = Object.freeze({
  STANDARD: "STANDARD",
  URGENT: "URGENT",
});

export const LAB_SLIP_URGENCY_VALUES = Object.freeze(
  Object.values(LAB_SLIP_URGENCY),
);

export const TOOTH_QUADRANTS = Object.freeze(["UR", "UL", "LR", "LL"]);

export const TOOTH_VALUES = Object.freeze(
  TOOTH_QUADRANTS.flatMap((quadrant) =>
    Array.from(
      {
        length: 8,
      },
      (_, index) => `${quadrant}${index + 1}`,
    ),
  ),
);
