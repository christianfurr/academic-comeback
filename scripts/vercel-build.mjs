import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  run("bunx", ["convex", "deploy"]);
} else {
  console.log("Skipping Convex deployment for this Vercel preview.");
}

run("bun", ["run", "build"]);
