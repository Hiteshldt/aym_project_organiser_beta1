"use client";

import { useState } from "react";
import {
  Link2,
  FileText,
  Copy,
  Trash2,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
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

type HistoryEntry = {
  id: string;
  updateNote: string;
  createdAt: string;
  createdByName: string;
};

export default function ItemCard({
  item,
  slug,
  isManager,
  onDelete,
  onPin,
  onEdit,
  onRefresh,
}: {
  item: Item;
  slug: string;
  isManager: boolean;
  onDelete: (id: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onEdit?: (item: Item) => void;
  onRefresh: () => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadHistory() {
    if (historyOpen) { setHistoryOpen(false); return; }
    setHistoryLoading(true);
    const res = await fetch(`/api/workspace/items/history?itemId=${item.id}&slug=${slug}`);
    if (res.ok) setHistory(await res.json());
    setHistoryLoading(false);
    setHistoryOpen(true);
  }

  function copyUrl() {
    if (!item.url) return;
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "group border rounded-xl bg-white transition-all hover:border-[#d8d8d8] hover:shadow-sm",
        item.isPinned ? "border-accent-soft" : "border-[#ebebeb]"
      )}
    >
      <div className="px-4 py-3.5 flex items-start gap-3">
        {/* Type icon */}
        <div className={cn(
          "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5",
          item.type === "link" ? "bg-accent-soft" : "bg-amber-50"
        )}>
          {item.type === "link" ? (
            <Link2 className="h-3.5 w-3.5 text-accent" />
          ) : (
            <FileText className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {item.type === "link" && item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#111] hover:text-accent transition-colors flex items-center gap-1 group/link"
                >
                  <span className="truncate">{item.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
              ) : (
                <p className="text-sm font-medium text-[#111] truncate">{item.title}</p>
              )}

              {item.url && (
                <p className="text-xs text-[#bbb] truncate mt-0.5">{item.url}</p>
              )}
              {item.fileName && (
                <p className="text-xs text-[#bbb] mt-0.5">
                  {item.fileName}
                  {item.fileSize && ` · ${formatBytes(item.fileSize)}`}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.type === "link" && item.url && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={copyUrl}
                  title={copied ? "Copied!" : "Copy link"}
                  className={copied ? "text-emerald-500" : ""}
                >
                  <Copy className="h-3.5 w-3.5" />
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
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onPin(item.id, item.isPinned)}
                    title={item.isPinned ? "Unpin" : "Pin"}
                  >
                    {item.isPinned ? (
                      <PinOff className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#bbb] hover:text-rose-500" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <p className="text-xs text-[#777] mt-1.5 line-clamp-2">{item.notes}</p>
          )}

          {/* Tags + meta */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="default" className="text-[11px]">
                #{tag}
              </Badge>
            ))}
            <span className="text-[11px] text-[#bbb] ml-auto shrink-0">
              {formatDateTime(item.itemDate)} · {item.createdByName}
            </span>
          </div>

          {/* History toggle */}
          {item.historyCount > 0 && (
            <button
              onClick={loadHistory}
              className="mt-2 flex items-center gap-1 text-[11px] text-accent hover:text-accent transition-colors"
            >
              <Clock className="h-3 w-3" />
              {item.historyCount} update{item.historyCount !== 1 ? "s" : ""}
              {historyLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : historyOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}

          {/* History entries */}
          {historyOpen && history.length > 0 && (
            <div className="mt-2 border-l-2 border-accent-soft pl-3 space-y-2">
              {history.map((h) => (
                <div key={h.id}>
                  <p className="text-xs text-[#555]">{h.updateNote}</p>
                  <p className="text-[11px] text-[#bbb] mt-0.5">
                    {formatDateTime(h.createdAt)} · {h.createdByName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
