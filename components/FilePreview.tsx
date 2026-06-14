"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X, Loader2, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"];

function extOf(nameOrUrl: string): string {
  const clean = nameOrUrl.split("?")[0].split("#")[0];
  const m = clean.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

type Kind = "image" | "pdf" | "other";
function kindOf(name: string, url: string): Kind {
  const ext = extOf(name) || extOf(url);
  if (IMAGE_EXT.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

/** Force a download via Vercel Blob's download flag rather than opening inline. */
function downloadHref(url: string): string {
  return url + (url.includes("?") ? "&" : "?") + "download=1";
}

/**
 * Clickable trigger that opens an in-app viewer for the file (images + PDFs
 * preview inline; other formats offer a clean download). Drop-in replacement
 * for a plain file link — works in the workspace and the public share view.
 */
export default function FilePreview({
  url,
  name,
  className,
  title,
  children,
}: {
  url: string;
  name: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        title={title}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open && <ViewerModal url={url} name={name} onClose={() => setOpen(false)} />}
    </>
  );
}

function ViewerModal({
  url,
  name,
  onClose,
}: {
  url: string;
  name: string;
  onClose: () => void;
}) {
  const kind = kindOf(name, url);
  const [loaded, setLoaded] = useState(kind === "other");
  const [errored, setErrored] = useState(false);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-ink-warm/80 backdrop-blur-sm upgrade-cele-fade"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 text-paper">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 opacity-80" />
          <span className="truncate text-sm font-medium">{name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={downloadHref(url)}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full bg-paper/15 hover:bg-paper/25 px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-paper/15 hover:bg-paper/25 h-8 w-8 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-3 sm:p-8 overflow-auto"
        onClick={onClose}
      >
        {!loaded && !errored && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-paper/80">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <span className="text-xs font-mono-ui tracking-wide">Loading…</span>
          </div>
        )}

        {kind === "image" && !errored && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name}
            onClick={(e) => e.stopPropagation()}
            onLoad={() => setLoaded(true)}
            onError={() => { setErrored(true); setLoaded(true); }}
            className={cn(
              "max-h-full max-w-full rounded-lg shadow-float object-contain transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {kind === "pdf" && !errored && (
          <iframe
            src={url}
            title={name}
            onClick={(e) => e.stopPropagation()}
            onLoad={() => setLoaded(true)}
            className={cn(
              "w-full h-full max-w-5xl rounded-lg bg-paper shadow-float transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {(kind === "other" || errored) && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border border-line bg-paper-elevated px-10 py-9 text-center shadow-float max-w-sm"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <p className="mt-4 font-display text-lg text-ink truncate">{name}</p>
            <p className="mt-1 text-sm text-mute">
              {errored ? "Couldn't load a preview." : "No inline preview for this format."}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={downloadHref(url)}
                className="btn-accent inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:border-accent transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </a>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
