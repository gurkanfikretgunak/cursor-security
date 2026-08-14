import { AppError } from "masterfabric-next-sec/errors";

export type BackendUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export function backendOrigin(): string | null {
  const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) return null;
  return url.replace(/\/$/, "");
}

export function hasGoBackend(): boolean {
  return backendOrigin() !== null;
}

export async function goRequest<T>(
  user: BackendUser,
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const origin = backendOrigin();
  if (!origin) return null;

  const headers = new Headers(init.headers);
  headers.set("X-User-Id", user.id);
  if (user.email) headers.set("X-User-Email", user.email);
  if (user.name) headers.set("X-User-Name", user.name);
  const serviceKey = process.env.BACKEND_SERVICE_KEY;
  if (serviceKey) headers.set("X-Service-Key", serviceKey);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${origin}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 503 || response.status === 401) {
      return null;
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new AppError(
        response.status === 403 ? "FORBIDDEN" : "INTERNAL",
        body.error ?? "Go backend request failed",
        { status: response.status },
      );
    }
    if (response.status === 204) return {} as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    return null;
  }
}
