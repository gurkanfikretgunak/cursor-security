import type { z } from "zod";
import { AppError, logServerError, toPublicError } from "../errors/index.js";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type ActionContext = {
  /** Optional request metadata for audit/rate-limit. */
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Validate input with Zod, run handler, map errors to a safe ActionResult.
 * Use for Server Actions that must never leak internals.
 */
export function actionHandler<TSchema extends z.ZodTypeAny, TResult>(
  schema: TSchema,
  handler: (
    input: z.infer<TSchema>,
    ctx: ActionContext,
  ) => Promise<TResult> | TResult,
) {
  return async (
    raw: unknown,
    ctx: ActionContext = {},
  ): Promise<ActionResult<TResult>> => {
    try {
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        throw new AppError("VALIDATION", "Invalid input.", {
          details: parsed.error.flatten(),
        });
      }
      const data = await handler(parsed.data, ctx);
      return { ok: true, data };
    } catch (error) {
      if (!(error instanceof AppError) || error.code === "INTERNAL") {
        logServerError("actionHandler", error);
      }
      const pub = toPublicError(error);
      return { ok: false, error: { code: pub.code, message: pub.message } };
    }
  };
}

/**
 * Validate + handle for Route Handlers. Returns a Response.
 */
export function apiHandler<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  handler: (
    input: z.infer<TSchema>,
    request: Request,
  ) => Promise<Response> | Response,
) {
  return async (request: Request): Promise<Response> => {
    try {
      const contentType = request.headers.get("content-type") ?? "";
      let raw: unknown = undefined;
      if (request.method !== "GET" && request.method !== "HEAD") {
        if (contentType.includes("application/json")) {
          raw = await request.json();
        } else if (
          contentType.includes("application/x-www-form-urlencoded") ||
          contentType.includes("multipart/form-data")
        ) {
          const form = await request.formData();
          const data: Record<string, FormDataEntryValue> = {};
          form.forEach((value, key) => {
            data[key] = value;
          });
          raw = data;
        }
      } else {
        const url = new URL(request.url);
        raw = Object.fromEntries(url.searchParams.entries());
      }

      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        throw new AppError("VALIDATION", "Invalid input.", {
          details: parsed.error.flatten(),
        });
      }
      return await handler(parsed.data, request);
    } catch (error) {
      if (!(error instanceof AppError) || error.code === "INTERNAL") {
        logServerError("apiHandler", error);
      }
      const pub = toPublicError(error);
      return Response.json(
        { error: { code: pub.code, message: pub.message } },
        { status: pub.status },
      );
    }
  };
}

export const commonSchemas = {
  pagination: {
    page: (z: typeof import("zod").z) => z.coerce.number().int().min(1).default(1),
    pageSize: (z: typeof import("zod").z) =>
      z.coerce.number().int().min(1).max(100).default(20),
  },
};
