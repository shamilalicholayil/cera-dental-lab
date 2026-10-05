import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { Link, useParams } from "react-router-dom";

import { SCAN_BOOKING_STATUS, USER_ROLES } from "@cera/shared";

import {
  acceptAlternateScanTime,
  assignScanBooking,
  cancelScanBooking,
  completeScanBooking,
  confirmScanBooking,
  getScanBooking,
  getScanningStaff,
  proposeAlternateScanTime,
  rejectScanBooking,
} from "../api/scanBookings";

import { PortalHeader } from "../components/portal/PortalHeader";

import { selectCurrentUser } from "../features/auth/authSelectors";

import { SCAN_BOOKING_STATUS_LABELS } from "../constants/scanBookingDisplay";

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function ScanBookingDetailPage() {
  const { bookingId } = useParams();

  const user = useSelector(selectCurrentUser);

  const [booking, setBooking] = useState(null);

  const [scanningStaff, setScanningStaff] = useState([]);

  const [alternateTime, setAlternateTime] = useState("");

  const [rejectionReason, setRejectionReason] = useState("");

  const [cancellationReason, setCancellationReason] = useState("");

  const [scanningStaffId, setScanningStaffId] = useState("");

  const [loading, setLoading] = useState(true);

  const [actionBusy, setActionBusy] = useState(false);

  const [error, setError] = useState(null);

  const ceraOperations = [
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
  ].includes(user?.role);

  const doctorOrClinic = [USER_ROLES.DOCTOR, USER_ROLES.CLINIC_STAFF].includes(
    user?.role,
  );

  const scanner = user?.role === USER_ROLES.SCANNING_STAFF;

  useEffect(() => {
    let cancelled = false;

    const requests = [getScanBooking(bookingId)];

    if (ceraOperations) {
      requests.push(getScanningStaff());
    }

    Promise.all(requests)
      .then((responses) => {
        if (cancelled) {
          return;
        }

        setBooking(responses[0].data.scanBooking);

        if (ceraOperations && responses[1]) {
          setScanningStaff(responses[1].data.scanningStaff);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load scan booking.");
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
  }, [bookingId, ceraOperations]);

  async function runAction(action) {
    try {
      setActionBusy(true);
      setError(null);

      const response = await action();

      setBooking(response.data.scanBooking);
    } catch (requestError) {
      setError(requestError.message || "Unable to update the scan booking.");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="p-10 text-center">Loading...</div>
      </main>
    );
  }

  if (error && !booking) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="mx-auto max-w-5xl p-6">
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link
          to="/portal/scans"
          className="text-sm font-semibold text-[var(--cera-blue-600)]"
        >
          ← Scan Bookings
        </Link>

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-sm text-[var(--cera-text-muted)]">
                Patient Scan
              </p>

              <h1 className="mt-1 text-3xl font-semibold text-[var(--cera-navy-950)]">
                {booking.reference}
              </h1>

              <span className="mt-3 inline-flex rounded-full border border-[var(--cera-border)] bg-slate-50 px-3 py-1 text-xs font-medium">
                {SCAN_BOOKING_STATUS_LABELS[booking.status]}
              </span>
            </div>

            <div className="text-sm text-[var(--cera-text-muted)]">
              {booking.labSlip.reference}
            </div>
          </div>

          <div className="mt-7 grid gap-5 border-t border-[var(--cera-border)] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-[var(--cera-text-muted)]">
                Patient
              </p>

              <p className="mt-1 font-medium">{booking.labSlip.patient.name}</p>
            </div>

            <div>
              <p className="text-xs uppercase text-[var(--cera-text-muted)]">
                Clinic
              </p>

              <p className="mt-1 font-medium">{booking.clinic.name}</p>
            </div>

            {!scanner && (
              <div>
                <p className="text-xs uppercase text-[var(--cera-text-muted)]">
                  Doctor
                </p>

                <p className="mt-1 font-medium">{booking.doctor?.name}</p>
              </div>
            )}

            <div>
              <p className="text-xs uppercase text-[var(--cera-text-muted)]">
                Priority
              </p>

              <p className="mt-1 font-medium">{booking.urgency}</p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 border-t border-[var(--cera-border)] pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">Requested</p>

              <p className="mt-1 font-medium">
                {formatDateTime(booking.requestedStartAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">Proposed</p>

              <p className="mt-1 font-medium">
                {formatDateTime(booking.proposedStartAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">Confirmed</p>

              <p className="mt-1 font-medium">
                {formatDateTime(booking.confirmedStartAt)}
              </p>
            </div>
          </div>

          {booking.assignedScanningStaff && (
            <div className="mt-6 border-t border-[var(--cera-border)] pt-5">
              <p className="text-xs text-[var(--cera-text-muted)]">
                Assigned scanning staff
              </p>

              <p className="mt-1 font-medium">
                {booking.assignedScanningStaff.name}
              </p>
            </div>
          )}
        </section>

        {error && booking && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {ceraOperations &&
          booking.status === SCAN_BOOKING_STATUS.PENDING_REVIEW && (
            <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
              <h2 className="text-lg font-semibold">Review request</h2>

              <button
                type="button"
                disabled={actionBusy}
                onClick={() => runAction(() => confirmScanBooking(booking.id))}
                className="mt-5 h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white"
              >
                Confirm requested time
              </button>
            </section>
          )}

        {ceraOperations &&
          [
            SCAN_BOOKING_STATUS.PENDING_REVIEW,
            SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,
          ].includes(booking.status) && (
            <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
              <h2 className="text-lg font-semibold">Propose another time</h2>

              <input
                type="datetime-local"
                aria-label="Alternate scan time"
                value={alternateTime}
                onChange={(event) => setAlternateTime(event.target.value)}
                className="mt-4 h-11 w-full max-w-sm rounded-xl border border-[var(--cera-border)] px-4"
              />

              <button
                type="button"
                disabled={actionBusy || !alternateTime}
                onClick={() =>
                  runAction(() =>
                    proposeAlternateScanTime(
                      booking.id,
                      new Date(alternateTime).toISOString(),
                    ),
                  )
                }
                className="mt-4 h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-semibold"
              >
                Propose time
              </button>
            </section>
          )}

        {doctorOrClinic &&
          booking.status === SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION && (
            <section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold">
                Cera proposed another time
              </h2>

              <p className="mt-2 font-medium">
                {formatDateTime(booking.proposedStartAt)}
              </p>

              <button
                type="button"
                disabled={actionBusy}
                onClick={() =>
                  runAction(() => acceptAlternateScanTime(booking.id))
                }
                className="mt-5 h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white"
              >
                Accept proposed time
              </button>
            </section>
          )}

        {ceraOperations && booking.status === SCAN_BOOKING_STATUS.CONFIRMED && (
          <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
            <h2 className="text-lg font-semibold">Assign scanning staff</h2>

            <select
              aria-label="Scanning staff"
              value={scanningStaffId}
              onChange={(event) => setScanningStaffId(event.target.value)}
              className="mt-4 h-11 w-full max-w-sm rounded-xl border border-[var(--cera-border)] bg-white px-4"
            >
              <option value="">Select scanning staff</option>

              {scanningStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={actionBusy || !scanningStaffId}
              onClick={() =>
                runAction(() => assignScanBooking(booking.id, scanningStaffId))
              }
              className="mt-4 h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white"
            >
              Assign
            </button>
          </section>
        )}

        {(scanner || ceraOperations) &&
          booking.status === SCAN_BOOKING_STATUS.ASSIGNED && (
            <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
              <h2 className="text-lg font-semibold">Scan visit</h2>

              <button
                type="button"
                disabled={actionBusy}
                onClick={() => runAction(() => completeScanBooking(booking.id))}
                className="mt-5 h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white"
              >
                Mark scan completed
              </button>
            </section>
          )}

        {ceraOperations &&
          [
            SCAN_BOOKING_STATUS.PENDING_REVIEW,
            SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,
          ].includes(booking.status) && (
            <section className="mt-5 rounded-2xl border border-red-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Reject request</h2>

              <textarea
                aria-label="Rejection reason"
                rows={3}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                className="mt-4 w-full rounded-xl border border-[var(--cera-border)] p-4"
              />

              <button
                type="button"
                disabled={actionBusy || !rejectionReason.trim()}
                onClick={() =>
                  runAction(() =>
                    rejectScanBooking(booking.id, rejectionReason.trim()),
                  )
                }
                className="mt-4 h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white"
              >
                Reject request
              </button>
            </section>
          )}

        {(ceraOperations || doctorOrClinic) &&
          ![
            SCAN_BOOKING_STATUS.COMPLETED,
            SCAN_BOOKING_STATUS.REJECTED,
            SCAN_BOOKING_STATUS.CANCELLED,
          ].includes(booking.status) &&
          !(
            doctorOrClinic && booking.status === SCAN_BOOKING_STATUS.ASSIGNED
          ) && (
            <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
              <h2 className="text-lg font-semibold">Cancel booking</h2>

              <textarea
                aria-label="Cancellation reason"
                rows={3}
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Optional reason"
                className="mt-4 w-full rounded-xl border border-[var(--cera-border)] p-4"
              />

              <button
                type="button"
                disabled={actionBusy}
                onClick={() =>
                  runAction(() =>
                    cancelScanBooking(booking.id, cancellationReason),
                  )
                }
                className="mt-4 h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600"
              >
                Cancel booking
              </button>
            </section>
          )}
      </div>
    </main>
  );
}
