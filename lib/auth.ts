import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * jwt() runs after authorize() or OAuth profile fetch.
     * - Credentials: user has our DB id + role from authorize() — pass through.
     * - Google: user is the Google profile (no DB id). Look up by email,
     *   create the row if missing, then put OUR id and role into the token.
     */
    async jwt({ token, user, account }) {
      // Only runs on initial sign-in (user is set)
      if (!user) return token;

      if (account?.provider === "google" && user.email) {
        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (found[0]) {
          token.id = found[0].id;
          token.role = found[0].role;
        } else {
          const [created] = await db
            .insert(users)
            .values({
              name: user.name ?? user.email.split("@")[0],
              email: user.email,
              passwordHash: "", // OAuth users have no password
              role: "manager",  // self-service signups get manager
            })
            .returning();
          token.id = created.id;
          token.role = created.role;
        }
        return token;
      }

      // Credentials path — authorize() returned id + role
      token.id = user.id!;
      token.role = (user as { role: string }).role;
      return token;
    },

    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Request only what we need
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);
        if (!user[0] || !user[0].passwordHash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user[0].passwordHash
        );
        if (!valid) return null;
        return {
          id: user[0].id,
          name: user[0].name,
          email: user[0].email,
          role: user[0].role,
        };
      },
    }),
  ],
});
