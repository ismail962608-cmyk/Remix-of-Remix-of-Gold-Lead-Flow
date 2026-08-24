import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useGoldFlow } from "@/lib/goldflow/store";
import { PageHeader } from "@/components/goldflow/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/lead-rules")({
  head: () => ({
    meta: [
      { title: "Lead Rules — LeadIQ Admin" },
      { name: "description", content: "Configure hot and warm score thresholds, auto-assignment, follow-up requirement and mandatory next action." },
      { property: "og:title", content: "Lead Rules — LeadIQ Admin" },
      { property: "og:description", content: "Control how leads are scored, assigned and kept moving." },
    ],
  }),
  component: LeadRules,
});

function LeadRules() {
  const { rules, setRules } = useGoldFlow();
  const [draft, setDraft] = useState(rules);

  return (
    <div>
      <PageHeader
        title="Lead Rules"
        subtitle="Scoring thresholds and the sticky lead rule that guarantees no lead is left behind"
        actions={
          <Button size="sm" onClick={() => { setRules(draft); toast.success("Lead rules saved"); }}>Save rules</Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-xs font-bold tracking-widest uppercase">Score thresholds</h2>
          <div>
            <Label className="mb-1 block text-xs">Hot score threshold ({draft.hotThreshold}+)</Label>
            <Input
              type="number"
              value={draft.hotThreshold}
              onChange={(e) => setDraft({ ...draft, hotThreshold: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Warm score threshold ({draft.warmThreshold}+)</Label>
            <Input
              type="number"
              value={draft.warmThreshold}
              onChange={(e) => setDraft({ ...draft, warmThreshold: Number(e.target.value) })}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Anything below the warm threshold is treated as a Cold lead.</p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-xs font-bold tracking-widest uppercase">Lead discipline</h2>
          {([
            ["autoAssign", "Auto-assign new leads to a branch executive"],
            ["followUpMandatory", "Require a follow-up on every active lead"],
            ["nextActionMandatory", "Require a next action when completing an action"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={draft[key] as boolean}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                className="mt-0.5"
              />
              {label}
            </label>
          ))}
          <div className="rounded-md border border-gold/40 bg-accent/40 p-3 text-[11px]">
            <span className="font-bold">Sticky lead rule:</span> every active lead must always have Owner, Stage, Next Action, Due Time and eventually an Outcome. Missing fields are flagged on the lead and in Action Required.
          </div>
        </div>
      </div>
    </div>
  );
}
