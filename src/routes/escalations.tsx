import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useGoldFlow } from "@/lib/goldflow/store";
import type { Escalation } from "@/lib/goldflow/types";
import { EXECUTIVES } from "@/lib/goldflow/demo-data";
import { fmtDateTime, relative } from "@/lib/goldflow/format";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Pill } from "@/components/goldflow/badges";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/escalations")({
  head: () => ({
    meta: [
      { title: "Escalation Centre — GoldFlow" },
      { name: "description", content: "Critical, high and medium escalations raised by SLA breaches, untouched hot leads and missed follow-ups." },
      { property: "og:title", content: "Escalation Centre — GoldFlow" },
      { property: "og:description", content: "Reassign, contact the executive or resolve every escalation." },
    ],
  }),
  component: EscalationCentre,
});

const TABS = ["Critical", "High", "Medium", "Resolved"] as const;

function EscalationCentre() {
  const { escalations, leads, userById, resolveEscalation, assignLead, now } = useGoldFlow();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Critical");
  const [resolving, setResolving] = useState<Escalation | null>(null);
  const [reassigning, setReassigning] = useState<Escalation | null>(null);
  const [note, setNote] = useState("Manager intervened and contacted the customer.");
  const [execId, setExecId] = useState("");

  const counts = Object.fromEntries(
    TABS.map((t) => [
      t,
      escalations.filter((e) => (t === "Resolved" ? e.status === "Resolved" : e.status === "Open" && e.severity === t)),
    ]),
  ) as Record<(typeof TABS)[number], Escalation[]>;

  const rows = counts[tab];

  return (
    <div>
      <PageHeader title="Escalation Centre" subtitle="Every breach is traceable to a rule, a lead and an owner" />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
            )}
          >
            {t} <span className="num opacity-70">({counts[t].length})</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-[10px] tracking-wide text-muted-foreground uppercase">
            <tr>
              {["Lead", "Customer", "Branch", "Executive", "Trigger", "Breach", "Escalated To", "Time", "Status", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 60).map((e) => {
              const lead = leads.find((l) => l.id === e.leadId);
              if (!lead) return null;
              return (
                <tr key={e.id} className="border-t border-border hover:bg-accent/30">
                  <td className="px-3 py-2">
                    <Link to="/leads/$leadId" params={{ leadId: e.leadId }} className="font-medium text-primary hover:underline">{e.leadId}</Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{lead.customer}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{lead.branch}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{userById(lead.executiveId)?.name ?? <Pill tone="danger">Unassigned</Pill>}</td>
                  <td className="px-3 py-2">{e.trigger}</td>
                  <td className="num px-3 py-2 whitespace-nowrap text-destructive">
                    {e.breachMinutes > 90 ? `${Math.round(e.breachMinutes / 60)}h` : `${e.breachMinutes}m`}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.escalatedTo}</td>
                  <td className="px-3 py-2 whitespace-nowrap" title={fmtDateTime(e.at)}>{relative(e.at, now)}</td>
                  <td className="px-3 py-2">
                    <Pill tone={e.status === "Resolved" ? "success" : e.severity === "Critical" ? "danger" : "warning"}>
                      {e.status === "Resolved" ? "Resolved" : e.severity}
                    </Pill>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button asChild size="sm" variant="outline" className="h-7 px-2 text-[11px]">
                        <Link to="/leads/$leadId" params={{ leadId: e.leadId }}>Open</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => { setReassigning(e); setExecId(""); }}>Reassign</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => toast.success(`Alert sent to ${userById(lead.executiveId)?.name ?? "branch manager"}`)}
                      >
                        Contact
                      </Button>
                      {e.status === "Open" && (
                        <Button size="sm" className="h-7 px-2 text-[11px]" onClick={() => setResolving(e)}>Resolve</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">No {tab.toLowerCase()} escalations.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!resolving} onOpenChange={(v) => !v && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve escalation</DialogTitle>
            <DialogDescription>{resolving?.trigger} · {resolving?.leadId}</DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter>
            <Button
              onClick={() => {
                if (resolving) resolveEscalation(resolving.id, note);
                toast.success("Escalation resolved and logged to the lead timeline");
                setResolving(null);
              }}
            >
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reassigning} onOpenChange={(v) => !v && setReassigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign lead</DialogTitle>
            <DialogDescription>{reassigning?.leadId}</DialogDescription>
          </DialogHeader>
          <Select value={execId} onValueChange={setExecId}>
            <SelectTrigger><SelectValue placeholder="Choose a sales executive" /></SelectTrigger>
            <SelectContent>
              {EXECUTIVES.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name} · {e.branch}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              disabled={!execId}
              onClick={() => {
                if (reassigning && execId) assignLead(reassigning.leadId, execId);
                toast.success("Lead reassigned");
                setReassigning(null);
              }}
            >
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
