"use client";

import { parseGradeData } from "@/lib/parser";
import { SAMPLE_GRADES } from "@/lib/samples";
import type { ParsedCourse } from "@/lib/types";
import { useState } from "react";

type Props = {
  onParse: (courses: ParsedCourse[]) => void;
  onStartBlank: () => void;
};

export function Hero({ onParse, onStartBlank }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    const parsed = parseGradeData(text);
    if (!parsed || parsed.length === 0) {
      setError(
        "Couldn't read that. Try pasting tab-separated rows from your portal — or load a sample below.",
      );
      return;
    }
    onParse(parsed);
  };

  return (
    <div className="py-14">
      <div className="mb-16 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-[pulse_2.4s_ease-in-out_infinite]" />
        <span className="text-[var(--ink)] font-semibold">
          COMEBACK<span className="text-[var(--accent)] px-0.5 font-normal">/</span>PROTOCOL
        </span>
        <span className="text-[var(--muted)]">a grade-planning instrument · est. now</span>
      </div>

      <div className="mb-20 max-w-[1100px]">
        <h1 className="font-display font-normal tracking-[-0.025em] leading-[0.88] text-[clamp(64px,11vw,168px)]">
          <span className="block">Plan your</span>
          <span className="block italic text-[var(--accent)] pl-[0.5em]">academic</span>
          <span className="block">comeback.</span>
        </h1>

        <div className="mt-8 flex gap-6 items-start">
          <div className="mt-3 h-px w-[60px] bg-[var(--ink)]" />
          <p className="max-w-[580px] text-[19px] leading-[1.5] text-[var(--ink-soft)]">
            Paste your grades. We'll show you exactly what you need to score on every assignment left
            to hit the grade you're chasing. No more guessing. No more spiraling at 1am.
          </p>
        </div>
      </div>

      <section className="border-t border-[var(--ink)] pt-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-8">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[13px] font-medium text-[var(--accent)]">01</span>
            <span className="font-display italic text-[28px] font-normal">Drop your grades in</span>
          </div>
          <p className="max-w-[460px] text-[13px] leading-[1.6] text-[var(--muted)]">
            <span className="kbd">⌘C</span> from your gradebook table, then <span className="kbd">⌘V</span>{" "}
            here. Most portals work — Skyward, PowerSchool, Canvas, Infinite Campus. Paste many
            classes at once if you want.
          </p>
        </div>

        <div className="relative border border-[var(--border-strong)] bg-[var(--card-2)] focus-within:ring-4 focus-within:ring-[var(--accent-glow)] focus-within:border-[var(--accent)]">
          <textarea
            className="block w-full min-h-[180px] max-h-[320px] resize-y p-6 font-mono text-[12.5px] leading-[1.7] text-[var(--ink)] placeholder:text-[var(--muted-soft)] outline-none"
            value={text}
            placeholder={`Tests\nweighted at 40%\n09/15/25\tUnit 1 Test\tC+\t\t78 out of 100\n10/22/25\tUnit 2 Test\tC-\t\t72 out of 100\n11/18/25\tUnit 3 Test\t\t\t* out of 100\tmissing\n…`}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            spellCheck={false}
          />

          {(["tl", "tr", "bl", "br"] as const).map((c) => (
            <span key={c} className={`corner corner-${c}`} />
          ))}
        </div>

        {error ? <div className="mt-3 font-mono text-[13px] text-[var(--danger)]">↳ {error}</div> : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="btn-primary"
            onClick={handleParse}
            disabled={!text.trim()}
          >
            <span>Parse my grades</span>
            <span className="font-mono">→</span>
          </button>
          <button className="btn-ghost" onClick={onStartBlank}>
            Start blank
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="font-display italic text-[14px] text-[var(--muted)]">or load sample:</span>
            <button className="chip" onClick={() => { setText(SAMPLE_GRADES.apush); setError(null); }}>
              AP US History
            </button>
            <button className="chip" onClick={() => { setText(SAMPLE_GRADES.calc); setError(null); }}>
              Calc BC
            </button>
            <button className="chip" onClick={() => { setText(SAMPLE_GRADES.chem); setError(null); }}>
              Chemistry
            </button>
            <button className="chip chip-multi" onClick={() => { setText(SAMPLE_GRADES.combined); setError(null); }}>
              2 classes at once
            </button>
          </div>
        </div>
      </section>

      <section className="mt-20 grid grid-cols-1 border-y border-[var(--rule)] md:grid-cols-3">
        {[
          { n: "02", title: "Set your target", body: "Pick the grade you're chasing — A, B+, whatever you need. We do the math." },
          { n: "03", title: "See the path", body: "Every missing assignment becomes a slider. Move them, watch your grade move with you." },
          { n: "04", title: "Stack your classes", body: "Add every class you're climbing back from. One view. Full picture." },
        ].map((s, idx) => (
          <div
            key={s.n}
            className={[
              "py-8 pr-7",
              idx < 2 ? "md:border-r md:border-[var(--rule)]" : "",
              "md:pr-7 md:pl-0",
            ].join(" ")}
          >
            <div className="font-mono text-[11px] tracking-[0.1em] text-[var(--accent)] mb-3">{s.n}</div>
            <div className="font-display italic text-[26px] leading-[1.1] mb-2">{s.title}</div>
            <div className="text-[14px] leading-[1.5] text-[var(--muted)] max-w-[280px]">{s.body}</div>
          </div>
        ))}
      </section>

      <div className="mt-8 flex items-center gap-2 text-[12px] text-[var(--muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ace)]" />
        Your grades sync to your account automatically. No ads. No &quot;premium tier.&quot;
      </div>
    </div>
  );
}

