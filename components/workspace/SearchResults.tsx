"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, SearchX, Folder } from "lucide-react";
import ItemCard from "./ItemCard";
import { useDebounce } from "@/lib/useDebounce";

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

export default function SearchResults({
  slug,
  query,
  isManager,
  onClearSearch,
  onRefresh,
}: {
  slug: string;
  query: string;
  isManager: boolean;
  onClearSearch: () => void;
  onRefresh: () => void;
}) {
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async () => {
    if (!debouncedQuery.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/workspace/search?slug=${slug}&q=${encodeURIComponent(debouncedQuery)}`);
    if (res.ok) setResults(await res.json());
    setLoading(false);
  }, [slug, debouncedQuery]);

  useEffect(() => { search(); }, [search]);

  // Group by folder
  const grouped = results.reduce<Record<string, { folderName: string; items: Item[] }>>((acc, item) => {
    if (!acc[item.folderId]) acc[item.folderId] = { folderName: item.folderName, items: [] };
    acc[item.folderId].items.push(item);
    return acc;
  }, {});

  return (
    <div className="px-6 py-4">
      <p className="text-xs text-[#888] mb-4">
        {loading ? "Searching…" : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
      </p>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-[#ccc]" />
        </div>
      )}

      {!loading && results.length === 0 && query.length > 1 && (
        <div className="flex flex-col items-center py-16 text-center">
          <SearchX className="h-10 w-10 text-[#e5e5e5] mb-3" />
          <p className="text-sm text-[#bbb]">Nothing found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-[#ccc] mt-1">Try different keywords or tags.</p>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([folderId, group]) => (
        <div key={folderId} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="h-3.5 w-3.5 text-[#bbb]" />
            <span className="text-xs font-medium text-[#888]">{group.folderName}</span>
          </div>
          <div className="grid gap-2">
            {group.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                slug={slug}
                isManager={isManager}
                onDelete={async (id) => {
                  if (!confirm("Delete this item?")) return;
                  await fetch(`/api/workspace/items?id=${id}&slug=${slug}`, { method: "DELETE" });
                  search();
                }}
                onPin={async (id, isPinned) => {
                  await fetch("/api/workspace/items", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, slug, isPinned: !isPinned }),
                  });
                  search();
                }}
                onRefresh={search}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
