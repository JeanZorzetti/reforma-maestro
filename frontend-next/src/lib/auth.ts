import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { logAudit } from "@/lib/audit";

/**
 * Um JWT emitido antes da última troca de senha não vale mais — é o que
 * substitui o `delete from sessions` que a estratégia `database` permitia.
 */
export async function tokenAindaValido(userId: string, emitidoEm: number): Promise<boolean> {
  const [row] = await db
    .select({ passwordChangedAt: users.passwordChangedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return !!row && row.passwordChangedAt.getTime() <= emitidoEm;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    // Credentials só funciona com JWT: @auth/core recusa `database` antes de
    // chamar authorize() (assert.js, UnsupportedStrategy).
    strategy: "jwt",
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
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          passwordChangedAt: user.passwordChangedAt.getTime(),
        };
      },
    }),
  ],
  callbacks: {
    // Sem tabela `sessions` para apagar, a invalidação no reset de senha vem
    // daqui: o token carrega o `password_changed_at` de quando foi emitido e é
    // recusado se a senha mudou depois. Custo: 1 SELECT por request autenticado
    // — o mesmo que a estratégia `database` fazia.
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.passwordChangedAt = (user as { passwordChangedAt: number }).passwordChangedAt;
        return token;
      }
      if (!token.sub) return null;
      const valido = await tokenAindaValido(token.sub, Number(token.passwordChangedAt));
      return valido ? token : null;
    },
    session: async ({ session, token }) => {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/entrar",
  },
});
