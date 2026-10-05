import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "../auth/ProtectedRoute";

import { PublicOnlyRoute } from "../auth/PublicOnlyRoute";

import { DevHomePage } from "../pages/DevHomePage";

import { LoginPage } from "../pages/LoginPage";

import { PortalHomePage } from "../pages/PortalHomePage";

import { USER_ROLES } from "@cera/shared";

import { AdminUsersPage } from "../pages/AdminUsersPage";

import { AcceptInvitationPage } from "../pages/AcceptInvitationPage";

import { AdminClinicsPage } from "../pages/AdminClinicsPage";

import { AdminCatalogPage } from "../pages/AdminCatalogPage";

import { RoleGuard } from "../auth/RoleGuard";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DevHomePage />} />

      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/portal" element={<PortalHomePage />} />

        <Route
          path="/portal/admin/users"
          element={
            <RoleGuard
              allowedRoles={[USER_ROLES.CERA_ADMIN]}
              fallback={<Navigate to="/portal" replace />}
            >
              <AdminUsersPage />
            </RoleGuard>
          }
        />

        <Route
          path="/portal/admin/clinics"
          element={
            <RoleGuard
              allowedRoles={[USER_ROLES.CERA_ADMIN]}
              fallback={<Navigate to="/portal" replace />}
            >
              <AdminClinicsPage />
            </RoleGuard>
          }
        />

        <Route
          path="/portal/admin/catalog"
          element={
            <RoleGuard
              allowedRoles={[USER_ROLES.CERA_ADMIN]}
              fallback={<Navigate to="/portal" replace />}
            >
              <AdminCatalogPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
