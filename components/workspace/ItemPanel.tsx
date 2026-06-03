"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  Link2,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Scissors,
  Pin,
  PinOff,
  Trash2,
  Clock,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime, formatBytes, cn } from "@/lib/utils";
import { buildShortLinkUrl } from "@/lib/shortcode";
import {
  type StatusOption,
  REGISTER_COLORS,
  STATUS_CHIP,
  COLOR_DOT,
  findStatus,
  isRegisterColor,
} from "@/lib/register";
import type { RegisterItem } from "./RegisterGrid";
import { toast } from "sonner";

type HistoryEntry = {
  id: string;
  updateNote: string;
  createdAt: string;
  createdByName: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="font-mono-ui text-[10px] uppercase tracking-wider text-mute-soft">{label}</label>
      {children}
    </div>
  );
}

export default function ItemPanel({
  slug,
  item,
  isManager,
  statusOptions,
  onClose,
  onPatch,
  onDelete,
}: {
  slug: string;
  item: RegisterItem;
  isManager: boolean;
  statusOptions: StatusOption[];
  onClose: () => void;
  onPatch: (patch: Partial<RegisterItem> & { updateNote?: string }) => void;
  onDelete: () => void;
}) {
  // Local drafts (panel is keyed by item.id, so these seed once per item).
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [updateNote, setUpdateNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const status = findStatus(statusOptions, item.status);

  useEffect(() => {
    let alive = true;
    setHistoryLoading(true);
    fetch(`/api/workspace/items/history?itemId=${item.id}&slug=${slug}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((h) => alive && setHistory(h))
      .finally(() => alive && setHistoryLoading(false));
    return () => {
      alive = false;
    };
  }, [item.id, slug]);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const saveIfChanged = useCallback(
    (field: keyof RegisterItem, value: string | null) => {
      const current = (item[field] ?? "") as string;
      if ((value ?? "") !== current) onPatch({ [field]: value || null } as Partial<RegisterItem>);
    },
    [item, onPatch]
  );

  function commitTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
    if (!t || item.tags.includes(t)) {
      setTagInput("");
      return;
    }
    onPatch({ tags: [...item.tags, t] });
    setTagInput("");
  }
  function removeTag(t: string) {
    onPatch({ tags: item.tags.filter((x) => x !== t) });
  }

  function copyLink() {
    if (!item.url) return;
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    toast.success("Link copied.");
    setTimeout(() => setCopied(false), 2000);
  }
  function copyShort() {
    if (!item.shortCode) return;
    navigator.clipboard.writeText(buildShortLinkUrl(item.shortCode));
    toast.success("Short link copied.");
  }

  async function logUpdate() {
    const note = updateNote.trim();
    if (!note) return;
    setSavingNote(true);
    onPatch({ updateNote: note, historyCount: item.historyCount + 1 });
    // Optimistically prepend; server insert happens via the PATCH above.
    setHistory((h) => [
      { id: `tmp-${Date.now()}`, updateNote: note, createdAt: new Date().toISOString(), createdByName: "You" },
      ...h,
    ]);
    setUpdateNote("");
    setSavingNote(false);
    toast.success("Update logged.");
  }

  const isLink = item.type === "link";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-150" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-paper-elevated border-l border-line shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start gap-2 px-5 py-4 border-b border-line">
          <span className={cn("shrink-0 mt-1", isLink ? "text-accent" : "text-warning")}>
            {isLink ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </span>
          <div className="flex-1 min-w-0">
            {isManager ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => saveIfChanged("title", title.trim() || "Untitled")}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="w-full bg-transparent text-base font-semibold text-ink outline-none focus:bg-line/40 rounded px-1 -mx-1"
              />
            ) : (
              <h2 className="text-base font-semibold text-ink">{item.title}</h2>
            )}
            <p className="text-[11px] text-mute-soft mt-0.5 px-1 -mx-1">
              {item.folderName} · updated {formatDate(item.updatedAt ?? item.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {isManager && (
              <Button variant="ghost" size="icon-sm" onClick={() => onPatch({ isPinned: !item.isPinned })} title={item.isPinned ? "Unpin" : "Pin"}>
                {item.isPinned ? <PinOff className="h-3.5 w-3.5 text-accent" /> : <Pin className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Link / file */}
          <Field label={isLink ? "Link" : "File"}>
            {isLink ? (
              <div className="flex items-center gap-1">
                {isManager ? (
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={() => saveIfChanged("url", url.trim())}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    placeholder="https://…"
                    className="font-mono-ui text-xs h-8"
                  />
                ) : (
                  <span className="flex-1 text-xs font-mono-ui text-mute truncate">{item.url}</span>
                )}
                {item.url && (
                  <>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" title="Open">
                      <Button variant="ghost" size="icon-sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </a>
                    <Button variant="ghost" size="icon-sm" onClick={copyLink} title="Copy link" className={copied ? "text-success" : ""}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-paper p-2.5 flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-warning shrink-0" />
                <span className="truncate text-ink">{item.fileName}</span>
                {item.fileSize ? <span className="text-mute-soft text-xs ml-auto">{formatBytes(item.fileSize)}</span> : null}
              </div>
            )}
            {item.shortCode && (
              <button onClick={copyShort} className="inline-flex items-center gap-1 text-[11px] text-accent/80 hover:text-accent font-mono-ui mt-1">
                <Scissors className="h-2.5 w-2.5" /> /l/{item.shortCode}
              </button>
            )}
          </Field>

          {/* Status */}
          <Field label="Status">
            <div className="relative">
              <button
                disabled={!isManager}
                onClick={() => setStatusOpen((o) => !o)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  status ? STATUS_CHIP[status.color] : "text-mute-soft border border-dashed border-line",
                  isManager && "hover:opacity-90"
                )}
              >
                {status ? status.label : "Set status"}
                {isManager && <ChevronDown className="h-3 w-3 opacity-60" />}
              </button>
              {statusOpen && isManager && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                  <div className="absolute z-20 mt-1 min-w-[160px] bg-paper-elevated border border-line rounded-lg shadow-lg py-1">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => { onPatch({ status: opt.label }); setStatusOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-ink hover:bg-line/50 text-left"
                      >
                        <span className={cn("h-2 w-2 rounded-full shrink-0", COLOR_DOT[opt.color])} />
                        <span className="truncate">{opt.label}</span>
                        {item.status === opt.label && <Check className="h-3 w-3 ml-auto text-accent" />}
                      </button>
                    ))}
                    {item.status && (
                      <>
                        <div className="my-1 border-t border-line" />
                        <button onClick={() => { onPatch({ status: null }); setStatusOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-mute hover:bg-line/50 text-left">
                          <X className="h-3 w-3" /> Clear
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </Field>

          {/* Row color */}
          {isManager && (
            <Field label="Row color">
              <div className="flex items-center gap-1.5 flex-wrap">
                {REGISTER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onPatch({ rowColor: item.rowColor === c ? null : c })}
                    title={c}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform hover:scale-110",
                      COLOR_DOT[c],
                      item.rowColor === c && "ring-2 ring-offset-1 ring-ink ring-offset-paper-elevated"
                    )}
                  />
                ))}
                {isRegisterColor(item.rowColor) && (
                  <button onClick={() => onPatch({ rowColor: null })} className="text-[11px] text-mute hover:text-ink ml-1">
                    Clear
                  </button>
                )}
              </div>
            </Field>
          )}

          {/* Description */}
          <Field label="Description">
            {isManager ? (
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => saveIfChanged("description", description.trim())}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                placeholder="A short line — what this is"
                maxLength={200}
                className="text-sm h-8"
              />
            ) : (
              <p className="text-sm text-mute">{item.description || "—"}</p>
            )}
          </Field>

          {/* Tags */}
          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5 items-center">
              {item.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-accent-soft text-accent-hover rounded-md px-2 py-0.5 text-xs font-medium">
                  #{t}
                  {isManager && (
                    <button onClick={() => removeTag(t)} className="text-accent/70 hover:text-accent">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              ))}
              {isManager && (
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commitTag(tagInput); }
                    else if (e.key === "Backspace" && !tagInput && item.tags.length) removeTag(item.tags[item.tags.length - 1]);
                  }}
                  onBlur={() => tagInput.trim() && commitTag(tagInput)}
                  placeholder={item.tags.length ? "Add…" : "Add a tag…"}
                  className="text-xs bg-transparent outline-none text-ink placeholder:text-mute-soft min-w-[80px] py-0.5"
                />
              )}
              {!isManager && item.tags.length === 0 && <span className="text-sm text-mute-soft">—</span>}
            </div>
          </Field>

          {/* Date */}
          <Field label="Date">
            {isManager ? (
              <Input
                type="datetime-local"
                defaultValue={new Date(item.itemDate).toISOString().slice(0, 16)}
                onChange={(e) => e.target.value && onPatch({ itemDate: new Date(e.target.value).toISOString() })}
                className="text-sm h-8 w-auto"
              />
            ) : (
              <p className="text-sm text-mute">{formatDateTime(item.itemDate)}</p>
            )}
          </Field>

          {/* Remark / notes */}
          <Field label="Remark">
            {isManager ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => saveIfChanged("notes", notes.trim())}
                placeholder="Any context that helps find or explain this…"
                className="text-sm min-h-[70px]"
              />
            ) : (
              <p className="text-sm text-mute whitespace-pre-wrap">{item.notes || "—"}</p>
            )}
          </Field>

          {/* History */}
          <Field label="Update history">
            {isManager && (
              <div className="flex items-start gap-1.5 mb-2">
                <Textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Log an update — e.g. 'v4 with new pricing'"
                  className="text-xs min-h-[40px]"
                />
                <Button variant="accent" size="sm" onClick={logUpdate} disabled={!updateNote.trim() || savingNote} className="shrink-0">
                  {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log"}
                </Button>
              </div>
            )}
            {historyLoading ? (
              <p className="text-xs text-mute-soft flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-mute-soft">No updates logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="flex items-start gap-2 text-xs">
                    <Clock className="h-3 w-3 text-mute-soft mt-0.5 shrink-0" />
                    <div>
                      <p className="text-ink">{h.updateNote}</p>
                      <p className="text-mute-soft text-[10px] mt-0.5">{h.createdByName} · {formatDateTime(h.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Field>
        </div>

        {/* Footer */}
        {isManager && (
          <div className="border-t border-line px-5 py-3">
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs text-mute hover:text-danger transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete this row
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
