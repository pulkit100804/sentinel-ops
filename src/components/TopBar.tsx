import { Bell, LogOut, Search, Circle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/lib/roles";

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast({ title: "Session terminated", description: "You have been securely signed out." });
    navigate("/");
  };

  const now = new Date();
  const ts = now.toUTCString().split(" ").slice(4, 5)[0] + " UTC";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl sm:px-5">
      <SidebarTrigger />
      <div className="hidden items-center gap-2 md:flex">
        <Circle className="h-2 w-2 fill-primary text-primary" />
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">SYSTEM OPERATIONAL · {ts}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search regions, incidents, reports…" className="h-9 w-64 border-border/60 bg-surface-2 pl-8 text-sm" />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
        <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
          <span className="text-xs font-medium">{user?.name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{user ? ROLE_LABELS[user.role] : ""}</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-border/60">
          <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">End Session</span>
        </Button>
      </div>
    </header>
  );
}
