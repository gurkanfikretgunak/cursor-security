import { AppError } from "masterfabric-next-sec/errors";

export function hasRemoteDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.length > 0 && !/localhost|127\.0\.0\.1/.test(url);
}

export function requireRemoteDatabase(): void {
  if (!hasRemoteDatabase()) {
    throw new AppError(
      "INTERNAL",
      "Persistence is unavailable until DATABASE_URL is connected.",
      { status: 503 },
    );
  }
}
