import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGoldFlow } from "@/lib/goldflow/store";
import type { Role } from "@/lib/goldflow/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ROLES: Role[] = ["Super Admin", "Zonal Manager", "Area Manager", "Branch Manager", "Sales Executive"];

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — LeadIQ" },
      { name: "description", content: "Sign in to LeadIQ and pick a role to explore the lead closure and escalation workspace." },
      { property: "og:title", content: "Sign in — LeadIQ" },
      { property: "og:description", content: "Demo sign in with role selection for the LeadIQ lead closure engine." },
    ],
  }),
  component: Login,
});

function Login() {
  const { users, setCurrentUser } = useGoldFlow();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@leadiq.app");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<Role>("Sales Executive");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const user = users.find((u) => u.role === role);
    if (user) setCurrentUser(user);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-sidebar lg:flex-row">
      <div className="hidden flex-1 flex-col justify-between p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gold text-sm font-black text-gold-foreground">L</div>
          <span className="text-base font-bold tracking-tight text-white">LeadIQ</span>
        </Link>
        <div>
          <p className="text-[10px] font-bold tracking-widest text-gold uppercase">No lead left behind</p>
          <h2 className="mt-3 max-w-md text-3xl leading-tight font-extrabold text-white">
            Every lead owned, timed and escalated until it closes.
          </h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/60">
            Sign in with any credentials and choose a role — the workspace adapts its navigation and data visibility to
            that role.
          </p>
        </div>
        <p className="text-[11px] text-sidebar-foreground/40">Demo environment · fictional data</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-5 py-12">
        <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-gold text-xs font-black text-gold-foreground">L</div>
            <span className="text-sm font-bold">LeadIQ</span>
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight lg:mt-0">Sign in</h1>
          <p className="mt-1 text-xs text-muted-foreground">Demo authentication — any email and password works.</p>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Signing in as{" "}
                <span className="font-semibold text-foreground">
                  {users.find((u) => u.role === role)?.name ?? role}
                </span>
              </p>
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full">Sign in to dashboard</Button>
          <Link to="/" className="mt-3 block text-center text-[11px] text-muted-foreground hover:text-foreground">
            Back to home
          </Link>
        </form>
      </div>
    </div>
  );
}
