import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useGoldFlow, slaStatus, isOverdue } from "@/lib/goldflow/store";
import { BRANCHES } from "@/lib/goldflow/demo-data";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Pill } from "@/components/goldflow/badges";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/performance/branch")({
  head: () => ({
    meta: [
      { title: "Branch Performance — GoldFlow" },
      { name: "description", content: "Zone to area to branch drill-down of contact rate, SLA compliance, follow-up discipline, conversions and escalations." },
      { property: "og:title", content: "Branch Performance — GoldFlow" },
      { property: "og:description", content: "Compare branches on lead closure discipline." },
    ],
  }),
  component: BranchPerformance,
});

type Level = "Zone" | "Area" | "Branch";

function BranchPerformance() {
  const { visibleLeads, rules, now, escalations, userById } = useGoldFlow();
  const [level, setLevel] = useState<Level>("Zone");
  const [zone, setZone] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);

  const rows = useMemo(() => {
    const escLead = new Set(escalations.filter((e) => e.status === "Open").map((e) => e.leadId));
    const keys =
      level === "Zone"
        ? [...new Set(BRANCHES.map((b) => b.zone))]
        : level === "Area"
          ? [...new Set(BRANCHES.filter((b) => !zone || b.zone === zone).map((b) => b.area))]
          : BRANCHES.filter((b) => (!zone || b.zone === zone) && (!area || b.area === area)).map((b) => b.name);

    return keys
      .map((key) => {
        const set = visibleLeads.filter((l) =>
          level === "Zone" ? l.zone === key : level === "Area" ? l.area === key : l.branch === key,
        );
        const active = set.filter((l) => l.status === "Active");
        const contacted = set.filter((l) => l.lastContactAt).length;
        const closed = set.filter((l) => l.status !== "Active");
        const converted = set.filter((l) => l.status === "Converted").length;
        const slaOk = set.filter((l) => ["Met", "On Track"].includes(slaStatus(l, rules, now))).length;
        const fuTotal = set.reduce((s, l) => s + l.followUps.length + l.missedFollowUps, 0);
        const fuMissed = set.reduce((s, l) => s + l.missedFollowUps, 0);
        return {
          key,
          leads: set.length,
          contactRate: set.length ? Math.round((contacted / set.length) * 100) : 0,
          sla: set.length ? Math.round((slaOk / set.length) * 100) : 0,
          followUp: fuTotal ? Math.round(((fuTotal - fuMissed) / fuTotal) * 100) : 100,
          conversion: closed.length ? Math.round((converted / closed.length) * 100) : 0,
          overdue: active.filter((l) => isOverdue(l, now)).length,
          escalations: set.filter((l) => escLead.has(l.id)).length,
        };
      })
      .filter((r) => r.leads > 0)
      .sort((a, b) => b.leads - a.leads);
  }, [visibleLeads, level, zone, area, rules, now, escalations]);

  return (
    <div>
      <PageHeader
        title="Branch Performance"
        subtitle="Drill down Zone → Area → Branch"
        actions={
          <div className="flex items-center gap-2 text-xs">
            {(["Zone", "Area", "Branch"] as Level[]).map((l) => (
              <button
                key={l}
                onClick={() => { setLevel(l); if (l === "Zone") { setZone(null); setArea(null); } }}
                className={cn("rounded-full border px-3 py-1 font-semibold", level === l ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}
              >
                {l}
              </button>
            ))}
            {zone && <Pill tone="gold">{zone}</Pill>}
            {area && <Pill tone="gold">{area}</Pill>}
          </div>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-[10px] tracking-wide text-muted-foreground uppercase">
            <tr>
              {[level, "Leads", "Contact Rate", "SLA Compliance", "Follow-up Compliance", "Conversion Rate", "Overdue", "Escalations", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2 font-semibold whitespace-nowrap">{r.key}</td>
                <td className="num px-3 py-2">{r.leads}</td>
                <td className="num px-3 py-2">{r.contactRate}%</td>
                <td className="num px-3 py-2">
                  <Pill tone={r.sla >= 80 ? "success" : r.sla >= 60 ? "warning" : "danger"}>{r.sla}%</Pill>
                </td>
                <td className="num px-3 py-2">{r.followUp}%</td>
                <td className="num px-3 py-2">
                  <Pill tone={r.conversion >= 50 ? "success" : "warning"}>{r.conversion}%</Pill>
                </td>
                <td className="num px-3 py-2 text-destructive">{r.overdue}</td>
                <td className="num px-3 py-2">{r.escalations}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {level !== "Branch" ? (
                    <button
                      className="text-primary hover:underline"
                      onClick={() => {
                        if (level === "Zone") { setZone(r.key); setLevel("Area"); }
                        else { setArea(r.key); setLevel("Branch"); }
                      }}
                    >
                      Drill down →
                    </button>
                  ) : (
                    <Link to="/performance/executive" className="text-primary hover:underline">Executives →</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
