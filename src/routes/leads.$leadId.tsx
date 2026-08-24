import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Phone, MessageCircle, Mail, MessageSquare, CalendarClock, StickyNote, ArrowUpCircle,
  ChevronLeft, Sparkles, CheckCircle2, XCircle, AlertTriangle, PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGoldFlow, slaStatus, isOverdue, stickyGaps, firstContactDue, riskLevel,
} from "@/lib/goldflow/store";
import { STAGES, type Channel, type Stage } from "@/lib/goldflow/types";
import { fmtDateTime, fmtDate, inr, relative, toLocalInput } from "@/lib/goldflow/format";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Pill, ScoreChip, SlaBadge, SourceBadge, StageBadge, TempBadge, RiskBadge } from "@/components/goldflow/badges";
import { CallDialog, MessageDialog, FollowUpDialog, EscalateDialog } from "@/components/goldflow/QuickActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leads/$leadId")({
  head: ({ params }) => ({
    meta: [
      { title: `Lead ${params.leadId} — GoldFlow` },
      { name: "description", content: "AI lead intelligence, journey timeline, next best action, touchpoints, follow-ups and closure for a Voice Analytics lead." },
      { property: "og:title", content: `Lead ${params.leadId} — GoldFlow` },
      { property: "og:description", content: "Everything about this gold loan lead in one screen." },
    ],
  }),
  component: LeadDetail,
});

const LOSS_REASONS = [
  "Not Interested", "No Response", "Competitor", "Rate/Terms", "Documentation",
  "Not Eligible", "Deferred", "Duplicate", "Wrong Lead", "Other",
];

const JOURNEY = ["Lead Detected", "Assigned", "First Contact", "Customer Interested", "Follow-up", "Branch Visit", "Processing", "Converted"];

function LeadDetail() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  const {
    getLead, leadActivities, rules, now, userById, escalations, users,
    addNote, changeStage, setNextAction, completeFollowUp, convertLead, markLost, assignLead,
  } = useGoldFlow();

  const lead = getLead(leadId);
  const [dlg, setDlg] = useState<null | "call" | "wa" | "sms" | "email" | "fu" | "esc" | "note" | "stage" | "convert" | "lost" | "source" | "complete" | "assign">(null);
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<Stage>(lead?.stage ?? "New");
  const [convProduct, setConvProduct] = useState(lead?.product ?? "Gold Loan");
  const [convDate, setConvDate] = useState(toLocalInput(Date.now()));
  const [convValue, setConvValue] = useState(String(lead?.value ?? 0));
  const [convNotes, setConvNotes] = useState("");
  const [lossReason, setLossReason] = useState("");
  const [lossRemarks, setLossRemarks] = useState("");
  const [outcome, setOutcome] = useState("Spoke to the customer");
  const [nextAct, setNextAct] = useState("Confirm branch visit");
  const [nextDue, setNextDue] = useState(toLocalInput(Date.now() + 24 * 3600_000));
  const [noNext, setNoNext] = useState(false);
  const [assignee, setAssignee] = useState("");

  if (!lead) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">Lead {leadId} was not found.</p>
        <Button asChild size="sm" className="mt-4"><Link to="/leads">Back to all leads</Link></Button>
      </div>
    );
  }

  const timeline = leadActivities(lead.id);
  const exec = userById(lead.executiveId);
  const sla = slaStatus(lead, rules, now);
  const gaps = stickyGaps(lead);
  const leadEsc = escalations.filter((e) => e.leadId === lead.id);
  const openFu = lead.followUps.find((f) => f.status === "Scheduled");
  const i = lead.intelligence;

  const journeyDone = (step: string) => {
    switch (step) {
      case "Lead Detected": return true;
      case "Assigned": return !!lead.executiveId;
      case "First Contact": return !!lead.lastContactAt;
      case "Customer Interested": return ["Interested", "Processing", "Converted"].includes(lead.stage) || lead.stage === "Qualified";
      case "Follow-up": return lead.followUps.length > 0 || lead.stage === "Follow-up";
      case "Branch Visit": return ["Processing", "Converted"].includes(lead.stage);
      case "Processing": return ["Processing", "Converted"].includes(lead.stage);
      case "Converted": return lead.status === "Converted";
      default: return false;
    }
  };

  return (
    <div className="space-y-5">
      <Link to="/leads" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to leads
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{lead.customer}</h1>
              <TempBadge t={lead.temperature} />
              <StageBadge s={lead.stage} />
              <SlaBadge s={sla} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{lead.id}</span>
              <span>{lead.phone}</span>
              <span>{lead.branch} · {lead.area} · {lead.zone}</span>
              <span>Executive: {exec?.name ?? "Unassigned"}</span>
              <span>Created {fmtDateTime(lead.createdAt)}</span>
              <span>Est. value {inr(lead.value)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setDlg("source")} className="hover:opacity-80"><SourceBadge /></button>
            {lead.status === "Active" && (
              <>
                <Button size="sm" variant="outline" onClick={() => { setAssignee(lead.executiveId ?? ""); setDlg("assign"); }}>Assign</Button>
                <Button size="sm" variant="outline" onClick={() => setDlg("esc")}><ArrowUpCircle className="h-3.5 w-3.5" /> Escalate</Button>
                <Button size="sm" className="bg-success text-primary-foreground hover:bg-success/90" onClick={() => setDlg("convert")}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Convert Lead
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDlg("lost")}><XCircle className="h-3.5 w-3.5" /> Mark Lost</Button>
              </>
            )}
          </div>
        </div>

        {lead.status !== "Active" && (
          <div className={cn("mt-3 rounded-md p-3 text-xs", lead.status === "Converted" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            <span className="font-bold">Outcome: </span>
            {lead.status === "Converted"
              ? `Converted — ${inr(lead.conversion?.value ?? lead.value)} on ${fmtDate(lead.conversion?.date ?? now)}. All follow-ups and SLA tracking stopped.`
              : `Lost — ${lead.lossReason}${lead.lossRemarks ? ` (${lead.lossRemarks})` : ""}. Lead closed.`}
          </div>
        )}

        {gaps.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/8 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="font-bold">Sticky lead rule violated — missing {gaps.join(", ")}.</span> Every active lead must have an owner, stage, next action and due time.
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* AI Lead Intelligence */}
          <section className="rounded-lg border border-gold/40 bg-accent/30 p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                <Sparkles className="h-4 w-4 text-gold" /> AI Lead Intelligence
              </h2>
              <Pill tone="gold">Generated from Voice Analytics</Pill>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Customer Intent</div>
                <div className="mt-1 text-sm font-semibold">{i.intent}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Buying Signals</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {i.signals.map((s) => <Pill key={s} tone="info">{s}</Pill>)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Customer Requirement</div>
                <div className="mt-1 text-xs">{i.requirement}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Objections</div>
                <div className="mt-1 space-y-1 text-xs">
                  {i.objections.map((o) => <div key={o}>• {o}</div>)}
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-gold/50 bg-card p-3">
              <div className="text-[10px] font-bold tracking-widest text-gold-foreground uppercase">AI Recommendation</div>
              <div className="mt-1 text-xs font-medium">{i.recommendation}</div>
            </div>
            <button onClick={() => setDlg("source")} className="mt-3 text-[11px] font-semibold text-primary hover:underline">
              View original call · {i.callId} ({Math.floor(i.callDurationSec / 60)}m {i.callDurationSec % 60}s) →
            </button>
          </section>

          {/* Next best action */}
          {lead.status === "Active" && (
            <section className="rounded-lg border-2 border-primary bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Next Action</div>
                  <div className="mt-1 text-lg font-bold">{lead.nextAction ?? "No next action set"}</div>
                  <div className={cn("text-xs font-semibold", lead.nextActionDueAt && isOverdue(lead, now) ? "text-destructive" : "text-muted-foreground")}>
                    {lead.nextActionDueAt
                      ? `Due ${relative(lead.nextActionDueAt, now)} · ${fmtDateTime(lead.nextActionDueAt)}`
                      : "No due time set"}
                  </div>
                  {lead.nextActionReason && <div className="mt-1 text-xs text-muted-foreground">Reason: {lead.nextActionReason}</div>}
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  First contact SLA
                  <div className="font-semibold text-foreground">{fmtDateTime(firstContactDue(lead, rules))}</div>
                  <RiskBadge r={riskLevel(lead, rules, now)} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setDlg("call")}><PhoneCall className="h-3.5 w-3.5" /> Call Now</Button>
                <Button size="sm" variant="outline" onClick={() => setDlg("wa")}><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</Button>
                <Button size="sm" variant="outline" onClick={() => setDlg("fu")}><CalendarClock className="h-3.5 w-3.5" /> Schedule Follow-up</Button>
                <Button size="sm" variant="outline" onClick={() => setDlg("note")}><StickyNote className="h-3.5 w-3.5" /> Add Note</Button>
                <Button size="sm" variant="outline" onClick={() => { setStage(lead.stage); setDlg("stage"); }}>Change Stage</Button>
              </div>
            </section>
          )}

          {/* Journey */}
          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-bold tracking-widest uppercase">Lead Journey</h2>
            <div className="mt-3 flex flex-wrap gap-1">
              {JOURNEY.map((s) => (
                <div
                  key={s}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                    journeyDone(s) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s}
                </div>
              ))}
            </div>
            <ol className="mt-4 space-y-3 border-l border-border pl-4">
              {timeline.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-card" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold">{a.action}</span>
                    <Pill>{a.type}</Pill>
                    {a.channel && <Pill tone="info">{a.channel}</Pill>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{fmtDateTime(a.at)} · {a.user}</div>
                  {a.notes && <div className="mt-0.5 text-[11px]">{a.notes}</div>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-4">
          {/* Score */}
          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <div className="flex items-end gap-2">
              <span className="num text-4xl font-extrabold">{lead.score}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              <TempBadge t={lead.temperature} />
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div className={cn("h-2 rounded-full", lead.temperature === "Hot" ? "bg-hot" : lead.temperature === "Warm" ? "bg-warm" : "bg-cold")} style={{ width: `${lead.score}%` }} />
            </div>
            <div className="mt-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Why this lead is {lead.temperature}
            </div>
            <div className="mt-1.5 space-y-1">
              {lead.scoreFactors.map((f) => (
                <div key={f.label} className="flex items-center justify-between text-xs">
                  <span>{f.label}</span>
                  <span className="num font-bold text-success">+{f.points}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Touchpoints */}
          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-xs font-bold tracking-widest uppercase">Customer Touchpoints</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                ["Phone", Phone, "call"],
                ["WhatsApp", MessageCircle, "wa"],
                ["SMS", MessageSquare, "sms"],
                ["Email", Mail, "email"],
              ] as const).map(([label, Icon, key]) => (
                <button
                  key={label}
                  onClick={() => setDlg(key)}
                  className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs font-semibold hover:bg-muted"
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              <div>Last contact: {lead.lastContactAt ? fmtDateTime(lead.lastContactAt) : "Never contacted"}</div>
              <div>Interactions logged: {timeline.filter((a) => a.type === "Communication").length}</div>
            </div>
          </section>

          {/* Follow-up */}
          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-xs font-bold tracking-widest uppercase">Next Follow-up</h2>
            {openFu ? (
              <div className="mt-2 space-y-1 text-xs">
                <div><span className="text-muted-foreground">Date & time: </span>{fmtDateTime(openFu.at)}</div>
                <div><span className="text-muted-foreground">Channel: </span>{openFu.channel}</div>
                <div><span className="text-muted-foreground">Purpose: </span>{openFu.purpose}</div>
                {openFu.notes && <div><span className="text-muted-foreground">Notes: </span>{openFu.notes}</div>}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No follow-up scheduled.</p>
            )}
            {lead.missedFollowUps > 0 && (
              <div className="mt-2"><Pill tone="danger">{lead.missedFollowUps} follow-up(s) missed</Pill></div>
            )}
            {lead.status === "Active" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={() => setDlg("fu")}>{openFu ? "Reschedule" : "Schedule"}</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDlg("complete")}>Complete</Button>
              </div>
            )}
          </section>

          {/* Escalations */}
          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-xs font-bold tracking-widest uppercase">Escalations</h2>
            {leadEsc.length ? (
              <div className="mt-2 space-y-2">
                {leadEsc.map((e) => (
                  <div key={e.id} className="rounded-md border border-border p-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{e.trigger}</span>
                      <Pill tone={e.status === "Resolved" ? "success" : e.severity === "Critical" ? "danger" : "warning"}>
                        {e.status === "Resolved" ? "Resolved" : e.severity}
                      </Pill>
                    </div>
                    <div className="text-muted-foreground">→ {e.escalatedTo} · {fmtDateTime(e.at)}</div>
                  </div>
                ))}
                <Link to="/escalations" className="block text-[11px] text-primary hover:underline">Open Escalation Centre →</Link>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No escalations on this lead.</p>
            )}
          </section>
        </div>
      </div>

      {/* Dialogs */}
      <CallDialog lead={lead} open={dlg === "call"} onOpenChange={(v) => setDlg(v ? "call" : null)} />
      <MessageDialog lead={lead} channel="WhatsApp" open={dlg === "wa"} onOpenChange={(v) => setDlg(v ? "wa" : null)} />
      <MessageDialog lead={lead} channel="SMS" open={dlg === "sms"} onOpenChange={(v) => setDlg(v ? "sms" : null)} />
      <MessageDialog lead={lead} channel="Email" open={dlg === "email"} onOpenChange={(v) => setDlg(v ? "email" : null)} />
      <FollowUpDialog lead={lead} open={dlg === "fu"} onOpenChange={(v) => setDlg(v ? "fu" : null)} />
      <EscalateDialog lead={lead} open={dlg === "esc"} onOpenChange={(v) => setDlg(v ? "esc" : null)} />

      <Dialog open={dlg === "source"} onOpenChange={(v) => !v && setDlg(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Original call <SourceBadge /></DialogTitle>
            <DialogDescription>{i.callId} · {fmtDateTime(i.callAt)} · {Math.floor(i.callDurationSec / 60)}m {i.callDurationSec % 60}s</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <Field label="Intent">{i.intent}</Field>
            <Field label="Buying signals"><div className="flex flex-wrap gap-1">{i.signals.map((s) => <Pill key={s} tone="info">{s}</Pill>)}</div></Field>
            <Field label="Conversation summary">{i.summary}</Field>
            <Field label="Customer requirement">{i.requirement}</Field>
            <Field label="Objections">{i.objections.join("; ")}</Field>
            <Field label="Recommended action">{i.recommendation}</Field>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "note"} onOpenChange={(v) => !v && setDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add note</DialogTitle><DialogDescription>{lead.customer}</DialogDescription></DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note for the team…" />
          <DialogFooter>
            <Button
              onClick={() => {
                if (!note.trim()) { toast.error("Write something first"); return; }
                addNote(lead.id, note);
                setNote("");
                toast.success("Note added to timeline");
                setDlg(null);
              }}
            >
              Add note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "stage"} onOpenChange={(v) => !v && setDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change stage</DialogTitle><DialogDescription>Current stage: {lead.stage}</DialogDescription></DialogHeader>
          <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={() => { changeStage(lead.id, stage); toast.success(`Stage changed to ${stage}`); setDlg(null); }}>Update stage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "assign"} onOpenChange={(v) => !v && setDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign lead</DialogTitle><DialogDescription>Owner is mandatory for every active lead</DialogDescription></DialogHeader>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger><SelectValue placeholder="Choose a sales executive" /></SelectTrigger>
            <SelectContent>
              {users.filter((u) => u.role === "Sales Executive").map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name} · {u.branch}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button disabled={!assignee} onClick={() => { assignLead(lead.id, assignee); toast.success("Lead assigned"); setDlg(null); }}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "complete"} onOpenChange={(v) => !v && setDlg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete follow-up</DialogTitle>
            <DialogDescription>{lead.nextAction ?? "Pending action"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Outcome</Label>
              <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} />
            </div>
            <div className="rounded-md border border-gold/40 bg-accent/40 p-3">
              <div className="text-xs font-bold">What is the next action?</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Input value={nextAct} onChange={(e) => setNextAct(e.target.value)} disabled={noNext} />
                <Input type="datetime-local" value={nextDue} onChange={(e) => setNextDue(e.target.value)} disabled={noNext} />
              </div>
              <label className="mt-2 flex items-center gap-2 text-[11px]">
                <input type="checkbox" checked={noNext} onChange={(e) => setNoNext(e.target.checked)} />
                No further action — I will convert or close this lead now
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!noNext && (!nextAct.trim() || Number.isNaN(new Date(nextDue).getTime())))
                  { toast.error("Set the next action and due time"); return; }
                completeFollowUp(lead.id, openFu?.id ?? "none", outcome, noNext ? undefined : { action: nextAct, dueAt: new Date(nextDue).getTime() });
                toast.success(noNext ? "Follow-up completed" : "Follow-up completed — next action scheduled");
                setDlg(null);
              }}
            >
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "convert"} onOpenChange={(v) => !v && setDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm conversion</DialogTitle><DialogDescription>{lead.customer} · {lead.id}</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Product *</Label>
              <Input value={convProduct} onChange={(e) => setConvProduct(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Conversion date *</Label>
              <Input type="datetime-local" value={convDate} onChange={(e) => setConvDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Value (₹) *</Label>
              <Input type="number" value={convValue} onChange={(e) => setConvValue(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Branch *</Label>
              <Input value={lead.branch} readOnly />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-xs">Closure notes *</Label>
              <Textarea value={convNotes} onChange={(e) => setConvNotes(e.target.value)} placeholder="How was the lead closed?" />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-success text-primary-foreground hover:bg-success/90"
              onClick={() => {
                if (!convProduct.trim() || !convNotes.trim() || !Number(convValue) || Number.isNaN(new Date(convDate).getTime()))
                  { toast.error("All conversion fields are mandatory"); return; }
                convertLead(lead.id, {
                  product: convProduct,
                  date: new Date(convDate).getTime(),
                  value: Number(convValue),
                  branch: lead.branch,
                  notes: convNotes,
                });
                toast.success("Lead converted — follow-ups and SLA stopped");
                setDlg(null);
              }}
            >
              Confirm Conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlg === "lost"} onOpenChange={(v) => !v && setDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark lead lost</DialogTitle><DialogDescription>A reason is mandatory — silent loss is not allowed.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Reason *</Label>
              <Select value={lossReason} onValueChange={setLossReason}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>{LOSS_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {lossReason === "Other" && (
              <div>
                <Label className="mb-1 block text-xs">Remarks * (required for Other)</Label>
                <Textarea value={lossRemarks} onChange={(e) => setLossRemarks(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (!lossReason) { toast.error("Select a loss reason"); return; }
                if (lossReason === "Other" && !lossRemarks.trim()) { toast.error("Remarks are required for Other"); return; }
                markLost(lead.id, lossReason, lossRemarks || undefined);
                toast.success("Lead marked lost and closed");
                setDlg(null);
              }}
            >
              Mark Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
