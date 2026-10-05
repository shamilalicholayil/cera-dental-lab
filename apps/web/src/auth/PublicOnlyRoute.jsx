import { Navigate, Outlet } from "react-router-dom";

import { useSelector } from "react-redux";

import {
  selectCurrentUser,
  selectRestoreStatus,
} from "../features/auth/authSelectors";

import { AuthLoadingScreen } from "./AuthLoadingScreen";

export function PublicOnlyRoute() {
  const user = useSelector(selectCurrentUser);

  const restoreStatus = useSelector(selectRestoreStatus);

  if (restoreStatus === "idle" || restoreStatus === "loading") {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}
