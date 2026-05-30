"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UsersTab from "./UsersTab";
import CompaniesTab from "./CompaniesTab";
import { LogOut, Users, Building2 } from "lucide-react";
import { signOut } from "next-auth/react";

type Tab = "users" | "companies";

export default function AdminShell({ user }: { user: { name: string; email: string } }) {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top bar */}
      <div className="border-b border-[#ebebeb] bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-[#111]">Ayuvam</span>
          <span className="text-xs text-[#bbb]">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-xs text-[#888] hover:text-[#111] transition-colors"
            title="Account settings"
          >
            {user.name}
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#111]">Admin panel</h1>
          <p className="text-xs text-[#888] mt-1">Manage users, companies, and memberships.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#ebebeb]">
          {(["users", "companies"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 pb-3 text-sm capitalize transition-colors ${
                tab === t
                  ? "text-[#111] border-b-2 border-[#111] font-medium -mb-px"
                  : "text-[#888] hover:text-[#555]"
              }`}
            >
              {t === "users" ? <Users className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
        </div>

        {tab === "users" && <UsersTab />}
        {tab === "companies" && <CompaniesTab />}
      </div>
    </div>
  );
}
