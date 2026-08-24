import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, ListChecks, KanbanSquare, CalendarClock, AlertTriangle,
  ShieldAlert, Building2, UserCheck, FileBarChart, Timer, Settings2, Bell, ChevronDown, Gauge,
  SlidersHorizontal,
} from "lucide-react";
import { useGoldFlow } from "@/lib/goldflow/store";
import type { Role } from "@/lib/goldflow/types";
import { cn } from "@/lib/utils";
import { relative } from "@/lib/goldflow/format";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pill } from "./badges";

const ALL: Role[] = ["Super Admin", "Zonal Manager", "Area Manager", "Branch Manager", "Sales Executive"];
const MGMT: Role[] = ["Super Admin", "Zonal Manager", "Area Manager", "Branch Manager"];

const NAV: { section: string; items: { to: string; label: string; icon: typeof Users; roles: Role[] }[] }[] = [
  {
    section: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL }],
  },
  {
    section: "Leads",
    items: [
      { to: "/leads", label: "All Leads", icon: Users, roles: ALL },
      { to: "/my-leads", label: "My Leads", icon: ListChecks, roles: ALL },
      { to: "/pipeline", label: "Lead Pipeline", icon: KanbanSquare, roles: ALL },
    ],
  },
  {
    section: "Actions",
    items: [
      { to: "/actions/today", label: "Today's Actions", icon: CalendarClock, roles: ALL },
      { to: "/actions/overdue", label: "Overdue Leads", icon: AlertTriangle, roles: ALL },
    ],
  },
  {
    section: "Escalation",
    items: [{ to: "/escalations", label: "Escalation Centre", icon: ShieldAlert, roles: ALL }],
  },
  {
    section: "Performance",
    items: [
      { to: "/performance/branch", label: "Branch Performance", icon: Building2, roles: MGMT },
      { to: "/performance/executive", label: "Executive Performance", icon: UserCheck, roles: MGMT },
    ],
  },
  {
    section: "Reports",
    items: [
      { to: "/reports/closure", label: "Lead Closure Report", icon: FileBarChart, roles: MGMT },
      { to: "/reports/sla", label: "SLA Report", icon: Timer, roles: MGMT },
    ],
  },
  {
    section: "Admin",
    items: [
      { to: "/admin/users", label: "Users & Hierarchy", icon: Users, roles: ["Super Admin"] },
      { to: "/admin/lead-rules", label: "Lead Rules", icon: Settings2, roles: ["Super Admin"] },
      { to: "/admin/sla-rules", label: "SLA & Escalation Rules", icon: Gauge, roles: ["Super Admin"] },
      { to: "/admin/settings", label: "Settings", icon: SlidersHorizontal, roles: ["Super Admin"] },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, setCurrentUser, users, notifications, markNotificationsRead, now, ready } = useGoldFlow();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  const personas = [
    users.find((u) => u.role === "Super Admin")!,
    users.find((u) => u.role === "Zonal Manager")!,
    users.find((u) => u.role === "Area Manager")!,
    users.find((u) => u.role === "Branch Manager")!,
    users.find((u) => u.role === "Sales Executive")!,
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gold text-sm font-black text-gold-foreground">L</div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">LeadIQ</div>
            <div className="text-[10px] tracking-wide text-sidebar-foreground/60">MANAPPURAM GOLD</div>
          </div>
        </div>
        <nav className="flex-1 space-y-4 px-3 py-4">
          {NAV.map((group) => {
            const items = group.items.filter((i) => i.roles.includes(currentUser.role));
            if (!items.length) return null;
            return (
              <div key={group.section}>
                <div className="px-2 pb-1 text-[10px] font-bold tracking-widest text-sidebar-foreground/40 uppercase">
                  {group.section}
                </div>
                {items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-white shadow-[inset_2px_0_0_var(--gold)]"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-3 text-[11px] leading-relaxed text-sidebar-foreground/60">
          <span className="font-semibold text-gold">NO LEAD LEFT BEHIND</span>
          <br />
          Demo environment — fictional data
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdropblur lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gold text-xs font-black text-gold-foreground">L</div>
            <span className="text-sm font-bold">LeadIQ</span>
          </div>
          <div className="hidden text-xs text-muted-foreground lg:block">
            Lead Closure &amp; Escalation Engine · powered by Voice Analytics
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu onOpenChange={(o) => o && markNotificationsRead()}>
              <DropdownMenuTrigger className="relative rounded-md p-2 hover:bg-muted">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-88 max-w-[92vw]">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 && (
                  <div className="px-2 py-6 text-center text-xs text-muted-foreground">All clear</div>
                )}
                {notifications.slice(0, 10).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex flex-col items-start gap-0.5"
                    onClick={() => navigate({ to: "/leads/$leadId", params: { leadId: n.leadId } })}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <Pill tone={n.kind === "SLA breach" || n.kind === "Escalation" ? "danger" : "info"}>{n.kind}</Pill>
                      <span className="text-[10px] text-muted-foreground">{relative(n.at, now)}</span>
                    </div>
                    <span className="text-xs whitespace-normal">{n.message}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left hover:bg-muted">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {currentUser.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs leading-tight font-semibold">{currentUser.name}</div>
                  <div className="text-[10px] leading-tight text-muted-foreground">{currentUser.role}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Switch demo persona</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {personas.map((u) => (
                  <DropdownMenuItem key={u.id} onClick={() => setCurrentUser(u)} className="flex flex-col items-start">
                    <span className="text-xs font-semibold">{u.role}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {u.name}
                      {u.branch ? ` · ${u.branch}` : u.area ? ` · ${u.area}` : u.zone ? ` · ${u.zone}` : " · Enterprise"}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 lg:px-6">
          {ready ? children : <div className="py-24 text-center text-sm text-muted-foreground">Loading LeadIQ…</div>}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
