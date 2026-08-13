import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (!url || /localhost|127\.0\.0\.1/.test(url)) {
  console.log("Skipping migrate: DATABASE_URL is not a remote database");
  process.exit(0);
}

const result = spawnSync("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
