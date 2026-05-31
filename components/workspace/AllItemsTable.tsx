"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link2, FileText, ExternalLink, Copy, Pin, PinOff, Trash2, Folder, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";

type Item = {
  id: string;
  title: string;
  type: "link" | "file";
  url: string | null;
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

// Pinned first, then newest-first — mirrors the server's ORDER BY so optimistic
// reorders match what a refetch would return.
function sortItems(list: Item[]): Item[] {
  return [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function RowSkeleton() {
  return (
    <tr className="border-b border-[#f5f5f5]">
      <td className="py-3 px-2 sm:px-4">
        <div className="w-6 h-6 rounded-md bg-[#f0f0f0] animate-pulse" />
      </td>
      <td className="py-3 px-2 sm:px-4">
        <div className="space-y-1.5">
          <div className="h-4 bg-[#f0f0f0] rounded animate-pulse w-32 sm:w-48" />
          <div className="h-3 bg-[#f0f0f0] rounded animate-pulse w-40 sm:w-64" />
        </div>
      </td>
      <td className="hidden sm:table-cell py-3 px-4">
        <div className="h-3.5 bg-[#f0f0f0] rounded animate-pulse w-20" />
      </td>
      <td className="hidden lg:table-cell py-3 px-4">
        <div className="flex gap-1">
          <div className="h-4 bg-[#f0f0f0] rounded-full animate-pulse w-12" />
          <div className="h-4 bg-[#f0f0f0] rounded-full animate-pulse w-14" />
        </div>
      </td>
      <td className="py-3 px-2 sm:px-4">
        <div className="h-3.5 bg-[#f0f0f0] rounded animate-pulse w-16 sm:w-20" />
      </td>
      <td className="hidden lg:table-cell py-3 px-4">
        <div className="h-3.5 bg-[#f0f0f0] rounded animate-pulse w-14" />
      </td>
      <td className="py-3 px-2 sm:px-4" />
    </tr>
  );
}

export default function AllItemsTable({
  slug,
  isManager,
  refreshKey,
  onEdit,
  initialItems,
}: {
  slug: string;
  isManager: boolean;
  refreshKey: number;
  onEdit?: (item: Item) => void;
  initialItems?: Item[];
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Item[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Once we have data (seeded or fetched), revalidate silently — show the
  // current list and update in place rather than flashing the skeleton.
  const hasData = useRef(!!initialItems);
  const load = useCallback(async () => {
    if (!hasData.current) setLoading(true);
    const res = await fetch(`/api/workspace/items?slug=${slug}`);
    if (res.ok) {
      setItems(await res.json());
      hasData.current = true;
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: "Delete this item?",
      body: `"${title}" will be removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    // Optimistic — drop it now, restore on failure.
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== id));
    const res = await fetch(`/api/workspace/items?id=${id}&slug=${slug}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete item.");
      setItems(prev);
      return;
    }
    toast.success("Item deleted.");
  }

  async function handlePin(id: string, isPinned: boolean) {
    // Optimistic — flip + reorder immediately, revalidate on failure.
    const prev = items;
    setItems((cur) =>
      sortItems(cur.map((i) => (i.id === id ? { ...i, isPinned: !isPinned } : i)))
    );
    const res = await fetch("/api/workspace/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, slug, isPinned: !isPinned }),
    });
    if (res.ok) {
      toast.success(isPinned ? "Unpinned." : "Pinned to top.");
    } else {
      toast.error("Could not update pin.");
      setItems(prev);
    }
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
      <div className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#ebebeb] bg-[#fafafa]">
              <th className="py-2.5 px-2 sm:px-4 text-left w-10" />
              <th className="py-2.5 px-2 sm:px-4 text-left text-xs font-medium text-[#888] uppercase tracking-wide">Title</th>
              <th className="hidden sm:table-cell py-2.5 px-4 text-left text-xs font-medium text-[#888] uppercase tracking-wide w-36">Folder</th>
              <th className="hidden lg:table-cell py-2.5 px-4 text-left text-xs font-medium text-[#888] uppercase tracking-wide w-40">Tags</th>
              <th className="py-2.5 px-2 sm:px-4 text-left text-xs font-medium text-[#888] uppercase tracking-wide w-24 sm:w-28">Date</th>
              <th className="hidden lg:table-cell py-2.5 px-4 text-left text-xs font-medium text-[#888] uppercase tracking-wide w-24">By</th>
              <th className="py-2.5 px-2 sm:px-4 w-20 sm:w-28" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-[#bbb]">
                  No items yet. Select a folder and add your first item.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "group border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa] transition-colors",
                    item.isPinned && "bg-accent-soft/40"
                  )}
                >
                  {/* Type icon */}
                  <td className="py-3 px-2 sm:px-4">
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center",
                      item.type === "link" ? "bg-accent-soft" : "bg-amber-50"
                    )}>
                      {item.type === "link"
                        ? <Link2 className="h-3 w-3 text-accent" />
                        : <FileText className="h-3 w-3 text-amber-500" />}
                    </div>
                  </td>

                  {/* Title + subtitle */}
                  <td className="py-3 px-2 sm:px-4 max-w-[160px] sm:max-w-[300px]">
                    {item.type === "link" && item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#111] hover:text-accent transition-colors flex items-center gap-1 group/link"
                      >
                        <span className="truncate">{item.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <span className="font-medium text-[#111] truncate block">{item.title}</span>
                    )}
                    {item.notes && (
                      <p className="text-xs text-[#aaa] truncate mt-0.5">{item.notes}</p>
                    )}
                    {item.fileName && (
                      <p className="text-xs text-[#aaa] truncate mt-0.5">
                        {item.fileName}{item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ""}
                      </p>
                    )}
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-accent mt-0.5">
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </span>
                    )}
                  </td>

                  {/* Folder */}
                  <td className="hidden sm:table-cell py-3 px-4">
                    <span className="flex items-center gap-1.5 text-xs text-[#666]">
                      <Folder className="h-3 w-3 text-[#bbb] shrink-0" />
                      <span className="truncate">{item.folderName}</span>
                    </span>
                  </td>

                  {/* Tags */}
                  <td className="hidden lg:table-cell py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="default" className="text-[10px]">#{tag}</Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[10px] text-[#bbb] self-center">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-2 sm:px-4">
                    <span className="text-xs text-[#888] whitespace-nowrap">{formatDate(item.itemDate)}</span>
                  </td>

                  {/* Added by */}
                  <td className="hidden lg:table-cell py-3 px-4">
                    <span className="text-xs text-[#888] whitespace-nowrap truncate block max-w-[80px]">{item.createdByName}</span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-2 sm:px-4">
                    <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity justify-end">
                      {item.type === "link" && item.url && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => copyUrl(item)}
                          title={copiedId === item.id ? "Copied!" : "Copy link"}
                          className={copiedId === item.id ? "text-emerald-500" : ""}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      {isManager && (
                        <>
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onEdit(item)}
                              title="Edit"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handlePin(item.id, item.isPinned)}
                            title={item.isPinned ? "Unpin" : "Pin"}
                          >
                            {item.isPinned
                              ? <PinOff className="h-3 w-3 text-accent" />
                              : <Pin className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(item.id, item.title)}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 text-[#bbb] hover:text-rose-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && items.length > 0 && (
        <p className="text-xs text-[#ccc] mt-2 text-right">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
