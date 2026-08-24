import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, CalendarPlus, ArrowUpCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useGoldFlow } from "@/lib/goldflow/store";
import type { Channel, Lead, Role } from "@/lib/goldflow/types";
import { toLocalInput } from "@/lib/goldflow/format";

export function CallDialog({ lead, open, onOpenChange }: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { logCommunication, setNextAction } = useGoldFlow();
  const [outcome, setOutcome] = useState("Connected — interested");
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Call {lead.customer}</DialogTitle>
          <DialogDescription>{lead.phone} · Demo call — record the outcome below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs">Call outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Connected — interested", "Connected — needs time", "Connected — not interested", "No answer", "Busy / call back later", "Wrong number"].map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did the customer say?" />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              logCommunication(lead.id, "Call", notes || outcome, outcome);
              if (outcome.startsWith("No answer") || outcome.startsWith("Busy")) {
                setNextAction(lead.id, "Retry call", Date.now() + 2 * 3600_000, "Customer did not answer the first attempt.");
              }
              toast.success("Call logged to lead timeline");
              onOpenChange(false);
            }}
          >
            Log call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MessageDialog({
  lead, channel, open, onOpenChange,
}: { lead: Lead; channel: Channel; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { logCommunication } = useGoldFlow();
  const [msg, setMsg] = useState(
    `Namaste ${lead.customer.split(" ")[0]}, this is Manappuram Gold ${lead.branch}. Regarding your ${lead.product} enquiry — we can offer the best per-gram rate today. May I share the details?`,
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{channel} to {lead.customer}</DialogTitle>
          <DialogDescription>{lead.phone} · Simulated in the demo environment.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted p-3">
          <Textarea rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} className="bg-card" />
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              logCommunication(lead.id, channel, msg, "sent");
              toast.success(`${channel} sent — recorded in timeline`);
              onOpenChange(false);
            }}
          >
            Send {channel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FollowUpDialog({
  lead, open, onOpenChange,
}: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { scheduleFollowUp } = useGoldFlow();
  const [when, setWhen] = useState(toLocalInput(Date.now() + 3600_000));
  const [channel, setChannel] = useState<Channel>("Call");
  const [purpose, setPurpose] = useState("Discuss pledge value and confirm branch visit");
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
          <DialogDescription>{lead.customer} · {lead.id}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <Label className="mb-1 block text-xs">Date &amp; time</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Call", "WhatsApp", "SMS", "Email", "Branch Visit"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs">Purpose</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const at = new Date(when).getTime();
              if (Number.isNaN(at)) {
                toast.error("Pick a valid date and time");
                return;
              }
              scheduleFollowUp(lead.id, { at, channel, purpose, notes });
              toast.success("Follow-up scheduled — next action set");
              onOpenChange(false);
            }}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EscalateDialog({
  lead, open, onOpenChange,
}: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { escalateLead } = useGoldFlow();
  const [to, setTo] = useState<Role>("Branch Manager");
  const [reason, setReason] = useState("Manual escalation — needs manager intervention");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escalate lead</DialogTitle>
          <DialogDescription>{lead.customer} · {lead.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs">Escalate to</Label>
            <Select value={to} onValueChange={(v) => setTo(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Branch Manager", "Area Manager", "Zonal Manager"].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              escalateLead(lead.id, reason, to);
              toast.success(`Escalated to ${to}`);
              onOpenChange(false);
            }}
          >
            Escalate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function QuickActions({ lead, showOpen = true }: { lead: Lead; showOpen?: boolean }) {
  const [dlg, setDlg] = useState<null | "call" | "wa" | "fu" | "esc">(null);
  return (
    <div className="flex items-center gap-1">
      {showOpen && (
        <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
          <Link to="/leads/$leadId" params={{ leadId: lead.id }}>
            <ExternalLink className="h-3 w-3" /> Open
          </Link>
        </Button>
      )}
      <Button size="icon" variant="ghost" className="h-7 w-7" title="Call" onClick={() => setDlg("call")}>
        <Phone className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" title="WhatsApp" onClick={() => setDlg("wa")}>
        <MessageCircle className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" title="Schedule follow-up" onClick={() => setDlg("fu")}>
        <CalendarPlus className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Escalate" onClick={() => setDlg("esc")}>
        <ArrowUpCircle className="h-3.5 w-3.5" />
      </Button>
      <CallDialog lead={lead} open={dlg === "call"} onOpenChange={(v) => setDlg(v ? "call" : null)} />
      <MessageDialog lead={lead} channel="WhatsApp" open={dlg === "wa"} onOpenChange={(v) => setDlg(v ? "wa" : null)} />
      <FollowUpDialog lead={lead} open={dlg === "fu"} onOpenChange={(v) => setDlg(v ? "fu" : null)} />
      <EscalateDialog lead={lead} open={dlg === "esc"} onOpenChange={(v) => setDlg(v ? "esc" : null)} />
    </div>
  );
}
