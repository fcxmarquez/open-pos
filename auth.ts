import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        if (process.env.AUTH_BYPASS !== "true") return null;
        if (process.env.VERCEL_ENV === "production") return null;
        if (!credentials?.username || !credentials?.password) return null;
        if (credentials.username === "root" && credentials.password === "testing") {
          return { id: "test-user", name: "Test User", email: "test@testing.local" };
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
      // Credentials provider is only active when AUTH_BYPASS is true
      if (account?.provider === "credentials") return true;

      if (!profile?.email) return false;

      const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      if (allowedEmails.length === 0) return false;

      return allowedEmails.includes(profile.email);
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
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
