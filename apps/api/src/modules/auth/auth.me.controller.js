import { serializeUser } from "../users/user.serializer.js";

export function getCurrentUser(req, res) {
  res.status(200).json({
    success: true,

    data: {
      user: serializeUser(req.user),
    },
  });
}
