import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { LAB_SLIP_URGENCY } from "@cera/shared";

import { getLabSlips } from "../api/labSlips";

import { PortalHeader } from "../components/portal/PortalHeader";

export function LabSlipsPage() {
  const [labSlips, setLabSlips] = useState([]);

  const [searchInput, setSearchInput] = useState("");

  const [query, setQuery] = useState({
    search: "",
    page: 1,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getLabSlips(query)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setLabSlips(response.data.labSlips);

        setPagination(response.data.pagination);

        setError(null);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load lab slips.");
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
  }, [query]);

  function search(event) {
    event.preventDefault();

    setLoading(true);

    setQuery({
      search: searchInput.trim(),

      page: 1,
    });
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              Lab work
            </p>

            <h1 className="mt-1 text-3xl font-semibold text-[var(--cera-navy-950)]">
              Lab Slips
            </h1>
          </div>

          <Link
            to="/portal/lab-slips/new"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white"
          >
            + New Lab Slip
          </Link>
        </div>

        <form
          onSubmit={search}
          className="mt-7 flex gap-3 rounded-2xl border border-[var(--cera-border)] bg-white p-4"
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search reference or patient"
            className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--cera-border)] px-4"
          />

          <button
            type="submit"
            className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
          >
            Search
          </button>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white">
          {loading ? (
            <div className="p-10 text-center text-sm text-[var(--cera-text-muted)]">
              Loading lab slips...
            </div>
          ) : labSlips.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-[var(--cera-navy-950)]">
                No lab slips found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--cera-border)]">
              {labSlips.map((slip) => (
                <Link
                  key={slip.id}
                  to={`/portal/lab-slips/${slip.id}`}
                  className="block p-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-[var(--cera-navy-950)]">
                          {slip.reference}
                        </p>

                        {slip.urgency === LAB_SLIP_URGENCY.URGENT && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Urgent
                          </span>
                        )}

                        {slip.scanRequired && (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                            Scan required
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-medium">
                        {slip.patient.name}
                      </p>

                      <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                        {slip.clinic.name}
                        {" · "}
                        {slip.doctor.name}
                      </p>
                    </div>

                    <div className="text-sm text-[var(--cera-text-muted)]">
                      {new Date(slip.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => {
                setLoading(true);

                setQuery((current) => ({
                  ...current,

                  page: current.page - 1,
                }));
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

                setQuery((current) => ({
                  ...current,

                  page: current.page + 1,
                }));
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
