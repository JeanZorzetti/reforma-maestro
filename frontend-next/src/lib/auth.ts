import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { logAudit } from "@/lib/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        senha: { type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const senha = String(credentials?.senha ?? "");
        if (!email || !senha) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
          await logAudit(null, "login_failed", { email });
          return null;
        }

        const valid = await bcrypt.compare(senha, user.passwordHash);
        if (!valid) {
          await logAudit(user.id, "login_failed", {});
          return null;
        }

        await logAudit(user.id, "login", {});
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/entrar",
  },
});
