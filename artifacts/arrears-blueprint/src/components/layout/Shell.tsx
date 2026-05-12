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
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useClerk } from "@clerk/react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income-bills", label: "Income & Bills", icon: Wallet },
  { href: "/gig-work", label: "Gig Work", icon: Bike },
  { href: "/family-budget", label: "Family Budget", icon: PieChart },
  { href: "/arrears", label: "Arrears", icon: AlertTriangle },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/comms", label: "Comms Log", icon: MessageSquare },
  { href: "/weekly", label: "Weekly Tracker", icon: CalendarDays },
  { href: "/scenarios", label: "Scenarios", icon: GitBranch },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar z-50 sticky top-0">
        <div className="font-serif font-bold text-sidebar-primary text-sm">HH Master</div>
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
            <div className="font-serif font-bold text-base text-sidebar-primary tracking-tight">MYOH</div>
            <div className="text-[10px] text-sidebar-foreground/50 font-medium tracking-wide uppercase">Manage Your Own Household</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
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
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-sidebar-foreground truncate">
              {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "User"}
            </div>
            <div className="text-xs text-sidebar-foreground/60 truncate">
              {user?.emailAddresses?.[0]?.emailAddress}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => signOut()}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
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
