import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { CORRECTION_STATUS } from "@cera/shared";

import { getCorrections } from "../api/corrections";

import { PortalHeader } from "../components/portal/PortalHeader";

import {
  CORRECTION_OUTCOME_LABELS,
  CORRECTION_STATUS_LABELS,
} from "../constants/correctionDisplay";

function StatusBadge({ status }) {
  const styles = {
    [CORRECTION_STATUS.OPEN]: "border-blue-200 bg-blue-50 text-blue-700",

    [CORRECTION_STATUS.UNDER_REVIEW]:
      "border-amber-200 bg-amber-50 text-amber-700",

    [CORRECTION_STATUS.AWAITING_CLARIFICATION]:
      "border-orange-200 bg-orange-50 text-orange-700",

    [CORRECTION_STATUS.RESOLVED]:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    [CORRECTION_STATUS.REJECTED]: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "border-[var(--cera-border)] bg-slate-50 text-[var(--cera-navy-950)]"
      }`}
    >
      {CORRECTION_STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function CorrectionsPage() {
  const [corrections, setCorrections] = useState([]);

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

    getCorrections({
      status,
      page,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        setCorrections(response.data.corrections);

        setPagination(response.data.pagination);

        setError(null);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load corrections.");
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

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div>
          <p className="text-sm font-medium text-[var(--cera-blue-600)]">
            Finished case support
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-[var(--cera-navy-950)]">
            Corrections
          </h1>

          <p className="mt-2 max-w-2xl text-[var(--cera-text-muted)]">
            Review issues raised for completed lab cases and follow their
            progress.
          </p>
        </div>

        <div className="mt-6">
          <label
            htmlFor="correction-status"
            className="mb-2 block text-sm font-medium"
          >
            Status
          </label>

          <select
            id="correction-status"
            value={status}
            onChange={(event) => {
              setLoading(true);
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full max-w-xs rounded-xl border border-[var(--cera-border)] bg-white px-4"
          >
            <option value="">All statuses</option>

            {Object.values(CORRECTION_STATUS).map((value) => (
              <option key={value} value={value}>
                {CORRECTION_STATUS_LABELS[value]}
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
              Loading corrections...
            </div>
          ) : corrections.length === 0 ? (
            <div className="rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center">
              <p className="font-medium text-[var(--cera-navy-950)]">
                No corrections found
              </p>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                There are no corrections matching this status.
              </p>
            </div>
          ) : (
            corrections.map((correction) => (
              <Link
                key={correction.id}
                to={`/portal/corrections/${correction.id}`}
                className="block rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-[var(--cera-navy-950)]">
                        {correction.labSlip?.reference || "Lab Slip"}
                      </p>

                      <StatusBadge status={correction.status} />

                      {correction.labSlip?.urgency === "URGENT" && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Urgent
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-medium text-[var(--cera-navy-950)]">
                      {correction.labSlip?.patient?.name || "Patient"}
                    </p>

                    {correction.labSlip?.patient?.reference && (
                      <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                        Patient ref: {correction.labSlip.patient.reference}
                      </p>
                    )}

                    <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-[var(--cera-text-muted)]">
                      {correction.description}
                    </p>

                    {correction.outcome && (
                      <p className="mt-3 text-sm">
                        <span className="text-[var(--cera-text-muted)]">
                          Outcome:{" "}
                        </span>

                        <span className="font-medium text-[var(--cera-navy-950)]">
                          {CORRECTION_OUTCOME_LABELS[correction.outcome] ||
                            correction.outcome}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-sm text-[var(--cera-text-muted)] sm:text-right">
                    <p>Last updated</p>

                    <p className="mt-1 font-medium text-[var(--cera-navy-950)]">
                      {formatDateTime(correction.updatedAt)}
                    </p>

                    {correction.createdBy?.name && (
                      <p className="mt-2">
                        Raised by {correction.createdBy.name}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {!loading && pagination.pages > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--cera-text-muted)]">
              Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
              total
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current - 1);
                }}
                className="h-10 rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
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
                className="h-10 rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
