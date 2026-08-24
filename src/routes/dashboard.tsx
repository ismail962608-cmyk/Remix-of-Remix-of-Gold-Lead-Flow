import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  useGoldFlow, slaStatus, isOverdue, leadHealth, riskLevel,
} from "@/lib/goldflow/store";
import { STAGES } from "@/lib/goldflow/types";
import { AGE_BUCKETS, ageBucket, inrShort } from "@/lib/goldflow/format";
import { PageHeader } from "@/components/goldflow/AppShell";
import { ActionRequired } from "@/components/goldflow/ActionRequired";
import { Pill } from "@/components/goldflow/badges";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "LeadIQ Dashboard — Lead Closure Engine" },
      { name: "description", content: "Live view of new, uncontacted, overdue and escalated gold loan leads with SLA health and revenue at risk." },
      { property: "og:title", content: "LeadIQ Dashboard — Lead Closure Engine" },
      { property: "og:description", content: "What is happening to our leads today: SLA health, urgent actions and revenue at risk." },
    ],
  }),
  component: Dashboard,
});

function Kpi({
  label, value, sub, to, search, tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  to: string;
  search?: Record<string, string>;
  tone?: "hot" | "danger" | "success" | "warning";
}) {
  const accent =
    tone === "hot" ? "text-hot" : tone === "danger" ? "text-destructive" : tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <Link
      to={to}
      search={search as never}
      className="group rounded-lg border border-border bg-card px-4 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-gold"
    >
      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</div>
      <div className={cn("num mt-1 text-2xl font-extrabold", accent)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </Link>
  );
}

function Dashboard() {
  const { visibleLeads, rules, now, escalations, currentUser } = useGoldFlow();

  const m = useMemo(() => {
    const active = visibleLeads.filter((l) => l.status === "Active");
    const escalatedIds = new Set(escalations.filter((e) => e.status === "Open").map((e) => e.leadId));
    const converted = visibleLeads.filter((l) => l.status === "Converted");
    const closed = visibleLeads.filter((l) => l.status !== "Active");
    const atRiskLeads = active.filter((l) => riskLevel(l, rules, now) !== "Low");
    return {
      total: visibleLeads.length,
      newLeads: visibleLeads.filter((l) => l.createdAt > now - 24 * 3600_000).length,
      uncontacted: active.filter((l) => !l.lastContactAt).length,
      dueToday: active.filter(
        (l) => l.nextActionDueAt && new Date(l.nextActionDueAt).toDateString() === new Date(now).toDateString() && l.nextActionDueAt >= now,
      ).length,
      overdue: active.filter((l) => isOverdue(l, now)).length,
      hot: active.filter((l) => l.temperature === "Hot").length,
      escalated: active.filter((l) => escalatedIds.has(l.id)).length,
      converted: converted.length,
      closureRate: closed.length ? Math.round((converted.length / closed.length) * 100) : 0,
      health: {
        Healthy: active.filter((l) => leadHealth(l, rules, now) === "Healthy").length,
        "At Risk": active.filter((l) => leadHealth(l, rules, now) === "At Risk").length,
        "SLA Breached": active.filter((l) => leadHealth(l, rules, now) === "SLA Breached").length,
      },
      funnel: STAGES.map((s) => ({
        stage: s,
        count: visibleLeads.filter((l) => l.stage === s).length,
      })),
      lost: visibleLeads.filter((l) => l.status === "Lost").length,
      ageing: AGE_BUCKETS.map((b) => ({ bucket: b, count: active.filter((l) => ageBucket(l.createdAt, now) === b).length })),
      revenueAtRisk: atRiskLeads.reduce((s, l) => s + l.value, 0),
      highRisk: active.filter((l) => riskLevel(l, rules, now) === "High").length,
      mediumRisk: active.filter((l) => riskLevel(l, rules, now) === "Medium").length,
    };
  }, [visibleLeads, rules, now, escalations]);

  const totalHealth = Math.max(1, m.health.Healthy + m.health["At Risk"] + m.health["SLA Breached"]);
  const maxFunnel = Math.max(1, ...m.funnel.map((f) => f.count));
  const maxAge = Math.max(1, ...m.ageing.map((a) => a.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${currentUser.role === "Super Admin" ? "Enterprise" : currentUser.role === "Sales Executive" ? "My" : currentUser.branch ?? currentUser.area ?? currentUser.zone} lead health`}
        subtitle="What is happening to our leads today · NO LEAD LEFT BEHIND"
        actions={<Pill tone="gold">DEMO ENVIRONMENT — FICTIONAL DATA</Pill>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Kpi label="New Leads" value={m.newLeads} sub="last 24 hours" to="/leads" search={{ filter: "new" }} />
        <Kpi label="Uncontacted" value={m.uncontacted} sub="no first contact" to="/leads" search={{ filter: "uncontacted" }} tone="warning" />
        <Kpi label="Follow-ups Due" value={m.dueToday} sub="due today" to="/actions/today" />
        <Kpi label="Overdue" value={m.overdue} sub="action missed" to="/actions/overdue" tone="danger" />
        <Kpi label="Hot Leads" value={m.hot} sub="high intent" to="/leads" search={{ filter: "hot" }} tone="hot" />
        <Kpi label="Escalated" value={m.escalated} sub="needs manager" to="/escalations" tone="danger" />
        <Kpi label="Converted" value={m.converted} sub="closed won" to="/leads" search={{ filter: "converted" }} tone="success" />
        <Kpi label="Closure Rate" value={`${m.closureRate}%`} sub={`${m.lost} lost`} to="/reports/closure" tone="success" />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-widest uppercase">Action Required</h2>
          <Link to="/leads" className="text-xs text-primary hover:underline">View all leads →</Link>
        </div>
        <ActionRequired leads={visibleLeads} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold tracking-widest uppercase">Lead Health</h3>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full">
            <div className="bg-success" style={{ width: `${(m.health.Healthy / totalHealth) * 100}%` }} />
            <div className="bg-warning" style={{ width: `${(m.health["At Risk"] / totalHealth) * 100}%` }} />
            <div className="bg-destructive" style={{ width: `${(m.health["SLA Breached"] / totalHealth) * 100}%` }} />
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            {([["Healthy", "success"], ["At Risk", "warning"], ["SLA Breached", "danger"]] as const).map(([k, tone]) => (
              <Link
                key={k}
                to="/leads"
                search={{ filter: k === "Healthy" ? "healthy" : k === "At Risk" ? "at-risk" : "breached" } as never}
                className="flex items-center justify-between rounded px-1 py-1 hover:bg-muted"
              >
                <Pill tone={tone}>{k}</Pill>
                <span className="num font-semibold">{m.health[k as keyof typeof m.health]}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold tracking-widest uppercase">Lead Funnel</h3>
          <div className="mt-3 space-y-1.5">
            {m.funnel.map((f) => (
              <Link
                key={f.stage}
                to="/leads"
                search={{ filter: `stage:${f.stage}` } as never}
                className="flex items-center gap-2 text-xs hover:opacity-80"
              >
                <span className="w-20 shrink-0 text-muted-foreground">{f.stage}</span>
                <span className="h-4 rounded-sm bg-primary/85" style={{ width: `${Math.max(4, (f.count / maxFunnel) * 100)}%` }} />
                <span className="num font-semibold">{f.count}</span>
              </Link>
            ))}
            <Link to="/leads" search={{ filter: "stage:Lost" } as never} className="flex items-center gap-2 pt-1 text-xs hover:opacity-80">
              <span className="w-20 shrink-0 text-muted-foreground">Lost</span>
              <span className="h-4 rounded-sm bg-destructive/70" style={{ width: `${Math.max(4, (m.lost / maxFunnel) * 100)}%` }} />
              <span className="num font-semibold">{m.lost}</span>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold tracking-widest uppercase">Lead Ageing</h3>
          <div className="mt-3 space-y-1.5">
            {m.ageing.map((a) => (
              <Link
                key={a.bucket}
                to="/leads"
                search={{ filter: "active", age: a.bucket } as never}
                className="flex items-center gap-2 text-xs hover:opacity-80"
              >
                <span className="w-20 shrink-0 text-muted-foreground">{a.bucket}</span>
                <span className="h-4 rounded-sm bg-gold" style={{ width: `${Math.max(4, (a.count / maxAge) * 100)}%` }} />
                <span className="num font-semibold">{a.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          to="/leads"
          search={{ filter: "at-risk" } as never}
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 shadow-card transition-transform hover:-translate-y-0.5"
        >
          <h3 className="text-xs font-bold tracking-widest text-destructive uppercase">Revenue at Risk</h3>
          <div className="num mt-1 text-3xl font-extrabold text-destructive">{inrShort(m.revenueAtRisk)}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Estimated value of active leads at risk from no contact, SLA breach, missed follow-up or long inactivity (demo values).
          </p>
        </Link>
        <Link to="/leads" search={{ filter: "risk-high" } as never} className="rounded-lg border border-border bg-card p-4 shadow-card hover:border-destructive">
          <h3 className="text-xs font-bold tracking-widest uppercase">High Risk Leads</h3>
          <div className="num mt-1 text-3xl font-extrabold text-destructive">{m.highRisk}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Breached SLA or repeatedly missed follow-ups.</p>
        </Link>
        <Link to="/leads" search={{ filter: "risk-medium" } as never} className="rounded-lg border border-border bg-card p-4 shadow-card hover:border-warning">
          <h3 className="text-xs font-bold tracking-widest uppercase">Medium Risk Leads</h3>
          <div className="num mt-1 text-3xl font-extrabold text-warning">{m.mediumRisk}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Slipping — act before they breach.</p>
        </Link>
      </div>
    </div>
  );
}
