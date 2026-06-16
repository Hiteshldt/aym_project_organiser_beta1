import { auth } from "@/lib/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { MAX_FILE_SIZE } from "@/lib/utils";
import { checkStorageHeadroom } from "@/lib/billing/storage";

/**
 * Client-direct upload token endpoint. The browser uploads straight to Vercel
 * Blob using a short-lived token minted here — the file never passes through
 * this function, so it bypasses Vercel's 4.5MB serverless request-body limit
 * (which was returning 413 for larger files). Size is still capped server-side
 * via maximumSizeInBytes.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Without a Blob store token we can't mint a client upload token. Fail with a
  // clear message rather than the opaque "Failed to retrieve the client token".
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "File storage isn't configured. BLOB_READ_WRITE_TOKEN is missing — add it from your Vercel Blob store.",
      },
      { status: 500 }
    );
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // Backstop the storage quota server-side (the client preflights too, but
        // a crafted client could skip that). Throwing here aborts the upload.
        if (clientPayload) {
          try {
            const { slug, size } = JSON.parse(clientPayload) as {
              slug?: string;
              size?: number;
            };
            if (slug && typeof size === "number") {
              const check = await checkStorageHeadroom(session.user.id, slug, size);
              if (!check.ok) throw new Error(check.error);
            }
          } catch (err) {
            // Re-throw quota errors; ignore malformed payloads (size is still
            // capped by maximumSizeInBytes below).
            if (err instanceof Error && /storage/i.test(err.message)) throw err;
          }
        }
        return {
        // Allow the common deliverable formats target users actually share.
        allowedContentTypes: [
          "image/*",
          "application/pdf",
          "application/zip",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/*",
          "video/*",
          "audio/*",
          "application/octet-stream",
        ],
        maximumSizeInBytes: MAX_FILE_SIZE,
        tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      // Fires server-side after the blob lands. We read the result client-side
      // directly, so nothing to persist here.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
