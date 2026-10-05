import { USER_ROLES, USER_STATUS } from "@cera/shared";

import { User } from "../users/user.model.js";

export async function listActiveScanningStaff() {
  return User.find({
    role: USER_ROLES.SCANNING_STAFF,

    status: USER_STATUS.ACTIVE,
  })
    .select("name phone email role status")
    .sort({
      name: 1,
    });
}
