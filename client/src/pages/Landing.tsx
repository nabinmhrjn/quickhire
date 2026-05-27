import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";
import { Zap, MapPin, Star, Shield, Clock, Wrench, Plug, Droplets, Trees, Paintbrush } from "lucide-react";

const TRADES = [
  { icon: Plug, label: "Electrical" },
  { icon: Droplets, label: "Plumbing" },
  { icon: Wrench, label: "Carpentry" },
  { icon: Paintbrush, label: "Painting" },
  { icon: Trees, label: "Landscaping" },
  { icon: Wrench, label: "HVAC" },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Location-aware matching",
    desc: "Post a job and nearby workers are instantly notified. No cold calls, no guessing.",
  },
  {
    icon: Zap,
    title: "Real-time notifications",
    desc: "Workers get alerts within seconds. Clients see applications live as they arrive.",
  },
  {
    icon: Star,
    title: "Verified reviews",
    desc: "Reviews are only allowed after job completion — so every rating is earned.",
  },
  {
    icon: Shield,
    title: "One account, two roles",
    desc: "Post jobs as a client or find work as a worker. Switch instantly without re-logging in.",
  },
];

export default function Landing() {
  const { user, activeRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(activeRole === "WORKER" ? "/worker" : "/client", { replace: true });
    }
  }, [user, loading, activeRole, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-lg font-bold text-foreground">QuickHire</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className={cn(buttonVariants({ variant: "ghost" }))}>Sign in</Link>
            <Link to="/register" className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-700")}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="bg-linear-to-br from-emerald-50 via-background to-muted dark:from-emerald-950/40 dark:via-background dark:to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
            <Clock className="h-3 w-3 mr-1" /> On-demand · Local · Trusted
          </Badge>
          <h1 className="text-5xl font-bold text-foreground leading-tight">
            Get skilled help{" "}
            <span className="text-emerald-600 dark:text-emerald-400">near you</span>, fast
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            QuickHire connects homeowners with nearby electricians, plumbers, carpenters, and more —
            for household repairs and micro-jobs done right.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/register" className={cn(buttonVariants({ size: "lg" }), "bg-emerald-600 hover:bg-emerald-700 text-base")}>
              Post a Job — It&apos;s Free
            </Link>
            <Link to="/register" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-base")}>
              Find Work Near You
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">All trades, one platform</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {TRADES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:border-emerald-700 transition-colors">
                <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">Why QuickHire?</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-xl border p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-card-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-emerald-600 dark:bg-emerald-800 text-white text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="text-emerald-100">Join QuickHire today — post jobs in minutes or start finding work near you.</p>
          <Link to="/register" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "mt-2")}>
            Create your free account
          </Link>
        </div>
      </section>

      <footer className="py-8 px-4 border-t bg-background text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} QuickHire. Built with React, Express & MongoDB.</p>
      </footer>
    </div>
  );
}
