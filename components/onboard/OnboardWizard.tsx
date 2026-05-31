"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowUpRight, Loader2, LogOut } from "lucide-react";

export default function OnboardWizard({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const firstName = userName.split(" ")[0] || "there";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Give your workspace a name.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/workspace/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create the workspace.");
      setLoading(false);
      return;
    }
    const company = await res.json();
    router.push(`/workspace/${company.slug}`);
  }

  return (
    <div className="min-h-screen bg-grain flex flex-col">
      {/* Top bar — minimal */}
      <header className="px-6 py-4 flex items-center justify-between">
        <span className="font-display-italic text-2xl text-ink leading-none">
          Ayuvam
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center gap-1 text-xs text-mute-soft hover:text-ink transition-colors"
        >
          <LogOut className="h-3 w-3" />
          Sign out
        </button>
      </header>

      {/* Wizard body */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Greeting */}
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute">
            Step 1 of 1 · {userEmail}
          </p>

          <h1 className="mt-3 font-display text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-ink">
            Welcome, <span className="font-display-italic">{firstName}.</span>
          </h1>

          <p className="mt-4 text-mute text-base leading-relaxed">
            Create your first workspace. Most people start with the name of
            their first client — you can rename it later.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="ws-name"
                className="font-mono-ui text-[11px] uppercase tracking-wider text-mute"
              >
                Workspace name
              </label>
              <input
                id="ws-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Google, or your studio name"
                maxLength={60}
                autoFocus
                className="w-full font-display text-3xl md:text-4xl leading-tight tracking-[-0.02em] bg-transparent border-b border-line-strong focus:border-accent transition-colors outline-none py-3 placeholder:text-mute-soft text-ink"
              />
            </div>

            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create workspace
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <span className="font-mono-ui text-[11px] text-mute-soft">
                ↵ to continue
              </span>
            </div>
          </form>

          {/* Footer note */}
          <p className="mt-12 text-xs text-mute-soft leading-relaxed">
            A workspace is a private space where you organize work for one
            client. Add folders, drop in proposals and files, then share a
            view-only link with the client.
          </p>
        </div>
      </main>
    </div>
  );
}
