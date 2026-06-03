"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Scissors,
  ChevronDown,
  X,
  Settings2,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate, prettyUrl, cn } from "@/lib/utils";
import { buildShortLinkUrl } from "@/lib/shortcode";
import {
  type RegisterColor,
  type StatusOption,
  REGISTER_COLORS,
  STATUS_CHIP,
  COLOR_DOT,
  ROW_TINT,
  findStatus,
  isRegisterColor,
} from "@/lib/register";
import { useConfirm } from "@/components/ui/confirm";
import ItemPanel from "./ItemPanel";
import { toast } from "sonner";

type Folder = { id: string; name: string } | null;

export type RegisterItem = {
  id: string;
  title: string;
  description: string | null;
  shortCode?: string | null;
  status: string | null;
  rowColor: string | null;
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
  updatedAt?: string;
  createdByName: string;
  historyCount: number;
};

// Shared cell styling — thin grid lines on every side give the spreadsheet feel.
const CELL = "border-r border-line px-3 py-2 align-top";
const HEAD =
  "border-r border-line px-3 py-2 text-left text-[11px] font-medium text-mute uppercase tracking-wide bg-paper";

function GridSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, r) => (
        <tr key={r} className="border-b border-line">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="border-r border-line px-3 py-2.5">
              <div className="h-3.5 bg-line rounded animate-pulse" style={{ width: `${40 + ((r + c) % 4) * 18}px` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function RegisterGrid({
  slug,
  folder,
  isManager,
  statusOptions,
  onStatusOptionsChange,
  onAddItem,
  refreshKey,
  initialItems,
  showFolderColumn = false,
}: {
  slug: string;
  folder: Folder;
  isManager: boolean;
  statusOptions: StatusOption[];
  onStatusOptionsChange?: (opts: StatusOption[]) => void;
  onAddItem: () => void;
  refreshKey: number;
  initialItems?: RegisterItem[];
  showFolderColumn?: boolean;
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState<RegisterItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // One open per-row menu at a time: { id, kind }
  const [openMenu, setOpenMenu] = useState<{ id: string; kind: "status" | "color" } | null>(null);
  const [statusMgrOpen, setStatusMgrOpen] = useState(false);
  // Detail panel: single-click a row opens it; double-click a cell edits inline.
  // A short timer disambiguates the two so they don't fight.
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelOpen = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);
  const scheduleOpen = useCallback((id: string) => {
    cancelOpen();
    openTimer.current = setTimeout(() => setOpenItemId(id), 200);
  }, [cancelOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    const q = folder ? `&folderId=${folder.id}` : "";
    const res = await fetch(`/api/workspace/items?slug=${slug}${q}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [slug, folder]);

  // Seeded from the server on first paint (all-items only) — skip that fetch.
  const seeded = useRef(!!initialItems);
  useEffect(() => {
    if (seeded.current) {
      seeded.current = false;
      return;
    }
    load();
  }, [load, refreshKey]);

  // ── Mutations (optimistic) ──────────────────────────────────────
  const patchItem = useCallback(
    async (id: string, patch: Partial<RegisterItem> & { updateNote?: string }) => {
      const prev = items;
      setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
      const res = await fetch("/api/workspace/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, slug, ...patch }),
      });
      if (!res.ok) {
        setItems(prev);
        toast.error("Could not save the change.");
      }
    },
    [items, slug]
  );

  async function handleDelete(id: string): Promise<boolean> {
    const target = items.find((i) => i.id === id);
    const ok = await confirm({
      title: "Delete this row?",
      body: target ? `"${target.title}" will be removed.` : undefined,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return false;
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== id));
    const res = await fetch(`/api/workspace/items?id=${id}&slug=${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Row deleted.");
      return true;
    }
    setItems(prev);
    toast.error("Could not delete row.");
    return false;
  }

  function copyUrl(item: RegisterItem) {
    if (!item.url) return;
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success("Link copied.");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function copyShort(item: RegisterItem) {
    if (!item.shortCode) return;
    navigator.clipboard.writeText(buildShortLinkUrl(item.shortCode));
    toast.success("Short link copied.");
  }

  // Column count for skeleton / colspans
  const cols = 4 + (showFolderColumn ? 1 : 0) + (isManager ? 1 : 0);

  const openItem = openItemId ? items.find((i) => i.id === openItemId) ?? null : null;

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-12 w-12 rounded-xl bg-accent-soft flex items-center justify-center mb-3">
          <Table2 className="h-5 w-5 text-accent" />
        </div>
        <p className="text-sm text-ink font-medium">This register is empty.</p>
        <p className="text-xs text-mute mt-1 max-w-xs">
          Add a row for each deliverable — name it, link it, set a status.
        </p>
        {isManager && folder && (
          <Button size="sm" variant="accent" className="mt-4" onClick={onAddItem}>
            <Plus className="h-3.5 w-3.5" /> Add first row
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4">
      {/* Toolbar */}
      {isManager && folder && (
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={() => setStatusMgrOpen(true)}
            className="inline-flex items-center gap-1.5 text-[11px] text-mute hover:text-ink transition-colors"
            title="Customize the status options for this register"
          >
            <Settings2 className="h-3 w-3" />
            Edit statuses
          </button>
        </div>
      )}

      <div className="border border-line rounded-xl overflow-x-auto bg-paper-elevated">
        <table className="w-full min-w-[760px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className={cn(HEAD, "w-10")}>#</th>
              <th className={HEAD}>Name</th>
              <th className={cn(HEAD, "hidden md:table-cell")}>Description</th>
              <th className={cn(HEAD, "w-32")}>Status</th>
              <th className={cn(HEAD, "w-40")}>Link</th>
              <th className={cn(HEAD, "hidden lg:table-cell")}>Remark</th>
              {showFolderColumn && <th className={cn(HEAD, "hidden sm:table-cell w-32")}>Folder</th>}
              <th className={cn(HEAD, "w-24")}>Updated</th>
              {isManager && <th className="px-3 py-2 w-28 bg-paper" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <GridSkeleton cols={cols + 3} />
            ) : (
              items.map((item, idx) => {
                const tint = isRegisterColor(item.rowColor) ? ROW_TINT[item.rowColor] : "";
                const status = findStatus(statusOptions, item.status);
                return (
                  <tr
                    key={item.id}
                    onClick={() => scheduleOpen(item.id)}
                    onDoubleClick={cancelOpen}
                    className={cn(
                      "group border-b border-line last:border-b-0 align-top transition-colors cursor-pointer",
                      tint || "hover:bg-paper",
                      item.isPinned && !tint && "bg-accent-soft/30"
                    )}
                  >
                    {/* # */}
                    <td className={cn(CELL, "text-[11px] text-mute-soft font-mono-ui")}>{idx + 1}</td>

                    {/* Name */}
                    <td className={CELL}>
                      <div className="flex items-start gap-1.5">
                        <span className={cn("shrink-0 mt-0.5", item.type === "link" ? "text-accent" : "text-warning")}>
                          {item.type === "link" ? <Link2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <InlineText
                            value={item.title}
                            editable={isManager}
                            placeholder="Untitled"
                            className="font-medium text-ink leading-snug"
                            onSave={(v) => patchItem(item.id, { title: v || "Untitled" })}
                          />
                          {item.isPinned && (
                            <Pin className="inline h-2.5 w-2.5 text-accent ml-1" fill="currentColor" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className={cn(CELL, "hidden md:table-cell text-xs text-mute leading-snug max-w-[240px]")}>
                      <InlineText
                        value={item.description}
                        editable={isManager}
                        placeholder="—"
                        onSave={(v) => patchItem(item.id, { description: v || null })}
                      />
                    </td>

                    {/* Status */}
                    <td className={cn(CELL, "relative")}>
                      {isManager ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu?.id === item.id && openMenu.kind === "status" ? null : { id: item.id, kind: "status" }); }}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors max-w-full",
                            status ? STATUS_CHIP[status.color] : "text-mute-soft hover:text-mute border border-dashed border-line"
                          )}
                        >
                          <span className="truncate">{status ? status.label : "Set status"}</span>
                          <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-60" />
                        </button>
                      ) : status ? (
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_CHIP[status.color])}>
                          {status.label}
                        </span>
                      ) : (
                        <span className="text-mute-soft">—</span>
                      )}

                      {openMenu?.id === item.id && openMenu.kind === "status" && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                          <div onClick={(e) => e.stopPropagation()} className="absolute z-50 mt-1 left-3 min-w-[160px] bg-paper-elevated border border-line rounded-lg shadow-lg py-1">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => { patchItem(item.id, { status: opt.label }); setOpenMenu(null); }}
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
                                <button
                                  onClick={() => { patchItem(item.id, { status: null }); setOpenMenu(null); }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-mute hover:bg-line/50 text-left"
                                >
                                  <X className="h-3 w-3" /> Clear
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Link */}
                    <td className={CELL}>
                      {isManager ? (
                        <InlineText
                          value={item.url}
                          editable={item.type === "link"}
                          placeholder={item.type === "file" ? item.fileName ?? "—" : "—"}
                          mono
                          display={
                            item.type === "link" && item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-mono-ui truncate max-w-[150px] group/link"
                              >
                                <span className="truncate">{prettyUrl(item.url)}</span>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/link:opacity-100" />
                              </a>
                            ) : item.fileName ? (
                              <span className="text-xs text-mute font-mono-ui truncate block max-w-[150px]">{item.fileName}</span>
                            ) : (
                              <span className="text-mute-soft">—</span>
                            )
                          }
                          onSave={(v) => patchItem(item.id, { url: v || null })}
                        />
                      ) : item.type === "link" && item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-mono-ui truncate max-w-[150px]">
                          <span className="truncate">{prettyUrl(item.url)}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-mute font-mono-ui truncate block max-w-[150px]">{item.fileName ?? "—"}</span>
                      )}
                    </td>

                    {/* Remark */}
                    <td className={cn(CELL, "hidden lg:table-cell text-xs text-mute leading-snug max-w-[320px] whitespace-pre-wrap")}>
                      <InlineText
                        value={item.notes}
                        editable={isManager}
                        placeholder="—"
                        multiline
                        onSave={(v) => patchItem(item.id, { notes: v || null })}
                      />
                    </td>

                    {/* Folder (all-items mode) */}
                    {showFolderColumn && (
                      <td className={cn(CELL, "hidden sm:table-cell text-xs text-mute")}>
                        <span className="truncate block max-w-[120px]">{item.folderName}</span>
                      </td>
                    )}

                    {/* Updated */}
                    <td className={cn(CELL, "text-[11px] text-mute-soft whitespace-nowrap")}>
                      {formatDate(item.itemDate)}
                    </td>

                    {/* Actions */}
                    {isManager && (
                      <td className="px-2 py-2 align-top relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {/* Row color */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setOpenMenu(openMenu?.id === item.id && openMenu.kind === "color" ? null : { id: item.id, kind: "color" })}
                            title="Row color"
                          >
                            <Palette className="h-3 w-3" />
                          </Button>
                          {item.type === "link" && item.url && (
                            <Button variant="ghost" size="icon-sm" onClick={() => copyUrl(item)} title={copiedId === item.id ? "Copied!" : "Copy link"} className={copiedId === item.id ? "text-success" : ""}>
                              {copiedId === item.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          )}
                          {item.url && item.shortCode && (
                            <Button variant="ghost" size="icon-sm" onClick={() => copyShort(item)} title="Copy short link">
                              <Scissors className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" onClick={() => setOpenItemId(item.id)} title="Open details">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => patchItem(item.id, { isPinned: !item.isPinned })} title={item.isPinned ? "Unpin" : "Pin"}>
                            {item.isPinned ? <PinOff className="h-3 w-3 text-accent" /> : <Pin className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)} title="Delete">
                            <Trash2 className="h-3 w-3 text-mute-soft hover:text-danger" />
                          </Button>
                        </div>

                        {openMenu?.id === item.id && openMenu.kind === "color" && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-2 z-50 mt-1 bg-paper-elevated border border-line rounded-lg shadow-lg p-2">
                              <div className="grid grid-cols-5 gap-1.5">
                                {REGISTER_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => { patchItem(item.id, { rowColor: c }); setOpenMenu(null); }}
                                    title={c}
                                    className={cn("h-5 w-5 rounded-full transition-transform hover:scale-110", COLOR_DOT[c], item.rowColor === c && "ring-2 ring-offset-1 ring-ink ring-offset-paper-elevated")}
                                  />
                                ))}
                              </div>
                              {item.rowColor && (
                                <button
                                  onClick={() => { patchItem(item.id, { rowColor: null }); setOpenMenu(null); }}
                                  className="mt-2 w-full text-[11px] text-mute hover:text-ink flex items-center justify-center gap-1 py-1"
                                >
                                  <X className="h-3 w-3" /> No color
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between mt-2">
          {isManager && folder && (
            <button onClick={onAddItem} className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover">
              <Plus className="h-3.5 w-3.5" /> Add row
            </button>
          )}
          <p className="text-xs text-mute-soft ml-auto">
            {items.length} row{items.length !== 1 ? "s" : ""} · double-click a cell to edit
          </p>
        </div>
      )}

      {/* Status manager */}
      {onStatusOptionsChange && (
        <StatusManager
          open={statusMgrOpen}
          onClose={() => setStatusMgrOpen(false)}
          options={statusOptions}
          onSave={(opts) => { onStatusOptionsChange(opts); setStatusMgrOpen(false); }}
        />
      )}

      {/* Detail panel */}
      {openItem && (
        <ItemPanel
          key={openItem.id}
          slug={slug}
          item={openItem}
          isManager={isManager}
          statusOptions={statusOptions}
          onClose={() => setOpenItemId(null)}
          onPatch={(patch) => patchItem(openItem.id, patch)}
          onDelete={async () => {
            const ok = await handleDelete(openItem.id);
            if (ok) setOpenItemId(null);
          }}
        />
      )}
    </div>
  );
}

// ── Inline-editable cell ──────────────────────────────────────────
function InlineText({
  value,
  editable,
  placeholder = "—",
  multiline = false,
  mono = false,
  className,
  display,
  onSave,
}: {
  value: string | null;
  editable: boolean;
  placeholder?: string;
  multiline?: boolean;
  mono?: boolean;
  className?: string;
  display?: React.ReactNode;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  function commit() {
    setEditing(false);
    if (draft !== (value ?? "")) onSave(draft);
  }

  if (editing) {
    const shared = "w-full bg-paper-elevated border border-accent rounded px-1.5 py-1 text-xs text-ink outline-none";
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
        }}
        className={cn(shared, "min-h-[48px] resize-y")}
      />
    ) : (
      <input
        autoFocus
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
          if (e.key === "Enter") commit();
        }}
        className={cn(shared, mono && "font-mono-ui")}
      />
    );
  }

  return (
    <div
      onDoubleClick={() => editable && setEditing(true)}
      className={cn(editable && "cursor-text rounded hover:bg-line/40 -mx-1 px-1", className)}
      title={editable ? "Double-click to edit" : undefined}
    >
      {display ?? (value ? value : <span className="text-mute-soft">{placeholder}</span>)}
    </div>
  );
}

// ── Status options manager ────────────────────────────────────────
function StatusManager({
  open,
  onClose,
  options,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  options: StatusOption[];
  onSave: (opts: StatusOption[]) => void;
}) {
  const [draft, setDraft] = useState<StatusOption[]>(options);

  useEffect(() => {
    if (open) setDraft(options.length ? options : []);
  }, [open, options]);

  function update(i: number, patch: Partial<StatusOption>) {
    setDraft((d) => d.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  function remove(i: number) {
    setDraft((d) => d.filter((_, idx) => idx !== i));
  }
  function add() {
    setDraft((d) => [...d, { label: "New status", color: "slate" }]);
  }
  function cycleColor(i: number, current: RegisterColor) {
    const next = REGISTER_COLORS[(REGISTER_COLORS.indexOf(current) + 1) % REGISTER_COLORS.length];
    update(i, { color: next });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Statuses for this register</DialogTitle>
          <DialogDescription>
            Rename, recolor, add or remove. These apply to every row here and show on the client view.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-2">
          {draft.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cycleColor(i, opt.color)}
                title="Click to change color"
                className={cn("h-5 w-5 rounded-full shrink-0 transition-transform hover:scale-110", COLOR_DOT[opt.color])}
              />
              <Input
                value={opt.label}
                onChange={(e) => update(i, { label: e.target.value })}
                className="h-8 text-sm"
                maxLength={40}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="shrink-0 text-mute-soft hover:text-danger p-1"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover pt-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add a status
          </button>

          <div className="flex gap-2 pt-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="accent"
              className="flex-1"
              onClick={() => onSave(draft.filter((o) => o.label.trim()).map((o) => ({ label: o.label.trim(), color: o.color })))}
            >
              Save statuses
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
