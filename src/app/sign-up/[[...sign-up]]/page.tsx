import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-12 max-sm:px-5 py-16">
      <div className="mb-10">
        <h1 className="font-display italic text-[40px] leading-[1.1] tracking-[-0.02em]">
          Create your account.
        </h1>
        <p className="mt-2 text-[14.5px] leading-[1.5] text-[var(--muted)]">
          Sign up to enable save/restore across devices later.
        </p>
      </div>
      <SignUp appearance={{ elements: { card: "shadow-none border border-[var(--border)] bg-[var(--card)]" } }} />
    </div>
  );
}

