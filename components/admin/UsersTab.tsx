"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reader" });
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
    if (!confirm("Remove this user? This cannot be undone.")) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#888]">{users.length} user{users.length !== 1 ? "s" : ""}</p>
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
                  placeholder="Hitesh Gupta"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="hitesh@carbelim.com"
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="reader">Reader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <Button type="submit" className="w-full" variant="accent" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create user"}
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
        <div className="border border-[#ebebeb] rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ebebeb]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888]">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888]">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888]">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888]">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium text-[#111]">{u.name}</td>
                  <td className="px-4 py-3 text-[#666]">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === "admin" ? "accent" : u.role === "manager" ? "amber" : "default"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#888] text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.role !== "admin" && (
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-[#bbb] hover:text-rose-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[#bbb]">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
