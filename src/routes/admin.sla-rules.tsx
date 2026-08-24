import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useGoldFlow } from "@/lib/goldflow/store";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill } from "@/components/goldflow/badges";

export const Route = createFileRoute("/admin/sla-rules")({
  head: () => ({
    meta: [
      { title: "SLA & Escalation Rules — LeadIQ Admin" },
      { name: "description", content: "Configure hot, warm and cold first-contact SLAs plus the six escalation rules and their hierarchy." },
      { property: "og:title", content: "SLA & Escalation Rules — LeadIQ Admin" },
      { property: "og:description", content: "Decide how fast leads must be contacted and who gets escalated to." },
    ],
  }),
  component: SlaRules,
});

function SlaRules() {
  const { rules, setRules, escalations } = useGoldFlow();
  const [draft, setDraft] = useState(rules);

  const ruleList = [
    { id: "R1", text: `Lead unassigned beyond ${draft.unassignedSlaMin} minutes`, to: "Branch Manager" },
    { id: "R2", text: "First-contact SLA breached", to: "Branch Manager" },
    { id: "R3", text: "Hot lead untouched for 1 hour", to: "Branch Manager" },
    { id: "R4", text: "Follow-up missed twice", to: "Branch Manager" },
    { id: "R5", text: `Lead overdue for more than ${draft.areaEscalationHours} hours`, to: "Area Manager" },
    { id: "R6", text: `Lead overdue for more than ${draft.zonalEscalationHours} hours`, to: "Zonal Manager" },
  ];

  const num = (k: keyof typeof draft, label: string) => (
    <div key={k as string}>
      <Label className="mb-1 block text-xs">{label}</Label>
      <Input type="number" value={draft[k] as number} onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })} />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="SLA & Escalation Rules"
        subtitle="Escalation ensures leads are never forgotten"
        actions={<Button size="sm" onClick={() => { setRules(draft); toast.success("SLA & escalation rules saved"); }}>Save rules</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-xs font-bold tracking-widest uppercase">First contact SLA (minutes)</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {num("slaHotMin", "Hot")}
            {num("slaWarmMin", "Warm")}
            {num("slaColdMin", "Cold")}
          </div>
          <h2 className="pt-2 text-xs font-bold tracking-widest uppercase">Follow-up & assignment</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {num("followUpSlaMin", "Follow-up SLA (minutes)")}
            {num("unassignedSlaMin", "Unassigned SLA (minutes)")}
          </div>
          <h2 className="pt-2 text-xs font-bold tracking-widest uppercase">Escalation thresholds</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {num("areaEscalationHours", "Area Manager after (hours overdue)")}
            {num("zonalEscalationHours", "Zonal Manager after (hours overdue)")}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-xs font-bold tracking-widest uppercase">Escalation hierarchy</h2>
          <div className="mt-3 space-y-2">
            {ruleList.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-xs">
                <div>
                  <span className="font-bold">{r.id}</span> · {r.text}
                </div>
                <Pill tone="gold">→ {r.to}</Pill>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {escalations.filter((e) => e.status === "Open").length} escalations are currently open under these rules.
          </p>
        </div>
      </div>
    </div>
  );
}
