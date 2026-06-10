"use client";

import { useState } from "react";
import { FolderPlus, Plus, Share2, Loader2, Folder as FolderIcon } from "lucide-react";
import { FOLDER_COLORS, cn } from "@/lib/utils";

const SUGGESTIONS: { name: string; color: keyof typeof FOLDER_COLORS }[] = [
  { name: "Proposals", color: "indigo" },
  { name: "Deliverables", color: "emerald" },
  { name: "Designs", color: "violet" },
  { name: "Contracts", color: "amber" },
];

/**
 * First-run guidance — shown when a manager's workspace has no folders yet.
 * One click on a suggested chip creates the folder and drops them straight in,
 * where the empty-register state takes over for step 2.
 */
export default function WelcomeSetup({
  companyName,
  onCreateFolder,
  onCustomFolder,
}: {
  companyName: string;
  onCreateFolder: (name: string, color: string) => Promise<void>;
  onCustomFolder: () => void;
}) {
  const [creating, setCreating] = useState<string | null>(null);

  async function handleChip(name: string, color: string) {
    if (creating) return;
    setCreating(name);
    await onCreateFolder(name, color);
    setCreating(null);
  }

  return (
    <div className="flex justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute-soft">
          Getting started
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink leading-[1.1] tracking-[-0.02em]">
          Set up <span className="font-display-italic">{companyName}.</span>
        </h2>
        <p className="mt-2 text-sm text-mute leading-relaxed">
          Three small steps and your client has a beautiful link to everything.
        </p>

        <ol className="mt-8 space-y-6">
          {/* Step 1 — active */}
          <li className="flex gap-3">
            <span className="shrink-0 h-7 w-7 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center">
              1
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                <FolderPlus className="h-3.5 w-3.5 text-accent" />
                Create your first folder
              </p>
              <p className="text-xs text-mute mt-0.5">
                A folder is one register — a clean table of deliverables.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => {
                  const colors = FOLDER_COLORS[s.color];
                  return (
                    <button
                      key={s.name}
                      onClick={() => handleChip(s.name, s.color)}
                      disabled={!!creating}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-elevated px-3 py-1.5 text-xs text-ink hover:border-accent hover:bg-accent-soft/40 transition-all disabled:opacity-50"
                    >
                      {creating === s.name ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
                      )}
                      {s.name}
                    </button>
                  );
                })}
                <button
                  onClick={onCustomFolder}
                  disabled={!!creating}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-mute hover:text-ink hover:border-line-strong transition-all disabled:opacity-50"
                >
                  <FolderIcon className="h-3 w-3" />
                  Custom…
                </button>
              </div>
            </div>
          </li>

          {/* Step 2 — upcoming */}
          <li className="flex gap-3 opacity-50">
            <span className="shrink-0 h-7 w-7 rounded-full border border-line text-mute text-xs font-medium flex items-center justify-center">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add your first deliverable
              </p>
              <p className="text-xs text-mute mt-0.5">
                A title and a link is all it takes — details can come later.
              </p>
            </div>
          </li>

          {/* Step 3 — upcoming */}
          <li className="flex gap-3 opacity-50">
            <span className="shrink-0 h-7 w-7 rounded-full border border-line text-mute text-xs font-medium flex items-center justify-center">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                Share with your client
              </p>
              <p className="text-xs text-mute mt-0.5">
                One read-only link. No signup for them, revocable by you.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
