"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Link2,
  FileText,
  X,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { MAX_FILE_SIZE, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type DuplicateInfo = {
  id: string;
  title: string;
  folderName: string;
  createdAt: string;
};

type EditableItem = {
  id: string;
  title: string;
  description?: string | null;
  type: "link" | "file";
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  notes: string | null;
  itemDate: string;
};

export default function AddItemModal({
  open,
  onClose,
  slug,
  folderId,
  folderName,
  onSuccess,
  item,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  folderId: string;
  folderName: string;
  onSuccess: () => void;
  /** When passed, modal opens in edit mode for this item. */
  item?: EditableItem | null;
}) {
  const isEditing = !!item;

  const [type, setType] = useState<"link" | "file">("link");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [itemDate, setItemDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [checkingDup, setCheckingDup] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync local state with `item` whenever the modal opens or item changes
  useEffect(() => {
    if (!open) return;
    if (item) {
      setType(item.type);
      setTitle(item.title);
      setDescription(item.description ?? "");
      setUrl(item.url ?? "");
      setTags(item.tags ?? []);
      setTagInput("");
      setNotes(item.notes ?? "");
      setItemDate(new Date(item.itemDate).toISOString().slice(0, 16));
    } else {
      reset();
    }
    setError("");
    setDuplicate(null);
    setUpdateNote("");
    setFile(null);
    setSaving(false);
    setUploading(false);
  }, [open, item]);

  function reset() {
    setType("link");
    setTitle("");
    setDescription("");
    setUrl("");
    setTags([]);
    setTagInput("");
    setNotes("");
    setItemDate(new Date().toISOString().slice(0, 16));
    setSaving(false);
    setError("");
    setDuplicate(null);
    setUpdateNote("");
    setFile(null);
  }

  function handleClose() {
    if (!isEditing) reset();
    onClose();
  }

  /** Normalize free-text into a tag: lowercase, spaces → hyphens, strip junk. */
  function normalizeTag(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "");
  }

  function commitTag(raw: string) {
    const t = normalizeTag(raw);
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput("");
  }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) commitTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      // Quick-delete the last tag on backspace from empty input
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function handleTagBlur() {
    // If the user typed but didn't press Enter, still commit the tag
    if (tagInput.trim()) commitTag(tagInput);
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((tag) => tag !== t));
  }

  /** Pure duplicate check — no side effects on the server. */
  const checkDuplicate = useCallback(async () => {
    if (!url.trim() || type !== "link") {
      setDuplicate(null);
      return;
    }
    setCheckingDup(true);
    setDuplicate(null);
    const params = new URLSearchParams({ slug, url: url.trim() });
    if (item?.id) params.set("excludeId", item.id);
    const res = await fetch(`/api/workspace/items/check?${params}`);
    setCheckingDup(false);
    if (res.ok) {
      const data = await res.json();
      if (data.duplicate) setDuplicate(data.existing);
    }
  }, [url, type, slug, item?.id]);

  async function handleSubmit(e: React.FormEvent | null, forceNew = false) {
    e?.preventDefault();
    if (!folderId && !isEditing) {
      setError("Please select a folder first.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      // ─── EDIT MODE ────────────────────────────────────────────────
      if (isEditing && item) {
        const res = await fetch("/api/workspace/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            slug,
            title: title || (type === "file" ? item.fileName : url) || "Untitled",
            description: description.trim() || null,
            ...(type === "link" && { url: url || null }),
            tags,
            notes,
            itemDate,
            ...(updateNote.trim() && { updateNote: updateNote.trim() }),
          }),
        });
        if (!res.ok) {
          setError("Could not save changes.");
          setSaving(false);
          return;
        }
        toast.success("Item updated.");
        onSuccess();
        return;
      }

      // ─── ADD-NEW MODE WITH DUPLICATE: add note to existing instead ───
      // (skipped when the user explicitly chose "save as new anyway")
      if (duplicate && !forceNew) {
        if (!updateNote.trim()) {
          setError("Add a short note about the update.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/workspace/items/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: duplicate.id,
            slug,
            updateNote: updateNote.trim(),
          }),
        });
        if (!res.ok) {
          setError("Could not add update note.");
          setSaving(false);
          return;
        }
        toast.success("Note added to existing item.");
        onSuccess();
        return;
      }

      // ─── ADD-NEW MODE, NO DUPLICATE: create the item ───
      let uploadedUrl: string | null = url || null;
      let fileKey: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      if (type === "file") {
        if (!file) {
          setError("Choose a file first.");
          setSaving(false);
          return;
        }
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/workspace/upload", {
          method: "POST",
          body: fd,
        });
        setUploading(false);
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          setError(data.error || "Upload failed");
          setSaving(false);
          return;
        }
        const uploaded = await uploadRes.json();
        uploadedUrl = uploaded.url;
        fileKey = uploaded.key;
        fileName = uploaded.name;
        fileSize = uploaded.size;
      }

      const res = await fetch("/api/workspace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          folderId,
          title:
            title ||
            (type === "file" ? file?.name : url) ||
            "Untitled",
          description: description.trim() || null,
          type,
          url: uploadedUrl,
          fileKey,
          fileName,
          fileSize,
          tags,
          notes,
          itemDate,
          overrideDuplicate: forceNew,
        }),
      });

      if (res.status === 409) {
        // Race condition: someone else created the same URL between our check
        // and submit. Show the warning and let the user retry with a note.
        const data = await res.json();
        setDuplicate(data.existing);
        setSaving(false);
        return;
      }
      if (!res.ok) {
        setError("Failed to save item.");
        setSaving(false);
        return;
      }
      toast.success(forceNew ? "Saved as a new item." : "Item added.");
      onSuccess();
    } catch {
      setError("Something went wrong.");
      setSaving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setError("File exceeds 20MB limit.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
    setError("");
  }

  // In add-new mode with a duplicate, the warning block owns the actions —
  // so the footer collapses to just Cancel. Everywhere else: a normal submit.
  const duplicateInAddMode = !!duplicate && !isEditing;
  const submitLabel = isEditing ? "Save changes" : "Save item";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit item" : `Add to ${folderName || "folder"}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Type switcher — only when adding new, can't switch type on edit */}
          {!isEditing && (
            <div className="flex rounded-lg border border-line p-0.5 w-fit">
              {(["link", "file"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setError("");
                    setDuplicate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    type === t
                      ? "bg-ink text-paper"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  {t === "link" ? (
                    <Link2 className="h-3.5 w-3.5" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  {t === "link" ? "Link" : "File"}
                </button>
              ))}
            </div>
          )}

          {/* URL or file */}
          {type === "link" ? (
            <div className="space-y-1.5">
              <Label>URL{!isEditing && " *"}</Label>
              <Input
                type="url"
                placeholder="https://www.canva.com/design/…"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setDuplicate(null);
                }}
                onBlur={checkDuplicate}
                required={!isEditing}
              />
              {checkingDup && (
                <p className="text-xs text-mute-soft flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking for
                  duplicates…
                </p>
              )}
            </div>
          ) : isEditing ? (
            // Edit mode for file — show metadata, can't replace the file
            <div className="space-y-1.5">
              <Label>File</Label>
              <div className="rounded-lg border border-line bg-paper p-3 flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-warning shrink-0" />
                <span className="truncate text-ink">{item?.fileName}</span>
                <span className="text-mute-soft text-xs ml-auto">
                  {item?.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB` : ""}
                </span>
              </div>
              <p className="text-[11px] text-mute-soft">
                To replace the file, delete this item and add a new one.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>File (max 20MB)</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-line rounded-lg p-6 text-center cursor-pointer hover:border-accent hover:bg-accent-soft/30 transition-all"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-ink">
                    <FileText className="h-4 w-4 text-warning" />
                    <span>{file.name}</span>
                    <span className="text-mute-soft">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-mute-soft mx-auto mb-2" />
                    <p className="text-xs text-mute">Click to select a file</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Duplicate warning */}
          {duplicate && (
            <div className="rounded-lg border border-warning/30 bg-amber-50/60 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-ink">
                    This link already exists
                  </p>
                  <p className="text-xs text-mute mt-0.5">
                    &ldquo;{duplicate.title}&rdquo; in{" "}
                    <strong className="text-ink">{duplicate.folderName}</strong>
                    {" "}· added {formatDateTime(duplicate.createdAt)}
                  </p>
                </div>
              </div>
              {!isEditing && (
                <>
                  <div className="space-y-1">
                    <Label className="text-mute">Update note (optional)</Label>
                    <Textarea
                      placeholder="e.g. Updated pricing section, v4 with new images…"
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={saving || !updateNote.trim()}
                      title={!updateNote.trim() ? "Write a note first" : undefined}
                    >
                      Add note to existing
                    </Button>
                    <Button
                      type="button"
                      variant="accent"
                      size="sm"
                      className="flex-1"
                      disabled={saving}
                      onClick={() => handleSubmit(null, true)}
                    >
                      Save as a new item
                    </Button>
                  </div>
                  <p className="text-[11px] text-mute-soft">
                    Add a note to keep one entry and log the change — or save this
                    as a separate new item if it really belongs here too.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="Pitch deck v3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description — short one-liner */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="A short line — what this is"
              value={description}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-[11px] text-mute-soft">
              Optional. A quick subtitle shown next to the title and in registers.
            </p>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <Input
              type="datetime-local"
              value={itemDate}
              onChange={(e) => setItemDate(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 p-2 border border-line rounded-lg bg-paper-elevated min-h-[40px]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 bg-accent-soft text-accent-hover rounded-md px-2 py-0.5 text-xs font-medium"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-accent/70 hover:text-accent"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={
                  tags.length === 0
                    ? "Type a tag, press Enter…"
                    : "Add more…"
                }
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={handleTagBlur}
                className="flex-1 min-w-[120px] text-xs outline-none bg-transparent placeholder:text-mute-soft"
              />
            </div>
            <p className="text-[11px] text-mute-soft">
              Press Enter or comma to add. Spaces become hyphens.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any context that will help find this later…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[70px]"
            />
          </div>

          {/* Update note in edit mode (optional, separate from dup flow) */}
          {isEditing && !duplicate && (
            <div className="space-y-1.5">
              <Label>What changed? (optional)</Label>
              <Textarea
                placeholder="e.g. Replaced pricing with v4 numbers"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                className="min-h-[50px]"
              />
              <p className="text-[11px] text-mute-soft">
                If filled, this gets added to the item&apos;s history timeline.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            {!duplicateInAddMode && (
              <Button
                type="submit"
                variant="accent"
                className="flex-1"
                disabled={saving || uploading || (!folderId && !isEditing)}
              >
                {saving || uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  submitLabel
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
