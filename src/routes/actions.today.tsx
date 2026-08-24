import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Phone, MessageCircle, CheckCircle2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useGoldFlow, isOverdue, slaStatus } from "@/lib/goldflow/store";
import type { Lead } from "@/lib/goldflow/types";
import { fmtDate, fmtTime, relative, toLocalInput } from "@/lib/goldflow/format";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Pill, ScoreChip, SlaBadge, StageBadge, TempBadge } from "@/components/goldflow/badges";
import { Button } from "@/components/ui/button";
import { CallDialog, MessageDialog, FollowUpDialog } from "@/components/goldflow/QuickActions";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/actions/today")({
  head: () => ({
    meta: [
      { title: "Today's Actions — GoldFlow" },
      { name: "description", content: "New leads, actions due now, due today and overdue — the daily operating screen for sales executives." },
      { property: "og:title", content: "Today's Actions — GoldFlow" },
      { property: "og:description", content: "Call, WhatsApp, complete or reschedule every lead action from one screen." },
    ],
  }),
  component: TodaysActions,
});

function CompleteDialog({ lead, open, onOpenChange }: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { completeFollowUp, rules } = useGoldFlow();
  const [outcome, setOutcome] = useState("Spoke to customer — progressing");
  const [nextAction, setNextAction] = useState("Confirm branch visit");
  const [due, setDue] = useState(toLocalInput(Date.now() + 24 * 3600_000));
  const [close, setClose] = useState(false);
  const fu = lead.followUps.find((f) => f.status === "Scheduled");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete action — {lead.customer}</DialogTitle>
          <DialogDescription>{lead.nextAction ?? "Pending action"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs">Outcome</Label>
            <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} />
          </div>
          <div className="rounded-md border border-gold/40 bg-accent/40 p-3">
            <div className="text-xs font-bold">What is the next action?</div>
            {rules.nextActionMandatory && !close && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">Mandatory — an active lead cannot be left without a next action.</p>
            )}
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next action" disabled={close} />
              <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} disabled={close} />
            </div>
            <label className="mt-2 flex items-center gap-2 text-[11px]">
              <input type="checkbox" checked={close} onChange={(e) => setClose(e.target.checked)} />
              No further action needed — I will close this lead from the lead page
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!close && (!nextAction.trim() || Number.isNaN(new Date(due).getTime())))
                { toast.error("Set the next action and its due time"); return; }
              completeFollowUp(
                lead.id,
                fu?.id ?? "none",
                outcome,
                close ? undefined : { action: nextAction, dueAt: new Date(due).getTime() },
              );
              toast.success(close ? "Action completed" : "Action completed — next action scheduled");
              onOpenChange(false);
            }}
          >
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const { now, rules, userById } = useGoldFlow();
  const [dlg, setDlg] = useState<null | "call" | "wa" | "fu" | "done">(null);
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link to="/leads/$leadId" params={{ leadId: lead.id }} className="text-sm font-bold hover:underline">{lead.customer}</Link>
          <div className="text-[11px] text-muted-foreground">{lead.id} · {lead.product} · {lead.phone}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ScoreChip score={lead.score} />
          <TempBadge t={lead.temperature} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StageBadge s={lead.stage} />
        <SlaBadge s={slaStatus(lead, rules, now)} />
        <Pill>{lead.branch}</Pill>
        <Pill>{userById(lead.executiveId)?.name ?? "Unassigned"}</Pill>
      </div>
      <div className="mt-2 rounded-md bg-muted p-2 text-[11px]">
        <span className="font-semibold">Next: </span>
        {lead.nextAction ?? <span className="font-semibold text-destructive">Missing next action</span>}
        {lead.nextActionDueAt && (
          <span className={cn("ml-1", isOverdue(lead, now) ? "font-semibold text-destructive" : "text-muted-foreground")}>
            · due {relative(lead.nextActionDueAt, now)} ({fmtTime(lead.nextActionDueAt)})
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button size="sm" className="h-7 text-xs" onClick={() => setDlg("call")}><Phone className="h-3 w-3" /> Call</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDlg("wa")}><MessageCircle className="h-3 w-3" /> WhatsApp</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDlg("done")}><CheckCircle2 className="h-3 w-3" /> Complete</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDlg("fu")}><CalendarClock className="h-3 w-3" /> Reschedule</Button>
      </div>
      <CallDialog lead={lead} open={dlg === "call"} onOpenChange={(v) => setDlg(v ? "call" : null)} />
      <MessageDialog lead={lead} channel="WhatsApp" open={dlg === "wa"} onOpenChange={(v) => setDlg(v ? "wa" : null)} />
      <FollowUpDialog lead={lead} open={dlg === "fu"} onOpenChange={(v) => setDlg(v ? "fu" : null)} />
      <CompleteDialog lead={lead} open={dlg === "done"} onOpenChange={(v) => setDlg(v ? "done" : null)} />
    </div>
  );
}

function Section({ title, tone, leads }: { title: string; tone: string; leads: Lead[] }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-xs font-bold tracking-widest uppercase">{title}</h2>
        <Pill tone={tone as never}>{leads.length}</Pill>
      </div>
      {leads.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leads.slice(0, 12).map((l) => <LeadCard key={l.id} lead={l} />)}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">Nothing here right now.</div>
      )}
    </section>
  );
}

function StatCard({
  label, value, tone, active, onClick,
}: { label: string; value: number; tone: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-card p-3 text-left shadow-card transition hover:border-gold/60",
        active ? "border-gold ring-1 ring-gold/40" : "border-border",
      )}
    >
      <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="num text-2xl font-bold leading-none">{value}</span>
        <Pill tone={tone as never}>{value ? "action" : "clear"}</Pill>
      </div>
    </button>
  );
}

function TodaysActions() {
  const { visibleLeads, currentUser, now } = useGoldFlow();
  const [tab, setTab] = useState("overdue");
  const mine = currentUser.role === "Sales Executive"
    ? visibleLeads.filter((l) => l.executiveId === currentUser.id)
    : visibleLeads;

  const groups = useMemo(() => {
    const active = mine.filter((l) => l.status === "Active");
    const today = new Date(now).toDateString();
    return {
      newLeads: active.filter((l) => !l.lastContactAt && l.createdAt > now - 24 * 3600_000),
      dueNow: active.filter((l) => l.nextActionDueAt && l.nextActionDueAt >= now && l.nextActionDueAt < now + 60 * 60_000),
      dueToday: active.filter(
        (l) => l.nextActionDueAt && l.nextActionDueAt >= now + 60 * 60_000 && new Date(l.nextActionDueAt).toDateString() === today,
      ),
      overdue: active.filter((l) => isOverdue(l, now)).sort((a, b) => (a.nextActionDueAt ?? 0) - (b.nextActionDueAt ?? 0)),
      hot: active.filter((l) => l.temperature === "Hot"),
      upcoming: active
        .filter((l) => l.nextActionDueAt && l.nextActionDueAt > now)
        .sort((a, b) => (a.nextActionDueAt ?? 0) - (b.nextActionDueAt ?? 0))
        .slice(0, 24),
    };
  }, [mine, now]);

  const tabs = [
    { key: "overdue", label: "Overdue", tone: "danger", leads: groups.overdue },
    { key: "duenow", label: "Due Now", tone: "warning", leads: groups.dueNow },
    { key: "duetoday", label: "Due Today", tone: "info", leads: groups.dueToday },
    { key: "new", label: "New Leads", tone: "gold", leads: groups.newLeads },
    { key: "hot", label: "Hot Leads", tone: "hot", leads: groups.hot },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Today's Actions"
        subtitle={`${fmtDate(now)} · ${currentUser.name} · no lead left behind — clear every queue below`}
      />

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {tabs.map((t) => (
          <StatCard
            key={t.key}
            label={t.label}
            value={t.leads.length}
            tone={t.tone}
            active={tab === t.key}
            onClick={() => setTab(t.key)}
          />
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs">
              {t.label}
              <span className="num ml-1.5 rounded bg-muted px-1 text-[10px]">{t.leads.length}</span>
            </TabsTrigger>
          ))}
          <TabsTrigger value="calendar" className="text-xs">Follow-up Calendar</TabsTrigger>
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <Section title={t.label} tone={t.tone} leads={t.leads} />
          </TabsContent>
        ))}

        <TabsContent value="calendar" className="mt-4">
          <div className="rounded-lg border border-border bg-card shadow-card">
            {groups.upcoming.map((l) => (
              <Link
                key={l.id}
                to="/leads/$leadId"
                params={{ leadId: l.id }}
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-xs last:border-0 hover:bg-accent/30"
              >
                <span className="num w-32 shrink-0 text-muted-foreground">
                  {fmtDate(l.nextActionDueAt!)} {fmtTime(l.nextActionDueAt!)}
                </span>
                <span className="flex-1 truncate font-semibold">{l.customer}</span>
                <span className="hidden flex-1 truncate text-muted-foreground sm:block">{l.nextAction}</span>
                <TempBadge t={l.temperature} />
              </Link>
            ))}
            {!groups.upcoming.length && <div className="p-6 text-center text-xs text-muted-foreground">No scheduled follow-ups.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
