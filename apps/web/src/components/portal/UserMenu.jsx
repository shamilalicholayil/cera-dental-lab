import { useEffect, useRef, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate } from "react-router-dom";

import { clearLogoutError, logout } from "../../features/auth/authSlice";

import {
  selectCurrentUser,
  selectLogoutError,
  selectLogoutStatus,
} from "../../features/auth/authSelectors";

const ROLE_LABELS = {
  DOCTOR: "Doctor",

  CLINIC_STAFF: "Clinic Staff",

  CERA_ADMIN: "Cera Admin",

  CERA_STAFF: "Cera Staff",

  SCANNING_STAFF: "Scanning Staff",
};

function getInitials(name) {
  if (!name) {
    return "C";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function UserMenu() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const user = useSelector(selectCurrentUser);

  const logoutStatus = useSelector(selectLogoutStatus);

  const logoutError = useSelector(selectLogoutError);

  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);

  const signingOut = logoutStatus === "loading";

  const roleLabel = ROLE_LABELS[user?.role] || user?.role || "";

  const initials = getInitials(user?.name);

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    if (signingOut) {
      return;
    }

    dispatch(clearLogoutError());

    const result = await dispatch(logout());

    if (logout.fulfilled.match(result)) {
      setOpen(false);

      navigate("/login", {
        replace: true,
      });
    }
  }

  function toggleMenu() {
    if (logoutError) {
      dispatch(clearLogoutError());
    }

    setOpen((current) => !current);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--cera-blue-500)]/15"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--cera-navy-900)] text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {initials}
        </span>

        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-40 truncate text-sm font-medium text-[var(--cera-navy-950)]">
            {user?.name}
          </span>

          <span className="block text-xs text-[var(--cera-text-muted)]">
            {roleLabel}
          </span>
        </span>

        <svg
          className={`hidden h-4 w-4 text-[var(--cera-text-muted)] transition-transform sm:block ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white shadow-[0_18px_55px_rgba(7,24,39,0.14)]"
          role="menu"
        >
          <div className="border-b border-[var(--cera-border)] px-4 py-4">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cera-background)] text-sm font-semibold text-[var(--cera-navy-900)]"
                aria-hidden="true"
              >
                {initials}
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--cera-navy-950)]">
                  {user?.name}
                </p>

                <p className="mt-0.5 text-xs text-[var(--cera-text-muted)]">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>

          {logoutError && (
            <div
              className="mx-3 mt-3 rounded-xl border border-red-200 bg-[var(--cera-danger-bg)] px-3 py-2.5"
              role="alert"
            >
              <p className="text-xs font-medium text-[var(--cera-danger)]">
                We couldn't sign you out. Please try again.
              </p>

              {logoutError.requestId && (
                <p className="mt-1 text-[11px] text-[var(--cera-danger)]/70">
                  Reference: {logoutError.requestId}
                </p>
              )}
            </div>
          )}

          <div className="p-2">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--cera-danger)] transition hover:bg-[var(--cera-danger-bg)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleLogout}
              disabled={signingOut}
            >
              {signingOut ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-[var(--cera-danger)]"
                    aria-hidden="true"
                  />
                  Signing out...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 3.5H5.5C4.39543 3.5 3.5 4.39543 3.5 5.5V14.5C3.5 15.6046 4.39543 16.5 5.5 16.5H8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />

                    <path
                      d="M12 6L16 10L12 14"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M7.5 10H16"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
