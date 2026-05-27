import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function RoleSwitcher() {
  const { activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();

  function handleSwitch(newRole: "CLIENT" | "WORKER") {
    if (newRole === activeRole) return;
    setActiveRole(newRole);
    navigate(newRole === "WORKER" ? "/worker" : "/client");
  }

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        size="sm"
        variant={activeRole === "CLIENT" ? "default" : "ghost"}
        className="h-7 text-xs px-3"
        onClick={() => handleSwitch("CLIENT")}
      >
        Client
      </Button>
      <Button
        size="sm"
        variant={activeRole === "WORKER" ? "default" : "ghost"}
        className="h-7 text-xs px-3"
        onClick={() => handleSwitch("WORKER")}
      >
        Worker
      </Button>
    </div>
  );
}
