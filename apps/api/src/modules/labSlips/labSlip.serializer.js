export function serializeLabSlip(labSlip) {
  const clinic = labSlip.clinicId;

  const doctor = labSlip.doctorId;

  return {
    id: labSlip.id,

    reference: labSlip.reference,

    source: labSlip.source,

    status: labSlip.status,

    urgency: labSlip.urgency,

    clinic:
      clinic && typeof clinic === "object" && clinic.name
        ? {
            id: clinic.id,

            name: clinic.name,

            type: clinic.type,

            city: clinic.address?.city || null,
          }
        : {
            id: String(labSlip.clinicId),
          },

    doctor:
      doctor && typeof doctor === "object" && doctor.name
        ? {
            id: doctor.id,

            name: doctor.name,

            phone: doctor.phone,

            email: doctor.email || null,
          }
        : {
            id: String(labSlip.doctorId),
          },

    patient: {
      name: labSlip.patient.name,

      reference: labSlip.patient.reference || null,
    },

    items: labSlip.items.map((item) => ({
      id: item.id,

      productId: String(item.productId),

      productName: item.productName,

      categoryId: String(item.categoryId),

      categoryName: item.categoryName,

      teeth: item.teeth,

      shade: item.shade || null,

      ponticDesign: item.ponticDesign || null,

      designNotes: item.designNotes || null,
    })),

    notes: labSlip.notes || null,

    scanRequired: labSlip.scanRequired,

    production: labSlip.production
      ? {
          status: labSlip.production.status,
        }
      : null,

    createdAt: labSlip.createdAt,

    updatedAt: labSlip.updatedAt,
  };
}
