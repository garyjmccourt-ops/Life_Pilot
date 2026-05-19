// TODO: Auth is disabled for the current development phase.
// When Clerk (or another auth provider) is reintroduced, restore
// useUser / useClerk hooks and the sign-out button here.

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Wallet,
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  CalendarDays,
  Bike,
  ShoppingCart,
  PieChart,
  GitBranch,
  Settings2,
  BookOpen,
  Menu,
  X,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { label: string | null; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Money Life",
    items: [
      { href: "/income-bills", label: "Money In & Out", icon: Wallet },
      { href: "/weekly",       label: "Weekly Tracker",  icon: CalendarDays },
      { href: "/scenarios",    label: "Scenarios",        icon: GitBranch },
      { href: "/bnpl",         label: "Credit & Cards",   icon: CreditCard },
    ],
  },
  {
    label: "Work Life",
    items: [
      { href: "/gig-work", label: "Gig Work", icon: Bike },
    ],
  },
  {
    label: "Home Life",
    items: [
      { href: "/family-budget", label: "Family Budget", icon: PieChart },
      { href: "/shopping",      label: "Shopping",       icon: ShoppingCart },
    ],
  },
  {
    label: "Support Life",
    items: [
      { href: "/arrears", label: "Arrears",        icon: AlertTriangle },
      { href: "/tasks",   label: "Tasks",           icon: CheckSquare },
      { href: "/comms",   label: "Communications", icon: MessageSquare },
    ],
  },
  {
    label: null,
    items: [
      { href: "/settings", label: "Settings",  icon: Settings2 },
      { href: "/docs",     label: "Help & Docs", icon: BookOpen },
    ],
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar z-50 sticky top-0">
        <div className="font-serif font-bold text-sidebar-primary text-sm">Life Pilot</div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 md:top-0 left-0 h-[calc(100dvh-3.5rem)] md:h-[100dvh] w-64 bg-sidebar border-r border-sidebar-border z-40
        transform transition-transform duration-200 ease-in-out flex flex-col
        ${mobileMenuOpen ? "translate-x-0 mt-14" : "-translate-x-full md:translate-x-0 md:mt-0"}
      `}>
        <div className="hidden md:flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-7 h-7 flex-shrink-0" />
          <div className="leading-tight">
            <div className="font-serif font-bold text-base text-sidebar-primary tracking-tight">Life Pilot</div>
            <div className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wide uppercase">Your life, your plan</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    (item.href === "/dashboard" && (location === "/" || location === "/dashboard")) ||
                    (item.href !== "/dashboard" && location.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="block">
                      <div className={`
                        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      `}>
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Household label footer */}
        <div className="border-t border-sidebar-border px-4 py-3">
          <span className="lp-four-dash mb-1.5">— — — —</span>
          <div className="text-xs font-medium text-sidebar-foreground">Life Pilot</div>
          <div className="text-xs text-sidebar-foreground/60">Your life, your plan</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
