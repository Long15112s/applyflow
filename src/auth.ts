import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    authorized({ auth: session, request }) {
      const protectedPath = ["/applications", "/companies", "/analytics", "/settings"].some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
      return !protectedPath || Boolean(session?.user);
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    }
  }
});
