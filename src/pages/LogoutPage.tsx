import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Radar } from "lucide-react";

export default function LogoutPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    logout().then(() => {
      toast({ title: "Session ended", description: "Secure channel terminated." });
      navigate("/");
    });
  }, [logout, navigate]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
        <Radar className="h-6 w-6 text-primary-foreground animate-pulse" />
      </div>
      <p className="font-mono text-xs tracking-widest text-muted-foreground">TERMINATING SESSION…</p>
    </div>
  );
}
