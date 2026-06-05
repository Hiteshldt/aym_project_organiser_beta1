"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { ChevronRight, MoreHorizontal, Plus, Trash2, Pencil, Palette, GripVertical } from "lucide-react";
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

// Drag-to-reorder (siblings only) shared down the tree via context.
type FolderDnd = {
  enabled: boolean;
  dragId: string | null;
  draggingId: string | null;
  overId: string | null;
  setDragId: (id: string | null) => void;
  start: (f: FolderType) => void;
  over: (f: FolderType, e: React.DragEvent) => void;
  drop: (f: FolderType) => void;
  end: () => void;
};
const DndContext = createContext<FolderDnd | null>(null);

type Props = {
  folders: FolderType[];
  selectedId: string | null;
  onSelect: (folder: FolderType) => void;
  onCreateSubfolder?: (parent: FolderType) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, name: string) => Promise<void> | void;
  onChangeColor?: (id: string, color: string) => Promise<void> | void;
  onReorder?: (orderedIds: string[]) => void;
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
  const dnd = useContext(DndContext);
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
        draggable={!!dnd?.enabled && dnd.dragId === folder.id}
        onDragStart={() => dnd?.start(folder)}
        onDragOver={(e) => dnd?.over(folder, e)}
        onDrop={(e) => { e.preventDefault(); dnd?.drop(folder); }}
        onDragEnd={() => dnd?.end()}
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-lg mx-1 cursor-pointer transition-colors relative",
          isSelected ? "bg-accent-soft text-accent-hover" : "hover:bg-line/50 text-mute",
          dnd?.draggingId === folder.id && "opacity-40",
          dnd?.overId === folder.id && dnd?.draggingId && dnd.draggingId !== folder.id && "border-t-2 border-t-accent"
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {dnd?.enabled && (
          <button
            onMouseDown={() => dnd.setDragId(folder.id)}
            onMouseUp={() => dnd.setDragId(null)}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
            aria-label="Drag to reorder"
            className="shrink-0 -ml-1 cursor-grab active:cursor-grabbing text-mute-soft hover:text-mute opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => { if (hasChildren) setOpen(!open); }}
          className="shrink-0 text-mute-soft hover:text-mute transition-colors w-4"
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
              className="flex-1 min-w-0 text-xs bg-paper-elevated text-ink border border-accent rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-accent"
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
            <span className={cn("text-xs truncate", isSelected ? "font-medium text-accent-hover" : "text-ink")}>
              {folder.name}
            </span>
          </button>
        )}

        {isManager && !renaming && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-mute-soft hover:text-mute transition-all"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {colorPickerOpen && onChangeColor && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setColorPickerOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-paper-elevated border border-line rounded-lg shadow-lg overflow-hidden p-2">
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
                            isCurrent && "ring-2 ring-offset-1 ring-ink ring-offset-paper-elevated"
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
                <div className="absolute right-0 top-full mt-1 z-20 bg-paper-elevated border border-line rounded-lg shadow-lg overflow-hidden min-w-[160px]">
                  {onRename && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setRenameValue(folder.name);
                        setRenaming(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-mute hover:bg-line/50"
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
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-mute hover:bg-line/50"
                    >
                      <Palette className="h-3 w-3" /> Change color
                    </button>
                  )}
                  {onCreateSubfolder && (
                    <button
                      onClick={() => { setMenuOpen(false); onCreateSubfolder(folder); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-mute hover:bg-line/50"
                    >
                      <Plus className="h-3 w-3" /> Add subfolder
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(folder.id); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-danger hover:bg-danger/10"
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
  onReorder,
  isManager,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingParentId, setDraggingParentId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const end = () => {
    setDragId(null);
    setDraggingId(null);
    setDraggingParentId(null);
    setOverId(null);
  };

  const dnd: FolderDnd = {
    enabled: !!onReorder && isManager,
    dragId,
    draggingId,
    overId,
    setDragId,
    start: (f) => { setDraggingId(f.id); setDraggingParentId(f.parentId); },
    over: (f, e) => {
      if (draggingId && draggingParentId === f.parentId) {
        e.preventDefault();
        setOverId(f.id);
      }
    },
    drop: (f) => {
      if (!draggingId || draggingId === f.id || draggingParentId !== f.parentId) {
        end();
        return;
      }
      const sibs = folders.filter((x) => x.parentId === f.parentId).map((x) => x.id);
      const from = sibs.indexOf(draggingId);
      const to = sibs.indexOf(f.id);
      if (from < 0 || to < 0) { end(); return; }
      const next = [...sibs];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      onReorder?.(next);
      end();
    },
    end,
  };

  const rootFolders = folders.filter((f) => !f.parentId);
  return (
    <DndContext.Provider value={dnd}>
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
    </DndContext.Provider>
  );
}
