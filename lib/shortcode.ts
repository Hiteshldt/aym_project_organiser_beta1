import { randomBytes } from "crypto";

// Unambiguous alphabet — no 0/O/1/l/I to avoid confusion when read aloud.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * Generate a short, URL-safe code for an item's short link.
 * 7 chars over a 30-char alphabet ≈ 22 billion combinations — collisions are
 * effectively impossible at our scale, but callers should still retry on the
 * rare unique-constraint violation.
 */
export function generateShortCode(length = 7): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Build the public short URL for a given code. */
export function buildShortLinkUrl(code: string): string {
  const base =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/l/${code}`;
}
