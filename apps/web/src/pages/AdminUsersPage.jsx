import { useCallback, useEffect, useState } from "react";

import { USER_STATUS } from "@cera/shared";

import {
  activateAdminUser,
  disableAdminUser,
  getAdminUsers,
} from "../api/adminUsers";

import {
  createInvitation,
  getInvitations,
  regenerateInvitation,
  revokeInvitation,
} from "../api/invitations";

import { PortalHeader } from "../components/portal/PortalHeader";

import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  STATUS_LABELS,
} from "../constants/userDisplay";

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",

    INVITED: "bg-blue-50 text-blue-700 border-blue-200",

    DISABLED: "bg-slate-100 text-slate-600 border-slate-200",

    PENDING: "bg-amber-50 text-amber-700 border-amber-200",

    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",

    REVOKED: "bg-slate-100 text-slate-600 border-slate-200",

    EXPIRED: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] || styles.DISABLED
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function InviteModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    setError(null);

    if (!form.name.trim() || !form.phone.trim() || !form.role) {
      setError("Name, phone number and role are required.");

      return;
    }

    try {
      setSubmitting(true);

      const response = await createInvitation({
        name: form.name.trim(),

        phone: form.phone.trim(),

        email: form.email.trim(),

        role: form.role,
      });

      onCreated(response.data);
    } catch (requestError) {
      setError(requestError.message || "Unable to create invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-3xl border border-[var(--cera-border)] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
      >
        <div className="flex items-start justify-between border-b border-[var(--cera-border)] px-6 py-5">
          <div>
            <p className="text-sm font-medium text-[var(--cera-blue-600)]">
              People
            </p>

            <h2
              id="invite-title"
              className="mt-1 text-xl font-semibold text-[var(--cera-navy-950)]"
            >
              Invite a user
            </h2>

            <p className="mt-1 text-sm leading-6 text-[var(--cera-text-muted)]">
              Create an approved Cera portal account.
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close invitation form"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6" noValidate>
          <div>
            <label
              htmlFor="invite-name"
              className="mb-2 block text-sm font-medium"
            >
              Full name
            </label>

            <input
              id="invite-name"
              name="name"
              value={form.name}
              onChange={updateField}
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4 outline-none focus:border-[var(--cera-blue-600)] focus:ring-4 focus:ring-[var(--cera-blue-500)]/10"
              placeholder="Dr. Example"
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="invite-phone"
              className="mb-2 block text-sm font-medium"
            >
              Mobile number
            </label>

            <input
              id="invite-phone"
              name="phone"
              value={form.phone}
              onChange={updateField}
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4 outline-none focus:border-[var(--cera-blue-600)] focus:ring-4 focus:ring-[var(--cera-blue-500)]/10"
              placeholder="98765 43210"
              inputMode="tel"
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="invite-email"
              className="mb-2 block text-sm font-medium"
            >
              Email{" "}
              <span className="font-normal text-[var(--cera-text-muted)]">
                optional
              </span>
            </label>

            <input
              id="invite-email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] px-4 outline-none focus:border-[var(--cera-blue-600)] focus:ring-4 focus:ring-[var(--cera-blue-500)]/10"
              placeholder="doctor@example.com"
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="invite-role"
              className="mb-2 block text-sm font-medium"
            >
              Role
            </label>

            <select
              id="invite-role"
              name="role"
              value={form.role}
              onChange={updateField}
              className="h-11 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4 outline-none focus:border-[var(--cera-blue-600)] focus:ring-4 focus:ring-[var(--cera-blue-500)]/10"
              disabled={submitting}
            >
              <option value="">Select role</option>

              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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
              className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium hover:bg-slate-50"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white hover:bg-[var(--cera-navy-800)] disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteLinkModal({ inviteUrl, onClose }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);

      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-3xl border border-[var(--cera-border)] bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-link-title"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-lg text-emerald-700">
          ✓
        </div>

        <h2
          id="invite-link-title"
          className="mt-5 text-2xl font-semibold text-[var(--cera-navy-950)]"
        >
          Invitation ready
        </h2>

        <p className="mt-2 leading-6 text-[var(--cera-text-muted)]">
          Send this link to the invited user. The raw invitation token is shown
          only when the invitation is created or regenerated.
        </p>

        <div className="mt-5 break-all rounded-xl border border-[var(--cera-border)] bg-[var(--cera-background)] p-4 text-sm">
          {inviteUrl}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
          >
            Close
          </button>

          <button
            type="button"
            onClick={copyLink}
            className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  busy,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-[var(--cera-border)] bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold text-[var(--cera-navy-950)]">
          {title}
        </h2>

        <p className="mt-3 leading-6 text-[var(--cera-text-muted)]">
          {message}
        </p>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium"
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60 ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[var(--cera-navy-900)] hover:bg-[var(--cera-navy-800)]"
            }`}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState("users");

  const [users, setUsers] = useState([]);

  const [invitations, setInvitations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    page: 1,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [showInvite, setShowInvite] = useState(false);

  const [inviteUrl, setInviteUrl] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);

  const [actionBusy, setActionBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const response = await getAdminUsers(filters);

      setUsers(response.data.users);

      setPagination(response.data.pagination);

      setError(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadInvitations = useCallback(async () => {
    try {
      const response = await getInvitations();

      setInvitations(response.data.invitations);

      setError(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to load invitations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const request =
      activeTab === "users" ? getAdminUsers(filters) : getInvitations();

    request
      .then((response) => {
        if (cancelled) {
          return;
        }

        if (activeTab === "users") {
          setUsers(response.data.users);

          setPagination(response.data.pagination);
        } else {
          setInvitations(response.data.invitations);
        }

        setError(null);
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setError(
          requestError.message ||
            (activeTab === "users"
              ? "Unable to load users."
              : "Unable to load invitations."),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, filters]);

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

  async function handleInviteCreated(data) {
    setShowInvite(false);

    setInviteUrl(data.inviteUrl);

    await loadInvitations();

    if (activeTab === "users") {
      await loadUsers();
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
        await disableAdminUser(confirmAction.id);

        await loadUsers();
      }

      if (confirmAction.type === "activate") {
        await activateAdminUser(confirmAction.id);

        await loadUsers();
      }

      if (confirmAction.type === "revoke") {
        await revokeInvitation(confirmAction.id);

        await loadInvitations();
      }

      if (confirmAction.type === "regenerate") {
        const response = await regenerateInvitation(confirmAction.id);

        setInviteUrl(response.data.inviteUrl);

        await loadInvitations();
      }

      setConfirmAction(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to complete action.");
    } finally {
      setActionBusy(false);
    }
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
              People
            </h1>

            <p className="mt-2 max-w-2xl text-[var(--cera-text-muted)]">
              Manage Cera portal accounts and invitation access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="h-11 rounded-xl bg-[var(--cera-navy-900)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--cera-navy-800)]"
          >
            + Invite user
          </button>
        </div>

        <div className="mt-8 border-b border-[var(--cera-border)]">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(null);
                setActiveTab("users");
              }}
              className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                activeTab === "users"
                  ? "border-[var(--cera-blue-600)] text-[var(--cera-navy-950)]"
                  : "border-transparent text-[var(--cera-text-muted)]"
              }`}
            >
              Users
            </button>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(null);
                setActiveTab("invitations");
              }}
              className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                activeTab === "invitations"
                  ? "border-[var(--cera-blue-600)] text-[var(--cera-navy-950)]"
                  : "border-transparent text-[var(--cera-text-muted)]"
              }`}
            >
              Invitations
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {activeTab === "users" && (
          <>
            <form
              onSubmit={submitSearch}
              className="mt-6 grid gap-3 rounded-2xl border border-[var(--cera-border)] bg-white p-4 md:grid-cols-[1fr_200px_180px_auto]"
            >
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name, phone or email"
                className="h-11 rounded-xl border border-[var(--cera-border)] px-4 outline-none focus:border-[var(--cera-blue-600)]"
              />

              <select
                value={filters.role}
                onChange={(event) => {
                  setLoading(true);
                  setError(null);

                  setFilters((current) => ({
                    ...current,

                    role: event.target.value,

                    page: 1,
                  }));
                }}
                className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-3"
              >
                <option value="">All roles</option>

                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(event) => {
                  setLoading(true);
                  setError(null);

                  setFilters((current) => ({
                    ...current,

                    status: event.target.value,

                    page: 1,
                  }));
                }}
                className="h-11 rounded-xl border border-[var(--cera-border)] bg-white px-3"
              >
                <option value="">All statuses</option>

                <option value={USER_STATUS.ACTIVE}>Active</option>

                <option value={USER_STATUS.INVITED}>Invited</option>

                <option value={USER_STATUS.DISABLED}>Disabled</option>
              </select>

              <button
                type="submit"
                className="h-11 rounded-xl border border-[var(--cera-border)] px-5 text-sm font-medium hover:bg-slate-50"
              >
                Search
              </button>
            </form>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white">
              {loading ? (
                <div className="p-10 text-center text-sm text-[var(--cera-text-muted)]">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="font-medium text-[var(--cera-navy-950)]">
                    No users found
                  </p>

                  <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                    Try changing the search or filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-[var(--cera-text-muted)]">
                        <tr>
                          <th className="px-5 py-3">User</th>

                          <th className="px-5 py-3">Role</th>

                          <th className="px-5 py-3">Status</th>

                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[var(--cera-border)]">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-5 py-4">
                              <p className="font-medium text-[var(--cera-navy-950)]">
                                {user.name}
                              </p>

                              <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                                {user.phone}

                                {user.email && ` · ${user.email}`}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm">
                              {ROLE_LABELS[user.role] || user.role}
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge status={user.status} />
                            </td>

                            <td className="px-5 py-4 text-right">
                              {user.status === USER_STATUS.ACTIVE && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmAction({
                                      type: "disable",
                                      id: user.id,
                                      name: user.name,
                                    })
                                  }
                                  className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                  Disable
                                </button>
                              )}

                              {user.status === USER_STATUS.DISABLED && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmAction({
                                      type: "activate",
                                      id: user.id,
                                      name: user.name,
                                    })
                                  }
                                  className="text-sm font-medium text-[var(--cera-blue-600)]"
                                >
                                  Reactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-[var(--cera-border)] md:hidden">
                    {users.map((user) => (
                      <div key={user.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{user.name}</p>

                            <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                              {ROLE_LABELS[user.role] || user.role}
                            </p>
                          </div>

                          <StatusBadge status={user.status} />
                        </div>

                        <p className="mt-3 text-sm text-[var(--cera-text-muted)]">
                          {user.phone}
                        </p>

                        {user.email && (
                          <p className="mt-1 break-all text-sm text-[var(--cera-text-muted)]">
                            {user.email}
                          </p>
                        )}

                        <div className="mt-4">
                          {user.status === USER_STATUS.ACTIVE && (
                            <button
                              type="button"
                              className="text-sm font-medium text-red-600"
                              onClick={() =>
                                setConfirmAction({
                                  type: "disable",
                                  id: user.id,
                                  name: user.name,
                                })
                              }
                            >
                              Disable account
                            </button>
                          )}

                          {user.status === USER_STATUS.DISABLED && (
                            <button
                              type="button"
                              className="text-sm font-medium text-[var(--cera-blue-600)]"
                              onClick={() =>
                                setConfirmAction({
                                  type: "activate",
                                  id: user.id,
                                  name: user.name,
                                })
                              }
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {pagination.pages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <p className="text-sm text-[var(--cera-text-muted)]">
                  {pagination.total} users
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
          </>
        )}

        {activeTab === "invitations" && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--cera-border)] bg-white">
            {loading ? (
              <div className="p-10 text-center text-sm text-[var(--cera-text-muted)]">
                Loading invitations...
              </div>
            ) : invitations.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-medium">No invitations</p>

                <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                  Create an invitation to add the first portal user.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--cera-border)]">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-medium text-[var(--cera-navy-950)]">
                            {invitation.user?.name}
                          </p>

                          <StatusBadge status={invitation.status} />
                        </div>

                        <p className="mt-2 text-sm text-[var(--cera-text-muted)]">
                          {ROLE_LABELS[invitation.user?.role] ||
                            invitation.user?.role}
                        </p>

                        <p className="mt-1 text-xs text-[var(--cera-text-muted)]">
                          Created {formatDate(invitation.createdAt)}
                          {" · "}
                          Expires {formatDate(invitation.expiresAt)}
                        </p>
                      </div>

                      {invitation.status === "PENDING" && (
                        <div className="flex gap-4">
                          <button
                            type="button"
                            className="text-sm font-medium text-[var(--cera-blue-600)]"
                            onClick={() =>
                              setConfirmAction({
                                type: "regenerate",
                                id: invitation.id,
                              })
                            }
                          >
                            New link
                          </button>

                          <button
                            type="button"
                            className="text-sm font-medium text-red-600"
                            onClick={() =>
                              setConfirmAction({
                                type: "revoke",
                                id: invitation.id,
                              })
                            }
                          >
                            Revoke
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onCreated={handleInviteCreated}
        />
      )}

      {inviteUrl && (
        <InviteLinkModal
          inviteUrl={inviteUrl}
          onClose={() => setInviteUrl(null)}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          busy={actionBusy}
          danger={
            confirmAction.type === "disable" || confirmAction.type === "revoke"
          }
          title={
            confirmAction.type === "disable"
              ? "Disable account?"
              : confirmAction.type === "activate"
                ? "Reactivate account?"
                : confirmAction.type === "revoke"
                  ? "Revoke invitation?"
                  : "Generate a new invitation link?"
          }
          message={
            confirmAction.type === "disable"
              ? `${confirmAction.name} will immediately lose access to protected Cera operations.`
              : confirmAction.type === "activate"
                ? `${confirmAction.name} will regain access using their existing password.`
                : confirmAction.type === "revoke"
                  ? "The current invitation link will stop working."
                  : "The existing pending link will stop working and a new link will be generated."
          }
          confirmLabel={
            confirmAction.type === "disable"
              ? "Disable"
              : confirmAction.type === "activate"
                ? "Reactivate"
                : confirmAction.type === "revoke"
                  ? "Revoke"
                  : "Generate new link"
          }
          onCancel={() => setConfirmAction(null)}
          onConfirm={performAction}
        />
      )}
    </main>
  );
}
