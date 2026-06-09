"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, Loader2, Check, LogOut } from "lucide-react";
import { formatDate } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  hasPassword: boolean;
};

export default function SettingsShell({ user }: { user: User }) {
  // Return to the workspace you came from (the selector only shows when you
  // genuinely have several and none is remembered).
  const [backHref, setBackHref] = useState("/workspace");
  useEffect(() => {
    try {
      const last = localStorage.getItem("ayuvam-last-workspace");
      if (last) setBackHref(`/workspace/${last}`);
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-grain text-ink">
      {/* Top bar */}
      <header className="border-b border-line bg-paper-elevated/60 nav-blur">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to workspace
          </Link>
          <Link
            href="/"
            className="font-display-italic text-xl text-ink leading-none"
          >
            Ayuvam
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 md:py-16 space-y-10">
        {/* Page header */}
        <header>
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute">
            Account
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
            Settings
          </h1>
        </header>

        {/* Identity card */}
        <ProfileCard user={user} />

        {/* Password card */}
        <PasswordCard hasPassword={user.hasPassword} />

        {/* Session card */}
        <section className="rounded-2xl border border-line bg-paper-elevated p-6">
          <h2 className="font-display text-xl text-ink">Session</h2>
          <p className="text-sm text-mute mt-1">
            Signed in as <span className="text-ink font-medium">{user.email}</span>
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-4 inline-flex items-center gap-2 text-sm text-danger hover:text-accent-hover transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out of all devices
          </button>
        </section>

        {/* Account meta */}
        <p className="text-xs text-mute-soft font-mono-ui">
          Account created {formatDate(user.createdAt)} · role: {user.role}
        </p>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */

function ProfileCard({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const dirty = name.trim() !== user.name && name.trim().length > 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setError("");
    setSaving(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save");
      return;
    }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  return (
    <section className="rounded-2xl border border-line bg-paper-elevated p-6">
      <h2 className="font-display text-xl text-ink">Profile</h2>
      <p className="text-sm text-mute mt-1">
        How Ayuvam refers to you in the product.
      </p>

      <form onSubmit={save} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="font-mono-ui text-[11px] uppercase tracking-wider text-mute"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono-ui text-[11px] uppercase tracking-wider text-mute">
            Email
          </label>
          <div className="rounded-lg border border-line bg-paper/60 px-3 py-2.5 text-sm text-mute font-mono-ui">
            {user.email}
          </div>
          <p className="text-[11px] text-mute-soft">
            Your email comes from your sign-in provider and can&apos;t be
            changed here.
          </p>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!dirty || saving}
            className="btn-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Save changes"
            )}
          </button>
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(hasPassword && { currentPassword }),
        newPassword,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  return (
    <section className="rounded-2xl border border-line bg-paper-elevated p-6">
      <h2 className="font-display text-xl text-ink">
        {hasPassword ? "Change password" : "Set a password"}
      </h2>
      <p className="text-sm text-mute mt-1">
        {hasPassword
          ? "Use a strong password — 8 characters minimum."
          : "You signed up with Google. Set a password if you also want to sign in with email."}
      </p>

      <form onSubmit={save} className="mt-5 space-y-4">
        {hasPassword && (
          <div className="space-y-1.5">
            <label className="font-mono-ui text-[11px] uppercase tracking-wider text-mute">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="font-mono-ui text-[11px] uppercase tracking-wider text-mute">
            New password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono-ui text-[11px] uppercase tracking-wider text-mute">
            Confirm new password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
            className="btn-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : hasPassword ? (
              "Update password"
            ) : (
              "Set password"
            )}
          </button>
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
