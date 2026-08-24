import type {
  Activity,
  Branch,
  FollowUp,
  Lead,
  Stage,
  Temperature,
  User,
} from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;

function mulberry(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ZONES = ["South Zone", "West Zone", "North Zone"];

export const BRANCHES: Branch[] = [
  { id: "BR01", name: "Kochi Main", area: "Ernakulam", zone: "South Zone" },
  { id: "BR02", name: "Thrissur Round", area: "Ernakulam", zone: "South Zone" },
  { id: "BR03", name: "Trivandrum Central", area: "Trivandrum", zone: "South Zone" },
  { id: "BR04", name: "Kollam Junction", area: "Trivandrum", zone: "South Zone" },
  { id: "BR05", name: "Pune Camp", area: "Pune", zone: "West Zone" },
  { id: "BR06", name: "Andheri West", area: "Mumbai", zone: "West Zone" },
  { id: "BR07", name: "Surat Ring Road", area: "Mumbai", zone: "West Zone" },
  { id: "BR08", name: "Jaipur MI Road", area: "Rajasthan", zone: "North Zone" },
  { id: "BR09", name: "Delhi Karol Bagh", area: "Delhi NCR", zone: "North Zone" },
  { id: "BR10", name: "Noida Sector 18", area: "Delhi NCR", zone: "North Zone" },
];

const EXEC_NAMES = [
  "Arjun Menon", "Divya Nair", "Rahul Pillai", "Sneha Varma", "Vishnu Das",
  "Kavya Raj", "Manoj Kurup", "Anita Joseph", "Rohit Shetty", "Pooja Iyer",
  "Sameer Khan", "Neha Deshmukh", "Kunal Bhatt", "Ritu Chauhan", "Aman Verma",
  "Priya Sharma", "Nikhil Rao", "Farhan Ali", "Meera Krishnan", "Sanjay Gupta",
];

export const USERS: User[] = [
  { id: "U000", name: "Ananya Suresh", role: "Super Admin", phone: "+91 98470 10000" },
  { id: "U001", name: "Ramesh Kartha", role: "Zonal Manager", zone: "South Zone", phone: "+91 98470 10001" },
  { id: "U002", name: "Sunil Patil", role: "Zonal Manager", zone: "West Zone", phone: "+91 98470 10002" },
  { id: "U003", name: "Harish Yadav", role: "Zonal Manager", zone: "North Zone", phone: "+91 98470 10003" },
  { id: "U010", name: "Lakshmi Menon", role: "Area Manager", zone: "South Zone", area: "Ernakulam", phone: "+91 98470 10010" },
  { id: "U011", name: "Gopal Nambiar", role: "Area Manager", zone: "South Zone", area: "Trivandrum", phone: "+91 98470 10011" },
  { id: "U012", name: "Deepak Joshi", role: "Area Manager", zone: "West Zone", area: "Pune", phone: "+91 98470 10012" },
  { id: "U013", name: "Farida Sheikh", role: "Area Manager", zone: "West Zone", area: "Mumbai", phone: "+91 98470 10013" },
  { id: "U014", name: "Vikram Singh", role: "Area Manager", zone: "North Zone", area: "Rajasthan", phone: "+91 98470 10014" },
  { id: "U015", name: "Neelam Kapoor", role: "Area Manager", zone: "North Zone", area: "Delhi NCR", phone: "+91 98470 10015" },
  ...BRANCHES.map((b, i) => ({
    id: `U1${String(i).padStart(2, "0")}`,
    name: [
      "Jose Mathew", "Bindu Krishnan", "Satheesh Kumar", "Reena Thomas", "Amol Kale",
      "Zaid Ansari", "Hetal Patel", "Mahesh Meena", "Rajiv Malhotra", "Swati Bansal",
    ][i]!,
    role: "Branch Manager" as const,
    zone: b.zone,
    area: b.area,
    branch: b.name,
    phone: `+91 98470 11${String(i).padStart(2, "0")}`,
  })),
  ...EXEC_NAMES.map((name, i) => {
    const b = BRANCHES[i % BRANCHES.length]!;
    return {
      id: `U2${String(i).padStart(2, "0")}`,
      name,
      role: "Sales Executive" as const,
      zone: b.zone,
      area: b.area,
      branch: b.name,
      phone: `+91 98470 12${String(i).padStart(2, "0")}`,
    };
  }),
];

export const EXECUTIVES = USERS.filter((u) => u.role === "Sales Executive");

const FIRST = [
  "Ravi", "Sita", "Anil", "Geeta", "Mohan", "Latha", "Suresh", "Bhavana", "Prakash", "Nisha",
  "Joseph", "Fatima", "Karthik", "Shalini", "Ganesh", "Renuka", "Dinesh", "Asha", "Vinod", "Jyothi",
  "Hari", "Maya", "Naveen", "Rekha", "Tarun", "Usha", "Yash", "Zara", "Bala", "Chitra",
];
const LAST = [
  "Kumar", "Nair", "Reddy", "Sharma", "Pillai", "Menon", "Shah", "Patel", "Rao", "Das",
  "Thomas", "Joshi", "Singh", "Iyer", "Bose",
];

const PRODUCTS = [
  "Gold Loan",
  "Gold Loan Top-up",
  "Gold Loan Takeover",
  "Micro Finance",
  "Vehicle Loan",
  "Digital Gold",
];

const REQUIREMENTS = [
  "Needs ₹3,50,000 against 85g ornaments for daughter's education",
  "Wants to take over an existing gold loan at a lower rate of interest",
  "Requires ₹1,20,000 working capital for shop expansion this week",
  "Looking for a top-up of ₹75,000 on an existing pledge",
  "Enquiring about per-gram rate and 3-month interest-only scheme",
  "Wants ₹6,00,000 for a medical emergency, ready to visit branch today",
];

const OBJECTIONS = [
  "Interest rate seems higher than competitor",
  "Concerned about gold safety and storage",
  "Wants a longer repayment tenure",
  "Asked about hidden processing charges",
  "Needs spouse's approval before pledging",
  "No objection raised on the call",
];

const SIGNALS = [
  "Asked about eligibility",
  "Asked about loan amount",
  "Requested callback",
  "Asked per-gram rate",
  "Asked about branch timings",
  "Mentioned urgent requirement",
  "Compared with competitor offer",
  "Asked about documentation",
];

const FACTORS = [
  { label: "Strong buying intent", points: 25 },
  { label: "Callback requested", points: 20 },
  { label: "Product-specific enquiry", points: 15 },
  { label: "Amount discussed", points: 15 },
  { label: "Positive response", points: 12 },
  { label: "Repeat customer", points: 10 },
  { label: "Urgency expressed", points: 8 },
];

export function temperatureFor(score: number): Temperature {
  return score >= 75 ? "Hot" : score >= 50 ? "Warm" : "Cold";
}

export function slaMinutesFor(t: Temperature) {
  return t === "Hot" ? 15 : t === "Warm" ? 120 : 480;
}

export interface DemoSeed {
  leads: Lead[];
  activities: Activity[];
}

export function buildDemoData(now: number): DemoSeed {
  const rnd = mulberry(20260823);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]!;
  const leads: Lead[] = [];
  const activities: Activity[] = [];
  const total = 124;

  for (let i = 0; i < total; i++) {
    const branch = BRANCHES[Math.floor(rnd() * BRANCHES.length)]!;
    const execPool = EXECUTIVES.filter((e) => e.branch === branch.name);
    const exec = execPool[Math.floor(rnd() * execPool.length)]!;
    const bucket = rnd();
    const ageMin =
      bucket < 0.12
        ? rnd() * 55
        : bucket < 0.3
          ? 60 + rnd() * 180
          : bucket < 0.55
            ? 240 + rnd() * 1200
            : bucket < 0.75
              ? 1440 + rnd() * 2880
              : bucket < 0.9
                ? 4320 + rnd() * 5760
                : 10080 + rnd() * 20160;
    const createdAt = now - ageMin * MIN;
    const score = Math.round(28 + rnd() * 70);
    const temperature = temperatureFor(score);
    const factors = FACTORS.filter(() => rnd() > 0.35).slice(0, 5);
    if (!factors.length) factors.push(FACTORS[0]!);

    const r = rnd();
    let stage: Stage;
    if (ageMin < 60) stage = r < 0.55 ? "New" : "Assigned";
    else if (r < 0.08) stage = "New";
    else if (r < 0.2) stage = "Assigned";
    else if (r < 0.36) stage = "Contacted";
    else if (r < 0.48) stage = "Qualified";
    else if (r < 0.62) stage = "Follow-up";
    else if (r < 0.72) stage = "Interested";
    else if (r < 0.8) stage = "Processing";
    else if (r < 0.92) stage = "Converted";
    else stage = "Lost";

    const status =
      stage === "Converted" ? "Converted" : stage === "Lost" ? "Lost" : "Active";
    const contacted = !["New", "Assigned"].includes(stage);
    const lastContactAt = contacted
      ? createdAt + Math.min(ageMin * 0.4, 60 + rnd() * 600) * MIN
      : null;

    const value = Math.round((50000 + rnd() * 900000) / 5000) * 5000;
    const id = `LD-${String(10234 + i)}`;

    const nextActionPool = [
      "Call customer",
      "Send WhatsApp offer details",
      "Confirm branch visit",
      "Share rate card on WhatsApp",
      "Collect KYC documents",
      "Verify gold weight estimate",
    ];

    let nextAction: string | null = null;
    let nextActionDueAt: number | null = null;
    if (status === "Active") {
      // ~8% of leads intentionally violate the sticky-lead rule
      if (rnd() > 0.08) {
        nextAction = stage === "New" || stage === "Assigned" ? "First contact call" : pick(nextActionPool);
        const offset = (rnd() - 0.55) * 2 * 24 * 60;
        nextActionDueAt = now + offset * MIN;
      }
    }

    const lead: Lead = {
      id,
      customer: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `+91 9${Math.floor(100000000 + rnd() * 899999999)}`,
      product: pick(PRODUCTS),
      score,
      scoreFactors: factors,
      temperature,
      zone: branch.zone,
      area: branch.area,
      branch: branch.name,
      executiveId: stage === "New" && rnd() > 0.4 ? null : exec.id,
      createdAt,
      lastContactAt,
      nextAction,
      nextActionDueAt,
      nextActionReason:
        temperature === "Hot"
          ? "Customer requested a callback regarding gold loan requirements."
          : "Scheduled engagement to keep the lead progressing.",
      stage,
      status,
      value,
      source: "Voice Analytics",
      intelligence: {
        intent: `${temperature === "Hot" ? "High" : temperature === "Warm" ? "Moderate" : "Low"} intent — ${pick(PRODUCTS)} enquiry`,
        signals: SIGNALS.filter(() => rnd() > 0.55).slice(0, 4),
        requirement: pick(REQUIREMENTS),
        objections: [pick(OBJECTIONS)],
        summary:
          "Customer called the branch helpline to check pledge value and interest rates. The agent explained the per-gram rate and schemes. Customer confirmed they hold ornaments and asked to be contacted by the branch executive.",
        recommendation:
          temperature === "Hot"
            ? "Customer has shown strong intent and requested a callback. Contact within the next 30 minutes."
            : "Share scheme details on WhatsApp and follow up within 24 hours.",
        callAt: createdAt - 4 * MIN,
        callDurationSec: Math.round(90 + rnd() * 420),
        callId: `VA-${88210 + i}`,
      },
      followUps: [],
      missedFollowUps: rnd() > 0.82 ? 2 : rnd() > 0.6 ? 1 : 0,
    };

    if (lead.intelligence.signals.length === 0)
      lead.intelligence.signals = ["Asked about eligibility", "Requested callback"];

    if (status === "Converted") {
      lead.conversion = {
        product: lead.product,
        date: createdAt + Math.max(ageMin * 0.7, 120) * MIN,
        value,
        branch: lead.branch,
        notes: "Customer visited branch, gold appraised and loan disbursed.",
      };
      lead.nextAction = null;
      lead.nextActionDueAt = null;
    }
    if (status === "Lost") {
      lead.lossReason = pick([
        "Not Interested",
        "No Response",
        "Competitor",
        "Rate/Terms",
        "Not Eligible",
        "Deferred",
      ]);
      lead.nextAction = null;
      lead.nextActionDueAt = null;
    }

    // pending follow-up
    if (status === "Active" && ["Follow-up", "Interested", "Qualified"].includes(stage)) {
      lead.followUps.push({
        id: `${id}-F1`,
        at: nextActionDueAt ?? now + HOUR,
        channel: pick<FollowUp["channel"]>(["Call", "WhatsApp", "SMS"]),
        purpose: "Discuss pledge value and confirm branch visit",
        status: "Scheduled",
      });
    }

    leads.push(lead);

    // timeline
    const execName: string = USERS.find((u) => u.id === lead.executiveId)?.name ?? "Unassigned";
    activities.push({
      id: `${id}-A0`,
      leadId: id,
      at: lead.intelligence.callAt,
      type: "Detected",
      user: "Voice Analytics",
      action: "Lead detected from customer call",
      notes: `${lead.intelligence.intent} · Call ${lead.intelligence.callId}`,
    });
    if (lead.executiveId) {
      activities.push({
        id: `${id}-A1`,
        leadId: id,
        at: createdAt + 2 * MIN,
        type: "Assigned",
        user: "Auto-assignment",
        action: `Assigned to ${execName} (${lead.branch})`,
      });
    }
    if (lastContactAt) {
      activities.push({
        id: `${id}-A2`,
        leadId: id,
        at: lastContactAt,
        type: "Communication",
        channel: "Call",
        user: execName,
        action: "Outbound call — connected",
        notes: "Customer confirmed interest and requirement discussed.",
      });
      activities.push({
        id: `${id}-A3`,
        leadId: id,
        at: lastContactAt + 5 * MIN,
        type: "Stage",
        user: execName,
        action: `Stage changed to ${stage}`,
      });
    }
    if (lead.conversion) {
      activities.push({
        id: `${id}-A4`,
        leadId: id,
        at: lead.conversion.date,
        type: "Closure",
        user: execName,
        action: `Lead converted — ₹${lead.conversion.value.toLocaleString("en-IN")}`,
        notes: lead.conversion.notes,
      });
    }
    if (lead.lossReason) {
      activities.push({
        id: `${id}-A5`,
        leadId: id,
        at: createdAt + ageMin * 0.8 * MIN,
        type: "Closure",
        user: execName,
        action: `Lead marked lost — ${lead.lossReason}`,
      });
    }
  }

  // Guarantee the hero demo lead
  const hero = leads[0]!;
  hero.customer = "Ravi Krishnan";
  hero.id = "LD-10234";
  hero.score = 87;
  hero.temperature = "Hot";
  hero.product = "Gold Loan";
  hero.stage = "Assigned";
  hero.status = "Active";
  hero.branch = "Kochi Main";
  hero.area = "Ernakulam";
  hero.zone = "South Zone";
  hero.executiveId = EXECUTIVES[0]!.id;
  hero.createdAt = now - 9 * MIN;
  hero.lastContactAt = null;
  hero.nextAction = "Call customer";
  hero.nextActionDueAt = now + 6 * MIN;
  hero.nextActionReason = "Customer requested callback regarding gold loan requirements.";
  hero.value = 350000;
  hero.scoreFactors = FACTORS.slice(0, 5);
  hero.intelligence = {
    ...hero.intelligence,
    intent: "High intent — Gold Loan enquiry",
    signals: ["Asked about eligibility", "Asked about amount", "Requested callback"],
    requirement: "Needs ₹3,50,000 against 85g ornaments for daughter's education",
    objections: ["Interest rate seems higher than a competitor offer"],
    recommendation:
      "Customer has shown strong intent and requested a callback. Contact within the next 30 minutes.",
    callAt: now - 12 * MIN,
    callDurationSec: 268,
    callId: "VA-88210",
  };

  return { leads, activities };
}
