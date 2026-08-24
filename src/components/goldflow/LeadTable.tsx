import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGoldFlow, slaStatus, isOverdue } from "@/lib/goldflow/store";
import { STAGES, type Lead } from "@/lib/goldflow/types";
import { BRANCHES, ZONES, EXECUTIVES } from "@/lib/goldflow/demo-data";
import { fmtDate, fmtTime, relative } from "@/lib/goldflow/format";
import { ScoreChip, SlaBadge, StageBadge, TempBadge, Pill } from "./badges";

const ALL = "__all";

export interface LeadFilterPreset {
  temperature?: string;
  stage?: string;
  sla?: string;
  status?: string;
  overdue?: boolean;
  uncontacted?: boolean;
  age?: string;
  risk?: string;
}

export function LeadTable({
  leads,
  preset,
  dense,
}: {
  leads: Lead[];
  preset?: LeadFilterPreset;
  dense?: boolean;
}) {
  const { rules, now, userById } = useGoldFlow();
  const [q, setQ] = useState("");
  const [zone, setZone] = useState(ALL);
  const [area, setArea] = useState(ALL);
  const [branch, setBranch] = useState(ALL);
  const [exec, setExec] = useState(ALL);
  const [temp, setTemp] = useState(preset?.temperature ?? ALL);
  const [stage, setStage] = useState(preset?.stage ?? ALL);
  const [sla, setSla] = useState(preset?.sla ?? ALL);
  const [status, setStatus] = useState(preset?.status ?? ALL);
  const [days, setDays] = useState(ALL);
  const [page, setPage] = useState(0);

  const areas = useMemo(
    () => [...new Set(BRANCHES.filter((b) => zone === ALL || b.zone === zone).map((b) => b.area))],
    [zone],
  );
  const branches = useMemo(
    () => BRANCHES.filter((b) => (zone === ALL || b.zone === zone) && (area === ALL || b.area === area)),
    [zone, area],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads
      .filter((l) => {
        if (term && !`${l.customer} ${l.phone} ${l.id}`.toLowerCase().includes(term)) return false;
        if (zone !== ALL && l.zone !== zone) return false;
        if (area !== ALL && l.area !== area) return false;
        if (branch !== ALL && l.branch !== branch) return false;
        if (exec !== ALL && l.executiveId !== exec) return false;
        if (temp !== ALL && l.temperature !== temp) return false;
        if (stage !== ALL && l.stage !== stage) return false;
        if (status !== ALL && l.status !== status) return false;
        if (sla !== ALL && slaStatus(l, rules, now) !== sla) return false;
        if (days !== ALL && l.createdAt < now - Number(days) * 86400_000) return false;
        if (preset?.overdue && !isOverdue(l, now)) return false;
        if (preset?.uncontacted && (l.lastContactAt || l.status !== "Active")) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [leads, q, zone, area, branch, exec, temp, stage, status, sla, days, rules, now, preset]);

  const pageSize = dense ? 8 : 15;
  const shown = rows.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.ceil(rows.length / pageSize);

  const sel = "h-7 w-[120px] text-[11px]";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-2 left-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Customer / Phone / Lead ID"
            className="h-7 w-52 pl-7 text-[11px]"
          />
        </div>
        <FilterSelect className={sel} value={days} onChange={setDays} label="Date" options={[["1", "Last 24h"], ["3", "Last 3 days"], ["7", "Last 7 days"], ["30", "Last 30 days"]]} />
        <FilterSelect className={sel} value={zone} onChange={(v) => { setZone(v); setArea(ALL); setBranch(ALL); }} label="Zone" options={ZONES.map((z) => [z, z])} />
        <FilterSelect className={sel} value={area} onChange={(v) => { setArea(v); setBranch(ALL); }} label="Area" options={areas.map((a) => [a, a])} />
        <FilterSelect className={sel} value={branch} onChange={setBranch} label="Branch" options={branches.map((b) => [b.name, b.name])} />
        <FilterSelect className={sel} value={exec} onChange={setExec} label="Exec" options={EXECUTIVES.filter((e) => branch === ALL || e.branch === branch).map((e) => [e.id, e.name])} />
        <FilterSelect className={sel} value={temp} onChange={setTemp} label="Temp" options={[["Hot", "Hot"], ["Warm", "Warm"], ["Cold", "Cold"]]} />
        <FilterSelect className={sel} value={stage} onChange={setStage} label="Stage" options={[...STAGES, "Lost"].map((s) => [s, s])} />
        <FilterSelect className={sel} value={sla} onChange={setSla} label="SLA" options={[["On Track", "On Track"], ["At Risk", "At Risk"], ["Breached", "Breached"], ["Met", "Met"]]} />
        <FilterSelect className={sel} value={status} onChange={setStatus} label="Status" options={[["Active", "Active"], ["Converted", "Converted"], ["Lost", "Lost"]]} />
        <span className="ml-auto text-[11px] text-muted-foreground num">{rows.length} leads</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-muted/70 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              <tr>
                {["Lead", "Product", "Score", "Branch / Exec", "Created", "Last Contact", "Next Action", "Stage", "SLA", "Status"].map((h) => (
                  <th key={h} className="px-3 py-1.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
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
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{l.product}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <ScoreChip score={l.score} />
                      <TempBadge t={l.temperature} />
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>{l.branch}</div>
                    <div className="text-[10px] text-muted-foreground">{userById(l.executiveId)?.name ?? <span className="text-destructive">Unassigned</span>}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>{fmtDate(l.createdAt)}</div>
                    <div className="text-[10px] text-muted-foreground">{fmtTime(l.createdAt)}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{l.lastContactAt ? relative(l.lastContactAt, now) : <Pill tone="warning">None</Pill>}</td>
                  <td className="px-3 py-2">
                    <div className="max-w-28 truncate whitespace-nowrap">{l.nextAction ?? <Pill tone="danger">Missing</Pill>}</div>
                    <div className={`text-[10px] whitespace-nowrap ${isOverdue(l, now) ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                      {l.nextActionDueAt ? relative(l.nextActionDueAt, now) : "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2"><StageBadge s={l.stage} /></td>
                  <td className="px-3 py-2"><SlaBadge s={slaStatus(l, rules, now)} /></td>
                  <td className="px-3 py-2">
                    <Pill tone={l.status === "Converted" ? "success" : l.status === "Lost" ? "danger" : "info"}>{l.status}</Pill>
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">No leads match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length > pageSize && (
        <div className="flex items-center justify-end gap-2 text-[11px]">
          <span className="text-muted-foreground num">Page {page + 1} of {totalPages}</span>
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={(page + 1) * pageSize >= rows.length} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value, onChange, label, options, className,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: [string, string][];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL} className="text-[11px]">All {label}</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v} className="text-[11px]">{l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
