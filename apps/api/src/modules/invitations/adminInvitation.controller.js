import { createInvitation } from "./invitation.service.js";

import {
  listInvitations,
  regenerateInvitation,
  revokeInvitation,
} from "./adminInvitation.service.js";

import { serializeInvitation } from "./invitation.serializer.js";

export async function create(req, res, next) {
  try {
    const result = await createInvitation({
      ...req.body,

      createdByUserId: req.user._id,
    });

    await result.invitation.populate("userId");

    res.status(201).json({
      success: true,

      data: {
        invitation: serializeInvitation(result.invitation),

        inviteUrl: result.inviteUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const invitations = await listInvitations();

    res.status(200).json({
      success: true,

      data: {
        invitations: invitations.map(serializeInvitation),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function revoke(req, res, next) {
  try {
    const invitation = await revokeInvitation(req.params.invitationId);

    res.status(200).json({
      success: true,

      data: {
        invitation: serializeInvitation(invitation),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function regenerate(req, res, next) {
  try {
    const result = await regenerateInvitation({
      invitationId: req.params.invitationId,

      createdByUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        invitation: serializeInvitation(result.invitation),

        inviteUrl: result.inviteUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}
