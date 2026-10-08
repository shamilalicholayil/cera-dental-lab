import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { Link } from "react-router-dom";

import {
  LAB_SLIP_URGENCY,
  SCAN_BOOKING_STATUS,
  USER_ROLES,
} from "@cera/shared";

import { getScanBookings } from "../api/scanBookings";

import { PortalHeader } from "../components/portal/PortalHeader";

import { selectCurrentUser } from "../features/auth/authSelectors";

import { SCAN_BOOKING_STATUS_LABELS } from "../constants/scanBookingDisplay";

function StatusBadge({ status }) {
  return (
    <span className="rounded-full border border-[var(--cera-border)] bg-slate-50 px-2.5 py-1 text-xs font-medium text-[var(--cera-navy-950)]">
      {SCAN_BOOKING_STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

const SCANNER_STATUS_OPTIONS = [
  {
    value: "",
    label: "All visits",
  },
  {
    value: SCAN_BOOKING_STATUS.ASSIGNED,
    label: SCAN_BOOKING_STATUS_LABELS[SCAN_BOOKING_STATUS.ASSIGNED],
  },
  {
    value: SCAN_BOOKING_STATUS.COMPLETED,
    label: SCAN_BOOKING_STATUS_LABELS[SCAN_BOOKING_STATUS.COMPLETED],
  },
  {
    value: SCAN_BOOKING_STATUS.CANCELLED,
    label: SCAN_BOOKING_STATUS_LABELS[SCAN_BOOKING_STATUS.CANCELLED],
  },
];

export function ScanBookingsPage() {
  const user = useSelector(selectCurrentUser);

  const scanner = user?.role === USER_ROLES.SCANNING_STAFF;

  const [bookings, setBookings] = useState([]);

  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      setLoading(true);
      setError(null);

      try {
        const response = await getScanBookings({
          status,
          page,
        });

        if (cancelled) {
          return;
        }

        setBookings(response.data.scanBookings || []);

        setPagination(
          response.data.pagination || {
            page: 1,
            pages: 1,
            total: 0,
          },
        );
      } catch (requestError) {
        if (!cancelled) {
          const offline =
            typeof navigator !== "undefined" && navigator.onLine === false;

          setError(
            offline
              ? "You're offline. Reconnect and try again."
              : requestError.message || "Unable to load scan bookings.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [status, page, reloadKey]);

  const statusOptions = scanner
    ? SCANNER_STATUS_OPTIONS
    : [
        {
          value: "",
          label: "All statuses",
        },

        ...Object.values(SCAN_BOOKING_STATUS).map((value) => ({
          value,
          label: SCAN_BOOKING_STATUS_LABELS[value] || value,
        })),
      ];

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div
        className={
          scanner
            ? "mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8"
            : "mx-auto max-w-7xl px-5 py-8 sm:px-8"
        }
      >
        <div
          className={
            scanner
              ? "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
              : ""
          }
        >
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              Patient scanning
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] text-[var(--cera-navy-950)]">
              {scanner ? "My Visits" : "Scan Bookings"}
            </h1>

            <p className="mt-2 max-w-xl leading-6 text-[var(--cera-text-muted)]">
              {scanner
                ? "Review your assigned scanning visits and open a visit when you arrive at the clinic."
                : "Review and coordinate Cera patient scanning requests."}
            </p>
          </div>

          {scanner && (
            <Link
              to="/portal"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
            >
              Today&apos;s visits
            </Link>
          )}
        </div>

        <div className="mt-6">
          <label
            htmlFor="scan-status"
            className="mb-2 block text-sm font-medium text-[var(--cera-navy-950)]"
          >
            {scanner ? "Visit status" : "Status"}
          </label>

          <select
            id="scan-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full max-w-xs rounded-xl border border-[var(--cera-border)] bg-white px-4 text-[var(--cera-navy-950)]"
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          {loading ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center text-sm text-[var(--cera-text-muted)]"
            >
              {scanner ? "Loading your visits..." : "Loading scan bookings..."}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-5"
            >
              <p className="font-medium text-red-800">
                {scanner
                  ? "Visits could not be loaded"
                  : "Scan bookings could not be loaded"}
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>

              <button
                type="button"
                onClick={() => {
                  setReloadKey((current) => current + 1);
                }}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700"
              >
                Try again
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center">
              <p className="font-medium text-[var(--cera-navy-950)]">
                {scanner ? "No visits found" : "No scan bookings found"}
              </p>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                {scanner
                  ? status
                    ? "There are no assigned visits with this status."
                    : "No scanning visits have been assigned to you."
                  : "No scan bookings match the current filter."}
              </p>
            </div>
          ) : scanner ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/portal/scans/${booking.id}`}
                  className="block rounded-2xl border border-[var(--cera-border)] bg-white p-4 transition active:bg-slate-50 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--cera-text-muted)]">
                        Confirmed time
                      </p>

                      <p className="mt-1 text-lg font-semibold text-[var(--cera-navy-950)]">
                        {formatDateTime(booking.confirmedStartAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <StatusBadge status={booking.status} />

                      {booking.urgency === LAB_SLIP_URGENCY.URGENT && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[var(--cera-border)] pt-4">
                    <p className="font-semibold text-[var(--cera-navy-950)]">
                      {booking.labSlip?.patient?.name || "Patient"}
                    </p>

                    {booking.labSlip?.patient?.reference && (
                      <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
                        Patient ref: {booking.labSlip.patient.reference}
                      </p>
                    )}

                    <p className="mt-3 font-medium text-[var(--cera-navy-950)]">
                      {booking.clinic?.name || "Clinic"}
                    </p>
                  </div>

                  {booking.reschedule && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-semibold text-amber-800">
                        Schedule change pending
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Continue to use the confirmed visit time until the
                        schedule change is finalized.
                      </p>
                    </div>
                  )}

                  {booking.status === SCAN_BOOKING_STATUS.COMPLETED &&
                    booking.completedAt && (
                      <p className="mt-4 text-xs text-[var(--cera-text-muted)]">
                        Completed {formatDateTime(booking.completedAt)}
                      </p>
                    )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-[var(--cera-text-muted)]">
                      {booking.reference}
                    </p>

                    <span className="text-sm font-semibold text-[var(--cera-blue-600)]">
                      Open visit →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/portal/scans/${booking.id}`}
                  className="block rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-[var(--cera-navy-950)]">
                          {booking.reference}
                        </p>

                        <StatusBadge status={booking.status} />

                        {booking.urgency === LAB_SLIP_URGENCY.URGENT && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Urgent
                          </span>
                        )}
                      </div>

                      <p className="mt-3 font-medium">
                        {booking.labSlip?.patient?.name || "Patient"}
                      </p>

                      <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                        {booking.clinic?.name || "Clinic"}
                      </p>

                      {booking.doctor?.name && (
                        <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                          {booking.doctor.name}
                        </p>
                      )}
                    </div>

                    <div className="text-sm text-[var(--cera-text-muted)] sm:text-right">
                      <p>
                        {booking.confirmedStartAt
                          ? "Confirmed"
                          : booking.proposedStartAt
                            ? "Proposed"
                            : "Requested"}
                      </p>

                      <p className="mt-1 font-medium text-[var(--cera-navy-950)]">
                        {formatDateTime(
                          booking.confirmedStartAt ||
                            booking.proposedStartAt ||
                            booking.requestedStartAt,
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {!loading && !error && pagination.pages > 1 && (
          <nav
            aria-label="Scan booking pagination"
            className={`mt-5 flex gap-2 ${
              scanner ? "justify-between" : "justify-end"
            }`}
          >
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => {
                setPage((current) => current - 1);
              }}
              className="h-10 rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => {
                setPage((current) => current + 1);
              }}
              className="h-10 rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}
