import Link from "next/link";
import { ArrowUpRight, MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-mute">
          404
        </p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-ink leading-[1.02] tracking-[-0.02em]">
          Couldn&apos;t find <span className="font-display-italic">that.</span>
        </h1>
        <p className="mt-5 text-mute text-base leading-relaxed">
          The page you&apos;re after has moved, been deleted, or never existed.
          Either way — nothing&apos;s here.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="btn-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Take me home
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/workspace"
            className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <MoveLeft className="h-3.5 w-3.5" />
            Back to workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
