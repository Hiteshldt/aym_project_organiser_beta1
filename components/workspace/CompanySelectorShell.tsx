"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Building2,
  Plus,
  ArrowUpRight,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Company = { id: string; name: string; slug: string; role: string };

export default function CompanySelectorShell({
  companies,
  user,
}: {
  companies: Company[];
  user: { name: string; email: string };
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Give your workspace a name.");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/workspace/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create the workspace.");
      setCreating(false);
      return;
    }
    const company = await res.json();
    router.push(`/workspace/${company.slug}`);
  }

  return (
    <div className="min-h-screen bg-grain flex flex-col">
      <header className="border-b border-line bg-paper-elevated/60 nav-blur px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-display-italic text-2xl text-ink leading-none"
        >
          Ayuvam
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-mute-soft">{user.name}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute">
            Your workspaces
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink">
            Choose where to <span className="font-display-italic">work.</span>
          </h1>

          <div className="mt-8 space-y-2">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/workspace/${c.slug}`}
                className="flex items-center justify-between p-4 rounded-xl border border-line bg-paper-elevated hover:border-line-strong hover:shadow-[0_8px_30px_-15px_rgba(15,15,15,0.12)] transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-accent-soft/60 flex items-center justify-center group-hover:bg-accent-soft transition-colors shrink-0">
                    <Building2 className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-medium text-ink truncate">
                    {c.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={c.role === "manager" ? "accent" : "default"}>
                    {c.role}
                  </Badge>
                  <ArrowUpRight className="h-3.5 w-3.5 text-mute-soft group-hover:text-ink transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {/* Create new */}
          <div className="mt-4">
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-line-strong text-mute hover:text-ink hover:border-ink transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                New workspace
              </button>
            ) : (
              <form
                onSubmit={handleCreate}
                className="rounded-xl border border-line bg-paper-elevated p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono-ui text-[11px] uppercase tracking-wider text-mute">
                    New workspace
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setName("");
                      setError("");
                    }}
                    className="text-mute-soft hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Google"
                  maxLength={60}
                  autoFocus
                  className="w-full font-display text-2xl leading-tight bg-transparent border-b border-line focus:border-accent transition-colors outline-none py-2 placeholder:text-mute-soft text-ink"
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="btn-accent w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
