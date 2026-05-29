import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-12 max-sm:px-5">
      <header className="flex items-center gap-2.5 border-b border-[var(--rule)] py-6">
        <Logo size={28} className="mr-0.5" />
        <span className="font-display italic text-[22px] tracking-[-0.01em] relative top-[1px]">
          Comeback
        </span>
        <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          / academic recovery planner
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-20">
        <div className="mb-8 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-[pulse_2.4s_ease-in-out_infinite]" />
          <span className="text-[var(--ink)] font-semibold">ERROR 404</span>
          <span>this page took an L</span>
        </div>

        <h1 className="font-display font-normal tracking-[-0.025em] leading-[0.88] text-[clamp(64px,11vw,168px)]">
          <span className="block">Page not</span>
          <span className="block italic text-[var(--accent)] pl-[0.5em]">found.</span>
        </h1>

        <div className="mt-8 flex gap-6 items-start">
          <div className="mt-3 h-px w-[60px] bg-[var(--ink)]" />
          <p className="max-w-[560px] text-[19px] leading-[1.5] text-[var(--ink-soft)]">
            The page you&apos;re after doesn&apos;t exist — or it moved. No spiraling. Head back to
            your planner and pick up where you left off.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/" className="btn-primary">
            <span>Back to the planner</span>
            <span className="font-mono">→</span>
          </Link>
        </div>
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
        </div>
      </footer>
    </div>
  );
}
