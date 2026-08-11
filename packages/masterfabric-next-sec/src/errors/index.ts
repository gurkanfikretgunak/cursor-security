export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly publicMessage: string;
  readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    publicMessage: string,
    options?: { status?: number; details?: unknown; cause?: unknown },
  ) {
    super(publicMessage, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.details = options?.details;
    this.status = options?.status ?? defaultStatus(code);
  }
}

function defaultStatus(code: AppErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "VALIDATION":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "RATE_LIMITED":
      return 429;
    case "CONFLICT":
      return 409;
    default:
      return 500;
  }
}

export function toPublicError(error: unknown): {
  code: AppErrorCode;
  message: string;
  status: number;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.publicMessage,
      status: error.status,
    };
  }

  return {
    code: "INTERNAL",
    message: "Something went wrong. Please try again.",
    status: 500,
  };
}

/** Structured server log without secrets/PII payloads. */
export function logServerError(
  context: string,
  error: unknown,
  meta?: Record<string, string | number | boolean | undefined>,
): void {
  const base = {
    context,
    ...meta,
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
    code: error instanceof AppError ? error.code : undefined,
  };
  console.error(JSON.stringify(base));
}
