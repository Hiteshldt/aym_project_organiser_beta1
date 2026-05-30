"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";

type Company = { id: string; name: string; slug: string; createdAt: string };
type Member = { id: string; userId: string; userName: string; userEmail: string; role: string };
type User = { id: string; name: string; email: string; role: string };

export default function CompaniesTab() {
  const confirm = useConfirm();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [addMember, setAddMember] = useState<{ userId: string; role: string }>({ userId: "", role: "reader" });

  async function load() {
    const [c, u] = await Promise.all([
      fetch("/api/admin/companies").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]);
    setCompanies(c);
    setUsers(u.filter((u: User) => u.role !== "admin"));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function loadMembers(companyId: string) {
    const res = await fetch(`/api/admin/members?companyId=${companyId}`);
    const data = await res.json();
    setMembers((prev) => ({ ...prev, [companyId]: data }));
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: companyName }),
    });
    setSaving(false);
    setOpen(false);
    setCompanyName("");
    load();
  }

  async function handleDeleteCompany(id: string) {
    const target = companies.find((c) => c.id === id);
    const ok = await confirm({
      title: "Delete this company?",
      body: target
        ? `${target.name} and all its folders, items, and members will be permanently deleted.`
        : "All folders, items, and members will be permanently deleted.",
      confirmLabel: "Delete company",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/companies?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Company deleted.");
      load();
    } else {
      toast.error("Could not delete company.");
    }
  }

  async function handleAddMember(companyId: string) {
    if (!addMember.userId) return;
    await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, ...addMember }),
    });
    setAddMember({ userId: "", role: "reader" });
    loadMembers(companyId);
  }

  async function handleRemoveMember(memberId: string, companyId: string) {
    await fetch(`/api/admin/members?id=${memberId}`, { method: "DELETE" });
    loadMembers(companyId);
  }

  function toggleExpanded(companyId: string) {
    if (expanded === companyId) {
      setExpanded(null);
    } else {
      setExpanded(companyId);
      if (!members[companyId]) loadMembers(companyId);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#888]">{companies.length} compan{companies.length !== 1 ? "ies" : "y"}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="accent">
              <Plus className="h-3.5 w-3.5" /> New company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="px-6 pb-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Company name</Label>
                <Input
                  placeholder="Acme Studio"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="accent" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create company"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-[#ccc]" />
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => (
            <div key={c.id} className="border border-[#ebebeb] rounded-xl bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#111]">{c.name}</p>
                  <p className="text-xs text-[#bbb] mt-0.5">/{c.slug} · {formatDate(c.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(c.id)}
                    className="flex items-center gap-1 text-xs text-[#888] hover:text-[#111] transition-colors"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Members
                    {expanded === c.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteCompany(c.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-[#bbb] hover:text-rose-500" />
                  </Button>
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-[#f0f0f0] px-4 py-4 bg-[#fafafa]">
                  {/* Add member */}
                  <div className="flex gap-2 mb-3">
                    <Select value={addMember.userId} onValueChange={(v) => setAddMember({ ...addMember, userId: v })}>
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue placeholder="Select user…" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={addMember.role} onValueChange={(v) => setAddMember({ ...addMember, role: v })}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="reader">Reader</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleAddMember(c.id)}>
                      Add
                    </Button>
                  </div>

                  {/* Member list */}
                  {members[c.id]?.length === 0 && (
                    <p className="text-xs text-[#bbb] py-2">No members yet.</p>
                  )}
                  {(members[c.id] || []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-[#f0f0f0] last:border-0">
                      <div>
                        <p className="text-xs font-medium text-[#111]">{m.userName}</p>
                        <p className="text-xs text-[#bbb]">{m.userEmail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.role === "manager" ? "amber" : "default"}>{m.role}</Badge>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveMember(m.id, c.id)}>
                          <Trash2 className="h-3 w-3 text-[#bbb] hover:text-rose-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {companies.length === 0 && (
            <div className="text-center py-12 text-sm text-[#bbb]">No companies yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
