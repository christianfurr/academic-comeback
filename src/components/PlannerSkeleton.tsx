import { Logo } from "@/components/Logo";

/**
 * Shown while auth resolves and local state hydrates. Mirrors the signed-in
 * shell — topbar, semester summary grid, class tabs, and detail panel — so the
 * layout doesn't jump when real data arrives.
 */
export function PlannerSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-12 max-sm:px-5"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading your planner…</span>

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] py-6">
        <div className="flex items-center gap-2.5">
          <Logo size={28} className="mr-0.5" />
          <span className="font-display italic text-[22px] tracking-[-0.01em] relative top-[1px]">
            Comeback
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="skeleton h-9 w-[180px] rounded-full" />
          <div className="skeleton h-9 w-[84px]" />
          <div className="skeleton h-9 w-9 rounded-full" />
        </div>
      </header>

      <div className="py-8 flex flex-col gap-8">
        <section className="border-t-2 border-[var(--ink)] pt-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="skeleton h-3 w-[120px]" />
            <span className="h-px flex-1 bg-[var(--rule)]" />
            <div className="skeleton h-3 w-[160px]" />
          </div>

          <div className="grid grid-cols-1 overflow-hidden border border-[var(--border)] bg-[var(--card)] sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-[var(--border)] p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
              >
                <div className="skeleton h-3 w-[90px] mb-3" />
                <div className="skeleton h-10 w-[110px] mb-2" />
                <div className="skeleton h-3 w-[130px]" />
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-9 w-[110px] rounded-full" />
          ))}
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="skeleton h-7 w-[220px]" />
            <div className="skeleton h-7 w-[80px]" />
          </div>
          <div className="skeleton h-2 w-full rounded-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-4 w-[64px]" />
              <div className="skeleton h-4 w-[48px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
