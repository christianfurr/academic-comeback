"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  widthClassName?: string;
  ariaLabel?: string;
};

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  placeholder,
  widthClassName,
  ariaLabel,
}: Props) {
  const [draft, setDraft] = useState(
    value === null || value === undefined ? "" : String(value),
  );

  useEffect(() => {
    setDraft(value === null || value === undefined ? "" : String(value));
  }, [value]);

  const commit = () => {
    const t = draft.trim();
    if (t === "" || t === "-") {
      onChange(null);
      return;
    }
    let n = Number.parseFloat(t);
    if (!Number.isFinite(n)) {
      setDraft(value === null ? "" : String(value));
      return;
    }
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    if (step > 0) {
      const snapped = Math.round(n / step) * step;
      n = snapped;
    }
    onChange(n);
  };

  return (
    <span className={["inline-flex items-baseline gap-1", widthClassName].filter(Boolean).join(" ")}>
      <input
        aria-label={ariaLabel ?? "Number input"}
        className={[
          "text-right font-mono text-[13px]",
          "px-1.5 py-0.5 rounded-sm",
          "bg-[rgba(255,255,255,0.06)]",
          "border border-transparent",
          "focus:border-[var(--accent)] focus:bg-[color:var(--accent-soft)] focus:outline-none",
          "w-full min-w-8 max-w-[72px]",
        ].join(" ")}
        type="text"
        inputMode="decimal"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {suffix ? <span className="font-mono text-[11px] text-[var(--muted)]">{suffix}</span> : null}
    </span>
  );
}

