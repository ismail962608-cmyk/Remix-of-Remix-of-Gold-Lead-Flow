import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useGoldFlow, slaStatus, isOverdue, riskLevel, leadHealth } from "@/lib/goldflow/store";
import { ageBucket } from "@/lib/goldflow/format";
import { PageHeader } from "@/components/goldflow/AppShell";
import { LeadTable } from "@/components/goldflow/LeadTable";

export const Route = createFileRoute("/leads/")({
  validateSearch: (s: Record<string, unknown>): { filter?: string; age?: string } => ({
    ...(typeof s["filter"] === "string" ? { filter: s["filter"] as string } : {}),
    ...(typeof s["age"] === "string" ? { age: s["age"] as string } : {}),
  }),


  head: () => ({
    meta: [
      { title: "All Leads — GoldFlow" },
      { name: "description", content: "Every gold loan lead detected by Voice Analytics with owner, stage, next action, due time and SLA state." },
      { property: "og:title", content: "All Leads — GoldFlow" },
      { property: "og:description", content: "Filter leads by zone, area, branch, executive, temperature, stage and SLA." },
    ],
  }),
  component: AllLeads,
});

const LABELS: Record<string, string> = {
  new: "New leads (last 24h)",
  uncontacted: "Uncontacted leads",
  hot: "Hot leads",
  converted: "Converted leads",
  "at-risk": "At-risk leads",
  breached: "SLA breached leads",
  healthy: "Healthy leads",
  "risk-high": "High risk leads",
  "risk-medium": "Medium risk leads",
  overdue: "Overdue leads",
  escalated: "Escalated leads",
  active: "Active leads",
};

function AllLeads() {
  const { filter, age } = Route.useSearch();
  const { visibleLeads, rules, now, escalations } = useGoldFlow();

  const leads = useMemo(() => {
    const escalated = new Set(escalations.filter((e) => e.status === "Open").map((e) => e.leadId));
    return visibleLeads.filter((l) => {
      if (age && ageBucket(l.createdAt, now) !== age) return false;
      if (!filter) return true;
      if (filter.startsWith("stage:")) return l.stage === filter.slice(6);
      switch (filter) {
        case "new": return l.createdAt > now - 24 * 3600_000;
        case "uncontacted": return l.status === "Active" && !l.lastContactAt;
        case "hot": return l.status === "Active" && l.temperature === "Hot";
        case "converted": return l.status === "Converted";
        case "overdue": return isOverdue(l, now);
        case "escalated": return escalated.has(l.id);
        case "active": return l.status === "Active";
        case "at-risk": return l.status === "Active" && riskLevel(l, rules, now) !== "Low";
        case "risk-high": return l.status === "Active" && riskLevel(l, rules, now) === "High";
        case "risk-medium": return l.status === "Active" && riskLevel(l, rules, now) === "Medium";
        case "breached": return l.status === "Active" && slaStatus(l, rules, now) === "Breached";
        case "healthy": return l.status === "Active" && leadHealth(l, rules, now) === "Healthy";
        default: return true;
      }
    });
  }, [visibleLeads, filter, age, now, rules, escalations]);

  const label = filter?.startsWith("stage:")
    ? `${filter.slice(6)} stage`
    : (filter && LABELS[filter]) || "All leads";

  return (
    <div>
      <PageHeader
        title="All Leads"
        subtitle={`${label}${age ? ` · ageing ${age}` : ""} · every lead sourced from Voice Analytics`}
      />
      <LeadTable leads={leads} />
    </div>
  );
}
