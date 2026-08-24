import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGoldFlow } from "@/lib/goldflow/store";
import { BRANCHES, ZONES } from "@/lib/goldflow/demo-data";
import type { Role } from "@/lib/goldflow/types";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Pill } from "@/components/goldflow/badges";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Hierarchy — LeadIQ Admin" },
      { name: "description", content: "Super Admin, Zonal, Area and Branch Managers and Sales Executives mapped to zones, areas and branches." },
      { property: "og:title", content: "Users & Hierarchy — LeadIQ Admin" },
      { property: "og:description", content: "Manage the five-level Manappuram Gold lead hierarchy." },
    ],
  }),
  component: UsersAdmin,
});

const ROLES: Role[] = ["Super Admin", "Zonal Manager", "Area Manager", "Branch Manager", "Sales Executive"];

function UsersAdmin() {
  const { users, visibleLeads } = useGoldFlow();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "All">("All");

  const rows = users.filter(
    (u) =>
      (role === "All" || u.role === role) &&
      `${u.name} ${u.branch ?? ""} ${u.area ?? ""} ${u.zone ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Users & Hierarchy" subtitle="Super Admin → Zonal Manager → Area Manager → Branch Manager → Sales Executive" />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Zones</div>
          <div className="num mt-1 text-2xl font-extrabold">{ZONES.length}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{ZONES.join(" · ")}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Areas</div>
          <div className="num mt-1 text-2xl font-extrabold">{new Set(BRANCHES.map((b) => b.area)).size}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{[...new Set(BRANCHES.map((b) => b.area))].join(" · ")}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Branches</div>
          <div className="num mt-1 text-2xl font-extrabold">{BRANCHES.length}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{users.filter((u) => u.role === "Sales Executive").length} sales executives</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" className="h-8 w-56 text-xs" />
        {(["All", ...ROLES] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r as Role | "All")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              role === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-[10px] tracking-wide text-muted-foreground uppercase">
            <tr>
              {["User", "Role", "Zone", "Area", "Branch", "Phone", "Active Leads"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2 font-semibold whitespace-nowrap">{u.name}</td>
                <td className="px-3 py-2"><Pill tone={u.role === "Sales Executive" ? "info" : "gold"}>{u.role}</Pill></td>
                <td className="px-3 py-2 whitespace-nowrap">{u.zone ?? "All"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{u.area ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{u.branch ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{u.phone}</td>
                <td className="num px-3 py-2">
                  {u.role === "Sales Executive"
                    ? visibleLeads.filter((l) => l.executiveId === u.id && l.status === "Active").length
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
