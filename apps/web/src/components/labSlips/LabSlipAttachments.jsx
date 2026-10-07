import { useEffect, useState } from "react";

import {
  deleteLabSlipAttachment,
  getLabSlipAttachmentAccess,
  getLabSlipAttachments,
  uploadLabSlipAttachment,
} from "../../api/labSlips";

const MAX_ATTACHMENT_COUNT = 5;

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_ATTACHMENT_TYPES = Object.freeze({
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

function validateFile(file) {
  const expectedType = ALLOWED_ATTACHMENT_TYPES[getExtension(file.name)];

  if (!expectedType) {
    return "Only JPEG, PNG, WEBP, and PDF files are allowed.";
  }

  if (file.type && file.type !== expectedType) {
    return "The selected file does not match its extension.";
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return "Attachments must be 10 MB or smaller.";
  }

  if (file.size === 0) {
    return "Empty files cannot be uploaded.";
  }

  return null;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LabSlipAttachments({
  labSlipId,
  allowUpload,
  showReadOnlyNotice = true,
}) {
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  async function fetchAttachments() {
    const response = await getLabSlipAttachments(labSlipId);

    return response.data.attachments;
  }

  useEffect(() => {
    let cancelled = false;

    getLabSlipAttachments(labSlipId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setAttachments(response.data.attachments);
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setError(requestError.message || "Unable to load attachments.");
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

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (attachments.length >= MAX_ATTACHMENT_COUNT) {
      setError(
        `A Lab Slip can have a maximum of ${MAX_ATTACHMENT_COUNT} attachments.`,
      );

      return;
    }

    try {
      setUploading(true);

      await uploadLabSlipAttachment(labSlipId, file);

      const updatedAttachments = await fetchAttachments();

      setAttachments(updatedAttachments);
    } catch (requestError) {
      setError(requestError.message || "Unable to upload attachment.");
    } finally {
      setUploading(false);
    }
  }

  async function handleOpen(attachment) {
    try {
      setError(null);

      const response = await getLabSlipAttachmentAccess(
        labSlipId,
        attachment.id,
      );

      window.open(response.data.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(requestError.message || "Unable to open attachment.");
    }
  }

  async function handleDelete(attachment) {
    const confirmed = window.confirm(
      `Delete "${attachment.originalFilename}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(attachment.id);

      setError(null);

      await deleteLabSlipAttachment(labSlipId, attachment.id);

      setAttachments((current) =>
        current.filter((item) => item.id !== attachment.id),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to delete attachment.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 border-t border-[var(--cera-border)] pt-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium">Attachments</p>

          <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
            Photos and PDFs supplied with this case.
          </p>
        </div>

        {allowUpload && attachments.length < MAX_ATTACHMENT_COUNT && (
          <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-[var(--cera-border)] bg-white px-4 text-sm font-semibold text-[var(--cera-navy-950)]">
            {uploading ? "Uploading..." : "Add attachment"}

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-[var(--cera-text-muted)]">
          Loading attachments...
        </p>
      ) : attachments.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--cera-border)] p-5 text-sm text-[var(--cera-text-muted)]">
          No attachments added.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--cera-border)] p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--cera-navy-950)]">
                  {attachment.originalFilename}
                </p>

                <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
                  {formatFileSize(attachment.sizeBytes)}
                  {" · "}
                  {new Date(attachment.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpen(attachment)}
                  className="h-9 rounded-lg border border-[var(--cera-border)] px-3 text-sm font-medium"
                >
                  View
                </button>

                {attachment.canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(attachment)}
                    disabled={deletingId === attachment.id}
                    className="h-9 rounded-lg px-3 text-sm font-medium text-red-600 disabled:opacity-50"
                  >
                    {deletingId === attachment.id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showReadOnlyNotice &&
        !allowUpload &&
        !loading &&
        attachments.length > 0 && (
          <p className="mt-3 text-xs text-[var(--cera-text-muted)]">
            Attachments are read-only after production starts.
          </p>
        )}

      {allowUpload && attachments.length >= MAX_ATTACHMENT_COUNT && (
        <p className="mt-3 text-xs text-[var(--cera-text-muted)]">
          Maximum of 5 attachments reached.
        </p>
      )}
    </div>
  );
}
