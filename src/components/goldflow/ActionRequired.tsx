import { Link } from "@tanstack/react-router";
import { useGoldFlow, slaStatus, urgencyScore, riskLevel, isOverdue } from "@/lib/goldflow/store";
import type { Lead } from "@/lib/goldflow/types";
import { relative, fmtDate } from "@/lib/goldflow/format";
import { Pill, ScoreChip, SlaBadge, StageBadge, TempBadge, RiskBadge } from "./badges";
import { QuickActions } from "./QuickActions";

export function ActionRequired({ leads, limit = 5 }: { leads: Lead[]; limit?: number }) {
  const { rules, now, userById } = useGoldFlow();
  const rows = [...leads]
    .filter((l) => l.status === "Active")
    .sort((a, b) => urgencyScore(b, rules, now) - urgencyScore(a, rules, now))
    .slice(0, limit);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-muted/70 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            <tr>
              {["Lead", "Score / Temp", "Owner", "Stage", "Next Action / Due", "SLA", "Risk", "Action"].map((h) => (
                <th key={h} className="px-3 py-1.5 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const overdue = isOverdue(l, now);
              return (
                <tr key={l.id} className="border-t border-border transition-colors hover:bg-accent/20">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link to="/leads/$leadId" params={{ leadId: l.id }} className="font-semibold hover:underline">
                      {l.customer}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>{l.id}</span>
                      <span className="text-border">|</span>
                      <span>{l.phone}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <ScoreChip score={l.score} />
                      <TempBadge t={l.temperature} />
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>{userById(l.executiveId)?.name ?? <Pill tone="danger">Unassigned</Pill>}</div>
                    <div className="text-[10px] text-muted-foreground">{l.branch}</div>
                  </td>
                  <td className="px-3 py-2"><StageBadge s={l.stage} /></td>
                  <td className="px-3 py-2">
                    <div className="max-w-36 truncate whitespace-nowrap">{l.nextAction ?? <Pill tone="danger">Missing</Pill>}</div>
                    <div className={`text-[10px] whitespace-nowrap ${overdue ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                      {l.nextActionDueAt ? relative(l.nextActionDueAt, now) : "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2"><SlaBadge s={slaStatus(l, rules, now)} /></td>
                  <td className="px-3 py-2"><RiskBadge r={riskLevel(l, rules, now)} /></td>
                  <td className="px-3 py-2"><QuickActions lead={l} /></td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  Nothing needs attention. Every lead is on track.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
