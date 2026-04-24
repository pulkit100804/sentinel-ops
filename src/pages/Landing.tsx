import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radar, ShieldCheck, Activity, Map, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, Role } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import heroImg from "@/assets/hero-command.jpg";

const ROLES: Role[] = ["admin", "analyst", "responder"];

export default function Landing() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("analyst@sentinel.io");
  const [password, setPassword] = useState("demo");
  const [role, setRole] = useState<Role>("analyst");
  const [submitting, setSubmitting] = useState(false);

  if (user) navigate("/dashboard");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password, role);
      toast({ title: `Welcome, ${ROLE_LABELS[role]}`, description: "Secure channel established." });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: "Login failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background grid + glow */}
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div className="absolute inset-0 bg-gradient-glow" aria-hidden />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
            <Radar className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive pulse-critical" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight">SENTINEL</div>
            <div className="font-mono text-[10px] text-muted-foreground">Disaster Analysis v1.2</div>
          </div>
        </div>
        <div className="hidden items-center gap-4 font-mono text-[10px] tracking-widest text-muted-foreground md:flex">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> MODEL ONLINE</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> 14 REGIONS</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-critical" /> 3 ACTIVE ALERTS</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-6 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pt-12">
        {/* Hero copy */}
        <section className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-surface-2 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> AI-powered response intelligence
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            From satellite pixels to <span className="text-gradient-primary">decisive action</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Sentinel fuses computer-vision damage segmentation, severity analytics, and relief planning into a
            single mission-control dashboard — purpose-built for disaster response teams.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { icon: Activity, label: "Real-time inference",  sub: "PyTorch · CUDA" },
              { icon: Map,      label: "Geo-tagged regions",    sub: "14 layers" },
              { icon: ShieldCheck, label: "Role-based access",  sub: "3 tiers" },
            ].map(f => (
              <div key={f.label} className="glass-panel p-3">
                <f.icon className="h-4 w-4 text-primary" />
                <div className="mt-2 text-xs font-medium">{f.label}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{f.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 relative overflow-hidden rounded-xl border border-border/60 shadow-card">
            <img src={heroImg} alt="Mission control disaster visualization" className="h-56 w-full object-cover opacity-80" width={1536} height={1024} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 font-mono text-[10px] tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-critical" />
              LIVE · COASTAL SECTOR A · SEVERITY 92
            </div>
          </div>
        </section>

        {/* Login */}
        <section className="flex items-center">
          <form onSubmit={onSubmit} className="glass-panel w-full p-7 shadow-elegant">
            <div className="flex items-center gap-2 text-primary">
              <Lock className="h-4 w-4" />
              <span className="font-mono text-[10px] tracking-widest">SECURE ACCESS</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold">Sign in to Sentinel</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select your operational role to continue.</p>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-surface-2 border-border/60" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-surface-2 border-border/60" />
              </div>
              <div className="grid gap-2">
                <Label>Operational role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "rounded-lg border p-2.5 text-left transition-all",
                        role === r
                          ? "border-primary bg-primary/10 shadow-elegant"
                          : "border-border/60 bg-surface-2 hover:border-border"
                      )}
                    >
                      <div className="text-xs font-medium">{ROLE_LABELS[r]}</div>
                      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{r}</div>
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </div>

              <Button type="submit" disabled={submitting} className="mt-2 h-11 bg-gradient-primary font-medium shadow-elegant hover:opacity-95">
                {submitting ? "Establishing channel…" : (<>Enter Command Center <ArrowRight className="ml-1 h-4 w-4" /></>)}
              </Button>
              <p className="text-center font-mono text-[10px] text-muted-foreground">DEMO · any email/password works</p>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
