import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveGo() {
  try {
    execFileSync("go", ["version"], { stdio: "ignore" });
    return "go";
  } catch {
    // Render's current service is still the Node runtime; bootstrap a Go SDK.
  }
  const cache = process.env.GO_BOOTSTRAP_DIR || "/tmp/go-sdk";
  const bin = path.join(cache, "go", "bin", "go");
  if (!existsSync(bin)) {
    mkdirSync(cache, { recursive: true });
    const url = process.env.GO_TARBALL_URL || "https://go.dev/dl/go1.23.6.linux-amd64.tar.gz";
    execSync(`curl -fsSL ${url} | tar -C ${cache} -xz`, { stdio: "inherit" });
  }
  return bin;
}

const go = resolveGo();
execFileSync(go, ["build", "-o", "bin/server", "./cmd/server"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, GOTOOLCHAIN: "local" },
});

mkdirSync(path.join(root, "dist"), { recursive: true });
writeFileSync(
  path.join(root, "dist", "server.js"),
  `import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const bin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "server");
const child = spawn(bin, { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
`,
);
