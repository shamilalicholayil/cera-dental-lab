import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { LAB_SLIP_URGENCY } from "@cera/shared";

import { getCatalogProducts } from "../api/catalog";

import { getLabSlip, updateLabSlip } from "../api/labSlips";

import { PortalHeader } from "../components/portal/PortalHeader";

import { ToothSelector } from "../components/labSlips/ToothSelector";

export function EditLabSlipPage() {
  const { labSlipId } = useParams();

  const navigate = useNavigate();

  const [slip, setSlip] = useState(null);

  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getLabSlip(labSlipId), getCatalogProducts()])
      .then(([slipResponse, productResponse]) => {
        if (cancelled) {
          return;
        }

        const loadedSlip = slipResponse.data.labSlip;

        const activeProducts = productResponse.data.products;

        /*
         * Existing snapshot products may have
         * been disabled after submission.
         * Keep them selectable on this slip.
         */
        const productMap = new Map(
          activeProducts.map((product) => [product.id, product]),
        );

        for (const item of loadedSlip.items) {
          if (!productMap.has(item.productId)) {
            productMap.set(item.productId, {
              id: item.productId,

              name: item.productName,

              category: {
                id: item.categoryId,

                name: item.categoryName,
              },

              unavailable: true,
            });
          }
        }

        setSlip(loadedSlip);

        setProducts(Array.from(productMap.values()));

        setForm({
          patientName: loadedSlip.patient.name,

          patientReference: loadedSlip.patient.reference || "",

          urgency: loadedSlip.urgency,

          notes: loadedSlip.notes || "",

          items: loadedSlip.items.map((item) => ({
            productId: item.productId,

            teeth: item.teeth,

            shade: item.shade || "",

            ponticDesign: item.ponticDesign || "",

            designNotes: item.designNotes || "",
          })),
        });
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load Lab Slip.");
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

      items: [
        ...current.items,
        {
          productId: "",
          teeth: [],
          shade: "",
          ponticDesign: "",
          designNotes: "",
        },
      ],
    }));
  }

  function removeItem(index) {
    setForm((current) => ({
      ...current,

      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.patientName.trim()) {
      setError("Patient name is required.");

      return;
    }

    if (form.items.length === 0 || form.items.some((item) => !item.productId)) {
      setError("Every item must have a product.");

      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateLabSlip(labSlipId, {
        patient: {
          name: form.patientName.trim(),

          reference: form.patientReference.trim(),
        },

        urgency: form.urgency,

        items: form.items.map((item) => ({
          productId: item.productId,

          teeth: item.teeth,

          shade: item.shade.trim(),

          ponticDesign: item.ponticDesign.trim(),

          designNotes: item.designNotes.trim(),
        })),

        notes: form.notes.trim(),
      });

      navigate(`/portal/lab-slips/${labSlipId}`, {
        replace: true,
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to update Lab Slip.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <main className="min-h-screen bg-[var(--cera-background)]">
        <PortalHeader />

        <div className="p-10 text-center">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-5xl px-5 py-8">
        <p className="text-sm font-medium text-[var(--cera-blue-600)]">
          {slip.reference}
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-[var(--cera-navy-950)]">
          Edit Lab Slip
        </h1>

        <div className="mt-5 rounded-2xl border border-[var(--cera-border)] bg-slate-50 p-4 text-sm">
          <span className="font-medium">{slip.clinic.name}</span>

          {" · "}

          <span>{slip.doctor.name}</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <section className="rounded-2xl border border-[var(--cera-border)] bg-white p-6">
            <h2 className="text-lg font-semibold">Patient</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-patient-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Patient name
                </label>

                <input
                  id="edit-patient-name"
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
                  htmlFor="edit-patient-reference"
                  className="mb-2 block text-sm font-medium"
                >
                  Patient reference
                </label>

                <input
                  id="edit-patient-reference"
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

              <div>
                <label
                  htmlFor="edit-urgency"
                  className="mb-2 block text-sm font-medium"
                >
                  Priority
                </label>

                <select
                  id="edit-urgency"
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

                  <option value={LAB_SLIP_URGENCY.URGENT}>Urgent</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Products</h2>

              <button
                type="button"
                onClick={addItem}
                className="text-sm font-semibold text-[var(--cera-blue-600)]"
              >
                + Add product
              </button>
            </div>

            {form.items.map((item, index) => (
              <article
                key={index}
                className="rounded-2xl border border-[var(--cera-border)] bg-white p-6"
              >
                <div className="flex justify-between gap-4">
                  <h3 className="font-semibold">Product {index + 1}</h3>

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
                    htmlFor={`edit-product-${index}`}
                    className="mb-2 block text-sm font-medium"
                  >
                    Product
                  </label>

                  <select
                    id={`edit-product-${index}`}
                    value={item.productId}
                    onChange={(event) =>
                      updateItem(index, {
                        productId: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4"
                  >
                    <option value="">Select product</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.unavailable ? " (existing)" : ""}
                      </option>
                    ))}
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
                      htmlFor={`edit-shade-${index}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      Shade
                    </label>

                    <input
                      id={`edit-shade-${index}`}
                      value={item.shade}
                      onChange={(event) =>
                        updateItem(index, {
                          shade: event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`edit-pontic-${index}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      Pontic / design
                    </label>

                    <input
                      id={`edit-pontic-${index}`}
                      value={item.ponticDesign}
                      onChange={(event) =>
                        updateItem(index, {
                          ponticDesign: event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor={`edit-design-notes-${index}`}
                    className="mb-2 block text-sm font-medium"
                  >
                    Product notes
                  </label>

                  <textarea
                    id={`edit-design-notes-${index}`}
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
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-[var(--cera-border)] bg-white p-6">
            <label
              htmlFor="edit-lab-notes"
              className="mb-2 block text-sm font-medium"
            >
              General notes
            </label>

            <textarea
              id="edit-lab-notes"
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
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/portal/lab-slips/${labSlipId}`)}
              className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-6 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
