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
import { FOLDER_COLORS, formatDate, formatBytes, cn } from "@/lib/utils";

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  companyId: string;
  createdAt: string;
};

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
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Filtered items based on folder + search
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
          i.notes?.toLowerCase().includes(q) ||
          i.url?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, selectedFolderId, query]);

  const rootFolders = folders.filter((f) => !f.parentId);
  const selectedFolder = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId) ?? null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* Top bar */}
      <header className="flex-none nav-blur border-b border-line">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          {/* Left — Ayuvam logo */}
          <Link
            href="/"
            className="font-display-italic text-xl text-ink leading-none"
          >
            Ayuvam
          </Link>

          {/* Center — workspace identity */}
          <div className="hidden sm:flex items-center gap-3 text-center">
            <span className="font-mono-ui text-[11px] uppercase tracking-wider text-mute-soft">
              Shared workspace
            </span>
            <span className="text-mute-soft">·</span>
            <span className="text-sm font-medium text-ink">
              {company.name}
            </span>
            {label && (
              <>
                <span className="text-mute-soft">·</span>
                <span className="text-sm text-mute italic">{label}</span>
              </>
            )}
          </div>

          {/* Right — view-only badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-mono-ui text-accent">
            <Eye className="h-3 w-3" />
            View only
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
              !selectedFolderId
                ? "bg-accent-soft text-accent font-medium"
                : "text-mute hover:bg-line/50 hover:text-ink"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                !selectedFolderId ? "bg-accent" : "bg-mute-soft"
              )}
            />
            All items
            <span className="ml-auto font-mono-ui text-[11px] text-mute-soft">
              {items.length}
            </span>
          </button>

          <div className="mt-4 px-3 mb-2">
            <span className="font-mono-ui text-[10px] uppercase tracking-wider text-mute-soft">
              Folders
            </span>
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
        <main className="flex-1 px-6 py-8 min-w-0">
          {/* Header + search */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="font-mono-ui text-[11px] uppercase tracking-wider text-mute-soft">
                {selectedFolder ? "Folder" : "Overview"}
              </p>
              <h1 className="mt-1 font-display text-3xl md:text-4xl text-ink leading-[1.1] tracking-[-0.02em]">
                {selectedFolder ? selectedFolder.name : company.name}
              </h1>
              <p className="mt-1 text-sm text-mute">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                {query && ` matching "${query}"`}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute-soft" />
              <input
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper-elevated pl-9 pr-9 py-2 text-sm outline-none focus:border-accent transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute-soft hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Items */}
          {filteredItems.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <div className="grid gap-2">
              {filteredItems.map((item) => (
                <SharedItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="flex-none border-t border-line">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between text-xs text-mute-soft">
          <span>Read-only view shared by {company.name}.</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-ink transition-colors"
          >
            Powered by{" "}
            <span className="font-display-italic text-ink ml-0.5">Ayuvam</span>
          </Link>
        </div>
      </footer>
    </div>
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
  const colors =
    FOLDER_COLORS[folder.color as keyof typeof FOLDER_COLORS] ??
    FOLDER_COLORS.slate;
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <button
        onClick={() => onSelect(folder.id)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm transition-colors",
          isSelected
            ? "bg-accent-soft text-accent font-medium"
            : "text-mute hover:bg-line/50 hover:text-ink"
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot)} />
        <span className="truncate">{folder.name}</span>
        {itemCount > 0 && (
          <span className="ml-auto font-mono-ui text-[11px] text-mute-soft">
            {itemCount}
          </span>
        )}
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

function SharedItem({ item }: { item: Item }) {
  const isLink = item.type === "link" && item.url;
  const Wrapper = isLink ? "a" : "div";
  const wrapperProps = isLink
    ? {
        href: item.url!,
        target: "_blank" as const,
        rel: "noopener noreferrer",
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group block rounded-xl border bg-paper-elevated p-4 transition-all",
        item.isPinned ? "border-accent-soft" : "border-line",
        isLink && "hover:border-line-strong hover:shadow-[0_8px_30px_-15px_rgba(15,15,15,0.12)] cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div
          className={cn(
            "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
            item.type === "link" ? "bg-accent-soft text-accent" : "bg-line text-mute"
          )}
        >
          {item.type === "link" ? (
            <Link2 className="h-3.5 w-3.5" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-medium text-ink truncate">
                  {item.title}
                </h3>
                {item.isPinned && (
                  <Pin
                    className="h-3 w-3 text-accent shrink-0"
                    fill="currentColor"
                  />
                )}
              </div>
              {item.url && (
                <p className="text-xs text-mute-soft truncate mt-0.5 font-mono-ui">
                  {item.url}
                </p>
              )}
              {item.fileName && (
                <p className="text-xs text-mute-soft mt-0.5 font-mono-ui">
                  {item.fileName}
                  {item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ""}
                </p>
              )}
            </div>

            {isLink && (
              <ExternalLink className="h-3.5 w-3.5 text-mute-soft shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <p className="mt-2 text-sm text-mute leading-relaxed line-clamp-2">
              {item.notes}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono-ui text-[10px] text-mute px-1.5 py-0.5 rounded bg-line/70"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <span className="font-mono-ui text-[10px] text-mute-soft ml-auto whitespace-nowrap">
              <FolderIcon className="inline h-2.5 w-2.5 mr-1 -mt-0.5" />
              {item.folderName} · {formatDate(item.itemDate)}
            </span>
          </div>
        </div>
      </div>
    </Wrapper>
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
