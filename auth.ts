import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { isAuthBypassEnabled, TESTING_BYPASS_EMAIL } from "@/lib/auth/bypass";
import { type AppRole, getRoleForEmail, normalizeEmails } from "@/lib/auth/roles";
import { DEMO_CREDENTIALS, DEMO_USER_EMAIL, isDemoMode } from "@/lib/demo";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        if (
          isDemoMode() &&
          credentials.username === DEMO_CREDENTIALS.username &&
          credentials.password === DEMO_CREDENTIALS.password
        ) {
          return { id: "demo-user", name: "Demo", email: DEMO_USER_EMAIL };
        }
        if (!isAuthBypassEnabled()) return null;
        if (credentials.username === "root" && credentials.password === "testing") {
          return { id: "test-user", name: "Test User", email: TESTING_BYPASS_EMAIL };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Credentials provider is only active when the auth bypass is enabled
      if (account?.provider === "credentials") return true;

      if (!profile?.email) return false;

      const allowedEmails = normalizeEmails(process.env.ALLOWED_EMAILS);

      if (allowedEmails.length === 0) return false;

      return allowedEmails.includes(profile.email.toLowerCase());
    },
    async jwt({ token, user, profile }) {
      if (profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;
      } else if (user) {
        token.email = user.email;
        token.name = user.name;
      }

      // Demo user always gets admin role so server actions pass in demo mode
      if (typeof token.email === "string") {
        token.role =
          isDemoMode() && token.email === DEMO_USER_EMAIL
            ? "admin"
            : getRoleForEmail(token.email);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.role = (token.role ?? "cashier") as AppRole;
      }
      return session;
    },
  },
});
