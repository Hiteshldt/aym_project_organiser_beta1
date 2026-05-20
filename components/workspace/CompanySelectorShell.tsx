"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Company = { id: string; name: string; slug: string; role: string };

export default function CompanySelectorShell({
  companies,
  user,
}: {
  companies: Company[];
  user: { name: string; email: string };
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <div className="border-b border-[#ebebeb] bg-white px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#111]">Ayuvam</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888]">{user.name}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <p className="text-sm font-medium text-[#111] mb-4">Choose a workspace</p>
          <div className="space-y-2">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/workspace/${c.slug}`}
                className="flex items-center justify-between p-4 rounded-xl border border-[#ebebeb] bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Building2 className="h-4 w-4 text-[#888] group-hover:text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-[#111]">{c.name}</span>
                </div>
                <Badge variant={c.role === "manager" ? "amber" : "default"}>{c.role}</Badge>
              </Link>
            ))}
            {companies.length === 0 && (
              <p className="text-sm text-[#bbb] text-center py-8">
                You haven&apos;t been added to any workspace yet. Contact your admin.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
