import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "bin", "server");
if (!existsSync(bin)) {
  console.error("missing Go binary; run npm run build -w @cursor-security/api");
  process.exit(1);
}
const child = spawn(bin, { stdio: "inherit", cwd: root });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
