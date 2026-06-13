"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Eye,
  Plus,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";

type Share = {
  id: string;
  token: string;
  label: string | null;
  clientEmail: string | null;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastAccessedAt: string | null;
};

export default function ShareWithClientModal({
  open,
  onClose,
  slug,
  companyName,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  companyName: string;
}) {
  const confirm = useConfirm();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [emailFeedback, setEmailFeedback] = useState<
    | { status: "sent"; email: string }
    | { status: "failed"; error: string }
    | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/workspace/shares?slug=${slug}`);
    if (res.ok) setShares(await res.json());
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  function getShareUrl(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/${token}`;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailFeedback(null);
    setCreating(true);
    const res = await fetch("/api/workspace/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        label: label.trim() || null,
        clientEmail: clientEmail.trim() || null,
      }),
    });
    setCreating(false);
    if (!res.ok) {
      setError("Could not create share link.");
      return;
    }
    const data = await res.json();
    if (data.emailStatus === "sent") {
      setEmailFeedback({ status: "sent", email: clientEmail.trim() });
    } else if (data.emailStatus === "failed") {
      setEmailFeedback({
        status: "failed",
        error: data.emailError ?? "Email delivery failed.",
      });
    }
    setLabel("");
    setClientEmail("");
    setShowForm(false);
    load();
  }

  async function handleRevoke(id: string) {
    const ok = await confirm({
      title: "Revoke this share link?",
      body: "Anyone who has the link will lose access immediately.",
      confirmLabel: "Revoke link",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/workspace/shares?id=${id}&slug=${slug}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Link revoked.");
      load();
    } else {
      toast.error("Could not revoke link.");
    }
  }

  async function copyLink(token: string, id: string) {
    await navigator.clipboard.writeText(getShareUrl(token));
    setCopiedId(id);
    toast.success("Share link copied.");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleClose() {
    setShowForm(false);
    setLabel("");
    setClientEmail("");
    setError("");
    setEmailFeedback(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share {companyName} with your client</DialogTitle>
          <DialogDescription>
            Send the link by email or copy it manually. Anyone with the link
            can view this workspace — no login required. Revoke anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Email feedback banner */}
          {emailFeedback?.status === "sent" && (
            <div className="flex items-start gap-2 rounded-lg border border-accent-soft bg-accent-soft/40 px-3 py-2.5">
              <Mail className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink">Link sent</p>
                <p className="text-[11px] text-mute font-mono-ui mt-0.5 truncate">
                  Delivered to {emailFeedback.email}
                </p>
              </div>
              <button
                onClick={() => setEmailFeedback(null)}
                className="text-mute-soft hover:text-ink text-[11px]"
              >
                ×
              </button>
            </div>
          )}
          {emailFeedback?.status === "failed" && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-amber-50/60 dark:bg-warning/10 px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink">
                  Link created, but email failed
                </p>
                <p className="text-[11px] text-mute mt-0.5">
                  {emailFeedback.error}. You can still copy the link below.
                </p>
              </div>
              <button
                onClick={() => setEmailFeedback(null)}
                className="text-mute-soft hover:text-ink text-[11px]"
              >
                ×
              </button>
            </div>
          )}

          {/* Existing shares */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-mute-soft" />
            </div>
          ) : shares.length > 0 ? (
            <div className="space-y-2">
              {shares.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-line bg-paper p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">
                        {s.label || "Untitled link"}
                      </p>
                      <p className="text-[11px] text-mute font-mono-ui mt-0.5">
                        {s.clientEmail && <span>{s.clientEmail} · </span>}
                        created {formatDate(s.createdAt)}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-[11px]">
                        {s.lastAccessedAt ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            <span className="text-success font-medium">
                              Viewed {timeAgo(s.lastAccessedAt)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-mute-soft" />
                            <span className="text-mute-soft">Not opened yet</span>
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(s.id)}
                      className="text-mute-soft hover:text-danger transition-colors p-1"
                      title="Revoke link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <code className="flex-1 truncate rounded-md border border-line bg-paper-elevated px-2 py-1.5 text-[11px] font-mono-ui text-mute">
                      {getShareUrl(s.token)}
                    </code>
                    <button
                      onClick={() => copyLink(s.token, s.id)}
                      className="shrink-0 rounded-md border border-line bg-paper-elevated px-2 py-1.5 text-[11px] hover:border-line-strong transition-colors inline-flex items-center gap-1"
                    >
                      {copiedId === s.id ? (
                        <>
                          <Check className="h-3 w-3 text-success" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                    <a
                      href={getShareUrl(s.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md border border-line bg-paper-elevated px-2 py-1.5 text-[11px] hover:border-line-strong transition-colors inline-flex items-center gap-1 text-mute hover:text-ink"
                      title="See exactly what your client sees"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : !showForm ? (
            <div className="rounded-lg border border-dashed border-line bg-paper p-6 text-center">
              <div className="mx-auto h-9 w-9 rounded-full bg-accent-soft flex items-center justify-center mb-2">
                <Eye className="h-4 w-4 text-accent" />
              </div>
              <p className="text-sm text-ink font-medium">No active links</p>
              <p className="mt-1 text-xs text-mute">
                Create one and send it to your client.
              </p>
            </div>
          ) : null}

          {/* Create form */}
          {showForm ? (
            <form
              onSubmit={handleCreate}
              className="space-y-3 rounded-lg border border-line bg-paper p-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="share-label">Label (optional)</Label>
                <Input
                  id="share-label"
                  placeholder="e.g. Google — main point of contact"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <p className="text-[11px] text-mute-soft">
                  For your reference. Not shown to the client.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="share-email">Client email (optional)</Label>
                <Input
                  id="share-email"
                  type="email"
                  placeholder="alex@google.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
                <p className="text-[11px] text-mute-soft">
                  We'll email the link here. Leave blank to copy and send it
                  yourself.
                </p>
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  className="flex-1"
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create link"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="accent"
              onClick={() => setShowForm(true)}
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5" /> New share link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
