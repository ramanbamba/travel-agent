"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Mail,
  Phone,
  Upload,
  X,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/corporate-dashboard";
import { toast } from "@/hooks/use-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Member = any;

const ROLES = ["employee", "travel_manager", "admin", "approver"];
const SENIORITY_LEVELS = [
  "individual_contributor",
  "manager",
  "senior_manager",
  "director",
  "vp",
  "c_suite",
];

export default function EmployeesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/corp/members");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setMembers(json.data ?? []);
    } catch (err) {
      console.error("Load members error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filtered = members.filter((m: Member) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !m.full_name?.toLowerCase().includes(q) &&
        !m.email?.toLowerCase().includes(q)
      )
        return false;
    }
    if (roleFilter && m.role !== roleFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Employees"
        description={`${members.length} members in your organization`}
        actions={
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Invite Employee
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-300 focus:outline-none"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-300 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees yet"
          message="Invite your first team member to start booking flights through SkySwift."
          hint="You can invite individually or upload a CSV with multiple employees."
          cta={{ label: "Invite Employee", onClick: () => setShowInviteModal(true) }}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Name</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Contact</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Department</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Role</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Seniority</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Bookings</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m: Member) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setEditingMember(m)}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          {(m.full_name ?? "?")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-[#0F1B2D]">{m.full_name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3" /> {m.email}
                        </span>
                        {m.phone && (
                          <span className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3" /> {m.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {m.department ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                        {(m.role ?? "employee").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 capitalize">
                      {(m.seniority_level ?? "IC").replace(/_/g, " ")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center font-medium text-[#0F1B2D]">
                      {m.bookings_count}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={m.status ?? "active"} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMember(m);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false);
            loadMembers();
          }}
        />
      )}

      {/* Edit Slide-over */}
      {editingMember && (
        <EditSlideOver
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={() => {
            setEditingMember(null);
            loadMembers();
          }}
        />
      )}
    </div>
  );
}

// ── Invite Modal ──

function InviteModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    role: "employee",
    seniority_level: "individual_contributor",
  });
  const [saving, setSaving] = useState(false);
  const [csvMode, setCsvMode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/corp/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "Employee invited", description: `${form.full_name} has been invited.` });
      onInvited();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to invite",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    let invited = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => (row[h] = values[idx] ?? ""));

      if (!row.name || !row.email) continue;

      try {
        const res = await fetch("/api/corp/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: row.name,
            email: row.email,
            phone: row.phone || null,
            department: row.department || null,
            role: row.role || "employee",
          }),
        });
        if (res.ok) invited++;
      } catch {
        // Skip failed rows
      }
    }

    toast({ title: "Bulk invite complete", description: `${invited} employees invited.` });
    onInvited();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F1B2D]">Invite Employee</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setCsvMode(false)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              !csvMode ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Single Invite
          </button>
          <button
            onClick={() => setCsvMode(true)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
              csvMode ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Upload className="h-3 w-3" /> CSV Upload
          </button>
        </div>

        {csvMode ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Upload a CSV file with columns: name, email, phone, department, role
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Full Name *</label>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91..."
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Department</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Engineering, Sales..."
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm capitalize focus:border-blue-300 focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Seniority</label>
                <select
                  value={form.seniority_level}
                  onChange={(e) => setForm({ ...form, seniority_level: e.target.value })}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm capitalize focus:border-blue-300 focus:outline-none"
                >
                  {SENIORITY_LEVELS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Edit Slide-over ──

function EditSlideOver({
  member,
  onClose,
  onSaved,
}: {
  member: Member;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: member.full_name ?? "",
    phone: member.phone ?? "",
    department: member.department ?? "",
    role: member.role ?? "employee",
    seniority_level: member.seniority_level ?? "individual_contributor",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/corp/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, ...form }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: "Employee updated" });
      onSaved();
    } catch {
      toast({ title: "Error", description: "Failed to update member", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    setSaving(true);
    try {
      const res = await fetch("/api/corp/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, status: "deactivated" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Employee deactivated" });
      onSaved();
    } catch {
      toast({ title: "Error", description: "Failed to deactivate", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl border-l border-gray-200 overflow-y-auto animate-[slideInRight_0.2s_ease-out]">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#0F1B2D]">Edit Employee</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Full Name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
            <input
              value={member.email}
              disabled
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Department</label>
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm capitalize focus:border-blue-300 focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Seniority</label>
              <select
                value={form.seniority_level}
                onChange={(e) => setForm({ ...form, seniority_level: e.target.value })}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm capitalize focus:border-blue-300 focus:outline-none"
              >
                {SENIORITY_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {member.status !== "deactivated" && (
              <button
                onClick={handleDeactivate}
                disabled={saving}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                Deactivate
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
