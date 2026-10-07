import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { Link, useParams } from "react-router-dom";

import {
  CORRECTION_OUTCOME,
  CORRECTION_STATUS,
  USER_ROLES,
} from "@cera/shared";

import {
  deleteCorrectionAttachment,
  getCorrection,
  getCorrectionAttachmentAccess,
  getCorrectionAttachments,
  rejectCorrection,
  requestCorrectionClarification,
  resolveCorrection,
  respondToCorrectionClarification,
  startCorrectionReview,
  uploadCorrectionAttachment,
} from "../api/corrections";

import { getLabSlip } from "../api/labSlips";

import { PortalHeader } from "../components/portal/PortalHeader";

import { selectCurrentUser } from "../features/auth/authSelectors";

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
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
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

function formatFileSize(sizeBytes) {
  if (!Number.isFinite(sizeBytes)) {
    return "—";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function HistoryEntry({ entry }) {
  return (
    <li className="relative border-l border-[var(--cera-border)] pb-6 pl-5 last:pb-0">
      <span
        className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--cera-blue-500)]"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium text-[var(--cera-navy-950)]">
            {CORRECTION_STATUS_LABELS[entry.previousStatus] ||
              entry.previousStatus}
            {" → "}
            {CORRECTION_STATUS_LABELS[entry.newStatus] || entry.newStatus}
          </p>

          {entry.changedBy?.name && (
            <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
              By {entry.changedBy.name}
            </p>
          )}
        </div>

        <p className="text-sm text-[var(--cera-text-muted)]">
          {formatDateTime(entry.changedAt)}
        </p>
      </div>

      {entry.note && (
        <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-[var(--cera-text)]">
          {entry.note}
        </div>
      )}
    </li>
  );
}

export function CorrectionDetailPage() {
  const { correctionId } = useParams();

  const user = useSelector(selectCurrentUser);

  const [correction, setCorrection] = useState(null);

  const [labSlip, setLabSlip] = useState(null);

  const [attachments, setAttachments] = useState([]);

  const [attachmentError, setAttachmentError] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [attachmentBusyId, setAttachmentBusyId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [actionError, setActionError] = useState(null);

  const [actionBusy, setActionBusy] = useState(null);

  const [startReviewNote, setStartReviewNote] = useState("");

  const [clarificationNote, setClarificationNote] = useState("");

  const [clarificationResponse, setClarificationResponse] = useState("");

  const [resolutionOutcome, setResolutionOutcome] = useState("");

  const [resolutionNote, setResolutionNote] = useState("");

  const [rejectionNote, setRejectionNote] = useState("");

  const ceraReviewer = [USER_ROLES.CERA_ADMIN, USER_ROLES.CERA_STAFF].includes(
    user?.role,
  );

  const clarificationResponder = [
    USER_ROLES.DOCTOR,
    USER_ROLES.CLINIC_STAFF,
  ].includes(user?.role);

  useEffect(() => {
    let cancelled = false;

    async function loadCorrection() {
      try {
        const correctionResponse = await getCorrection(correctionId);

        if (cancelled) {
          return;
        }

        const loadedCorrection = correctionResponse.data.correction;

        const labSlipResponse = await getLabSlip(loadedCorrection.labSlip.id);

        let loadedAttachments = [];

        try {
          const attachmentResponse =
            await getCorrectionAttachments(correctionId);

          loadedAttachments = attachmentResponse.data.attachments;

          if (!cancelled) {
            setAttachmentError(null);
          }
        } catch (attachmentRequestError) {
          if (!cancelled) {
            setAttachmentError(
              attachmentRequestError.message ||
                "Unable to load correction evidence.",
            );
          }
        }

        if (cancelled) {
          return;
        }

        setCorrection(loadedCorrection);
        setLabSlip(labSlipResponse.data.labSlip);
        setAttachments(loadedAttachments);
        setError(null);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Unable to load correction.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCorrection();

    return () => {
      cancelled = true;
    };
  }, [correctionId]);

  async function handleAttachmentUpload(event) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!selectedFile) {
      setAttachmentError("Choose a file before uploading.");

      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setAttachmentError("Evidence files must be 10 MB or smaller.");

      return;
    }

    setUploading(true);
    setAttachmentError(null);

    try {
      const response = await uploadCorrectionAttachment(
        correctionId,
        selectedFile,
      );

      setAttachments((current) => [...current, response.data.attachment]);

      setSelectedFile(null);

      form.reset();
    } catch (requestError) {
      setAttachmentError(requestError.message || "Unable to upload evidence.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAttachmentAccess(attachmentId) {
    setAttachmentBusyId(attachmentId);
    setAttachmentError(null);

    try {
      const response = await getCorrectionAttachmentAccess(
        correctionId,
        attachmentId,
      );

      window.open(response.data.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setAttachmentError(requestError.message || "Unable to open evidence.");
    } finally {
      setAttachmentBusyId(null);
    }
  }

  async function handleAttachmentDelete(attachment) {
    const confirmed = window.confirm(
      `Delete "${attachment.originalFilename}"?`,
    );

    if (!confirmed) {
      return;
    }

    setAttachmentBusyId(attachment.id);
    setAttachmentError(null);

    try {
      await deleteCorrectionAttachment(correctionId, attachment.id);

      setAttachments((current) =>
        current.filter((item) => item.id !== attachment.id),
      );
    } catch (requestError) {
      setAttachmentError(requestError.message || "Unable to delete evidence.");
    } finally {
      setAttachmentBusyId(null);
    }
  }

  async function runCorrectionAction({ actionName, request, onSuccess }) {
    setActionBusy(actionName);
    setActionError(null);

    try {
      const response = await request();

      const updatedCorrection = response.data.correction;

      setCorrection(updatedCorrection);

      if (
        [CORRECTION_STATUS.RESOLVED, CORRECTION_STATUS.REJECTED].includes(
          updatedCorrection.status,
        )
      ) {
        setAttachments((current) =>
          current.map((attachment) => ({
            ...attachment,
            canDelete: false,
          })),
        );
      }

      onSuccess?.();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to update correction.");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleStartReview(event) {
    event.preventDefault();

    await runCorrectionAction({
      actionName: "start-review",
      request: () =>
        startCorrectionReview(correctionId, startReviewNote.trim()),
      onSuccess: () => {
        setStartReviewNote("");
      },
    });
  }

  async function handleRequestClarification(event) {
    event.preventDefault();

    const note = clarificationNote.trim();

    if (!note) {
      setActionError("A clarification request is required.");

      return;
    }

    await runCorrectionAction({
      actionName: "request-clarification",
      request: () => requestCorrectionClarification(correctionId, note),
      onSuccess: () => {
        setClarificationNote("");
      },
    });
  }

  async function handleClarificationResponse(event) {
    event.preventDefault();

    const note = clarificationResponse.trim();

    if (!note) {
      setActionError("A clarification response is required.");

      return;
    }

    await runCorrectionAction({
      actionName: "respond-clarification",
      request: () => respondToCorrectionClarification(correctionId, note),
      onSuccess: () => {
        setClarificationResponse("");
      },
    });
  }

  async function handleResolve(event) {
    event.preventDefault();

    if (!resolutionOutcome) {
      setActionError("Choose a resolution outcome.");

      return;
    }

    await runCorrectionAction({
      actionName: "resolve",
      request: () =>
        resolveCorrection(
          correctionId,
          resolutionOutcome,
          resolutionNote.trim(),
        ),
      onSuccess: () => {
        setResolutionOutcome("");
        setResolutionNote("");
      },
    });
  }

  async function handleReject(event) {
    event.preventDefault();

    await runCorrectionAction({
      actionName: "reject",
      request: () => rejectCorrection(correctionId, rejectionNote.trim()),
      onSuccess: () => {
        setRejectionNote("");
      },
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <div className="rounded-2xl border border-[var(--cera-border)] bg-white p-10 text-center text-sm text-[var(--cera-text-muted)]">
            Loading correction...
          </div>
        </div>
      </main>
    );
  }

  if (error || !correction || !labSlip) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <Link
            to="/portal/corrections"
            className="text-sm font-medium text-[var(--cera-blue-600)]"
          >
            ← Corrections
          </Link>

          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error || "Correction not found."}
          </div>
        </div>
      </main>
    );
  }

  const evidenceLocked = [
    CORRECTION_STATUS.RESOLVED,
    CORRECTION_STATUS.REJECTED,
  ].includes(correction.status);

  const attachmentLimitReached = attachments.length >= 5;

  const canStartReview =
    ceraReviewer && correction.status === CORRECTION_STATUS.OPEN;

  const canReviewCorrection =
    ceraReviewer && correction.status === CORRECTION_STATUS.UNDER_REVIEW;

  const canRespondToClarification =
    clarificationResponder &&
    correction.status === CORRECTION_STATUS.AWAITING_CLARIFICATION;

  const awaitingClarificationForCera =
    ceraReviewer &&
    correction.status === CORRECTION_STATUS.AWAITING_CLARIFICATION;

  const actionInProgress = actionBusy !== null;

  const affectedIds = new Set(correction.affectedLabSlipItemIds || []);

  const affectedItems = labSlip.items.filter((item) =>
    affectedIds.has(item.id),
  );

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <Link
          to="/portal/corrections"
          className="text-sm font-medium text-[var(--cera-blue-600)]"
        >
          ← Corrections
        </Link>

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                Correction
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--cera-navy-950)] sm:text-3xl">
                  {labSlip.reference}
                </h1>

                <StatusBadge status={correction.status} />
              </div>

              <p className="mt-2 text-[var(--cera-text-muted)]">
                Issue raised for a completed lab case.
              </p>
            </div>

            <div className="text-sm text-[var(--cera-text-muted)] sm:text-right">
              <p>Raised</p>

              <p className="mt-1 font-medium text-[var(--cera-navy-950)]">
                {formatDateTime(correction.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 border-t border-[var(--cera-border)] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                Patient
              </p>

              <p className="mt-1 font-medium">{labSlip.patient?.name || "—"}</p>

              {labSlip.patient?.reference && (
                <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
                  {labSlip.patient.reference}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                Raised by
              </p>

              <p className="mt-1 font-medium">
                {correction.createdBy?.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                Urgency
              </p>

              <p className="mt-1 font-medium">{labSlip.urgency || "—"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                Outcome
              </p>

              <p className="mt-1 font-medium">
                {correction.outcome
                  ? CORRECTION_OUTCOME_LABELS[correction.outcome] ||
                    correction.outcome
                  : "Not decided"}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--cera-border)] pt-6">
            <p className="text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
              Description
            </p>

            <p className="mt-2 whitespace-pre-wrap leading-7 text-[var(--cera-text)]">
              {correction.description}
            </p>
          </div>
        </section>

        {(canStartReview ||
          canReviewCorrection ||
          canRespondToClarification ||
          awaitingClarificationForCera) && (
          <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
                Correction actions
              </h2>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                Actions available for the current correction status.
              </p>
            </div>

            {actionError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {actionError}
              </div>
            )}

            {canStartReview && (
              <form
                onSubmit={handleStartReview}
                className="mt-5 rounded-xl border border-[var(--cera-border)] bg-slate-50 p-4"
              >
                <h3 className="font-semibold text-[var(--cera-navy-950)]">
                  Start review
                </h3>

                <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                  Move this correction into Cera review.
                </p>

                <label
                  htmlFor="start-review-note"
                  className="mt-4 block text-sm font-medium"
                >
                  Note{" "}
                  <span className="font-normal text-[var(--cera-text-muted)]">
                    (optional)
                  </span>
                </label>

                <textarea
                  id="start-review-note"
                  value={startReviewNote}
                  maxLength={3000}
                  disabled={actionInProgress}
                  onChange={(event) => setStartReviewNote(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-[var(--cera-border)] bg-white p-3"
                />

                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="mt-4 inline-flex h-11 items-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {actionBusy === "start-review"
                    ? "Starting..."
                    : "Start Review"}
                </button>
              </form>
            )}

            {canReviewCorrection && (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <form
                  onSubmit={handleRequestClarification}
                  className="rounded-xl border border-[var(--cera-border)] p-4"
                >
                  <h3 className="font-semibold text-[var(--cera-navy-950)]">
                    Request clarification
                  </h3>

                  <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                    Ask the Doctor or Clinic Staff for more information.
                  </p>

                  <label
                    htmlFor="clarification-note"
                    className="mt-4 block text-sm font-medium"
                  >
                    Clarification request
                  </label>

                  <textarea
                    id="clarification-note"
                    required
                    maxLength={3000}
                    rows={4}
                    value={clarificationNote}
                    disabled={actionInProgress}
                    onChange={(event) =>
                      setClarificationNote(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--cera-border)] p-3"
                  />

                  <button
                    type="submit"
                    disabled={actionInProgress || !clarificationNote.trim()}
                    className="mt-4 inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)] disabled:opacity-50"
                  >
                    {actionBusy === "request-clarification"
                      ? "Requesting..."
                      : "Request Clarification"}
                  </button>
                </form>

                <form
                  onSubmit={handleResolve}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"
                >
                  <h3 className="font-semibold text-[var(--cera-navy-950)]">
                    Resolve correction
                  </h3>

                  <label
                    htmlFor="resolution-outcome"
                    className="mt-4 block text-sm font-medium"
                  >
                    Outcome
                  </label>

                  <select
                    id="resolution-outcome"
                    required
                    value={resolutionOutcome}
                    disabled={actionInProgress}
                    onChange={(event) =>
                      setResolutionOutcome(event.target.value)
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-3"
                  >
                    <option value="">Select outcome</option>

                    {Object.values(CORRECTION_OUTCOME).map((outcome) => (
                      <option key={outcome} value={outcome}>
                        {CORRECTION_OUTCOME_LABELS[outcome] || outcome}
                      </option>
                    ))}
                  </select>

                  <label
                    htmlFor="resolution-note"
                    className="mt-4 block text-sm font-medium"
                  >
                    Resolution note{" "}
                    <span className="font-normal text-[var(--cera-text-muted)]">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    id="resolution-note"
                    maxLength={3000}
                    rows={3}
                    value={resolutionNote}
                    disabled={actionInProgress}
                    onChange={(event) => setResolutionNote(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--cera-border)] bg-white p-3"
                  />

                  <button
                    type="submit"
                    disabled={actionInProgress || !resolutionOutcome}
                    className="mt-4 inline-flex h-11 items-center rounded-xl bg-[var(--cera-success)] px-5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {actionBusy === "resolve" ? "Resolving..." : "Resolve"}
                  </button>
                </form>

                <form
                  onSubmit={handleReject}
                  className="rounded-xl border border-red-200 bg-red-50/40 p-4 lg:col-span-2"
                >
                  <h3 className="font-semibold text-[var(--cera-navy-950)]">
                    Reject correction
                  </h3>

                  <label
                    htmlFor="rejection-note"
                    className="mt-4 block text-sm font-medium"
                  >
                    Rejection note{" "}
                    <span className="font-normal text-[var(--cera-text-muted)]">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    id="rejection-note"
                    maxLength={3000}
                    rows={3}
                    value={rejectionNote}
                    disabled={actionInProgress}
                    onChange={(event) => setRejectionNote(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-red-200 bg-white p-3"
                  />

                  <button
                    type="submit"
                    disabled={actionInProgress}
                    className="mt-4 inline-flex h-11 items-center rounded-xl bg-red-700 px-5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {actionBusy === "reject"
                      ? "Rejecting..."
                      : "Reject Correction"}
                  </button>
                </form>
              </div>
            )}

            {canRespondToClarification && (
              <form
                onSubmit={handleClarificationResponse}
                className="mt-5 rounded-xl border border-orange-200 bg-orange-50/50 p-4"
              >
                <h3 className="font-semibold text-[var(--cera-navy-950)]">
                  Clarification requested
                </h3>

                <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                  Cera needs more information before the review can continue.
                </p>

                <label
                  htmlFor="clarification-response"
                  className="mt-4 block text-sm font-medium"
                >
                  Your response
                </label>

                <textarea
                  id="clarification-response"
                  required
                  maxLength={3000}
                  rows={4}
                  value={clarificationResponse}
                  disabled={actionInProgress}
                  onChange={(event) =>
                    setClarificationResponse(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-orange-200 bg-white p-3"
                />

                <button
                  type="submit"
                  disabled={actionInProgress || !clarificationResponse.trim()}
                  className="mt-4 inline-flex h-11 items-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {actionBusy === "respond-clarification"
                    ? "Sending..."
                    : "Send Clarification"}
                </button>
              </form>
            )}

            {awaitingClarificationForCera && (
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                Waiting for clarification from the Doctor or Clinic Staff. No
                further review action is available until they respond.
              </div>
            )}
          </section>
        )}

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
                Original Lab Slip
              </h2>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                The original completed case remains unchanged.
              </p>
            </div>

            <Link
              to={`/portal/lab-slips/${labSlip.id}`}
              className="inline-flex h-10 items-center rounded-xl border border-[var(--cera-border)] px-4 text-sm font-semibold text-[var(--cera-navy-950)] hover:bg-slate-50"
            >
              View Lab Slip
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
            Affected products
          </h2>

          <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
            Products specifically identified when this correction was raised.
          </p>

          {affectedItems.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-[var(--cera-text-muted)]">
              No specific Lab Slip products were selected.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {affectedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--cera-border)] p-4"
                >
                  <p className="font-medium text-[var(--cera-navy-950)]">
                    {item.productName}
                  </p>

                  <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                    {item.categoryName}
                  </p>

                  {item.teeth?.length > 0 && (
                    <p className="mt-2 text-sm text-[var(--cera-text-muted)]">
                      Teeth: {item.teeth.join(", ")}
                    </p>
                  )}

                  {item.shade && (
                    <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                      Shade: {item.shade}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
                Evidence
              </h2>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                Supporting photos or documents related to this correction.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[var(--cera-text-muted)]">
              {attachments.length} / 5 files
            </span>
          </div>

          {attachmentError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {attachmentError}
            </div>
          )}

          {evidenceLocked ? (
            <div className="mt-5 rounded-xl border border-[var(--cera-border)] bg-slate-50 p-4 text-sm text-[var(--cera-text-muted)]">
              This correction is closed. Existing evidence remains available,
              but evidence can no longer be added or removed.
            </div>
          ) : (
            <form
              onSubmit={handleAttachmentUpload}
              className="mt-5 rounded-xl border border-[var(--cera-border)] bg-slate-50 p-4"
            >
              <label
                htmlFor="correction-evidence"
                className="block text-sm font-medium text-[var(--cera-navy-950)]"
              >
                Add evidence
              </label>

              <p className="mt-1 text-xs leading-5 text-[var(--cera-text-muted)]">
                JPEG, PNG, WEBP or PDF. Maximum 10 MB per file.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="correction-evidence"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  disabled={uploading || attachmentLimitReached}
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] || null);

                    setAttachmentError(null);
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--cera-border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                />

                <button
                  type="submit"
                  disabled={
                    uploading || attachmentLimitReached || !selectedFile
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload evidence"}
                </button>
              </div>

              {attachmentLimitReached && (
                <p className="mt-3 text-sm text-amber-700">
                  The maximum of 5 evidence files has been reached.
                </p>
              )}
            </form>
          )}

          {attachments.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--cera-border)] p-6 text-center text-sm text-[var(--cera-text-muted)]">
              No evidence has been added.
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-[var(--cera-border)] rounded-xl border border-[var(--cera-border)]">
              {attachments.map((attachment) => {
                const busy = attachmentBusyId === attachment.id;

                return (
                  <li
                    key={attachment.id}
                    className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--cera-navy-950)]">
                        {attachment.originalFilename}
                      </p>

                      <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
                        {formatFileSize(attachment.sizeBytes)}
                        {" · "}
                        {formatDateTime(attachment.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAttachmentAccess(attachment.id)}
                        className="h-9 rounded-lg border border-[var(--cera-border)] bg-white px-3 text-sm font-medium text-[var(--cera-navy-950)] disabled:opacity-50"
                      >
                        {busy ? "Opening..." : "View"}
                      </button>

                      {attachment.canDelete && !evidenceLocked && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleAttachmentDelete(attachment)}
                          className="h-9 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
            Correction history
          </h2>

          <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
            Status changes and communication recorded for this correction.
          </p>

          {correction.history.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-[var(--cera-text-muted)]">
              No status changes have been recorded yet.
            </div>
          ) : (
            <ol className="mt-6 pl-1">
              {correction.history.map((entry, index) => (
                <HistoryEntry
                  key={`${entry.changedAt}-${index}`}
                  entry={entry}
                />
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
