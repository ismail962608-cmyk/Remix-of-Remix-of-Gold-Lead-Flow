import { createFileRoute } from "@tanstack/react-router";
import { useGoldFlow, isOverdue } from "@/lib/goldflow/store";
import { PageHeader } from "@/components/goldflow/AppShell";
import { ActionRequired } from "@/components/goldflow/ActionRequired";
import { LeadTable } from "@/components/goldflow/LeadTable";

export const Route = createFileRoute("/actions/overdue")({
  head: () => ({
    meta: [
      { title: "Overdue Leads — GoldFlow" },
      { name: "description", content: "Leads whose expected action was missed, sorted by urgency, with call, WhatsApp, follow-up and escalate actions." },
      { property: "og:title", content: "Overdue Leads — GoldFlow" },
      { property: "og:description", content: "Recover missed actions before leads are lost." },
    ],
  }),
  component: Overdue,
});

function Overdue() {
  const { visibleLeads, now } = useGoldFlow();
  const overdue = visibleLeads.filter((l) => isOverdue(l, now));
  return (
    <div className="space-y-6">
      <PageHeader title="Overdue Leads" subtitle={`${overdue.length} leads missed their expected action`} />
      <ActionRequired leads={overdue} limit={10} />
      <LeadTable leads={overdue} />
    </div>
  );
}
