import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";

// Cache session retrieval at the request level using React cache
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

