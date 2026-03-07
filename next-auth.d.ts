import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/auth/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role: AppRole;
    };
  }

  interface User {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    picture?: string | null;
  }
}
