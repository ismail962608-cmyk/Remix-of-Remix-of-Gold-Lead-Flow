export type Role =
  | "Super Admin"
  | "Zonal Manager"
  | "Area Manager"
  | "Branch Manager"
  | "Sales Executive";

export type Stage =
  | "New"
  | "Assigned"
  | "Contacted"
  | "Qualified"
  | "Follow-up"
  | "Interested"
  | "Processing"
  | "Converted"
  | "Lost";

export const STAGES: Stage[] = [
  "New",
  "Assigned",
  "Contacted",
  "Qualified",
  "Follow-up",
  "Interested",
  "Processing",
  "Converted",
];

export type Temperature = "Hot" | "Warm" | "Cold";
export type LeadStatus = "Active" | "Converted" | "Lost";
export type Channel = "Call" | "WhatsApp" | "SMS" | "Email" | "Branch Visit";

export interface User {
  id: string;
  name: string;
  role: Role;
  zone?: string | undefined;
  area?: string | undefined;
  branch?: string | undefined;
  phone: string;
}

export interface Branch {
  id: string;
  name: string;
  area: string;
  zone: string;
}

export interface Activity {
  id: string;
  leadId: string;
  at: number;
  type:
    | "Detected"
    | "Assigned"
    | "Communication"
    | "Stage"
    | "Follow-up"
    | "Note"
    | "Escalation"
    | "Closure";
  user: string;
  action: string;
  notes?: string | undefined;
  channel?: Channel | undefined;
}

export interface FollowUp {
  id: string;
  at: number;
  channel: Channel;
  purpose: string;
  notes?: string | undefined;
  status: "Scheduled" | "Completed" | "Missed";
}

export interface Escalation {
  id: string;
  leadId: string;
  trigger: string;
  ruleId: string;
  severity: "Critical" | "High" | "Medium";
  escalatedTo: Role;
  at: number;
  breachMinutes: number;
  status: "Open" | "Resolved";
  resolution?: string | undefined;
}

export interface Intelligence {
  intent: string;
  signals: string[];
  requirement: string;
  objections: string[];
  summary: string;
  recommendation: string;
  callAt: number;
  callDurationSec: number;
  callId: string;
}

export interface Lead {
  id: string;
  customer: string;
  phone: string;
  product: string;
  score: number;
  scoreFactors: { label: string; points: number }[];
  temperature: Temperature;
  zone: string;
  area: string;
  branch: string;
  executiveId: string | null;
  createdAt: number;
  lastContactAt: number | null;
  nextAction: string | null;
  nextActionDueAt: number | null;
  nextActionReason?: string | undefined;
  stage: Stage;
  status: LeadStatus;
  value: number;
  source: "Voice Analytics";
  intelligence: Intelligence;
  followUps: FollowUp[];
  missedFollowUps: number;
  lossReason?: string | undefined;
  lossRemarks?: string | undefined;
  conversion?: {
    product: string;
    date: number;
    value: number;
    branch: string;
    notes: string;
  } | undefined;
}

export interface Notification {
  id: string;
  leadId: string;
  kind:
    | "New lead"
    | "SLA breach"
    | "Follow-up due"
    | "Escalation"
    | "Lead reassigned"
    | "Customer response";
  message: string;
  at: number;
  read: boolean;
}

export interface Rules {
  hotThreshold: number;
  warmThreshold: number;
  autoAssign: boolean;
  followUpMandatory: boolean;
  nextActionMandatory: boolean;
  slaHotMin: number;
  slaWarmMin: number;
  slaColdMin: number;
  followUpSlaMin: number;
  unassignedSlaMin: number;
  areaEscalationHours: number;
  zonalEscalationHours: number;
}

export const DEFAULT_RULES: Rules = {
  hotThreshold: 75,
  warmThreshold: 50,
  autoAssign: true,
  followUpMandatory: true,
  nextActionMandatory: true,
  slaHotMin: 15,
  slaWarmMin: 120,
  slaColdMin: 480,
  followUpSlaMin: 60,
  unassignedSlaMin: 30,
  areaEscalationHours: 24,
  zonalEscalationHours: 48,
};
