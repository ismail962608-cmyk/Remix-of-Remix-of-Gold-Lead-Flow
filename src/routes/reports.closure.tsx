import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useGoldFlow } from "@/lib/goldflow/store";
import { BRANCHES, ZONES, EXECUTIVES } from "@/lib/goldflow/demo-data";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportCsv } from "@/lib/goldflow/export";

export const Route = createFileRoute("/reports/closure")({
  head: () => ({
    meta: [
      { title: "Lead Closure Report — GoldFlow" },
      { name: "description", content: "Leads, contacted, qualified, follow-up, converted, lost, conversion rate and average closure time by zone, area, branch and executive." },
      { property: "og:title", content: "Lead Closure Report — GoldFlow" },
      { property: "og:description", content: "Export gold loan lead closure performance to Excel." },
    ],
  }),
  component: ClosureReport,
});

const ALL = "__all";

function ClosureReport() {
  const { visibleLeads, now } = useGoldFlow();
  const [days, setDays] = useState("30");
  const [zone, setZone] = useState(ALL);
  const [area, setArea] = useState(ALL);
  const [branch, setBranch] = useState(ALL);
  const [exec, setExec] = useState(ALL);

  const rows = useMemo(() => {
    const filtered = visibleLeads.filter(
      (l) =>
        l.createdAt > now - Number(days) * 86400_000 &&
        (zone === ALL || l.zone === zone) &&
        (area === ALL || l.area === area) &&
        (branch === ALL || l.branch === branch) &&
        (exec === ALL || l.executiveId === exec),
    );
    const groups = [...new Set(filtered.map((l) => l.branch))];
    return groups.map((b) => {
      const set = filtered.filter((l) => l.branch === b);
      const converted = set.filter((l) => l.status === "Converted");
      const closed = set.filter((l) => l.status !== "Active");
      const avgHours = converted.length
        ? Math.round(converted.reduce((s, l) => s + ((l.conversion?.date ?? now) - l.createdAt) / 3600_000, 0) / converted.length)
        : 0;
      return {
        branch: b,
        leads: set.length,
        contacted: set.filter((l) => l.lastContactAt).length,
        qualified: set.filter((l) => ["Qualified", "Interested", "Processing", "Converted"].includes(l.stage)).length,
        followUp: set.filter((l) => l.stage === "Follow-up").length,
        converted: converted.length,
        lost: set.filter((l) => l.status === "Lost").length,
        conversionRate: closed.length ? Math.round((converted.length / closed.length) * 100) : 0,
        avgClosure: avgHours,
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [visibleLeads, days, zone, area, branch, exec, now]);

  const totals = rows.reduce(
    (t, r) => ({ leads: t.leads + r.leads, converted: t.converted + r.converted, lost: t.lost + r.lost }),
    { leads: 0, converted: 0, lost: 0 },
  );

  return (
    <div>
      <PageHeader
        title="Lead Closure Report"
        subtitle={`${totals.leads} leads · ${totals.converted} converted · ${totals.lost} lost`}
        actions={
          <Button size="sm" onClick={() => { exportCsv("lead-closure-report", rows); toast.success("Report exported"); }}>
            <Download className="h-3.5 w-3.5" /> Export Excel
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Sel value={days} onChange={setDays} options={[["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"]]} label="Date" plain />
        <Sel value={zone} onChange={(v) => { setZone(v); setArea(ALL); setBranch(ALL); }} options={ZONES.map((z) => [z, z])} label="Zone" />
        <Sel value={area} onChange={(v) => { setArea(v); setBranch(ALL); }} options={[...new Set(BRANCHES.filter((b) => zone === ALL || b.zone === zone).map((b) => b.area))].map((a) => [a, a])} label="Area" />
        <Sel value={branch} onChange={setBranch} options={BRANCHES.filter((b) => (zone === ALL || b.zone === zone) && (area === ALL || b.area === area)).map((b) => [b.name, b.name])} label="Branch" />
        <Sel value={exec} onChange={setExec} options={EXECUTIVES.map((e) => [e.id, e.name])} label="Executive" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-[10px] tracking-wide text-muted-foreground uppercase">
            <tr>
              {["Branch", "Leads", "Contacted", "Qualified", "Follow-up", "Converted", "Lost", "Conversion Rate", "Avg Closure Time"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.branch} className="border-t border-border hover:bg-accent/30">
                <td className="px-3 py-2 font-semibold whitespace-nowrap">{r.branch}</td>
                <td className="num px-3 py-2">{r.leads}</td>
                <td className="num px-3 py-2">{r.contacted}</td>
                <td className="num px-3 py-2">{r.qualified}</td>
                <td className="num px-3 py-2">{r.followUp}</td>
                <td className="num px-3 py-2 text-success">{r.converted}</td>
                <td className="num px-3 py-2 text-destructive">{r.lost}</td>
                <td className="num px-3 py-2">{r.conversionRate}%</td>
                <td className="num px-3 py-2">{r.avgClosure}h</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">No leads for these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sel({
  value, onChange, options, label, plain,
}: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string; plain?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        {!plain && <SelectItem value={ALL}>All {label}</SelectItem>}
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
