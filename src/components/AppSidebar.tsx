import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Upload, Activity, GitCompareArrows, Layers, Gauge,
  LifeBuoy, FileText, ShieldCheck, Radar,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { canAccess, ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

const NAV = [
  { group: "Operations", items: [
    { title: "Command Center", url: "/dashboard",  icon: LayoutDashboard },
    { title: "Image Upload",   url: "/upload",     icon: Upload },
    { title: "Processing",     url: "/processing", icon: Activity },
  ]},
  { group: "Analysis", items: [
    { title: "Comparison",     url: "/comparison", icon: GitCompareArrows },
    { title: "Damage View",    url: "/damage",     icon: Layers },
    { title: "Severity",       url: "/severity",   icon: Gauge },
  ]},
  { group: "Response", items: [
    { title: "Relief Planning",url: "/relief",     icon: LifeBuoy },
    { title: "Reports",        url: "/reports",    icon: FileText },
  ]},
  { group: "System", items: [
    { title: "Admin",          url: "/admin",      icon: ShieldCheck },
  ]},
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn("flex items-center gap-2.5 px-2 py-2", collapsed && "justify-center px-0")}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
            <Radar className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive pulse-critical" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold tracking-tight">SENTINEL</span>
              <span className="font-mono text-[10px] text-muted-foreground">Disaster Analysis v1.2</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map(section => {
          const visible = section.items.filter(i => canAccess(i.url, user?.role));
          if (!visible.length) return null;
          return (
            <SidebarGroup key={section.group}>
              {!collapsed && <SidebarGroupLabel className="font-mono text-[10px] tracking-widest text-muted-foreground/70">{section.group.toUpperCase()}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visible.map(item => {
                    const active = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <NavLink
                            to={item.url}
                            className={cn(
                              "group relative transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                            )}
                          >
                            {active && <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 w-0.5 rounded-r bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
                            <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className={cn("flex items-center gap-2 px-2 py-2", collapsed && "justify-center px-0")}>
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: user?.avatarColor, color: "hsl(222 40% 6%)" }}>
            {user?.name?.[0] ?? "?"}
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="truncate text-xs font-medium">{user?.name}</span>
              <span className="truncate font-mono text-[10px] text-muted-foreground">{user ? ROLE_LABELS[user.role] : ""}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
