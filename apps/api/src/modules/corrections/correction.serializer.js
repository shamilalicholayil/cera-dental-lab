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

function serializeReference(value) {
  if (!value) {
    return null;
  }

  /*
   * An unpopulated Mongoose ObjectId is itself an object.
   * Its `.id` property is the raw BSON Buffer, not the
   * hexadecimal identifier we want in the API response.
   *
   * Populated Mongoose documents have `_id`.
   */
  if (typeof value === "object" && value._id) {
    return {
      id: String(value._id),
    };
  }

  return {
    id: String(value),
  };
}

function serializeLabSlip(labSlip) {
  if (!labSlip) {
    return null;
  }

  if (typeof labSlip !== "object" || !labSlip.reference) {
    return serializeReference(labSlip);
  }

  return {
    id: labSlip.id,

    reference: labSlip.reference,

    patient: {
      name: labSlip.patient?.name || null,
      reference: labSlip.patient?.reference || null,
    },

    status: labSlip.status || null,

    urgency: labSlip.urgency || null,

    scanRequired: Boolean(labSlip.scanRequired),

    createdAt: labSlip.createdAt || null,
  };
}

export function serializeCorrectionAttachment(
  attachment,
  { canDelete = false } = {},
) {
  return {
    id: attachment.id,

    originalFilename: attachment.originalFilename,

    contentType: attachment.contentType,

    sizeBytes: attachment.sizeBytes,

    uploadedByUserId: String(attachment.uploadedByUserId),

    canDelete,

    createdAt: attachment.createdAt,

    updatedAt: attachment.updatedAt,
  };
}

export function serializeCorrectionSummary(correction) {
  return {
    id: correction.id,

    labSlip: serializeLabSlip(correction.labSlipId),

    production: serializeReference(correction.productionId),

    description: correction.description,

    status: correction.status,

    outcome: correction.outcome || null,

    createdBy: serializeUser(correction.createdByUserId),

    createdAt: correction.createdAt,

    updatedAt: correction.updatedAt,
  };
}

export function serializeCorrection(correction) {
  return {
    id: correction.id,

    labSlip: serializeLabSlip(correction.labSlipId),

    production: serializeReference(correction.productionId),

    description: correction.description,

    affectedLabSlipItemIds: (correction.affectedLabSlipItemIds || []).map(
      (itemId) => String(itemId),
    ),

    status: correction.status,

    outcome: correction.outcome || null,

    createdBy: serializeUser(correction.createdByUserId),

    history: (correction.history || []).map((entry) => ({
      previousStatus: entry.previousStatus,

      newStatus: entry.newStatus,

      changedBy: serializeUser(entry.changedByUserId),

      note: entry.note || null,

      changedAt: entry.changedAt,
    })),

    createdAt: correction.createdAt,

    updatedAt: correction.updatedAt,
  };
}
