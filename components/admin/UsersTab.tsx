"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "sonner";
import { PLAN_ORDER, type PlanTier } from "@/lib/billing/plans";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  tier: PlanTier;
  comped: boolean;
  workspaceCount: number;
  itemCount: number;
};

export default function UsersTab() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reader" });
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create user");
      return;
    }
    setOpen(false);
    setForm({ name: "", email: "", password: "", role: "reader" });
    load();
  }

  async function handleDelete(id: string) {
    const target = users.find((u) => u.id === id);
    const ok = await confirm({
      title: "Remove this user?",
      body: target
        ? `${target.email} will lose access to all workspaces. This cannot be undone.`
        : "This cannot be undone.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("User removed.");
      load();
    } else {
      toast.error("Could not remove user.");
    }
  }

  async function setPlan(user: User, tier: PlanTier) {
    if (tier === user.tier) return;
    const res = await fetch("/api/admin/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, tier }),
    });
    if (res.ok) {
      toast.success(`${user.name} set to ${tier}.`);
      // Optimistic local update.
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, tier, comped: tier !== "free" } : u))
      );
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not change plan.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mute-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-lg border border-line bg-paper pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
        <p className="text-xs text-mute-soft ml-auto">
          {filtered.length} of {users.length}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="accent">
              <Plus className="h-3.5 w-3.5" /> New user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="px-6 pb-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  placeholder="Jordan Lee"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="name@studio.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Strong password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="reader">Reader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button type="submit" className="w-full" variant="accent" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create user"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-mute-soft" />
        </div>
      ) : (
        <div className="border border-line rounded-2xl overflow-hidden bg-paper-elevated">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Plan</Th>
                <Th className="text-right">Workspaces</Th>
                <Th className="text-right">Items</Th>
                <Th>Joined</Th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-line/60 last:border-0 hover:bg-paper/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{u.name}</p>
                    <p className="text-xs text-mute-soft font-mono-ui">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        u.role === "admin" ? "accent" : u.role === "manager" ? "amber" : "default"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="text-xs text-mute-soft">—</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Select value={u.tier} onValueChange={(v) => setPlan(u, v as PlanTier)}>
                          <SelectTrigger className="h-7 w-[104px] text-xs capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLAN_ORDER.map((t) => (
                              <SelectItem key={t} value={t} className="capitalize">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {u.comped && (
                          <span
                            title="Manually granted (not a Paddle subscription)"
                            className="font-mono-ui text-[9px] uppercase tracking-wider text-mute-soft border border-line rounded px-1 py-0.5"
                          >
                            comp
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-mute tabular-nums">{u.workspaceCount}</td>
                  <td className="px-4 py-3 text-right text-mute tabular-nums">{u.itemCount}</td>
                  <td className="px-4 py-3 text-mute-soft text-xs whitespace-nowrap">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-mute-soft hover:text-danger transition-colors p-1"
                        title="Remove user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-mute-soft">
                    {query ? "No users match that search." : "No users yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 font-mono-ui text-[10px] uppercase tracking-wider text-mute font-medium ${className}`}
    >
      {children}
    </th>
  );
}
