/* ────────────────────────────────────────────────────────────────
   Plan catalog — the single source of truth for what each tier grants.

   Subscriptions belong to a USER (the studio owner / account). The plan
   governs how many client workspaces they can own, team size per
   workspace, storage, and white-label perks. There is no separate
   "organization" entity, so the account === the user.

   Paddle price IDs differ per environment and live only in env vars
   (they aren't secret — Paddle.js needs them client-side to open
   checkout — so they're NEXT_PUBLIC).
   ──────────────────────────────────────────────────────────────── */

export type PlanTier = "free" | "solo" | "studio" | "agency";
export type BillingCycle = "monthly" | "annual";

export type Entitlements = {
  /** -1 means unlimited. */
  maxWorkspaces: number;
  maxMembersPerWorkspace: number;
  storageMb: number;
  whiteLabel: boolean;
  customSubdomain: boolean;
};

export const PLAN_ORDER: PlanTier[] = ["free", "solo", "studio", "agency"];
export const FREE_PLAN: PlanTier = "free";

export const PLANS: Record<
  PlanTier,
  { name: string; blurb: string; entitlements: Entitlements }
> = {
  free: {
    name: "Free",
    blurb: "One client workspace to try it out.",
    entitlements: {
      maxWorkspaces: 1,
      maxMembersPerWorkspace: 1,
      storageMb: 100,
      whiteLabel: false,
      customSubdomain: false,
    },
  },
  solo: {
    name: "Solo",
    blurb: "For independent freelancers.",
    entitlements: {
      maxWorkspaces: 5,
      maxMembersPerWorkspace: 3,
      storageMb: 2048,
      whiteLabel: false,
      customSubdomain: false,
    },
  },
  studio: {
    name: "Studio",
    blurb: "For studios with a handful of clients.",
    entitlements: {
      maxWorkspaces: -1,
      maxMembersPerWorkspace: 10,
      storageMb: 10240,
      whiteLabel: false,
      customSubdomain: false,
    },
  },
  agency: {
    name: "Agency",
    blurb: "For growing agencies.",
    entitlements: {
      maxWorkspaces: -1,
      maxMembersPerWorkspace: -1,
      storageMb: 51200,
      whiteLabel: true,
      customSubdomain: true,
    },
  },
};

/** priceId → plan tier, read per cycle. Empty string for unset env. */
type CyclePrices = { monthly: string; annual: string };

export function priceMap(): Record<Exclude<PlanTier, "free">, CyclePrices> {
  return {
    solo: {
      monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_SOLO_MONTHLY ?? "",
      annual: process.env.NEXT_PUBLIC_PADDLE_PRICE_SOLO_ANNUAL ?? "",
    },
    studio: {
      monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STUDIO_MONTHLY ?? "",
      annual: process.env.NEXT_PUBLIC_PADDLE_PRICE_STUDIO_ANNUAL ?? "",
    },
    agency: {
      monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_MONTHLY ?? "",
      annual: process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_ANNUAL ?? "",
    },
  };
}

/** Reverse lookup used by the webhook to derive a tier from a Paddle price. */
export function tierForPriceId(priceId: string | null | undefined): PlanTier {
  if (!priceId) return "free";
  const map = priceMap();
  for (const tier of ["solo", "studio", "agency"] as const) {
    if (map[tier].monthly === priceId || map[tier].annual === priceId) {
      return tier;
    }
  }
  return "free";
}

export function priceIdFor(tier: PlanTier, cycle: BillingCycle): string | null {
  if (tier === "free") return null;
  const id = priceMap()[tier][cycle];
  return id || null;
}
