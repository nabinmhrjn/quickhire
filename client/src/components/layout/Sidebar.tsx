import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase, LayoutDashboard, ClipboardList, MapPin, Star, User, LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const clientLinks = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/jobs", label: "My Jobs", icon: Briefcase },
  { href: "/client/jobs/new", label: "Post a Job", icon: MapPin },
];

const workerLinks = [
  { href: "/worker", label: "Dashboard", icon: LayoutDashboard },
  { href: "/worker/jobs", label: "Browse Jobs", icon: MapPin },
  { href: "/worker/applications", label: "My Applications", icon: ClipboardList },
];

const sharedLinks = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/notifications", label: "Notifications", icon: Star },
];

export function Sidebar({ activeRole }: { activeRole: "CLIENT" | "WORKER" }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const links = activeRole === "CLIENT" ? clientLinks : workerLinks;

  return (
    <aside className="w-60 shrink-0 border-r bg-sidebar flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">Q</span>
        </div>
        <span className="text-lg font-bold text-sidebar-foreground">QuickHire</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/client" && href !== "/worker" && pathname.startsWith(href))
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t">
          {sharedLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-3 py-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-red-600"
          onClick={async () => { await logout(); navigate("/"); }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
