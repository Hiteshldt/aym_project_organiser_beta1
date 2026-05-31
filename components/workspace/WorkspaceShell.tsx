"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";
import FolderTree from "./FolderTree";
import FolderView from "./FolderView";
import RegisterView from "./RegisterView";
import AllItemsTable from "./AllItemsTable";
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
  LayoutGrid,
  Check,
  Loader2,
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

type Company = { id: string; name: string; slug: string };
type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  viewType?: "cards" | "register";
  companyId: string;
  createdAt: string;
};

type MyCompany = { id: string; name: string; slug: string; role: string };

type EditableItem = {
  id: string;
  title: string;
  type: "link" | "file";
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  notes: string | null;
  itemDate: string;
};

function SidebarSkeleton() {
  return (
    <div className="px-3 py-2 space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-2 h-2 rounded-full bg-[#ebebeb] animate-pulse shrink-0" />
          <div
            className="h-3.5 bg-[#ebebeb] rounded animate-pulse"
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
}: {
  company: Company;
  userRole: string;
  user: { id: string; name: string; email: string };
}) {
  const confirm = useConfirm();
  const router = useRouter();
  const isManager = userRole === "manager" || userRole === "admin";
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createSubfolderParent, setCreateSubfolderParent] = useState<Folder | null>(null);
  const [myCompanies, setMyCompanies] = useState<MyCompany[]>([]);
  const [companySwitchOpen, setCompanySwitchOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const loadFolders = useCallback(async () => {
    setFoldersLoading(true);
    const res = await fetch(`/api/workspace/folders?slug=${company.slug}`);
    if (res.ok) setFolders(await res.json());
    setFoldersLoading(false);
  }, [company.slug]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    fetch("/api/workspace/my-companies")
      .then((r) => r.json())
      .then(setMyCompanies)
      .catch(() => {});
  }, []);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    setIsSearching(e.target.value.length > 0);
  }

  function clearSearch() {
    setSearchQuery("");
    setIsSearching(false);
  }

  function handleFolderCreated() {
    loadFolders();
    setCreateFolderOpen(false);
    setCreateSubfolderParent(null);
  }

  function handleCreateSubfolder(parent: Folder) {
    setCreateSubfolderParent(parent);
    setCreateFolderOpen(true);
  }

  function handleItemAdded() {
    setAddItemOpen(false);
    setEditingItem(null);
    setRefreshKey((k) => k + 1);
  }

  function handleEdit(item: EditableItem) {
    setEditingItem(item);
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

  async function handleToggleView(view: "cards" | "register") {
    if (!selectedFolder || selectedFolder.viewType === view) return;
    // Optimistic — flip the view immediately, then persist + sync the sidebar
    setSelectedFolder({ ...selectedFolder, viewType: view });
    const res = await fetch("/api/workspace/folders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedFolder.id, slug: company.slug, viewType: view }),
    });
    if (res.ok) {
      loadFolders();
    } else {
      toast.error("Could not change the view.");
      setSelectedFolder({ ...selectedFolder, viewType: selectedFolder.viewType });
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#fafafa]">
      {/* Top bar */}
      <div className="flex-none border-b border-[#ebebeb] bg-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden -ml-1 p-1.5 rounded-md text-[#555] hover:bg-[#f5f5f5] transition-colors"
          title="Folders"
          aria-label="Open folder menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Logo + Company */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-[#111] shrink-0 hidden sm:inline">Ayuvam</span>
          <span className="text-[#ddd] hidden sm:inline">/</span>
          <div className="relative">
            <button
              onClick={() => setCompanySwitchOpen(!companySwitchOpen)}
              className="flex items-center gap-1 text-sm text-[#555] hover:text-[#111] transition-colors truncate max-w-[140px] sm:max-w-[160px]"
            >
              <span className="truncate">{company.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </button>
            {companySwitchOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCompanySwitchOpen(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded-xl shadow-lg z-50 min-w-[220px] overflow-hidden py-1">
                  <p className="px-3 pt-1.5 pb-1 text-[10px] font-medium text-[#999] uppercase tracking-wide">
                    Workspaces
                  </p>
                  {myCompanies.map((c) => (
                    <Link
                      key={c.id}
                      href={`/workspace/${c.slug}`}
                      onClick={() => setCompanySwitchOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#f5f5f5] transition-colors ${
                        c.slug === company.slug ? "text-accent font-medium" : "text-[#111]"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.name}</span>
                      {c.slug === company.slug && (
                        <Check className="h-3.5 w-3.5 ml-auto shrink-0" />
                      )}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-[#f0f0f0]" />
                  <button
                    onClick={() => {
                      setCompanySwitchOpen(false);
                      setNewWorkspaceOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#555] hover:bg-[#f5f5f5] transition-colors"
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
          <div className="search-glow relative rounded-xl border border-[#e5e5e5] bg-white transition-all">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bbb]" />
            <input
              type="text"
              placeholder="Search by title, tag, or note…"
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-transparent outline-none text-[#111] placeholder:text-[#bbb] rounded-xl"
            />
            {isSearching && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#555]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
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
          className={`
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            fixed md:static inset-y-0 left-0 z-40
            w-64 md:w-56 shrink-0 border-r border-[#ebebeb] bg-white flex flex-col
            transition-transform duration-200 ease-out
          `}
        >
          <div className="flex items-center justify-between px-3 py-3 border-b border-[#f5f5f5]">
            <span className="text-xs font-medium text-[#888] uppercase tracking-wide">Folders</span>
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
                className="md:hidden p-1 rounded text-[#888] hover:bg-[#f5f5f5]"
                aria-label="Close folder menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* "All items" link */}
          <button
            onClick={() => selectFolderAndClose(null)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs border-b border-[#f5f5f5] transition-colors ${
              selectedFolder === null && !isSearching
                ? "bg-accent-soft text-accent-hover font-medium"
                : "text-[#666] hover:bg-[#f9f9f9] hover:text-[#111]"
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
                        ? `"${target.name}" and all items inside it will be permanently deleted.`
                        : "All items inside it will be permanently deleted.",
                      confirmLabel: "Delete folder",
                      danger: true,
                    });
                    if (!ok) return;
                    const res = await fetch(`/api/workspace/folders?id=${id}&slug=${company.slug}`, { method: "DELETE" });
                    if (res.ok) {
                      toast.success("Folder deleted.");
                      loadFolders();
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
                      loadFolders();
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
                      loadFolders();
                    } else {
                      toast.error("Could not change color.");
                    }
                  } : undefined}
                  slug={company.slug}
                  isManager={isManager}
                />
                {folders.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-[#ccc]">No folders yet</p>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-2 min-w-0">
                {selectedFolder?.viewType === "register" && (
                  <Table2 className="h-4 w-4 text-accent shrink-0" />
                )}
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[#111] truncate">
                    {selectedFolder ? selectedFolder.name : "All items"}
                  </h2>
                  {!selectedFolder ? (
                    <p className="text-xs text-[#bbb] mt-0.5">Everything across all folders</p>
                  ) : selectedFolder.viewType === "register" ? (
                    <p className="text-xs text-[#bbb] mt-0.5">Register · a row per deliverable</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* View toggle — manager only, persists + drives the client view */}
                {selectedFolder && isManager && (
                  <div className="flex items-center rounded-lg border border-[#e5e5e5] p-0.5 bg-white">
                    <button
                      onClick={() => handleToggleView("cards")}
                      title="Card view"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedFolder.viewType !== "register"
                          ? "bg-[#111] text-white"
                          : "text-[#888] hover:text-[#555]"
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button
                      onClick={() => handleToggleView("register")}
                      title="Register (table) view"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedFolder.viewType === "register"
                          ? "bg-[#111] text-white"
                          : "text-[#888] hover:text-[#555]"
                      }`}
                    >
                      <Table2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Register</span>
                    </button>
                  </div>
                )}
                {isManager && selectedFolder && (
                  <Button size="sm" variant="accent" onClick={() => setAddItemOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    {selectedFolder.viewType === "register" ? "Add row" : "Add item"}
                  </Button>
                )}
              </div>
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
            ) : selectedFolder ? (
              selectedFolder.viewType === "register" ? (
                <RegisterView
                  slug={company.slug}
                  folder={selectedFolder}
                  isManager={isManager}
                  onAddItem={() => setAddItemOpen(true)}
                  onEdit={isManager ? handleEdit : undefined}
                  refreshKey={refreshKey}
                />
              ) : (
                <FolderView
                  slug={company.slug}
                  folder={selectedFolder}
                  isManager={isManager}
                  onAddItem={() => setAddItemOpen(true)}
                  onRefresh={loadFolders}
                  onEdit={isManager ? handleEdit : undefined}
                  refreshKey={refreshKey}
                />
              )
            ) : (
              <AllItemsTable
                slug={company.slug}
                isManager={isManager}
                refreshKey={refreshKey}
                onEdit={isManager ? handleEdit : undefined}
              />
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
            onSuccess={handleItemAdded}
          />
          <AddItemModal
            open={!!editingItem}
            onClose={() => setEditingItem(null)}
            slug={company.slug}
            folderId={editingItem ? "edit" : ""}
            folderName=""
            item={editingItem}
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
              placeholder="e.g. Acme Inc"
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
  );
}
