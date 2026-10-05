function getInvitationStatus(invitation) {
  if (invitation.consumedAt) {
    return "ACCEPTED";
  }

  if (invitation.revokedAt) {
    return "REVOKED";
  }

  if (invitation.expiresAt <= new Date()) {
    return "EXPIRED";
  }

  return "PENDING";
}

export function serializeInvitation(invitation) {
  const user = invitation.userId;

  return {
    id: invitation.id,

    status: getInvitationStatus(invitation),

    expiresAt: invitation.expiresAt,

    consumedAt: invitation.consumedAt,

    revokedAt: invitation.revokedAt,

    createdAt: invitation.createdAt,

    user:
      user && typeof user === "object"
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
