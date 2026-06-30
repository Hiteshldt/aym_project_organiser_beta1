import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/pricing",
  "/about",
  "/changelog",
  "/contact",
  "/privacy",
  "/terms",
  "/refund",
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAuthPage = pathname.startsWith("/login");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (isApiAuth) return NextResponse.next();

  // Installable-app assets (web manifest + generated icons) must be public —
  // otherwise they redirect to /login and the browser sees HTML, not JSON/PNG
  // ("Manifest: Line 1, column 1, Syntax error").
  if (
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon" ||
    pathname === "/apple-icon"
  ) {
    return NextResponse.next();
  }

  // Public share links — anyone with the token can view, no login.
  if (pathname.startsWith("/share/")) return NextResponse.next();
  if (pathname.startsWith("/api/share/")) return NextResponse.next();

  // Public short links — resolve + redirect, no login.
  if (pathname.startsWith("/l/")) return NextResponse.next();

  // Public contact form submission — no login.
  if (pathname === "/api/contact") return NextResponse.next();

  // Paddle billing webhook — verified by signature inside the handler, not auth.
  if (pathname.startsWith("/api/webhooks/")) return NextResponse.next();

  if (isPublic) return NextResponse.next();

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/workspace", req.url));
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
