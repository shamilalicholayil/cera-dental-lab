import { USER_STATUS } from "@cera/shared";

import { AppError } from "../../utils/AppError.js";

import { User } from "../users/user.model.js";

import { RefreshToken } from "../auth/refreshToken.model.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listUsers({
  search,
  role,
  status,
  page = 1,
  limit = 20,
}) {
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    const safeSearch = escapeRegex(search.trim());

    filter.$or = [
      {
        name: {
          $regex: safeSearch,

          $options: "i",
        },
      },

      {
        phone: {
          $regex: safeSearch,

          $options: "i",
        },
      },

      {
        email: {
          $regex: safeSearch,

          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit),

    User.countDocuments(filter),
  ]);

  return {
    users,

    pagination: {
      page,

      limit,

      total,

      pages: Math.ceil(total / limit),
    },
  };
}

export async function disableUser({ userId, currentUserId }) {
  if (userId === String(currentUserId)) {
    throw new AppError(
      "You cannot disable your own account",
      400,
      "CANNOT_DISABLE_SELF",
    );
  }

  const user = await User.findOneAndUpdate(
    {
      _id: userId,

      status: USER_STATUS.ACTIVE,
    },
    {
      $set: {
        status: USER_STATUS.DISABLED,
      },

      $inc: {
        authVersion: 1,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!user) {
    throw new AppError(
      "Only active accounts can be disabled",
      409,
      "USER_CANNOT_BE_DISABLED",
    );
  }

  await RefreshToken.updateMany(
    {
      userId: user._id,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );

  return user;
}

export async function activateUser(userId) {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,

      status: USER_STATUS.DISABLED,

      passwordHash: {
        $exists: true,
      },
    },
    {
      $set: {
        status: USER_STATUS.ACTIVE,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!user) {
    throw new AppError(
      "This account cannot be activated",
      409,
      "USER_CANNOT_BE_ACTIVATED",
    );
  }

  return user;
}
