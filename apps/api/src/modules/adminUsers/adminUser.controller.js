import { serializeUser } from "../users/user.serializer.js";

import { activateUser, disableUser, listUsers } from "./adminUser.service.js";

export async function list(req, res, next) {
  try {
    const result = await listUsers(req.validatedQuery);

    res.status(200).json({
      success: true,

      data: {
        users: result.users.map(serializeUser),

        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function disable(req, res, next) {
  try {
    const user = await disableUser({
      userId: req.params.userId,

      currentUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function activate(req, res, next) {
  try {
    const user = await activateUser(req.params.userId);

    res.status(200).json({
      success: true,

      data: {
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}
