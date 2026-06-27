"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowUpRight, ArrowLeft, Loader2, LogOut, Check } from "lucide-react";
import { FOLDER_COLORS, cn } from "@/lib/utils";

// Common ways studios slice up a client's work. Pre-checked ones cover the
// usual starting point; everything is editable later.
const STARTER_FOLDERS: {
  name: string;
  color: keyof typeof FOLDER_COLORS;
  preselect: boolean;
}[] = [
  { name: "Proposals", color: "indigo", preselect: true },
  { name: "Designs", color: "violet", preselect: true },
  { name: "Deliverables", color: "emerald", preselect: true },
  { name: "Contracts", color: "amber", preselect: false },
  { name: "Invoices", color: "rose", preselect: false },
  { name: "Brand assets", color: "slate", preselect: false },
];

export default function OnboardWizard({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(STARTER_FOLDERS.filter((f) => f.preselect).map((f) => f.name))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const firstName = userName.split(" ")[0] || "there";

  function toggle(folderName: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(folderName) ? next.delete(folderName) : next.add(folderName);
      return next;
    });
  }

  function goToFolders(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Give your workspace a name.");
      return;
    }
    setStep(2);
  }

  async function createWorkspace(picksOverride?: Set<string>) {
    const chosen = picksOverride ?? selected;
    setError("");
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

    // Seed the chosen starter folders. Best-effort and sequential so they keep
    // the order shown here; a folder that fails won't block landing in the space.
    const picks = STARTER_FOLDERS.filter((f) => chosen.has(f.name));
    for (const f of picks) {
      await fetch("/api/workspace/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: company.slug, name: f.name, color: f.color }),
      }).catch(() => {});
    }

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
          {step === 1 ? (
            <>
              {/* Step indicator */}
              <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute">
                Step 1 of 2 · {userEmail}
              </p>

              <h1 className="mt-3 font-display text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-ink">
                Welcome, <span className="font-display-italic">{firstName}.</span>
              </h1>

              <p className="mt-4 text-mute text-base leading-relaxed">
                Create your first workspace. Most people start with the name of
                their first client — you can rename it later.
              </p>

              {/* Form */}
              <form onSubmit={goToFolders} className="mt-10 space-y-4">
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

                {error && <p className="text-sm text-danger">{error}</p>}

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ArrowUpRight className="h-4 w-4" />
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
            </>
          ) : (
            <>
              {/* Step indicator */}
              <button
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                disabled={loading}
                className="inline-flex items-center gap-1 font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute hover:text-ink transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-3 w-3" />
                Step 2 of 2
              </button>

              <h1 className="mt-3 font-display text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-ink">
                What's inside{" "}
                <span className="font-display-italic">{name.trim()}?</span>
              </h1>

              <p className="mt-4 text-mute text-base leading-relaxed">
                Pick a few folders to start with. Each one is a clean table you
                can share — add, rename, or remove them anytime.
              </p>

              {/* Starter folder picker */}
              <div className="mt-8 grid grid-cols-2 gap-2.5">
                {STARTER_FOLDERS.map((f) => {
                  const on = selected.has(f.name);
                  const colors = FOLDER_COLORS[f.color];
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => toggle(f.name)}
                      disabled={loading}
                      aria-pressed={on}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all disabled:opacity-50",
                        on
                          ? "border-accent/40 bg-accent-soft/40"
                          : "border-line bg-paper-elevated hover:border-line-strong"
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colors.dot)} />
                      <span className="flex-1 text-sm text-ink truncate">
                        {f.name}
                      </span>
                      <span
                        className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                          on
                            ? "bg-accent border-accent text-white"
                            : "border-line-strong text-transparent"
                        )}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>

              {error && <p className="mt-4 text-sm text-danger">{error}</p>}

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => createWorkspace()}
                  disabled={loading}
                  className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {selected.size > 0
                        ? `Create workspace + ${selected.size} folder${selected.size > 1 ? "s" : ""}`
                        : "Create workspace"}
                      <ArrowUpRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={() => createWorkspace(new Set())}
                    disabled={loading}
                    className="font-mono-ui text-[11px] text-mute-soft hover:text-ink transition-colors disabled:opacity-50"
                  >
                    Skip
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
