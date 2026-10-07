import { useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { useNavigate } from "react-router-dom";

import { LAB_SLIP_SOURCE, LAB_SLIP_URGENCY, USER_ROLES } from "@cera/shared";

import { getCatalogCategories, getCatalogProducts } from "../api/catalog";

import { getAccessibleClinics, getClinicDoctors } from "../api/clinics";

import { createLabSlip, uploadLabSlipAttachment } from "../api/labSlips";

import { PortalHeader } from "../components/portal/PortalHeader";

import { ToothSelector } from "../components/labSlips/ToothSelector";

import { selectCurrentUser } from "../features/auth/authSelectors";

const blankItem = () => ({
  productId: "",
  teeth: [],
  shade: "",
  ponticDesign: "",
  designNotes: "",
});

const MAX_ATTACHMENT_COUNT = 5;

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const ATTACHMENT_TYPES = Object.freeze({
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
});

function getFileExtension(filename) {
  const dotIndex = filename.lastIndexOf(".");

  if (dotIndex === -1) {
    return "";
  }

  return filename.slice(dotIndex).toLowerCase();
}

function validateAttachment(file) {
  const extension = getFileExtension(file.name);

  const expectedType = ATTACHMENT_TYPES[extension];

  if (!expectedType) {
    return "Only JPEG, PNG, WEBP, and PDF files are allowed.";
  }

  if (file.type && file.type !== expectedType) {
    return `${file.name} does not match its file extension.`;
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return `${file.name} is larger than 10 MB.`;
  }

  if (file.size === 0) {
    return `${file.name} is empty.`;
  }

  return null;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NewLabSlipPage() {
  const navigate = useNavigate();

  const user = useSelector(selectCurrentUser);

  const [clinics, setClinics] = useState([]);

  const [doctors, setDoctors] = useState([]);

  const [categories, setCategories] = useState([]);

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);

  const [selectedAttachments, setSelectedAttachments] = useState([]);

  const [attachmentError, setAttachmentError] = useState(null);

  const [createdLabSlipId, setCreatedLabSlipId] = useState(null);

  const [failedAttachments, setFailedAttachments] = useState([]);

  const [retryingAttachments, setRetryingAttachments] = useState(false);

  const [form, setForm] = useState({
    clinicId: "",
    doctorId: "",
    source: LAB_SLIP_SOURCE.PORTAL,
    urgency: LAB_SLIP_URGENCY.STANDARD,

    patientName: "",
    patientReference: "",

    items: [blankItem()],

    notes: "",
    scanRequired: false,
  });

  const isDoctor = user?.role === USER_ROLES.DOCTOR;

  const needsDoctorSelection = [
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
    USER_ROLES.CLINIC_STAFF,
  ].includes(user?.role);

  const canChooseSource = [
    USER_ROLES.CERA_ADMIN,
    USER_ROLES.CERA_STAFF,
  ].includes(user?.role);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAccessibleClinics(),
      getCatalogCategories(),
      getCatalogProducts(),
    ])
      .then(([clinicResponse, categoryResponse, productResponse]) => {
        if (cancelled) {
          return;
        }

        setClinics(clinicResponse.data.clinics);

        setCategories(categoryResponse.data.categories);

        setProducts(productResponse.data.products);

        if (clinicResponse.data.clinics.length === 1) {
          setForm((current) => ({
            ...current,

            clinicId: clinicResponse.data.clinics[0].id,
          }));
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load the lab slip form.");
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
  }, []);

  useEffect(() => {
    if (!needsDoctorSelection || !form.clinicId) {
      return;
    }

    let cancelled = false;

    getClinicDoctors(form.clinicId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setDoctors(response.data.doctors);

        setForm((current) => ({
          ...current,

          doctorId:
            response.data.doctors.length === 1
              ? response.data.doctors[0].id
              : "",
        }));
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setError(
          requestError.message || "Unable to load doctors for this clinic.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [form.clinicId, needsDoctorSelection]);

  const productsByCategory = useMemo(
    () =>
      categories.map((category) => ({
        ...category,

        products: products.filter(
          (product) => product.category?.id === category.id,
        ),
      })),
    [categories, products],
  );

  function updateItem(index, patch) {
    setForm((current) => ({
      ...current,

      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    }));
  }

  function addItem() {
    setForm((current) => ({
      ...current,

      items: [...current.items, blankItem()],
    }));
  }

  function removeItem(index) {
    setForm((current) => ({
      ...current,

      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function handleAttachmentSelection(event) {
    const files = Array.from(event.target.files || []);

    event.target.value = "";

    setAttachmentError(null);

    if (!files.length) {
      return;
    }

    if (selectedAttachments.length + files.length > MAX_ATTACHMENT_COUNT) {
      setAttachmentError(
        `You can attach a maximum of ${MAX_ATTACHMENT_COUNT} files.`,
      );

      return;
    }

    for (const file of files) {
      const validationError = validateAttachment(file);

      if (validationError) {
        setAttachmentError(validationError);
        return;
      }
    }

    setSelectedAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
      })),
    ]);
  }

  function removeSelectedAttachment(id) {
    setSelectedAttachments((current) =>
      current.filter((attachment) => attachment.id !== id),
    );

    setAttachmentError(null);
  }

  async function uploadAttachments(labSlipId, attachments) {
    const failures = [];

    for (const attachment of attachments) {
      try {
        await uploadLabSlipAttachment(labSlipId, attachment.file);
      } catch (uploadError) {
        failures.push({
          ...attachment,
          error: uploadError.message || "Unable to upload this attachment.",
        });
      }
    }

    return failures;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError(null);

    if (!form.clinicId) {
      setError("Select a clinic.");
      return;
    }

    if (needsDoctorSelection && !form.doctorId) {
      setError("Select a doctor.");
      return;
    }

    if (!form.patientName.trim()) {
      setError("Patient name is required.");
      return;
    }

    if (form.items.some((item) => !item.productId)) {
      setError("Select a product for every item.");
      return;
    }

    const payload = {
      clinicId: form.clinicId,

      ...(isDoctor
        ? {}
        : {
            doctorId: form.doctorId,
          }),

      source: canChooseSource ? form.source : LAB_SLIP_SOURCE.PORTAL,

      urgency: form.urgency,

      patient: {
        name: form.patientName.trim(),

        reference: form.patientReference.trim(),
      },

      items: form.items.map((item) => ({
        productId: item.productId,

        teeth: item.teeth,

        shade: item.shade.trim(),

        ponticDesign: item.ponticDesign.trim(),

        designNotes: item.designNotes.trim(),
      })),

      notes: form.notes.trim(),

      scanRequired: form.scanRequired,
    };

    try {
      setSubmitting(true);

      const response = await createLabSlip(payload);

      const labSlipId = response.data.labSlip.id;

      if (selectedAttachments.length === 0) {
        navigate(`/portal/lab-slips/${labSlipId}`, {
          replace: true,
        });

        return;
      }

      const failures = await uploadAttachments(labSlipId, selectedAttachments);

      if (failures.length === 0) {
        navigate(`/portal/lab-slips/${labSlipId}`, {
          replace: true,
        });

        return;
      }

      /*
       * The Lab Slip itself has already been created.
       *
       * Do not present this as a Lab Slip creation failure and
       * never create another Lab Slip just because one or more
       * optional attachment uploads failed.
       */
      setCreatedLabSlipId(labSlipId);

      setFailedAttachments(failures);
    } catch (requestError) {
      setError(requestError.message || "Unable to submit the lab slip.");
    } finally {
      setSubmitting(false);
    }
  }

  async function retryFailedAttachments() {
    if (!createdLabSlipId || failedAttachments.length === 0) {
      return;
    }

    setRetryingAttachments(true);

    try {
      const failures = await uploadAttachments(
        createdLabSlipId,
        failedAttachments,
      );

      if (failures.length === 0) {
        navigate(`/portal/lab-slips/${createdLabSlipId}`, {
          replace: true,
        });

        return;
      }

      setFailedAttachments(failures);
    } finally {
      setRetryingAttachments(false);
    }
  }

  if (createdLabSlipId && failedAttachments.length > 0) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
          <div className="rounded-2xl border border-amber-200 bg-white p-6">
            <p className="text-sm font-medium text-amber-700">
              Lab Slip created
            </p>

            <h1 className="mt-2 text-2xl font-semibold text-[var(--cera-navy-950)]">
              Some attachments could not be uploaded
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--cera-text-muted)]">
              Your Lab Slip has been saved. You can retry the failed files
              without creating another Lab Slip.
            </p>

            <div className="mt-6 space-y-3">
              {failedAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded-xl border border-[var(--cera-border)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {attachment.file.name}
                      </p>

                      <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
                        {formatFileSize(attachment.file.size)}
                      </p>

                      <p className="mt-2 text-sm text-red-600">
                        {attachment.error}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={retryFailedAttachments}
                disabled={retryingAttachments}
                className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {retryingAttachments
                  ? "Retrying..."
                  : "Retry failed attachments"}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/portal/lab-slips/${createdLabSlipId}`, {
                    replace: true,
                  })
                }
                className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-5 text-sm font-semibold text-[var(--cera-navy-950)]"
              >
                Continue to Lab Slip
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="mx-auto max-w-5xl px-5 py-12 text-center text-sm text-[var(--cera-text-muted)]">
          Loading lab slip...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
        <div>
          <p className="text-sm font-medium text-[var(--cera-blue-600)]">
            Lab work
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--cera-navy-950)]">
            New Lab Slip
          </h1>

          <p className="mt-2 text-[var(--cera-text-muted)]">
            Enter only the information Cera needs to begin the case.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <section className="rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
              Case
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="lab-clinic"
                  className="mb-2 block text-sm font-medium"
                >
                  Clinic / hospital
                </label>

                <select
                  id="lab-clinic"
                  value={form.clinicId}
                  onChange={(event) => {
                    setDoctors([]);

                    setForm((current) => ({
                      ...current,

                      clinicId: event.target.value,

                      doctorId: "",
                    }));
                  }}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4"
                >
                  <option value="">Select clinic</option>

                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>

              {needsDoctorSelection && (
                <div>
                  <label
                    htmlFor="lab-doctor"
                    className="mb-2 block text-sm font-medium"
                  >
                    Doctor
                  </label>

                  <select
                    id="lab-doctor"
                    value={form.doctorId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        doctorId: event.target.value,
                      }))
                    }
                    disabled={!form.clinicId}
                    className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4 disabled:bg-slate-50"
                  >
                    <option value="">Select doctor</option>

                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {canChooseSource && (
                <div>
                  <label
                    htmlFor="lab-source"
                    className="mb-2 block text-sm font-medium"
                  >
                    Request source
                  </label>

                  <select
                    id="lab-source"
                    value={form.source}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        source: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4"
                  >
                    <option value={LAB_SLIP_SOURCE.PORTAL}>Portal</option>

                    <option value={LAB_SLIP_SOURCE.PHONE}>Phone</option>

                    <option value={LAB_SLIP_SOURCE.WHATSAPP}>WhatsApp</option>

                    <option value={LAB_SLIP_SOURCE.PAPER}>Paper</option>
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="lab-urgency"
                  className="mb-2 block text-sm font-medium"
                >
                  Priority
                </label>

                <select
                  id="lab-urgency"
                  value={form.urgency}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      urgency: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4"
                >
                  <option value={LAB_SLIP_URGENCY.STANDARD}>Standard</option>

                  <option value={LAB_SLIP_URGENCY.URGENT}>
                    Urgent request
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
              Patient
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="patient-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Patient name
                </label>

                <input
                  id="patient-name"
                  value={form.patientName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      patientName: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>

              <div>
                <label
                  htmlFor="patient-reference"
                  className="mb-2 block text-sm font-medium"
                >
                  Patient reference{" "}
                  <span className="font-normal text-[var(--cera-text-muted)]">
                    optional
                  </span>
                </label>

                <input
                  id="patient-reference"
                  value={form.patientReference}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      patientReference: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
                  Products
                </h2>

                <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                  Add each restoration or appliance required for this case.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="text-sm font-semibold text-[var(--cera-blue-600)]"
              >
                + Add product
              </button>
            </div>

            {form.items.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--cera-navy-950)]">
                    Product {index + 1}
                  </h3>

                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-sm font-medium text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-5">
                  <label
                    htmlFor={`product-${index}`}
                    className="mb-2 block text-sm font-medium"
                  >
                    Product
                  </label>

                  <select
                    id={`product-${index}`}
                    value={item.productId}
                    onChange={(event) =>
                      updateItem(index, {
                        productId: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4"
                  >
                    <option value="">Select product</option>

                    {productsByCategory.map(
                      (category) =>
                        category.products.length > 0 && (
                          <optgroup key={category.id} label={category.name}>
                            {category.products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </optgroup>
                        ),
                    )}
                  </select>
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium">Teeth</p>

                  <ToothSelector
                    value={item.teeth}
                    onChange={(teeth) =>
                      updateItem(index, {
                        teeth,
                      })
                    }
                  />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`shade-${index}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      Shade
                    </label>

                    <input
                      id={`shade-${index}`}
                      value={item.shade}
                      onChange={(event) =>
                        updateItem(index, {
                          shade: event.target.value,
                        })
                      }
                      placeholder="e.g. A2"
                      className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`pontic-${index}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      Pontic / design
                    </label>

                    <input
                      id={`pontic-${index}`}
                      value={item.ponticDesign}
                      onChange={(event) =>
                        updateItem(index, {
                          ponticDesign: event.target.value,
                        })
                      }
                      placeholder="If applicable"
                      className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`design-notes-${index}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      Product notes
                    </label>

                    <textarea
                      id={`design-notes-${index}`}
                      rows={3}
                      value={item.designNotes}
                      onChange={(event) =>
                        updateItem(index, {
                          designNotes: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-[var(--cera-border)] px-4 py-3"
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-[var(--cera-border)] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--cera-navy-950)]">
              Final details
            </h2>

            <div className="mt-5">
              <label
                htmlFor="lab-notes"
                className="mb-2 block text-sm font-medium"
              >
                General notes{" "}
                <span className="font-normal text-[var(--cera-text-muted)]">
                  optional
                </span>
              </label>

              <textarea
                id="lab-notes"
                rows={4}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    notes: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[var(--cera-border)] px-4 py-3"
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="lab-attachments"
                  className="block text-sm font-medium"
                >
                  Attachments{" "}
                  <span className="font-normal text-[var(--cera-text-muted)]">
                    optional
                  </span>
                </label>

                <span className="text-xs text-[var(--cera-text-muted)]">
                  {selectedAttachments.length}/{MAX_ATTACHMENT_COUNT}
                </span>
              </div>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                Add photos or PDFs that help Cera understand the case. Maximum
                10 MB per file.
              </p>

              <input
                id="lab-attachments"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleAttachmentSelection}
                disabled={
                  submitting ||
                  selectedAttachments.length >= MAX_ATTACHMENT_COUNT
                }
                className="mt-3 block w-full rounded-xl border border-[var(--cera-border)] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold"
              />

              {attachmentError && (
                <p
                  role="alert"
                  className="mt-2 text-sm font-medium text-red-600"
                >
                  {attachmentError}
                </p>
              )}

              {selectedAttachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[var(--cera-border)] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {attachment.file.name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
                          {formatFileSize(attachment.file.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSelectedAttachment(attachment.id)}
                        disabled={submitting}
                        className="shrink-0 text-sm font-medium text-red-600 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--cera-border)] p-4">
              <input
                type="checkbox"
                checked={form.scanRequired}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    scanRequired: event.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-semibold text-[var(--cera-navy-950)]">
                  Cera scanning required
                </span>

                <span className="mt-1 block text-sm text-[var(--cera-text-muted)]">
                  Scan booking details will be handled after this lab slip is
                  submitted.
                </span>
              </span>
            </label>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <div className="sticky bottom-3 rounded-2xl border border-[var(--cera-border)] bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-[var(--cera-text-muted)]">
                Review the case information before submitting.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="h-12 rounded-xl bg-[var(--cera-navy-900)] px-7 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting
                  ? selectedAttachments.length > 0
                    ? "Submitting case..."
                    : "Submitting..."
                  : "Submit Lab Slip"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
