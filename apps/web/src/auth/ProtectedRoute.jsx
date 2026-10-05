import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSelector } from "react-redux";

import {
  selectCurrentUser,
  selectRestoreStatus,
} from "../features/auth/authSelectors";

import { AuthLoadingScreen } from "./AuthLoadingScreen";

export function ProtectedRoute() {
  const user = useSelector(selectCurrentUser);

  const restoreStatus = useSelector(selectRestoreStatus);

  const location = useLocation();

  if (restoreStatus === "idle" || restoreStatus === "loading") {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return <Outlet />;
}
