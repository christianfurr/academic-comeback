"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  ariaLabel?: string;
};

export function EditableText({
  value,
  onChange,
  className,
  placeholder,
  maxLength,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!editing) return;
    ref.current?.focus();
    ref.current?.select();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={ref}
        aria-label={ariaLabel ?? "Edit text"}
        className={[
          "bg-[var(--bg)] text-[var(--ink)]",
          "border-b border-[var(--accent)]",
          "px-1 py-0.5 -mx-1 -my-0.5",
          "outline-none",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        value={draft}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const next = (draft || "").trim() || value;
          onChange(next);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const next = (draft || "").trim() || value;
            onChange(next);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      title="Click to edit"
      className={[
        "cursor-text",
        "px-1 py-0.5 -mx-1 -my-0.5 rounded",
        "transition-colors",
        "hover:bg-[color:var(--accent-soft)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel ?? "Edit text"}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
    >
      {value ? (
        value
      ) : (
        <span className="text-[var(--muted)] italic">{placeholder}</span>
      )}
    </span>
  );
}

