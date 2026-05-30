"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Table2,
  Link2,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Trash2,
  Pin,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatBytes, prettyUrl, cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";

type Folder = { id: string; name: string } | null;

type Item = {
  id: string;
  title: string;
  description: string | null;
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

function RowSkeleton() {
  return (
    <tr className="border-b border-[#f3f3f3]">
      <td className="py-2.5 px-3"><div className="h-3 w-4 bg-[#f0f0f0] rounded animate-pulse" /></td>
      <td className="py-2.5 px-3"><div className="h-4 w-32 bg-[#f0f0f0] rounded animate-pulse" /></td>
      <td className="hidden md:table-cell py-2.5 px-3"><div className="h-3.5 w-40 bg-[#f0f0f0] rounded animate-pulse" /></td>
      <td className="py-2.5 px-3"><div className="h-3.5 w-24 bg-[#f0f0f0] rounded animate-pulse" /></td>
      <td className="hidden lg:table-cell py-2.5 px-3"><div className="h-3.5 w-48 bg-[#f0f0f0] rounded animate-pulse" /></td>
      <td className="py-2.5 px-3"><div className="h-3.5 w-16 bg-[#f0f0f0] rounded animate-pulse" /></td>
      <td className="py-2.5 px-3" />
    </tr>
  );
}

export default function RegisterView({
  slug,
  folder,
  isManager,
  onAddItem,
  onEdit,
  refreshKey,
}: {
  slug: string;
  folder: Folder;
  isManager: boolean;
  onAddItem: () => void;
  onEdit?: (item: Item) => void;
  refreshKey: number;
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!folder) return;
    setLoading(true);
    const res = await fetch(`/api/workspace/items?slug=${slug}&folderId=${folder.id}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [slug, folder]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function handleDelete(id: string) {
    const target = items.find((i) => i.id === id);
    const ok = await confirm({
      title: "Delete this row?",
      body: target ? `"${target.title}" will be removed.` : undefined,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/workspace/items?id=${id}&slug=${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Row deleted.");
      load();
    } else {
      toast.error("Could not delete row.");
    }
  }

  async function handlePin(id: string, isPinned: boolean) {
    const res = await fetch("/api/workspace/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, slug, isPinned: !isPinned }),
    });
    if (res.ok) toast.success(isPinned ? "Unpinned." : "Pinned to top.");
    load();
  }

  function copyUrl(item: Item) {
    if (!item.url) return;
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success("Link copied.");
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-12 w-12 rounded-xl bg-accent-soft flex items-center justify-center mb-3">
          <Table2 className="h-5 w-5 text-accent" />
        </div>
        <p className="text-sm text-[#555] font-medium">This register is empty.</p>
        <p className="text-xs text-[#aaa] mt-1 max-w-xs">
          Add a row for each deliverable — name it, link it, leave a remark.
        </p>
        {isManager && (
          <Button size="sm" variant="accent" className="mt-4" onClick={onAddItem}>
            <Plus className="h-3.5 w-3.5" /> Add first row
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="border border-[#e8e8e8] rounded-xl overflow-x-auto bg-white">
        <table className="w-full min-w-[640px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#ebebeb] bg-[#fafafa] text-left">
              <th className="py-2.5 px-3 w-10 text-[11px] font-medium text-[#999] uppercase tracking-wide">#</th>
              <th className="py-2.5 px-3 text-[11px] font-medium text-[#999] uppercase tracking-wide">Name</th>
              <th className="hidden md:table-cell py-2.5 px-3 text-[11px] font-medium text-[#999] uppercase tracking-wide">Description</th>
              <th className="py-2.5 px-3 w-40 text-[11px] font-medium text-[#999] uppercase tracking-wide">Link</th>
              <th className="hidden lg:table-cell py-2.5 px-3 text-[11px] font-medium text-[#999] uppercase tracking-wide">Remark</th>
              <th className="py-2.5 px-3 w-24 text-[11px] font-medium text-[#999] uppercase tracking-wide">Updated</th>
              <th className="py-2.5 px-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
              : items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "group border-b border-[#f3f3f3] last:border-0 hover:bg-[#fafafa] transition-colors align-top",
                      item.isPinned && "bg-accent-soft/30"
                    )}
                  >
                    {/* # */}
                    <td className="py-2.5 px-3 text-[11px] text-[#bbb] font-mono-ui">
                      {idx + 1}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-start gap-1.5">
                        <div
                          className={cn(
                            "shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center",
                            item.type === "link" ? "text-accent" : "text-amber-500"
                          )}
                        >
                          {item.type === "link" ? (
                            <Link2 className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                        </div>
                        <span className="font-medium text-[#111] leading-snug">
                          {item.title}
                          {item.isPinned && (
                            <Pin className="inline h-2.5 w-2.5 text-accent ml-1 -mt-0.5" fill="currentColor" />
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="hidden md:table-cell py-2.5 px-3 text-xs text-[#777] leading-snug max-w-[240px]">
                      {item.description || <span className="text-[#ccc]">—</span>}
                    </td>

                    {/* Link */}
                    <td className="py-2.5 px-3">
                      {item.type === "link" && item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-mono-ui truncate max-w-[150px] group/link"
                        >
                          <span className="truncate">{prettyUrl(item.url)}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/link:opacity-100" />
                        </a>
                      ) : item.fileName ? (
                        <span className="text-xs text-[#777] font-mono-ui truncate block max-w-[150px]">
                          {item.fileName}
                          {item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ""}
                        </span>
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>

                    {/* Remark (notes) */}
                    <td className="hidden lg:table-cell py-2.5 px-3 text-xs text-[#777] leading-snug max-w-[320px] whitespace-pre-wrap">
                      {item.notes || <span className="text-[#ccc]">—</span>}
                    </td>

                    {/* Updated */}
                    <td className="py-2.5 px-3 text-[11px] text-[#999] whitespace-nowrap">
                      {formatDate(item.itemDate)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-0.5 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {item.type === "link" && item.url && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => copyUrl(item)}
                            title={copiedId === item.id ? "Copied!" : "Copy link"}
                            className={copiedId === item.id ? "text-emerald-500" : ""}
                          >
                            {copiedId === item.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        )}
                        {isManager && (
                          <>
                            {onEdit && (
                              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item)} title="Edit">
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handlePin(item.id, item.isPinned)}
                              title={item.isPinned ? "Unpin" : "Pin"}
                            >
                              {item.isPinned ? (
                                <PinOff className="h-3 w-3 text-accent" />
                              ) : (
                                <Pin className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-[#bbb] hover:text-rose-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && items.length > 0 && (
        <p className="text-xs text-[#ccc] mt-2 text-right">
          {items.length} row{items.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
