"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeController, ThemeToggle } from "@/components/theme";
import { DEFAULT_STATUS_OPTIONS, REGISTER_COLORS, COLOR_DOT, type StatusOption } from "@/lib/register";
import { Textarea } from "@/components/ui/textarea";
import FolderTree from "./FolderTree";
import RegisterGrid, { type RegisterItem } from "./RegisterGrid";
import FolderOverview from "./FolderOverview";
import WelcomeSetup from "./WelcomeSetup";
import SearchResults from "./SearchResults";
import AddItemModal from "./AddItemModal";
import CreateFolderModal from "./CreateFolderModal";
import ShareWithClientModal from "./ShareWithClientModal";
import {
  LogOut,
  Search,
  Building2,
  Plus,
  FolderPlus,
  X,
  ChevronDown,
  Share2,
  Menu,
  Table2,
  Check,
  Loader2,
  Settings,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Company = {
  id: string;
  name: string;
  slug: string;
  accentColor?: string | null;
  clientNote?: string | null;
};
type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  viewType?: "cards" | "register";
  // Loosely typed to match the DB jsonb shape; the picker only writes valid
  // RegisterColors, so we cast to StatusOption[] at the grid boundary.
  statusOptions?: { label: string; color: string }[] | null;
  companyId: string;
  createdAt: string;
};

type MyCompany = { id: string; name: string; slug: string; role: string };

function SidebarSkeleton() {
  return (
    <div className="px-3 py-2 space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-2 h-2 rounded-full bg-line animate-pulse shrink-0" />
          <div
            className="h-3.5 bg-line rounded animate-pulse"
            style={{ width: `${55 + (i % 3) * 20}px` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function WorkspaceShell({
  company,
  userRole,
  user,
  initialFolders,
  initialItems,
  initialCompanies,
}: {
  company: Company;
  userRole: string;
  user: { id: string; name: string; email: string };
  initialFolders?: Folder[];
  initialItems?: RegisterItem[];
  initialCompanies?: MyCompany[];
}) {
  const confirm = useConfirm();
  const router = useRouter();
  const isManager = userRole === "manager" || userRole === "admin";
  const [folders, setFolders] = useState<Folder[]>(initialFolders ?? []);
  const [foldersLoading, setFoldersLoading] = useState(!initialFolders);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createSubfolderParent, setCreateSubfolderParent] = useState<Folder | null>(null);
  const [myCompanies, setMyCompanies] = useState<MyCompany[]>(initialCompanies ?? []);
  const [companySwitchOpen, setCompanySwitchOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false);
  const [wsName, setWsName] = useState(company.name);
  const [wsAccent, setWsAccent] = useState<string | null>(company.accentColor ?? null);
  const [wsNote, setWsNote] = useState(company.clientNote ?? "");
  const [savingWs, setSavingWs] = useState(false);

  const loadFolders = useCallback(async (silent = false) => {
    // Only show the skeleton on the first load; background refreshes (rename,
    // color, delete, item changes) update in place so the sidebar never flashes.
    if (!silent) setFoldersLoading(true);
    const res = await fetch(`/api/workspace/folders?slug=${company.slug}`);
    if (res.ok) {
      const next: Folder[] = await res.json();
      setFolders(next);
      // Keep the open register's status options in sync after a refresh.
      setSelectedFolder((sf) => (sf ? next.find((f) => f.id === sf.id) ?? sf : sf));
    }
    setFoldersLoading(false);
  }, [company.slug]);

  // Folders are seeded from the server on first paint; skip that initial fetch
  // (later mutations still call loadFolders directly).
  const foldersSeeded = useRef(!!initialFolders);
  useEffect(() => {
    if (foldersSeeded.current) {
      foldersSeeded.current = false;
      return;
    }
    loadFolders();
  }, [loadFolders]);

  // Remember the workspace you're in, so "Back to workspace" from Settings
  // returns here instead of the multi-workspace selector.
  useEffect(() => {
    try { localStorage.setItem("ayuvam-last-workspace", company.slug); } catch {}
  }, [company.slug]);

  // Restore the folder you were viewing — a refresh shouldn't dump you back
  // on "All items". Runs once, after the folder list is available.
  const selectionRestored = useRef(false);
  useEffect(() => {
    if (selectionRestored.current || foldersLoading) return;
    selectionRestored.current = true;
    try {
      const saved = localStorage.getItem(`ayuvam-sel-${company.slug}`);
      if (saved) {
        const f = folders.find((x) => x.id === saved);
        if (f) setSelectedFolder(f);
      }
    } catch {}
  }, [folders, foldersLoading, company.slug]);

  const persistSelection = useCallback(
    (id: string | null) => {
      try {
        if (id) localStorage.setItem(`ayuvam-sel-${company.slug}`, id);
        else localStorage.removeItem(`ayuvam-sel-${company.slug}`);
      } catch {}
    },
    [company.slug]
  );

  // "/" focuses search from anywhere (unless already typing somewhere).
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (initialCompanies) return; // seeded from the server
    fetch("/api/workspace/my-companies")
      .then((r) => r.json())
      .then(setMyCompanies)
      .catch(() => {});
  }, [initialCompanies]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    setIsSearching(e.target.value.length > 0);
  }

  function clearSearch() {
    setSearchQuery("");
    setIsSearching(false);
  }

  function handleFolderCreated() {
    loadFolders(true);
    setCreateFolderOpen(false);
    setCreateSubfolderParent(null);
  }

  function handleCreateSubfolder(parent: Folder) {
    setCreateSubfolderParent(parent);
    setCreateFolderOpen(true);
  }

  // One-click folder creation from the first-run setup chips — creates,
  // refreshes the sidebar, and drops the user straight into the new register.
  async function handleQuickCreateFolder(name: string, color: string) {
    const res = await fetch("/api/workspace/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: company.slug, name, parentId: null, color }),
    });
    if (!res.ok) {
      toast.error("Could not create the folder.");
      return;
    }
    const folder: Folder = await res.json();
    toast.success(`"${name}" created — add your first row.`);
    await loadFolders(true);
    setSelectedFolder(folder);
    persistSelection(folder.id);
  }

  function handleItemAdded() {
    setAddItemOpen(false);
    setRefreshKey((k) => k + 1);
  }

  function selectFolderAndClose(f: Folder | null) {
    setSelectedFolder(f);
    persistSelection(f?.id ?? null);
    setMobileSidebarOpen(false);
    setRefBack(null); // manual navigation drops the reference back-trail
  }

  // ── Reference jumps: open another item (any folder) + a way back ──
  const [jumpOpenItemId, setJumpOpenItemId] = useState<string | null>(null);
  const [refBack, setRefBack] = useState<{ folderId: string; itemId: string; title: string } | null>(null);

  function jumpToItem(target: { folderId: string; itemId: string }) {
    const f = folders.find((x) => x.id === target.folderId) ?? null;
    setSelectedFolder(f);
    persistSelection(f?.id ?? null);
    setJumpOpenItemId(target.itemId);
  }

  function handleNavigateToItem(
    target: { folderId: string; itemId: string },
    source: { folderId: string; itemId: string; title: string }
  ) {
    setRefBack(source);
    jumpToItem(target);
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    const name = newWorkspaceName.trim();
    if (!name) return;
    setCreatingWorkspace(true);
    const res = await fetch("/api/workspace/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not create workspace.");
      setCreatingWorkspace(false);
      return;
    }
    const created = await res.json();
    toast.success("Workspace created.");
    setNewWorkspaceOpen(false);
    setNewWorkspaceName("");
    setCreatingWorkspace(false);
    router.push(`/workspace/${created.slug}`);
  }

  async function handleSaveWorkspace(e: React.FormEvent) {
    e.preventDefault();
    const name = wsName.trim();
    if (!name) return;
    setSavingWs(true);
    const res = await fetch("/api/workspace/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: company.slug,
        name,
        accentColor: wsAccent,
        clientNote: wsNote,
      }),
    });
    setSavingWs(false);
    if (res.ok) {
      toast.success("Workspace updated.");
      setMyCompanies((cs) => cs.map((c) => (c.slug === company.slug ? { ...c, name } : c)));
      setWsSettingsOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not update the workspace.");
    }
  }

  async function handleDeleteWorkspace() {
    const ok = await confirm({
      title: "Delete this workspace?",
      body: `"${company.name}" and all its folders, items, and share links will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete workspace",
      danger: true,
      requireText: company.name,
    });
    if (!ok) return;
    const res = await fetch(`/api/workspace/companies?slug=${company.slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Workspace deleted.");
      router.push("/workspace");
    } else {
      toast.error("Could not delete the workspace.");
    }
  }

  // Status options for the open register (folder), falling back to defaults.
  const resolvedStatusOptions: StatusOption[] =
    selectedFolder?.statusOptions && selectedFolder.statusOptions.length
      ? (selectedFolder.statusOptions as StatusOption[])
      : DEFAULT_STATUS_OPTIONS;

  // A folder with sub-folders is a *container*: it navigates to its children
  // and can't hold its own rows (items live in the leaves).
  const childFolders = selectedFolder
    ? folders.filter((f) => f.parentId === selectedFolder.id)
    : [];
  const isContainer = !!selectedFolder && childFolders.length > 0;
  const parentFolder = selectedFolder?.parentId
    ? folders.find((f) => f.id === selectedFolder.parentId) ?? null
    : null;

  // Persist a register's customized status set (optimistic).
  const handleStatusOptionsChange = useCallback(
    async (opts: StatusOption[]) => {
      if (!selectedFolder) return;
      const folderId = selectedFolder.id;
      const prev = folders;
      setSelectedFolder((sf) => (sf ? { ...sf, statusOptions: opts } : sf));
      setFolders((fs) => fs.map((f) => (f.id === folderId ? { ...f, statusOptions: opts } : f)));
      const res = await fetch("/api/workspace/folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: folderId, slug: company.slug, statusOptions: opts }),
      });
      if (res.ok) toast.success("Statuses updated.");
      else {
        setFolders(prev);
        setSelectedFolder((sf) => (sf && sf.id === folderId ? prev.find((f) => f.id === folderId) ?? sf : sf));
        toast.error("Could not update statuses.");
      }
    },
    [selectedFolder, folders, company.slug]
  );

  return (
    <ThemeController>
      <div className="h-screen flex flex-col bg-paper">
        {/* Top bar */}
        <div className="flex-none border-b border-line bg-paper-elevated px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden -ml-1 p-1.5 rounded-md text-mute hover:bg-line/60 transition-colors"
            title="Folders"
            aria-label="Open folder menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Logo + Company */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-ink shrink-0 hidden sm:inline">Ayuvam</span>
            <span className="text-mute-soft hidden sm:inline">/</span>
            <div className="relative">
              <button
                onClick={() => setCompanySwitchOpen(!companySwitchOpen)}
                className="flex items-center gap-1 text-sm text-mute hover:text-ink transition-colors truncate max-w-[140px] sm:max-w-[160px]"
              >
                <span className="truncate">{company.name}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>
              {companySwitchOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCompanySwitchOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-paper-elevated border border-line rounded-xl shadow-lg z-50 min-w-[220px] overflow-hidden py-1">
                    <p className="px-3 pt-1.5 pb-1 text-[10px] font-medium text-mute-soft uppercase tracking-wide">
                      Workspaces
                    </p>
                    {myCompanies.map((c) => (
                      <Link
                        key={c.id}
                        href={`/workspace/${c.slug}`}
                        onClick={() => setCompanySwitchOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-line/50 transition-colors ${
                          c.slug === company.slug ? "text-accent font-medium" : "text-ink"
                        }`}
                      >
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{c.name}</span>
                        {c.slug === company.slug && (
                          <Check className="h-3.5 w-3.5 ml-auto shrink-0" />
                        )}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-line" />
                    <button
                      onClick={() => {
                        setCompanySwitchOpen(false);
                        setNewWorkspaceOpen(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-mute hover:bg-line/50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      New workspace
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="search-glow relative rounded-xl border border-line bg-paper-elevated transition-all">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute-soft" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, tag, or note…  ( / )"
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    clearSearch();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-transparent outline-none text-ink placeholder:text-mute-soft rounded-xl"
              />
              {isSearching && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute-soft hover:text-mute"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            {isManager && (
              <Button
                size="sm"
                variant="accent"
                onClick={() => setShareOpen(true)}
                title="Share this workspace with a client"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share with client</span>
              </Button>
            )}
            <Link
              href="/settings"
              className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md text-xs text-mute hover:text-ink hover:bg-line/50 transition-colors"
              title="Account settings"
            >
              <div className="h-5 w-5 rounded-full bg-accent-soft text-accent text-[10px] font-medium flex items-center justify-center font-mono-ui">
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <span>{user.name}</span>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Mobile sidebar backdrop */}
          {mobileSidebarOpen && (
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden fixed inset-0 z-30 bg-black/40"
              aria-hidden
            />
          )}

          {/* Sidebar — fixed slide-out on mobile, static on md+ */}
          <div
            className={cn(
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
              "md:translate-x-0 fixed md:static inset-y-0 left-0 z-40",
              "w-64 md:w-56 shrink-0 border-r border-line bg-paper-elevated flex flex-col",
              "transition-transform duration-200 ease-out"
            )}
          >
            <div className="flex items-center justify-between px-3 py-3 border-b border-line">
              <span className="text-xs font-medium text-mute uppercase tracking-wide">Folders</span>
              <div className="flex items-center gap-1">
                {isManager && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => { setCreateSubfolderParent(null); setCreateFolderOpen(true); }}
                    title="New folder"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                  </Button>
                )}
                {/* Close button — mobile only */}
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="md:hidden p-1 rounded text-mute hover:bg-line/60"
                  aria-label="Close folder menu"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* "All items" link */}
            <button
              onClick={() => selectFolderAndClose(null)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs border-b border-line transition-colors ${
                selectedFolder === null && !isSearching
                  ? "bg-accent-soft text-accent-hover font-medium"
                  : "text-mute hover:bg-line/40 hover:text-ink"
              }`}
            >
              All items
            </button>

            <div className="flex-1 overflow-y-auto py-1">
              {foldersLoading ? (
                <SidebarSkeleton />
              ) : (
                <>
                  <FolderTree
                    folders={folders}
                    selectedId={selectedFolder?.id || null}
                    onSelect={selectFolderAndClose}
                    onCreateSubfolder={isManager ? handleCreateSubfolder : undefined}
                    onDelete={isManager ? async (id) => {
                      const target = folders.find((f) => f.id === id);
                      const ok = await confirm({
                        title: "Delete this folder?",
                        body: target
                          ? `"${target.name}" and all items inside it will be permanently deleted. This can't be undone.`
                          : "All items inside it will be permanently deleted.",
                        confirmLabel: "Delete folder",
                        danger: true,
                        ...(target && { requireText: target.name }),
                      });
                      if (!ok) return;
                      const res = await fetch(`/api/workspace/folders?id=${id}&slug=${company.slug}`, { method: "DELETE" });
                      if (res.ok) {
                        toast.success("Folder deleted.");
                        loadFolders(true);
                        if (selectedFolder?.id === id) {
                          setSelectedFolder(null);
                          persistSelection(null);
                        }
                      } else {
                        toast.error("Could not delete folder.");
                      }
                    } : undefined}
                    onRename={isManager ? async (id, name) => {
                      const res = await fetch("/api/workspace/folders", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, slug: company.slug, name }),
                      });
                      if (res.ok) {
                        toast.success("Folder renamed.");
                        loadFolders(true);
                      } else {
                        toast.error("Could not rename folder.");
                      }
                    } : undefined}
                    onChangeColor={isManager ? async (id, color) => {
                      const res = await fetch("/api/workspace/folders", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, slug: company.slug, color }),
                      });
                      if (res.ok) {
                        toast.success("Color updated.");
                        loadFolders(true);
                      } else {
                        toast.error("Could not change color.");
                      }
                    } : undefined}
                    onReorder={isManager ? async (orderedIds) => {
                      // Optimistic: reorder the siblings in place, keeping the rest stable.
                      setFolders((fs) => {
                        const idx = new Map(orderedIds.map((id, i) => [id, i]));
                        return [...fs].sort((a, b) => {
                          const ai = idx.get(a.id);
                          const bi = idx.get(b.id);
                          return ai != null && bi != null ? ai - bi : 0;
                        });
                      });
                      const res = await fetch("/api/workspace/folders/reorder", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ slug: company.slug, orderedIds }),
                      });
                      if (!res.ok) {
                        toast.error("Could not save the folder order.");
                        loadFolders(true);
                      }
                    } : undefined}
                    slug={company.slug}
                    isManager={isManager}
                  />
                  {folders.length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-mute-soft">No folders yet</p>
                      {isManager && (
                        <button
                          onClick={() => setCreateFolderOpen(true)}
                          className="mt-2 text-xs text-accent hover:text-accent-hover"
                        >
                          Create one
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar footer — workspace settings */}
            {isManager && (
              <div className="border-t border-line p-2">
                <button
                  onClick={() => {
                    setWsName(company.name);
                    setWsAccent(company.accentColor ?? null);
                    setWsNote(company.clientNote ?? "");
                    setWsSettingsOpen(true);
                  }}
                  title="Workspace settings"
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-mute hover:bg-line/50 hover:text-ink transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 shrink-0" />
                  Workspace settings
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Content header */}
            {!isSearching && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                <div className="flex items-center gap-2 min-w-0">
                  <Table2 className="h-4 w-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-ink truncate">
                      {parentFolder && (
                        <>
                          <button
                            onClick={() => selectFolderAndClose(parentFolder)}
                            className="font-normal text-mute hover:text-ink transition-colors"
                            title={`Up to ${parentFolder.name}`}
                          >
                            {parentFolder.name}
                          </button>
                          <span className="font-normal text-mute-soft"> / </span>
                        </>
                      )}
                      {selectedFolder ? selectedFolder.name : "All items"}
                    </h2>
                    <p className="text-xs text-mute-soft mt-0.5">
                      {!selectedFolder
                        ? "Everything across all folders"
                        : isContainer
                          ? `${childFolders.length} folder${childFolders.length !== 1 ? "s" : ""} inside · open one to add items`
                          : "Register · a row per deliverable"}
                    </p>
                  </div>
                </div>
                {isManager && selectedFolder && !isContainer && (
                  <Button size="sm" variant="accent" onClick={() => setAddItemOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Add row
                  </Button>
                )}
              </div>
            )}

            {/* Content body */}
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <SearchResults
                  slug={company.slug}
                  query={searchQuery}
                  isManager={isManager}
                  onClearSearch={clearSearch}
                  onRefresh={() => {}}
                />
              ) : !foldersLoading && folders.length === 0 && isManager ? (
                <WelcomeSetup
                  companyName={company.name}
                  onCreateFolder={handleQuickCreateFolder}
                  onCustomFolder={() => { setCreateSubfolderParent(null); setCreateFolderOpen(true); }}
                />
              ) : (
                <>
                  {isContainer && (
                    <FolderOverview folders={childFolders} onSelect={selectFolderAndClose} />
                  )}
                  <RegisterGrid
                    key={selectedFolder?.id ?? "all"}
                    slug={company.slug}
                    folder={selectedFolder}
                    isManager={isManager}
                    statusOptions={resolvedStatusOptions}
                    onStatusOptionsChange={selectedFolder && isManager && !isContainer ? handleStatusOptionsChange : undefined}
                    onAddItem={() => setAddItemOpen(true)}
                    refreshKey={refreshKey}
                    initialItems={selectedFolder ? undefined : initialItems}
                    showFolder={!selectedFolder}
                    canAdd={!isContainer}
                    folderMeta={
                      selectedFolder
                        ? undefined
                        : folders.map((f) => ({ id: f.id, name: f.name, color: f.color }))
                    }
                    onNavigateToItem={handleNavigateToItem}
                    openItemOnLoad={jumpOpenItemId}
                    onOpenConsumed={() => setJumpOpenItemId(null)}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Back-trail after a reference jump */}
        {refBack && (
          <button
            onClick={() => {
              const back = refBack;
              setRefBack(null);
              jumpToItem({ folderId: back.folderId, itemId: back.itemId });
            }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper text-xs font-medium pl-3 pr-4 py-2 shadow-lg hover:opacity-90 transition-opacity max-w-[80vw]"
            title="Return to the item you came from"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Back to &ldquo;{refBack.title}&rdquo;</span>
          </button>
        )}

        {/* Modals */}
        {isManager && (
          <>
            <AddItemModal
              open={addItemOpen}
              onClose={() => setAddItemOpen(false)}
              slug={company.slug}
              folderId={selectedFolder?.id || ""}
              folderName={selectedFolder?.name || ""}
              statusOptions={resolvedStatusOptions}
              onSuccess={handleItemAdded}
            />
            <CreateFolderModal
              open={createFolderOpen}
              onClose={() => { setCreateFolderOpen(false); setCreateSubfolderParent(null); }}
              slug={company.slug}
              parentFolder={createSubfolderParent}
              onSuccess={handleFolderCreated}
            />
            <ShareWithClientModal
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              slug={company.slug}
              companyName={company.name}
            />
          </>
        )}

        {/* Workspace settings — managers only */}
        <Dialog open={wsSettingsOpen} onOpenChange={(o) => { if (!o) setWsSettingsOpen(false); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Workspace settings</DialogTitle>
              <DialogDescription>Name, the look of your client&apos;s view, or delete it for good.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveWorkspace} className="px-6 pb-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Workspace name</Label>
                <Input
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  maxLength={60}
                  autoFocus
                />
                <p className="text-[11px] text-mute-soft">The link stays the same — only the name changes.</p>
              </div>

              <div className="space-y-1.5">
                <Label>Accent color</Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {REGISTER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWsAccent(wsAccent === c ? null : c)}
                      title={c}
                      className={cn(
                        "h-6 w-6 rounded-full transition-transform hover:scale-110",
                        COLOR_DOT[c],
                        wsAccent === c && "ring-2 ring-offset-1 ring-ink ring-offset-paper-elevated"
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-mute-soft">Shown on your client&apos;s share view, next to the workspace name.</p>
              </div>

              <div className="space-y-1.5">
                <Label>Note to your client</Label>
                <Textarea
                  value={wsNote}
                  onChange={(e) => setWsNote(e.target.value)}
                  maxLength={500}
                  placeholder="e.g. Here's everything for the Q3 launch — newest at the top."
                  className="min-h-[60px] text-sm"
                />
                <p className="text-[11px] text-mute-soft">Optional. Appears at the top of the share view.</p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setWsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  className="flex-1"
                  disabled={savingWs || !wsName.trim()}
                >
                  {savingWs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
              <div className="border-t border-line pt-3">
                <button
                  type="button"
                  onClick={handleDeleteWorkspace}
                  className="inline-flex items-center gap-1.5 text-xs text-mute hover:text-danger transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete this workspace
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* New workspace — available to everyone */}
        <Dialog
          open={newWorkspaceOpen}
          onOpenChange={(o) => {
            if (!o) { setNewWorkspaceOpen(false); setNewWorkspaceName(""); }
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>New workspace</DialogTitle>
              <DialogDescription>
                A separate space for another client. You&apos;ll be its manager.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWorkspace} className="px-6 pb-6 space-y-4">
              <Input
                placeholder="e.g. Google"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                maxLength={60}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setNewWorkspaceOpen(false); setNewWorkspaceName(""); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  className="flex-1"
                  disabled={creatingWorkspace || !newWorkspaceName.trim()}
                >
                  {creatingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ThemeController>
  );
}
