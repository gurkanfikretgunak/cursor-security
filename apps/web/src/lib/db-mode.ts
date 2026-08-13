export function hasRemoteDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.length > 0 && !/localhost|127\.0\.0\.1/.test(url);
}
