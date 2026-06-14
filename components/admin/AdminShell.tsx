"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LogOut,
  LayoutDashboard,
  Users,
  CreditCard,
  Building2,
} from "lucide-react";
import { ThemeController, ThemeToggle } from "@/components/theme";
import OverviewTab from "./OverviewTab";
import UsersTab from "./UsersTab";
import SubscriptionsTab from "./SubscriptionsTab";
import CompaniesTab from "./CompaniesTab";

export type AdminTab = "overview" | "users" | "subscriptions" | "companies";

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "companies", label: "Workspaces", icon: Building2 },
];

export default function AdminShell({
  user,
}: {
  user: { name: string; email: string };
}) {
  const [tab, setTab] = useState<AdminTab>("overview");

  return (
    <ThemeController>
      <div className="min-h-screen bg-grain text-ink">
        {/* Top bar */}
        <header className="border-b border-line bg-paper-elevated/60 nav-blur">
          <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="font-display-italic text-xl text-ink leading-none"
              >
                Ayuvam
              </Link>
              <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-mute-soft border border-line rounded-full px-2 py-0.5">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/settings"
                className="text-xs text-mute hover:text-ink transition-colors"
                title="Account settings"
              >
                {user.name}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-mute-soft hover:text-ink transition-colors p-1.5"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
          <header>
            <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-mute">
              Control room
            </p>
            <h1 className="mt-1.5 font-display text-3xl md:text-4xl text-ink leading-[1.05] tracking-[-0.02em]">
              Admin
            </h1>
          </header>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-line">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 pb-3 text-sm transition-colors ${
                    active
                      ? "text-ink border-b-2 border-accent font-medium -mb-px"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "overview" && <OverviewTab onJump={setTab} />}
          {tab === "users" && <UsersTab />}
          {tab === "subscriptions" && <SubscriptionsTab />}
          {tab === "companies" && <CompaniesTab />}
        </main>
      </div>
    </ThemeController>
  );
}
