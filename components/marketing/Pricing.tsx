"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";

type Plan = {
  name: string;
  tag?: string;
  blurb: string;
  monthly: number;
  annual: number;
  features: string[];
  accent?: boolean;
  cta: string;
  href?: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    blurb: "Try Ayuvam with one client.",
    monthly: 0,
    annual: 0,
    features: [
      "1 client workspace",
      "50 items",
      "1 team member",
      "100MB storage",
    ],
    cta: "Start free",
  },
  {
    name: "Solo",
    blurb: "For independent freelancers.",
    monthly: 9,
    annual: 90,
    features: [
      "5 client workspaces",
      "Unlimited items",
      "3 team members",
      "2GB storage",
      "Magic link client access",
    ],
    cta: "Start Solo trial",
  },
  {
    name: "Studio",
    tag: "Most popular",
    blurb: "For studios with a handful of clients.",
    monthly: 19,
    annual: 190,
    accent: true,
    features: [
      "Unlimited workspaces",
      "Unlimited items",
      "10 team members",
      "10GB storage",
      "Tags, search, history",
      "Priority email support",
    ],
    cta: "Start Studio trial",
  },
  {
    name: "Agency",
    blurb: "For growing agencies.",
    monthly: 49,
    annual: 490,
    features: [
      "Everything in Studio",
      "Unlimited team members",
      "50GB storage",
      "Custom subdomain",
      "White label (remove brand)",
    ],
    cta: "Talk to us",
    href: "/contact",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section
      id="pricing"
      className="mx-auto max-w-6xl px-6 border-t border-line py-12 md:py-16 scroll-mt-20"
    >
      <header data-reveal className="max-w-2xl">
        <p className="font-mono-ui text-xs uppercase tracking-[0.2em] text-accent">
          Pricing
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl text-ink leading-[1.05] tracking-[-0.02em]">
          Less than a coffee, <span className="font-display-italic">monthly.</span>
        </h2>
        <p className="mt-4 text-ink-soft">
          Honest pricing. No seats, no surprise fees, no annual lock-in.
        </p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-line bg-paper-elevated p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !annual
                ? "bg-ink text-paper"
                : "text-mute hover:text-ink"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              annual ? "bg-ink text-paper" : "text-mute hover:text-ink"
            }`}
          >
            Annual
            <span
              className={`font-mono-ui text-[10px] tracking-wider rounded px-1.5 py-0.5 ${
                annual ? "bg-accent text-paper" : "bg-accent-soft text-accent"
              }`}
            >
              −17%
            </span>
          </button>
        </div>
      </header>

      <div data-reveal-stagger data-step="80" className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((p) => (
          <PlanCard key={p.name} plan={p} annual={annual} />
        ))}
      </div>

      <p className="mt-10 text-center text-xs font-mono-ui text-mute-soft">
        All plans include unlimited folders, magic-link client access, and
        search that forgives typos.
      </p>
    </section>
  );
}

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.annual / 12 : plan.monthly;
  const billed = annual && plan.annual > 0
    ? `Billed $${plan.annual}/year`
    : plan.monthly > 0
      ? "Billed monthly"
      : "Forever free";

  return (
    <div
      data-spotlight
      className={`relative lit-top rounded-2xl p-7 flex flex-col transition-all ${
        plan.accent
          ? "bg-ink-warm text-paper border border-ink-warm shadow-[0_30px_70px_-32px_rgba(200,75,49,0.5)] lg:-translate-y-3"
          : "bg-paper-elevated border border-line shadow-soft card-lift"
      }`}
    >
      {plan.tag && (
        <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-accent text-paper text-[10px] font-mono-ui tracking-wider uppercase px-2.5 py-1">
          {plan.tag}
        </span>
      )}

      {/* Name */}
      <div className="flex items-baseline justify-between">
        <h3
          className={`font-display text-2xl ${
            plan.accent ? "text-paper" : "text-ink"
          }`}
        >
          {plan.name}
        </h3>
      </div>

      <p
        className={`mt-1 text-sm ${
          plan.accent ? "text-paper/70" : "text-mute"
        }`}
      >
        {plan.blurb}
      </p>

      {/* Price */}
      <div className="mt-6 flex items-baseline gap-1">
        <span
          className={`font-display text-5xl tracking-[-0.02em] ${
            plan.accent ? "text-paper" : "text-ink"
          }`}
        >
          ${price === 0 ? "0" : price.toFixed(price % 1 === 0 ? 0 : 2)}
        </span>
        <span
          className={`text-sm font-mono-ui ${
            plan.accent ? "text-paper/60" : "text-mute"
          }`}
        >
          /mo
        </span>
      </div>
      <p
        className={`mt-1 text-[11px] font-mono-ui ${
          plan.accent ? "text-paper/50" : "text-mute-soft"
        }`}
      >
        {billed}
      </p>

      {/* CTA */}
      <Link
        href={plan.href ?? "/login"}
        className={`mt-7 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
          plan.accent
            ? "bg-paper text-ink hover:bg-paper-elevated"
            : "btn-accent"
        }`}
      >
        {plan.cta}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>

      {/* Features */}
      <ul
        className={`mt-7 space-y-2.5 ${
          plan.accent ? "text-paper/85" : "text-ink"
        }`}
      >
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check
              className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                plan.accent ? "text-accent" : "text-accent"
              }`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
