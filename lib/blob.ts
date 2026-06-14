import "server-only";
import { del } from "@vercel/blob";

// Files we host live under this Vercel Blob host. External links (docs.google,
// figma, etc.) never match, so it's safe to pass an item's `url` through here.
const BLOB_HOST = "blob.vercel-storage.com";

function isBlobUrl(u: string | null | undefined): u is string {
  return !!u && u.includes(BLOB_HOST);
}

/**
 * Best-effort delete of uploaded files from Vercel Blob, freeing storage when
 * the item/folder that owned them is removed.
 *
 * Deliberately never throws: orphan cleanup must not block the database delete
 * or surface as a user-facing error. No-ops when no Blob token is configured.
 */
export async function deleteBlobs(
  urls: (string | null | undefined)[]
): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const targets = Array.from(new Set(urls.filter(isBlobUrl)));
  if (targets.length === 0) return;
  try {
    await del(targets);
  } catch (err) {
    console.error(
      "[blob] cleanup failed:",
      err instanceof Error ? err.message : err
    );
  }
}
