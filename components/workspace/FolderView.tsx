"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemCard from "./ItemCard";

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
  tags: string[];
  notes: string | null;
  itemDate: string;
  isPinned: boolean;
  createdAt: string;
  createdByName: string;
  historyCount: number;
};

export default function FolderView({
  slug,
  folder,
  isManager,
  onAddItem,
  onRefresh,
}: {
  slug: string;
  folder: Folder;
  isManager: boolean;
  onAddItem: () => void;
  onRefresh: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const url = folder
      ? `/api/workspace/items?slug=${slug}&folderId=${folder.id}`
      : `/api/workspace/items?slug=${slug}&recent=true`;
    const res = await fetch(url);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [slug, folder]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/workspace/items?id=${id}&slug=${slug}`, { method: "DELETE" });
    load();
  }

  async function handlePin(id: string, isPinned: boolean) {
    await fetch("/api/workspace/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, slug, isPinned: !isPinned }),
    });
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-[#ccc]" />
      </div>
    );
  }

  if (!folder && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
        <FolderOpen className="h-12 w-12 text-[#e5e5e5] mb-3" />
        <p className="text-sm text-[#bbb]">Nothing added yet.</p>
        {isManager && (
          <p className="text-xs text-[#ccc] mt-1">Select a folder and add your first item.</p>
        )}
      </div>
    );
  }

  if (folder && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <FolderOpen className="h-12 w-12 text-[#e5e5e5] mb-3" />
        <p className="text-sm text-[#bbb]">This folder is empty.</p>
        {isManager && (
          <Button size="sm" variant="indigo" className="mt-4" onClick={onAddItem}>
            <Plus className="h-3.5 w-3.5" /> Add first item
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {!folder && (
        <p className="text-xs text-[#bbb] mb-4 font-medium uppercase tracking-wide">Recent</p>
      )}
      <div className="grid gap-2">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            slug={slug}
            isManager={isManager}
            onDelete={handleDelete}
            onPin={handlePin}
            onRefresh={load}
          />
        ))}
      </div>
    </div>
  );
}
