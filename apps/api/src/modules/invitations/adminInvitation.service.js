import { USER_STATUS } from "@cera/shared";

import { env } from "../../config/env.js";

import { AppError } from "../../utils/AppError.js";

import { User } from "../users/user.model.js";

import { Invitation } from "./invitation.model.js";

import {
  createInvitationToken,
  hashInvitationToken,
} from "./invitation.token.js";

function invitationExpiry() {
  return new Date(Date.now() + env.INVITATION_TTL_HOURS * 60 * 60 * 1000);
}

function buildInviteUrl(rawToken) {
  return `${env.CLIENT_URL}/accept-invitation#token=${rawToken}`;
}

export async function listInvitations() {
  return Invitation.find().populate("userId").sort({
    createdAt: -1,
  });
}

export async function revokeInvitation(invitationId) {
  const invitation = await Invitation.findOneAndUpdate(
    {
      _id: invitationId,

      consumedAt: null,

      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  ).populate("userId");

  if (!invitation) {
    throw new AppError(
      "Invitation cannot be revoked",
      409,
      "INVITATION_NOT_PENDING",
    );
  }

  return invitation;
}

export async function regenerateInvitation({ invitationId, createdByUserId }) {
  const previous = await Invitation.findById(invitationId);

  if (!previous) {
    throw new AppError("Invitation not found", 404, "INVITATION_NOT_FOUND");
  }

  const user = await User.findById(previous.userId);

  if (!user || user.status !== USER_STATUS.INVITED) {
    throw new AppError(
      "This account is no longer awaiting invitation acceptance",
      409,
      "USER_NOT_INVITED",
    );
  }

  await Invitation.updateMany(
    {
      userId: user._id,

      consumedAt: null,

      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );

  const rawToken = createInvitationToken();

  const invitation = await Invitation.create({
    userId: user._id,

    createdByUserId,

    tokenHash: hashInvitationToken(rawToken),

    expiresAt: invitationExpiry(),
  });

  await invitation.populate("userId");

  return {
    invitation,

    inviteUrl: buildInviteUrl(rawToken),
  };
}
