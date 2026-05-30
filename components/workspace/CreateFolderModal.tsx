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
import { Loader2 } from "lucide-react";
import { FOLDER_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Folder = { id: string; name: string } | null;

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    setName("");
    setColor("slate");
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
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to create folder.");
      return;
    }
    toast.success(parentFolder ? "Subfolder created." : "Folder created.");
    setName("");
    setColor("slate");
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {parentFolder ? `New subfolder in "${parentFolder.name}"` : "New folder"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Folder name</Label>
            <Input
              placeholder="Proposals, Designs, Pitch Decks…"
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
