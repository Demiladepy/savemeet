
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Activity, 
  Settings, 
  Home, 
  Video, 
  Mic, 
  ListTodo 
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "Meeting",
    href: "/meeting",
    icon: Video,
  },
  {
    label: "Voice Registration",
    href: "/voice-registration",
    icon: Mic,
  },
  {
    label: "History",
    href: "/history",
    icon: ListTodo,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="py-4 px-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-meeting-primary" />
            <h1 className="text-xl font-bold text-sidebar-foreground">AI Meeting Assistant</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-sidebar-foreground p-1 rounded-full hover:bg-sidebar-accent"
          >
            <span className="sr-only">Close sidebar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium">UA</span>
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">User</p>
                <p className="text-xs text-sidebar-foreground/60">user@example.com</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "pl-72" : "pl-0"
      )}>
        {/* Sidebar toggle */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={cn(
            "fixed top-4 left-4 z-40 p-2 rounded-md bg-primary text-primary-foreground shadow-md",
            isSidebarOpen ? "hidden" : "block"
          )}
        >
          <span className="sr-only">Open sidebar</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" x2="21" y1="6" y2="6"/>
            <line x1="3" x2="21" y1="12" y2="12"/>
            <line x1="3" x2="21" y1="18" y2="18"/>
          </svg>
        </button>
        
        <div className="container mx-auto py-6 px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
