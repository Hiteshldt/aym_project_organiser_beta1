"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, MoreHorizontal, Plus, Trash2, Pencil, Palette } from "lucide-react";
import { FOLDER_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

const COLOR_KEYS = Object.keys(FOLDER_COLORS) as Array<keyof typeof FOLDER_COLORS>;

type FolderType = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  companyId: string;
  createdAt: string;
};

type Props = {
  folders: FolderType[];
  selectedId: string | null;
  onSelect: (folder: FolderType) => void;
  onCreateSubfolder?: (parent: FolderType) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, name: string) => Promise<void> | void;
  onChangeColor?: (id: string, color: string) => Promise<void> | void;
  slug: string;
  isManager: boolean;
};

function FolderNode({
  folder,
  depth,
  allFolders,
  selectedId,
  onSelect,
  onCreateSubfolder,
  onDelete,
  onRename,
  onChangeColor,
  isManager,
}: {
  folder: FolderType;
  depth: number;
  allFolders: FolderType[];
  selectedId: string | null;
  onSelect: (f: FolderType) => void;
  onCreateSubfolder?: (f: FolderType) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, name: string) => Promise<void> | void;
  onChangeColor?: (id: string, color: string) => Promise<void> | void;
  isManager: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const renameRef = useRef<HTMLInputElement>(null);
  const children = allFolders.filter((f) => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const colors = FOLDER_COLORS[folder.color as keyof typeof FOLDER_COLORS] || FOLDER_COLORS.slate;
  const isSelected = selectedId === folder.id;

  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renaming]);

  async function commitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === folder.name) {
      setRenaming(false);
      setRenameValue(folder.name);
      return;
    }
    if (onRename) await onRename(folder.id, trimmed);
    setRenaming(false);
  }

  function cancelRename() {
    setRenaming(false);
    setRenameValue(folder.name);
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-lg mx-1 cursor-pointer transition-colors relative",
          isSelected ? "bg-accent-soft text-accent-hover" : "hover:bg-[#f5f5f5] text-[#555]"
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <button
          onClick={() => { if (hasChildren) setOpen(!open); }}
          className="shrink-0 text-[#ccc] hover:text-[#888] transition-colors w-4"
        >
          {hasChildren ? (
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
          ) : (
            <span className="w-3.5 h-3.5 block" />
          )}
        </button>

        {renaming ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", colors.dot)} />
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelRename();
                }
              }}
              maxLength={120}
              className="flex-1 min-w-0 text-xs bg-white border border-accent rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        ) : (
          <button
            onClick={() => onSelect(folder)}
            onDoubleClick={(e) => {
              if (onRename && isManager) {
                e.stopPropagation();
                setRenaming(true);
              }
            }}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", colors.dot)} />
            <span className={cn("text-xs truncate", isSelected ? "font-medium text-accent-hover" : "text-[#444]")}>
              {folder.name}
            </span>
          </button>
        )}

        {isManager && !renaming && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#bbb] hover:text-[#555] transition-all"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {colorPickerOpen && onChangeColor && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setColorPickerOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[#e5e5e5] rounded-lg shadow-lg overflow-hidden p-2">
                  <div className="flex items-center gap-1.5">
                    {COLOR_KEYS.map((c) => {
                      const colorTokens = FOLDER_COLORS[c];
                      const isCurrent = folder.color === c;
                      return (
                        <button
                          key={c}
                          onClick={async () => {
                            setColorPickerOpen(false);
                            if (!isCurrent) await onChangeColor(folder.id, c);
                          }}
                          title={c}
                          className={cn(
                            "h-6 w-6 rounded-full transition-transform flex items-center justify-center",
                            isCurrent && "ring-2 ring-offset-1 ring-[#111]"
                          )}
                        >
                          <span className={cn("h-3.5 w-3.5 rounded-full", colorTokens.dot)} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[#e5e5e5] rounded-lg shadow-lg overflow-hidden min-w-[160px]">
                  {onRename && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setRenameValue(folder.name);
                        setRenaming(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#555] hover:bg-[#f5f5f5]"
                    >
                      <Pencil className="h-3 w-3" /> Rename
                    </button>
                  )}
                  {onChangeColor && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setColorPickerOpen(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#555] hover:bg-[#f5f5f5]"
                    >
                      <Palette className="h-3 w-3" /> Change color
                    </button>
                  )}
                  {onCreateSubfolder && (
                    <button
                      onClick={() => { setMenuOpen(false); onCreateSubfolder(folder); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#555] hover:bg-[#f5f5f5]"
                    >
                      <Plus className="h-3 w-3" /> Add subfolder
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(folder.id); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete folder
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {open && hasChildren && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              allFolders={allFolders}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateSubfolder={onCreateSubfolder}
              onDelete={onDelete}
              onRename={onRename}
              onChangeColor={onChangeColor}
              isManager={isManager}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  selectedId,
  onSelect,
  onCreateSubfolder,
  onDelete,
  onRename,
  onChangeColor,
  isManager,
}: Props) {
  const rootFolders = folders.filter((f) => !f.parentId);
  return (
    <div className="py-1">
      {rootFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          depth={0}
          allFolders={folders}
          selectedId={selectedId}
          onSelect={onSelect}
          onCreateSubfolder={onCreateSubfolder}
          onDelete={onDelete}
          onRename={onRename}
          onChangeColor={onChangeColor}
          isManager={isManager}
        />
      ))}
    </div>
  );
}
