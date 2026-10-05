import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import { getLabSlip } from "../api/labSlips";

import { PortalHeader } from "../components/portal/PortalHeader";

import { ScanRequestPanel } from "../components/scanBookings/ScanRequestPanel";

export function LabSlipDetailPage() {
  const { labSlipId } = useParams();

  const [slip, setSlip] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getLabSlip(labSlipId)
      .then((response) => {
        if (!cancelled) {
          setSlip(response.data.labSlip);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load lab slip.");
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
  }, [labSlipId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="p-10 text-center">Loading...</div>
      </main>
    );
  }

  if (error || !slip) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="mx-auto max-w-4xl px-5 py-10">
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error || "Lab slip not found."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/portal/lab-slips"
            className="text-sm font-medium text-[var(--cera-blue-600)]"
          >
            ← Lab Slips
          </Link>

          {slip.status === "SUBMITTED" && (
            <Link
              to={`/portal/lab-slips/${slip.id}/edit`}
              className="inline-flex h-10 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-semibold text-[var(--cera-navy-950)]"
            >
              Edit Lab Slip
            </Link>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-sm text-[var(--cera-text-muted)]">
                Digital Lab Slip
              </p>

              <h1 className="mt-1 text-3xl font-semibold text-[var(--cera-navy-950)]">
                {slip.reference}
              </h1>
            </div>

            <div className="text-sm text-[var(--cera-text-muted)]">
              {new Date(slip.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="mt-7 grid gap-5 border-t border-[var(--cera-border)] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                Patient
              </p>

              <p className="mt-1 font-medium">{slip.patient.name}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                Clinic
              </p>

              <p className="mt-1 font-medium">{slip.clinic.name}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                Doctor
              </p>

              <p className="mt-1 font-medium">{slip.doctor.name}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                Source
              </p>

              <p className="mt-1 font-medium">{slip.source}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {slip.items.map((item, index) => (
            <section
              key={item.id}
              className="rounded-2xl border border-[var(--cera-border)] bg-white p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cera-blue-600)]">
                Product {index + 1}
              </p>

              <h2 className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]">
                {item.productName}
              </h2>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                {item.categoryName}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[var(--cera-text-muted)]">Teeth</p>

                  <p className="mt-1 font-medium">
                    {item.teeth.length ? item.teeth.join(", ") : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--cera-text-muted)]">Shade</p>

                  <p className="mt-1 font-medium">{item.shade || "—"}</p>
                </div>

                <div>
                  <p className="text-xs text-[var(--cera-text-muted)]">
                    Pontic / design
                  </p>

                  <p className="mt-1 font-medium">{item.ponticDesign || "—"}</p>
                </div>
              </div>

              {item.designNotes && (
                <p className="mt-5 text-sm leading-6 text-[var(--cera-text-muted)]">
                  {item.designNotes}
                </p>
              )}
            </section>
          ))}
        </div>

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">Priority</p>

              <p className="mt-1 font-medium">{slip.urgency}</p>
            </div>

            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">Scan</p>

              <p className="mt-1 font-medium">
                {slip.scanRequired ? "Required" : "Not required"}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--cera-text-muted)]">Status</p>

              <p className="mt-1 font-medium">{slip.status}</p>
            </div>
          </div>

          {slip.notes && (
            <div className="mt-6 border-t border-[var(--cera-border)] pt-5">
              <p className="text-sm font-medium">Notes</p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--cera-text-muted)]">
                {slip.notes}
              </p>
            </div>
          )}

          <ScanRequestPanel labSlip={slip} />
        </section>
      </div>
    </main>
  );
}
