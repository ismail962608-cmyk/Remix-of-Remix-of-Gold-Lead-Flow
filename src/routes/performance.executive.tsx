import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useGoldFlow, slaStatus } from "@/lib/goldflow/store";
import { EXECUTIVES } from "@/lib/goldflow/demo-data";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Pill } from "@/components/goldflow/badges";

export const Route = createFileRoute("/performance/executive")({
  head: () => ({
    meta: [
      { title: "Executive Performance — GoldFlow" },
      { name: "description", content: "Lead handling score per sales executive built from response speed, follow-up discipline, SLA adherence and conversion." },
      { property: "og:title", content: "Executive Performance — GoldFlow" },
      { property: "og:description", content: "See who is closing leads and who needs coaching." },
    ],
  }),
  component: ExecutivePerformance,
});

function ExecutivePerformance() {
  const { visibleLeads, rules, now } = useGoldFlow();

  const rows = useMemo(() => {
    return EXECUTIVES.map((e) => {
      const set = visibleLeads.filter((l) => l.executiveId === e.id);
      const contacted = set.filter((l) => l.lastContactAt);
      const closed = set.filter((l) => l.status !== "Active");
      const converted = set.filter((l) => l.status === "Converted").length;
      const slaOk = set.filter((l) => ["Met", "On Track"].includes(slaStatus(l, rules, now))).length;
      const fuDone = set.reduce((s, l) => s + l.followUps.filter((f) => f.status === "Completed").length, 0);
      const fuMissed = set.reduce((s, l) => s + l.missedFollowUps, 0);
      const slaPct = set.length ? Math.round((slaOk / set.length) * 100) : 0;
      const convPct = closed.length ? Math.round((converted / closed.length) * 100) : 0;
      const respPct = set.length ? Math.round((contacted.length / set.length) * 100) : 0;
      const fuPct = fuDone + fuMissed ? Math.round((fuDone / (fuDone + fuMissed)) * 100) : 80;
      const handling = Math.round(respPct * 0.3 + fuPct * 0.2 + slaPct * 0.3 + convPct * 0.2);
      return {
        e, leads: set.length, contacted: contacted.length, slaPct, fuDone, fuMissed,
        hot: set.filter((l) => l.temperature === "Hot").length, converted, convPct, handling,
      };
    })
      .filter((r) => r.leads > 0)
      .sort((a, b) => b.handling - a.handling);
  }, [visibleLeads, rules, now]);

  return (
    <div>
      <PageHeader title="Executive Performance" subtitle="Lead Handling Score = response speed 30% · follow-up discipline 20% · SLA adherence 30% · conversion 20%" />
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-[10px] tracking-wide text-muted-foreground uppercase">
            <tr>
              {["Executive", "Branch", "Leads Assigned", "Contacted", "SLA %", "Follow-ups Completed", "Follow-ups Missed", "Hot Leads", "Converted", "Conversion Rate", "Lead Handling Score"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.e.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2 font-semibold whitespace-nowrap">{r.e.name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.e.branch}</td>
                <td className="num px-3 py-2">{r.leads}</td>
                <td className="num px-3 py-2">{r.contacted}</td>
                <td className="num px-3 py-2"><Pill tone={r.slaPct >= 80 ? "success" : r.slaPct >= 60 ? "warning" : "danger"}>{r.slaPct}%</Pill></td>
                <td className="num px-3 py-2">{r.fuDone}</td>
                <td className="num px-3 py-2 text-destructive">{r.fuMissed}</td>
                <td className="num px-3 py-2">{r.hot}</td>
                <td className="num px-3 py-2">{r.converted}</td>
                <td className="num px-3 py-2">{r.convPct}%</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-gold" style={{ width: `${r.handling}%` }} />
                    </div>
                    <span className="num font-bold">{r.handling}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
