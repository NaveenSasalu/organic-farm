import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Grab the auth_token cookie we set during login
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // 2. Define our protection logic
  const isAdminPage = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login";

  // SCENARIO A: Trying to access Admin without being logged in
  if (isAdminPage && !token) {
    // Redirect to login and remember where they were trying to go
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // SCENARIO B: Already logged in, but trying to go to Login page
  if (isLoginPage && token) {
    // No need to log in again, send to admin
    return NextResponse.redirect(new URL("/admin/orders", request.url));
  }

  return NextResponse.next();
}

// 3. Configure which paths this middleware runs on
export const config = {
  matcher: [
    "/admin/:path*", // All admin routes
    "/login", // The login page
  ],
};
