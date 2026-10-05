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

    phone: user.phone || null,

    email: user.email || null,
  };
}

export function serializeScanBooking(booking) {
  const clinic = booking.clinicId;

  const labSlip = booking.labSlipId;

  return {
    id: booking.id,

    reference: booking.reference,

    status: booking.status,

    urgency: booking.urgency,

    labSlip:
      labSlip && typeof labSlip === "object" && labSlip.reference
        ? {
            id: labSlip.id,

            reference: labSlip.reference,

            patient: {
              name: labSlip.patient?.name || null,

              reference: labSlip.patient?.reference || null,
            },
          }
        : {
            id: String(booking.labSlipId),
          },

    clinic:
      clinic && typeof clinic === "object" && clinic.name
        ? {
            id: clinic.id,

            name: clinic.name,

            type: clinic.type,

            address: clinic.address,
          }
        : {
            id: String(booking.clinicId),
          },

    doctor: serializeUser(booking.doctorId),

    assignedScanningStaff: serializeUser(booking.assignedScanningStaffId),

    requestedStartAt: booking.requestedStartAt,

    proposedStartAt: booking.proposedStartAt || null,

    confirmedStartAt: booking.confirmedStartAt || null,

    rejectionReason: booking.rejectionReason || null,

    cancellationReason: booking.cancellationReason || null,

    completedAt: booking.completedAt || null,

    reschedule: booking.rescheduleStatus
      ? {
          status: booking.rescheduleStatus,

          requestedStartAt: booking.rescheduleRequestedStartAt || null,

          proposedStartAt: booking.rescheduleProposedStartAt || null,

          reason: booking.rescheduleReason || null,

          requestedBy: serializeUser(booking.rescheduleRequestedByUserId),

          reviewedBy: serializeUser(booking.rescheduleReviewedByUserId),

          requestedAt: booking.rescheduleRequestedAt || null,
        }
      : null,

    rescheduleHistory: (booking.rescheduleHistory || []).map((entry) => ({
      previousConfirmedStartAt: entry.previousConfirmedStartAt,

      requestedStartAt: entry.requestedStartAt || null,

      proposedStartAt: entry.proposedStartAt || null,

      confirmedStartAt: entry.confirmedStartAt,

      requestedBy: serializeUser(entry.requestedByUserId),

      reviewedBy: serializeUser(entry.reviewedByUserId),

      reason: entry.reason || null,

      requestedAt: entry.requestedAt || null,

      confirmedAt: entry.confirmedAt,
    })),

    createdAt: booking.createdAt,

    updatedAt: booking.updatedAt,
  };
}
