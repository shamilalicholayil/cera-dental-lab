import { Navigate, Route, Routes } from "react-router-dom";

import { USER_ROLES } from "@cera/shared";

import { ProtectedRoute } from "../auth/ProtectedRoute";

import { PublicOnlyRoute } from "../auth/PublicOnlyRoute";

import { RoleGuard } from "../auth/RoleGuard";

import { DevHomePage } from "../pages/DevHomePage";

import { LoginPage } from "../pages/LoginPage";

import { PortalHomePage } from "../pages/PortalHomePage";

import { AdminUsersPage } from "../pages/AdminUsersPage";

import { AcceptInvitationPage } from "../pages/AcceptInvitationPage";

import { AdminClinicsPage } from "../pages/AdminClinicsPage";

import { AdminCatalogPage } from "../pages/AdminCatalogPage";

import { NewLabSlipPage } from "../pages/NewLabSlipPage";

import { LabSlipsPage } from "../pages/LabSlipsPage";

import { LabSlipDetailPage } from "../pages/LabSlipDetailPage";

const LAB_SLIP_ROLES = [
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
];

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

        <Route
          path="/portal/lab-slips"
          element={
            <RoleGuard
              allowedRoles={LAB_SLIP_ROLES}
              fallback={<Navigate to="/portal" replace />}
            >
              <LabSlipsPage />
            </RoleGuard>
          }
        />

        <Route
          path="/portal/lab-slips/new"
          element={
            <RoleGuard
              allowedRoles={LAB_SLIP_ROLES}
              fallback={<Navigate to="/portal" replace />}
            >
              <NewLabSlipPage />
            </RoleGuard>
          }
        />

        <Route
          path="/portal/lab-slips/:labSlipId"
          element={
            <RoleGuard
              allowedRoles={LAB_SLIP_ROLES}
              fallback={<Navigate to="/portal" replace />}
            >
              <LabSlipDetailPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
