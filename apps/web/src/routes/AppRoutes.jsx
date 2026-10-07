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

import { ScanBookingsPage } from "../pages/ScanBookingsPage";

import { ScanBookingDetailPage } from "../pages/ScanBookingDetailPage";

import { ProductionQueuePage } from "../pages/ProductionQueuePage";

import { ProductionDetailPage } from "../pages/ProductionDetailPage";

import { EditLabSlipPage } from "../pages/EditLabSlipPage";

import { CorrectionsPage } from "../pages/CorrectionsPage";

import { CorrectionDetailPage } from "../pages/CorrectionDetailPage";

const LAB_SLIP_ROLES = [
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
];

const SCAN_ROLES = [
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
  USER_ROLES.SCANNING_STAFF,
];

const PRODUCTION_ROLES = [USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF];

const CORRECTION_ROLES = [
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

        <Route
          path="/portal/lab-slips/:labSlipId/edit"
          element={
            <RoleGuard
              allowedRoles={LAB_SLIP_ROLES}
              fallback={<Navigate to="/portal" replace />}
            >
              <EditLabSlipPage />
            </RoleGuard>
          }
        />

        <Route
          path="/portal/production"
          element={
            <RoleGuard
              allowedRoles={PRODUCTION_ROLES}
              fallback={<Navigate to="/portal" replace />}
            >
              <ProductionQueuePage />
            </RoleGuard>
          }
        />

        <Route
          path="/portal/production/:productionId"
          element={
            <RoleGuard
              allowedRoles={PRODUCTION_ROLES}
              fallback={<Navigate to="/portal" replace />}
            >
              <ProductionDetailPage />
            </RoleGuard>
          }
        />

        <Route
          path="/portal/corrections"
          element={
            <RoleGuard
              allowedRoles={CORRECTION_ROLES}
              fallback={<Navigate to="/portal" replace />}
            >
              <CorrectionsPage />
            </RoleGuard>
          }
        />

        <Route
          path="/portal/corrections/:correctionId"
          element={
            <RoleGuard
              allowedRoles={CORRECTION_ROLES}
              fallback={<Navigate to="/portal" replace />}
            >
              <CorrectionDetailPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route
        path="/portal/scans"
        element={
          <RoleGuard
            allowedRoles={SCAN_ROLES}
            fallback={<Navigate to="/portal" replace />}
          >
            <ScanBookingsPage />
          </RoleGuard>
        }
      />

      <Route
        path="/portal/scans/:bookingId"
        element={
          <RoleGuard
            allowedRoles={SCAN_ROLES}
            fallback={<Navigate to="/portal" replace />}
          >
            <ScanBookingDetailPage />
          </RoleGuard>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
