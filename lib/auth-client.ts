import { createAuthClient } from "better-auth/react";
import { emailOTPClient, adminClient } from "better-auth/client/plugins";
import { ac, admin, manager, user } from "@/lib/auth-permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  plugins: [
    emailOTPClient(),
    adminClient({
      ac,
      roles: { admin, manager, user },
    }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
