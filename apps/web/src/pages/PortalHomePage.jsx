import { useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { Link } from "react-router-dom";

import {
  CORRECTION_STATUS,
  LAB_SLIP_URGENCY,
  SCAN_BOOKING_STATUS,
  USER_ROLES,
} from "@cera/shared";

import { getCorrections } from "../api/corrections";

import { getLabSlips } from "../api/labSlips";

import { getScanBookings } from "../api/scanBookings";

import { getProductions } from "../api/productions";

import { PortalHeader } from "../components/portal/PortalHeader";

import { selectCurrentUser } from "../features/auth/authSelectors";

const LAB_SLIP_ROLES = [
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
];

const SCAN_ROLES = [
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
  USER_ROLES.SCANNING_STAFF,
];

const PRODUCTION_ROLES = [USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF];

const CORRECTION_ROLES = [
  USER_ROLES.CERA_ADMIN,
  USER_ROLES.CERA_STAFF,
  USER_ROLES.DOCTOR,
  USER_ROLES.CLINIC_STAFF,
];

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function getTodayRange() {
  const start = new Date();

  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  end.setDate(end.getDate() + 1);

  return {
    confirmedFrom: start.toISOString(),
    confirmedTo: end.toISOString(),
  };
}

function formatStatusLabel(value) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DoctorDashboard({ user }) {
  const [recentLabSlips, setRecentLabSlips] = useState([]);

  const [scanConfirmations, setScanConfirmations] = useState([]);

  const [confirmedScans, setConfirmedScans] = useState([]);

  const [assignedScans, setAssignedScans] = useState([]);

  const [clarifications, setClarifications] = useState([]);

  const [attentionCount, setAttentionCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [dashboardLoadedAt, setDashboardLoadedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const [
          labSlipResponse,
          confirmationResponse,
          confirmedResponse,
          assignedResponse,
          clarificationResponse,
        ] = await Promise.all([
          getLabSlips({
            page: 1,
            limit: 5,
          }),

          getScanBookings({
            status: SCAN_BOOKING_STATUS.AWAITING_CONFIRMATION,
            page: 1,
            limit: 5,
          }),

          getScanBookings({
            status: SCAN_BOOKING_STATUS.CONFIRMED,
            page: 1,
            limit: 5,
          }),

          getScanBookings({
            status: SCAN_BOOKING_STATUS.ASSIGNED,
            page: 1,
            limit: 5,
          }),

          getCorrections({
            status: CORRECTION_STATUS.AWAITING_CLARIFICATION,
            page: 1,
            limit: 5,
          }),
        ]);

        if (cancelled) {
          return;
        }

        const confirmationBookings =
          confirmationResponse.data.scanBookings || [];

        const confirmedBookings = confirmedResponse.data.scanBookings || [];

        const assignedBookings = assignedResponse.data.scanBookings || [];

        const correctionClarifications =
          clarificationResponse.data.corrections || [];

        setRecentLabSlips(labSlipResponse.data.labSlips || []);

        setScanConfirmations(confirmationBookings);

        setConfirmedScans(confirmedBookings);

        setAssignedScans(assignedBookings);

        setClarifications(correctionClarifications);

        setAttentionCount(
          (confirmationResponse.data.pagination?.total || 0) +
            (clarificationResponse.data.pagination?.total || 0),
        );

        setDashboardLoadedAt(Date.now());

        setError(null);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.message || "Unable to load your dashboard right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingScans = useMemo(() => {
    if (!dashboardLoadedAt) {
      return [];
    }

    return [...confirmedScans, ...assignedScans]
      .filter((booking) => {
        if (!booking.confirmedStartAt) {
          return false;
        }

        return (
          new Date(booking.confirmedStartAt).getTime() >= dashboardLoadedAt
        );
      })
      .sort(
        (first, second) =>
          new Date(first.confirmedStartAt).getTime() -
          new Date(second.confirmedStartAt).getTime(),
      )
      .slice(0, 5);
  }, [assignedScans, confirmedScans, dashboardLoadedAt]);

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-10">
        <section>
          <p className="text-sm font-medium text-[var(--cera-blue-600)]">
            Doctor dashboard
          </p>

          <div className="mt-1 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[var(--cera-navy-950)] sm:text-4xl">
                Welcome, {user.name}
              </h1>

              <p className="mt-2 max-w-xl leading-7 text-[var(--cera-text-muted)]">
                See what needs your attention and keep track of your recent lab
                work.
              </p>
            </div>

            <Link
              to="/portal/lab-slips/new"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--cera-navy-800)]"
            >
              + New Lab Slip
            </Link>
          </div>
        </section>

        <nav
          aria-label="Doctor quick actions"
          className="mt-6 flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            to="/portal/lab-slips"
            className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
          >
            My Slips
          </Link>

          <Link
            to="/portal/scans"
            className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
          >
            Scans
          </Link>

          <Link
            to="/portal/corrections"
            className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
          >
            Corrections
          </Link>
        </nav>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center text-sm text-[var(--cera-text-muted)]">
            Loading your dashboard...
          </div>
        ) : (
          <>
            <section
              aria-labelledby="dashboard-summary"
              className="mt-6 grid gap-3 sm:grid-cols-2"
            >
              <h2 id="dashboard-summary" className="sr-only">
                Dashboard summary
              </h2>

              <a
                href="#needs-attention"
                className="rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
              >
                <p className="text-sm font-medium text-[var(--cera-text-muted)]">
                  Needs your attention
                </p>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-3xl font-semibold text-[var(--cera-navy-950)]">
                    {attentionCount}
                  </p>

                  <span className="text-sm font-medium text-[var(--cera-blue-600)]">
                    Review
                  </span>
                </div>
              </a>

              <a
                href="#upcoming-scans"
                className="rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
              >
                <p className="text-sm font-medium text-[var(--cera-text-muted)]">
                  Upcoming scans
                </p>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-lg font-semibold text-[var(--cera-navy-950)]">
                    View schedule
                  </p>

                  <span
                    aria-hidden="true"
                    className="text-sm font-medium text-[var(--cera-blue-600)]"
                  >
                    ↓
                  </span>
                </div>
              </a>
            </section>

            <section
              id="needs-attention"
              aria-labelledby="needs-attention-heading"
              className="mt-8"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                    Action required
                  </p>

                  <h2
                    id="needs-attention-heading"
                    className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
                  >
                    Needs your attention
                  </h2>
                </div>
              </div>

              {scanConfirmations.length === 0 && clarifications.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
                  <p className="font-medium text-[var(--cera-navy-950)]">
                    You&apos;re all caught up
                  </p>

                  <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                    There are no scan confirmations or correction clarifications
                    waiting for you.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {scanConfirmations.map((booking) => (
                    <Link
                      key={`scan-${booking.id}`}
                      to={`/portal/scans/${booking.id}`}
                      className="block rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                              Scan confirmation
                            </span>

                            <p className="font-semibold text-[var(--cera-navy-950)]">
                              {booking.reference}
                            </p>
                          </div>

                          <p className="mt-2 font-medium text-[var(--cera-navy-950)]">
                            {booking.labSlip?.patient?.name || "Patient"}
                          </p>

                          <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                            Cera has proposed another scan time.
                          </p>
                        </div>

                        <div className="shrink-0 text-sm sm:text-right">
                          <p className="text-[var(--cera-text-muted)]">
                            Proposed
                          </p>

                          <p className="mt-1 font-medium text-[var(--cera-navy-950)]">
                            {formatDateTime(booking.proposedStartAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {clarifications.map((correction) => (
                    <Link
                      key={`correction-${correction.id}`}
                      to={`/portal/corrections/${correction.id}`}
                      className="block rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                              Clarification requested
                            </span>

                            <p className="font-semibold text-[var(--cera-navy-950)]">
                              {correction.labSlip?.reference || "Lab Slip"}
                            </p>
                          </div>

                          <p className="mt-2 font-medium text-[var(--cera-navy-950)]">
                            {correction.labSlip?.patient?.name || "Patient"}
                          </p>

                          <p className="mt-1 line-clamp-1 text-sm text-[var(--cera-text-muted)]">
                            {correction.description}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-medium text-[var(--cera-blue-600)]">
                          Respond →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section
              id="upcoming-scans"
              aria-labelledby="upcoming-scans-heading"
              className="mt-8"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                    Schedule
                  </p>

                  <h2
                    id="upcoming-scans-heading"
                    className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
                  >
                    Upcoming scans
                  </h2>
                </div>

                <Link
                  to="/portal/scans"
                  className="text-sm font-medium text-[var(--cera-blue-600)]"
                >
                  View all
                </Link>
              </div>

              {upcomingScans.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-[var(--cera-border)] bg-white p-6 text-sm text-[var(--cera-text-muted)]">
                  No upcoming scans scheduled.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {upcomingScans.map((booking) => (
                    <Link
                      key={booking.id}
                      to={`/portal/scans/${booking.id}`}
                      className="block rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--cera-navy-950)]">
                              {booking.reference}
                            </p>

                            {booking.status ===
                              SCAN_BOOKING_STATUS.ASSIGNED && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                Scanner assigned
                              </span>
                            )}
                          </div>

                          <p className="mt-2 font-medium text-[var(--cera-navy-950)]">
                            {booking.labSlip?.patient?.name || "Patient"}
                          </p>

                          <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                            {booking.clinic?.name || "Clinic"}
                          </p>
                        </div>

                        <div className="shrink-0 text-sm sm:text-right">
                          <p className="text-[var(--cera-text-muted)]">
                            Confirmed
                          </p>

                          <p className="mt-1 font-medium text-[var(--cera-navy-950)]">
                            {formatDateTime(booking.confirmedStartAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section
              aria-labelledby="recent-lab-slips-heading"
              className="mt-8"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                    Lab work
                  </p>

                  <h2
                    id="recent-lab-slips-heading"
                    className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
                  >
                    Recent Lab Slips
                  </h2>
                </div>

                <Link
                  to="/portal/lab-slips"
                  className="text-sm font-medium text-[var(--cera-blue-600)]"
                >
                  View all
                </Link>
              </div>

              {recentLabSlips.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-[var(--cera-border)] bg-white p-6">
                  <p className="font-medium text-[var(--cera-navy-950)]">
                    No Lab Slips yet
                  </p>

                  <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                    Create a Lab Slip when you&apos;re ready to send a case to
                    Cera.
                  </p>

                  <Link
                    to="/portal/lab-slips/new"
                    className="mt-4 inline-flex h-10 items-center rounded-xl bg-[var(--cera-navy-900)] px-4 text-sm font-semibold text-white"
                  >
                    New Lab Slip
                  </Link>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white">
                  <div className="divide-y divide-[var(--cera-border)]">
                    {recentLabSlips.map((slip) => (
                      <Link
                        key={slip.id}
                        to={`/portal/lab-slips/${slip.id}`}
                        className="block p-5 transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[var(--cera-navy-950)]">
                                {slip.reference}
                              </p>

                              {slip.urgency === "URGENT" && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                  Urgent
                                </span>
                              )}
                            </div>

                            <p className="mt-2 font-medium text-[var(--cera-navy-950)]">
                              {slip.patient?.name || "Patient"}
                            </p>

                            <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                              {slip.clinic?.name || "Clinic"}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm text-[var(--cera-text-muted)]">
                            {new Date(slip.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function CeraOperationsDashboard({ user }) {
  const isAdmin = user.role === USER_ROLES.CERA_ADMIN;

  const [pendingReviews, setPendingReviews] = useState([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  const [unassignedScans, setUnassignedScans] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);

  const [todayVisits, setTodayVisits] = useState([]);
  const [todayVisitCount, setTodayVisitCount] = useState(0);

  const [activeProduction, setActiveProduction] = useState([]);
  const [activeProductionCount, setActiveProductionCount] = useState(0);

  const [urgentProduction, setUrgentProduction] = useState([]);
  const [urgentProductionCount, setUrgentProductionCount] = useState(0);

  const [activeCorrections, setActiveCorrections] = useState([]);
  const [activeCorrectionCount, setActiveCorrectionCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const { confirmedFrom, confirmedTo } = getTodayRange();

        const [
          pendingResponse,
          unassignedResponse,
          todayConfirmedResponse,
          todayAssignedResponse,
          productionResponse,
          urgentProductionResponse,
          correctionResponse,
        ] = await Promise.all([
          getScanBookings({
            status: SCAN_BOOKING_STATUS.PENDING_REVIEW,
            page: 1,
            limit: 5,
          }),

          getScanBookings({
            status: SCAN_BOOKING_STATUS.CONFIRMED,
            page: 1,
            limit: 5,
          }),

          getScanBookings({
            status: SCAN_BOOKING_STATUS.CONFIRMED,
            confirmedFrom,
            confirmedTo,
            page: 1,
            limit: 5,
          }),

          getScanBookings({
            status: SCAN_BOOKING_STATUS.ASSIGNED,
            confirmedFrom,
            confirmedTo,
            page: 1,
            limit: 5,
          }),

          getProductions({
            page: 1,
            limit: 5,
          }),

          getProductions({
            urgency: LAB_SLIP_URGENCY.URGENT,
            page: 1,
            limit: 5,
          }),

          getCorrections({
            status: "ACTIVE",
            page: 1,
            limit: 5,
          }),
        ]);

        if (cancelled) {
          return;
        }

        const todayConfirmed = todayConfirmedResponse.data.scanBookings || [];

        const todayAssigned = todayAssignedResponse.data.scanBookings || [];

        const mergedTodayVisits = [...todayConfirmed, ...todayAssigned]
          .sort(
            (first, second) =>
              new Date(first.confirmedStartAt).getTime() -
              new Date(second.confirmedStartAt).getTime(),
          )
          .slice(0, 5);

        setPendingReviews(pendingResponse.data.scanBookings || []);

        setPendingReviewCount(pendingResponse.data.pagination?.total || 0);

        setUnassignedScans(unassignedResponse.data.scanBookings || []);

        setUnassignedCount(unassignedResponse.data.pagination?.total || 0);

        setTodayVisits(mergedTodayVisits);

        setTodayVisitCount(
          (todayConfirmedResponse.data.pagination?.total || 0) +
            (todayAssignedResponse.data.pagination?.total || 0),
        );

        setActiveProduction(productionResponse.data.productions || []);

        setActiveProductionCount(
          productionResponse.data.pagination?.total || 0,
        );

        setUrgentProduction(urgentProductionResponse.data.productions || []);

        setUrgentProductionCount(
          urgentProductionResponse.data.pagination?.total || 0,
        );

        setActiveCorrections(correctionResponse.data.corrections || []);

        setActiveCorrectionCount(
          correctionResponse.data.pagination?.total || 0,
        );

        setError(null);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.message ||
              "Unable to load the operations dashboard right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCards = [
    {
      label: "Pending scan reviews",
      count: pendingReviewCount,
      href: "#scan-actions",
      description: "Requests waiting for Cera review",
    },
    {
      label: "Needs assignment",
      count: unassignedCount,
      href: "#scan-actions",
      description: "Confirmed scans without scanning staff",
    },
    {
      label: "Today's visits",
      count: todayVisitCount,
      href: "#today-visits",
      description: "Scheduled scan visits today",
    },
    {
      label: "Active production",
      count: activeProductionCount,
      href: "#production-work",
      description: "Submitted or in-production cases",
    },
    {
      label: "Urgent active cases",
      count: urgentProductionCount,
      href: "#urgent-cases",
      description: "Urgent production needing attention",
    },
    {
      label: "Open corrections",
      count: activeCorrectionCount,
      href: "#open-corrections",
      description: "Unresolved correction tickets",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        <section>
          <p className="text-sm font-medium text-[var(--cera-blue-600)]">
            Cera operations
          </p>

          <div className="mt-1 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[var(--cera-navy-950)] sm:text-4xl">
                Operations dashboard
              </h1>

              <p className="mt-2 max-w-2xl leading-7 text-[var(--cera-text-muted)]">
                Review incoming scan work, today&apos;s visits, production
                priorities, and unresolved corrections.
              </p>
            </div>

            <Link
              to="/portal/lab-slips/new"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--cera-navy-800)]"
            >
              + New Lab Slip
            </Link>
          </div>
        </section>

        <nav
          aria-label="Cera operations quick actions"
          className="mt-6 flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            to="/portal/lab-slips"
            className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
          >
            Lab Slips
          </Link>

          <Link
            to="/portal/scans"
            className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
          >
            Scans
          </Link>

          <Link
            to="/portal/production"
            className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
          >
            Production
          </Link>

          <Link
            to="/portal/corrections"
            className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
          >
            Corrections
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/portal/admin/users"
                className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                People
              </Link>

              <Link
                to="/portal/admin/clinics"
                className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                Clinics
              </Link>

              <Link
                to="/portal/admin/catalog"
                className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-medium text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                Catalogue
              </Link>
            </>
          )}
        </nav>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center text-sm text-[var(--cera-text-muted)]">
            Loading operations...
          </div>
        ) : (
          <>
            <section
              aria-labelledby="operations-summary-heading"
              className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              <h2 id="operations-summary-heading" className="sr-only">
                Operations summary
              </h2>

              {summaryCards.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  className="rounded-2xl border border-[var(--cera-border)] bg-white p-5 transition hover:border-[var(--cera-blue-500)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--cera-navy-950)]">
                        {card.label}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[var(--cera-text-muted)]">
                        {card.description}
                      </p>
                    </div>

                    <p className="text-3xl font-semibold text-[var(--cera-navy-950)]">
                      {card.count}
                    </p>
                  </div>
                </a>
              ))}
            </section>

            <section
              id="scan-actions"
              aria-labelledby="scan-actions-heading"
              className="mt-9"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                    Action required
                  </p>

                  <h2
                    id="scan-actions-heading"
                    className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
                  >
                    Scan actions
                  </h2>
                </div>

                <Link
                  to="/portal/scans"
                  className="text-sm font-medium text-[var(--cera-blue-600)]"
                >
                  View all scans
                </Link>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--cera-border)] bg-white">
                  <div className="border-b border-[var(--cera-border)] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-[var(--cera-navy-950)]">
                        Pending review
                      </h3>

                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        {pendingReviewCount}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                      Requested scan times waiting for Cera.
                    </p>
                  </div>

                  {pendingReviews.length === 0 ? (
                    <p className="p-5 text-sm text-[var(--cera-text-muted)]">
                      No scan requests are waiting for review.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--cera-border)]">
                      {pendingReviews.map((booking) => (
                        <Link
                          key={booking.id}
                          to={`/portal/scans/${booking.id}`}
                          className="block p-5 transition hover:bg-slate-50"
                        >
                          <div className="flex justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--cera-navy-950)]">
                                {booking.reference}
                              </p>

                              <p className="mt-1 truncate text-sm text-[var(--cera-navy-950)]">
                                {booking.labSlip?.patient?.name || "Patient"}
                              </p>

                              <p className="mt-1 truncate text-sm text-[var(--cera-text-muted)]">
                                {booking.clinic?.name || "Clinic"}
                              </p>
                            </div>

                            <div className="shrink-0 text-right text-sm">
                              <p className="text-[var(--cera-text-muted)]">
                                Requested
                              </p>

                              <p className="mt-1 font-medium text-[var(--cera-navy-950)]">
                                {formatDateTime(booking.requestedStartAt)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--cera-border)] bg-white">
                  <div className="border-b border-[var(--cera-border)] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-[var(--cera-navy-950)]">
                        Needs assignment
                      </h3>

                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {unassignedCount}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                      Confirmed visits without scanning staff.
                    </p>
                  </div>

                  {unassignedScans.length === 0 ? (
                    <p className="p-5 text-sm text-[var(--cera-text-muted)]">
                      No confirmed scans are waiting for assignment.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--cera-border)]">
                      {unassignedScans.map((booking) => (
                        <Link
                          key={booking.id}
                          to={`/portal/scans/${booking.id}`}
                          className="block p-5 transition hover:bg-slate-50"
                        >
                          <div className="flex justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--cera-navy-950)]">
                                {booking.reference}
                              </p>

                              <p className="mt-1 truncate text-sm text-[var(--cera-navy-950)]">
                                {booking.labSlip?.patient?.name || "Patient"}
                              </p>

                              <p className="mt-1 truncate text-sm text-[var(--cera-text-muted)]">
                                {booking.clinic?.name || "Clinic"}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-medium text-[var(--cera-blue-600)]">
                              Assign →
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section
              id="today-visits"
              aria-labelledby="today-visits-heading"
              className="mt-9"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                    Schedule
                  </p>

                  <h2
                    id="today-visits-heading"
                    className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
                  >
                    Today&apos;s scan visits
                  </h2>
                </div>

                <Link
                  to="/portal/scans"
                  className="text-sm font-medium text-[var(--cera-blue-600)]"
                >
                  View schedule
                </Link>
              </div>

              {todayVisits.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-[var(--cera-border)] bg-white p-6 text-sm text-[var(--cera-text-muted)]">
                  No confirmed scan visits are scheduled today.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white">
                  <div className="divide-y divide-[var(--cera-border)]">
                    {todayVisits.map((booking) => (
                      <Link
                        key={booking.id}
                        to={`/portal/scans/${booking.id}`}
                        className="grid gap-3 p-5 transition hover:bg-slate-50 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
                      >
                        <div>
                          <p className="font-semibold text-[var(--cera-navy-950)]">
                            {booking.reference}
                          </p>

                          <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                            {booking.labSlip?.patient?.name || "Patient"}
                          </p>
                        </div>

                        <div className="text-sm">
                          <p className="font-medium text-[var(--cera-navy-950)]">
                            {booking.clinic?.name || "Clinic"}
                          </p>

                          <p className="mt-1 text-[var(--cera-text-muted)]">
                            {booking.status === SCAN_BOOKING_STATUS.ASSIGNED
                              ? booking.assignedScanningStaff?.name ||
                                "Scanner assigned"
                              : "Needs assignment"}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-[var(--cera-navy-950)] sm:text-right">
                          {formatDateTime(booking.confirmedStartAt)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section
              id="production-work"
              aria-labelledby="production-work-heading"
              className="mt-9"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                    Lab work
                  </p>

                  <h2
                    id="production-work-heading"
                    className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
                  >
                    Production workload
                  </h2>
                </div>

                <Link
                  to="/portal/production"
                  className="text-sm font-medium text-[var(--cera-blue-600)]"
                >
                  Open production
                </Link>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div
                  id="urgent-cases"
                  className="rounded-2xl border border-amber-200 bg-white"
                >
                  <div className="border-b border-amber-100 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-[var(--cera-navy-950)]">
                        Urgent active cases
                      </h3>

                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {urgentProductionCount}
                      </span>
                    </div>
                  </div>

                  {urgentProduction.length === 0 ? (
                    <p className="p-5 text-sm text-[var(--cera-text-muted)]">
                      No urgent production cases are active.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--cera-border)]">
                      {urgentProduction.map((production) => (
                        <Link
                          key={production.id}
                          to={`/portal/production/${production.id}`}
                          className="block p-5 transition hover:bg-amber-50/40"
                        >
                          <div className="flex justify-between gap-4">
                            <div>
                              <p className="font-semibold text-[var(--cera-navy-950)]">
                                {production.labSlip?.reference || "Lab Slip"}
                              </p>

                              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                                {production.labSlip?.patient?.name || "Patient"}
                              </p>
                            </div>

                            <span className="h-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              {formatStatusLabel(production.status)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--cera-border)] bg-white">
                  <div className="border-b border-[var(--cera-border)] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-[var(--cera-navy-950)]">
                        All active production
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-[var(--cera-navy-950)]">
                        {activeProductionCount}
                      </span>
                    </div>
                  </div>

                  {activeProduction.length === 0 ? (
                    <p className="p-5 text-sm text-[var(--cera-text-muted)]">
                      There is no active production work.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--cera-border)]">
                      {activeProduction.map((production) => (
                        <Link
                          key={production.id}
                          to={`/portal/production/${production.id}`}
                          className="block p-5 transition hover:bg-slate-50"
                        >
                          <div className="flex justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-[var(--cera-navy-950)]">
                                  {production.labSlip?.reference || "Lab Slip"}
                                </p>

                                {production.labSlip?.urgency ===
                                  LAB_SLIP_URGENCY.URGENT && (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    Urgent
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                                {production.labSlip?.patient?.name || "Patient"}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-medium text-[var(--cera-navy-950)]">
                              {formatStatusLabel(production.status)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section
              id="open-corrections"
              aria-labelledby="open-corrections-heading"
              className="mt-9"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                    Follow-up
                  </p>

                  <h2
                    id="open-corrections-heading"
                    className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
                  >
                    Open corrections
                  </h2>
                </div>

                <Link
                  to="/portal/corrections"
                  className="text-sm font-medium text-[var(--cera-blue-600)]"
                >
                  View all corrections
                </Link>
              </div>

              {activeCorrections.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-[var(--cera-border)] bg-white p-6 text-sm text-[var(--cera-text-muted)]">
                  There are no unresolved corrections.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white">
                  <div className="divide-y divide-[var(--cera-border)]">
                    {activeCorrections.map((correction) => (
                      <Link
                        key={correction.id}
                        to={`/portal/corrections/${correction.id}`}
                        className="grid gap-3 p-5 transition hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--cera-navy-950)]">
                              {correction.labSlip?.reference || "Lab Slip"}
                            </p>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-[var(--cera-navy-950)]">
                              {formatStatusLabel(correction.status)}
                            </span>
                          </div>

                          <p className="mt-2 font-medium text-[var(--cera-navy-950)]">
                            {correction.labSlip?.patient?.name || "Patient"}
                          </p>

                          <p className="mt-1 line-clamp-1 text-sm text-[var(--cera-text-muted)]">
                            {correction.description}
                          </p>
                        </div>

                        <span className="text-sm font-medium text-[var(--cera-blue-600)]">
                          Review →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function GenericPortalHome({ user }) {
  const isAdmin = user.role === USER_ROLES.CERA_ADMIN;

  const canUseLabSlips = LAB_SLIP_ROLES.includes(user.role);

  const canUseScans = SCAN_ROLES.includes(user.role);

  const canUseProduction = PRODUCTION_ROLES.includes(user.role);

  const canUseCorrections = CORRECTION_ROLES.includes(user.role);

  const isScanningStaff = user.role === USER_ROLES.SCANNING_STAFF;

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-3xl">
          <div
            className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--cera-success-bg)] text-[var(--cera-success)]"
            aria-hidden="true"
          >
            ✓
          </div>

          <p className="text-sm font-medium text-[var(--cera-blue-600)]">
            Secure workspace
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-[var(--cera-navy-950)] sm:text-4xl">
            Welcome, {user.name}
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-[var(--cera-text-muted)]">
            Access the Cera tools available for your role.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {canUseLabSlips && (
              <>
                <Link
                  to="/portal/lab-slips/new"
                  className="inline-flex h-11 items-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white hover:bg-[var(--cera-navy-800)]"
                >
                  New Lab Slip
                </Link>

                <Link
                  to="/portal/lab-slips"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
                >
                  Lab Slips
                </Link>
              </>
            )}

            {canUseScans && (
              <Link
                to="/portal/scans"
                className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                {isScanningStaff ? "My Visits" : "Scans"}
              </Link>
            )}

            {canUseProduction && (
              <Link
                to="/portal/production"
                className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                Production
              </Link>
            )}

            {canUseCorrections && (
              <Link
                to="/portal/corrections"
                className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
              >
                Corrections
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/portal/admin/users"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
                >
                  Manage people
                </Link>

                <Link
                  to="/portal/admin/clinics"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
                >
                  Manage clinics
                </Link>

                <Link
                  to="/portal/admin/catalog"
                  className="inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
                >
                  Manage catalogue
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export function PortalHomePage() {
  const user = useSelector(selectCurrentUser);

  if (user.role === USER_ROLES.DOCTOR) {
    return <DoctorDashboard user={user} />;
  }

  if (
    user.role === USER_ROLES.CERA_ADMIN ||
    user.role === USER_ROLES.CERA_STAFF
  ) {
    return <CeraOperationsDashboard user={user} />;
  }

  return <GenericPortalHome user={user} />;
}
