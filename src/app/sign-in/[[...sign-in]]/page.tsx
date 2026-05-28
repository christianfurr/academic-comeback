import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-12 max-sm:px-5 py-16">
      <div className="mb-10">
        <h1 className="font-display italic text-[40px] leading-[1.1] tracking-[-0.02em]">
          Sign in.
        </h1>
        <p className="mt-2 text-[14.5px] leading-[1.5] text-[var(--muted)]">
          Your planner can stay local-only, or sync later with Convex.
        </p>
      </div>
      <SignIn appearance={{ elements: { card: "shadow-none border border-[var(--border)] bg-[var(--card)]" } }} />
    </div>
  );
}

