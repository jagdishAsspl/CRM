import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// Admin-only API paths — cookie presence checked here, role checked server-side
const ADMIN_ONLY_PATHS = [
  "/api/user/activateAdmin",
  "/api/user/deactivateAdmin",
  "/api/user/activate",
  "/api/user/deactivate",
  "/api/user/inviteuser",
  "/api/admin",
];

export async function proxy(req: NextRequest) {
  const start = performance.now();
  const path = req.nextUrl.pathname;
  console.log(`[PERF] ${path} START`);
  console.log(`[PERF] middleware START`);

  // Inngest webhook — pass through, Inngest handles its own auth via signing key
  if (path.startsWith("/api/inngest")) {
    const end = performance.now();
    console.log(`[PERF] middleware END: ${(end - start).toFixed(2)} ms`);
    console.log(`[PERF] ${path} TOTAL: ${(end - start).toFixed(2)} ms`);
    return NextResponse.next();
  }

  // better-auth API routes — pass through to better-auth handler
  if (path.startsWith("/api/auth")) {
    const end = performance.now();
    console.log(`[PERF] middleware END: ${(end - start).toFixed(2)} ms`);
    console.log(`[PERF] ${path} TOTAL: ${(end - start).toFixed(2)} ms`);
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(req);

  // Admin-only routes — require session cookie (role checked server-side)
  if (ADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) {
    if (!sessionCookie) {
      const end = performance.now();
      console.log(`[PERF] middleware END: ${(end - start).toFixed(2)} ms`);
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const end = performance.now();
    console.log(`[PERF] middleware END: ${(end - start).toFixed(2)} ms`);
    return NextResponse.next();
  }

  // Non-API routes — redirect to sign-in if no session cookie
  if (!path.startsWith("/api")) {
    if (!sessionCookie) {
      // Allow auth pages (sign-in, register, pending, inactive)
      const authPaths = ["/sign-in", "/register", "/pending", "/inactive"];
      const isAuthPage = authPaths.some((p) => path.includes(p));
      if (!isAuthPage) {
        // Do not redirect Server Actions with HTML redirects; let Next.js action handler handle auth via RSC protocol
        if (req.headers.has("next-action")) {
          return NextResponse.next();
        }
        const redirectUrl = new URL("/sign-in", req.nextUrl);
        const end = performance.now();
        console.log(`[PERF] redirect START`);
        console.log(`REDIRECT LOCATION = ${redirectUrl.toString()}`);
        console.log(`[PERF] redirect END: 0.00 ms`);
        console.log(`[PERF] middleware END: ${(end - start).toFixed(2)} ms`);
        console.log(`[PERF] ${path} TOTAL: ${(end - start).toFixed(2)} ms`);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // Non-API routes — delegate to next-intl
  const res = intlMiddleware(req);
  const end = performance.now();
  console.log(`[PERF] middleware END: ${(end - start).toFixed(2)} ms`);
  if (res.headers.get("location")) {
    console.log(`[PERF] redirect START`);
    console.log(`REDIRECT LOCATION = ${res.headers.get("location")}`);
    console.log(`[PERF] redirect END: 0.00 ms`);
  }
  console.log(`[PERF] ${path} TOTAL: ${(end - start).toFixed(2)} ms`);
  return res;
}

export const config = {
  matcher: [
    // Admin-only API paths
    "/api/user/activateAdmin/:path*",
    "/api/user/deactivateAdmin/:path*",
    "/api/user/activate/:path*",
    "/api/user/deactivate/:path*",
    "/api/user/inviteuser",
    "/api/admin/:path*",
    // better-auth API
    "/api/auth/:path*",
    // All non-API routes (existing intl matcher)
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
