"use client";

import { useState, useRef, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Link2,
  FileText,
  X,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { MAX_FILE_SIZE, formatDateTime } from "@/lib/utils";

type DuplicateInfo = {
  id: string;
  title: string;
  folderName: string;
  createdAt: string;
};

export default function AddItemModal({
  open,
  onClose,
  slug,
  folderId,
  folderName,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  folderId: string;
  folderName: string;
  onSuccess: () => void;
}) {
  const [type, setType] = useState<"link" | "file">("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [itemDate, setItemDate] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [checkingDup, setCheckingDup] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setType("link");
    setTitle("");
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
    reset();
    onClose();
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
      if (t && !tags.includes(t)) setTags([...tags, t]);
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((tag) => tag !== t));
  }

  async function checkDuplicate() {
    if (!url.trim() || type !== "link") return;
    setCheckingDup(true);
    setDuplicate(null);
    const res = await fetch("/api/workspace/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        folderId,
        title: title || url,
        type: "link",
        url,
        tags,
        notes,
        itemDate,
        _checkOnly: true,
      }),
    });
    setCheckingDup(false);
    if (res.status === 409) {
      const data = await res.json();
      setDuplicate(data.existing);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!folderId) {
      setError("Please select a folder first.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      let uploadedUrl = url;
      let fileKey: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      if (type === "file" && file) {
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
          title: title || (type === "file" ? file?.name : url) || "Untitled",
          type,
          url: uploadedUrl || null,
          fileKey,
          fileName,
          fileSize,
          tags,
          notes,
          itemDate,
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

      // If there's a duplicate with an update note, save the history
      if (duplicate && updateNote.trim()) {
        await fetch("/api/workspace/items/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: duplicate.id, slug, updateNote }),
        });
      }

      reset();
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

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Type switcher */}
          <div className="flex rounded-lg border border-[#e5e5e5] p-0.5 w-fit">
            {(["link", "file"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setError(""); setDuplicate(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  type === t ? "bg-[#111] text-white" : "text-[#888] hover:text-[#555]"
                }`}
              >
                {t === "link" ? <Link2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {t === "link" ? "Link" : "File"}
              </button>
            ))}
          </div>

          {/* URL / File */}
          {type === "link" ? (
            <div className="space-y-1.5">
              <Label>URL *</Label>
              <Input
                type="url"
                placeholder="https://www.canva.com/design/…"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setDuplicate(null); }}
                onBlur={checkDuplicate}
                required
              />
              {checkingDup && (
                <p className="text-xs text-[#bbb] flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking for duplicates…
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>File (max 20MB)</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-[#e5e5e5] rounded-lg p-6 text-center cursor-pointer hover:border-accent hover:bg-accent-soft/30 transition-all"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-[#555]">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span>{file.name}</span>
                    <span className="text-[#bbb]">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-[#ccc] mx-auto mb-2" />
                    <p className="text-xs text-[#bbb]">Click to select a file</p>
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-800">
                    This link already exists
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    &ldquo;{duplicate.title}&rdquo; in <strong>{duplicate.folderName}</strong> · added {formatDateTime(duplicate.createdAt)}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-amber-700">Did you make any updates? Write a short note (optional)</Label>
                <Textarea
                  placeholder="e.g. Updated the pricing section, new version uploaded…"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
              <p className="text-[11px] text-amber-500">
                You can still save — this will add the update note to the existing item&apos;s history.
              </p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="Fakhruddin proposal deck v3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date & time</Label>
            <Input
              type="datetime-local"
              value={itemDate}
              onChange={(e) => setItemDate(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 p-2 border border-[#e5e5e5] rounded-lg bg-white min-h-[40px]">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-[#f0f0f0] rounded-md px-2 py-0.5 text-xs text-[#555]">
                  #{t}
                  <button type="button" onClick={() => removeTag(t)} className="text-[#bbb] hover:text-[#555]">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={tags.length === 0 ? "Type a tag and press Enter…" : "Add more…"}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                className="flex-1 min-w-[120px] text-xs outline-none bg-transparent placeholder:text-[#ccc]"
              />
            </div>
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

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              className="flex-1"
              disabled={saving || uploading || (!folderId)}
            >
              {saving || uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : duplicate ? (
                "Save anyway"
              ) : (
                "Save item"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
