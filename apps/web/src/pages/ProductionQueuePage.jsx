import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { PRODUCTION_STATUS } from "@cera/shared";

import { getProductions } from "../api/productions";

import { PortalHeader } from "../components/portal/PortalHeader";

import { PRODUCTION_STATUS_LABELS } from "../constants/productionDisplay";

function StatusBadge({ status }) {
  return (
    <span className="rounded-full border border-[var(--cera-border)] bg-slate-50 px-2.5 py-1 text-xs font-medium text-[var(--cera-navy-950)]">
      {PRODUCTION_STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function getTimingLabel(production) {
  if (production.status === PRODUCTION_STATUS.COMPLETED) {
    return {
      label: "Completed",
      value: production.completedAt,
    };
  }

  if (production.status === PRODUCTION_STATUS.IN_PRODUCTION) {
    return {
      label: "Started",
      value: production.startedAt,
    };
  }

  return {
    label: "Submitted",
    value: production.labSlip.createdAt,
  };
}

export function ProductionQueuePage() {
  const [productions, setProductions] = useState([]);

  /*
   * Empty status means:
   * backend default = active work only
   * SUBMITTED + IN_PRODUCTION.
   */
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

    getProductions({
      status,
      page,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        setProductions(response.data.productions);

        setPagination(response.data.pagination);

        setError(null);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.message || "Unable to load the production queue.",
          );
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
            Lab operations
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-[var(--cera-navy-950)]">
            Production Queue
          </h1>

          <p className="mt-2 max-w-2xl text-[var(--cera-text-muted)]">
            Review active manufacturing cases and track their production
            progress.
          </p>
        </div>

        <div className="mt-6">
          <label
            htmlFor="production-status"
            className="mb-2 block text-sm font-medium"
          >
            Status
          </label>

          <select
            id="production-status"
            value={status}
            onChange={(event) => {
              setLoading(true);

              setStatus(event.target.value);

              setPage(1);
            }}
            className="h-11 w-full max-w-xs rounded-xl border border-[var(--cera-border)] bg-white px-4"
          >
            <option value="">Active work</option>

            <option value={PRODUCTION_STATUS.SUBMITTED}>
              {PRODUCTION_STATUS_LABELS[PRODUCTION_STATUS.SUBMITTED]}
            </option>

            <option value={PRODUCTION_STATUS.IN_PRODUCTION}>
              {PRODUCTION_STATUS_LABELS[PRODUCTION_STATUS.IN_PRODUCTION]}
            </option>

            <option value={PRODUCTION_STATUS.COMPLETED}>
              {PRODUCTION_STATUS_LABELS[PRODUCTION_STATUS.COMPLETED]}
            </option>

            <option value="ALL">All statuses</option>
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
              Loading production queue...
            </div>
          ) : productions.length === 0 ? (
            <div className="rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center">
              <p className="font-medium text-[var(--cera-navy-950)]">
                No production cases found
              </p>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                There are no cases matching the selected production status.
              </p>
            </div>
          ) : (
            productions.map((production) => {
              const timing = getTimingLabel(production);

              return (
                <Link
                  key={production.id}
                  to={`/portal/production/${production.id}`}
                  className="block rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-[var(--cera-navy-950)]">
                          {production.labSlip.reference}
                        </p>

                        <StatusBadge status={production.status} />

                        {production.labSlip.urgency === "URGENT" && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Urgent
                          </span>
                        )}

                        {production.labSlip.scanRequired && (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            Scan required
                          </span>
                        )}
                      </div>

                      <p className="mt-3 font-medium text-[var(--cera-navy-950)]">
                        {production.labSlip.patient.name}
                      </p>

                      {production.labSlip.patient.reference && (
                        <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                          Patient ref: {production.labSlip.patient.reference}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-sm text-[var(--cera-text-muted)] sm:text-right">
                      <p>{timing.label}</p>

                      <p className="mt-1 font-medium text-[var(--cera-navy-950)]">
                        {formatDateTime(timing.value)}
                      </p>

                      <p className="mt-3">Last updated</p>

                      <p className="mt-1 text-[var(--cera-navy-950)]">
                        {formatDateTime(production.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-[var(--cera-text-muted)]">
              {pagination.total} production{" "}
              {pagination.total === 1 ? "case" : "cases"}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => {
                  setLoading(true);

                  setPage((current) => current - 1);
                }}
                className="h-10 rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
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
                className="h-10 rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
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
