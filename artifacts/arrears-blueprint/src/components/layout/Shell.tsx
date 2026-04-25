import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Wallet, 
  AlertTriangle, 
  CheckSquare, 
  MessageSquare, 
  CalendarDays,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income-bills", label: "Income & Bills", icon: Wallet },
  { href: "/arrears", label: "Arrears", icon: AlertTriangle },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/comms", label: "Comms Log", icon: MessageSquare },
  { href: "/weekly", label: "Weekly Tracker", icon: CalendarDays },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on navigate
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar z-50 sticky top-0">
        <div className="font-serif font-bold text-sidebar-primary">A&B Manager</div>
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
        <div className="hidden md:flex items-center px-6 h-16 border-b border-sidebar-border">
          <div className="font-serif font-bold text-lg text-sidebar-primary tracking-tight">Arrears & Budget</div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
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
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
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
