import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { createAuthConfig } from "masterfabric-next-sec/auth";
import { db } from "@/db";
import { hasRemoteDatabase } from "@/lib/db-mode";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { audit } from "@/lib/audit";

const remoteDb = hasRemoteDatabase();

function magicLinkProvider(): Provider {
  return {
    id: "email",
    type: "email",
    name: "Email",
    from: process.env.AUTH_EMAIL_FROM ?? "noreply@localhost",
    maxAge: 24 * 60 * 60,
    async sendVerificationRequest({ identifier, url }) {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        console.info(
          JSON.stringify({
            context: "magic-link",
            to: identifier,
            delivery: "smtp-configured-but-use-provider-sdk",
          }),
        );
      }
      if (process.env.NODE_ENV !== "production") {
        console.info(`[cursor-security magic-link] ${identifier} -> ${url}`);
      } else if (!process.env.SMTP_HOST) {
        console.info(
          JSON.stringify({
            context: "magic-link",
            to: identifier,
            note: "Set SMTP_* or AUTH_TEST_PASSWORD for production sign-in.",
          }),
        );
      }
    },
  } as Provider;
}

function testLoginProvider(): Provider {
  return Credentials({
    id: "test-login",
    name: "Test login",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const expected = process.env.AUTH_TEST_PASSWORD;
      const email = String(credentials?.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!expected || !email.includes("@") || password !== expected) {
        return null;
      }
      return {
        id: `test:${email}`,
        email,
        name: email.split("@")[0],
      };
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth(
  createAuthConfig({
    secret: process.env.AUTH_SECRET,
    adapter: remoteDb
      ? DrizzleAdapter(db, {
          usersTable: users,
          accountsTable: accounts,
          sessionsTable: sessions,
          verificationTokensTable: verificationTokens,
        })
      : undefined,
    session: { strategy: remoteDb ? "database" : "jwt" },
    // Email provider requires an Auth.js adapter. Without a remote DB we
    // only expose credentials (AUTH_TEST_PASSWORD) + JWT sessions.
    providers: remoteDb
      ? [magicLinkProvider(), testLoginProvider()]
      : [testLoginProvider()],
    callbacks: {
      session({ session, user, token }) {
        const id = user?.id ?? token?.sub;
        if (session.user && id) {
          session.user.id = id;
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
