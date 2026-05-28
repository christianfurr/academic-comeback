"use client";

import { Logo } from "@/components/Logo";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

const STEPS = [
  {
    n: "01",
    title: "Drop your grades in",
    body: "Paste any portal table — Skyward, PowerSchool, Canvas, Infinite Campus. One class or all of them at once.",
  },
  {
    n: "02",
    title: "Set your target",
    body: "Pick the grade you're chasing — A, B+, whatever you need. The math runs in the background.",
  },
  {
    n: "03",
    title: "See the path",
    body: "Every missing assignment becomes a slider. Move them around. Watch your grade move with you.",
  },
];

export function SignedOutLanding() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-12 max-sm:px-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] py-6">
        <div className="flex items-center gap-2.5">
          <Logo size={28} className="mr-0.5" />
          <span className="font-display italic text-[22px] tracking-[-0.01em] relative top-[1px]">Comeback</span>
          <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            / academic recovery planner
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <SignInButton mode="modal">
            <button className="btn-ghost">Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn-primary">
              <span>Get started</span>
              <span className="font-mono">→</span>
            </button>
          </SignUpButton>
        </div>
      </header>

      <section className="py-14">
        <div className="mb-12 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-[pulse_2.4s_ease-in-out_infinite]" />
          <span className="text-[var(--ink)] font-semibold">
            COMEBACK<span className="text-[var(--accent)] px-0.5 font-normal">/</span>PROTOCOL
          </span>
          <span className="text-[var(--muted)]">a grade-planning instrument · est. now</span>
        </div>

        <div className="mb-16 max-w-[1100px]">
          <h1 className="font-display font-normal tracking-[-0.025em] leading-[0.88] text-[clamp(64px,11vw,168px)]">
            <span className="block">Plan your</span>
            <span className="block italic text-[var(--accent)] pl-[0.5em]">academic</span>
            <span className="block">comeback.</span>
          </h1>

          <div className="mt-8 flex gap-6 items-start">
            <div className="mt-3 h-px w-[60px] bg-[var(--ink)]" />
            <p className="max-w-[580px] text-[19px] leading-[1.5] text-[var(--ink-soft)]">
              Paste your grades. See exactly what you need to score on every assignment left to hit the
              grade you&apos;re chasing. No more guessing. No more spiraling at 1am.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <SignUpButton mode="modal">
            <button className="btn-primary">
              <span>Start planning — free</span>
              <span className="font-mono">→</span>
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="btn-ghost">I already have an account</button>
          </SignInButton>
          <div className="flex items-center gap-2 text-[12px] text-[var(--muted)] ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ace)]" />
            Cloud sync across devices. No ads. No premium tier.
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 border-y border-[var(--rule)] md:grid-cols-3">
        {STEPS.map((s, idx) => (
          <div
            key={s.n}
            className={[
              "py-8 pr-7",
              idx < STEPS.length - 1 ? "md:border-r md:border-[var(--rule)]" : "",
              "md:pr-7 md:pl-0",
            ].join(" ")}
          >
            <div className="font-mono text-[11px] tracking-[0.1em] text-[var(--accent)] mb-3">
              {s.n}
            </div>
            <div className="font-display italic text-[26px] leading-[1.1] mb-2">{s.title}</div>
            <div className="text-[14px] leading-[1.5] text-[var(--muted)] max-w-[320px]">
              {s.body}
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-auto border-t border-[var(--rule)] py-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="inline-flex items-center gap-2 font-display italic text-[16px]">
            <Logo size={20} />
            <strong className="font-semibold not-italic">Comeback / Protocol</strong>
          </div>
          <div className="text-[12px] text-[var(--muted)] flex-1">
            Built for the 1am spiral. Use the slider. Make the plan. Sleep.
          </div>
          <div className="font-mono text-[11px] tracking-[0.04em] text-[var(--muted)]">
            Built by{" "}
            <a
              href="https://christianfurr.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--ink-soft)] underline decoration-[var(--border-strong)] underline-offset-2 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
            >
              Christian Furr
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
