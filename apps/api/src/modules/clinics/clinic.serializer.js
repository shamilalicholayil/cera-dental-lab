export function serializeClinic(clinic) {
  return {
    id: clinic.id,

    name: clinic.name,

    type: clinic.type,

    contactPhone: clinic.contactPhone || null,

    email: clinic.email || null,

    address: {
      line1: clinic.address.line1,

      line2: clinic.address.line2 || null,

      locality: clinic.address.locality || null,

      city: clinic.address.city,

      district: clinic.address.district || null,

      state: clinic.address.state,

      pincode: clinic.address.pincode,

      country: clinic.address.country,
    },

    status: clinic.status,

    createdAt: clinic.createdAt,

    updatedAt: clinic.updatedAt,
  };
}

export function serializeClinicMembership(membership) {
  const user = membership.userId;

  return {
    id: membership.id,

    active: membership.active,

    addedAt: membership.createdAt,

    removedAt: membership.removedAt,

    user: user
      ? {
          id: user.id,

          name: user.name,

          phone: user.phone,

          email: user.email || null,

          role: user.role,

          status: user.status,
        }
      : null,
  };
}
