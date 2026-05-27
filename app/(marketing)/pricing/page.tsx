import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Minus } from "lucide-react";
import Pricing from "@/components/marketing/Pricing";
import FAQ from "@/components/marketing/FAQ";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, honest pricing for Ayuvam. Free for one client. $12 for freelancers. $29 for studios. $79 for agencies.",
};

const COMPARISON = [
  {
    section: "Workspaces & content",
    rows: [
      { label: "Client workspaces", free: "1", solo: "5", studio: "Unlimited", agency: "Unlimited" },
      { label: "Items per workspace", free: "25 total", solo: "Unlimited", studio: "Unlimited", agency: "Unlimited" },
      { label: "Folders per workspace", free: "Unlimited", solo: "Unlimited", studio: "Unlimited", agency: "Unlimited" },
      { label: "File storage", free: "100 MB", solo: "2 GB", studio: "10 GB", agency: "50 GB" },
      { label: "File upload size limit", free: "20 MB", solo: "20 MB", studio: "20 MB", agency: "20 MB" },
    ],
  },
  {
    section: "Sharing & access",
    rows: [
      { label: "Magic link client access", free: true, solo: true, studio: true, agency: true },
      { label: "Email invites (Ayuvam-branded)", free: true, solo: true, studio: true, agency: true },
      { label: "Active share links per workspace", free: "1", solo: "5", studio: "Unlimited", agency: "Unlimited" },
      { label: "Link expiry & revocation", free: true, solo: true, studio: true, agency: true },
      { label: "Last-accessed analytics", free: true, solo: true, studio: true, agency: true },
    ],
  },
  {
    section: "Team",
    rows: [
      { label: "Team members", free: "1", solo: "3", studio: "10", agency: "Unlimited" },
      { label: "Reader role (view-only collaborators)", free: false, solo: true, studio: true, agency: true },
      { label: "Manager role (full editing)", free: true, solo: true, studio: true, agency: true },
    ],
  },
  {
    section: "Brand",
    rows: [
      { label: "Custom subdomain (you.ayuvam.com)", free: false, solo: false, studio: false, agency: true },
      { label: "Remove \"Powered by Ayuvam\" footer", free: false, solo: false, studio: false, agency: true },
    ],
  },
  {
    section: "Support",
    rows: [
      { label: "Community support", free: true, solo: true, studio: true, agency: true },
      { label: "Email support", free: false, solo: true, studio: true, agency: true },
      { label: "Priority email support", free: false, solo: false, studio: true, agency: true },
      { label: "Onboarding session", free: false, solo: false, studio: false, agency: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero — short, focused */}
      <section className="mx-auto max-w-4xl px-6 pt-20 md:pt-28 pb-8 text-center">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-mute">
          Pricing
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl text-ink leading-[1.02] tracking-[-0.02em]">
          Honest pricing. <span className="font-display-italic">No surprises.</span>
        </h1>
        <p className="mt-5 mx-auto max-w-xl text-mute text-base md:text-lg leading-relaxed">
          Free while you set up. Pay only when you bring on real clients.
          Cancel or downgrade any time.
        </p>
      </section>

      {/* Plan cards — reuse Pricing component */}
      <Pricing />

      {/* Comparison table */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <header className="text-center max-w-2xl mx-auto mb-10">
          <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-mute">
            What's in each plan
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink leading-[1.1] tracking-[-0.02em]">
            Side by side.
          </h2>
        </header>

        <div className="rounded-2xl border border-line bg-paper-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper">
                <th className="text-left py-4 px-5 font-mono-ui text-[11px] uppercase tracking-wider text-mute font-medium">
                  Feature
                </th>
                {(["Free", "Solo", "Studio", "Agency"] as const).map((p) => (
                  <th
                    key={p}
                    className={`text-left py-4 px-5 font-medium ${
                      p === "Studio"
                        ? "text-accent"
                        : "text-ink"
                    }`}
                  >
                    {p}
                    {p === "Studio" && (
                      <span className="block font-mono-ui text-[10px] uppercase tracking-wider text-accent mt-0.5 font-normal">
                        Most popular
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((section) => (
                <>
                  <tr
                    key={section.section}
                    className="border-b border-line/60 bg-paper/40"
                  >
                    <td
                      colSpan={5}
                      className="py-2.5 px-5 font-mono-ui text-[10px] uppercase tracking-[0.15em] text-mute"
                    >
                      {section.section}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-line/60 last:border-0"
                    >
                      <td className="py-3 px-5 text-ink">{row.label}</td>
                      <Cell value={row.free} />
                      <Cell value={row.solo} />
                      <Cell value={row.studio} accent />
                      <Cell value={row.agency} />
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ — reuse */}
      <FAQ />

      {/* Final nudge */}
      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-ink leading-[1.1] tracking-[-0.02em]">
          Try it free. <span className="font-display-italic">No card.</span>
        </h2>
        <p className="mt-4 text-mute">
          Set up your first workspace in under a minute.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex items-center gap-2 btn-accent rounded-full px-6 py-3 text-sm font-medium"
        >
          Start free
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}

function Cell({
  value,
  accent,
}: {
  value: boolean | string;
  accent?: boolean;
}) {
  const className = `py-3 px-5 text-sm ${
    accent ? "bg-accent-soft/30" : ""
  }`;

  if (typeof value === "boolean") {
    return (
      <td className={className}>
        {value ? (
          <Check className="h-4 w-4 text-accent" />
        ) : (
          <Minus className="h-3.5 w-3.5 text-mute-soft" />
        )}
      </td>
    );
  }
  return (
    <td className={className}>
      <span className="text-ink">{value}</span>
    </td>
  );
}
