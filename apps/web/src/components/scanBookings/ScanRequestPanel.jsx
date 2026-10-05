import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { SCAN_BOOKING_STATUS } from "@cera/shared";

import { createScanBooking, getScanBookings } from "../../api/scanBookings";

const ENDED_STATUSES = [
  SCAN_BOOKING_STATUS.REJECTED,
  SCAN_BOOKING_STATUS.CANCELLED,
];

export function ScanRequestPanel({ labSlip }) {
  const [existingBooking, setExistingBooking] = useState(null);

  const [requestedStartAt, setRequestedStartAt] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getScanBookings({
      labSlipId: labSlip.id,

      page: 1,
      limit: 20,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const activeBooking =
          response.data.scanBookings.find(
            (booking) => !ENDED_STATUSES.includes(booking.status),
          ) || null;

        setExistingBooking(activeBooking);

        setError(null);
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setError(requestError.message || "Unable to load scan information.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [labSlip.id]);

  if (loading) {
    return (
      <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
        <p className="text-sm text-[var(--cera-text-muted)]">
          Loading scan information...
        </p>
      </section>
    );
  }

  if (existingBooking) {
    return (
      <section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-6">
        <p className="text-sm font-medium text-sky-700">Patient scanning</p>

        <h2 className="mt-1 text-lg font-semibold text-[var(--cera-navy-950)]">
          {existingBooking.reference}
        </h2>

        <p className="mt-2 text-sm text-[var(--cera-text-muted)]">
          A scan booking already exists for this case.
        </p>

        <Link
          to={`/portal/scans/${existingBooking.id}`}
          className="mt-4 inline-flex text-sm font-semibold text-[var(--cera-blue-600)]"
        >
          View scan booking →
        </Link>
      </section>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!requestedStartAt) {
      setError("Choose a preferred scan date and time.");

      return;
    }

    const date = new Date(requestedStartAt);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      setError("Choose a future scan date and time.");

      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await createScanBooking({
        labSlipId: labSlip.id,

        requestedStartAt: date.toISOString(),
      });

      setExistingBooking(response.data.scanBooking);
    } catch (requestError) {
      setError(requestError.message || "Unable to request patient scanning.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
      <p className="text-sm font-medium text-[var(--cera-blue-600)]">
        Patient scanning
      </p>

      <h2 className="mt-1 text-lg font-semibold text-[var(--cera-navy-950)]">
        Request Cera scanning
      </h2>

      {!labSlip.scanRequired && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cera-text-muted)]">
          Scanning was not selected when this Lab Slip was submitted. You can
          still request a Cera scanning visit now.
        </p>
      )}

      {labSlip.scanRequired && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cera-text-muted)]">
          Choose your preferred visit time. Cera will review the request and
          either confirm it or suggest another time.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-5">
        <label
          htmlFor="requested-scan-time"
          className="mb-2 block text-sm font-medium"
        >
          Preferred date & time
        </label>

        <input
          id="requested-scan-time"
          type="datetime-local"
          value={requestedStartAt}
          onChange={(event) => setRequestedStartAt(event.target.value)}
          className="h-11 w-full max-w-sm rounded-xl border border-[var(--cera-border)] px-4"
        />

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Requesting..." : "Request Scan"}
        </button>
      </form>
    </section>
  );
}
