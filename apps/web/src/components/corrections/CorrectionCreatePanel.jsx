import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  createCorrection,
  getActiveCorrectionForLabSlip,
  uploadCorrectionAttachment,
} from "../../api/corrections";

const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EVIDENCE_TYPES = Object.freeze({
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
});

function getExtension(filename) {
  const index = filename.lastIndexOf(".");

  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

function validateEvidenceFile(file) {
  if (!file) {
    return null;
  }

  const expectedType = ALLOWED_EVIDENCE_TYPES[getExtension(file.name)];

  if (!expectedType) {
    return "Only JPEG, PNG, WEBP, and PDF evidence files are allowed.";
  }

  if (file.type && file.type !== expectedType) {
    return "The selected evidence file does not match its extension.";
  }

  if (file.size === 0) {
    return "Empty evidence files cannot be uploaded.";
  }

  if (file.size > MAX_EVIDENCE_SIZE) {
    return "Evidence files must be 10 MB or smaller.";
  }

  return null;
}

export function CorrectionCreatePanel({ labSlip }) {
  const navigate = useNavigate();

  const [activeCorrection, setActiveCorrection] = useState(null);

  const [lookupLoading, setLookupLoading] = useState(true);

  const [lookupError, setLookupError] = useState(null);

  const [description, setDescription] = useState("");

  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const [evidenceFile, setEvidenceFile] = useState(null);

  const [formError, setFormError] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getActiveCorrectionForLabSlip(labSlip.id)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setActiveCorrection(response.data.correction);

        setLookupError(null);
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setLookupError(
          requestError.message || "Unable to check for an active correction.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLookupLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [labSlip.id]);

  async function retryLookup() {
    setLookupLoading(true);
    setLookupError(null);

    try {
      const response = await getActiveCorrectionForLabSlip(labSlip.id);

      setActiveCorrection(response.data.correction);
    } catch (requestError) {
      setLookupError(
        requestError.message || "Unable to check for an active correction.",
      );
    } finally {
      setLookupLoading(false);
    }
  }

  function toggleAffectedItem(itemId) {
    setSelectedItemIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }

      return [...current, itemId];
    });
  }

  function handleEvidenceChange(event) {
    const file = event.target.files?.[0] || null;

    setFormError(null);

    if (!file) {
      setEvidenceFile(null);
      return;
    }

    const validationError = validateEvidenceFile(file);

    if (validationError) {
      event.target.value = "";

      setEvidenceFile(null);
      setFormError(validationError);

      return;
    }

    setEvidenceFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedDescription = description.trim();

    if (!normalizedDescription) {
      setFormError("Describe the correction or issue.");

      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await createCorrection({
        labSlipId: labSlip.id,
        description: normalizedDescription,
        affectedLabSlipItemIds: selectedItemIds,
      });

      const createdCorrection = response.data.correction;

      if (evidenceFile) {
        try {
          await uploadCorrectionAttachment(createdCorrection.id, evidenceFile);
        } catch (uploadError) {
          /*
           * The Correction already exists at this
           * point. Do not let the user submit the
           * creation form again and accidentally hit
           * ACTIVE_CORRECTION_EXISTS.
           */
          setActiveCorrection(createdCorrection);

          setFormError(
            `The correction was created, but the evidence file could not be uploaded. ${
              uploadError.message ||
              "You can add the evidence from the Correction detail page."
            }`,
          );

          return;
        }
      }

      navigate(`/portal/corrections/${createdCorrection.id}`);
    } catch (requestError) {
      if (requestError.code === "ACTIVE_CORRECTION_EXISTS") {
        /*
         * Another request may have created one
         * between the lookup and submission.
         */
        try {
          const activeResponse = await getActiveCorrectionForLabSlip(
            labSlip.id,
          );

          setActiveCorrection(activeResponse.data.correction);
        } catch {
          // Keep the original API error below.
        }
      }

      setFormError(requestError.message || "Unable to raise correction.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[var(--cera-border)] pt-5">
      <div>
        <p className="text-sm font-medium">Correction</p>

        <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
          Report an issue with this completed lab case without changing the
          original Lab Slip.
        </p>
      </div>

      {lookupLoading ? (
        <p className="mt-4 text-sm text-[var(--cera-text-muted)]">
          Checking correction status...
        </p>
      ) : lookupError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p role="alert" className="text-sm text-red-700">
            {lookupError}
          </p>

          <button
            type="button"
            onClick={retryLookup}
            className="mt-3 h-9 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700"
          >
            Retry
          </button>
        </div>
      ) : activeCorrection ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-[var(--cera-navy-950)]">
            An active correction already exists
          </p>

          <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
            Only one unresolved correction can be open for this Lab Slip at a
            time.
          </p>

          {formError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <Link
            to={`/portal/corrections/${activeCorrection.id}`}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-[var(--cera-navy-900)] px-4 text-sm font-semibold text-white"
          >
            View Active Correction
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl border border-[var(--cera-border)] bg-slate-50 p-4"
        >
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

          <label
            htmlFor="correction-description"
            className="block text-sm font-medium"
          >
            Describe the issue
          </label>

          <textarea
            id="correction-description"
            required
            maxLength={3000}
            rows={4}
            disabled={submitting}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what needs Cera's attention..."
            className="mt-2 w-full rounded-xl border border-[var(--cera-border)] bg-white p-3"
          />

          <fieldset className="mt-5">
            <legend className="text-sm font-medium">
              Affected products{" "}
              <span className="font-normal text-[var(--cera-text-muted)]">
                (optional)
              </span>
            </legend>

            <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
              Select only the products directly affected by the issue.
            </p>

            <div className="mt-3 space-y-2">
              {labSlip.items.map((item, index) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--cera-border)] bg-white p-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedItemIds.includes(item.id)}
                    disabled={submitting}
                    onChange={() => toggleAffectedItem(item.id)}
                    className="mt-1"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--cera-navy-950)]">
                      Product {index + 1}: {item.productName}
                    </span>

                    <span className="mt-1 block text-xs text-[var(--cera-text-muted)]">
                      {item.categoryName}
                      {item.teeth?.length
                        ? ` · Teeth: ${item.teeth.join(", ")}`
                        : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5">
            <label
              htmlFor="correction-evidence-file"
              className="block text-sm font-medium"
            >
              Initial evidence{" "}
              <span className="font-normal text-[var(--cera-text-muted)]">
                (optional)
              </span>
            </label>

            <p className="mt-1 text-xs leading-5 text-[var(--cera-text-muted)]">
              JPEG, PNG, WEBP, or PDF. Maximum 10 MB. More evidence can be added
              from the Correction page afterward.
            </p>

            <input
              id="correction-evidence-file"
              type="file"
              disabled={submitting}
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleEvidenceChange}
              className="mt-3 w-full rounded-xl border border-[var(--cera-border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Raising Correction..." : "Raise Correction"}
          </button>
        </form>
      )}
    </div>
  );
}
