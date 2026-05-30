"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FolderClosed, Table2 } from "lucide-react";
import { FOLDER_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Folder = { id: string; name: string } | null;
type ViewType = "cards" | "register";

const COLORS = Object.keys(FOLDER_COLORS) as Array<keyof typeof FOLDER_COLORS>;

export default function CreateFolderModal({
  open,
  onClose,
  slug,
  parentFolder,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  parentFolder: Folder;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<keyof typeof FOLDER_COLORS>("slate");
  const [viewType, setViewType] = useState<ViewType>("cards");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Subfolders are always simple card collections — only top-level folders
  // can be a Register.
  const isSubfolder = !!parentFolder;

  function handleClose() {
    setName("");
    setColor("slate");
    setViewType("cards");
    setError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/workspace/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: name.trim(),
        parentId: parentFolder?.id || null,
        color,
        viewType: isSubfolder ? "cards" : viewType,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to create folder.");
      return;
    }
    toast.success(
      isSubfolder
        ? "Subfolder created."
        : viewType === "register"
          ? "Register created."
          : "Collection created."
    );
    setName("");
    setColor("slate");
    setViewType("cards");
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isSubfolder ? `New subfolder in "${parentFolder!.name}"` : "Create new"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Type picker — top-level only */}
          {!isSubfolder && (
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setViewType("cards")}
                  className={cn(
                    "text-left rounded-lg border p-3 transition-all",
                    viewType === "cards"
                      ? "border-accent bg-accent-soft/40"
                      : "border-line hover:border-line-strong"
                  )}
                >
                  <FolderClosed
                    className={cn(
                      "h-4 w-4 mb-1.5",
                      viewType === "cards" ? "text-accent" : "text-mute"
                    )}
                  />
                  <p className="text-xs font-medium text-ink">Collection</p>
                  <p className="text-[11px] text-mute-soft mt-0.5 leading-snug">
                    Cards for links &amp; files
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setViewType("register")}
                  className={cn(
                    "text-left rounded-lg border p-3 transition-all",
                    viewType === "register"
                      ? "border-accent bg-accent-soft/40"
                      : "border-line hover:border-line-strong"
                  )}
                >
                  <Table2
                    className={cn(
                      "h-4 w-4 mb-1.5",
                      viewType === "register" ? "text-accent" : "text-mute"
                    )}
                  />
                  <p className="text-xs font-medium text-ink">Register</p>
                  <p className="text-[11px] text-mute-soft mt-0.5 leading-snug">
                    A table of project deliverables
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{viewType === "register" && !isSubfolder ? "Register name" : "Folder name"}</Label>
            <Input
              placeholder={
                viewType === "register" && !isSubfolder
                  ? "PureAir Tower, Q3 Campaign…"
                  : "Proposals, Designs, Pitch Decks…"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    FOLDER_COLORS[c].dot,
                    color === c ? "border-[#111] scale-110" : "border-transparent"
                  )}
                  title={c}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="accent" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
