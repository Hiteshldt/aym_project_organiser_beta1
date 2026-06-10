"use client";

import { useEffect, useState, useCallback, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Table2,
  Link2,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Pin,
  PinOff,
  Scissors,
  ChevronDown,
  X,
  Settings2,
  Palette,
  PanelRight,
  GripVertical,
  Loader2,
  Folder as FolderIcon,
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
  links?: { label: string; url: string }[] | null;
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
const CELL = "border-r border-line px-3 py-2.5 align-top";
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

type MenuState = { id: string; kind: "status" | "color"; rect: DOMRect };

export default function RegisterGrid({
  slug,
  folder,
  isManager,
  statusOptions,
  onStatusOptionsChange,
  onAddItem,
  refreshKey,
  initialItems,
  showFolder = false,
  canAdd = true,
}: {
  slug: string;
  folder: Folder;
  isManager: boolean;
  statusOptions: StatusOption[];
  onStatusOptionsChange?: (opts: StatusOption[]) => void;
  onAddItem: () => void;
  refreshKey: number;
  initialItems?: RegisterItem[];
  showFolder?: boolean;
  canAdd?: boolean;
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState<RegisterItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [statusMgrOpen, setStatusMgrOpen] = useState(false);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const q = folder ? `&folderId=${folder.id}` : "";
    const res = await fetch(`/api/workspace/items?slug=${slug}${q}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [slug, folder]);

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

  // ── Quick-add: spreadsheet-style ghost row at the bottom ────────
  const [qaTitle, setQaTitle] = useState("");
  const [qaUrl, setQaUrl] = useState("");
  const [qaSaving, setQaSaving] = useState(false);
  const qaTitleRef = useRef<HTMLInputElement>(null);

  async function quickAdd() {
    const t = qaTitle.trim();
    if (!t || !folder || qaSaving) return;
    setQaSaving(true);
    const res = await fetch("/api/workspace/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        folderId: folder.id,
        title: t,
        type: "link",
        url: qaUrl.trim() || null,
        tags: [],
        overrideDuplicate: true, // quick capture never blocks; dedupe via the full form
      }),
    });
    setQaSaving(false);
    if (!res.ok) {
      toast.error("Could not add the row.");
      return;
    }
    const created = await res.json();
    setItems((list) => [
      ...list,
      {
        ...created,
        folderName: folder.name,
        createdByName: "You",
        historyCount: 0,
      },
    ]);
    setQaTitle("");
    setQaUrl("");
    qaTitleRef.current?.focus(); // straight into the next entry
  }

  // ── Drag-to-reorder (manager, leaf folder only) ─────────────────
  const reorderable = isManager && !!folder && canAdd;
  const [dragId, setDragId] = useState<string | null>(null); // handle pressed → row draggable
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    const fromIdx = items.findIndex((i) => i.id === fromId);
    const toIdx = items.findIndex((i) => i.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setItems(next);
    fetch("/api/workspace/items/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, orderedIds: next.map((i) => i.id) }),
    }).then((r) => { if (!r.ok) toast.error("Could not save the new order."); });
  }

  function clearDrag() {
    setDragId(null);
    setDraggingId(null);
    setOverId(null);
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

  function openMenuFor(e: React.MouseEvent, id: string, kind: "status" | "color") {
    setMenu({ id, kind, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  }

  const colCount = 6 + (isManager ? 1 : 0) + (reorderable ? 1 : 0);
  const openItem = openItemId ? items.find((i) => i.id === openItemId) ?? null : null;
  const menuItem = menu ? items.find((i) => i.id === menu.id) ?? null : null;

  if (!loading && items.length === 0) {
    if (!canAdd) return null; // container folder — the sub-folder overview is the content
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-12 w-12 rounded-xl bg-accent-soft flex items-center justify-center mb-3">
          <Table2 className="h-5 w-5 text-accent" />
        </div>
        <p className="text-sm text-ink font-medium">
          {folder ? "This register is empty." : "No items yet."}
        </p>
        <p className="text-xs text-mute mt-1 max-w-xs">
          {folder
            ? "Add a row for each deliverable — name it, link it, set a status."
            : "Items you add to folders show up here."}
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
      {isManager && folder && canAdd && (
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
        <table className="w-full min-w-[720px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-line">
              {reorderable && <th className="w-6 bg-paper border-r border-line" />}
              <th className={cn(HEAD, "w-10")}>#</th>
              <th className={HEAD}>Name</th>
              <th className={cn(HEAD, "hidden md:table-cell")}>Description</th>
              <th className={cn(HEAD, "w-32")}>Status</th>
              <th className={cn(HEAD, "w-40")}>Link</th>
              <th className={cn(HEAD, "hidden lg:table-cell")}>Remark</th>
              <th className={cn(HEAD, "w-24")}>Updated</th>
              {isManager && <th className="px-3 py-2 w-32 bg-paper" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <GridSkeleton cols={colCount} />
            ) : (
              items.map((item, idx) => {
                const tint = isRegisterColor(item.rowColor) ? ROW_TINT[item.rowColor] : "";
                const status = findStatus(statusOptions, item.status);
                return (
                  <tr
                    key={item.id}
                    draggable={reorderable && dragId === item.id}
                    onDragStart={(e) => { setDraggingId(item.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragOver={(e) => { if (!draggingId) return; e.preventDefault(); setOverId(item.id); }}
                    onDrop={(e) => { e.preventDefault(); if (draggingId) reorder(draggingId, item.id); clearDrag(); }}
                    onDragEnd={clearDrag}
                    className={cn(
                      "group border-b border-line last:border-b-0 align-top transition-colors",
                      tint || "hover:bg-paper",
                      item.isPinned && !tint && "bg-accent-soft/30",
                      draggingId === item.id && "opacity-40",
                      overId === item.id && draggingId && draggingId !== item.id && "border-t-2 border-t-accent"
                    )}
                  >
                    {/* Drag handle */}
                    {reorderable && (
                      <td className="border-r border-line px-1 py-2 align-top">
                        <button
                          onMouseDown={() => setDragId(item.id)}
                          onMouseUp={() => setDragId(null)}
                          title="Drag to reorder"
                          aria-label="Drag to reorder"
                          className="cursor-grab active:cursor-grabbing text-mute-soft hover:text-mute opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}

                    {/* # / open */}
                    <td className={cn(CELL, "text-[11px] text-mute-soft font-mono-ui")}>
                      <button
                        onClick={() => setOpenItemId(item.id)}
                        title="Open details"
                        className="inline-flex items-center justify-center w-5 h-5 rounded hover:text-ink"
                      >
                        <span className="group-hover:hidden">{idx + 1}</span>
                        <PanelRight className="hidden group-hover:block h-3 w-3" />
                      </button>
                    </td>

                    {/* Name — click opens the detail panel */}
                    <td className={CELL}>
                      <div className="flex items-start gap-1.5">
                        <span className={cn("shrink-0 mt-0.5", item.type === "link" ? "text-accent" : "text-warning")}>
                          {item.type === "link" ? <Link2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => setOpenItemId(item.id)}
                            className="text-left font-medium text-ink leading-snug hover:text-accent transition-colors"
                          >
                            {item.title}
                            {item.isPinned && <Pin className="inline h-2.5 w-2.5 text-accent ml-1" fill="currentColor" />}
                          </button>
                          {showFolder && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-mute-soft font-mono-ui">
                              <FolderIcon className="h-2.5 w-2.5" />
                              {item.folderName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className={cn(CELL, "hidden md:table-cell text-[13px] text-mute leading-relaxed max-w-[240px]")}>
                      <InlineText
                        value={item.description}
                        editable={isManager}
                        placeholder="—"
                        onSave={(v) => patchItem(item.id, { description: v || null })}
                      />
                    </td>

                    {/* Status */}
                    <td className={CELL}>
                      {isManager ? (
                        <button
                          onClick={(e) => openMenuFor(e, item.id, "status")}
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
                            <span className="inline-flex items-center gap-1 max-w-full">
                              {item.type === "link" && item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-mono-ui truncate max-w-[130px] group/link"
                                >
                                  <span className="truncate">{prettyUrl(item.url)}</span>
                                  <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/link:opacity-100" />
                                </a>
                              ) : item.fileName ? (
                                <span className="text-xs text-mute font-mono-ui truncate block max-w-[130px]">{item.fileName}</span>
                              ) : (
                                <span className="text-mute-soft">—</span>
                              )}
                              {item.links && item.links.length > 0 && (
                                <span className="shrink-0 text-[10px] text-mute-soft font-mono-ui" title={`${item.links.length} more link${item.links.length !== 1 ? "s" : ""}`}>
                                  +{item.links.length}
                                </span>
                              )}
                            </span>
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
                    <td className={cn(CELL, "hidden lg:table-cell text-[13px] text-mute leading-relaxed max-w-[320px] whitespace-pre-wrap")}>
                      <InlineText
                        value={item.notes}
                        editable={isManager}
                        placeholder="—"
                        multiline
                        onSave={(v) => patchItem(item.id, { notes: v || null })}
                      />
                    </td>

                    {/* Updated */}
                    <td className={cn(CELL, "text-[11px] text-mute-soft whitespace-nowrap")}>
                      {formatDate(item.itemDate)}
                    </td>

                    {/* Actions */}
                    {isManager && (
                      <td className="px-2 py-2 align-top">
                        <div className="flex items-center gap-0.5 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon-sm" onClick={() => setOpenItemId(item.id)} title="Open details">
                            <PanelRight className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={(e) => openMenuFor(e, item.id, "color")} title="Row color">
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
                          <Button variant="ghost" size="icon-sm" onClick={() => patchItem(item.id, { isPinned: !item.isPinned })} title={item.isPinned ? "Unpin" : "Pin"}>
                            {item.isPinned ? <PinOff className="h-3 w-3 text-accent" /> : <Pin className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)} title="Delete">
                            <Trash2 className="h-3 w-3 text-mute-soft hover:text-danger" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}

            {/* Quick-add ghost row — type a title, paste a link, Enter. */}
            {!loading && isManager && folder && canAdd && (
              <tr className="border-t border-line bg-paper/50">
                {reorderable && <td className="border-r border-line" />}
                <td className="border-r border-line px-3 py-2 text-mute-soft">
                  <Plus className="h-3 w-3" />
                </td>
                <td className="border-r border-line px-2 py-1">
                  <input
                    ref={qaTitleRef}
                    value={qaTitle}
                    onChange={(e) => setQaTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && quickAdd()}
                    placeholder="Add a row — type a title…"
                    disabled={qaSaving}
                    className="w-full bg-transparent text-sm text-ink placeholder:text-mute-soft outline-none py-1 px-1 rounded focus:bg-paper-elevated"
                  />
                </td>
                <td className="hidden md:table-cell border-r border-line" />
                <td className="border-r border-line" />
                <td className="border-r border-line px-2 py-1">
                  <input
                    value={qaUrl}
                    onChange={(e) => setQaUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && quickAdd()}
                    placeholder="Paste link (optional)"
                    disabled={qaSaving}
                    className="w-full bg-transparent text-xs font-mono-ui text-ink placeholder:text-mute-soft outline-none py-1 px-1 rounded focus:bg-paper-elevated"
                  />
                </td>
                <td className="hidden lg:table-cell border-r border-line" />
                <td className="border-r border-line px-3 py-2">
                  {qaSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin text-mute-soft" />
                  ) : qaTitle.trim() ? (
                    <button onClick={quickAdd} className="text-[11px] text-accent hover:text-accent-hover font-medium">
                      ↵ Add
                    </button>
                  ) : null}
                </td>
                {isManager && <td />}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between mt-2">
          {isManager && folder && canAdd && (
            <button onClick={onAddItem} className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover">
              <Plus className="h-3.5 w-3.5" /> Add with details…
            </button>
          )}
          <p className="text-xs text-mute-soft ml-auto">
            {items.length} row{items.length !== 1 ? "s" : ""} · double-click a cell to edit
          </p>
        </div>
      )}

      {/* Status / color popover — portaled so the table's overflow never clips it */}
      {menu && menuItem && (
        <PortalMenu rect={menu.rect} onClose={() => setMenu(null)}>
          {menu.kind === "status" ? (
            <>
              {statusOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => { patchItem(menuItem.id, { status: opt.label }); setMenu(null); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-ink hover:bg-line/50 text-left"
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", COLOR_DOT[opt.color])} />
                  <span className="truncate">{opt.label}</span>
                  {menuItem.status === opt.label && <Check className="h-3 w-3 ml-auto text-accent" />}
                </button>
              ))}
              {menuItem.status && (
                <>
                  <div className="my-1 border-t border-line" />
                  <button onClick={() => { patchItem(menuItem.id, { status: null }); setMenu(null); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-mute hover:bg-line/50 text-left">
                    <X className="h-3 w-3" /> Clear
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="p-2">
              <div className="grid grid-cols-5 gap-1.5">
                {REGISTER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { patchItem(menuItem.id, { rowColor: c }); setMenu(null); }}
                    title={c}
                    className={cn("h-5 w-5 rounded-full transition-transform hover:scale-110", COLOR_DOT[c], menuItem.rowColor === c && "ring-2 ring-offset-1 ring-ink ring-offset-paper-elevated")}
                  />
                ))}
              </div>
              {menuItem.rowColor && (
                <button onClick={() => { patchItem(menuItem.id, { rowColor: null }); setMenu(null); }} className="mt-2 w-full text-[11px] text-mute hover:text-ink flex items-center justify-center gap-1 py-1">
                  <X className="h-3 w-3" /> No color
                </button>
              )}
            </div>
          )}
        </PortalMenu>
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

// ── Portal-anchored popover (never clipped by the table's overflow) ──
function PortalMenu({
  rect,
  onClose,
  children,
}: {
  rect: DOMRect;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;
  const flipUp = rect.bottom > window.innerHeight - 260;
  const style: CSSProperties = {
    position: "fixed",
    left: Math.min(rect.left, window.innerWidth - 196),
    ...(flipUp
      ? { top: rect.top - 4, transform: "translateY(-100%)" }
      : { top: rect.bottom + 4 }),
  };
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        style={style}
        onClick={(e) => e.stopPropagation()}
        className="z-[61] min-w-[176px] max-h-[60vh] overflow-auto bg-paper-elevated border border-line rounded-lg shadow-xl py-1"
      >
        {children}
      </div>
    </>,
    document.body
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
              <Input value={opt.label} onChange={(e) => update(i, { label: e.target.value })} className="h-8 text-sm" maxLength={40} />
              <button type="button" onClick={() => remove(i)} className="shrink-0 text-mute-soft hover:text-danger p-1" title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={add} className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover pt-1">
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
