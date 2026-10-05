import { useSelector } from "react-redux";

import { selectCurrentUser } from "../features/auth/authSelectors";

export function RoleGuard({ allowedRoles, children, fallback = null }) {
  const user = useSelector(selectCurrentUser);

  if (!user) {
    return fallback;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback;
  }

  return children;
}
