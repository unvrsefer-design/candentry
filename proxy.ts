import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

// Login gerektiren sayfalar
const protectedRoutes = [
  "/upload",
  "/bulk-upload",
  "/bulk-results",
  "/dashboard",
  "/compare",
  "/compare-history",
  "/result",
];

// Login gerektiren AI API endpoint'leri
const protectedApiRoutes = [
  "/api/analyze",
  "/api/bulk-analyze",
  "/api/compare",
  "/api/interview",
];

function matchesRoute(
  pathname: string,
  routes: string[]
): boolean {
  return routes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}

export default async function proxy(
  request: NextRequest
) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(
    AUTH_COOKIE_NAME
  )?.value;

  const user = await verifySessionToken(token);

  // AI API güvenliği
  // Giriş yapmamış kullanıcıya JSON 401 döndür.
  if (matchesRoute(pathname, protectedApiRoutes)) {
    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Please sign in to continue.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.next();
  }

  // Login sayfası
  if (pathname === "/login") {
    if (user) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    return NextResponse.next();
  }

  // Admin Console
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    if (!user) {
      const loginUrl = new URL(
        "/login",
        request.url
      );

      loginUrl.searchParams.set(
        "next",
        pathname + search
      );

      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "admin") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    return NextResponse.next();
  }

  // Diğer korumalı sayfalar
  if (matchesRoute(pathname, protectedRoutes)) {
    if (!user) {
      const loginUrl = new URL(
        "/login",
        request.url
      );

      loginUrl.searchParams.set(
        "next",
        pathname + search
      );

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",

    // Admin
    "/admin/:path*",

    // Recruitment pages
    "/upload/:path*",
    "/bulk-upload/:path*",
    "/bulk-results/:path*",
    "/dashboard/:path*",
    "/compare/:path*",
    "/compare-history/:path*",
    "/result/:path*",

    // AI APIs
    "/api/analyze/:path*",
    "/api/bulk-analyze/:path*",
    "/api/compare/:path*",
    "/api/interview/:path*",
  ],
};