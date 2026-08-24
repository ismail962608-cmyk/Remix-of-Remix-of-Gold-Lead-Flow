import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, Timer, Sparkles, ArrowRight, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadIQ — Lead Closure & Escalation Engine" },
      {
        name: "description",
        content:
          "LeadIQ turns voice analytics signals into closed gold loan business with SLA timers, escalation rules and role-based lead ownership.",
      },
      { property: "og:title", content: "LeadIQ — Lead Closure & Escalation Engine" },
      {
        property: "og:description",
        content: "No lead left behind: SLA-driven lead closure, escalations and performance intelligence.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Sparkles,
    title: "Voice Analytics Intelligence",
    body: "Every lead arrives with intent, buying signals, objections and a recommended next best action.",
  },
  {
    icon: Timer,
    title: "SLA Clocks On Every Lead",
    body: "Hot leads in 15 minutes, warm in 2 hours. Timers run from the moment the lead is created.",
  },
  {
    icon: ShieldAlert,
    title: "Automatic Escalation",
    body: "Untouched or overdue leads escalate up the branch, area and zonal chain until they are closed.",
  },
  {
    icon: BarChart3,
    title: "Closure Performance",
    body: "Branch and executive scorecards, closure reports and live revenue at risk.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gold text-sm font-black text-gold-foreground">
            L
          </div>
          <span className="text-base font-bold tracking-tight text-white">LeadIQ</span>
        </div>
        <Link
          to="/login"
          className="rounded-md bg-gold px-4 py-2 text-xs font-bold text-gold-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="py-14 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-border px-3 py-1 text-[10px] font-bold tracking-widest text-gold uppercase">
            No lead left behind
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.1] font-extrabold tracking-tight text-white lg:text-6xl">
            The lead closure &amp; escalation engine for gold loan teams.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-sidebar-foreground/70 lg:text-base">
            LeadIQ picks up every high-intent conversation from voice analytics, assigns a single accountable owner,
            starts an SLA clock and escalates automatically until the lead is converted or formally closed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-gold-foreground transition-opacity hover:opacity-90"
            >
              Enter the demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-md border border-sidebar-border px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sidebar-accent"
            >
              View dashboard
            </Link>
          </div>
          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4">
            {[
              ["15 min", "Hot lead SLA"],
              ["3 levels", "Escalation chain"],
              ["100%", "Leads with an owner"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-4 py-3">
                <dt className="num text-xl font-extrabold text-gold">{v}</dt>
                <dd className="mt-0.5 text-[11px] text-sidebar-foreground/60">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-5">
              <f.icon className="h-5 w-5 text-gold" />
              <h2 className="mt-3 text-sm font-bold text-white">{f.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-sidebar-foreground/70">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-sidebar-border px-6 py-6 text-center text-[11px] text-sidebar-foreground/50">
        LeadIQ · Demo environment with fictional data
      </footer>
    </div>
  );
}
