import { USER_STATUS } from "@cera/shared";

import { env } from "../../config/env.js";

import { AppError } from "../../utils/AppError.js";

import { hashPassword } from "../auth/password.js";

import { User } from "../users/user.model.js";

import { normalizeEmail, normalizeIndianPhone } from "../users/user.utils.js";

import { Invitation } from "./invitation.model.js";

import {
  createInvitationToken,
  hashInvitationToken,
} from "./invitation.token.js";

function invalidInvitation() {
  return new AppError(
    "Invitation is invalid or has expired",
    400,
    "INVITATION_INVALID",
  );
}

function invitationExpiry() {
  return new Date(Date.now() + env.INVITATION_TTL_HOURS * 60 * 60 * 1000);
}

function buildInviteUrl(rawToken) {
  return `${env.CLIENT_URL}/accept-invitation#token=${rawToken}`;
}

async function findExistingUser({ phone, email }) {
  const conditions = [
    {
      phone,
    },
  ];

  if (email) {
    conditions.push({
      email,
    });
  }

  return User.findOne({
    $or: conditions,
  });
}

export async function createInvitation({
  name,
  phone,
  email,
  role,
  createdByUserId,
}) {
  const normalizedPhone = normalizeIndianPhone(phone);

  if (!normalizedPhone) {
    throw new AppError(
      "Enter a valid Indian mobile number",
      400,
      "INVALID_PHONE",
    );
  }

  const normalizedEmail = normalizeEmail(email);

  const existingUser = await findExistingUser({
    phone: normalizedPhone,

    email: normalizedEmail,
  });

  if (existingUser) {
    if (existingUser.status === USER_STATUS.INVITED) {
      throw new AppError(
        "This user already has a pending account invitation",
        409,
        "USER_ALREADY_INVITED",
      );
    }

    throw new AppError(
      "An account already exists with this phone number or email",
      409,
      "USER_ALREADY_EXISTS",
    );
  }

  const user = await User.create({
    name,

    phone: normalizedPhone,

    email: normalizedEmail,

    role,

    status: USER_STATUS.INVITED,
  });

  try {
    const rawToken = createInvitationToken();

    const tokenHash = hashInvitationToken(rawToken);

    const invitation = await Invitation.create({
      userId: user._id,

      createdByUserId,

      tokenHash,

      expiresAt: invitationExpiry(),
    });

    return {
      invitation,

      user,

      inviteUrl: buildInviteUrl(rawToken),
    };
  } catch (error) {
    /*
     * Avoid leaving an orphan INVITED user if
     * invitation creation fails.
     */
    await User.deleteOne({
      _id: user._id,

      status: USER_STATUS.INVITED,
    });

    throw error;
  }
}

export async function previewInvitation(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    throw invalidInvitation();
  }

  const tokenHash = hashInvitationToken(rawToken);

  const invitation = await Invitation.findOne({
    tokenHash,

    consumedAt: null,

    revokedAt: null,

    expiresAt: {
      $gt: new Date(),
    },
  })
    .select("+tokenHash")
    .populate("userId");

  if (
    !invitation ||
    !invitation.userId ||
    invitation.userId.status !== USER_STATUS.INVITED
  ) {
    throw invalidInvitation();
  }

  return {
    invitation,
    user: invitation.userId,
  };
}

export async function acceptInvitation({ rawToken, password }) {
  if (!rawToken || typeof rawToken !== "string") {
    throw invalidInvitation();
  }

  const tokenHash = hashInvitationToken(rawToken);

  const now = new Date();

  /*
   * Atomically consume the invitation.
   *
   * A token can therefore be accepted only once.
   */
  const invitation = await Invitation.findOneAndUpdate(
    {
      tokenHash,

      consumedAt: null,

      revokedAt: null,

      expiresAt: {
        $gt: now,
      },
    },
    {
      $set: {
        consumedAt: now,
      },
    },
    {
      returnDocument: "before",
    },
  ).select("+tokenHash");

  if (!invitation) {
    throw invalidInvitation();
  }

  const user = await User.findById(invitation.userId).select("+passwordHash");

  if (!user || user.status !== USER_STATUS.INVITED) {
    throw invalidInvitation();
  }

  /*
   * Fail closed:
   *
   * The invitation has already been consumed.
   * If password hashing or account activation fails,
   * we do not make that token reusable.
   *
   * Admin can issue a replacement invitation.
   */
  const passwordHash = await hashPassword(password);

  user.passwordHash = passwordHash;

  user.status = USER_STATUS.ACTIVE;

  await user.save();

  return user;
}
