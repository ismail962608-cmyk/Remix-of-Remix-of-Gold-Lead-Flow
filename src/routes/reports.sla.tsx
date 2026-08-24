import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useGoldFlow, slaStatus } from "@/lib/goldflow/store";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/goldflow/badges";
import { exportCsv } from "@/lib/goldflow/export";

export const Route = createFileRoute("/reports/sla")({
  head: () => ({
    meta: [
      { title: "SLA Report — GoldFlow" },
      { name: "description", content: "First contact SLA, follow-up SLA, breaches, escalations and average response time per branch." },
      { property: "og:title", content: "SLA Report — GoldFlow" },
      { property: "og:description", content: "Track how fast gold loan leads are answered and where SLAs break." },
    ],
  }),
  component: SlaReport,
});

function SlaReport() {
  const { visibleLeads, rules, now, escalations } = useGoldFlow();

  const rows = useMemo(() => {
    const escLead = new Map<string, number>();
    for (const e of escalations) escLead.set(e.leadId, (escLead.get(e.leadId) ?? 0) + 1);
    const branches = [...new Set(visibleLeads.map((l) => l.branch))];
    return branches
      .map((branch) => {
        const set = visibleLeads.filter((l) => l.branch === branch);
        const contacted = set.filter((l) => l.lastContactAt);
        const fcMet = set.filter((l) => ["Met", "On Track"].includes(slaStatus(l, rules, now))).length;
        const breaches = set.filter((l) => slaStatus(l, rules, now) === "Breached").length;
        const fuTotal = set.reduce((s, l) => s + l.followUps.length + l.missedFollowUps, 0);
        const fuMissed = set.reduce((s, l) => s + l.missedFollowUps, 0);
        const avgResp = contacted.length
          ? Math.round(contacted.reduce((s, l) => s + (l.lastContactAt! - l.createdAt) / 60_000, 0) / contacted.length)
          : 0;
        return {
          branch,
          leads: set.length,
          firstContactSla: set.length ? Math.round((fcMet / set.length) * 100) : 0,
          followUpSla: fuTotal ? Math.round(((fuTotal - fuMissed) / fuTotal) * 100) : 100,
          breaches,
          escalations: set.reduce((s, l) => s + (escLead.get(l.id) ?? 0), 0),
          avgResponseMins: avgResp,
        };
      })
      .sort((a, b) => a.firstContactSla - b.firstContactSla);
  }, [visibleLeads, rules, now, escalations]);

  return (
    <div>
      <PageHeader
        title="SLA Report"
        subtitle={`First contact SLA — Hot ${rules.slaHotMin}m · Warm ${rules.slaWarmMin}m · Cold ${rules.slaColdMin}m`}
        actions={
          <Button size="sm" onClick={() => { exportCsv("sla-report", rows); toast.success("SLA report exported"); }}>
            <Download className="h-3.5 w-3.5" /> Export Excel
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-[10px] tracking-wide text-muted-foreground uppercase">
            <tr>
              {["Branch", "Leads", "First Contact SLA", "Follow-up SLA", "Breaches", "Escalations", "Avg Response Time"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.branch} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2 font-semibold whitespace-nowrap">{r.branch}</td>
                <td className="num px-3 py-2">{r.leads}</td>
                <td className="px-3 py-2">
                  <Pill tone={r.firstContactSla >= 80 ? "success" : r.firstContactSla >= 60 ? "warning" : "danger"}>{r.firstContactSla}%</Pill>
                </td>
                <td className="num px-3 py-2">{r.followUpSla}%</td>
                <td className="num px-3 py-2 text-destructive">{r.breaches}</td>
                <td className="num px-3 py-2">{r.escalations}</td>
                <td className="num px-3 py-2">
                  {r.avgResponseMins > 90 ? `${(r.avgResponseMins / 60).toFixed(1)}h` : `${r.avgResponseMins}m`}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
