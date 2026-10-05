export function AuthLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cera-background)] px-5">
      <div className="text-center" role="status" aria-live="polite">
        <div
          className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--cera-border)] border-t-[var(--cera-blue-600)]"
          aria-hidden="true"
        />

        <p className="mt-5 text-sm font-medium text-[var(--cera-text-muted)]">
          Preparing your Cera workspace...
        </p>
      </div>
    </main>
  );
}
