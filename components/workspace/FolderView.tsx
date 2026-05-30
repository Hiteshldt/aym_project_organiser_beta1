"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemCard from "./ItemCard";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";

type Folder = { id: string; name: string } | null;

type Item = {
  id: string;
  title: string;
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
  createdByName: string;
  historyCount: number;
};

function ItemSkeleton() {
  return (
    <div className="border border-[#ebebeb] rounded-xl bg-white px-4 py-3.5 flex items-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-[#f0f0f0] animate-pulse mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="h-4 bg-[#f0f0f0] rounded animate-pulse w-52" />
          <div className="h-4 bg-[#f0f0f0] rounded animate-pulse w-16 shrink-0" />
        </div>
        <div className="h-3 bg-[#f0f0f0] rounded animate-pulse w-72" />
        <div className="flex items-center gap-2 mt-1">
          <div className="h-4 bg-[#f0f0f0] rounded-full animate-pulse w-12" />
          <div className="h-4 bg-[#f0f0f0] rounded-full animate-pulse w-16" />
          <div className="h-3 bg-[#f0f0f0] rounded animate-pulse w-28 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export default function FolderView({
  slug,
  folder,
  isManager,
  onAddItem,
  onRefresh,
  onEdit,
  refreshKey,
}: {
  slug: string;
  folder: Folder;
  isManager: boolean;
  onAddItem: () => void;
  onRefresh: () => void;
  onEdit?: (item: Item) => void;
  refreshKey: number;
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!folder) return;
    setLoading(true);
    const res = await fetch(`/api/workspace/items?slug=${slug}&folderId=${folder.id}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [slug, folder]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function handleDelete(id: string) {
    const item = items.find((i) => i.id === id);
    const ok = await confirm({
      title: "Delete this item?",
      body: item ? `"${item.title}" will be removed.` : "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/workspace/items?id=${id}&slug=${slug}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete item.");
      return;
    }
    toast.success("Item deleted.");
    load();
  }

  async function handlePin(id: string, isPinned: boolean) {
    const res = await fetch("/api/workspace/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, slug, isPinned: !isPinned }),
    });
    if (res.ok) toast.success(isPinned ? "Unpinned." : "Pinned to top.");
    load();
  }

  if (loading) {
    return (
      <div className="px-6 py-4">
        <div className="grid gap-2">
          {Array.from({ length: 5 }).map((_, i) => <ItemSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!folder) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <FolderOpen className="h-12 w-12 text-[#e5e5e5] mb-3" />
        <p className="text-sm text-[#bbb]">This folder is empty.</p>
        {isManager && (
          <Button size="sm" variant="accent" className="mt-4" onClick={onAddItem}>
            <Plus className="h-3.5 w-3.5" /> Add first item
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div className="grid gap-2">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            slug={slug}
            isManager={isManager}
            onDelete={handleDelete}
            onPin={handlePin}
            onEdit={onEdit}
            onRefresh={load}
          />
        ))}
      </div>
    </div>
  );
}
