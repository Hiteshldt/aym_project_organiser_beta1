"use client";

import { Folder as FolderIcon, ChevronRight } from "lucide-react";
import { FOLDER_COLORS, cn } from "@/lib/utils";

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  companyId: string;
  createdAt: string;
};

/**
 * Shown when the selected folder is a *container* — it has sub-folders. Lists
 * them as navigable cards so items live in the leaves, not the parent.
 */
export default function FolderOverview({
  folders,
  onSelect,
}: {
  folders: Folder[];
  onSelect: (f: Folder) => void;
}) {
  return (
    <div className="px-4 sm:px-6 pt-4">
      <p className="font-mono-ui text-[10px] uppercase tracking-wider text-mute-soft mb-2">
        Folders inside
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {folders.map((f) => {
          const colors =
            FOLDER_COLORS[f.color as keyof typeof FOLDER_COLORS] ?? FOLDER_COLORS.slate;
          return (
            <button
              key={f.id}
              onClick={() => onSelect(f)}
              className="group flex items-center gap-3 rounded-xl border border-line bg-paper-elevated px-3.5 py-3 text-left hover:border-line-strong transition-all"
            >
              <span className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                <FolderIcon className={cn("h-4 w-4", colors.text)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink truncate">{f.name}</span>
                <span className="block text-[11px] text-mute-soft">Open</span>
              </span>
              <ChevronRight className="h-4 w-4 text-mute-soft group-hover:text-mute transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
