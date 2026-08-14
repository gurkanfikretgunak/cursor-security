"use server";

import { z } from "zod";
import { AppError } from "masterfabric-next-sec/errors";
import { actionHandler } from "masterfabric-next-sec/validate";
import { signIn, signOut } from "@/auth";
import { audit } from "@/lib/audit";
import { assertAuthHandshake, bindBlendedSession } from "@/lib/handshake";
import { limiter } from "@/lib/rate-limit";
import { clearLabState } from "@/lib/lab-store";

const MagicLinkSchema = z.object({
  email: z.string().trim().email().max(320),
  callbackUrl: z.string().max(500).optional(),
  /** Public id from /api/auth/handshake — bound to HttpOnly barrier cookie. */
  handshakeId: z.string().uuid(),
});

export const requestMagicLink = actionHandler(
  MagicLinkSchema,
  async (input, ctx) => {
    // Verify barrier ↔ handshake; keep barrier cookie for post-login blend.
    await assertAuthHandshake(input.handshakeId);

    const key = `auth:${ctx.ip ?? "unknown"}:${input.email.toLowerCase()}`;
    const limited = await limiter.check(key, "auth");
    if (!limited.success) {
      throw new AppError("RATE_LIMITED", "Too many login attempts. Try again later.");
    }

    try {
      await signIn("email", {
        email: input.email.toLowerCase(),
        redirectTo: sanitizeCallback(input.callbackUrl, input.handshakeId),
        redirect: false,
      });
    } catch (error) {
      await audit.write({
        event: "auth.failure",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        resourceType: "session",
        resourceId: input.email.toLowerCase(),
        metadata: {
          email: input.email.toLowerCase(),
          handshakeId: input.handshakeId,
        },
      });
      if (
        typeof error === "object" &&
        error &&
        "digest" in error &&
        String((error as { digest?: string }).digest).includes("NEXT_REDIRECT")
      ) {
        throw error;
      }
      throw new AppError(
        "INTERNAL",
        "Could not send magic link. Check server logs in development.",
        { cause: error },
      );
    }

    return {
      sent: true,
      handshakeId: input.handshakeId,
      hint:
        process.env.NODE_ENV !== "production"
          ? "Check the server console for the magic link URL."
          : "If an account exists for this email, a sign-in link was sent.",
    };
  },
);

const TestLoginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(200),
  callbackUrl: z.string().max(500).optional(),
  handshakeId: z.string().uuid(),
});

export const requestTestLogin = actionHandler(
  TestLoginSchema,
  async (input, ctx) => {
    await assertAuthHandshake(input.handshakeId);

    const key = `auth-test:${ctx.ip ?? "unknown"}:${input.email.toLowerCase()}`;
    const limited = await limiter.check(key, "auth");
    if (!limited.success) {
      throw new AppError("RATE_LIMITED", "Too many login attempts. Try again later.");
    }

    try {
      await signIn("test-login", {
        email: input.email.toLowerCase(),
        password: input.password,
        redirectTo: sanitizeCallback(input.callbackUrl, input.handshakeId),
        redirect: false,
      });
    } catch (error) {
      await audit.write({
        event: "auth.failure",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        resourceType: "session",
        resourceId: input.email.toLowerCase(),
        metadata: {
          email: input.email.toLowerCase(),
          handshakeId: input.handshakeId,
          method: "test-login",
        },
      });
      if (
        typeof error === "object" &&
        error &&
        "digest" in error &&
        String((error as { digest?: string }).digest).includes("NEXT_REDIRECT")
      ) {
        throw error;
      }
      throw new AppError("UNAUTHORIZED", "Test login failed.");
    }

    const userId = `test:${input.email.toLowerCase()}`;
    await audit.write({
      event: "auth.login",
      actorUserId: userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      resourceType: "session",
      resourceId: input.email.toLowerCase(),
      metadata: { email: input.email.toLowerCase(), method: "test-login" },
    });

    // Blend in the same request as login so X-ray step 05 does not depend
    // on a later client bind that can miss a rotated handshake cookie.
    try {
      const bound = await bindBlendedSession({
        userId,
        handshakeId: input.handshakeId,
      });
      await audit.write({
        event: "auth.blended",
        actorUserId: userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        resourceType: "channel",
        resourceId: bound.channelId,
        metadata: {
          deviceId: bound.deviceId,
          channelId: bound.channelId,
          channelPath: bound.channelPath,
          handshakeId: bound.handshakeId,
          store: "login-bind",
        },
      });
    } catch (blendError) {
      console.error(
        JSON.stringify({
          context: "test-login-blend",
          message:
            blendError instanceof Error ? blendError.message : "blend failed",
        }),
      );
    }

    return {
      signedIn: true,
      redirectTo: sanitizeCallback(input.callbackUrl, input.handshakeId),
    };
  },
);

export async function logoutAction() {
  await clearLabState();
  await signOut({ redirectTo: "/" });
}

function sanitizeCallback(url: string | undefined, handshakeId: string): string {
  const base =
    url && url.startsWith("/") && !url.startsWith("//") ? url : "/app";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}hid=${encodeURIComponent(handshakeId)}`;
}
