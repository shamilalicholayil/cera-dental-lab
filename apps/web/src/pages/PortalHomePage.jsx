import { useSelector } from "react-redux";

import { Link } from "react-router-dom";

import { USER_ROLES } from "@cera/shared";

import { PortalHeader } from "../components/portal/PortalHeader";

import { selectCurrentUser } from "../features/auth/authSelectors";

export function PortalHomePage() {
  const user = useSelector(selectCurrentUser);

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl">
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
            Your Cera session is active. Your role-specific workspace will
            appear here as its modules are completed.
          </p>

          {user.role === USER_ROLES.CERA_ADMIN && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/portal/admin/users"
                className="inline-flex h-11 items-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white hover:bg-[var(--cera-navy-800)]"
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
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
