import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildDemoData, USERS } from "./demo-data";
import {
  DEFAULT_RULES,
  type Activity,
  type Channel,
  type Escalation,
  type FollowUp,
  type Lead,
  type Notification,
  type Rules,
  type Stage,
  type User,
} from "./types";

const MIN = 60_000;

export function slaMinutes(lead: Lead, rules: Rules) {
  return lead.temperature === "Hot"
    ? rules.slaHotMin
    : lead.temperature === "Warm"
      ? rules.slaWarmMin
      : rules.slaColdMin;
}

export type SlaState = "On Track" | "At Risk" | "Breached" | "Met" | "Closed";

export function firstContactDue(lead: Lead, rules: Rules) {
  return lead.createdAt + slaMinutes(lead, rules) * MIN;
}

export function slaStatus(lead: Lead, rules: Rules, now: number): SlaState {
  if (lead.status !== "Active") return "Closed";
  const due = firstContactDue(lead, rules);
  if (lead.lastContactAt) return lead.lastContactAt <= due ? "Met" : "Breached";
  if (now > due) return "Breached";
  const window = slaMinutes(lead, rules) * MIN;
  return now > due - window * 0.35 ? "At Risk" : "On Track";
}

export function isOverdue(lead: Lead, now: number) {
  return (
    lead.status === "Active" &&
    lead.nextActionDueAt != null &&
    lead.nextActionDueAt < now
  );
}

export function leadHealth(lead: Lead, rules: Rules, now: number) {
  const sla = slaStatus(lead, rules, now);
  if (sla === "Breached") return "SLA Breached" as const;
  if (sla === "At Risk" || isOverdue(lead, now) || lead.missedFollowUps > 0)
    return "At Risk" as const;
  return "Healthy" as const;
}

export function riskLevel(lead: Lead, rules: Rules, now: number) {
  if (lead.status !== "Active") return "None" as const;
  let pts = 0;
  if (slaStatus(lead, rules, now) === "Breached") pts += 2;
  if (isOverdue(lead, now)) pts += 2;
  if (lead.missedFollowUps >= 2) pts += 2;
  else if (lead.missedFollowUps === 1) pts += 1;
  if (!lead.lastContactAt && now - lead.createdAt > 24 * 60 * MIN) pts += 2;
  if (lead.temperature === "Hot") pts += 1;
  return pts >= 4 ? ("High" as const) : pts >= 2 ? ("Medium" as const) : ("Low" as const);
}

export function stickyGaps(lead: Lead) {
  if (lead.status !== "Active") return [];
  const gaps: string[] = [];
  if (!lead.executiveId) gaps.push("Owner");
  if (!lead.nextAction) gaps.push("Next Action");
  if (!lead.nextActionDueAt) gaps.push("Due Time");
  if (!lead.stage) gaps.push("Stage");
  return gaps;
}

export function urgencyScore(lead: Lead, rules: Rules, now: number) {
  let s = lead.score;
  const sla = slaStatus(lead, rules, now);
  if (sla === "Breached") s += 120;
  if (sla === "At Risk") s += 60;
  if (isOverdue(lead, now))
    s += 80 + Math.min(60, (now - (lead.nextActionDueAt ?? now)) / (60 * MIN));
  if (!lead.executiveId) s += 70;
  if (stickyGaps(lead).length) s += 40;
  s += lead.missedFollowUps * 30;
  return s;
}

export function computeEscalations(
  leads: Lead[],
  rules: Rules,
  now: number,
  resolved: Record<string, string>,
): Escalation[] {
  const out: Escalation[] = [];
  const add = (
    lead: Lead,
    ruleId: string,
    trigger: string,
    severity: Escalation["severity"],
    to: Escalation["escalatedTo"],
    since: number,
  ) => {
    const id = `${lead.id}-${ruleId}`;
    out.push({
      id,
      leadId: lead.id,
      ruleId,
      trigger,
      severity,
      escalatedTo: to,
      at: since,
      breachMinutes: Math.max(0, Math.round((now - since) / MIN)),
      status: resolved[id] ? "Resolved" : "Open",
      resolution: resolved[id],
    });
  };

  for (const lead of leads) {
    if (lead.status !== "Active") continue;
    const due = firstContactDue(lead, rules);
    if (!lead.executiveId && now - lead.createdAt > rules.unassignedSlaMin * MIN)
      add(lead, "R1", "Lead unassigned beyond SLA", "High", "Branch Manager", lead.createdAt + rules.unassignedSlaMin * MIN);
    if (!lead.lastContactAt && now > due)
      add(lead, "R2", "First-contact SLA breached", lead.temperature === "Hot" ? "Critical" : "High", "Branch Manager", due);
    if (lead.temperature === "Hot" && !lead.lastContactAt && now - lead.createdAt > 60 * MIN)
      add(lead, "R3", "Hot lead untouched for 1 hour", "Critical", "Branch Manager", lead.createdAt + 60 * MIN);
    if (lead.missedFollowUps >= 2)
      add(lead, "R4", "Follow-up missed twice", "High", "Branch Manager", lead.nextActionDueAt ?? lead.createdAt);
    if (lead.nextActionDueAt && now - lead.nextActionDueAt > rules.areaEscalationHours * 60 * MIN)
      add(lead, "R5", `Lead overdue > ${rules.areaEscalationHours}h`, "High", "Area Manager", lead.nextActionDueAt + rules.areaEscalationHours * 60 * MIN);
    if (lead.nextActionDueAt && now - lead.nextActionDueAt > rules.zonalEscalationHours * 60 * MIN)
      add(lead, "R6", `Lead overdue > ${rules.zonalEscalationHours}h`, "Critical", "Zonal Manager", lead.nextActionDueAt + rules.zonalEscalationHours * 60 * MIN);
  }
  return out.sort((a, b) => a.at - b.at);
}

interface Ctx {
  ready: boolean;
  now: number;
  leads: Lead[];
  activities: Activity[];
  users: User[];
  rules: Rules;
  currentUser: User;
  setCurrentUser: (u: User) => void;
  setRules: (r: Rules) => void;
  escalations: Escalation[];
  notifications: Notification[];
  markNotificationsRead: () => void;
  visibleLeads: Lead[];
  getLead: (id: string) => Lead | undefined;
  leadActivities: (id: string) => Activity[];
  logCommunication: (leadId: string, channel: Channel, message: string, outcome?: string) => void;
  addNote: (leadId: string, note: string) => void;
  changeStage: (leadId: string, stage: Stage) => void;
  setNextAction: (leadId: string, action: string, dueAt: number, reason?: string) => void;
  scheduleFollowUp: (leadId: string, fu: Omit<FollowUp, "id" | "status">) => void;
  completeFollowUp: (leadId: string, followUpId: string, outcome: string, next?: { action: string; dueAt: number }) => void;
  assignLead: (leadId: string, executiveId: string) => void;
  convertLead: (leadId: string, payload: { product: string; date: number; value: number; branch: string; notes: string }) => void;
  markLost: (leadId: string, reason: string, remarks?: string) => void;
  resolveEscalation: (escalationId: string, resolution: string) => void;
  escalateLead: (leadId: string, reason: string, to: Escalation["escalatedTo"]) => void;
  userById: (id: string | null) => User | undefined;
}

const GoldFlowContext = createContext<Ctx | null>(null);

let uid = 0;
const nextId = () => `x${Date.now().toString(36)}${uid++}`;

export function GoldFlowProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [extraNotifs, setExtraNotifs] = useState<Notification[]>([]);
  const [manual, setManual] = useState<Escalation[]>([]);
  const [readAt, setReadAt] = useState(0);
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]!);

  useEffect(() => {
    const t = Date.now();
    const seed = buildDemoData(t);
    setLeads(seed.leads);
    setActivities(seed.activities);
    setNow(t);
    setReady(true);
    const iv = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(iv);
  }, []);

  const pushActivity = useCallback((a: Omit<Activity, "id">) => {
    setActivities((prev) => [...prev, { ...a, id: nextId() }]);
  }, []);

  const patch = useCallback((leadId: string, fn: (l: Lead) => Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? fn(l) : l)));
  }, []);

  const userById = useCallback(
    (id: string | null) => (id ? USERS.find((u) => u.id === id) : undefined),
    [],
  );

  const actorName = currentUser.name;

  const logCommunication: Ctx["logCommunication"] = useCallback(
    (leadId, channel, message, outcome) => {
      const at = Date.now();
      patch(leadId, (l) => ({
        ...l,
        lastContactAt: at,
        stage: l.stage === "New" || l.stage === "Assigned" ? "Contacted" : l.stage,
      }));
      pushActivity({
        leadId,
        at,
        type: "Communication",
        channel,
        user: actorName,
        action: `${channel} ${channel === "Call" ? "logged" : "sent"}${outcome ? ` — ${outcome}` : ""}`,
        notes: message,
      });
    },
    [patch, pushActivity, actorName],
  );

  const addNote: Ctx["addNote"] = useCallback(
    (leadId, note) => {
      pushActivity({ leadId, at: Date.now(), type: "Note", user: actorName, action: "Note added", notes: note });
    },
    [pushActivity, actorName],
  );

  const changeStage: Ctx["changeStage"] = useCallback(
    (leadId, stage) => {
      patch(leadId, (l) => ({ ...l, stage }));
      pushActivity({ leadId, at: Date.now(), type: "Stage", user: actorName, action: `Stage changed to ${stage}` });
    },
    [patch, pushActivity, actorName],
  );

  const setNextAction: Ctx["setNextAction"] = useCallback(
    (leadId, action, dueAt, reason) => {
      patch(leadId, (l) => ({ ...l, nextAction: action, nextActionDueAt: dueAt, nextActionReason: reason ?? l.nextActionReason }));
      pushActivity({
        leadId,
        at: Date.now(),
        type: "Follow-up",
        user: actorName,
        action: `Next action set — ${action}`,
        notes: `Due ${new Date(dueAt).toLocaleString("en-IN")}`,
      });
    },
    [patch, pushActivity, actorName],
  );

  const scheduleFollowUp: Ctx["scheduleFollowUp"] = useCallback(
    (leadId, fu) => {
      const id = nextId();
      patch(leadId, (l) => ({
        ...l,
        followUps: [...l.followUps, { ...fu, id, status: "Scheduled" }],
        nextAction: `${fu.channel} — ${fu.purpose}`,
        nextActionDueAt: fu.at,
        stage: l.stage === "New" || l.stage === "Assigned" || l.stage === "Contacted" ? "Follow-up" : l.stage,
      }));
      pushActivity({
        leadId,
        at: Date.now(),
        type: "Follow-up",
        user: actorName,
        action: `Follow-up scheduled via ${fu.channel}`,
        notes: `${fu.purpose} · ${new Date(fu.at).toLocaleString("en-IN")}${fu.notes ? ` · ${fu.notes}` : ""}`,
      });
    },
    [patch, pushActivity, actorName],
  );

  const completeFollowUp: Ctx["completeFollowUp"] = useCallback(
    (leadId, followUpId, outcome, next) => {
      patch(leadId, (l) => ({
        ...l,
        lastContactAt: Date.now(),
        followUps: l.followUps.map((f) => (f.id === followUpId ? { ...f, status: "Completed" } : f)),
        nextAction: next?.action ?? null,
        nextActionDueAt: next?.dueAt ?? null,
      }));
      pushActivity({ leadId, at: Date.now(), type: "Follow-up", user: actorName, action: "Follow-up completed", notes: outcome });
      if (next)
        pushActivity({
          leadId,
          at: Date.now() + 1,
          type: "Follow-up",
          user: actorName,
          action: `Next action set — ${next.action}`,
          notes: `Due ${new Date(next.dueAt).toLocaleString("en-IN")}`,
        });
    },
    [patch, pushActivity, actorName],
  );

  const assignLead: Ctx["assignLead"] = useCallback(
    (leadId, executiveId) => {
      const exec = USERS.find((u) => u.id === executiveId);
      patch(leadId, (l) => ({
        ...l,
        executiveId,
        branch: exec?.branch ?? l.branch,
        area: exec?.area ?? l.area,
        zone: exec?.zone ?? l.zone,
        stage: l.stage === "New" ? "Assigned" : l.stage,
        nextAction: l.nextAction ?? "First contact call",
        nextActionDueAt: l.nextActionDueAt ?? Date.now() + 15 * MIN,
      }));
      pushActivity({ leadId, at: Date.now(), type: "Assigned", user: actorName, action: `Assigned to ${exec?.name ?? executiveId}` });
      setExtraNotifs((p) => [
        { id: nextId(), leadId, kind: "Lead reassigned", message: `${leadId} reassigned to ${exec?.name}`, at: Date.now(), read: false },
        ...p,
      ]);
    },
    [patch, pushActivity, actorName],
  );

  const convertLead: Ctx["convertLead"] = useCallback(
    (leadId, payload) => {
      patch(leadId, (l) => ({
        ...l,
        status: "Converted",
        stage: "Converted",
        conversion: payload,
        nextAction: null,
        nextActionDueAt: null,
        followUps: l.followUps.map((f) => (f.status === "Scheduled" ? { ...f, status: "Completed" } : f)),
      }));
      pushActivity({
        leadId,
        at: Date.now(),
        type: "Closure",
        user: actorName,
        action: `Lead converted — ₹${payload.value.toLocaleString("en-IN")} (${payload.product})`,
        notes: payload.notes,
      });
    },
    [patch, pushActivity, actorName],
  );

  const markLost: Ctx["markLost"] = useCallback(
    (leadId, reason, remarks) => {
      patch(leadId, (l) => ({
        ...l,
        status: "Lost",
        stage: "Lost",
        lossReason: reason,
        lossRemarks: remarks,
        nextAction: null,
        nextActionDueAt: null,
        followUps: l.followUps.map((f) => (f.status === "Scheduled" ? { ...f, status: "Missed" } : f)),
      }));
      pushActivity({ leadId, at: Date.now(), type: "Closure", user: actorName, action: `Lead marked lost — ${reason}`, notes: remarks });
    },
    [patch, pushActivity, actorName],
  );

  const resolveEscalation: Ctx["resolveEscalation"] = useCallback(
    (escalationId, resolution) => {
      setResolved((p) => ({ ...p, [escalationId]: resolution }));
      const leadId = escalationId.split("-").slice(0, 2).join("-");
      pushActivity({ leadId, at: Date.now(), type: "Escalation", user: actorName, action: "Escalation resolved", notes: resolution });
    },
    [pushActivity, actorName],
  );

  const escalateLead: Ctx["escalateLead"] = useCallback(
    (leadId, reason, to) => {
      const at = Date.now();
      setManual((p) => [
        ...p,
        {
          id: `${leadId}-M${p.length}`,
          leadId,
          ruleId: "MANUAL",
          trigger: reason,
          severity: "High",
          escalatedTo: to,
          at,
          breachMinutes: 0,
          status: "Open",
        },
      ]);
      pushActivity({ leadId, at, type: "Escalation", user: actorName, action: `Escalated to ${to}`, notes: reason });
    },
    [pushActivity, actorName],
  );

  const escalations = useMemo(
    () =>
      [...computeEscalations(leads, rules, now, resolved), ...manual.map((m) => ({ ...m, status: resolved[m.id] ? ("Resolved" as const) : m.status, resolution: resolved[m.id], breachMinutes: Math.round((now - m.at) / MIN) }))].sort(
        (a, b) => a.at - b.at,
      ),
    [leads, rules, now, resolved, manual],
  );


  const visibleLeads = useMemo(() => {
    const u = currentUser;
    return leads.filter((l) => {
      if (u.role === "Super Admin") return true;
      if (u.role === "Zonal Manager") return l.zone === u.zone;
      if (u.role === "Area Manager") return l.area === u.area;
      if (u.role === "Branch Manager") return l.branch === u.branch;
      return l.executiveId === u.id;
    });
  }, [leads, currentUser]);

  const notifications = useMemo(() => {
    const list: Notification[] = [...extraNotifs];
    for (const e of escalations.filter((x) => x.status === "Open").slice(0, 6)) {
      list.push({
        id: `n-${e.id}`,
        leadId: e.leadId,
        kind: e.trigger.includes("SLA") ? "SLA breach" : "Escalation",
        message: `${e.leadId}: ${e.trigger} → ${e.escalatedTo}`,
        at: e.at,
        read: e.at <= readAt,
      });
    }
    for (const l of visibleLeads.filter((x) => x.status === "Active" && x.createdAt > now - 60 * MIN).slice(0, 5)) {
      list.push({
        id: `n-new-${l.id}`,
        leadId: l.id,
        kind: "New lead",
        message: `${l.customer} — ${l.temperature} lead detected by Voice Analytics`,
        at: l.createdAt,
        read: l.createdAt <= readAt,
      });
    }
    for (const l of visibleLeads
      .filter((x) => x.status === "Active" && x.nextActionDueAt && x.nextActionDueAt > now && x.nextActionDueAt < now + 120 * MIN)
      .slice(0, 5)) {
      list.push({
        id: `n-fu-${l.id}`,
        leadId: l.id,
        kind: "Follow-up due",
        message: `${l.customer} — ${l.nextAction} due soon`,
        at: l.nextActionDueAt!,
        read: readAt > now - 1,
      });
    }
    return list.sort((a, b) => b.at - a.at).slice(0, 20);
  }, [extraNotifs, escalations, visibleLeads, now, readAt]);

  const value: Ctx = {
    ready,
    now,
    leads,
    activities,
    users: USERS,
    rules,
    currentUser,
    setCurrentUser,
    setRules,
    escalations,
    notifications,
    markNotificationsRead: () => setReadAt(Date.now()),
    visibleLeads,
    getLead: (id) => leads.find((l) => l.id === id),
    leadActivities: (id) => activities.filter((a) => a.leadId === id).sort((a, b) => a.at - b.at),
    logCommunication,
    addNote,
    changeStage,
    setNextAction,
    scheduleFollowUp,
    completeFollowUp,
    assignLead,
    convertLead,
    markLost,
    resolveEscalation,
    escalateLead,
    userById,
  };

  return <GoldFlowContext.Provider value={value}>{children}</GoldFlowContext.Provider>;
}

export function useGoldFlow() {
  const ctx = useContext(GoldFlowContext);
  if (!ctx) throw new Error("useGoldFlow must be used inside GoldFlowProvider");
  return ctx;
}
