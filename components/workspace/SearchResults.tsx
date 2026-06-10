"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  SearchX,
  Link2,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Scissors,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/lib/useDebounce";
import { useConfirm } from "@/components/ui/confirm";
import { formatDate, prettyUrl, cn } from "@/lib/utils";
import { buildShortLinkUrl } from "@/lib/shortcode";
import { toast } from "sonner";

type Item = {
  id: string;
  title: string;
  description?: string | null;
  shortCode?: string | null;
  type: "link" | "file";
  url: string | null;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  folderId: string;
  folderName: string;
  tags: string[];
  notes: string | null;
  itemDate: string;
  isPinned: boolean;
  createdAt: string;
  createdByName: string;
  historyCount: number;
};

const CELL = "border-r border-line px-3 py-3 align-top";
const HEAD =
  "border-r border-line px-3 py-2 text-left text-[11px] font-semibold text-mute uppercase tracking-wide bg-paper";

export default function SearchResults({
  slug,
  query,
  isManager,
  onClearSearch,
  onRefresh,
}: {
  slug: string;
  query: string;
  isManager: boolean;
  onClearSearch: () => void;
  onRefresh: () => void;
}) {
  const confirm = useConfirm();
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async () => {
    if (!debouncedQuery.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/workspace/search?slug=${slug}&q=${encodeURIComponent(debouncedQuery)}`);
    if (res.ok) setResults(await res.json());
    setLoading(false);
  }, [slug, debouncedQuery]);

  useEffect(() => { search(); }, [search]);

  async function handleDelete(id: string) {
    const target = results.find((r) => r.id === id);
    const ok = await confirm({
      title: "Delete this item?",
      body: target ? `"${target.title}" will be removed.` : undefined,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/workspace/items?id=${id}&slug=${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Item deleted.");
      setResults((r) => r.filter((i) => i.id !== id));
    } else {
      toast.error("Could not delete item.");
    }
  }

  async function handlePin(id: string, isPinned: boolean) {
    setResults((r) => r.map((i) => (i.id === id ? { ...i, isPinned: !isPinned } : i)));
    const res = await fetch("/api/workspace/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, slug, isPinned: !isPinned }),
    });
    if (res.ok) toast.success(isPinned ? "Unpinned." : "Pinned to top.");
  }

  function copyUrl(item: Item) {
    if (!item.url) return;
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success("Link copied.");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="px-4 sm:px-6 py-4">
      <p className="text-xs text-mute mb-3">
        {loading ? "Searching…" : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
      </p>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-mute-soft" />
        </div>
      )}

      {!loading && results.length === 0 && query.length > 1 && (
        <div className="flex flex-col items-center py-16 text-center">
          <SearchX className="h-10 w-10 text-mute-soft mb-3" />
          <p className="text-sm text-mute">Nothing found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-mute-soft mt-1">Try different keywords or tags.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="border border-line rounded-xl overflow-x-auto bg-paper-elevated">
          <table className="w-full min-w-[720px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={HEAD}>Name</th>
                <th className={cn(HEAD, "hidden md:table-cell")}>Description</th>
                <th className={cn(HEAD, "w-40")}>Link</th>
                <th className={cn(HEAD, "hidden sm:table-cell w-32")}>Folder</th>
                <th className={cn(HEAD, "w-24")}>Updated</th>
                {isManager && <th className="px-3 py-2 w-24 bg-paper" />}
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "group border-b border-line last:border-b-0 align-top transition-colors hover:bg-paper",
                    item.isPinned && "bg-accent-soft/30"
                  )}
                >
                  <td className={CELL}>
                    <div className="flex items-start gap-1.5">
                      <span className={cn("shrink-0 mt-0.5", item.type === "link" ? "text-accent" : "text-warning")}>
                        {item.type === "link" ? <Link2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      </span>
                      <span className="font-medium text-ink leading-snug">
                        {item.title}
                        {item.isPinned && <Pin className="inline h-2.5 w-2.5 text-accent ml-1" fill="currentColor" />}
                      </span>
                    </div>
                  </td>
                  <td className={cn(CELL, "hidden md:table-cell text-xs text-mute leading-snug max-w-[240px]")}>
                    {item.description || <span className="text-mute-soft">—</span>}
                  </td>
                  <td className={CELL}>
                    {item.type === "link" && item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-mono-ui truncate max-w-[150px] group/link">
                        <span className="truncate">{prettyUrl(item.url)}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/link:opacity-100" />
                      </a>
                    ) : item.fileName ? (
                      <span className="text-xs text-mute font-mono-ui truncate block max-w-[150px]">{item.fileName}</span>
                    ) : (
                      <span className="text-mute-soft">—</span>
                    )}
                  </td>
                  <td className={cn(CELL, "hidden sm:table-cell text-xs text-mute")}>
                    <span className="truncate block max-w-[120px]">{item.folderName}</span>
                  </td>
                  <td className={cn(CELL, "text-[11px] text-mute-soft whitespace-nowrap")}>
                    {formatDate(item.itemDate)}
                  </td>
                  {isManager && (
                    <td className="px-2 py-2 align-top">
                      <div className="flex items-center gap-0.5 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {item.type === "link" && item.url && (
                          <Button variant="ghost" size="icon-sm" onClick={() => copyUrl(item)} title={copiedId === item.id ? "Copied!" : "Copy link"} className={copiedId === item.id ? "text-success" : ""}>
                            {copiedId === item.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        )}
                        {item.url && item.shortCode && (
                          <Button variant="ghost" size="icon-sm" onClick={() => { navigator.clipboard.writeText(buildShortLinkUrl(item.shortCode!)); toast.success("Short link copied."); }} title="Copy short link">
                            <Scissors className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => handlePin(item.id, item.isPinned)} title={item.isPinned ? "Unpin" : "Pin"}>
                          {item.isPinned ? <PinOff className="h-3 w-3 text-accent" /> : <Pin className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)} title="Delete">
                          <Trash2 className="h-3 w-3 text-mute-soft hover:text-danger" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
