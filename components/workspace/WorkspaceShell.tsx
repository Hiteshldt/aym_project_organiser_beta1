"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FolderTree from "./FolderTree";
import FolderView from "./FolderView";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

type Company = { id: string; name: string; slug: string };
type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  companyId: string;
  createdAt: string;
};

type MyCompany = { id: string; name: string; slug: string; role: string };

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
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="h-screen flex flex-col bg-[#fafafa]">
      {/* Top bar */}
      <div className="flex-none border-b border-[#ebebeb] bg-white px-4 py-3 flex items-center gap-4">
        {/* Logo + Company */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-[#111] shrink-0">Ayuvam</span>
          <span className="text-[#ddd]">/</span>
          <div className="relative">
            <button
              onClick={() => setCompanySwitchOpen(!companySwitchOpen)}
              className="flex items-center gap-1 text-sm text-[#555] hover:text-[#111] transition-colors truncate max-w-[160px]"
            >
              <span className="truncate">{company.name}</span>
              {myCompanies.length > 1 && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
            </button>
            {companySwitchOpen && myCompanies.length > 1 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded-xl shadow-lg z-50 min-w-[200px] overflow-hidden">
                {myCompanies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/workspace/${c.slug}`}
                    onClick={() => setCompanySwitchOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[#f5f5f5] transition-colors ${
                      c.slug === company.slug ? "text-accent font-medium" : "text-[#111]"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {c.name}
                  </Link>
                ))}
              </div>
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
          <span className="text-xs text-[#bbb] hidden sm:block">{user.name}</span>
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
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-[#ebebeb] bg-white flex flex-col">
          <div className="flex items-center justify-between px-3 py-3 border-b border-[#f5f5f5]">
            <span className="text-xs font-medium text-[#888] uppercase tracking-wide">Folders</span>
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
          </div>

          {/* "All items" link */}
          <button
            onClick={() => setSelectedFolder(null)}
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
                  onSelect={setSelectedFolder}
                  onCreateSubfolder={isManager ? handleCreateSubfolder : undefined}
                  onDelete={isManager ? async (id) => {
                    if (!confirm("Delete this folder and all its items?")) return;
                    await fetch(`/api/workspace/folders?id=${id}&slug=${company.slug}`, { method: "DELETE" });
                    loadFolders();
                    if (selectedFolder?.id === id) setSelectedFolder(null);
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
              <div>
                <h2 className="text-sm font-semibold text-[#111]">
                  {selectedFolder ? selectedFolder.name : "All items"}
                </h2>
                {!selectedFolder && (
                  <p className="text-xs text-[#bbb] mt-0.5">Everything across all folders</p>
                )}
              </div>
              {isManager && selectedFolder && (
                <Button size="sm" variant="accent" onClick={() => setAddItemOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add item
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
            ) : selectedFolder ? (
              <FolderView
                slug={company.slug}
                folder={selectedFolder}
                isManager={isManager}
                onAddItem={() => setAddItemOpen(true)}
                onRefresh={loadFolders}
                refreshKey={refreshKey}
              />
            ) : (
              <AllItemsTable
                slug={company.slug}
                isManager={isManager}
                refreshKey={refreshKey}
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
    </div>
  );
}
