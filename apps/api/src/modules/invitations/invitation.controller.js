import { serializeUser } from "../users/user.serializer.js";

import { acceptInvitation, previewInvitation } from "./invitation.service.js";

function maskPhone(phone) {
  if (!phone) {
    return null;
  }

  return `${phone.slice(0, 3)}******${phone.slice(-3)}`;
}

export async function preview(req, res, next) {
  try {
    const result = await previewInvitation(req.body.token);

    res.status(200).json({
      success: true,

      data: {
        invitation: {
          name: result.user.name,

          role: result.user.role,

          phone: maskPhone(result.user.phone),

          expiresAt: result.invitation.expiresAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function accept(req, res, next) {
  try {
    const user = await acceptInvitation({
      rawToken: req.body.token,

      password: req.body.password,
    });

    res.status(200).json({
      success: true,

      data: {
        message: "Account activated successfully",

        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}
