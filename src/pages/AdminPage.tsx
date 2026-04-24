import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import type { User } from "@/lib/roles";
import { ROLE_LABELS } from "@/lib/roles";
import { ShieldCheck, Cpu, HardDrive, Activity, Plus, Search } from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.adminUsers().then(setUsers);
    api.adminSettings().then(setSettings);
  }, []);

  const filtered = users.filter(u => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SYSTEM · ADMIN"
        title="Admin & Settings"
        description="Manage users, roles, model configuration and system health."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Cpu,       k: "Model",     v: settings?.model?.version ?? "—",     sub: settings?.model?.path ?? "",   ok: settings?.model?.loaded },
          { icon: Activity,  k: "API",       v: `${settings?.api?.latency_ms ?? "—"}ms`, sub: settings?.api?.base_url ?? "", ok: settings?.api?.healthy },
          { icon: HardDrive, k: "Storage",   v: `${settings?.storage?.used_gb ?? 0}/${settings?.storage?.quota_gb ?? 0} GB`, sub: settings?.storage?.driver ?? "", ok: true },
        ].map(s => (
          <div key={s.k} className="glass-panel p-5">
            <div className="flex items-center justify-between">
              <s.icon className="h-4 w-4 text-primary" />
              <span className={"flex items-center gap-1.5 font-mono text-[10px] " + (s.ok ? "text-primary" : "text-destructive")}>
                <span className={"h-1.5 w-1.5 rounded-full " + (s.ok ? "bg-primary" : "bg-destructive")} /> {s.ok ? "HEALTHY" : "DOWN"}
              </span>
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.k}</div>
            <div className="mt-1 font-display text-xl font-semibold">{s.v}</div>
            <div className="truncate font-mono text-[10px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold">Users & Roles</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Manage operational access</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="h-9 w-56 bg-surface-2 pl-8" />
            </div>
            <Button size="sm" className="bg-gradient-primary"><Plus className="mr-1 h-4 w-4" />Invite User</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-4">User</th><th className="pr-4">Email</th><th className="pr-4">Role</th><th className="pr-4">Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border/30 transition-colors hover:bg-surface-2/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold" style={{ background: u.avatarColor, color: "hsl(222 40% 6%)" }}>
                        {u.name[0]}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="pr-4 font-mono text-xs text-muted-foreground">{u.email}</td>
                  <td className="pr-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                      <ShieldCheck className="h-3 w-3" /> {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="pr-4 font-mono text-[11px] text-primary">● Active</td>
                  <td className="pr-4 text-right"><Button size="sm" variant="ghost">Manage</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Model Configuration</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">PyTorch .pth integration</p>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ["Weights path", settings?.model?.path],
              ["Version", settings?.model?.version],
              ["Device", settings?.model?.device],
              ["Status", settings?.model?.loaded ? "Loaded" : "Not loaded"],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono text-xs">{String(v ?? "—")}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass-panel p-5">
          <h3 className="font-display text-base font-semibold">Feature Flags</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">System toggles</p>
          <div className="mt-4 space-y-3">
            {Object.entries(settings?.features ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-2/60 p-3 text-sm">
                <span className="capitalize">{k.replace(/_/g, " ")}</span>
                <span className={"font-mono text-[11px] " + (v ? "text-primary" : "text-muted-foreground")}>{v ? "ENABLED" : "DISABLED"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
