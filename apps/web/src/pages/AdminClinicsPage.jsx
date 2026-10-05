import { useEffect, useState } from "react";

import { CLINIC_STATUS, USER_ROLES, USER_STATUS } from "@cera/shared";

import {
  activateClinic,
  addClinicMember,
  createClinic,
  disableClinic,
  getAdminClinics,
  getClinicMembers,
  removeClinicMember,
  updateClinic,
} from "../api/clinics";

import { getAdminUsers } from "../api/adminUsers";

import { PortalHeader } from "../components/portal/PortalHeader";

import {
  CLINIC_STATUS_LABELS,
  CLINIC_TYPE_LABELS,
  CLINIC_TYPE_OPTIONS,
} from "../constants/clinicDisplay";

import { ROLE_LABELS } from "../constants/userDisplay";

const emptyForm = {
  name: "",
  type: "",
  contactPhone: "",
  email: "",

  address: {
    line1: "",
    line2: "",
    locality: "",
    city: "",
    district: "",
    state: "Kerala",
    pincode: "",
  },
};

function ClinicStatusBadge({ status }) {
  const active = status === CLINIC_STATUS.ACTIVE;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {CLINIC_STATUS_LABELS[status] || status}
    </span>
  );
}

function ClinicFormModal({ clinic, onClose, onSaved }) {
  const editing = Boolean(clinic);

  const [form, setForm] = useState(() =>
    clinic
      ? {
          name: clinic.name,

          type: clinic.type,

          contactPhone: clinic.contactPhone || "",

          email: clinic.email || "",

          address: {
            line1: clinic.address.line1 || "",

            line2: clinic.address.line2 || "",

            locality: clinic.address.locality || "",

            city: clinic.address.city || "",

            district: clinic.address.district || "",

            state: clinic.address.state || "Kerala",

            pincode: clinic.address.pincode || "",
          },
        }
      : structuredClone(emptyForm),
  );

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,

      [name]: value,
    }));

    setError(null);
  }

  function updateAddress(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,

      address: {
        ...current.address,

        [name]: value,
      },
    }));

    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError(null);

    if (
      !form.name.trim() ||
      !form.type ||
      !form.address.line1.trim() ||
      !form.address.city.trim() ||
      !form.address.state.trim() ||
      !form.address.pincode.trim()
    ) {
      setError(
        "Clinic name, type and required address fields must be completed.",
      );

      return;
    }

    if (!/^\d{6}$/.test(form.address.pincode.trim())) {
      setError("Enter a valid 6-digit pincode.");

      return;
    }

    const payload = {
      name: form.name.trim(),

      type: form.type,

      contactPhone: form.contactPhone.trim(),

      email: form.email.trim(),

      address: {
        line1: form.address.line1.trim(),

        line2: form.address.line2.trim(),

        locality: form.address.locality.trim(),

        city: form.address.city.trim(),

        district: form.address.district.trim(),

        state: form.address.state.trim(),

        pincode: form.address.pincode.trim(),
      },
    };

    try {
      setSubmitting(true);

      const response = editing
        ? await updateClinic(clinic.id, payload)
        : await createClinic(payload);

      onSaved(response.data.clinic);
    } catch (requestError) {
      setError(requestError.message || "Unable to save clinic.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clinic-form-title"
        className="mx-auto w-full max-w-2xl rounded-3xl border border-[var(--cera-border)] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[var(--cera-border)] px-6 py-5">
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              Clinics
            </p>

            <h2
              id="clinic-form-title"
              className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
            >
              {editing ? "Edit clinic" : "Add clinic"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close clinic form"
            className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 p-6" noValidate>
          <section>
            <h3 className="text-sm font-semibold text-[var(--cera-navy-950)]">
              Clinic information
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="clinic-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Clinic / hospital name
                </label>

                <input
                  id="clinic-name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4 outline-none focus:border-[var(--cera-blue-600)]"
                  disabled={submitting}
                />
              </div>

              <div>
                <label
                  htmlFor="clinic-type"
                  className="mb-2 block text-sm font-medium"
                >
                  Type
                </label>

                <select
                  id="clinic-type"
                  name="type"
                  value={form.type}
                  onChange={updateField}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4"
                  disabled={submitting}
                >
                  <option value="">Select type</option>

                  {CLINIC_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="clinic-phone"
                  className="mb-2 block text-sm font-medium"
                >
                  Contact phone
                </label>

                <input
                  id="clinic-phone"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={updateField}
                  inputMode="tel"
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                  disabled={submitting}
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="clinic-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email{" "}
                  <span className="font-normal text-[var(--cera-text-muted)]">
                    optional
                  </span>
                </label>

                <input
                  id="clinic-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                  disabled={submitting}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-[var(--cera-navy-950)]">
              Address
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="line1"
                  className="mb-2 block text-sm font-medium"
                >
                  Address line 1
                </label>

                <input
                  id="line1"
                  name="line1"
                  value={form.address.line1}
                  onChange={updateAddress}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="line2"
                  className="mb-2 block text-sm font-medium"
                >
                  Address line 2
                </label>

                <input
                  id="line2"
                  name="line2"
                  value={form.address.line2}
                  onChange={updateAddress}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>

              <div>
                <label
                  htmlFor="locality"
                  className="mb-2 block text-sm font-medium"
                >
                  Locality
                </label>

                <input
                  id="locality"
                  name="locality"
                  value={form.address.locality}
                  onChange={updateAddress}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-sm font-medium"
                >
                  City
                </label>

                <input
                  id="city"
                  name="city"
                  value={form.address.city}
                  onChange={updateAddress}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>

              <div>
                <label
                  htmlFor="district"
                  className="mb-2 block text-sm font-medium"
                >
                  District
                </label>

                <input
                  id="district"
                  name="district"
                  value={form.address.district}
                  onChange={updateAddress}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="mb-2 block text-sm font-medium"
                >
                  State
                </label>

                <input
                  id="state"
                  name="state"
                  value={form.address.state}
                  onChange={updateAddress}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>

              <div>
                <label
                  htmlFor="pincode"
                  className="mb-2 block text-sm font-medium"
                >
                  Pincode
                </label>

                <input
                  id="pincode"
                  name="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.address.pincode}
                  onChange={updateAddress}
                  className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4"
                />
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--cera-border)] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : editing
                  ? "Save changes"
                  : "Create clinic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({ clinic, onClose }) {
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState(USER_ROLES.DOCTOR);

  const [search, setSearch] = useState("");

  const [candidates, setCandidates] = useState([]);

  const [searching, setSearching] = useState(false);

  const [error, setError] = useState(null);

  const [busyUserId, setBusyUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getClinicMembers(clinic.id)
      .then((response) => {
        if (!cancelled) {
          setMembers(response.data.members);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load clinic members.");
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
  }, [clinic.id]);

  async function searchUsers(event) {
    event.preventDefault();

    try {
      setSearching(true);
      setError(null);

      const response = await getAdminUsers({
        search: search.trim(),

        role,

        page: 1,

        limit: 20,
      });

      const memberIds = new Set(
        members.map((membership) => membership.user?.id),
      );

      setCandidates(
        response.data.users.filter(
          (user) =>
            user.status !== USER_STATUS.DISABLED && !memberIds.has(user.id),
        ),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to search users.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(userId) {
    try {
      setBusyUserId(userId);
      setError(null);

      const response = await addClinicMember(clinic.id, userId);

      setMembers((current) => [...current, response.data.membership]);

      setCandidates((current) => current.filter((user) => user.id !== userId));
    } catch (requestError) {
      setError(requestError.message || "Unable to add member.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove(userId) {
    try {
      setBusyUserId(userId);
      setError(null);

      await removeClinicMember(clinic.id, userId);

      setMembers((current) =>
        current.filter((membership) => membership.user?.id !== userId),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to remove member.");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="members-title"
        className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--cera-border)] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[var(--cera-border)] px-6 py-5">
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              Membership
            </p>

            <h2
              id="members-title"
              className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
            >
              {clinic.name}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close members"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        <div className="space-y-8 p-6">
          <section>
            <h3 className="font-semibold text-[var(--cera-navy-950)]">
              Current members
            </h3>

            {loading ? (
              <p className="mt-4 text-sm text-[var(--cera-text-muted)]">
                Loading members...
              </p>
            ) : members.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--cera-border)] p-6 text-center text-sm text-[var(--cera-text-muted)]">
                No doctors or clinic staff assigned yet.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-[var(--cera-border)] rounded-2xl border border-[var(--cera-border)]">
                {members.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="font-medium text-[var(--cera-navy-950)]">
                        {membership.user?.name}
                      </p>

                      <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                        {ROLE_LABELS[membership.user?.role] ||
                          membership.user?.role}
                        {" · "}
                        {membership.user?.phone}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(membership.user.id)}
                      disabled={busyUserId === membership.user?.id}
                      className="text-sm font-medium text-red-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border-t border-[var(--cera-border)] pt-6">
            <h3 className="font-semibold text-[var(--cera-navy-950)]">
              Add member
            </h3>

            <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
              Only Doctors and Clinic Staff can be assigned.
            </p>

            <form
              onSubmit={searchUsers}
              className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]"
            >
              <select
                aria-label="Member role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-3"
              >
                <option value={USER_ROLES.DOCTOR}>Doctor</option>

                <option value={USER_ROLES.CLINIC_STAFF}>Clinic Staff</option>
              </select>

              <input
                aria-label="Search users"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, phone or email"
                className="h-11 rounded-xl border border-[var(--cera-border)] px-4"
              />

              <button
                type="submit"
                disabled={searching}
                className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </form>

            {candidates.length > 0 && (
              <div className="mt-4 divide-y divide-[var(--cera-border)] rounded-2xl border border-[var(--cera-border)]">
                {candidates.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>

                      <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                        {user.phone}

                        {" · "}

                        {user.status === USER_STATUS.INVITED
                          ? "Invited"
                          : "Active"}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={busyUserId === user.id}
                      onClick={() => handleAdd(user.id)}
                      className="text-sm font-semibold text-[var(--cera-blue-600)] disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmClinicAction({ action, busy, onCancel, onConfirm }) {
  const disabling = action.type === "disable";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-[var(--cera-border)] bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold text-[var(--cera-navy-950)]">
          {disabling ? "Disable clinic?" : "Reactivate clinic?"}
        </h2>

        <p className="mt-3 leading-6 text-[var(--cera-text-muted)]">
          {disabling
            ? `${action.name} will no longer be available for new operational work.`
            : `${action.name} will become available again.`}
        </p>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60 ${
              disabling ? "bg-red-600" : "bg-[var(--cera-navy-900)]"
            }`}
          >
            {busy ? "Working..." : disabling ? "Disable" : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminClinicsPage() {
  const [clinics, setClinics] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    status: "",
    page: 1,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [formClinic, setFormClinic] = useState(undefined);

  const [formOpen, setFormOpen] = useState(false);

  const [membersClinic, setMembersClinic] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);

  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getAdminClinics(filters)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setClinics(response.data.clinics);

        setPagination(response.data.pagination);

        setError(null);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message || "Unable to load clinics.");
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
  }, [filters]);

  async function reloadClinics() {
    const response = await getAdminClinics(filters);

    setClinics(response.data.clinics);

    setPagination(response.data.pagination);
  }

  function openCreate() {
    setFormClinic(undefined);

    setFormOpen(true);
  }

  function openEdit(clinic) {
    setFormClinic(clinic);

    setFormOpen(true);
  }

  async function handleSaved() {
    setFormOpen(false);

    setFormClinic(undefined);

    try {
      await reloadClinics();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Clinic saved, but the list could not be refreshed.",
      );
    }
  }

  async function performAction() {
    if (!confirmAction) {
      return;
    }

    try {
      setActionBusy(true);
      setError(null);

      if (confirmAction.type === "disable") {
        await disableClinic(confirmAction.id);
      } else {
        await activateClinic(confirmAction.id);
      }

      await reloadClinics();

      setConfirmAction(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to update clinic.");
    } finally {
      setActionBusy(false);
    }
  }

  function submitSearch(event) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    setFilters((current) => ({
      ...current,

      search: searchInput.trim(),

      page: 1,
    }));
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)]">
      <PortalHeader />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--cera-navy-950)]">
              Clinics
            </h1>

            <p className="mt-2 max-w-2xl text-[var(--cera-text-muted)]">
              Manage clinic and hospital locations, along with Doctor and Clinic
              Staff access.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white"
          >
            + Add clinic
          </button>
        </div>

        <form
          onSubmit={submitSearch}
          className="mt-8 grid gap-3 rounded-2xl border border-[var(--cera-border)] bg-white p-4 md:grid-cols-[1fr_180px_180px_auto]"
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search clinic, city or district"
            className="h-11 rounded-xl border border-[var(--cera-border)] px-4"
          />

          <select
            aria-label="Clinic type"
            value={filters.type}
            onChange={(event) => {
              setLoading(true);

              setFilters((current) => ({
                ...current,

                type: event.target.value,

                page: 1,
              }));
            }}
            className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-3"
          >
            <option value="">All types</option>

            {CLINIC_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Clinic status"
            value={filters.status}
            onChange={(event) => {
              setLoading(true);

              setFilters((current) => ({
                ...current,

                status: event.target.value,

                page: 1,
              }));
            }}
            className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-3"
          >
            <option value="">All statuses</option>

            <option value={CLINIC_STATUS.ACTIVE}>Active</option>

            <option value={CLINIC_STATUS.DISABLED}>Disabled</option>
          </select>

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
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white">
          {loading ? (
            <div className="p-10 text-center text-sm text-[var(--cera-text-muted)]">
              Loading clinics...
            </div>
          ) : clinics.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-[var(--cera-navy-950)]">
                No clinics found
              </p>

              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                Add the first clinic or change your filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--cera-border)]">
              {clinics.map((clinic) => (
                <article key={clinic.id} className="p-5">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-semibold text-[var(--cera-navy-950)]">
                          {clinic.name}
                        </h2>

                        <ClinicStatusBadge status={clinic.status} />
                      </div>

                      <p className="mt-2 text-sm text-[var(--cera-text-muted)]">
                        {CLINIC_TYPE_LABELS[clinic.type] || clinic.type}
                        {" · "}
                        {clinic.address.city}
                        {clinic.address.district &&
                          `, ${clinic.address.district}`}
                      </p>

                      <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                        {clinic.address.line1}
                        {" · "}
                        {clinic.address.pincode}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button
                        type="button"
                        onClick={() => setMembersClinic(clinic)}
                        className="text-sm font-medium text-[var(--cera-blue-600)]"
                      >
                        Members
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(clinic)}
                        className="text-sm font-medium text-[var(--cera-navy-950)]"
                      >
                        Edit
                      </button>

                      {clinic.status === CLINIC_STATUS.ACTIVE ? (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: "disable",
                              id: clinic.id,
                              name: clinic.name,
                            })
                          }
                          className="text-sm font-medium text-red-600"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: "activate",
                              id: clinic.id,
                              name: clinic.name,
                            })
                          }
                          className="text-sm font-medium text-[var(--cera-blue-600)]"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-[var(--cera-text-muted)]">
              {pagination.total} clinics
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => {
                  setLoading(true);

                  setFilters((current) => ({
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
                disabled={filters.page >= pagination.pages}
                onClick={() => {
                  setLoading(true);

                  setFilters((current) => ({
                    ...current,

                    page: current.page + 1,
                  }));
                }}
                className="h-10 rounded-xl border border-[var(--cera-border)] px-4 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <ClinicFormModal
          clinic={formClinic}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {membersClinic && (
        <MembersModal
          clinic={membersClinic}
          onClose={() => setMembersClinic(null)}
        />
      )}

      {confirmAction && (
        <ConfirmClinicAction
          action={confirmAction}
          busy={actionBusy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={performAction}
        />
      )}
    </main>
  );
}
