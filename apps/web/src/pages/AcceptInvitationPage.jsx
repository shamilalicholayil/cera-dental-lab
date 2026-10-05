import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { acceptInvitation, previewInvitation } from "../api/invitations";

import { ROLE_LABELS } from "../constants/userDisplay";

function readToken() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash).get("token");
}

export function AcceptInvitationPage() {
  const [token] = useState(readToken);

  const [invitation, setInvitation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    /*
     * Remove the raw token from the visible URL
     * after React has captured it.
     */
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }

    async function loadInvitation() {
      if (!token) {
        setError("This invitation link is invalid.");

        setLoading(false);

        return;
      }

      try {
        const response = await previewInvitation(token);

        setInvitation(response.data.invitation);
      } catch {
        setError(
          "This invitation is invalid, expired, revoked, or has already been used.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError(null);

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");

      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    try {
      setSubmitting(true);

      await acceptInvitation({
        token,
        password,
      });

      setCompleted(true);

      setPassword("");

      setConfirmPassword("");
    } catch (requestError) {
      setError(requestError.message || "Unable to activate this account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[var(--cera-navy-950)] lg:flex">
        <div className="flex w-full flex-col justify-between p-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[var(--cera-cyan-400)]">
              Cera
            </p>

            <p className="mt-1 text-sm text-white/60">Dental Lab</p>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--cera-cyan-400)]">
              Secure portal access
            </p>

            <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-white">
              Your Cera workspace starts here.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-white/60">
              Activate your approved account to access the laboratory workflow
              assigned to your role.
            </p>
          </div>

          <p className="text-sm text-white/40">Ceramic &amp; Orthodontics</p>
        </div>
      </section>

      <section className="flex min-h-screen items-center px-5 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-10 lg:hidden">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--cera-blue-600)]">
              Cera
            </p>

            <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
              Dental Lab
            </p>
          </div>

          {loading && (
            <div role="status" className="py-20 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--cera-border)] border-t-[var(--cera-blue-600)]" />

              <p className="mt-5 text-sm text-[var(--cera-text-muted)]">
                Checking your invitation...
              </p>
            </div>
          )}

          {!loading && completed && (
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
                ✓
              </div>

              <p className="mt-6 text-sm font-medium text-[var(--cera-blue-600)]">
                Account activated
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--cera-navy-950)]">
                You're ready to use Cera.
              </h1>

              <p className="mt-4 leading-7 text-[var(--cera-text-muted)]">
                Your password has been created and your account is now active.
              </p>

              <Link
                to="/login"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[var(--cera-navy-900)] px-6 font-semibold text-white"
              >
                Continue to sign in
              </Link>
            </div>
          )}

          {!loading && !completed && !invitation && (
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl text-red-700">
                !
              </div>

              <h1 className="mt-6 text-3xl font-semibold text-[var(--cera-navy-950)]">
                Invitation unavailable
              </h1>

              <p className="mt-4 leading-7 text-[var(--cera-text-muted)]">
                {error}
              </p>

              <Link
                to="/login"
                className="mt-8 inline-flex h-11 items-center rounded-xl border border-[var(--cera-border)] px-5 font-medium"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {!loading && !completed && invitation && (
            <>
              <p className="text-sm font-medium text-[var(--cera-blue-600)]">
                Invitation accepted by Cera
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--cera-navy-950)]">
                Create your password
              </h1>

              <p className="mt-3 leading-7 text-[var(--cera-text-muted)]">
                Confirm your account information and choose a password.
              </p>

              <div className="mt-7 rounded-2xl border border-[var(--cera-border)] bg-white p-5">
                <p className="font-semibold text-[var(--cera-navy-950)]">
                  {invitation.name}
                </p>

                <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
                  {ROLE_LABELS[invitation.role] || invitation.role}
                </p>

                <p className="mt-3 text-sm text-[var(--cera-text-muted)]">
                  {invitation.phone}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
                noValidate
              >
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);

                        setError(null);
                      }}
                      className="h-12 w-full rounded-xl border border-[var(--cera-border)] px-4 pr-16 outline-none focus:border-[var(--cera-blue-600)] focus:ring-4 focus:ring-[var(--cera-blue-500)]/10"
                      placeholder="Minimum 8 characters"
                      disabled={submitting}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-[var(--cera-blue-600)]"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Confirm password
                  </label>

                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);

                      setError(null);
                    }}
                    className="h-12 w-full rounded-xl border border-[var(--cera-border)] px-4 outline-none focus:border-[var(--cera-blue-600)] focus:ring-4 focus:ring-[var(--cera-blue-500)]/10"
                    placeholder="Enter password again"
                    disabled={submitting}
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--cera-navy-900)] font-semibold text-white hover:bg-[var(--cera-navy-800)] disabled:opacity-60"
                >
                  {submitting ? "Activating account..." : "Activate account"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
