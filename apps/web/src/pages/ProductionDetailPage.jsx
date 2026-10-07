import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { Link, useParams } from "react-router-dom";

import { PRODUCTION_STATUS, USER_ROLES } from "@cera/shared";

import {
  completeProduction,
  getProduction,
  moveProductionBack,
  startProduction,
} from "../api/productions";

import { PortalHeader } from "../components/portal/PortalHeader";

import { PRODUCTION_STATUS_LABELS } from "../constants/productionDisplay";

import { selectCurrentUser } from "../features/auth/authSelectors";

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function StatusBadge({ status }) {
  return (
    <span className="inline-flex rounded-full border border-[var(--cera-border)] bg-slate-50 px-3 py-1 text-xs font-medium text-[var(--cera-navy-950)]">
      {PRODUCTION_STATUS_LABELS[status] || status}
    </span>
  );
}

function actorName(actor) {
  if (!actor) {
    return "Unknown user";
  }

  return actor.name || actor.id || "Unknown user";
}

export function ProductionDetailPage() {
  const { productionId } = useParams();

  const user = useSelector(selectCurrentUser);

  const [production, setProduction] = useState(null);

  const [startNote, setStartNote] = useState("");

  const [completionNote, setCompletionNote] = useState("");

  const [backwardReason, setBackwardReason] = useState("");

  const [loading, setLoading] = useState(true);

  const [actionBusy, setActionBusy] = useState(false);

  const [error, setError] = useState(null);

  const isAdmin = user?.role === USER_ROLES.CERA_ADMIN;

  useEffect(() => {
    let cancelled = false;

    getProduction(productionId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setProduction(response.data.production);

        setError(null);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load production case.");
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
  }, [productionId]);

  async function runAction(action, onSuccess) {
    try {
      setActionBusy(true);

      setError(null);

      const response = await action();

      setProduction(response.data.production);

      onSuccess?.();
    } catch (requestError) {
      setError(requestError.message || "Unable to update production.");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="p-10 text-center text-sm text-[var(--cera-text-muted)]">
          Loading production case...
        </div>
      </main>
    );
  }

  if (error && !production) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="mx-auto max-w-5xl p-6">
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        </div>
      </main>
    );
  }

  const backwardTarget =
    production.status === PRODUCTION_STATUS.COMPLETED
      ? PRODUCTION_STATUS.IN_PRODUCTION
      : production.status === PRODUCTION_STATUS.IN_PRODUCTION
        ? PRODUCTION_STATUS.SUBMITTED
        : null;

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link
          to="/portal/production"
          className="text-sm font-semibold text-[var(--cera-blue-600)]"
        >
          ← Production Queue
        </Link>

        {/* =========================================================
            1. CASE SUMMARY
        ========================================================= */}

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm text-[var(--cera-text-muted)]">
                Lab production
              </p>

              <h1 className="mt-1 text-3xl font-semibold text-[var(--cera-navy-950)]">
                {production.labSlip.reference}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={production.status} />

                {production.labSlip.urgency === "URGENT" && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    Urgent
                  </span>
                )}

                {production.labSlip.scanRequired && (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Scan required
                  </span>
                )}
              </div>
            </div>

            <Link
              to={`/portal/lab-slips/${production.labSlip.id}`}
              className="text-sm font-semibold text-[var(--cera-blue-600)]"
            >
              View Lab Slip →
            </Link>
          </div>

          <div className="mt-7 grid gap-5 border-t border-[var(--cera-border)] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-[var(--cera-text-muted)]">
                Patient
              </p>

              <p className="mt-1 font-medium">
                {production.labSlip.patient.name}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-[var(--cera-text-muted)]">
                Patient reference
              </p>

              <p className="mt-1 font-medium">
                {production.labSlip.patient.reference || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-[var(--cera-text-muted)]">
                Priority
              </p>

              <p className="mt-1 font-medium">{production.labSlip.urgency}</p>
            </div>

            <div>
              <p className="text-xs uppercase text-[var(--cera-text-muted)]">
                Submitted
              </p>

              <p className="mt-1 font-medium">
                {formatDateTime(production.labSlip.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 border-t border-[var(--cera-border)] pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">
                Production started
              </p>

              <p className="mt-1 font-medium">
                {formatDateTime(production.startedAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">
                Production completed
              </p>

              <p className="mt-1 font-medium">
                {formatDateTime(production.completedAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">
                Last updated
              </p>

              <p className="mt-1 font-medium">
                {formatDateTime(production.updatedAt)}
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. ACTION ERROR
        ========================================================= */}

        {error && production && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* =========================================================
            3. START PRODUCTION
        ========================================================= */}

        {production.status === PRODUCTION_STATUS.SUBMITTED && (
          <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
            <h2 className="text-lg font-semibold">Start production</h2>

            {production.labSlip.scanRequired && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                This case requires a scan. Production can start only after the
                related scan has been completed.
              </div>
            )}

            <label
              htmlFor="production-start-note"
              className="mt-5 block text-sm font-medium"
            >
              Note
              <span className="ml-1 font-normal text-[var(--cera-text-muted)]">
                optional
              </span>
            </label>

            <textarea
              id="production-start-note"
              rows={3}
              maxLength={500}
              value={startNote}
              onChange={(event) => setStartNote(event.target.value)}
              placeholder="Optional production note"
              className="mt-2 w-full rounded-xl border border-[var(--cera-border)] p-4"
            />

            <button
              type="button"
              disabled={actionBusy}
              onClick={() =>
                runAction(
                  () => startProduction(production.id, startNote.trim()),
                  () => setStartNote(""),
                )
              }
              className="mt-4 h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Production
            </button>
          </section>
        )}

        {/* =========================================================
            4. COMPLETE PRODUCTION
        ========================================================= */}

        {production.status === PRODUCTION_STATUS.IN_PRODUCTION && (
          <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
            <h2 className="text-lg font-semibold">Complete production</h2>

            <p className="mt-2 text-sm text-[var(--cera-text-muted)]">
              Mark this case completed only after fabrication and the final
              internal check are finished.
            </p>

            <label
              htmlFor="production-completion-note"
              className="mt-5 block text-sm font-medium"
            >
              Note
              <span className="ml-1 font-normal text-[var(--cera-text-muted)]">
                optional
              </span>
            </label>

            <textarea
              id="production-completion-note"
              rows={3}
              maxLength={500}
              value={completionNote}
              onChange={(event) => setCompletionNote(event.target.value)}
              placeholder="Optional completion note"
              className="mt-2 w-full rounded-xl border border-[var(--cera-border)] p-4"
            />

            <button
              type="button"
              disabled={actionBusy}
              onClick={() =>
                runAction(
                  () =>
                    completeProduction(production.id, completionNote.trim()),
                  () => setCompletionNote(""),
                )
              }
              className="mt-4 h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark Production Completed
            </button>
          </section>
        )}

        {/* =========================================================
            5. ADMIN BACKWARD TRANSITION
        ========================================================= */}

        {isAdmin && backwardTarget && (
          <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold">Admin status correction</h2>

            <p className="mt-2 text-sm text-[var(--cera-text-muted)]">
              {production.status === PRODUCTION_STATUS.COMPLETED
                ? "Reopen this completed case and return it to production."
                : "Return this production case to the submitted state."}
            </p>

            <label
              htmlFor="production-backward-reason"
              className="mt-5 block text-sm font-medium"
            >
              Reason
            </label>

            <textarea
              id="production-backward-reason"
              rows={3}
              maxLength={500}
              value={backwardReason}
              onChange={(event) => setBackwardReason(event.target.value)}
              placeholder="Explain why the production status is being moved backward"
              className="mt-2 w-full rounded-xl border border-amber-300 bg-white p-4"
            />

            <button
              type="button"
              disabled={actionBusy || !backwardReason.trim()}
              onClick={() =>
                runAction(
                  () =>
                    moveProductionBack(
                      production.id,
                      backwardTarget,
                      backwardReason.trim(),
                    ),
                  () => setBackwardReason(""),
                )
              }
              className="mt-4 h-11 rounded-xl border border-amber-300 bg-white px-5 text-sm font-semibold text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {production.status === PRODUCTION_STATUS.COMPLETED
                ? "Move Back to In Production"
                : "Move Back to Submitted"}
            </button>
          </section>
        )}

        {/* =========================================================
            6. HISTORY
        ========================================================= */}

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
          <h2 className="text-lg font-semibold">Production history</h2>

          {!production.history?.length ? (
            <p className="mt-4 text-sm text-[var(--cera-text-muted)]">
              No production status changes have been recorded yet.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {[...production.history].reverse().map((entry, index) => (
                <div
                  key={`${entry.changedAt}-${index}`}
                  className="rounded-xl border border-[var(--cera-border)] p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-medium text-[var(--cera-navy-950)]">
                        {PRODUCTION_STATUS_LABELS[entry.previousStatus] ||
                          entry.previousStatus}
                        {" → "}
                        {PRODUCTION_STATUS_LABELS[entry.newStatus] ||
                          entry.newStatus}
                      </p>

                      <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                        By {actorName(entry.changedBy)}
                      </p>
                    </div>

                    <p className="text-sm text-[var(--cera-text-muted)]">
                      {formatDateTime(entry.changedAt)}
                    </p>
                  </div>

                  {entry.note && (
                    <div className="mt-4 border-t border-[var(--cera-border)] pt-3">
                      <p className="text-xs text-[var(--cera-text-muted)]">
                        Note / reason
                      </p>

                      <p className="mt-1 text-sm">{entry.note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
