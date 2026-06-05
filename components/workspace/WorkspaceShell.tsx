"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeController, ThemeToggle } from "@/components/theme";
import { DEFAULT_STATUS_OPTIONS, type StatusOption } from "@/lib/register";
import FolderTree from "./FolderTree";
import RegisterGrid, { type RegisterItem } from "./RegisterGrid";
import FolderOverview from "./FolderOverview";
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

type Company = { id: string; name: string; slug: string };
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

  function handleItemAdded() {
    setAddItemOpen(false);
    setRefreshKey((k) => k + 1);
  }

  function selectFolderAndClose(f: Folder | null) {
    setSelectedFolder(f);
    setMobileSidebarOpen(false);
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

  async function handleRenameWorkspace(e: React.FormEvent) {
    e.preventDefault();
    const name = wsName.trim();
    if (!name || name === company.name) {
      setWsSettingsOpen(false);
      return;
    }
    setSavingWs(true);
    const res = await fetch("/api/workspace/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: company.slug, name }),
    });
    setSavingWs(false);
    if (res.ok) {
      toast.success("Workspace renamed.");
      setMyCompanies((cs) => cs.map((c) => (c.slug === company.slug ? { ...c, name } : c)));
      setWsSettingsOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not rename the workspace.");
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
                    {isManager && (
                      <button
                        onClick={() => {
                          setCompanySwitchOpen(false);
                          setWsName(company.name);
                          setWsSettingsOpen(true);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-mute hover:bg-line/50 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5 shrink-0" />
                        Workspace settings
                      </button>
                    )}
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
                type="text"
                placeholder="Search by title, tag, or note…"
                value={searchQuery}
                onChange={handleSearch}
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
                        if (selectedFolder?.id === id) setSelectedFolder(null);
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
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Content header */}
            {!isSearching && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                <div className="flex items-center gap-2 min-w-0">
                  <Table2 className="h-4 w-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-ink truncate">
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
                  />
                </>
              )}
            </div>
          </div>
        </div>

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
              <DialogDescription>Rename this workspace, or delete it for good.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRenameWorkspace} className="px-6 pb-6 space-y-4">
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
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setWsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  className="flex-1"
                  disabled={savingWs || !wsName.trim() || wsName.trim() === company.name}
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
