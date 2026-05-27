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

  const targetRole = activeRole === "CLIENT" ? "WORKER" : "CLIENT";

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-xs px-3"
      onClick={() => handleSwitch(targetRole)}
    >
      Switch to {targetRole === "CLIENT" ? "Client" : "Worker"}
    </Button>
  );
}
