"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Search,
  Link2,
  FileText,
  CornerDownLeft,
  Loader2,
  ArrowUp,
  ArrowDown,
  Pin,
} from "lucide-react";
import { useDebounce } from "@/lib/useDebounce";
import { prettyUrl, cn } from "@/lib/utils";

type Result = {
  id: string;
  title: string;
  type: "link" | "file";
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  folderName: string;
  tags: string[];
  isPinned: boolean;
};

export default function CommandPalette({
  slug,
  open,
  onOpenChange,
  onViewAll,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Surface the full result set in the workspace grid (the existing search view). */
  onViewAll: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebounce(query.trim(), 180);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state each time the palette opens, so it never reopens mid-search.
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!debounced) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/workspace/search?slug=${slug}&q=${encodeURIComponent(debounced)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Result[]) => {
        if (cancelled) return;
        setResults(data.slice(0, 8));
        setActive(0);
      })
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced, slug, open]);

  // Row 0 is always the "search everything" action; items follow.
  const hasViewAll = debounced.length > 0;
  const rows = useMemo(
    () => (hasViewAll ? [{ kind: "all" as const }, ...results.map((r) => ({ kind: "item" as const, item: r }))] : []),
    [hasViewAll, results]
  );

  function openItem(item: Result) {
    const href = item.type === "link" ? item.url : item.fileUrl;
    if (href) window.open(href, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  }

  function runRow(i: number) {
    const row = rows[i];
    if (!row) return;
    if (row.kind === "all") {
      onViewAll(debounced);
      onOpenChange(false);
    } else {
      openItem(row.item);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runRow(active);
    }
  }

  // Keep the highlighted row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          onKeyDown={onKeyDown}
          aria-label="Search workspace"
          className="fixed left-1/2 top-[14vh] z-[61] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-paper-elevated shadow-2xl shadow-ink/10 duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          <DialogPrimitive.Title className="sr-only">Search this workspace</DialogPrimitive.Title>

          {/* Input row */}
          <div className="flex items-center gap-2.5 border-b border-line px-4">
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-mute-soft" />
            )}
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, tags, notes, links…"
              className="w-full bg-transparent py-4 text-[15px] text-ink outline-none placeholder:text-mute-soft"
            />
            <kbd className="hidden shrink-0 rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono-ui text-[10px] text-mute-soft sm:inline">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[min(50vh,360px)] overflow-y-auto p-1.5">
            {rows.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-mute-soft">
                {hasViewAll ? "No matches yet…" : "Type to search this workspace."}
              </p>
            )}

            {rows.map((row, i) => {
              const isActive = i === active;
              if (row.kind === "all") {
                return (
                  <button
                    key="all"
                    data-row={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => runRow(i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                      isActive ? "bg-accent-soft text-ink" : "text-mute hover:bg-paper"
                    )}
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="text-sm">
                      Search for <span className="font-medium text-ink">&ldquo;{debounced}&rdquo;</span> in this workspace
                    </span>
                  </button>
                );
              }
              const item = row.item;
              const sub = item.type === "link" && item.url ? prettyUrl(item.url) : item.fileName;
              return (
                <button
                  key={item.id}
                  data-row={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => runRow(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isActive ? "bg-accent-soft" : "hover:bg-paper"
                  )}
                >
                  <span className={cn("shrink-0", item.type === "link" ? "text-accent" : "text-warning")}>
                    {item.type === "link" ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-ink">{item.title}</span>
                      {item.isPinned && <Pin className="h-2.5 w-2.5 shrink-0 text-accent" fill="currentColor" />}
                    </span>
                    {sub && <span className="block truncate font-mono-ui text-[11px] text-mute-soft">{sub}</span>}
                  </span>
                  <span className="shrink-0 font-mono-ui text-[11px] text-mute-soft">{item.folderName}</span>
                  {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-mute" />}
                </button>
              );
            })}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 border-t border-line bg-paper/50 px-4 py-2 font-mono-ui text-[10px] text-mute-soft">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              open
            </span>
            <span className="ml-auto">links &amp; files open in a new tab</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
