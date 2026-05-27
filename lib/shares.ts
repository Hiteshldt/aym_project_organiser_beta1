import { randomBytes } from "crypto";

/**
 * Generate a URL-safe random token for client share links.
 * 32 bytes → ~43 characters of base64url. Unguessable.
 */
export function generateShareToken(): string {
  return randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Build the public share URL for a given token.
 * Uses NEXTAUTH_URL in production, falls back to localhost in dev.
 */
export function buildShareUrl(token: string): string {
  const base =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/share/${token}`;
}
