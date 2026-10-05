const rows = [
  {
    label: "Upper",

    left: ["UR8", "UR7", "UR6", "UR5", "UR4", "UR3", "UR2", "UR1"],

    right: ["UL1", "UL2", "UL3", "UL4", "UL5", "UL6", "UL7", "UL8"],
  },

  {
    label: "Lower",

    left: ["LR8", "LR7", "LR6", "LR5", "LR4", "LR3", "LR2", "LR1"],

    right: ["LL1", "LL2", "LL3", "LL4", "LL5", "LL6", "LL7", "LL8"],
  },
];

function displayTooth(tooth) {
  return tooth.slice(2);
}

export function ToothSelector({ value, onChange }) {
  function toggle(tooth) {
    if (value.includes(tooth)) {
      onChange(value.filter((current) => current !== tooth));

      return;
    }

    onChange([...value, tooth]);
  }

  return (
    <div className="space-y-5">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--cera-text-muted)]">
            {row.label}
          </p>

          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-1.5">
              {row.left.map((tooth) => (
                <button
                  key={tooth}
                  type="button"
                  aria-label={`Tooth ${tooth}`}
                  aria-pressed={value.includes(tooth)}
                  onClick={() => toggle(tooth)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                    value.includes(tooth)
                      ? "border-[var(--cera-blue-600)] bg-[var(--cera-blue-600)] text-white"
                      : "border-[var(--cera-border)] bg-white text-[var(--cera-navy-950)] hover:border-[var(--cera-blue-500)]"
                  }`}
                >
                  {displayTooth(tooth)}
                </button>
              ))}

              <div className="mx-1 h-8 w-px bg-[var(--cera-border)]" />

              {row.right.map((tooth) => (
                <button
                  key={tooth}
                  type="button"
                  aria-label={`Tooth ${tooth}`}
                  aria-pressed={value.includes(tooth)}
                  onClick={() => toggle(tooth)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                    value.includes(tooth)
                      ? "border-[var(--cera-blue-600)] bg-[var(--cera-blue-600)] text-white"
                      : "border-[var(--cera-border)] bg-white text-[var(--cera-navy-950)] hover:border-[var(--cera-blue-500)]"
                  }`}
                >
                  {displayTooth(tooth)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {value.length > 0 && (
        <p className="text-xs text-[var(--cera-text-muted)]">
          Selected: {value.join(", ")}
        </p>
      )}
    </div>
  );
}
