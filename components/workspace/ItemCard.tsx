"use client";

import { useState } from "react";
import {
  Link2,
  FileText,
  Copy,
  Trash2,
  Pin,
  PinOff,
  Clock,
  Loader2,
  ExternalLink,
  Pencil,
  Check,
  Scissors,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate, formatDateTime, formatBytes, prettyUrl, cn } from "@/lib/utils";
import { buildShortLinkUrl } from "@/lib/shortcode";

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

type HistoryEntry = {
  id: string;
  updateNote: string;
  createdAt: string;
  createdByName: string;
};

const MAX_VISIBLE_TAGS = 4;

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
    toast.success("Link copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  function copyShortLink() {
    if (!item.shortCode) return;
    navigator.clipboard.writeText(buildShortLinkUrl(item.shortCode));
    toast.success("Short link copied.");
  }

  const visibleTags = item.tags.slice(0, MAX_VISIBLE_TAGS);
  const extraTags = item.tags.length - visibleTags.length;
  const subtitle =
    item.type === "file"
      ? item.fileName
        ? `${item.fileName}${item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ""}`
        : null
      : item.url
        ? prettyUrl(item.url)
        : null;

  return (
    <div
      className={cn(
        "group border rounded-lg bg-white transition-all hover:border-[#d8d8d8]",
        item.isPinned ? "border-accent-soft bg-accent-soft/20" : "border-[#ebebeb]"
      )}
    >
      <div className="px-3 py-2 flex items-center gap-2.5">
        {/* Type icon */}
        <div
          className={cn(
            "shrink-0 w-6 h-6 rounded-md flex items-center justify-center",
            item.type === "link" ? "bg-accent-soft" : "bg-amber-50"
          )}
        >
          {item.type === "link" ? (
            <Link2 className="h-3 w-3 text-accent" />
          ) : (
            <FileText className="h-3 w-3 text-amber-500" />
          )}
        </div>

        {/* Title + subtitle (two tight lines) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {item.type === "link" && item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#111] hover:text-accent transition-colors truncate group/link inline-flex items-center gap-1 max-w-full"
              >
                <span className="truncate">{item.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </a>
            ) : (
              <span className="text-sm font-medium text-[#111] truncate">{item.title}</span>
            )}
            {item.isPinned && (
              <Pin className="h-2.5 w-2.5 text-accent shrink-0" fill="currentColor" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            {subtitle && (
              <span className="text-[11px] text-[#aaa] font-mono-ui truncate shrink min-w-0">
                {subtitle}
              </span>
            )}
            {item.description && (
              <>
                {subtitle && <span className="text-[#ddd] shrink-0">·</span>}
                <span className="text-[11px] text-[#999] truncate shrink min-w-0">
                  {item.description}
                </span>
              </>
            )}
            {item.type === "link" && item.shortCode && (
              <>
                <span className="text-[#ddd] shrink-0 hidden sm:inline">·</span>
                <button
                  onClick={copyShortLink}
                  title="Copy short link"
                  className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-accent/70 hover:text-accent font-mono-ui shrink-0"
                >
                  <Scissors className="h-2.5 w-2.5" />
                  /l/{item.shortCode}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tags — inline, capped */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="default" className="text-[10px]">
              #{tag}
            </Badge>
          ))}
          {extraTags > 0 && (
            <span className="text-[10px] text-[#bbb]">+{extraTags}</span>
          )}
        </div>

        {/* Meta — date */}
        <span className="hidden sm:block text-[11px] text-[#bbb] whitespace-nowrap shrink-0">
          {formatDate(item.itemDate)}
        </span>

        {/* History pill */}
        {item.historyCount > 0 && (
          <button
            onClick={loadHistory}
            className="hidden lg:flex items-center gap-0.5 text-[10px] text-accent hover:text-accent-hover transition-colors shrink-0"
            title="Update history"
          >
            {historyLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {item.historyCount}
          </button>
        )}

        {/* Actions — always visible on touch, hover-reveal on desktop */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {item.type === "link" && item.url && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={copyUrl}
              title={copied ? "Copied!" : "Copy link"}
              className={copied ? "text-emerald-500" : ""}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          )}
          {item.url && item.shortCode && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={copyShortLink}
              title="Copy short link"
            >
              <Scissors className="h-3.5 w-3.5" />
            </Button>
          )}
          {isManager && (
            <>
              {onEdit && (
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item)} title="Edit">
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

      {/* Notes — only when present, full-width below the row */}
      {item.notes && (
        <p className="px-3 pb-2 -mt-0.5 pl-[42px] text-[11px] text-[#888] line-clamp-1">
          {item.notes}
        </p>
      )}

      {/* History entries (expanded) */}
      {historyOpen && history.length > 0 && (
        <div className="px-3 pb-3 pl-[42px]">
          <div className="border-l-2 border-accent-soft pl-3 space-y-2">
            {history.map((h) => (
              <div key={h.id}>
                <p className="text-xs text-[#555]">{h.updateNote}</p>
                <p className="text-[11px] text-[#bbb] mt-0.5">
                  {formatDateTime(h.createdAt)} · {h.createdByName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
