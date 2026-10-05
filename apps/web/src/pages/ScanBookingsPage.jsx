import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { Link } from "react-router-dom";

import { SCAN_BOOKING_STATUS, USER_ROLES } from "@cera/shared";

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

export function ScanBookingsPage() {
  const user = useSelector(selectCurrentUser);

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

  useEffect(() => {
    let cancelled = false;

    getScanBookings({
      status,
      page,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        setBookings(response.data.scanBookings);

        setPagination(response.data.pagination);

        setError(null);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load scan bookings.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status, page]);

  const scanner = user?.role === USER_ROLES.SCANNING_STAFF;

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div
        className={
          scanner
            ? "mx-auto max-w-3xl px-4 py-6"
            : "mx-auto max-w-7xl px-5 py-8 sm:px-8"
        }
      >
        <div>
          <p className="text-sm font-medium text-[var(--cera-blue-600)]">
            Patient scanning
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-[var(--cera-navy-950)]">
            {scanner ? "My Visits" : "Scan Bookings"}
          </h1>

          <p className="mt-2 text-[var(--cera-text-muted)]">
            {scanner
              ? "Your assigned patient scanning visits."
              : "Review and coordinate Cera patient scanning requests."}
          </p>
        </div>

        <div className="mt-6">
          <label
            htmlFor="scan-status"
            className="mb-2 block text-sm font-medium"
          >
            Status
          </label>

          <select
            id="scan-status"
            value={status}
            onChange={(event) => {
              setLoading(true);

              setStatus(event.target.value);

              setPage(1);
            }}
            className="h-11 w-full max-w-xs rounded-xl border border-[var(--cera-border)] bg-white px-4"
          >
            <option value="">All statuses</option>

            {Object.values(SCAN_BOOKING_STATUS).map((value) => (
              <option key={value} value={value}>
                {SCAN_BOOKING_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center text-sm text-[var(--cera-text-muted)]">
              Loading scan bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center text-sm text-[var(--cera-text-muted)]">
              No scan bookings found.
            </div>
          ) : (
            bookings.map((booking) => (
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

                      {booking.urgency === "URGENT" && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Urgent
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-medium">
                      {booking.labSlip.patient.name}
                    </p>

                    <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                      {booking.clinic.name}
                    </p>

                    {!scanner && booking.doctor?.name && (
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
            ))
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => {
                setLoading(true);
                setPage((current) => current - 1);
              }}
              className="h-10 rounded-xl border border-[var(--cera-border)] px-4 text-sm disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => {
                setLoading(true);
                setPage((current) => current + 1);
              }}
              className="h-10 rounded-xl border border-[var(--cera-border)] px-4 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
