import { useSelector } from "react-redux";

import { Link } from "react-router-dom";

import { USER_ROLES } from "@cera/shared";

import { PortalHeader } from "../components/portal/PortalHeader";

import { selectCurrentUser } from "../features/auth/authSelectors";

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

export function PortalHomePage() {
  const user = useSelector(selectCurrentUser);

  const isAdmin = user.role === USER_ROLES.CERA_ADMIN;

  const canUseLabSlips = LAB_SLIP_ROLES.includes(user.role);

  const canUseScans = SCAN_ROLES.includes(user.role);

  const canUseProduction = PRODUCTION_ROLES.includes(user.role);

  const canUseCorrections = CORRECTION_ROLES.includes(user.role);

  const isScanningStaff = user.role === USER_ROLES.SCANNING_STAFF;

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-3xl">
          <div
            className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--cera-success-bg)] text-[var(--cera-success)]"
            aria-hidden="true"
          >
            ✓
          </div>

          <p className="text-sm font-medium text-[var(--cera-blue-600)]">
            Secure workspace
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-[var(--cera-navy-950)] sm:text-4xl">
            Welcome, {user.name}
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-[var(--cera-text-muted)]">
            Access the Cera tools available for your role.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {canUseLabSlips && (
              <>
                <Link
                  to="/portal/lab-slips/new"
                  className="inline-flex h-11 items-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white hover:bg-[var(--cera-navy-800)]"
                >
                  New Lab Slip
                </Link>

                <Link
                  to="/portal/lab-slips"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
                >
                  Lab Slips
                </Link>
              </>
            )}

            {canUseScans && (
              <Link
                to="/portal/scans"
                className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                {isScanningStaff ? "My Visits" : "Scans"}
              </Link>
            )}

            {canUseProduction && (
              <Link
                to="/portal/production"
                className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                Production
              </Link>
            )}

            {canUseCorrections && (
              <Link
                to="/portal/corrections"
                className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                Corrections
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/portal/admin/users"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
                >
                  Manage people
                </Link>

                <Link
                  to="/portal/admin/clinics"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
                >
                  Manage clinics
                </Link>

                <Link
                  to="/portal/admin/catalog"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
                >
                  Manage catalogue
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
