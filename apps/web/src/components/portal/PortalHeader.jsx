import { UserMenu } from "./UserMenu";

export function PortalHeader() {
  return (
    <header className="border-b border-[var(--cera-border)] bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--cera-blue-600)]">
            Cera
          </p>

          <p className="text-[11px] text-[var(--cera-text-muted)]">
            Dental Lab
          </p>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
