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
  FileText,
  X,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { MAX_FILE_SIZE, formatDateTime, toDatetimeLocal, cn } from "@/lib/utils";
import {
  type StatusOption,
  STATUS_CHIP,
  COLOR_DOT,
  REGISTER_COLORS,
} from "@/lib/register";
import { toast } from "sonner";

type DuplicateInfo = {
  id: string;
  title: string;
  folderName: string;
  createdAt: string;
};

/**
 * Add-only modal. Title is the only required field — a link or file can be
 * attached now or added later from the item's detail panel. Editing an
 * existing row happens in ItemPanel, so this stays a focused "create" form.
 */
export default function AddItemModal({
  open,
  onClose,
  slug,
  folderId,
  folderName,
  onSuccess,
  statusOptions = [],
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  folderId: string;
  folderName: string;
  onSuccess: () => void;
  statusOptions?: StatusOption[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [rowColor, setRowColor] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagHintDismissed, setTagHintDismissed] = useState(false);
  const [notes, setNotes] = useState("");
  const [itemDate, setItemDate] = useState(toDatetimeLocal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [checkingDup, setCheckingDup] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setUrl("");
    setStatus(null);
    setRowColor(null);
    setTags([]);
    setTagInput("");
    setNotes("");
    setItemDate(toDatetimeLocal());
    setSaving(false);
    setError("");
    setDuplicate(null);
    setUpdateNote("");
    setFile(null);
    setUploading(false);
    setTagHintDismissed(false);
  }

  useEffect(() => {
    if (open) reset();
  }, [open]);

  useEffect(() => {
    if (!open || !folderId) return;
    let alive = true;
    fetch(`/api/workspace/items?slug=${slug}&folderId=${folderId}&recent=1`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { tags: string[] }[]) => {
        if (!alive) return;
        const withTags = list.find((i) => i.tags && i.tags.length > 0);
        setSuggestedTags(withTags?.tags ?? []);
      })
      .catch(() => {});
    fetch(`/api/workspace/tags?slug=${slug}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((t: string[]) => alive && setAllTags(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open, folderId, slug]);

  function handleClose() {
    reset();
    onClose();
  }

  function normalizeTag(raw: string): string {
    return raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
  }
  function commitTag(raw: string) {
    const t = normalizeTag(raw);
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput("");
  }

  const canImportTags = !tagInput.trim() && tags.length === 0 && suggestedTags.length > 0 && !tagHintDismissed;

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) commitTag(tagInput);
      else if (canImportTags) { setTags(suggestedTags); setTagHintDismissed(true); }
    } else if (e.key === "Backspace" && !tagInput) {
      if (tags.length > 0) setTags((prev) => prev.slice(0, -1));
      else if (canImportTags) setTagHintDismissed(true);
    }
  }
  function removeTag(t: string) {
    setTags((prev) => prev.filter((tag) => tag !== t));
  }

  const checkDuplicate = useCallback(async () => {
    if (!url.trim()) {
      setDuplicate(null);
      return;
    }
    setCheckingDup(true);
    setDuplicate(null);
    const res = await fetch(`/api/workspace/items/check?slug=${slug}&url=${encodeURIComponent(url.trim())}`);
    setCheckingDup(false);
    if (res.ok) {
      const data = await res.json();
      if (data.duplicate) setDuplicate(data.existing);
    }
  }, [url, slug]);

  async function handleSubmit(e: React.FormEvent | null, forceNew = false) {
    e?.preventDefault();
    if (!folderId) {
      setError("Please select a folder first.");
      return;
    }
    if (!title.trim()) {
      setError("Give it a title.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      // Duplicate link found and not overriding → log a note on the existing one.
      if (duplicate && !forceNew) {
        if (!updateNote.trim()) {
          setError("Add a short note about the update.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/workspace/items/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: duplicate.id, slug, updateNote: updateNote.trim() }),
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

      // A file (if attached) makes it a file item; otherwise it's a link item
      // whose URL is optional — you can add the link later from the panel.
      let type: "link" | "file" = "link";
      let finalUrl: string | null = url.trim() || null;
      let fileKey: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      if (file) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/workspace/upload", { method: "POST", body: fd });
        setUploading(false);
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          setError(data.error || "Upload failed");
          setSaving(false);
          return;
        }
        const uploaded = await uploadRes.json();
        type = "file";
        finalUrl = uploaded.url;
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
          title: title.trim(),
          description: description.trim() || null,
          status,
          rowColor,
          type,
          url: finalUrl,
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
      toast.success(forceNew ? "Saved as a new item." : "Row added.");
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to {folderName || "folder"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title — the only required field */}
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              placeholder="Pitch deck v3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="A short line — what this is"
              value={description}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Link — optional */}
          <div className="space-y-1.5">
            <Label>Link <span className="text-mute-soft font-normal">· optional, add later anytime</span></Label>
            <Input
              type="url"
              placeholder="https://www.figma.com/file/…"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setDuplicate(null); }}
              onBlur={checkDuplicate}
              disabled={!!file}
            />
            {checkingDup && (
              <p className="text-xs text-mute-soft flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking for duplicates…
              </p>
            )}
          </div>

          {/* File — optional alternative to a link */}
          <div className="space-y-1.5">
            <Label>Or attach a file <span className="text-mute-soft font-normal">· optional, max 20MB</span></Label>
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-paper p-2.5 text-sm">
                <FileText className="h-4 w-4 text-warning shrink-0" />
                <span className="truncate text-ink">{file.name}</span>
                <span className="text-mute-soft text-xs">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                <button type="button" onClick={() => setFile(null)} className="ml-auto text-mute-soft hover:text-danger">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-line rounded-lg p-4 text-center cursor-pointer hover:border-accent hover:bg-accent-soft/30 transition-all"
              >
                <Upload className="h-5 w-5 text-mute-soft mx-auto mb-1.5" />
                <p className="text-xs text-mute">Click to attach a file</p>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Duplicate warning — non-blocking */}
          {duplicate && (
            <div className="rounded-lg border border-warning/30 bg-amber-50/60 dark:bg-warning/10 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-ink">This link already exists</p>
                  <p className="text-xs text-mute mt-0.5">
                    &ldquo;{duplicate.title}&rdquo; in <strong className="text-ink">{duplicate.folderName}</strong>
                    {" "}· added {formatDateTime(duplicate.createdAt)}
                  </p>
                </div>
              </div>
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
                <Button type="submit" variant="outline" size="sm" className="flex-1" disabled={saving || !updateNote.trim()}>
                  Add note to existing
                </Button>
                <Button type="button" variant="accent" size="sm" className="flex-1" disabled={saving} onClick={() => handleSubmit(null, true)}>
                  Save as a new item
                </Button>
              </div>
            </div>
          )}

          {/* Status */}
          {statusOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setStatus(status === opt.label ? null : opt.label)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                      status === opt.label
                        ? STATUS_CHIP[opt.color] + " ring-2 ring-offset-1 ring-accent ring-offset-paper-elevated"
                        : STATUS_CHIP[opt.color] + " opacity-60 hover:opacity-100"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Row color */}
          <div className="space-y-1.5">
            <Label>Row color</Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {REGISTER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setRowColor(rowColor === c ? null : c)}
                  title={c}
                  className={cn(
                    "h-6 w-6 rounded-full transition-transform hover:scale-110",
                    COLOR_DOT[c],
                    rowColor === c && "ring-2 ring-offset-1 ring-ink ring-offset-paper-elevated"
                  )}
                />
              ))}
              {rowColor && (
                <button type="button" onClick={() => setRowColor(null)} className="text-[11px] text-mute hover:text-ink ml-1">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <Input type="datetime-local" value={itemDate} onChange={(e) => setItemDate(e.target.value)} />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 p-2 border border-line rounded-lg bg-paper-elevated min-h-[40px]">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-accent-soft text-accent-hover rounded-md px-2 py-0.5 text-xs font-medium">
                  #{t}
                  <button type="button" onClick={() => removeTag(t)} className="text-accent/70 hover:text-accent">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                list="ws-tag-suggest"
                placeholder={tags.length === 0 ? "Type a tag, press Enter…" : "Add more…"}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={() => tagInput.trim() && commitTag(tagInput)}
                className="flex-1 min-w-[120px] text-xs outline-none bg-transparent text-ink placeholder:text-mute-soft"
              />
              <datalist id="ws-tag-suggest">
                {allTags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            {canImportTags ? (
              <p className="text-[11px] text-mute-soft">
                Press <kbd className="font-mono-ui text-ink">↵</kbd> to import from your last item:{" "}
                {suggestedTags.map((t) => (
                  <span key={t} className="text-accent">#{t} </span>
                ))}
                <button type="button" onClick={() => setTagHintDismissed(true)} className="ml-1 underline hover:text-mute">
                  dismiss
                </button>
              </p>
            ) : (
              <p className="text-[11px] text-mute-soft">Press Enter or comma to add. Spaces become hyphens.</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Remark</Label>
            <Textarea
              placeholder="Any context that will help find this later…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[70px]"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          {!duplicate && (
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="accent" className="flex-1" disabled={saving || uploading || !folderId || !title.trim()}>
                {saving || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add row"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
