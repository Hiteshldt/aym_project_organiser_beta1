"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Folder as FolderIcon,
  Link2,
  FileText,
  ExternalLink,
  Pin,
  Eye,
  X,
} from "lucide-react";
import { FOLDER_COLORS, formatDate, prettyUrl, cn } from "@/lib/utils";
import {
  type StatusOption,
  DEFAULT_STATUS_OPTIONS,
  STATUS_CHIP,
  ROW_TINT,
  findStatus,
  isRegisterColor,
} from "@/lib/register";
import { ThemeController, ThemeToggle } from "@/components/theme";

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  viewType?: "cards" | "register";
  statusOptions?: { label: string; color: string }[] | null;
  companyId: string;
  createdAt: string;
};

type Item = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  rowColor?: string | null;
  type: "link" | "file";
  url: string | null;
  links?: { label: string; url: string }[] | null;
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
};

export default function ShareView({
  company,
  label,
  folders,
  items,
}: {
  company: { name: string; slug: string };
  label: string | null;
  folders: Folder[];
  items: Item[];
}) {
  return (
    <ThemeController>
      <ShareInner company={company} label={label} folders={folders} items={items} />
    </ThemeController>
  );
}

function ShareInner({
  company,
  label,
  folders,
  items,
}: {
  company: { name: string; slug: string };
  label: string | null;
  folders: Folder[];
  items: Item[];
}) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedFolderId) {
      result = result.filter((i) => i.folderId === selectedFolderId);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q) ||
          i.url?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, selectedFolderId, query]);

  // folderId → its status options (for chip colors).
  const optionsByFolder = useMemo(() => {
    const m = new Map<string, StatusOption[]>();
    for (const f of folders) {
      m.set(f.id, f.statusOptions && f.statusOptions.length ? (f.statusOptions as StatusOption[]) : DEFAULT_STATUS_OPTIONS);
    }
    return m;
  }, [folders]);

  const rootFolders = folders.filter((f) => !f.parentId);
  const selectedFolder = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId) ?? null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* Top bar */}
      <header className="flex-none nav-blur border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/" className="font-display-italic text-lg sm:text-xl text-ink leading-none shrink-0">
            Ayuvam
          </Link>

          <div className="hidden md:flex items-center gap-3 text-center min-w-0">
            <span className="font-mono-ui text-[11px] uppercase tracking-wider text-mute-soft shrink-0">
              Shared workspace
            </span>
            <span className="text-mute-soft">·</span>
            <span className="text-sm font-medium text-ink truncate">{company.name}</span>
            {label && (
              <>
                <span className="text-mute-soft hidden lg:inline">·</span>
                <span className="text-sm text-mute italic truncate hidden lg:inline">{label}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-mono-ui text-accent">
              <Eye className="h-3 w-3" />
              View only
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex min-h-0 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r border-line py-6 px-3 hidden md:block">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
              !selectedFolderId ? "bg-accent-soft text-accent font-medium" : "text-mute hover:bg-line/50 hover:text-ink"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", !selectedFolderId ? "bg-accent" : "bg-mute-soft")} />
            All items
            <span className="ml-auto font-mono-ui text-[11px] text-mute-soft">{items.length}</span>
          </button>

          <div className="mt-4 px-3 mb-2">
            <span className="font-mono-ui text-[10px] uppercase tracking-wider text-mute-soft">Folders</span>
          </div>

          <nav className="space-y-0.5">
            {rootFolders.map((f) => (
              <FolderNode
                key={f.id}
                folder={f}
                depth={0}
                allFolders={folders}
                allItems={items}
                selectedId={selectedFolderId}
                onSelect={setSelectedFolderId}
              />
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5 sm:mb-6">
            <div className="min-w-0">
              <p className="font-mono-ui text-[11px] uppercase tracking-wider text-mute-soft">
                {selectedFolder ? "Folder" : "Overview"}
              </p>
              <h1 className="mt-1 font-display text-[28px] sm:text-3xl md:text-4xl text-ink leading-[1.1] tracking-[-0.02em] break-words">
                {selectedFolder ? selectedFolder.name : company.name}
              </h1>
              <p className="mt-1 text-sm text-mute">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                {query && ` matching "${query}"`}
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute-soft" />
              <input
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper-elevated pl-9 pr-9 py-2 text-sm outline-none focus:border-accent transition-colors text-ink"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute-soft hover:text-ink">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile folder filter */}
          {folders.length > 0 && (
            <div className="md:hidden -mx-4 px-4 mb-5 overflow-x-auto">
              <div className="flex items-center gap-1.5 min-w-max">
                <FolderChip active={!selectedFolderId} onClick={() => setSelectedFolderId(null)} label="All items" count={items.length} />
                {folders.map((f) => {
                  const colors = FOLDER_COLORS[f.color as keyof typeof FOLDER_COLORS] ?? FOLDER_COLORS.slate;
                  const count = items.filter((i) => i.folderId === f.id).length;
                  return (
                    <FolderChip key={f.id} active={selectedFolderId === f.id} onClick={() => setSelectedFolderId(f.id)} label={f.name} count={count} dotClass={colors.dot} />
                  );
                })}
              </div>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <RegisterTable
              items={filteredItems}
              optionsByFolder={optionsByFolder}
              showFolder={!selectedFolder}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="flex-none border-t border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-mute-soft">
          <span className="truncate">Read-only view shared by {company.name}.</span>
          <Link href="/" className="inline-flex items-center gap-1 hover:text-ink transition-colors shrink-0">
            Powered by <span className="font-display-italic text-ink ml-0.5">Ayuvam</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

const CELL = "border-r border-line px-3 py-2.5 align-top";
const HEAD = "border-r border-line px-3 py-2.5 text-left text-[11px] font-medium text-mute uppercase tracking-wide bg-paper";

function RegisterTable({
  items,
  optionsByFolder,
  showFolder,
}: {
  items: Item[];
  optionsByFolder: Map<string, StatusOption[]>;
  showFolder: boolean;
}) {
  return (
    <div className="border border-line rounded-xl overflow-x-auto bg-paper-elevated">
      <table className="w-full min-w-[720px] text-sm border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className={cn(HEAD, "w-10")}>#</th>
            <th className={HEAD}>Name</th>
            <th className={cn(HEAD, "hidden md:table-cell")}>Description</th>
            <th className={cn(HEAD, "w-32")}>Status</th>
            <th className={cn(HEAD, "w-40")}>Link</th>
            <th className={cn(HEAD, "hidden lg:table-cell")}>Remark</th>
            {showFolder && <th className={cn(HEAD, "hidden sm:table-cell w-32")}>Folder</th>}
            <th className={cn(HEAD, "w-24")}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const tint = isRegisterColor(item.rowColor) ? ROW_TINT[item.rowColor] : "";
            const options = optionsByFolder.get(item.folderId) ?? DEFAULT_STATUS_OPTIONS;
            const status = findStatus(options, item.status);
            return (
              <tr key={item.id} className={cn("border-b border-line last:border-b-0 align-top transition-colors", tint || "hover:bg-paper")}>
                <td className={cn(CELL, "text-[11px] text-mute-soft font-mono-ui")}>{idx + 1}</td>
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
                  {status ? (
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_CHIP[status.color])}>
                      {status.label}
                    </span>
                  ) : (
                    <span className="text-mute-soft">—</span>
                  )}
                </td>
                <td className={CELL}>
                  <div className="space-y-1">
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
                    {item.links && item.links.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.links.map((l, i) => (
                          <a
                            key={i}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[10px] text-accent/80 hover:text-accent border border-line rounded px-1.5 py-0.5 font-mono-ui max-w-[120px] truncate"
                          >
                            {l.label || "link"}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className={cn(CELL, "hidden lg:table-cell text-xs text-mute leading-snug max-w-[320px] whitespace-pre-wrap")}>
                  {item.notes || <span className="text-mute-soft">—</span>}
                </td>
                {showFolder && (
                  <td className={cn(CELL, "hidden sm:table-cell text-xs text-mute")}>
                    <span className="truncate block max-w-[120px]">{item.folderName}</span>
                  </td>
                )}
                <td className={cn(CELL, "text-[11px] text-mute-soft whitespace-nowrap")}>{formatDate(item.itemDate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FolderChip({
  active,
  onClick,
  label,
  count,
  dotClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dotClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors border",
        active
          ? "bg-accent-soft text-accent border-accent-soft font-medium"
          : "bg-paper-elevated text-mute border-line hover:border-line-strong hover:text-ink"
      )}
    >
      {dotClass && <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />}
      <span>{label}</span>
      <span className="font-mono-ui text-[10px] text-mute-soft">{count}</span>
    </button>
  );
}

function FolderNode({
  folder,
  depth,
  allFolders,
  allItems,
  selectedId,
  onSelect,
}: {
  folder: Folder;
  depth: number;
  allFolders: Folder[];
  allItems: Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const children = allFolders.filter((f) => f.parentId === folder.id);
  const itemCount = allItems.filter((i) => i.folderId === folder.id).length;
  const colors = FOLDER_COLORS[folder.color as keyof typeof FOLDER_COLORS] ?? FOLDER_COLORS.slate;
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <button
        onClick={() => onSelect(folder.id)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm transition-colors",
          isSelected ? "bg-accent-soft text-accent font-medium" : "text-mute hover:bg-line/50 hover:text-ink"
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot)} />
        <span className="truncate">{folder.name}</span>
        {itemCount > 0 && <span className="ml-auto font-mono-ui text-[11px] text-mute-soft">{itemCount}</span>}
      </button>

      {children.length > 0 && (
        <div>
          {children.map((c) => (
            <FolderNode
              key={c.id}
              folder={c}
              depth={depth + 1}
              allFolders={allFolders}
              allItems={allItems}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="h-12 w-12 rounded-full bg-line flex items-center justify-center mb-4">
        <FolderIcon className="h-5 w-5 text-mute-soft" />
      </div>
      <h3 className="font-display text-xl text-ink">
        {query ? `Nothing matched "${query}"` : "Nothing here yet."}
      </h3>
      <p className="mt-2 text-sm text-mute max-w-sm">
        {query
          ? "Try different keywords or check another folder."
          : "Once your contact adds something to this folder, it'll show up here."}
      </p>
    </div>
  );
}
