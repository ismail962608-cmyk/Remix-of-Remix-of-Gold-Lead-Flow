import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGoldFlow } from "@/lib/goldflow/store";
import { DEFAULT_RULES } from "@/lib/goldflow/types";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Pill } from "@/components/goldflow/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LeadIQ Admin" },
      {
        name: "description",
        content:
          "Organisation profile, working hours, notification channels and demo controls for the LeadIQ lead closure engine.",
      },
      { property: "og:title", content: "Settings — LeadIQ Admin" },
      { property: "og:description", content: "General preferences for LeadIQ — no lead left behind." },
    ],
  }),
  component: SettingsPage,
});

const STORAGE_KEY = "goldflow.settings";

type Settings = {
  orgName: string;
  workStart: string;
  workEnd: string;
  notifyInApp: boolean;
  notifyWhatsApp: boolean;
  notifyEmail: boolean;
  escalationDigest: boolean;
};

const DEFAULTS: Settings = {
  orgName: "Manappuram Gold",
  workStart: "09:30",
  workEnd: "18:30",
  notifyInApp: true,
  notifyWhatsApp: true,
  notifyEmail: false,
  escalationDigest: true,
};

function SettingsPage() {
  const { currentUser, users, rules, setRules, escalations } = useGoldFlow();
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setS({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      /* ignore */
    }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    toast.success("Settings saved");
  };

  const toggles: [keyof Settings, string, string][] = [
    ["notifyInApp", "In-app notifications", "Bell alerts for SLA breaches and new escalations"],
    ["notifyWhatsApp", "WhatsApp alerts", "Push overdue leads to the owning executive on WhatsApp"],
    ["notifyEmail", "Email alerts", "Daily email to managers with unclosed leads"],
    ["escalationDigest", "Escalation digest", "Evening digest of every open escalation by branch"],
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="General preferences — scoring and SLA thresholds live in Lead Rules and SLA & Escalation Rules"
        actions={
          <Button size="sm" onClick={save}>
            Save settings
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-xs font-bold tracking-widest uppercase">Organisation</h2>
          <div>
            <Label className="mb-1 block text-xs">Organisation name</Label>
            <Input value={s.orgName} onChange={(e) => setS({ ...s, orgName: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Working hours start</Label>
              <Input type="time" value={s.workStart} onChange={(e) => setS({ ...s, workStart: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Working hours end</Label>
              <Input type="time" value={s.workEnd} onChange={(e) => setS({ ...s, workEnd: e.target.value })} />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            SLA clocks and follow-up reminders are presented against these working hours.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-xs font-bold tracking-widest uppercase">Notifications</h2>
          {toggles.map(([key, label, hint]) => (
            <label key={key} className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={s[key] as boolean}
                onChange={(e) => setS({ ...s, [key]: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold">{label}</span>
                <br />
                <span className="text-[11px] text-muted-foreground">{hint}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-xs font-bold tracking-widest uppercase">Environment</h2>
          <Row label="Signed in as" value={`${currentUser.name} · ${currentUser.role}`} />
          <Row label="Users in hierarchy" value={String(users.length)} />
          <Row label="Open escalations" value={String(escalations.filter((e) => e.status === "Open").length)} />
          <Row label="Hot / Warm thresholds" value={`${rules.hotThreshold}+ / ${rules.warmThreshold}+`} />
          <div className="pt-1">
            <Pill tone="gold">NO LEAD LEFT BEHIND</Pill>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-xs font-bold tracking-widest uppercase">Reset</h2>
          <p className="text-[11px] text-muted-foreground">
            Restore LeadIQ to its shipped configuration. Demo lead data is unaffected.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRules(DEFAULT_RULES);
                toast.success("Lead and SLA rules restored to defaults");
              }}
            >
              Restore default rules
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setS(DEFAULTS);
                localStorage.removeItem(STORAGE_KEY);
                toast.success("Settings restored to defaults");
              }}
            >
              Restore default settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
