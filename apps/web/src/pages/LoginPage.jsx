import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useLocation, useNavigate } from "react-router-dom";

import { clearAuthError, login } from "../features/auth/authSlice";

import {
  selectAuthError,
  selectAuthStatus,
} from "../features/auth/authSelectors";

function getLoginError(error) {
  if (!error) {
    return null;
  }

  if (error.code === "AUTHENTICATION_FAILED") {
    return {
      message: "The phone number, email, or password is incorrect.",

      requestId: null,
    };
  }

  if (error.code === "TOO_MANY_LOGIN_ATTEMPTS") {
    return {
      message:
        "Too many sign-in attempts. Please wait a few minutes and try again.",

      requestId: error.requestId,
    };
  }

  if (error.code === "VALIDATION_ERROR") {
    return {
      message: error.message || "Please check the information you entered.",

      requestId: error.requestId,
    };
  }

  if (error.code === "NETWORK_ERROR") {
    return {
      message:
        "Unable to reach Cera right now. Check your internet connection and try again.",

      requestId: null,
    };
  }

  return {
    message: "We couldn't sign you in. Please try again.",

    requestId: error.requestId || null,
  };
}

export function LoginPage() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const location = useLocation();

  const authStatus = useSelector(selectAuthStatus);

  const authError = useSelector(selectAuthError);

  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState(null);

  const submitting = authStatus === "loading";

  const mappedAuthError = getLoginError(authError);

  const displayError = formError || mappedAuthError?.message || null;

  const displayRequestId = formError
    ? null
    : mappedAuthError?.requestId || null;

  function clearErrors() {
    setFormError(null);

    if (authError) {
      dispatch(clearAuthError());
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    clearErrors();

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setFormError("Enter your phone number or email.");

      return;
    }

    if (!password) {
      setFormError("Enter your password.");

      return;
    }

    const resultAction = await dispatch(
      login({
        identifier: cleanIdentifier,

        password,
      }),
    );

    if (login.fulfilled.match(resultAction)) {
      setPassword("");

      const destination = location.state?.from?.pathname || "/portal";

      navigate(destination, {
        replace: true,
      });
    }
  }

  return (
    <main className="min-h-screen bg-[var(--cera-background)] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--cera-navy-950)] lg:flex">
        <div
          className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-[var(--cera-blue-500)]/15 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="absolute bottom-[-120px] right-[-100px] h-96 w-96 rounded-full bg-[var(--cera-cyan-400)]/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-14 xl:p-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--cera-cyan-400)]">
              Cera
            </p>

            <p className="mt-1 text-sm text-white/60">Dental Lab</p>
          </div>

          <div className="max-w-xl">
            <p className="mb-5 text-sm font-medium text-[var(--cera-cyan-400)]">
              Digital laboratory workflow
            </p>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.03em] text-white xl:text-6xl">
              Precision without unnecessary work.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
              Submit lab slips, coordinate scanning, and follow Cera work from
              one secure workspace.
            </p>
          </div>

          <p className="text-sm text-white/45">Ceramic &amp; Orthodontics</p>
        </div>
      </section>

      <section className="flex min-h-screen items-center px-5 py-10 sm:px-8 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--cera-blue-600)]">
              Cera
            </p>

            <p className="mt-1 text-sm text-[var(--cera-text-muted)]">
              Dental Lab
            </p>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-[var(--cera-blue-600)]">
              Secure portal
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[var(--cera-navy-950)] sm:text-4xl">
              Sign in to Cera
            </h1>

            <p className="mt-3 leading-7 text-[var(--cera-text-muted)]">
              Use the phone number or email connected to your Cera account.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-[var(--cera-text)]"
                htmlFor="identifier"
              >
                Phone number or email
              </label>

              <input
                className="h-12 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4 text-[var(--cera-text)] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[var(--cera-blue-600)] focus:ring-4 focus:ring-[var(--cera-blue-500)]/10 disabled:bg-slate-50"
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                inputMode="text"
                placeholder="98765 43210 or doctor@example.com"
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);

                  clearErrors();
                }}
                disabled={submitting}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  className="block text-sm font-medium text-[var(--cera-text)]"
                  htmlFor="password"
                >
                  Password
                </label>

                <span className="text-sm text-[var(--cera-text-muted)]">
                  Forgot password?
                </span>
              </div>

              <div className="relative">
                <input
                  className="h-12 w-full rounded-xl border border-[var(--cera-border)] bg-white px-4 pr-16 text-[var(--cera-text)] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[var(--cera-blue-600)] focus:ring-4 focus:ring-[var(--cera-blue-500)]/10 disabled:bg-slate-50"
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);

                    clearErrors();
                  }}
                  disabled={submitting}
                />

                <button
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-medium text-[var(--cera-blue-600)] hover:text-[var(--cera-navy-900)] focus-visible:outline-none"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {displayError && (
              <div
                className="rounded-xl border border-red-200 bg-[var(--cera-danger-bg)] px-4 py-3"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm font-medium text-[var(--cera-danger)]">
                  {displayError}
                </p>

                {displayRequestId && (
                  <p className="mt-1 text-xs text-[var(--cera-danger)]/75">
                    Reference: {displayRequestId}
                  </p>
                )}
              </div>
            )}

            <button
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--cera-navy-900)] px-5 font-semibold text-white shadow-sm transition hover:bg-[var(--cera-navy-800)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--cera-blue-500)]/25 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                    aria-hidden="true"
                  />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm leading-6 text-[var(--cera-text-muted)]">
            Cera portal access is provided to approved doctors, clinics, and
            staff.
          </p>
        </div>
      </section>
    </main>
  );
}
