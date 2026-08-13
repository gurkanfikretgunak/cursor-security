import http from "node:http";
import postgres from "postgres";

const port = Number(process.env.PORT ?? 10000);
const frontendOrigin =
  process.env.FRONTEND_ORIGIN ?? "https://gurkan-cursor-security.vercel.app";
const databaseUrl = process.env.DATABASE_URL;
const useSsl =
  process.env.DATABASE_SSL === "false"
    ? false
    : process.env.NODE_ENV === "production" ||
      /render\.com|sslmode=require/i.test(databaseUrl ?? "");

function applyCors(res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", frontendOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function databaseStatus(): Promise<"connected" | "disconnected" | "error"> {
  if (!databaseUrl) return "disconnected";
  const sql = postgres(databaseUrl, {
    max: 1,
    ssl: useSsl ? "require" : false,
    connect_timeout: 8,
  });
  try {
    await sql`select 1 as ok`;
    return "connected";
  } catch {
    return "error";
  } finally {
    await sql.end({ timeout: 2 });
  }
}

const server = http.createServer((req, res) => {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    json(res, 200, { ok: true, service: "cursor-security-api" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/v1/status") {
    void databaseStatus().then((database) => {
      json(res, database === "connected" ? 200 : 503, {
        ok: database === "connected",
        service: "cursor-security-api",
        database,
        frontend: frontendOrigin,
      });
    });
    return;
  }

  json(res, 404, { error: "not_found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`cursor-security-api listening on 0.0.0.0:${port}`);
});
