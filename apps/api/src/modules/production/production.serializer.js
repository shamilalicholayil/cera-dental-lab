function serializeUser(user) {
  if (!user) {
    return null;
  }

  if (typeof user !== "object" || !user.name) {
    return {
      id: String(user),
    };
  }

  return {
    id: user.id,
    name: user.name,
  };
}

function serializeLabSlip(labSlip) {
  if (!labSlip || typeof labSlip !== "object" || !labSlip.reference) {
    return {
      id: String(labSlip),
    };
  }

  return {
    id: labSlip.id,
    reference: labSlip.reference,

    patient: {
      name: labSlip.patient?.name || null,
      reference: labSlip.patient?.reference || null,
    },

    urgency: labSlip.urgency || null,

    scanRequired: Boolean(labSlip.scanRequired),

    createdAt: labSlip.createdAt || null,
  };
}

export function serializeProductionSummary(production) {
  return {
    id: production.id,

    status: production.status,

    labSlip: serializeLabSlip(production.labSlipId),

    startedAt: production.startedAt || null,

    completedAt: production.completedAt || null,

    createdAt: production.createdAt,

    updatedAt: production.updatedAt,
  };
}

export function serializeProduction(production) {
  return {
    id: production.id,

    status: production.status,

    labSlip: serializeLabSlip(production.labSlipId),

    startedAt: production.startedAt || null,

    completedAt: production.completedAt || null,

    history: (production.history || []).map((entry) => ({
      previousStatus: entry.previousStatus,

      newStatus: entry.newStatus,

      changedBy: serializeUser(entry.changedByUserId),

      note: entry.note || null,

      changedAt: entry.changedAt,
    })),

    createdAt: production.createdAt,

    updatedAt: production.updatedAt,
  };
}
