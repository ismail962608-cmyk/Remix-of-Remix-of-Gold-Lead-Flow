import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useGoldFlow, isOverdue } from "@/lib/goldflow/store";
import { PageHeader } from "@/components/goldflow/AppShell";
import { LeadTable } from "@/components/goldflow/LeadTable";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-leads")({
  head: () => ({
    meta: [
      { title: "My Leads — GoldFlow" },
      { name: "description", content: "Your active, hot, follow-up, overdue, converted and lost gold loan leads in one place." },
      { property: "og:title", content: "My Leads — GoldFlow" },
      { property: "og:description", content: "Sales executive view of owned leads and their next actions." },
    ],
  }),
  component: MyLeads,
});

const TABS = ["My Active Leads", "My Hot Leads", "My Follow-ups", "My Overdue Leads", "My Converted Leads", "My Lost Leads"] as const;

function MyLeads() {
  const { visibleLeads, currentUser, now } = useGoldFlow();
  const [tab, setTab] = useState<(typeof TABS)[number]>("My Active Leads");

  const mine = useMemo(() => {
    if (currentUser.role === "Sales Executive") return visibleLeads.filter((l) => l.executiveId === currentUser.id);
    return visibleLeads;
  }, [visibleLeads, currentUser]);

  const counts = {
    "My Active Leads": mine.filter((l) => l.status === "Active"),
    "My Hot Leads": mine.filter((l) => l.status === "Active" && l.temperature === "Hot"),
    "My Follow-ups": mine.filter((l) => l.status === "Active" && l.followUps.some((f) => f.status === "Scheduled")),
    "My Overdue Leads": mine.filter((l) => isOverdue(l, now)),
    "My Converted Leads": mine.filter((l) => l.status === "Converted"),
    "My Lost Leads": mine.filter((l) => l.status === "Lost"),
  };

  return (
    <div>
      <PageHeader
        title="My Leads"
        subtitle={`${currentUser.name} · ${currentUser.role}${currentUser.branch ? ` · ${currentUser.branch}` : ""}`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
            )}
          >
            {t} <span className="num opacity-70">({counts[t].length})</span>
          </button>
        ))}
      </div>
      <LeadTable leads={counts[tab]} />
    </div>
  );
}
