"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime, formatBytes, toDatetimeLocal, cn } from "@/lib/utils";
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

type RefEntry = {
  id: string;
  targetId: string;
  note: string | null;
  title: string;
  folderId: string;
  folderName: string;
};

type RefCandidate = { id: string; title: string; folderId: string; folderName: string };

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
  onPatch: onPatchRaw,
  onDelete,
  onNavigate,
}: {
  slug: string;
  item: RegisterItem;
  isManager: boolean;
  statusOptions: StatusOption[];
  onClose: () => void;
  onPatch: (patch: Partial<RegisterItem> & { updateNote?: string }) => void;
  onDelete: () => void;
  /** Jump to another item (possibly in another folder), e.g. a reference. */
  onNavigate?: (folderId: string, itemId: string) => void;
}) {
  // Every field change marks the session dirty; by default a dirty session
  // wants a history note on close (the user can untick to skip the log).
  const [dirty, setDirty] = useState(false);
  const [logEnabled, setLogEnabled] = useState(true);
  const [needNote, setNeedNote] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const onPatch = useCallback(
    (patch: Partial<RegisterItem> & { updateNote?: string }) => {
      setDirty(true);
      onPatchRaw(patch);
    },
    [onPatchRaw]
  );
  // Legacy file items carry their blob URL in `url`; treat that as the file's
  // address, not as an editable link.
  const isLegacyFile = item.type === "file" && !item.fileUrl && !!item.url;
  const fileHref = item.fileUrl ?? (isLegacyFile ? item.url : null);

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [url, setUrl] = useState(isLegacyFile ? "" : item.url ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [updateNote, setUpdateNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [links, setLinks] = useState<{ label: string; url: string }[]>(item.links ?? []);

  const status = findStatus(statusOptions, item.status);
  const isLink = item.type === "link";

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

  // ── References (item ↔ item, cross-folder) ─────────────────────
  const [outRefs, setOutRefs] = useState<RefEntry[]>([]);
  const [inRefs, setInRefs] = useState<RefEntry[]>([]);
  const [addRefOpen, setAddRefOpen] = useState(false);
  const [refQuery, setRefQuery] = useState("");
  const [candidates, setCandidates] = useState<RefCandidate[] | null>(null);
  const [picked, setPicked] = useState<RefCandidate | null>(null);
  const [refNote, setRefNote] = useState("");
  const [savingRef, setSavingRef] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/workspace/items/references?itemId=${item.id}&slug=${slug}`)
      .then((r) => (r.ok ? r.json() : { outgoing: [], incoming: [] }))
      .then((d) => {
        if (!alive) return;
        setOutRefs(d.outgoing ?? []);
        setInRefs(d.incoming ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [item.id, slug]);

  function openAddRef() {
    setAddRefOpen(true);
    if (candidates === null) {
      fetch(`/api/workspace/items?slug=${slug}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((list: RefCandidate[]) => setCandidates(list))
        .catch(() => setCandidates([]));
    }
  }

  const refCandidates = (candidates ?? [])
    .filter(
      (c) =>
        c.id !== item.id &&
        !outRefs.some((r) => r.targetId === c.id) &&
        (!refQuery.trim() ||
          c.title.toLowerCase().includes(refQuery.trim().toLowerCase()) ||
          c.folderName.toLowerCase().includes(refQuery.trim().toLowerCase()))
    )
    .slice(0, 6);

  async function addReference() {
    if (!picked || savingRef) return;
    setSavingRef(true);
    const res = await fetch("/api/workspace/items/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, itemId: item.id, refItemId: picked.id, note: refNote.trim() || null }),
    });
    setSavingRef(false);
    if (!res.ok) {
      toast.error("Could not add the reference.");
      return;
    }
    const created = await res.json();
    setOutRefs((rs) => [
      ...rs,
      { id: created.id, targetId: picked.id, note: created.note, title: picked.title, folderId: picked.folderId, folderName: picked.folderName },
    ]);
    setPicked(null);
    setRefQuery("");
    setRefNote("");
    setAddRefOpen(false);
    toast.success("Reference added.");
  }

  async function removeReference(id: string) {
    setOutRefs((rs) => rs.filter((r) => r.id !== id));
    const res = await fetch(`/api/workspace/items/references?id=${id}&slug=${slug}`, { method: "DELETE" });
    if (!res.ok) toast.error("Could not remove the reference.");
  }

  const saveIfChanged = useCallback(
    (field: keyof RegisterItem, value: string | null) => {
      const current = (item[field] ?? "") as string;
      if ((value ?? "") !== current) onPatch({ [field]: value || null } as Partial<RegisterItem>);
    },
    [item, onPatch]
  );

  function commitLinks(next: { label: string; url: string }[]) {
    onPatch({ links: next.map((l) => ({ label: l.label.trim(), url: l.url.trim() })).filter((l) => l.url) });
  }
  function updateLink(i: number, patch: Partial<{ label: string; url: string }>) {
    setLinks((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLink() {
    setLinks((ls) => [...ls, { label: "", url: "" }]);
  }
  function removeLink(i: number) {
    const next = links.filter((_, idx) => idx !== i);
    setLinks(next);
    commitLinks(next);
  }

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
    onPatchRaw({ updateNote: note, historyCount: item.historyCount + 1 });
    setHistory((h) => [
      { id: `tmp-${Date.now()}`, updateNote: note, createdAt: new Date().toISOString(), createdByName: "You" },
      ...h,
    ]);
    setUpdateNote("");
    setSavingNote(false);
    setDirty(false);
    setNeedNote(false);
    toast.success("Update logged.");
  }

  // Closing a dirty session: log the note (default), nudge for one if it's
  // missing, or close silently when the user opted out of the history log.
  function requestClose() {
    const note = updateNote.trim();
    if (isManager && dirty && logEnabled) {
      if (!note) {
        setNeedNote(true);
        noteRef.current?.focus();
        return;
      }
      onPatchRaw({ updateNote: note, historyCount: item.historyCount + 1 });
      toast.success("Update logged.");
    }
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && requestClose()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="sr-only">{item.title}</DialogTitle>

        {/* Header */}
        <div className="flex items-start gap-2 px-5 py-4 border-b border-line pr-12">
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
          {isManager && (
            <Button variant="ghost" size="icon-sm" onClick={() => onPatch({ isPinned: !item.isPinned })} title={item.isPinned ? "Unpin" : "Pin"} className="shrink-0">
              {item.isPinned ? <PinOff className="h-3.5 w-3.5 text-accent" /> : <Pin className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
          <div className="grid md:grid-cols-3 gap-x-6 gap-y-5">
            {/* Left column — content */}
            <div className="md:col-span-2 space-y-5">
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

              <Field label="Note">
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

              <Field label="Link">
                <div className="flex items-center gap-1">
                  {isManager ? (
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onBlur={() => saveIfChanged("url", url.trim())}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      placeholder="https://… (optional)"
                      className="font-mono-ui text-xs h-8"
                    />
                  ) : (
                    <span className="flex-1 text-xs font-mono-ui text-mute truncate">
                      {(isLegacyFile ? null : item.url) || "—"}
                    </span>
                  )}
                  {!isLegacyFile && item.url && (
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
                {item.shortCode && (
                  <button onClick={copyShort} className="inline-flex items-center gap-1 text-[11px] text-accent/80 hover:text-accent font-mono-ui mt-1">
                    <Scissors className="h-2.5 w-2.5" /> /l/{item.shortCode}
                  </button>
                )}
              </Field>

              {item.fileName && (
                <Field label="File">
                  <a
                    href={fileHref ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "rounded-lg border border-line bg-paper p-2.5 flex items-center gap-2 text-sm",
                      fileHref && "hover:border-line-strong transition-colors"
                    )}
                  >
                    <FileText className="h-4 w-4 text-warning shrink-0" />
                    <span className="truncate text-ink">{item.fileName}</span>
                    {item.fileSize ? <span className="text-mute-soft text-xs ml-auto">{formatBytes(item.fileSize)}</span> : null}
                  </a>
                </Field>
              )}

              {(isManager || links.length > 0) && (
                <Field label="More links">
                  {isManager ? (
                    <div className="space-y-1.5">
                      {links.map((l, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Input value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} onBlur={() => commitLinks(links)} placeholder="Label" className="h-8 w-24 text-xs" />
                          <Input value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} onBlur={() => commitLinks(links)} placeholder="https://…" className="h-8 flex-1 text-xs font-mono-ui" />
                          <button type="button" onClick={() => removeLink(i)} className="shrink-0 text-mute-soft hover:text-danger p-1" title="Remove">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addLink} className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover">
                        <Plus className="h-3.5 w-3.5" /> Add a link
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {links.map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{l.label || l.url}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </Field>
              )}

              {/* References — link related items, jump between them */}
              {(isManager || outRefs.length > 0 || inRefs.length > 0) && (
                <Field label="References">
                  <div className="space-y-1.5">
                    {outRefs.map((r) => (
                      <div
                        key={r.id}
                        className="group rounded-lg border border-line bg-paper px-2.5 py-2 hover:border-line-strong transition-colors cursor-pointer"
                        onClick={() => onNavigate?.(r.folderId, r.targetId)}
                        title={`Open "${r.title}"`}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <ArrowUpRight className="h-3 w-3 text-accent shrink-0" />
                          <span className="text-xs font-medium text-ink truncate">{r.title}</span>
                          <span className="text-[10px] text-mute-soft font-mono-ui truncate shrink-0">· {r.folderName}</span>
                          {isManager && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeReference(r.id); }}
                              className="ml-auto shrink-0 text-mute-soft hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                              title="Remove reference"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                        {r.note && <p className="text-[11px] text-mute mt-0.5 pl-[18px] leading-snug">{r.note}</p>}
                      </div>
                    ))}

                    {isManager &&
                      (addRefOpen ? (
                        <div className="rounded-lg border border-line bg-paper p-2 space-y-1.5">
                          {!picked ? (
                            <>
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-mute-soft" />
                                <input
                                  autoFocus
                                  value={refQuery}
                                  onChange={(e) => setRefQuery(e.target.value)}
                                  onKeyDown={(e) => e.key === "Escape" && setAddRefOpen(false)}
                                  placeholder="Search items across folders…"
                                  className="w-full bg-transparent text-xs text-ink placeholder:text-mute-soft outline-none pl-7 pr-2 py-1.5 border border-line rounded-md focus:border-accent"
                                />
                              </div>
                              {candidates === null ? (
                                <p className="text-[11px] text-mute-soft flex items-center gap-1 px-1">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Loading items…
                                </p>
                              ) : refCandidates.length === 0 ? (
                                <p className="text-[11px] text-mute-soft px-1">No matching items.</p>
                              ) : (
                                refCandidates.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setPicked(c)}
                                    className="flex items-center gap-1.5 w-full text-left px-1.5 py-1 rounded hover:bg-line/50 min-w-0"
                                  >
                                    <span className="text-xs text-ink truncate">{c.title}</span>
                                    <span className="text-[10px] text-mute-soft font-mono-ui truncate shrink-0">· {c.folderName}</span>
                                  </button>
                                ))
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-ink px-1">
                                <ArrowUpRight className="inline h-3 w-3 text-accent mr-1" />
                                {picked.title}
                                <span className="text-[10px] text-mute-soft font-mono-ui"> · {picked.folderName}</span>
                                <button type="button" onClick={() => setPicked(null)} className="ml-2 text-[11px] text-mute underline hover:text-ink">
                                  change
                                </button>
                              </p>
                              <Input
                                value={refNote}
                                onChange={(e) => setRefNote(e.target.value)}
                                placeholder="Why is this related? (optional)"
                                maxLength={300}
                                className="h-8 text-xs"
                                autoFocus
                              />
                              <div className="flex gap-1.5">
                                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setAddRefOpen(false); setPicked(null); setRefNote(""); }}>
                                  Cancel
                                </Button>
                                <Button type="button" variant="accent" size="sm" className="flex-1" onClick={addReference} disabled={savingRef}>
                                  {savingRef ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add reference"}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <button type="button" onClick={openAddRef} className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover">
                          <Plus className="h-3.5 w-3.5" /> Add a reference
                        </button>
                      ))}

                    {inRefs.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        <p className="font-mono-ui text-[10px] uppercase tracking-wider text-mute-soft">Referenced by</p>
                        {inRefs.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => onNavigate?.(r.folderId, r.targetId)}
                            className="flex items-center gap-1.5 w-full text-left px-1 py-0.5 rounded hover:bg-line/40 min-w-0"
                            title={`Open "${r.title}"`}
                          >
                            <ArrowDownLeft className="h-3 w-3 text-mute-soft shrink-0" />
                            <span className="text-xs text-ink truncate">{r.title}</span>
                            <span className="text-[10px] text-mute-soft font-mono-ui truncate shrink-0">· {r.folderName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
              )}
            </div>

            {/* Right column — metadata */}
            <div className="space-y-5">
              <Field label="Date">
                {isManager ? (
                  <Input
                    type="datetime-local"
                    defaultValue={toDatetimeLocal(item.itemDate)}
                    onChange={(e) => e.target.value && onPatch({ itemDate: new Date(e.target.value).toISOString() })}
                    className="text-sm h-8"
                  />
                ) : (
                  <p className="text-sm text-mute">{formatDateTime(item.itemDate)}</p>
                )}
              </Field>

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

              <div className="border-t border-line pt-4 space-y-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-wider text-mute-soft">
                  Item settings
                </p>
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
                      className="text-xs bg-transparent outline-none text-ink placeholder:text-mute-soft min-w-[70px] py-0.5"
                    />
                  )}
                  {!isManager && item.tags.length === 0 && <span className="text-sm text-mute-soft">—</span>}
                </div>
              </Field>
              </div>
            </div>

            {/* History — full width */}
            <div className="md:col-span-3 border-t border-line pt-4">
              <Field label="Update history">
                {isManager && (
                  <div className="mb-2 space-y-1.5">
                    <label className="flex items-center gap-2 text-xs text-mute cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={logEnabled}
                        onChange={(e) => {
                          setLogEnabled(e.target.checked);
                          if (!e.target.checked) setNeedNote(false);
                        }}
                        className="h-3.5 w-3.5 accent-[var(--accent)]"
                      />
                      Log this update to history
                      <span className="text-mute-soft">· untick for a silent edit</span>
                    </label>
                    {logEnabled && (
                      <div className="flex items-start gap-1.5">
                        <Textarea
                          ref={noteRef}
                          value={updateNote}
                          onChange={(e) => {
                            setUpdateNote(e.target.value);
                            if (e.target.value.trim()) setNeedNote(false);
                          }}
                          placeholder="What changed? — e.g. 'v4 with new pricing'"
                          className={cn("text-xs min-h-[40px]", needNote && "border-danger focus:border-danger")}
                        />
                        <Button variant="accent" size="sm" onClick={logUpdate} disabled={!updateNote.trim() || savingNote} className="shrink-0">
                          {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log"}
                        </Button>
                      </div>
                    )}
                    {needNote && (
                      <p className="text-[11px] text-danger">
                        You made changes — describe them to close, or untick the box to skip the log.
                      </p>
                    )}
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
          </div>
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
      </DialogContent>
    </Dialog>
  );
}
