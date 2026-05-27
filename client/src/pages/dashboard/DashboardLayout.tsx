import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

export default function DashboardLayout() {
  const { user, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeRole={activeRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-background border-b flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <RoleSwitcher />
            <ThemeToggle />
            <NotificationBell />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl ?? ""} alt={user.name} />
                <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                  {user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden md:block">{user.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
