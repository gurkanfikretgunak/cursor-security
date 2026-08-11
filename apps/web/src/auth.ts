import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { createAuthConfig } from "masterfabric-next-sec/auth";
import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { audit } from "@/lib/audit";

function magicLinkProvider(): Provider {
  return {
    id: "email",
    type: "email",
    name: "Email",
    from: process.env.AUTH_EMAIL_FROM ?? "noreply@localhost",
    maxAge: 24 * 60 * 60,
    async sendVerificationRequest({ identifier, url }) {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        // Production path: wire Nodemailer/Resend here using SMTP_* env vars.
        console.info(
          JSON.stringify({
            context: "magic-link",
            to: identifier,
            delivery: "smtp-configured-but-use-provider-sdk",
          }),
        );
      }
      // Always log in non-production for local certifier demos.
      if (process.env.NODE_ENV !== "production") {
        console.info(`[cursor-security magic-link] ${identifier} -> ${url}`);
      } else if (!process.env.SMTP_HOST) {
        console.info(
          JSON.stringify({
            context: "magic-link",
            to: identifier,
            note: "Set SMTP_* or a transactional email provider before production use.",
          }),
        );
      }
    },
  } as Provider;
}

export const { handlers, auth, signIn, signOut } = NextAuth(
  createAuthConfig({
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    providers: [magicLinkProvider()],
    callbacks: {
      session({ session, user }) {
        if (session.user) {
          session.user.id = user.id;
        }
        return session;
      },
    },
    events: {
      async signIn({ user }) {
        await audit.write({
          event: "auth.login",
          actorUserId: user.id,
          metadata: { email: user.email ?? null },
        });
      },
      async signOut(message) {
        const userId =
          "token" in message
            ? (message.token?.sub ?? null)
            : (message.session?.userId ?? null);
        await audit.write({
          event: "auth.logout",
          actorUserId: userId,
        });
      },
    },
  }),
);
